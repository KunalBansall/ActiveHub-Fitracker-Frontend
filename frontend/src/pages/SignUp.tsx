import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useForm } from "react-hook-form";
import React from "react";

interface SignUpForm {
  username: string;
  email: string;
  password: string;
  gymName: string;
  gymAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  gymType: string;
}

export default function SignUp() {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpForm>();

  const onSubmit = async (data: SignUpForm) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/signup",
        data
      );
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred");
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 sm:px-6 lg:px-8 "
      style={{
        backgroundImage: "url(/Activehub04.jpeg)",
        backgroundSize: "fit",
        backgroundPosition: "center",
      }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <h2 className="mt-2 text-center text-4xl font-extrabold text-outline text-white">
          Register Your Gym
        </h2>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="bg-white bg-opacity-30 py-8 px-8 shadow sm:rounded-lg">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1">
                  <input
                    {...register("username", { required: "Username is required" })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {/* Gym Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gym Name
                </label>
                <div className="mt-1">
                  <input
                    {...register("gymName", { required: "Gym name is required" })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.gymName && (
                    <p className="mt-1 text-sm text-red-600">{errors.gymName.message}</p>
                  )}
                </div>
              </div>

              {/* Gym Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gym Type
                </label>
                <div className="mt-1">
                  <select
                    {...register("gymType", { required: "Gym type is required" })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a type</option>
                    <option value="Fitness Center">Fitness Center</option>
                    <option value="CrossFit Box">CrossFit Box</option>
                    <option value="Yoga Studio">Yoga Studio</option>
                    <option value="Martial Arts">Martial Arts</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gymType && (
                    <p className="mt-1 text-sm text-red-600">{errors.gymType.message}</p>
                  )}
                </div>
              </div>

              {/* Address Fields */}
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Gym Address
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    {...register("gymAddress.street", { required: "Street is required" })}
                    placeholder="Street"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    {...register("gymAddress.city", { required: "City is required" })}
                    placeholder="City"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <input
                    {...register("gymAddress.state", { required: "State is required" })}
                    placeholder="State"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    {...register("gymAddress.zipCode", { required: "ZIP code is required" })}
                    placeholder="ZIP Code"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div> 
                {/* <div className="mt-4">
                  <input
                    {...register("gymAddress.country", { required: "Country is required" })}
                    placeholder="Country"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div> */}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign up
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already a user?{" "}
              <button
                onClick={() => navigate("/signin")}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
