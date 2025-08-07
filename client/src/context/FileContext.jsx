import { SocketEvent } from "@/types/socket"
import {
    findParentDirectory,
    getFileById, // <--- This is imported from utils/file
    initialFileStructure,
} from "@/utils/file"
import { saveAs } from "file-saver"
import JSZip from "jszip"
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react"
import { toast } from "react-hot-toast"
import { v4 as uuidv4 } from "uuid"
import { useAppContext } from "./AppContext"
import { useSocket } from "./SocketContext"

const FileContext = createContext(null)

export const useFileSystem = () => {
    const context = useContext(FileContext)
    if (!context) {
        throw new Error("useFileSystem must be used within FileContextProvider")
    }
    return context
}

function FileContextProvider({ children }) {
    const { socket } = useSocket()
    const { setUsers, drawingData } = useAppContext()

    const [fileStructure, setFileStructure] =
        useState(initialFileStructure)
    // Initialize openFiles based on the initialFileStructure's children, ensuring it's an array
    const [openFiles, setOpenFiles] =
        useState(initialFileStructure.children ? [...initialFileStructure.children] : [])
    const [activeFile, setActiveFile] = useState(
        openFiles[0],
    )

    // Function to toggle the isOpen property of a directory (Directory Open/Close)
    const toggleDirectory = (dirId) => {
        const toggleDir = (directory) => {
            if (directory.id === dirId) {
                return {
                    ...directory,
                    isOpen: !directory.isOpen,
                }
            } else if (directory.children) {
                return {
                    ...directory,
                    children: directory.children.map(toggleDir),
                }
            } else {
                return directory
            }
        }

        // Update fileStructure with the opened directory
        setFileStructure((prevFileStructure) => toggleDir(prevFileStructure))
    }

    const collapseDirectories = () => {
        const collapseDir = (directory) => {
            return {
                ...directory,
                isOpen: false,
                children: directory.children?.map(collapseDir),
            }
        }

        setFileStructure((prevFileStructure) => collapseDir(prevFileStructure))
    }

const createDirectory = useCallback(
  (
    parentDirId,
    newDir,
    sendToSocket = true,
    isRemote = false,
  ) => {
    let newDirectory;
    let finalParentDirId = parentDirId || fileStructure.id;

    if (!finalParentDirId) return;

    if (typeof newDir === "string") {
      let name = newDir;
      let num = 1;

      const parentDir = findParentDirectory(fileStructure, finalParentDirId);
      if (!parentDir) throw new Error("Parent directory not found");

      if (!isRemote) {
        let dirExists = parentDir.children?.some(
          (item) => item.type === "directory" && item.name === name
        );
        while (dirExists) {
          name = `${newDir}(${num})`;
          dirExists = parentDir.children?.some(
            (item) => item.type === "directory" && item.name === name
          );
          num++;
        }
      }

      newDirectory = {
        id: uuidv4(),
        name,
        type: "directory",
        children: [],
        isOpen: true,
      };
    } else {
      newDirectory = { ...newDir, isOpen: true };
    }

    if (sendToSocket) {
      // ✅ Emit to socket only, skip local update (prevent duplicate)
      socket.emit(SocketEvent.DIRECTORY_CREATED, {
        parentDirId: finalParentDirId,
        newDirectory,
      });
      return newDirectory.id;
    }

    // ✅ Local state update ONLY (socket handles this when isRemote=true)
    const addToParent = (dir) => {
      if (dir.id === finalParentDirId) {
        return {
          ...dir,
          isOpen: true,
          children: [...(dir.children || []), newDirectory],
        };
      }

      if (dir.children) {
        return {
          ...dir,
          children: dir.children.map(addToParent),
        };
      }

      return dir;
    };

    setFileStructure((prev) => addToParent(prev));
    return newDirectory.id;
  },
  [fileStructure, socket]
);
    const updateDirectory = useCallback(
        (
            dirId,
            children,
            sendToSocket = true,
        ) => {
            if (!dirId) dirId = fileStructure.id

            const updateChildren = (
                directory,
            ) => {
                if (directory.id === dirId) {
                    return {
                        ...directory,
                        children,
                    }
                } else if (directory.children) {
                    return {
                        ...directory,
                        children: directory.children.map(updateChildren),
                    }
                } else {
                    return directory
                }
            }

            setFileStructure((prevFileStructure) =>
                updateChildren(prevFileStructure),
            )

            // Close all open files in the directory being updated
            setOpenFiles([])

            // Set the active file to null if it's in the directory being updated
            setActiveFile(null)

            if (dirId === fileStructure.id) {
                toast.dismiss()
                toast.success("Files and folders updated")
            }

            if (!sendToSocket) return
            socket.emit(SocketEvent.DIRECTORY_UPDATED, {
                dirId,
                children,
            })
        },
        [fileStructure.id, socket],
    )

    const renameDirectory = useCallback(
        (
            dirId,
            newDirName,
            sendToSocket = true,
        ) => {
            const renameInDirectory = (
                directory,
            ) => {
                if (directory.type === "directory" && directory.children) {
                    // Check if a directory with the new name already exists
                    const isNameTaken = directory.children.some(
                        (item) =>
                            item.type === "directory" &&
                            item.name === newDirName &&
                            item.id !== dirId,
                    )

                    if (isNameTaken) {
                        return null // Name is already taken
                    }

                    return {
                        ...directory,
                        children: directory.children.map((item) => {
                            if (item.id === dirId) {
                                return {
                                    ...item,
                                    name: newDirName,
                                }
                            } else if (item.type === "directory") {
                                // Recursively update nested directories
                                const updatedNestedDir = renameInDirectory(item)
                                return updatedNestedDir !== null
                                    ? updatedNestedDir
                                    : item
                            } else {
                                return item
                            }
                        }),
                    }
                } else {
                    return directory
                }
            }

            const updatedFileStructure = renameInDirectory(fileStructure)

            if (updatedFileStructure === null) {
                return false
            }

            setFileStructure(updatedFileStructure)

            if (!sendToSocket) return true
            socket.emit(SocketEvent.DIRECTORY_RENAMED, {
                dirId,
                newDirName,
            })

            return true
        },
        [socket, setFileStructure, fileStructure],
    )

    const deleteDirectory = useCallback(
        (dirId, sendToSocket = true) => {
            const deleteFromDirectory = (
                directory,
            ) => {
                if (directory.type === "directory" && directory.id === dirId) {
                    // If the current directory matches the one to delete, return null (remove it)
                    return null
                } else if (directory.children) {
                    // If it's not the directory to delete, recursively update children
                    const updatedChildren = directory.children
                        .map(deleteFromDirectory)
                        .filter((item) => item !== null)
                    return {
                        ...directory,
                        children: updatedChildren,
                    }
                } else {
                    // Return the directory as is if it has no children
                    return directory
                }
            }

            setFileStructure(
                (prevFileStructure) => deleteFromDirectory(prevFileStructure),
            )

            if (!sendToSocket) return
            socket.emit(SocketEvent.DIRECTORY_DELETED, { dirId })
        },
        [socket],
    )

    const openFile = (fileId) => {
        const file = getFileById(fileStructure, fileId)

        if (file) {
            updateFileContent(activeFile?.id || "", activeFile?.content || "") // Save the content of the previously active file

            // Add the file to openFiles if it's not already open
            if (!openFiles.some((file) => file.id === fileId)) {
                setOpenFiles((prevOpenFiles) => [...prevOpenFiles, file])
            }

            // Update content in openFiles
            setOpenFiles((prevOpenFiles) =>
                prevOpenFiles.map((file) => {
                    if (file.id === activeFile?.id) {
                        return {
                            ...file,
                            content: activeFile.content || "",
                        }
                    } else {
                        return file
                    }
                }),
            )

            setActiveFile(file)
        }
    }

    const closeFile = (fileId) => {
        // Set the active file to next file if there is one
        if (fileId === activeFile?.id) {
            // Save the content of the active file before closing
            updateFileContent(activeFile.id, activeFile.content || "")
            const fileIndex = openFiles.findIndex((file) => file.id === fileId)

            if (fileIndex !== -1 && openFiles.length > 1) {
                if (fileIndex > 0) {
                    setActiveFile(openFiles[fileIndex - 1])
                } else {
                    setActiveFile(openFiles[fileIndex + 1])
                }
            } else {
                setActiveFile(null)
            }
        }

        // Remove the file from openFiles
        setOpenFiles((prevOpenFiles) =>
            prevOpenFiles.filter((openFile) => openFile.id !== fileId),
        )
    }
    const createFile = useCallback((parentDirId, fileName) => {
        const newFile = {
            id: uuidv4(),
            name: fileName,
            type: "file",
            content: "",
        };

        const parentDir = findParentDirectory(fileStructure, parentDirId);
        if (!parentDir) {
            console.error("Parent directory not found for file creation.");
            return;
        }

        const updateDirectory = (directory) => {
            if (directory.id === parentDir.id) {
                return {
                    ...directory,
                    children: [...(directory.children || []), newFile],
                    isOpen: true, // ✅ Ensure folder is open
                };
            }

            if (directory.children) {
                return {
                    ...directory,
                    children: directory.children.map(updateDirectory),
                };
            }

            return directory;
        };

        const updatedStructure = updateDirectory(fileStructure);

        // ✅ Set file structure, open file, and activate it
        setFileStructure(updatedStructure);

        // ✅ Ensure folder is toggled open (even if it was previously closed)
        toggleDirectory(parentDir.id);

        setOpenFiles((prevOpenFiles) => [...prevOpenFiles, newFile]);
        setActiveFile(newFile);

        return newFile.id;
    });


    const updateFileContent = useCallback(
        (fileId, newContent) => {
            // Recursive function to find and update the file
            const updateFile = (directory) => {
                if (directory.type === "file" && directory.id === fileId) {
                    // If the current item is the file to update, return updated file
                    return {
                        ...directory,
                        content: newContent,
                    }
                } else if (directory.children) {
                    // If the current item is a directory, recursively update children
                    return {
                        ...directory,
                        children: directory.children.map(updateFile),
                    }
                } else {
                    // Otherwise, return the directory unchanged
                    return directory
                }
            }

            // Update fileStructure with the updated file content
            setFileStructure((prevFileStructure) =>
                updateFile(prevFileStructure),
            )

            // Update openFiles if the file is open
            if (openFiles.some((file) => file.id === fileId)) {
                setOpenFiles((prevOpenFiles) =>
                    prevOpenFiles.map((file) => {
                        if (file.id === fileId) {
                            return {
                                ...file,
                                content: newContent,
                            }
                        } else {
                            return file
                        }
                    }),
                )
            }
        },
        [openFiles],
    )

    const renameFile = useCallback(
        (
            fileId,
            newName,
            sendToSocket = true,
        ) => {
            const renameInDirectory = (
                directory,
            ) => {
                if (directory.type === "directory" && directory.children) {
                    return {
                        ...directory,
                        children: directory.children.map((item) => {
                            if (item.type === "file" && item.id === fileId) {
                                return {
                                    ...item,
                                    name: newName,
                                }
                            } else {
                                return item
                            }
                        }),
                    }
                } else {
                    return directory
                }
            }

            setFileStructure((prevFileStructure) =>
                renameInDirectory(prevFileStructure),
            )

            // Update Open Files
            setOpenFiles((prevOpenFiles) =>
                prevOpenFiles.map((file) => {
                    if (file.id === fileId) {
                        return {
                            ...file,
                            name: newName,
                        }
                    } else {
                        return file
                    }
                }),
            )

            // Update Active File
            if (fileId === activeFile?.id) {
                setActiveFile((prevActiveFile) => {
                    if (prevActiveFile) {
                        return {
                            ...prevActiveFile,
                            name: newName,
                        }
                    } else {
                        return null
                    }
                })
            }

            if (!sendToSocket) return true
            socket.emit(SocketEvent.FILE_RENAMED, {
                fileId,
                newName,
            })

            return true
        },
        [activeFile?.id, socket],
    )

    const deleteFile = useCallback(
        (fileId, sendToSocket = true) => {
            // Recursive function to find and delete the file in nested directories
            const deleteFileFromDirectory = (
                directory,
            ) => {
                if (directory.type === "directory" && directory.id === fileId) {
                    // If the current directory matches the one to delete, return null (remove it)
                    return null
                } else if (directory.children) {
                    // If it's not the directory to delete, recursively update children
                    const updatedChildren = directory.children
                        .map((child) => {
                            // Recursively process directories
                            if (child.type === "directory") {
                                return deleteFileFromDirectory(child)
                            }
                            // Filter out the file with matching id
                            if (child.id !== fileId) {
                                return child
                            }
                            return null
                        })
                        .filter((child) => child !== null)

                    // Return updated directory with filtered children
                    return {
                        ...directory,
                        children: updatedChildren,
                    }
                } else {
                    // If it's not a directory or doesn't have children, return as is
                    return directory
                }
            }

            setFileStructure((prevFileStructure) =>
                deleteFileFromDirectory(prevFileStructure),
            )

            // Remove the file from openFiles
            if (openFiles.some((file) => file.id === fileId)) {
                setOpenFiles((prevOpenFiles) =>
                    prevOpenFiles.filter((file) => file.id !== fileId),
                )
            }

            // Set the active file to null if it's the file being deleted
            if (activeFile?.id === fileId) {
                setActiveFile(null)
            }

            // Only show toast if the action originated locally
            if (sendToSocket) { // This implies it was a local action that will be sent to socket
                toast.success("File deleted successfully");
            }

            if (!sendToSocket) return;
            socket.emit(SocketEvent.FILE_DELETED, { fileId });
        },
        [activeFile?.id, openFiles, socket],
    )

    const downloadFilesAndFolders = () => {
        const zip = new JSZip()

        const downloadRecursive = (
            item,
            parentPath = "",
        ) => {
            const currentPath =
                parentPath + item.name + (item.type === "directory" ? "/" : "")

            if (item.type === "file") {
                zip.file(currentPath, item.content || "") // Add file to zip
            } else if (item.type === "directory" && item.children) {
                for (const child of item.children) {
                    downloadRecursive(child, currentPath) // Recursively process children
                }
            }
        }

        // Start downloading from the children of the root directory
        if (fileStructure.type === "directory" && fileStructure.children) {
            for (const child of fileStructure.children) {
                downloadRecursive(child)
            }
        }

        // Generate and save zip file
        zip.generateAsync({ type: "blob" }).then((content) => {
            saveAs(content, "download.zip")
        })
    }

    const handleUserJoined = useCallback(
        ({ user }) => {
            toast.success(`${user.username} joined the room`)

            // Send the code and drawing data to the server
            socket.emit(SocketEvent.SYNC_FILE_STRUCTURE, {
                fileStructure,
                openFiles,
                activeFile,
                socketId: user.socketId,
            })

            socket.emit(SocketEvent.SYNC_DRAWING, {
                drawingData,
                socketId: user.socketId,
            })

            setUsers((prev) => [...prev, user])
        },
        [activeFile, drawingData, fileStructure, openFiles, setUsers, socket],
    )

    const handleFileStructureSync = useCallback(
        ({
            fileStructure,
            openFiles,
            activeFile,
        }) => {
            setFileStructure(fileStructure)
            setOpenFiles(openFiles)
            setActiveFile(activeFile)
            toast.dismiss()
        },
        [],
    )

    const handleDirCreated = useCallback(
        ({
            parentDirId,
            newDirectory,
        }) => {
            createDirectory(parentDirId, newDirectory, false, true) // Pass isRemote as true
        },
        [createDirectory],
    )

    const handleDirUpdated = useCallback(
        ({ dirId, children }) => {
            updateDirectory(dirId, children, false)
        },
        [updateDirectory],
    )

    const handleDirRenamed = useCallback(
        ({ dirId, newName }) => {
            renameDirectory(dirId, newName, false)
        },
        [renameDirectory],
    )

    const handleDirDeleted = useCallback(
        ({ dirId }) => {
            deleteDirectory(dirId, false)
        },
        [deleteDirectory],
    )

    const handleFileCreated = useCallback(
        ({
            parentDirId,
            newFile,
        }) => {
            createFile(parentDirId, newFile, false, true); // Pass true for isRemote
        },
        [createFile],
    );

    const handleFileUpdated = useCallback(
        ({ fileId, newContent }) => {
            updateFileContent(fileId, newContent)
            // Update the content of the active file if it's the same file
            if (activeFile?.id === fileId) {
                setActiveFile({ ...activeFile, content: newContent })
            }
        },
        [activeFile, updateFileContent],
    )

    const handleFileRenamed = useCallback(
        ({ fileId, newName }) => {
            renameFile(fileId, newName, false)
        },
        [renameFile],
    )

    const handleFileDeleted = useCallback(
        ({ fileId }) => {
            deleteFile(fileId, false)
        },
        [deleteFile],
    )

    useEffect(() => {
        socket.once(SocketEvent.SYNC_FILE_STRUCTURE, handleFileStructureSync)
        socket.on(SocketEvent.USER_JOINED, handleUserJoined)
        socket.on(SocketEvent.DIRECTORY_CREATED, handleDirCreated)
        socket.on(SocketEvent.DIRECTORY_UPDATED, handleDirUpdated)
        socket.on(SocketEvent.DIRECTORY_RENAMED, handleDirRenamed)
        socket.on(SocketEvent.DIRECTORY_DELETED, handleDirDeleted)
        socket.on(SocketEvent.FILE_CREATED, handleFileCreated)
        socket.on(SocketEvent.FILE_UPDATED, handleFileUpdated)
        socket.on(SocketEvent.FILE_RENAMED, handleFileRenamed)
        socket.on(SocketEvent.FILE_DELETED, handleFileDeleted)

        return () => {
            socket.off(SocketEvent.USER_JOINED)
            socket.off(SocketEvent.DIRECTORY_CREATED)
            socket.off(SocketEvent.DIRECTORY_UPDATED)
            socket.off(SocketEvent.DIRECTORY_RENAMED)
            socket.off(SocketEvent.DIRECTORY_DELETED)
            socket.off(SocketEvent.FILE_CREATED)
            socket.off(SocketEvent.FILE_UPDATED)
            socket.off(SocketEvent.FILE_RENAMED)
            socket.off(SocketEvent.FILE_DELETED)
        }
    }, [
        handleDirCreated,
        handleDirDeleted,
        handleDirRenamed,
        handleDirUpdated,
        handleFileCreated,
        handleFileDeleted,
        handleFileRenamed,
        handleFileStructureSync,
        handleFileUpdated,
        handleUserJoined,
        socket,
    ])

    return (
        <FileContext.Provider
            value={{
                fileStructure,
                openFiles,
                activeFile,
                setActiveFile,
                closeFile,
                toggleDirectory,
                collapseDirectories,
                createDirectory,
                updateDirectory,
                renameDirectory,
                deleteDirectory,
                openFile,
                createFile,
                updateFileContent,
                renameFile,
                deleteFile,
                downloadFilesAndFolders,
                getFileById, // <--- EXPOSED: Add getFileById here
            }}
        >
            {children}
        </FileContext.Provider>
    )
}

export { FileContextProvider }
export default FileContext

export function useFile() {
    return useContext(FileContext);
}
