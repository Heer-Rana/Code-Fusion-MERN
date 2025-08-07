import { useAppContext } from "@/context/AppContext"
import { useFileSystem } from "@/context/FileContext"
import { useSettings } from "@/context/SettingContext"
import { useSocket } from "@/context/SocketContext"
import usePageEvents from "@/hooks/usePageEvents"
import useResponsive from "@/hooks/useResponsive"
import { editorThemes } from "@/resources/Themes"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FileSystemItem } from "@/types/file"
import { SocketEvent } from "@/types/socket"
import { color } from "@uiw/codemirror-extensions-color"
import { hyperLink } from "@uiw/codemirror-extensions-hyper-link"
import { loadLanguage } from "@uiw/codemirror-extensions-langs"
import CodeMirror, {
    scrollPastEnd,
} from "@uiw/react-codemirror"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"

function Editor() {
    const { users = [], currentUser } = useAppContext() // Added default for users
    const { activeFile, setActiveFile } = useFileSystem()
    const { theme, language, fontSize } = useSettings()
    const { socket } = useSocket()
    const { viewHeight } = useResponsive()
    const [timeOut, setTimeOut] = useState(setTimeout(() => {}, 0))

    const filteredUsers = useMemo(
        () => users.filter((u) => u.username !== currentUser?.username), // Added optional chaining for currentUser
        [users, currentUser],
    )
    const [extensions, setExtensions] = useState([])

    const onCodeChange = (code, view) => {
        if (!activeFile) return // This is important: if no activeFile, nothing happens

        const file = { ...activeFile, content: code }
        setActiveFile(file)
        const cursorPosition = view.state?.selection?.main?.head
        // Ensure socket is available before emitting
        if (socket) {
            socket.emit(SocketEvent.TYPING_START, { cursorPosition })
            socket.emit(SocketEvent.FILE_UPDATED, {
                fileId: activeFile.id,
                newContent: code,
            })
            clearTimeout(timeOut)

            const newTimeOut = setTimeout(
                () => socket.emit(SocketEvent.TYPING_PAUSE),
                1000,
            )
            setTimeOut(newTimeOut)
        }
    }

    usePageEvents() // Assuming this hook works correctly

    useEffect(() => {
        const loadedExtensions = [
            color,
            hyperLink,
            scrollPastEnd(),
        ];
        // Ensure language is a string before calling toLowerCase
        const langToLoad = typeof language === 'string' ? language.toLowerCase() : '';

        const langExt = langToLoad ? loadLanguage(langToLoad) : null;

        if (langExt) {
            loadedExtensions.push(langExt)
        } else {
            // Only show toast if language is defined and not loaded
            if (langToLoad) {
                 toast.error(
                    "Syntax highlighting is unavailable for this language. Please adjust the editor settings; it may be listed under a different name.",
                    {
                        duration: 5000,
                    },
                )
            }
        }

        setExtensions(loadedExtensions)
    }, [filteredUsers, language]) // Dependencies are correct here

    // This return statement will only render the CodeMirror component if activeFile exists
    // If activeFile is null/undefined, this component will render nothing.
    // Ensure your logic for setting activeFile in FileContext is working.
    if (!activeFile) {
        return <div className="text-center text-white">Select a file to start coding!</div>; // Or render a loading spinner, or instructions
    }

    return (
        <CodeMirror
            theme={editorThemes[theme]} // Ensure editorThemes[theme] returns a valid theme object
            onChange={onCodeChange}
            value={activeFile.content} // Now activeFile is guaranteed to exist
            extensions={extensions}
            minHeight="100%"
            maxWidth="100vw"
            style={{
                fontSize: fontSize + "px",
                height: viewHeight,
                position: "relative",
            }}
        />
    )
}

export default Editor