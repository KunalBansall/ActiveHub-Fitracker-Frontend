import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import { CustomJwtPayload } from "../types/index";

interface SignInForm {
  email: string;
  password: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function SignIn() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>();

  const onSubmit = async (data: SignInForm) => {
    try {
      const response = await axios.post(`${API_URL}/auth/signin`, data);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));

      // Decode the JWT token using the custom type
      const decodedToken = jwtDecode<CustomJwtPayload>(response.data.token);
      const role = decodedToken.role;

      if (role === "owner") {
        navigate("/owner-logs"); // Redirect to owner-specific route
      } else {
        navigate("/"); // Redirect to the default route
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Login type selector */}
      <div className="fixed top-0 left-0 right-0 z-10 flex justify-center p-3 bg-gray-50 shadow-md">
        <div className="inline-flex rounded-lg">
          <button
            className="relative inline-flex items-center justify-center px-6 py-2.5 font-medium text-white transition-all duration-200 ease-in-out bg-blue-600 rounded-l-lg focus:outline-none hover:bg-blue-700"
          >
            <span className="relative text-sm">Admin Access</span>
          </button>
          <button
            onClick={() => navigate('/memberlogin')}
            className="relative inline-flex items-center justify-center px-6 py-2.5 font-medium text-gray-700 bg-gray-200 rounded-r-lg hover:bg-gray-300 focus:outline-none transition-all duration-200 ease-in-out"
          >
            <span className="relative text-sm">Member Access</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row mt-16">
        {/* Left side - Form */}
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
                className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
              />
            </div>
            <div className="mb-6 flex items-center justify-center">
              <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                ADMIN ACCESS
              </span>
            </div>
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-center text-gray-600 mb-8">Sign in to manage your gym</p>
            
            {error && (
              <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
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
                  <p className="mt-2 text-sm text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <LockClosedIcon className="h-5 w-5 text-gray-400 absolute top-1/2 -translate-y-1/2 left-3" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: "Password is required",
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
                  <p className="mt-2 text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>
            </form>
            <div className="mt-8 space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Not a user?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right side - Image/Branding (hidden on very small screens) */}
        <div className="hidden sm:flex sm:w-1/2 bg-gradient-to-br from-blue-500 to-purple-700 text-white flex-col justify-center items-center p-8">
          <div className="max-w-md mx-auto text-center">
            <img 
              src="/Activehub04.jpeg" 
              alt="ActiveHub" 
              className="w-32 h-32 mx-auto mb-8 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <h1 className="text-4xl font-bold mb-6">ActiveHub Admin</h1>
            <p className="text-xl opacity-90 mb-8">Your comprehensive gym management solution. Manage members, track performance, and grow your business.</p>
            <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
              <div className="aspect-square rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center p-4">
                <UserIcon className="h-8 w-8" />
              </div>
              <div className="aspect-square rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center p-4">
                <BuildingOfficeIcon className="h-8 w-8" />
              </div>
              <div className="aspect-square rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center p-4">
                <span className="text-3xl">📊</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
