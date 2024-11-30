import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useForm } from "react-hook-form";
import React from "react";

interface SignInForm {
  email: string;
  password: string;
}

export default function SignIn() {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInForm>();

  const onSubmit = async (data: SignInForm) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/signin",
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
      className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      style={{
        backgroundImage: "url(/Activehub04.jpeg)",
        backgroundSize: "fit", // Ensures the entire image fits within the div
        // backgroundRepeat: 'no-repeat', // Prevents the image from repeating
        backgroundPosition: "center", // Centers the image
      }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* <div className="flex justify-center">
          <svg className="h-12 w-12 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 6v8h-2V6h2zm4.5-4H6.5C5.12 2 4 3.12 4 4.5v15C4 20.88 5.12 22 6.5 22h11c1.38 0 2.5-1.12 2.5-2.5v-15C20 3.12 18.88 2 17.5 2zM18 19.5c0 .28-.22.5-.5.5h-11c-.28 0-.5-.22-.5-.5v-15c0-.28.22-.5.5-.5h11c.28 0 .5.22.5.5v15z" />
          </svg>
        </div> */}
        <h2 className="mt-4 text-center text-4xl font-extrabold text-white text-outline">
          Sign in to ActiveHub
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white bg-opacity-50 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
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
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Not a user?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
