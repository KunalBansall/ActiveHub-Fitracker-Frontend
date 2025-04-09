import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import axios from "axios"
import { EyeIcon, EyeSlashIcon, UserIcon, EnvelopeIcon, LockClosedIcon, BuildingOfficeIcon, MapPinIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"
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
  const [currentStep, setCurrentStep] = useState(1)
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    trigger,
    watch,
  } = useForm<SignUpForm>()

  const nextStep = async () => {
    const fieldsToValidate = currentStep === 1 
      ? ['username', 'email', 'password'] 
      : ['gymName', 'gymType', 'gymAddress.street', 'gymAddress.city', 'gymAddress.state', 'gymAddress.zipCode', 'gymAddress.country']
    
    const isStepValid = await trigger(fieldsToValidate as any)
    if (isStepValid) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

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
    <div className="min-h-screen w-full flex flex-col sm:flex-row">
      {/* Left side - Image/Branding (hidden on very small screens) */}
      <div className="hidden sm:flex sm:w-2/5 bg-gradient-to-br from-blue-500 to-purple-700 text-white flex-col justify-center items-center p-8">
        <div className="max-w-md mx-auto text-center">
          <img 
            src="/Activehub04.jpeg" 
            alt="ActiveHub" 
            className="w-32 h-32 mx-auto mb-8 rounded-full object-cover border-4 border-white shadow-lg"
          />
          <h1 className="text-4xl font-bold mb-6">Get Started Today</h1>
          <p className="text-xl opacity-90 mb-8">Join thousands of gym owners who trust ActiveHub for their fitness business management needs.</p>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <p className="text-lg font-medium mb-4">Why Choose ActiveHub?</p>
            <ul className="text-sm opacity-90 space-y-2 text-left">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Complete member management system</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Attendance tracking & analytics</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Integrated payments & scheduling</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Mobile-friendly for members & staff</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right side - Registration Form */}
      <div className="w-full sm:w-3/5 flex items-center justify-center p-4 sm:p-8 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl px-6 py-8 bg-white rounded-2xl shadow-xl"
        >
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => navigate('/signin')}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              <span className="text-sm">Back to login</span>
            </button>
            
            <div className="flex items-center">
              <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</span>
              <div className={`w-8 h-1 ${currentStep === 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</span>
            </div>
          </div>
          
          <div className="sm:hidden flex justify-center mb-6">
            <img 
              src="/Activehub04.jpeg" 
              alt="ActiveHub" 
              className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
            />
          </div>
          
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
            {currentStep === 1 ? "Create Your Account" : "Gym Information"}
          </h2>
          <p className="text-center text-gray-600 mb-8">
            {currentStep === 1 ? "Register as a gym owner" : "Tell us about your fitness business"}
          </p>
          
          {error && (
            <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <UserIcon className="h-5 w-5 text-gray-400 absolute top-1/2 -translate-y-1/2 left-3" />
                    <input
                      id="username"
                      {...register("username", { required: "Username is required" })}
                      className="pl-10 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter username"
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-2 text-sm text-red-500">{errors.username.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute top-1/2 -translate-y-1/2 left-3" />
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
                      className="pl-10 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="h-5 w-5 text-gray-400 absolute top-1/2 -translate-y-1/2 left-3" />
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
                      className="pl-10 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>
                
                <div>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="gymName" className="block text-sm font-medium text-gray-700 mb-1">
                      Gym Name
                    </label>
                    <div className="relative">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400 absolute top-1/2 -translate-y-1/2 left-3" />
                      <input
                        id="gymName"
                        {...register("gymName", { required: "Gym name is required" })}
                        className="pl-10 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter gym name"
                      />
                    </div>
                    {errors.gymName && (
                      <p className="mt-2 text-sm text-red-500">{errors.gymName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="gymType" className="block text-sm font-medium text-gray-700 mb-1">
                      Gym Type
                    </label>
                    <div className="relative">
                      <select
                        id="gymType"
                        {...register("gymType", { required: "Gym type is required" })}
                        className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <p className="mt-2 text-sm text-red-500">{errors.gymType.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gym Address</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <MapPinIcon className="h-5 w-5 text-gray-400 absolute top-1/2 -translate-y-1/2 left-3" />
                      <input
                        {...register("gymAddress.street", { required: "Street is required" })}
                        placeholder="Street"
                        className="pl-10 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.gymAddress?.street && (
                        <p className="mt-1 text-sm text-red-500">{errors.gymAddress.street.message}</p>
                      )}
                    </div>
                    <div>
                      <input
                        {...register("gymAddress.city", { required: "City is required" })}
                        placeholder="City"
                        className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.gymAddress?.city && (
                        <p className="mt-1 text-sm text-red-500">{errors.gymAddress.city.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <input
                        {...register("gymAddress.state", { required: "State is required" })}
                        placeholder="State"
                        className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.gymAddress?.state && (
                        <p className="mt-1 text-sm text-red-500">{errors.gymAddress.state.message}</p>
                      )}
                    </div>
                    <div>
                      <input
                        {...register("gymAddress.zipCode", { required: "ZIP code is required" })}
                        placeholder="ZIP Code"
                        className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.gymAddress?.zipCode && (
                        <p className="mt-1 text-sm text-red-500">{errors.gymAddress.zipCode.message}</p>
                      )}
                    </div>
                    <div>
                      <input
                        {...register("gymAddress.country", { required: "Country is required" })}
                        placeholder="Country"
                        className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.gymAddress?.country && (
                        <p className="mt-1 text-sm text-red-500">{errors.gymAddress.country.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="w-1/3 flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-2/3 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already a user?{" "}
              <Link
                to="/signin"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

