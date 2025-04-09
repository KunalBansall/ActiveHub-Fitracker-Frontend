import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { EnvelopeIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"
import { motion } from "framer-motion"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isMemberReset = location.search.includes('member=true')
  
  const themeColor = isMemberReset ? 'green' : 'blue'
  const gradientClasses = isMemberReset 
    ? 'from-green-500 to-blue-700' 
    : 'from-blue-500 to-purple-700'
  const buttonClasses = isMemberReset
    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
  const linkClasses = isMemberReset
    ? 'text-green-600 hover:text-green-500'
    : 'text-blue-600 hover:text-blue-500'
  const ringFocusClasses = isMemberReset
    ? 'focus:ring-green-500'
    : 'focus:ring-blue-500'
  const badgeClasses = isMemberReset
    ? 'bg-green-100 text-green-800'
    : 'bg-blue-100 text-blue-800'
  const borderClasses = isMemberReset
    ? 'border-green-500'
    : 'border-blue-500'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email })
      toast.success(response.data.message || 'Reset link sent to your email')
      setIsSubmitted(true)
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
    <div className="min-h-screen w-full flex flex-col sm:flex-row">
      {/* Left side - Image/Branding (hidden on very small screens) */}
      <div className={`hidden sm:flex sm:w-1/2 bg-gradient-to-br ${gradientClasses} text-white flex-col justify-center items-center p-8`}>
        <div className="max-w-md mx-auto text-center">
          <img 
            src="/Activehub04.jpeg" 
            alt="ActiveHub" 
            className="w-32 h-32 mx-auto mb-8 rounded-full object-cover border-4 border-white shadow-lg"
          />
          <h1 className="text-4xl font-bold mb-6">Reset Your Password</h1>
          <p className="text-xl opacity-90 mb-8">We'll send you a secure link to reset your password and get back to your fitness journey.</p>
          <div className="max-w-xs mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <p className="text-lg font-medium">Need help?</p>
            <p className="text-sm opacity-90 mt-2">Contact our support team at activehubfitracker@gmail.com</p>
          </div>
        </div>
      </div>

      {/* Right side - Reset Form */}
      <div className="w-full sm:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md px-6 py-8 bg-white rounded-2xl shadow-xl"
        >
          <button 
            onClick={() => navigate(isMemberReset ? '/memberlogin' : '/signin')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-6"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">Back to login</span>
          </button>
          
          <div className="sm:hidden flex justify-center mb-6">
            <img 
              src="/Activehub04.jpeg" 
              alt="ActiveHub" 
              className={`w-20 h-20 rounded-full object-cover border-2 ${borderClasses}`}
            />
          </div>
          
          <div className="mb-6 flex items-center justify-center">
            <span className={`inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-semibold ${badgeClasses}`}>
              {isMemberReset ? 'MEMBER PASSWORD RESET' : 'ADMIN PASSWORD RESET'}
            </span>
          </div>
          
          {!isSubmitted ? (
            <>
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Forgot Password</h2>
              <p className="text-center text-gray-600 mb-8">Enter your email to receive a password reset link</p>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute top-1/2 -translate-y-1/2 left-3" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`pl-10 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${ringFocusClasses} focus:border-transparent`}
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={!email || loading}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white ${buttonClasses} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className={`mx-auto w-16 h-16 flex items-center justify-center bg-${themeColor}-100 text-${themeColor}-600 rounded-full mb-6`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email</h2>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to <span className="font-medium">{email}</span>
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className={`text-${themeColor}-600 hover:text-${themeColor}-500 font-medium text-sm`}
              >
                Try another email
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link
                to={isMemberReset ? "/memberlogin" : "/signin"}
                className={`font-medium ${linkClasses} transition-colors duration-200`}
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ForgotPassword

