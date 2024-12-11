import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { toast } from "react-hot-toast"
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from "@heroicons/react/24/outline"
import { motion } from "framer-motion"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

const ResetPassword: React.FC = () => {
  const { id, token } = useParams<{ id: string; token: string }>()
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const response = await axios.post(`${API_URL}/auth/reset-password/${id}/${token}`, {
        password: newPassword,
      })

      if (response.data.Status === "Success") {
        toast.success(response.data.message || "Password reset successful")
        navigate("/signin")
      }
    } catch (error: any) {
      toast.error(error.response?.data.message || "Error resetting password")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token || !id) {
      toast.error("Invalid or expired reset link")
      navigate("/forgot-password")
    }
  }, [token, id, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex flex-col justify-center items-center p-4"  style={{
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
          <h2 className="text-4xl font-bold text-center text-white mb-8">Reset Password</h2>
          <form className="space-y-6" onSubmit={handleReset}>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-white mb-1">
                New Password
              </label>
              <div className="relative">
                <LockClosedIcon className="h-5 w-5 text-gray-300 absolute top-3 left-3" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="pl-10 block w-full px-4 py-3 bg-white bg-opacity-10 border border-gray-300 border-opacity-20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 hover:text-white"
                >
                  {showNewPassword ? (
                    <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <LockClosedIcon className="h-5 w-5 text-gray-300 absolute top-3 left-3" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 block w-full px-4 py-3 bg-white bg-opacity-10 border border-gray-300 border-opacity-20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 hover:text-white"
                >
                  {showConfirmPassword ? (
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
                disabled={!newPassword || !confirmPassword || loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-200">
              Remembered your password?{" "}
              <button
                onClick={() => navigate("/memberlogin")}
                className="font-medium text-blue-300 hover:text-blue-200 transition-colors duration-200"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ResetPassword

