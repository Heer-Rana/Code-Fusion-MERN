// HomePage.tsx
"use client"
import React from "react"
import { useAuth } from "../context/AuthContext"
import illustration from "@/assets/illustration.svg"
import FormComponent from "@/components/forms/FormComponent"

const HomePage = () => {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-16 bg-black text-white">
      {/* 👤 Logout button */}
      {user && (
        <div className="absolute top-4 right-6">
          <button
            onClick={logout}
            className="rounded bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600">
            Logout
          </button>
        </div>
      )}

      {/* 🎨 Landing Page Layout */}
      <div className="my-12 flex h-full min-w-full flex-col items-center justify-evenly sm:flex-row sm:pt-0">
        <div className="flex w-full animate-up-down justify-center sm:w-1/2 sm:pl-4">
          <img
            src={illustration}
            alt="Code Fusion Illustration"
            className="mx-auto w-[250px] sm:w-[400px] filter brightness-90"
          />
        </div>
        <div className="flex w-full items-center justify-center sm:w-1/2">
          <FormComponent />
        </div>
      </div>
    </div>
  )
}

export default HomePage
