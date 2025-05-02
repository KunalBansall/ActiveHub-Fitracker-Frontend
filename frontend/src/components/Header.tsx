import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import MobileMenu from "./MobileMenu";
import { toast } from "react-hot-toast";

const defaultImage = "/ah2.jpeg";
const gymLogo = "/Activehub04.jpeg"; // Gym photo for header

// Icons
import {
  MagnifyingGlassIcon,
  Bars3Icon,
  UserCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  BellIcon
} from "@heroicons/react/24/outline";

// Define the member type, including the photo field
interface Member {
  _id: string;
  name: string;
  photo: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const mouseTimeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // Attendance entry mutation
  const entryMutation = useMutation(
    (memberId: string) =>
      axios.post(`${API_URL}/attendance/entry/${memberId}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("todayAttendance");
        toast.success("Entry recorded successfully");
      },
      onError: (error: any) => {
        // Handle specific error messages from backend
        if (error.response) {
          const errorMsg = error.response.data.message;
          if (errorMsg === "Already active session" || errorMsg.includes("already active")) {
            toast.error("Member already has an active session");
          } else {
            toast.error(errorMsg || "Failed to record entry");
          }
        } else {
          toast.error("Network error. Please try again.");
        }
      }
    }
  );

  // Attendance exit mutation
  const exitMutation = useMutation(
    (memberId: string) =>
      axios.post(`${API_URL}/attendance/exit/${memberId}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("todayAttendance");
        toast.success("Exit recorded successfully");
      },
      onError: (error: any) => {
        // Handle specific error messages from backend
        if (error.response) {
          const errorMsg = error.response.data.message;
          if (errorMsg === "No active session" || errorMsg.includes("no active")) {
            toast.error("Member does not have an active session");
          } else {
            toast.error(errorMsg || "Failed to record exit");
          }
        } else {
          toast.error("Network error. Please try again.");
        }
      }
    }
  );

  const { data: searchResults } = useQuery(
    ["memberSearch", searchQuery],
    async () => {
      if (!searchQuery) return [];

      const response = await axios.get(
        `${API_URL}/members/search?query=${searchQuery}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    {
      enabled: searchQuery.length > 2,
    }
  );

  const handleMarkEntry = (memberId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    entryMutation.mutate(memberId);
  };

  const handleMarkExit = (memberId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    exitMutation.mutate(memberId);
  };

  // Function to show search results
  const showResults = () => {
    // Clear any existing timeout
    if (mouseTimeoutRef.current) {
      clearTimeout(mouseTimeoutRef.current);
      mouseTimeoutRef.current = null;
    }
    setShowSearchResults(true);
  };

  // Function to hide search results with delay
  const hideResults = () => {
    // Set a timeout before hiding results
    if (mouseTimeoutRef.current) {
      clearTimeout(mouseTimeoutRef.current);
    }
    mouseTimeoutRef.current = setTimeout(() => {
      setShowSearchResults(false);
    }, 300); // 300ms delay
  };

  const handleSearchFocus = () => {
    if (searchResults && searchResults.length > 0) {
      showResults();
    }
  };

  const handleSignOut = () => {
    setIsModalOpen(true);
  };

  const confirmSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
    setIsModalOpen(false);
  };

  const handleOutsideClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // Don't hide dropdown on clicks inside user menu or dropdown
    if (target.closest("#user-menu") || target.closest(".dropdown-menu")) {
      return;
    }

    setIsDropdownOpen(false);
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
    };
  }, []);

  // Set up event listeners for search and search results
  useEffect(() => {
    const searchElement = searchRef.current;
    const resultsElement = searchResultsRef.current;

    // Add event listeners to search container
    if (searchElement) {
      searchElement.addEventListener('mouseenter', showResults);
      searchElement.addEventListener('mouseleave', hideResults);
    }

    // Add event listeners to search results if they exist
    if (resultsElement) {
      resultsElement.addEventListener('mouseenter', showResults);
      resultsElement.addEventListener('mouseleave', hideResults);
    }

    return () => {
      // Clean up event listeners
      if (searchElement) {
        searchElement.removeEventListener('mouseenter', showResults);
        searchElement.removeEventListener('mouseleave', hideResults);
      }
      if (resultsElement) {
        resultsElement.removeEventListener('mouseenter', showResults);
        resultsElement.removeEventListener('mouseleave', hideResults);
      }
    };
  }, [searchRef, searchResultsRef]);

  // Update search results visibility when results change
  useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      const isInputFocused = document.activeElement === searchRef.current?.querySelector('input');
      if (isInputFocused) {
        showResults();
    }
    } else {
      setShowSearchResults(false);
    }
  }, [searchResults]);

  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between h-16 items-center">
          {/* Left section: Logo and mobile menu */}
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex-shrink-0 flex items-center ml-2 sm:ml-0">
              <Link
                to="/"
                className="flex items-center text-base sm:text-xl font-bold text-blue-600 transition-transform duration-200 hover:scale-105"
              >
                <img
                  src={gymLogo}
                  alt="ActiveHub"
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full mr-2 object-cover"
                />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden sm:inline">
                {user.gymName || "ActiveHub"}
                </span>
              </Link>
            </div>
          </div>

          {/* Center: Search Box */}
          <div className="search-container flex-1 max-w-xl mx-auto px-2 sm:px-4" ref={searchRef}>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search members..."
                className="w-full rounded-full border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              
              {showSearchResults && searchResults && searchResults.length > 0 && (
                <div 
                  ref={searchResultsRef}
                  className="search-results absolute mt-2 w-full rounded-lg bg-white shadow-lg z-50 overflow-hidden border border-gray-200"
                >
                  <div className="py-2 px-3 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-medium text-gray-500">
                      {searchResults.length} member{searchResults.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  <ul className="max-h-80 overflow-auto py-1">
                    {searchResults.map((member: Member) => (
                      <li
                        key={member._id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                      >
                        <div 
                          className="px-4 py-3"
                        onClick={() => {
                          navigate(`/members/${member._id}`);
                            setShowSearchResults(false);
                        }}
                      >
                          <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <img
                            src={member.photo || defaultImage}
                            alt={member.name}
                                className="h-8 w-8 flex-shrink-0 rounded-full object-cover border border-gray-200"
                          />
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500">ID: {member._id.substring(0, 8)}...</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => handleMarkEntry(member._id, e)}
                              className="flex-1 flex items-center justify-center text-xs bg-green-50 hover:bg-green-100 text-green-700 font-medium px-3 py-1.5 rounded-md transition-colors duration-150"
                              disabled={entryMutation.isLoading}
                            >
                              {entryMutation.isLoading && entryMutation.variables === member._id ? (
                                <span className="inline-block animate-spin h-3 w-3 border-2 border-green-700 border-t-transparent rounded-full mr-1"></span>
                              ) : (
                                <ArrowRightIcon className="h-3.5 w-3.5 mr-1" />
                              )}
                              Check In
                            </button>
                            <button
                              onClick={(e) => handleMarkExit(member._id, e)}
                              className="flex-1 flex items-center justify-center text-xs bg-red-50 hover:bg-red-100 text-red-700 font-medium px-3 py-1.5 rounded-md transition-colors duration-150"
                              disabled={exitMutation.isLoading}
                            >
                              {exitMutation.isLoading && exitMutation.variables === member._id ? (
                                <span className="inline-block animate-spin h-3 w-3 border-2 border-red-700 border-t-transparent rounded-full mr-1"></span>
                              ) : (
                                <ArrowLeftIcon className="h-3.5 w-3.5 mr-1" />
                              )}
                              Check Out
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right: Navigation links, notifications, and profile */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            {/* Nav links - visible only on medium screens and above */}
            <nav className="hidden md:flex md:space-x-4">
              <Link
                to="/"
                className="border-transparent text-gray-600 hover:text-blue-600 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200"
              >
                Dashboard
              </Link>
              <Link
                to="/members"
                className="border-transparent text-gray-600 hover:text-blue-600 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200"
              >
                Members
              </Link>
              <Link
                to="/attendance"
                className="border-transparent text-gray-600 hover:text-blue-600 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200"
              >
                Attendance
              </Link>
            </nav>
            
            {/* Notifications */}
            <button
              type="button"
              className="relative p-1.5 rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none transition-colors duration-200"
            >
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">3</span>
              <BellIcon className="h-5 w-5" />
            </button>

            {/* User profile */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                id="user-menu"
                aria-expanded="false"
                aria-haspopup="true"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="sr-only">Open user menu</span>
                {user.photo ? (
                  <img
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border-2 border-gray-200"
                    src={user.photo}
                    alt=""
                  />
                ) : (
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCircleIcon
                      className="h-6 w-6 text-blue-500"
                    aria-hidden="true"
                  />
                  </div>
                )}
              </button>
              
            {isDropdownOpen && (
              <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none dropdown-menu z-50"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu"
              >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.name || "Admin User"}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email || "admin@example.com"}</p>
                  </div>
                <Link
                  to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  role="menuitem"
                >
                  Your Profile
                </Link>
                <Link
                  to="/subscription"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  role="menuitem"
                >
                  Subscription
                </Link>
                <Link
                  to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  role="menuitem"
                >
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                  role="menuitem"
                >
                  Sign out
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      {/* Sign out confirmation modal */}
      {isModalOpen && (
        <div
          className="fixed z-[90] inset-0 overflow-y-auto flex items-center justify-center bg-black bg-opacity-50 p-4"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm"
          >
            <h3
              className="text-lg font-semibold mb-3 text-gray-900"
              id="modal-title"
            >
              Confirm Sign Out
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to sign out? You will need to log in again
              to access your account.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium transition-colors duration-150"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors duration-150"
                onClick={confirmSignOut}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
