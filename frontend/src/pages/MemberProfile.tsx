import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface Member {
  name: string;
  email: string;
  phone: string;
  age: number;
}

const MemberProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch member data
  useEffect(() => {
    const fetchMember = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/members/${id}`);
        setMember(response.data);
      } catch (error: any) {
        toast.error(error.response?.data.message || "Failed to fetch member data");
        navigate("/"); // Redirect to home if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id, navigate]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (member) {
      setMember({ ...member, [e.target.name]: e.target.value });
    }
  };

  // Save updates
  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_URL}/members/${id}`, member);
      toast.success(response.data.message || "Member updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data.message || "Failed to update member");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !member) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12">
      <h1 className="text-3xl font-bold mb-6">Member Profile</h1>
      {member ? (
        <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={member.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={member.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                name="phone"
                value={member.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input
                type="number"
                name="age"
                value={member.age}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600"
                  disabled={loading}
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md shadow hover:bg-gray-600"
                  disabled={loading}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-md shadow hover:bg-green-600"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      ) : (
        <p>Member not found</p>
      )}
    </div>
  );
};

export default MemberProfile;
