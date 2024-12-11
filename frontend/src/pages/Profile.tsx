'use client'

import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from "react-query";
import axios from "axios";
import { useState } from "react";
import { PencilIcon, CheckIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL;

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

const queryClient = new QueryClient();

export default function ProfilePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <Profile />
    </QueryClientProvider>
  );
}

function Profile() {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("user") || "{}") : {};
  const [formData, setFormData] = useState<AdminProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading, isError, error } = useQuery<AdminProfile | undefined>(
    "adminProfile",
    async () => {
      const response = await axios.get(`${API_URL}/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    {
      enabled: !!token,
    }
  );

  const mutation = useMutation(
    async (updatedProfile: Partial<AdminProfile>) => {
      const response = await axios.put(
        `${API_URL}/admin/profile`,
        updatedProfile,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    {
      onSuccess: (updatedProfile) => {
        const updatedUser = { ...user, gymName: updatedProfile.gymName };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        queryClient.invalidateQueries("adminProfile");
        setIsEditing(false);
      },
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("gymAddress.")) {
      const field = name.split(".")[1] as keyof GymAddress;
      setFormData((prev) => prev ? {
        ...prev,
        gymAddress: { ...prev.gymAddress, [field]: value },
      } : null);
    } else {
      setFormData((prev) => prev ? { ...prev, [name]: value } : null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      mutation.mutate(formData);
    }
  };

  if (!token) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto mt-8">
        <p className="text-red-500">Authentication required</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto mt-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto mt-8">
        <p className="text-red-500">
          Error fetching profile: {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto mt-8">
        <p className="text-red-500">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="bg-white rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
            <UserCircleIcon className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData?.username || profile.username}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData?.email || profile.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gym Name</label>
                <input
                  type="text"
                  name="gymName"
                  value={formData?.gymName || profile.gymName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gym Type</label>
                <select
                  name="gymType"
                  value={formData?.gymType || profile.gymType}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="CrossFit">CrossFit</option>
                  <option value="Yoga">Yoga</option>
                  <option value="Weightlifting">Weightlifting</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gym Address</label>
                <div className="space-y-2 mt-1">
                  <input
                    type="text"
                    name="gymAddress.street"
                    placeholder="Street"
                    value={formData?.gymAddress?.street || profile.gymAddress.street}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  <input
                    type="text"
                    name="gymAddress.city"
                    placeholder="City"
                    value={formData?.gymAddress?.city || profile.gymAddress.city}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  <input
                    type="text"
                    name="gymAddress.state"
                    placeholder="State"
                    value={formData?.gymAddress?.state || profile.gymAddress.state}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  <input
                    type="text"
                    name="gymAddress.zipCode"
                    placeholder="Zip Code"
                    value={formData?.gymAddress?.zipCode || profile.gymAddress.zipCode}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  <input
                    type="text"
                    name="gymAddress.country"
                    placeholder="Country"
                    value={formData?.gymAddress?.country || profile.gymAddress.country}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {isEditing ? (
              <div className="flex justify-end space-x-2">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFormData(profile);
                  setIsEditing(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

