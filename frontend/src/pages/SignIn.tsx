import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
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
    <div
      className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex flex-col justify-center items-center p-4"
      style={{
        backgroundImage: "url(/Activehub04.jpeg)",
        backgroundSize: "fit",
        backgroundPosition: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white border-opacity-20">
          <h2 className="text-4xl font-bold text-center text-white mb-8">
            Welcome Back
          </h2>
          {error && (
            <div
              className="mb-4 bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded-lg relative"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white mb-1"
              >
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
                <p className="mt-2 text-sm text-red-300">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white mb-1"
              >
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="h-5 w-5 text-gray-300 absolute top-3 left-3" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                  })}
                  className="pl-10 block w-full px-4 py-3 bg-white bg-opacity-10 border border-gray-300 border-opacity-20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
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
                <p className="mt-2 text-sm text-red-300">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
          <div className="mt-8 space-y-4">
            <p className="text-sm text-gray-200 text-center">
              Not a user?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="font-medium text-blue-300 hover:text-blue-200 transition-colors duration-200"
              >
                Sign up here
              </button>
            </p>
            <p className="text-sm text-gray-200 text-center">
              Forgot your password?{" "}
              <button
                onClick={() => navigate("/forgot-password")}
                className="font-medium text-blue-300 hover:text-blue-200 transition-colors duration-200"
              >
                Reset Password
              </button>
            </p>
            <p className="text-sm text-gray-200 text-center">
              Want to log in as a member?{" "}
              <button
                onClick={() => navigate("/memberlogin")}
                className="font-medium text-blue-300 hover:text-blue-200 transition-colors duration-200"
              >
                Member Login
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
