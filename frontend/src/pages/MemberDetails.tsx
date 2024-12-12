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

  const handleSubmit = (data: Partial<Member>) => {
    const payload: Partial<Member> = {};

    // Check each field and add only modified fields to the payload
    if (data.name !== member?.name) payload.name = data.name;
    if (data.photo !== member?.photo) payload.photo = data.photo;
    if (data.phoneNumber !== member?.phoneNumber)
      payload.phoneNumber = data.phoneNumber;
    if (data.email !== member?.email) payload.email = data.email;
    if (data.weight !== member?.weight) payload.weight = data.weight;
    if (data.height !== member?.height) payload.height = data.height;
    if (data.trainerAssigned !== member?.trainerAssigned)
      payload.trainerAssigned = data.trainerAssigned;
    if (data.membershipType !== member?.membershipType)
      payload.membershipType = data.membershipType;
    if (data.durationMonths !== member?.durationMonths)
      payload.durationMonths = data.durationMonths;
    if (data.fees !== member?.fees) payload.fees = data.fees;
    if (data.feeStatus !== member?.feeStatus)
      payload.feeStatus = data.feeStatus;

    // Send payload only if there are changes
    if (Object.keys(payload).length > 0) {
      mutation.mutate(payload);
    } else {
      console.log("No changes detected. Update skipped.");
    }
  };

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
