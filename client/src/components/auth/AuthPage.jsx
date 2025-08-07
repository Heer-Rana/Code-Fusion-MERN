"use client"

import { useState } from "react"
import LoginForm from "./LoginForm"
import SignupForm from "./SignupForm"

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <>
      {isLogin ? (
        <LoginForm onSwitchToSignup={() => setIsLogin(false)} onSuccess={onAuthSuccess} />
      ) : (
        <SignupForm onSwitchToLogin={() => setIsLogin(true)} onSuccess={onAuthSuccess} />
      )}
    </>
  )
}

export default AuthPage
