import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import MemberForm from "../components/MemberForm";
import AttendanceHistoryModal from "../components/AttendenceHistoryModal";
import ExtendMembershipModal from "../components/ExtendMemberShipModal";
import { Member } from "../types";
import { Button } from "@material-tailwind/react";
import { toast } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function MemberDetails() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);

  // Fetch member details
  const { data: member, isLoading } = useQuery<Member>(["member", id], () =>
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
        // navigate("/members");
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
    if (data.slot !== member?.slot)
      payload.slot = data.slot;
    if (data.fees !== member?.fees) payload.fees = data.fees;
    if (data.feeStatus !== member?.feeStatus)
      payload.feeStatus = data.feeStatus;
    
    // Check if membershipEndDate has changed and add it to the payload
    if (data.membershipEndDate && data.membershipEndDate !== member?.membershipEndDate) {
      payload.membershipEndDate = data.membershipEndDate;
    }
    
    // For backward compatibility - calculate end date if duration has changed
    // This can be removed once the application fully transitions to using end date directly
    if (data.durationMonths !== member?.durationMonths) {
      payload.durationMonths = data.durationMonths;
      
      // Only calculate end date from duration if membershipEndDate wasn't directly set
      if (!payload.membershipEndDate) {
        const currentEndDate = member?.membershipEndDate
          ? new Date(member.membershipEndDate)
          : new Date();
        const newEndDate = new Date(
          currentEndDate.setMonth(
            currentEndDate.getMonth() +
              (payload.durationMonths! - (member?.durationMonths || 0))
          )
        );
        payload.membershipEndDate = newEndDate.toISOString();
      }
    }

    // Send payload only if there are changes
    if (Object.keys(payload).length > 0) {
      mutation.mutate(payload);
    } else {
      console.log("No changes detected. Update skipped.");
    }
  };

  const handleExtendMembership = (extensionMonths: number) => {
    if (member) {
      const updatedDuration = (member.durationMonths || 0) + extensionMonths;

      // Calculate the new membership end date
      const currentEndDate = member.membershipEndDate
        ? new Date(member.membershipEndDate)
        : new Date();
      const newEndDate = new Date(
        currentEndDate.setMonth(currentEndDate.getMonth() + extensionMonths)
      );

      // Format the expiration date to display only the month and year
      const options = { year: "numeric", month: "long" } as const;
      const formattedDate = newEndDate.toLocaleDateString(undefined, options);

      // Show toast notification
      toast.success(
        `${member.name}'s membership extended till ${formattedDate}!`
      );

      // Update member details
      handleSubmit({ durationMonths: updatedDuration });
    }

    setIsExtendModalOpen(false);
  };

  if (isLoading && !member) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">
            Update Member
          </h1>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              color="blue"
              className="flex items-center justify-center px-4 py-2 rounded-md text-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
              onClick={() => setIsExtendModalOpen(true)}
              aria-label="Extend Membership" // Optional for accessibility
              title="Extend Membership"
              id="extend-membership-btn" // Added id to satisfy ButtonProps
              {...({} as any)} // Bypass TypeScript check for missing props
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                  clipRule="evenodd"
                />
              </svg>
              Extend Membership
            </Button>
            <Button
              color="green"
              className="flex items-center justify-center px-4 py-2 rounded-md text-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
              onClick={() => setIsHistoryModalOpen(true)}
              aria-label="View Attendance History" // Optional for accessibility
              title="View Attendance History"
              id="view-attendance-history-btn" // Added id to satisfy ButtonProps
              {...({} as any)} // Bypass TypeScript check for missing props
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              View Attendance History
            </Button>
          </div>
        </div>

        {/* Member Form */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <MemberForm onSubmit={handleSubmit} initialData={member} />
        </div>

        {/* Modal for Attendance History */}
        <AttendanceHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          memberId={id}
        />

        {/* Modal for Extending Membership */}
        <ExtendMembershipModal
          isOpen={isExtendModalOpen}
          onClose={() => setIsExtendModalOpen(false)}
          onExtend={handleExtendMembership}
          currentDuration={member?.durationMonths || 0}
        />
      </div>
    </div>
  );
}
