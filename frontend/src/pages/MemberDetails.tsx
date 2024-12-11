import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import MemberForm from "../components/MemberForm";
import AttendanceHistoryModal from "../components/AttendenceHistoryModal";
import { Member } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function MemberDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Fetch member details
  const { data: member } = useQuery<Member>(["member", id], () =>
    axios
      .get(`${API_URL}/members/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => res.data)
  );

  // Update member details
  const mutation = useMutation(
    (updatedMember: Partial<Member>) =>
      axios.patch(`${API_URL}/members/${id}`, updatedMember, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["member", id]);
        queryClient.invalidateQueries("members");
        navigate("/members");
      },
    }
  );

  const handleSubmit = (data: Partial<Member>) => mutation.mutate(data);

  if (!member) return null;

  return (
    <div className="flex-1 p-2">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Update Member</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          onClick={() => setIsHistoryModalOpen(true)}
        >
          View Attendance History
        </button>
      </div>

      {/* Member Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <MemberForm onSubmit={handleSubmit} initialData={member} />
      </div>

      {/* Modal for Attendance History */}
      <AttendanceHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        memberId={id}
      />
    </div>
  );
}

