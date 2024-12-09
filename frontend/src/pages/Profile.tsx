import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import React, { useState } from "react";

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

export default function Profile() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}"); // Retrieve user from localStorage

  if (!token) {
    return <p className="text-red-500">Authentication required</p>;
  }

  const queryClient = useQueryClient();

  // Fetch admin profile
  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery<AdminProfile | undefined>("adminProfile", async () => {
    const response = await axios.get(`${API_URL}/admin/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  });

  // State for editable fields
  const [formData, setFormData] = useState<AdminProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Mutation for updating the profile
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
        // Update localStorage user with the new gymName
        const updatedUser = { ...user, gymName: updatedProfile.gymName };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        queryClient.invalidateQueries("adminProfile"); // Refetch profile data
        setIsEditing(false); // Exit editing mode
      },
    }
  );

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("gymAddress.")) {
      const field = name.split(".")[1]; // Extract "street", "city", etc.
      setFormData((prev) =>
        prev
          ? { ...prev, gymAddress: { ...prev.gymAddress, [field]: value } }
          : null
      );
    } else {
      setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      mutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <p className="text-gray-700">Loading profile...</p>;
  }

  if (isError) {
    return (
      <div className="text-red-500">
        Error fetching profile:{" "}
        {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  if (!profile) {
    return <p className="text-red-500">Profile not found</p>;
  }

  return (
    <div className="flex-1 p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">
        Admin Profile
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-medium text-gray-900 mb-4">
          Profile Information
        </h2>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold text-gray-700">
                Username:
              </label>
              <input
                type="text"
                name="username"
                value={formData?.username || ""}
                onChange={handleChange}
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700">
                Email:
              </label>
              <input
                type="email"
                name="email"
                value={formData?.email || ""}
                onChange={handleChange}
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700">
                Gym Name:
              </label>
              <input
                type="text"
                name="gymName"
                value={formData?.gymName || ""}
                onChange={handleChange}
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700">
                Gym Type:
              </label>
              <input
                type="text"
                name="gymType"
                value={formData?.gymType || ""}
                onChange={handleChange}
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700">
                Gym Address:
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  name="gymAddress.street"
                  placeholder="Street"
                  value={formData?.gymAddress?.street || ""}
                  onChange={handleChange}
                  className="mt-1 p-2 border rounded w-full"
                />
                <input
                  type="text"
                  name="gymAddress.city"
                  placeholder="City"
                  value={formData?.gymAddress?.city || ""}
                  onChange={handleChange}
                  className="mt-1 p-2 border rounded w-full"
                />
                <input
                  type="text"
                  name="gymAddress.state"
                  placeholder="State"
                  value={formData?.gymAddress?.state || ""}
                  onChange={handleChange}
                  className="mt-1 p-2 border rounded w-full"
                />
                <input
                  type="text"
                  name="gymAddress.zipCode"
                  placeholder="Zip Code"
                  value={formData?.gymAddress?.zipCode || ""}
                  onChange={handleChange}
                  className="mt-1 p-2 border rounded w-full"
                />
                <input
                  type="text"
                  name="gymAddress.country"
                  placeholder="Country"
                  value={formData?.gymAddress?.country || ""}
                  onChange={handleChange}
                  className="mt-1 p-2 border rounded w-full"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mt-4"
            >
              Save Changes
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="font-semibold text-gray-700">Username:</span>{" "}
              {profile.username}
            </div>
            <div>
              <span className="font-semibold text-gray-700">Email:</span>{" "}
              {profile.email}
            </div>
            <div>
              <span className="font-semibold text-gray-700">Gym Name:</span>{" "}
              {profile.gymName}
            </div>
            <div>
              <span className="font-semibold text-gray-700">Gym Type:</span>{" "}
              {profile.gymType}
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
        )}
        <button
          onClick={() => {
            setFormData(profile); // Initialize formData
            setIsEditing(!isEditing);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mt-4"
        >
          {isEditing ? "Cancel" : "Editz Profile"}
        </button>
      </div>
    </div>
  );
}
