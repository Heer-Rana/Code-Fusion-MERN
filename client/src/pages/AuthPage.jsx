"use client"

import { useState } from "react"
import { useAuth } from "../context/AuthContext"

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [localError, setLocalError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { login, register, loading, error } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError("")

    if (isLogin) {
      if (!email || !password) {
        setLocalError("Please fill in all fields")
        return
      }
      try {
        await login({ email, password })
        onAuthSuccess()
      } catch (error) {
        console.error("Login failed:", error)
      }
    } else {
      if (!username || !email || !password || !confirmPassword) {
        setLocalError("Please fill in all fields")
        return
      }
      if (password !== confirmPassword) {
        setLocalError("Passwords do not match")
        return
      }
      if (password.length < 6) {
        setLocalError("Password must be at least 6 characters")
        return
      }
      try {
        await register({ username, email, password })
        onAuthSuccess()
      } catch (error) {
        console.error("Registration failed:", error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-dark font-poppins">
      <header className="bg-dark border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Code Fusion</h1>
              <span className="ml-2 text-sm text-gray-400">Collaborative Code Editor</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-white mb-2">{isLogin ? "Welcome Back" : "Join Code Fusion"}</h2>
            <p className="text-gray-400">
              {isLogin
                ? "Login to continue your collaborative coding journey"
                : "Create an account to start coding together"}
            </p>
          </div>

          <div className="bg-darkHover rounded-lg border border-gray-800 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-dark border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-500"
                    placeholder="Choose a username"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-dark border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-500"
                  placeholder="Enter your email"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-dark border border-gray-700 rounded-md pr-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-500"
                  placeholder="Enter your password"
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-9 right-3 text-gray-400 cursor-pointer"
                >
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div>

              {!isLogin && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-dark border border-gray-700 rounded-md pr-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-500"
                    placeholder="Confirm your password"
                  />
                  <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-9 right-3 text-gray-400 cursor-pointer"
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </span>
                </div>
              )}

              {(error || localError) && (
                <div className="bg-danger bg-opacity-10 border border-danger border-opacity-30 rounded-md p-3">
                  <div className="text-danger text-sm text-center">{error || localError}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-dark py-2 px-4 rounded-md hover:bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark mr-2"></div>
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </div>
                ) : isLogin ? (
                  "Login"
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary hover:opacity-80 text-sm font-medium"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
              </button>
            </div>
          </div>

          {/* Optional features section remains unchanged */}
        </div>
      </div>
    </div>
  )
}

export default AuthPage
