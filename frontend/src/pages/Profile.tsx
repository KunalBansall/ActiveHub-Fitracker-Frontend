import { useQuery } from 'react-query';
import axios from 'axios';
import React from 'react';

const API_URL = import.meta.env.VITE_API_URL ;

// Define TypeScript types for the profile data
interface GymAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface AdminProfile {
  username: string;
  email: string;
  gymName: string;
  gymType: string;
  gymAddress: GymAddress;
}

export default function Profile() {
//   const token = localStorage.getItem('token');
  const token = localStorage.getItem('token');
if (!token) {
  // Handle the case where the token is missing
  return <p className="text-red-500">Authentication required</p>;
}


  // Fetch admin profile
  const { data: profile, isLoading, isError, error } = useQuery<AdminProfile | undefined>('adminProfile', async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      throw err; // Re-throw the error to be caught by react-query
    }
  });
  

  if (isLoading) {
    return <p className="text-gray-700">Loading profile...</p>;
  }

  if (isError) {
    return (
      <div className="text-red-500">
        Error fetching profile: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (!profile) {
    return <p className="text-red-500">Profile not found</p>;
  }

  return (
    <div className="flex-1 p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Admin Profile</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-medium text-gray-900 mb-4">Profile Information</h2>

        <div className="space-y-4">
          <div>
            <span className="font-semibold text-gray-700">Username:</span> {profile.username}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Email:</span> {profile.email}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Gym Name:</span> {profile.gymName}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Gym Type:</span> {profile.gymType}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Gym Address:</span>
            <ul className="pl-4">
              <li>Street: {profile.gymAddress?.street}</li>
              <li>City: {profile.gymAddress?.city}</li>
              <li>State: {profile.gymAddress?.state}</li>
              <li>Zip Code: {profile.gymAddress?.zipCode}</li>
              <li>Country: {profile.gymAddress?.country}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={() => alert('Edit functionality coming soon!')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}
