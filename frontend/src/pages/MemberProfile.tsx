import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Member } from "../types";
import { useForm } from "react-hook-form";
import {
  MagnifyingGlassIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import AttendanceHistoryModal from "../components/AttendenceHistoryModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/diy7wynvw/image/upload";
const UPLOAD_PRESET = "ActiveHub";

const MemberProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<Partial<Member>>({
    defaultValues: member || undefined,
  });

  useEffect(() => {
    const fetchMember = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No token found, please log in.");
        navigate("/memberlogin");
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${API_URL}/member-auth/member/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setMember(response.data);
        setPhotoPreview(response.data.photo);
        reset(response.data);
      } catch (error: any) {
        toast.error(
          error.response?.data.message || "Failed to fetch member data"
        );
        navigate("/memberlogin");
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id, navigate, reset]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    toast.success("Signed out successfully");
    navigate("/memberlogin");
  };

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      try {
        const response = await axios.post(CLOUDINARY_URL, formData);
        setPhotoPreview(response.data.secure_url);
      } catch (error) {
        toast.error("Failed to upload the image. Please try again.");
      }
    }
  };

  const handleSave = async (data: Partial<Member>) => {
    try {
      setLoading(true);
      const updatedData = { ...data, photo: photoPreview };

      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${API_URL}/member-auth/member/${id}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(response.data.message || "Member updated successfully");
      setIsEditing(false);
      // Refresh member data after successful update
      const updatedMember = await axios.get(`${API_URL}/member-auth/member/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMember(updatedMember.data);
      reset(updatedMember.data);
    } catch (error: any) {
      const rawMessage =
        error.response?.data.error || error.response?.data.message;

      if (rawMessage?.includes("E11000")) {
        const match = rawMessage.match(/dup key: { (\w+): "(.*?)" }/);
        const field = match?.[1];
        const value = match?.[2];

        if (field && value) {
          toast.error(
            `${
              field.charAt(0).toUpperCase() + field.slice(1)
            } "${value}" is already registered.`
          );
        } else {
          toast.error("Duplicate value detected. Please use unique data.");
        }
      } else {
        toast.error(rawMessage || "Failed to update member");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !member) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: "url(/Activehub04.jpeg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-4xl w-full space-y-8 bg-white bg-opacity-90 p-8 rounded-xl shadow-2xl">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-extrabold text-blue-600">
            {member?.name || "Member Profile"}
          </h1>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
            Sign Out
          </button>
        </div>

        {member && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8">
              <div className="relative">
                <img
                  src={photoPreview || "https://via.placeholder.com/150"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover"
                />
                <label className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors">
                  <PencilIcon className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex-grow">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {member.name}
                </h2>
                <p className="text-gray-600">{member.email}</p>
                <p className="text-gray-600">{member.phoneNumber}</p>
                <p className="mt-2 text-sm text-gray-500">
                  Member since:{" "}
                  {new Date(member.membershipStartDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(member).map(([key, value]) => {
                  if (
                    [
                      "name",
                      "email",
                      "phoneNumber",
                      "membershipType",
                      "membershipStartDate",
                      "membershipEndDate",
                      "durationMonths",
                      "feeStatus",
                      "fees",
                    ].includes(key)
                  ) {
                    const isEditable = [
                      "name",
                      "email",
                      "phoneNumber",
                      "membershipType",
                    ].includes(key);
                    return (
                      <div key={key}>
                        <label
                          htmlFor={key}
                          className="block text-sm font-medium text-gray-700 capitalize"
                        >
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </label>
                        <input
                          id={key}
                          {...register(key as keyof Member)}
                          disabled={!isEditing || !isEditable}
                          className={`mt-1 block w-full rounded-md shadow-sm ${
                            isEditing && isEditable
                              ? "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              : "bg-gray-100 border-gray-300 text-gray-500"
                          }`}
                          defaultValue={
                            key.includes("Date")
                              ? new Date(value as string).toLocaleDateString()
                              : value
                          }
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              <div className="flex justify-end space-x-4">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSubmit(handleSave)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <CheckIcon className="w-5 h-5 mr-2" />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        reset(member); // Reset form to original values
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <XMarkIcon className="w-5 h-5 mr-2" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
            </form>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Attendance
              </h3>
              <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {member.attendance && member.attendance.length > 0 ? (
                    member.attendance.slice(0, 5).map((entry, index) => {
                      const entryDate = new Date(entry.entryTime);
                      return (
                        <li key={index} className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-blue-600 truncate">
                              {entryDate.toLocaleDateString()}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {entry.exitTime
                                  ? "Completed"
                                  : "In Progress"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                Entry: {entryDate.toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <p>
                                Exit:{" "}
                                {entry.exitTime
                                  ? new Date(
                                      entry.exitTime
                                    ).toLocaleTimeString()
                                  : "Still Inside"}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })
                  ) : (
                    <li className="px-4 py-4 sm:px-6 text-gray-500">
                      No recent attendance records
                    </li>
                  )}
                </ul>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View Full History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {isHistoryModalOpen && member && (
        <AttendanceHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          attendance={member.attendance}
        />
      )}
    </div>
  );
};

export default MemberProfile;

