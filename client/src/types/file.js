/**
 * @typedef {string} Id
 * @typedef {string} FileName
 * @typedef {string} FileContent
 */

/**
 * @typedef {Object} FileSystemItem
 * @property {string} id
 * @property {FileName} name
 * @property {"file"|"directory"} type
 * @property {FileSystemItem[]} [children]
 * @property {FileContent} [content]
 * @property {boolean} [isOpen]
 */

/**
 * @typedef {Object} FileContext
 * @property {FileSystemItem} fileStructure
 * @property {FileSystemItem[]} openFiles
 * @property {FileSystemItem|null} activeFile
 * @property {(file: FileSystemItem) => void} setActiveFile
 * @property {(fileId: Id) => void} closeFile
 * @property {(dirId: Id) => void} toggleDirectory
 * @property {() => void} collapseDirectories
 * @property {(parentDirId: Id, name: FileName) => Id} createDirectory
 * @property {(dirId: Id, children: FileSystemItem[]) => void} updateDirectory
 * @property {(dirId: Id, newName: FileName) => void} renameDirectory
 * @property {(dirId: Id) => void} deleteDirectory
 * @property {(parentDirId: Id, name: FileName) => Id} createFile
 * @property {(fileId: Id, content: FileContent) => void} updateFileContent
 * @property {(fileId: Id) => void} openFile
 * @property {(fileId: Id, newName: FileName) => boolean} renameFile
 * @property {(fileId: Id) => void} deleteFile
 * @property {() => void} downloadFilesAndFolders
 */

// Add these exports for runtime visibility:
export const Id = {};
export const FileName = {};
export const FileContent = {};
export const FileSystemItem = {};
export const FileContext = {};