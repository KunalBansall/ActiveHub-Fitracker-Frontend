import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Member } from '../types';
import MemberList from '../components/MemberList';
import React from 'react';

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
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Members</h1>
        <Link
          to="/members/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Member
        </Link>
      </div>

      {members && <MemberList members={members} />}
    </div>
  );
}
