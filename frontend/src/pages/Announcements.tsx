import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import toast from "react-hot-toast";
import AnnouncementForm from "../components/AnnouncementForm";
import AnnouncementList from "../components/AnnouncementList";
import LoadingSpinner from "../components/LoadingSpinner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Announcements: React.FC = () => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch announcements
  const {
    data: announcements,
    isLoading,
    isError,
    error,
  } = useQuery("announcements", async () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token;
    const response = await axios.get(`${API_URL}/announcements`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  });

  // Mutations for CRUD operations
  const createMutation = useMutation(
    async (formData: any) => {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const response = await axios.post(
        `${API_URL}/announcements`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("announcements");
        toast.success("Announcement created successfully!");
        setIsFormOpen(false);
        setSelectedAnnouncement(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to create announcement");
      },
    }
  );

  const updateMutation = useMutation(
    async (formData: any) => {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const response = await axios.put(
        `${API_URL}/announcements/${formData._id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("announcements");
        toast.success("Announcement updated successfully!");
        setIsFormOpen(false);
        setSelectedAnnouncement(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to update announcement");
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      await axios.delete(`${API_URL}/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("announcements");
        toast.success("Announcement deleted successfully!");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to delete announcement");
      },
    }
  );

  const handleSubmit = (formData: any) => {
    if (selectedAnnouncement) {
      updateMutation.mutate({ ...formData, _id: selectedAnnouncement._id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setSelectedAnnouncement(null);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setSelectedAnnouncement(null);
    setIsFormOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-500">
        Error: {(error as any)?.message || "Failed to load announcements"}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Gym Announcements
        </h1>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition duration-200"
        >
          + Add New Announcement
        </button>
      </div>

      {isFormOpen ? (
        <AnnouncementForm
          announcement={selectedAnnouncement}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      ) : (
        <AnnouncementList
          announcements={announcements || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default Announcements; 