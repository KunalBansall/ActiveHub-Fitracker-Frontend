import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Member } from '../types';
import MemberList from '../components/MemberList';
import React from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Members() {
  const { data: members, isLoading } = useQuery('members', () => {
      const token = localStorage.getItem('token');
      return axios.get(`${API_URL}/members`, {
          headers: {
              Authorization: `Bearer ${token}`,
          },
      }).then((res) => res.data);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        {/* <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-t-2 border-b-2 border-blue-500"></div> */}
        <LoadingSpinner size="xl" />
      </div>
    );
  }
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Members</h1>
        <Link
          to="/members/add"
          className="w-full sm:w-auto inline-flex justify-center items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add New Member
        </Link>
      </div>

      {members && <MemberList members={members} />}
    </div>
  );
}
