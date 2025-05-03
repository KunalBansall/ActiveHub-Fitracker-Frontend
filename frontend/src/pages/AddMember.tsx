import { useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import MemberForm from "../components/MemberForm";
import { Member } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AddMember() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const mutation = useMutation(
    (newMember: Partial<Member>) =>
      axios.post(`${API_URL}/members`, newMember, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    {
      onSuccess: (response) => {
        const { emailSent, member } = response.data || {};
        const memberName = member?.name || "Member"; // Access the member's name properly
        const message = emailSent
          ? `${memberName} joins our Family. Welcomed.`
          : `${memberName} joins our Family.`;
        toast.success(message);

        queryClient.invalidateQueries("members");
        navigate("/members");
      },
      onError: (error) => {
        if (axios.isAxiosError(error)) {
          const message = error.response?.data?.message || "An error occurred";
          const duplicateFields = error.response?.data?.duplicateFields;

          if (message === "Duplicate entry detected" && duplicateFields) {
            if (duplicateFields.email) {
              toast.error(
                `The email ${duplicateFields.email} is already registered.`
              );
            } else if (duplicateFields.phoneNumber) {
              toast.error(
                `The phone number ${duplicateFields.phoneNumber} is already registered.`
              );
            } else {
              toast.error(message); // Fallback in case there is no specific field
            }
          } else {
            toast.error(message);
          }
        }
      },
    }
  );

  const handleSubmit = (data: Partial<Member>) => {
    return new Promise<void>((resolve, reject) => {
      mutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      });
    });
  };

  return (
    <div className="flex-1 p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Add New Member</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-3">
        <MemberForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
