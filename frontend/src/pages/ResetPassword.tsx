import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { EyeIcon, EyeSlashIcon, LockClosedIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ResetPassword: React.FC = () => {
  const { id, token } = useParams<{ id: string; token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isMemberReset = location.search.includes('member=true');
  
  const themeColor = isMemberReset ? 'green' : 'blue';
  const gradientClasses = isMemberReset 
    ? 'from-green-500 to-blue-700' 
    : 'from-blue-500 to-purple-700';
  const buttonClasses = isMemberReset
    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
  const linkClasses = isMemberReset
    ? 'text-green-600 hover:text-green-500'
    : 'text-blue-600 hover:text-blue-500';
  const ringFocusClasses = isMemberReset
    ? 'focus:ring-green-500 focus:border-green-500'
    : 'focus:ring-blue-500 focus:border-blue-500';
  const badgeClasses = isMemberReset
    ? 'bg-green-100 text-green-800'
    : 'bg-blue-100 text-blue-800';
  const borderClasses = isMemberReset
    ? 'border-green-500'
    : 'border-blue-500';

  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/reset-password/${id}/${token}`, {
        password: newPassword,
      });

      if (response.data.Status === "Success" || response.status === 200) {
        toast.success(response.data.message || "Password reset successful");
        setIsSuccess(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data.message || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !id) {
      toast.error("Invalid or expired reset link");
      navigate(isMemberReset ? "/reset-password?member=true" : "/forgot-password");
    }
  }, [token, id, navigate, isMemberReset]);

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Login type selector */}
      <div className="fixed top-0 left-0 right-0 z-10 flex justify-center p-3 bg-gray-50 shadow-md">
        <div className="inline-flex rounded-lg">
          <button
            onClick={() => navigate('/signin')}
            className={`relative inline-flex items-center justify-center px-6 py-2.5 font-medium ${!isMemberReset ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-gray-700 bg-gray-200 hover:bg-gray-300'} transition-all duration-200 ease-in-out rounded-l-lg focus:outline-none`}
          >
            <span className="relative text-sm">Admin Access</span>
          </button>
          <button
            onClick={() => navigate('/memberlogin')}
            className={`relative inline-flex items-center justify-center px-6 py-2.5 font-medium ${isMemberReset ? 'text-white bg-green-600 hover:bg-green-700' : 'text-gray-700 bg-gray-200 hover:bg-gray-300'} transition-all duration-200 ease-in-out rounded-r-lg focus:outline-none`}
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
                className={`w-20 h-20 rounded-full object-cover border-2 ${borderClasses}`}
              />
            </div>
            
            <div className="mb-6 flex items-center justify-center">
              <span className={`inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-semibold ${badgeClasses}`}>
                {isMemberReset ? 'MEMBER PASSWORD RESET' : 'ADMIN PASSWORD RESET'}
              </span>
            </div>
            
            {!isSuccess ? (
              <>
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Reset Password</h2>
                <p className="text-center text-gray-600 mb-8">Enter your new password below</p>
                
                <form className="space-y-6" onSubmit={handleReset}>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="h-5 w-5 text-gray-400 absolute top-1/2 -translate-y-1/2 left-3" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className={`pl-10 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${ringFocusClasses}`}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 hover:text-gray-600"
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
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="h-5 w-5 text-gray-400 absolute top-1/2 -translate-y-1/2 left-3" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className={`pl-10 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${ringFocusClasses}`}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 hover:text-gray-600"
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
                      disabled={!newPassword || !confirmPassword || loading || newPassword !== confirmPassword}
                      className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white ${buttonClasses} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200`}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Resetting...
                        </>
                      ) : (
                        "Reset Password"
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <div className={`mx-auto w-16 h-16 flex items-center justify-center bg-${themeColor}-100 text-${themeColor}-600 rounded-full mb-6`}>
                  <ShieldCheckIcon className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Reset Successful</h2>
                <p className="text-gray-600 mb-6">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
                <button
                  onClick={() => navigate(isMemberReset ? '/memberlogin' : '/signin')}
                  className={`px-4 py-2 border border-transparent rounded-md text-white ${buttonClasses} focus:outline-none focus:ring-2 focus:ring-offset-2 text-base font-medium`}
                >
                  Go to Login
                </button>
              </div>
            )}

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Remembered your password?{" "}
                <button
                  onClick={() => navigate(isMemberReset ? '/memberlogin' : '/memberlogin')}
                  className={`font-medium ${linkClasses}`}
                >
                  Sign In
                </button>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right side - Image/Branding (hidden on very small screens) */}
        <div className={`hidden sm:flex sm:w-1/2 bg-gradient-to-br ${gradientClasses} text-white flex-col justify-center items-center p-8`}>
          <div className="max-w-md mx-auto text-center">
            <img 
              src="/Activehub04.jpeg" 
              alt="ActiveHub" 
              className="w-32 h-32 mx-auto mb-8 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <h1 className="text-4xl font-bold mb-6">Reset Your Password</h1>
            <p className="text-xl opacity-90 mb-8">Enter a new secure password for your account to keep your data safe.</p>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3">
                  <ShieldCheckIcon className="h-8 w-8" />
                </div>
                <p className="text-lg font-medium">Security Tips</p>
              </div>
              <ul className="text-sm opacity-90 space-y-2 text-left">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Use at least 8 characters</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Include numbers and special characters</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Mix uppercase and lowercase letters</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Don't reuse passwords from other sites</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
