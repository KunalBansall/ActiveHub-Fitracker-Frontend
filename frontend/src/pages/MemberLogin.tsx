import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import toast from "react-hot-toast"
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline"
import { motion } from "framer-motion"

const MemberLoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const navigate = useNavigate()
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await axios.post(`${API_URL}/member-auth/login`, { email, password })
      const { token, userId } = response.data

      localStorage.setItem("token", token)
      localStorage.setItem("userId", userId)
      
      // Set the justLoggedIn flag to trigger the full-screen ad
      sessionStorage.setItem("justLoggedIn", "true")

      toast.success("Login successful!")
      navigate(`/member/${userId}`)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Login failed.")
        toast.error(err.response?.data?.message || "Login failed.")
      } else {
        setError("An unexpected error occurred.")
        toast.error("An unexpected error occurred.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Login type selector */}
      <div className="fixed top-0 left-0 right-0 z-10 flex justify-center p-3 bg-gray-50 shadow-md">
        <div className="inline-flex rounded-lg">
          <button
            onClick={() => navigate('/signin')}
            className="relative inline-flex items-center justify-center px-6 py-2.5 font-medium text-gray-700 bg-gray-200 rounded-l-lg hover:bg-gray-300 focus:outline-none transition-all duration-200 ease-in-out"
          >
            <span className="relative text-sm">Admin Access</span>
          </button>
          <button
            className="relative inline-flex items-center justify-center px-6 py-2.5 font-medium text-white transition-all duration-200 ease-in-out bg-green-600 rounded-r-lg focus:outline-none"
          >
            <span className="relative text-sm">Member Access</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row mt-16">
        {/* Left side - Image/Branding (hidden on very small screens) */}
        <div className="hidden sm:flex sm:w-1/2 bg-gradient-to-br from-green-500 to-blue-700 text-white flex-col justify-center items-center p-8">
          <div className="max-w-md mx-auto text-center">
            <img 
              src="/Activehub04.jpeg" 
              alt="ActiveHub" 
              className="w-32 h-32 mx-auto mb-8 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <h1 className="text-4xl font-bold mb-6">Member Portal</h1>
            <p className="text-xl opacity-90 mb-8">Welcome to your fitness journey. Track your progress, manage your profile, and reach your goals.</p>
            <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center p-4">
                  <span className="text-3xl">{i === 1 ? '🏋️' : i === 2 ? '🧘' : '🏃'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full sm:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-gray-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md px-6 py-8 bg-white rounded-2xl shadow-xl"
          >
            <div className="sm:hidden flex justify-center mb-6">
              <img 
                src="/Activehub04.jpeg" 
                alt="ActiveHub" 
                className="w-20 h-20 rounded-full object-cover border-2 border-green-500"
              />
            </div>
            <div className="mb-6 flex items-center justify-center">
              <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                MEMBER ACCESS
              </span>
            </div>
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Member Login</h2>
            <p className="text-center text-gray-600 mb-8">Access your fitness journey</p>
            
            {error && (
              <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute top-1/2 -translate-y-1/2 left-3" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate("/reset-password?member=true")}
                    className="text-xs font-medium text-green-600 hover:text-green-500"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <LockClosedIcon className="h-5 w-5 text-gray-400 absolute top-1/2 -translate-y-1/2 left-3" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <EyeIcon className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={!email || !password || isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors duration-200"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-green-600 hover:text-green-500 transition-colors duration-200"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default MemberLoginPage

