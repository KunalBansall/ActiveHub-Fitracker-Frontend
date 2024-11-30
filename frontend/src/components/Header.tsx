import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useQuery } from 'react-query';
import axios from 'axios';
import MobileMenu from './MobileMenu';
import React from 'react';
import { Link } from 'react-router-dom';

// Define the member type
interface Member {
  _id: string;
  name: string;
}
export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: searchResults } = useQuery(
    ['memberSearch', searchQuery],
    async () => {
      if (!searchQuery) return [];
      const response = await axios.get(`http://localhost:3000/api/members/search?query=${searchQuery}`);
      return response.data;
    },
    {
      enabled: searchQuery.length > 2,
    }
  );

  const handleSignOut = () => {
    setIsModalOpen(true); // Open the confirmation modal
  };

  const confirmSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/signin');
    setIsModalOpen(false); // Close the modal after confirming
  };

  const cancelSignOut = () => {
    setIsModalOpen(false); // Just close the modal if the user cancels
  };

  return (
    <header className="bg-white shadow">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Gym Name */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-bold text-blue-400">
              {user.gymName || 'ActiveHub'}
            </Link>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="Search members..."
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchResults && searchResults.length > 0 && (
                <div className="absolute mt-1 w-full rounded-md bg-white shadow-lg">
                  <ul className="max-h-60 overflow-auto rounded-md py-1 text-base">
                    {searchResults.map((member:Member) => (
                      <li
                        key={member._id}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                        onClick={() => {
                          navigate(`/members/${member._id}`);
                          setSearchQuery('');
                        }}
                      >
                        {member.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Sign Out */}
          <div>
            <button
              onClick={handleSignOut}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Are you sure you want to sign out?</h2>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelSignOut}
                className="bg-gray-200 text-gray-900 py-2 px-4 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmSignOut}
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
