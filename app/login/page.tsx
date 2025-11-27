"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { FaGithub, FaGoogle } from "react-icons/fa"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async (provider: string) => {
    setIsLoading(true)
    try {
      await signIn(provider, { callbackUrl: "/" })
    } catch (error) {
      console.error("Error signing in:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to continue to your AI chatbot
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleSignIn("google")}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <FaGoogle className="w-5 h-5" />
            Continue with Google
          </button>

          <button
            onClick={() => handleSignIn("github")}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 border-2 border-gray-900 dark:border-gray-700 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <FaGithub className="w-5 h-5" />
            Continue with GitHub
          </button>
        </div>

        {isLoading && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Signing in...
          </div>
        )}

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
