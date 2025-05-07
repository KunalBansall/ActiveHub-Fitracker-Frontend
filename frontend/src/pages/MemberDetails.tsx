import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import MemberForm from "../components/MemberForm";
import AttendanceHistoryModal from "../components/AttendenceHistoryModal";
import ExtendMembershipModal from "../components/ExtendMemberShipModal";
import WorkoutPlanModal from "../components/WorkoutPlanModal";
import { Member } from "../types";
import { Button, Dialog, DialogHeader, DialogBody, DialogFooter } from "@material-tailwind/react";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDistanceToNow } from "date-fns";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Helper function to format time ago with a colored badge
const formatTimeAgo = (date: string | Date | undefined) => {
  if (!date) return { text: 'Never', color: 'bg-gray-100 text-gray-800' };
  
  const timeAgo = formatDistanceToNow(new Date(date), { addSuffix: true });
  
  // Determine badge color based on recency
  let color;
  const days = (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
  
  if (days < 1) {
    color = 'bg-green-100 text-green-800'; // Today
  } else if (days < 2) {
    color = 'bg-blue-100 text-blue-800'; // Yesterday
  } else if (days < 7) {
    color = 'bg-yellow-100 text-yellow-800'; // This week
  } else {
    color = 'bg-red-100 text-red-800'; // Longer
  }
  
  return { text: timeAgo, color };
};

export default function MemberDetails() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch member details
  const { data: member, isLoading } = useQuery<Member>(["member", id], () =>
    axios
      .get(`${API_URL}/members/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => res.data)
  );

  // Update member mutation
  const mutation = useMutation(
    (updatedMember: Partial<Member>) =>
      axios.patch(`${API_URL}/members/${id}`, updatedMember, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    {
      onSuccess: (response) => {
        // Using the initial name from the member data for toast
        const initialName = member?.name; // Use the member's initial name before update
        const updatedMemberData = response.data?.data;
        const updatedName = updatedMemberData?.name;
        const successMsg = updatedName
          ? `${updatedName}'s profile updated successfully`
          : initialName
          ? `${initialName}'s profile updated successfully`
          : "Member profile updated successfully";

        toast.success(successMsg);
  
        queryClient.invalidateQueries(["member", id]);
        queryClient.invalidateQueries("members");
      },
      onError: (error: any) => {
        if (error.response) {
          const errorMsg = error.response.data.message;
  
          if (errorMsg === "Member not found") {
            toast.error("This member no longer exists.");
          } else if (errorMsg === "Invalid membership end date") {
            toast.error("Please enter a valid membership end date.");
          } else if (errorMsg === "Invalid durationMonths value") {
            toast.error("Duration must be a valid number greater than 0.");
          } else {
            toast.error(errorMsg || "Failed to update member.");
          }
        } else {
          toast.error("Network error. Please try again.");
        }
      }
    }
  );
  
  // Delete member mutation
  const deleteMutation = useMutation(
    () =>
      axios.delete(`${API_URL}/members/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    {
      onSuccess: () => {
        toast.success("Member deleted successfully");
        // Navigate back to members list after deletion
        navigate("/members");
      },
      onError: (error: any) => {
        console.error("Error deleting member:", error);
        toast.error(error.response?.data?.message || "Failed to delete member");
        setIsDeleteModalOpen(false);
      },
    }
  );
  
  // Handle delete member
  const handleDeleteMember = () => {
    deleteMutation.mutate();
  };
  
  
  

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
      return new Promise<void>((resolve, reject) => {
        mutation.mutate(payload, {
          onSuccess: () => resolve(),
          onError: (error: any) => reject(error)
        });
      });
    } else {
      console.log("No changes detected. Update skipped.");
      return Promise.resolve();
    }
  };

  const handleExtendMembership = async (extensionMonths: number) => {
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

      try {
        // Update member details and wait for it to complete
        await handleSubmit({ durationMonths: updatedDuration });
        
        // Show toast notification only after successful update
        toast.success(
          `${member.name}'s membership extended till ${formattedDate}!`
        );
      } catch (error) {
        console.error("Error extending membership:", error);
        toast.error("Failed to extend membership. Please try again.");
      }
    }

    setIsExtendModalOpen(false);
  };

  if (isLoading && !member) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        {/* <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div> */}
        <LoadingSpinner size="xl" />

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
            
            <Button
              color="purple"
              className="flex items-center justify-center px-4 py-2 rounded-md text-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
              onClick={() => setIsWorkoutModalOpen(true)}
              aria-label="Manage Workout Plan" 
              title="Manage Workout Plan"
              id="create-workout-plan-btn"
              {...({} as any)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              Manage Workout Plan
            </Button>
            
            <Button
              color="red"
              className="flex items-center justify-center px-4 py-2 rounded-md text-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
              onClick={() => setIsDeleteModalOpen(true)}
              aria-label="Delete Member" 
              title="Delete Member"
              id="delete-member-btn"
              {...({} as any)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Delete Member
            </Button>
          </div>
        </div>
        
        {/* Last Activity Information */}
        {member && (
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Member Activity</h3>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-600 mr-2">Last Activity:</span>
                  {member.lastVisit ? (
                    <>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${formatTimeAgo(member.lastVisit).color}`}>
                        {formatTimeAgo(member.lastVisit).text}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({new Date(member.lastVisit).toLocaleString()})
                      </span>
                    </>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      No activity recorded
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Member Form */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <MemberForm onSubmit={handleSubmit} initialData={member} />
        </div>

        {/* Modal for Attendance History */}
        <AttendanceHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          memberId={id}
          isAdmin={true}
        />

        {/* Modal for Extending Membership */}
        <ExtendMembershipModal
          isOpen={isExtendModalOpen}
          onClose={() => setIsExtendModalOpen(false)}
          onExtend={handleExtendMembership}
          currentDuration={member?.durationMonths || 0}
        />
        
        {/* Modal for Creating Workout Plan */}
        <WorkoutPlanModal
          isOpen={isWorkoutModalOpen}
          onClose={() => setIsWorkoutModalOpen(false)}
          memberId={id || ''}
          memberName={member?.name || 'Member'}
        />
        
        {/* Delete Confirmation Modal */}
        <Dialog 
          open={isDeleteModalOpen} 
          handler={() => setIsDeleteModalOpen(false)} 
          size="md"
          placeholder={undefined}
          className="shadow-xl rounded-lg max-w-full mx-4 md:mx-auto overflow-y-auto max-h-[90vh] md:max-h-[80vh]"
          animate={{
            mount: { scale: 1, y: 0 },
            unmount: { scale: 0.9, y: -100 },
          }}
          {...({} as any)}
        >
          <DialogHeader 
            className="flex items-center gap-2 sm:gap-3 border-b border-gray-200 pb-3 px-4 sm:px-6"
            placeholder={undefined}
            {...({} as any)}
          >
            <div className="p-1.5 sm:p-2 rounded-full bg-red-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <span className="text-lg sm:text-xl font-bold text-red-600">Confirm Member Deletion</span>
          </DialogHeader>
          <DialogBody
            className="py-4 sm:py-6 px-4 sm:px-6 overflow-y-auto"
            placeholder={undefined}
            {...({} as any)}
          >
            <div className="flex flex-col space-y-4 sm:space-y-6">
              <div className="bg-red-50 p-3 sm:p-4 rounded-lg border-l-4 border-red-500">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-xs sm:text-sm font-medium text-red-800">Warning: This action cannot be undone</h3>
                    <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-700">
                      <p>You are about to permanently delete {member?.name || 'this member'} from the system.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-l-4 border-gray-300 pl-3 sm:pl-4">
                <p className="text-sm font-medium text-gray-800 mb-1 sm:mb-2">The following data will be permanently deleted:</p>
                <ul className="list-disc list-inside text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1 ml-1 sm:ml-2">
                  <li>Personal information and profile data</li>
                  <li>Membership and payment history</li>
                  <li>Attendance records</li>
                  <li>Workout plans and fitness progress</li>
                  <li>All associated documents and notes</li>
                </ul>
              </div>
              
              {member?.name && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{member.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        {member.email || 'No email'} • {member.phoneNumber || 'No phone'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-yellow-800">
                  <span className="font-bold">Note:</span> If this member has an active subscription, you may want to cancel it first before deleting their account.
                </p>
              </div>
            </div>
          </DialogBody>
          <DialogFooter 
            className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 border-t border-gray-200 pt-4 px-4 sm:px-6 gap-2 sm:gap-0"
            placeholder={undefined}
            {...({} as any)}
          >
            <Button 
              variant="outlined"
              color="gray" 
              onClick={() => setIsDeleteModalOpen(false)}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 font-medium transition-all duration-300 order-1 sm:order-none"
              {...({} as any)}
            >
              Cancel
            </Button>
            <Button 
              color="red" 
              onClick={handleDeleteMember}
              className="flex items-center justify-center w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 font-medium shadow-md hover:shadow-lg transition-all duration-300 order-2 sm:order-none"
              disabled={deleteMutation.isLoading}
              {...({} as any)}
            >
              {deleteMutation.isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="truncate">Deleting...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate">Delete Member</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </Dialog>
      </div>
    </div>
  );
}
