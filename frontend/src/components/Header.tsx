import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import axios from "axios";
import MobileMenu from "./MobileMenu";

// Icons
import {
  MagnifyingGlassIcon,
  Bars3Icon,
  UserCircleIcon,
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
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

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

  const handleSignOut = () => {
    setIsModalOpen(true); // Open the modal when sign out is clicked
  };

  const confirmSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
    setIsModalOpen(false); // Close the modal after signing out
  };

  const handleOutsideClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    if (target.closest("#user-menu") || target.closest(".dropdown-menu")) {
      return;
    }

    setIsDropdownOpen(false);
    if (!target.closest(".search-input")) {
      setSearchQuery(""); // Clear search input when clicking outside
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex">
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex-shrink-0 flex items-center bg-opacity-85 z-10">
              <Link
                to="/"
                className="text-xl font-bold text-blue-600 
               text-shadow-2xl 
               transform 
               hover:scale-105 
               transition-transform duration-300 ease-in-out"
              >
                {user.gymName || "ActiveHub"}
              </Link>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex md:space-x-4 ml-5">
            <Link
              to="/"
              className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium                text-shadow-2xl transform 
               hover:scale-105 
               transition-transform duration-300 ease-in-out
"
            >
              Dashboard
            </Link>
            <Link
              to="/members"
              className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium                text-shadow-2xl transform 
               hover:scale-105 
               transition-transform duration-300 ease-in-out
"
            >
              Members
            </Link>
          </nav>

          {/* Search Box in the center */}
          <div
            className="flex-1 flex justify-center mt-1 transform 
               hover:scale-105 
               transition-transform duration-300 ease-in-out text-shadow-2xl z-10"
          >
            <div className="relative w-full max-w-2xl">
              <input
                type="text"
                placeholder="Search members..."
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 placeholder-gray-500 focus:border-blue-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm search-input z-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              {searchResults && searchResults.length > 0 && (
                <div className="absolute mt-1 w-full rounded-md bg-opacity-85 bg-white shadow-lg z-10">
                  <ul className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm ">
                    {searchResults.map((member: Member) => (
                      <li
                        key={member._id}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50"
                        onClick={() => {
                          navigate(`/members/${member._id}`);
                          setSearchQuery("");
                        }}
                      >
                        <div className="flex items-center">
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="h-6 w-6 flex-shrink-0 rounded-full"
                          />
                          <span className="ml-3 block truncate font-normal">
                            {member.name}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* User profile and sign-out */}
          <div
            className="ml-4 relative flex-shrink-0 transform 
               hover:scale-105 
               transition-transform duration-300 ease-in-out text-shadow-2xl z-10"
          >
            <div>
              <button
                type="button"
                className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-opacity-85 shadow-lg "
                id="user-menu"
                aria-expanded="false"
                aria-haspopup="true"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="sr-only">Open user menu</span>
                {user.photo ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user.photo}
                    alt=""
                  />
                ) : (
                  <UserCircleIcon
                    className="h-8 w-8 text-gray-400"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
            {isDropdownOpen && (
              <div
                className="origin-top-right absolute right-0 mt-2 w-48 rounded-md py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none dropdown-menu bg-opacity-85  shadow-lg z-10"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu"
              >
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Your Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      {isModalOpen && (
        <div
          className="fixed z-10 inset-0 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Modal content */}
        </div>
      )}
    </header>
  );
}
