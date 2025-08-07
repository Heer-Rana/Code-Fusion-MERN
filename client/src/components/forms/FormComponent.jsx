"use client"

import { useAppContext } from "@/context/AppContext"
import { useSocket } from "@/context/SocketContext"
import { SocketEvent } from "@/types/socket"
import { USER_STATUS } from "@/types/user"
import { useEffect, useRef } from "react"
import { toast } from "react-hot-toast"
import { useLocation, useNavigate } from "react-router-dom"
import { v4 as uuidv4 } from "uuid"
import { useAuth } from "@/context/AuthContext"
import logo from "@/assets/logoo.png"

const FormComponent = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const { currentUser, setCurrentUser, status, setStatus } = useAppContext()
  const { socket } = useSocket()
  const { user: authUser } = useAuth()
  const usernameRef = useRef(null)

  const handleInputChanges = (e) => {
    const { name, value } = e.target
    setCurrentUser((prev) => ({ ...prev, [name]: value }))
  }

  const createNewRoomId = () => {
    setCurrentUser((prev) => ({ ...prev, roomId: uuidv4() }))
    toast.success("Created a new Room ID")
    usernameRef.current?.focus()
  }

  const validateForm = () => {
    const { username, roomId } = currentUser
    if (!username.trim()) return toast.error("Enter your username"), false
    if (username.trim().length < 3) return toast.error("Username must be at least 3 characters"), false
    if (!roomId.trim()) return toast.error("Enter a room ID"), false
    if (roomId.trim().length < 5) return toast.error("Room ID must be at least 5 characters"), false
    return true
  }

  const joinRoom = (e) => {
    e.preventDefault()
    if (status === USER_STATUS.ATTEMPTING_JOIN) return
    if (!validateForm()) return

    toast.loading("Joining room...")
    setStatus(USER_STATUS.ATTEMPTING_JOIN)
    const { username, roomId } = currentUser
    socket.emit(SocketEvent.JOIN_REQUEST, { username, roomId })
  }

  useEffect(() => {
    if (authUser?.username && !currentUser.username) {
      setCurrentUser((prev) => ({ ...prev, username: authUser.username }))
    }
  }, [authUser?.username])

  useEffect(() => {
    if (!currentUser.roomId && location.state?.roomId) {
      setCurrentUser((prev) => ({ ...prev, roomId: location.state.roomId }))
      if (!currentUser.username) {
        toast.success("Enter your username")
      }
    }
  }, [location.state?.roomId])

  useEffect(() => {
    if (status === USER_STATUS.DISCONNECTED && !socket.connected) {
      socket.connect()
    }
    if (status === USER_STATUS.JOINED) {
      const { username, roomId } = currentUser
      navigate(`/editor/${roomId}`, {
        state: { username },
      })
    }
  }, [status])

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center justify-center gap-5 p-6 sm:p-8 bg-[#1a1a1a] rounded-xl shadow-2xl ml-[-20px] sm:ml-[-40px]">
      <img src={logo || "/placeholder.svg"} alt="Logo" className="w-full object-contain mb-2" />

      <form onSubmit={joinRoom} className="flex w-full flex-col gap-4">
        <input
          type="text"
          name="roomId"
          placeholder="Room ID"
          className="w-full rounded-md border border-gray-700 bg-black px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          onChange={handleInputChanges}
          value={currentUser.roomId}
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          className="w-full rounded-md border border-gray-700 bg-black px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          onChange={handleInputChanges}
          value={currentUser.username}
          ref={usernameRef}
        />
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-6 py-2.5 text-base font-semibold text-black hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black transition-colors"
        >
          Join
        </button>
      </form>

      <button
        className="w-full text-center text-sm underline text-primary hover:opacity-80 transition-colors"
        onClick={createNewRoomId}
      >
        Generate Unique Room ID
      </button>

      {authUser && (
        <div className="mt-4 pt-4 border-t border-gray-700 w-full">
          <div className="flex items-center justify-center text-sm text-gray-400">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-black font-medium mr-2 text-xs">
              {authUser.username.charAt(0).toUpperCase()}
            </div>
            Logged in as <span className="font-medium ml-1 text-white">{authUser.username}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormComponent
