import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import axios from "axios"
import { EyeIcon, EyeSlashIcon, UserIcon, EnvelopeIcon, LockClosedIcon, BuildingOfficeIcon, MapPinIcon } from "@heroicons/react/24/outline"
import { motion } from "framer-motion"

interface SignUpForm {
  username: string
  email: string
  password: string
  gymName: string
  gymAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  gymType: string
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

export default function SignUp() {
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>()

  const onSubmit = async (data: SignUpForm) => {
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, data)
      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data))
      navigate("/")
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex flex-col justify-center items-center p-4" 
    style={{
      backgroundImage: "url(/Activehub04.jpeg)",
      backgroundSize: "fit", 
      backgroundPosition: "center", 
    }}>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white border-opacity-20">
          <h2 className="text-4xl font-bold text-center text-white mb-8">Register Your Gym</h2>
          {error && (
            <div className="mb-4 bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded-lg relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-white mb-1">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="h-5 w-5 text-gray-300 absolute top-3 left-3" />
                  <input
                    id="username"
                    {...register("username", { required: "Username is required" })}
                    className="pl-10 block w-full px-4 py-3 bg-white bg-opacity-10 border border-gray-300 border-opacity-20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-2 text-sm text-red-300">{errors.username.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                  Email address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="h-5 w-5 text-gray-300 absolute top-3 left-3" />
                  <input
                    id="email"
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    className="pl-10 block w-full px-4 py-3 bg-white bg-opacity-10 border border-gray-300 border-opacity-20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-300">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                  Password
                </label>
                <div className="relative">
                  <LockClosedIcon className="h-5 w-5 text-gray-300 absolute top-3 left-3" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    className="pl-10 block w-full px-4 py-3 bg-white bg-opacity-10 border border-gray-300 border-opacity-20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <EyeIcon className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-300">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="gymName" className="block text-sm font-medium text-white mb-1">
                  Gym Name
                </label>
                <div className="relative">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-300 absolute top-3 left-3" />
                  <input
                    id="gymName"
                    {...register("gymName", { required: "Gym name is required" })}
                    className="pl-10 block w-full px-4 py-3 bg-white bg-opacity-10 border border-gray-300 border-opacity-20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter gym name"
                  />
                </div>
                {errors.gymName && (
                  <p className="mt-2 text-sm text-red-300">{errors.gymName.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="gymType" className="block text-sm font-medium text-white mb-1">
                  Gym Type
                </label>
                <div className="relative">
                  <select
                    id="gymType"
                    {...register("gymType", { required: "Gym type is required" })}
                    className="block w-full px-4 py-3 bg-white bg-opacity-10 border border-gray-300 border-opacity-20 rounded-lg text-gray-400 placeholder-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a type</option>
                    <option value="Fitness Center">Fitness Center</option>
                    <option value="CrossFit Box">CrossFit Box</option>
                    <option value="Yoga Studio">Yoga Studio</option>
                    <option value="Martial Arts">Martial Arts</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {errors.gymType && (
                  <p className="mt-2 text-sm text-red-300">{errors.gymType.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">Gym Address</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <MapPinIcon className="h-5 w-5 text-gray-300 absolute top-3 left-3" />
                  <input
                    {...register("gymAddress.street", { required: "Street is required" })}
                    placeholder="Street"
                    className="pl-10 block w-full px-4 py-3 bg-white bg-opacity-10 border border-gray-300 border-opacity-20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <input
                  {...register("gymAddress.city", { required: "City is required" })}
                  placeholder="City"
                  className="block w-full px-4 py-3 bg-white bg-opacity-10 border border-gray-300 border-opacity-20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <input
                  {...register("gymAddress.state", { required: "State is required" })}
                  placeholder="State"
                  className="block w-full px-4 py-3 bg-white bg-opacity-10 border border-gray-300 border-opacity-20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  {...register("gymAddress.zipCode", { required: "ZIP code is required" })}
                  placeholder="ZIP Code"
                  className="block w-full px-4 py-3 bg-white bg-opacity-10 border border-gray-300 border-opacity-20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  {...register("gymAddress.country", { required: "Country is required" })}
                  placeholder="Country"
                  className="block w-full px-4 py-3 bg-white bg-opacity-10 border border-gray-300 border-opacity-20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
              >
                {isSubmitting ? "Signing up..." : "Sign up"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-200">
              Already a user?{" "}
              <button
                onClick={() => navigate("/signin")}
                className="font-medium text-blue-300 hover:text-blue-200 transition-colors duration-200"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

