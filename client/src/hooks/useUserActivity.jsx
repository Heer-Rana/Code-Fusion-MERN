import { useAppContext } from "../context/AppContext"
import { useSocket } from "../context/SocketContext"
import { SocketEvent } from "../types/socket"
import { USER_CONNECTION_STATUS } from "../types/user"
import { useCallback, useEffect } from "react"

function useUserActivity() {
    const { setUsers } = useAppContext()
    const { socket } = useSocket()

    const handleUserVisibilityChange = useCallback(() => {
        if (!socket) return; // Add a guard for socket not being available yet
        if (document.visibilityState === "visible")
            socket.emit(SocketEvent.USER_ONLINE, { socketId: socket.id })
        else if (document.visibilityState === "hidden") {
            socket.emit(SocketEvent.USER_OFFLINE, { socketId: socket.id })
        }
    }, [socket])

    const handleUserOnline = useCallback(
        ({ socketId }) => {
            setUsers((users) =>
                users.map((user) =>
                    user.socketId === socketId
                        ? {
                            ...user,
                            status: USER_CONNECTION_STATUS.ONLINE,
                        } : user
                )
            )
        },
        [setUsers],
    )

    const handleUserOffline = useCallback(
        ({ socketId }) => {
            setUsers((users) =>
                users.map((user) =>
                    user.socketId === socketId
                        ? { ...user, status: USER_CONNECTION_STATUS.OFFLINE }
                        : user
                )
            )
        },
        [setUsers],
    )

    const handleUserTyping = useCallback(
        ({ user }) => { // Add type for user
            setUsers((users) => {
                return users.map((u) => {
                    if (u.socketId === user.socketId) {
                        return user
                    }
                    return u
                })
            })
        },
        [setUsers],
    )

    useEffect(() => {
        if (!socket) return; // Ensure socket is available before attaching listeners

        document.addEventListener(
            "visibilitychange",
            handleUserVisibilityChange,
        )

        socket.on(SocketEvent.USER_ONLINE, handleUserOnline)
        socket.on(SocketEvent.USER_OFFLINE, handleUserOffline)
        socket.on(SocketEvent.TYPING_START, handleUserTyping)
        socket.on(SocketEvent.TYPING_PAUSE, handleUserTyping)

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleUserVisibilityChange,
            )

            // Pass the specific handler function to .off() for correct cleanup
            socket.off(SocketEvent.USER_ONLINE, handleUserOnline)
            socket.off(SocketEvent.USER_OFFLINE, handleUserOffline)
            socket.off(SocketEvent.TYPING_START, handleUserTyping)
            socket.off(SocketEvent.TYPING_PAUSE, handleUserTyping)
        }
    }, [
        socket,
        // setUsers, // setUsers is already a dependency of the callbacks, so not strictly needed here
        handleUserVisibilityChange,
        handleUserOnline,
        handleUserOffline,
        handleUserTyping,
    ])

    // You might want to return something from the hook if it provides state or functions to components
    // For now, it just manages side effects, so no explicit return is necessary unless desired.
}

export default useUserActivity
