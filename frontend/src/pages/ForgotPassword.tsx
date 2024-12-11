import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { EnvelopeIcon } from "@heroicons/react/24/outline"
import { motion } from "framer-motion"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email })
      toast.success(response.data.message || 'Reset link sent to your email')
      setEmail('')
    } catch (error: any) {
      if (error.response?.data?.message === 'user not exists') {
        toast.error('User does not exist')
      } else {
        toast.error(error.response?.data.message || 'Error sending reset email')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex flex-col justify-center items-center p-4 "  style={{
      backgroundImage: "url(/Activehub04.jpeg)",
      backgroundSize: "fit", 
      backgroundPosition: "center", 
    }}>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white border-opacity-20">
          <h2 className="text-4xl font-bold text-center text-white mb-8">Forgot Password</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                Email address
              </label>
              <div className="relative">
                <EnvelopeIcon className="h-5 w-5 text-gray-300 absolute top-3 left-3" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 block w-full px-4 py-3 bg-white bg-opacity-10 border border-gray-300 border-opacity-20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={!email || loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-200">
              Remember your password?{' '}
              <button
                onClick={() => navigate('/signin')}
                className="font-medium text-blue-300 hover:text-blue-200 transition-colors duration-200"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ForgotPassword

