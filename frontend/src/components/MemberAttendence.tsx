import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface MemberAttendanceProps {
  memberId: string;
}

export function MemberAttendance({ memberId }: MemberAttendanceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const queryClient = useQueryClient();

  const entryMutation = useMutation(
    () =>
      axios.post(`${API_URL}/member-attendance/entry`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("todayAttendance");
        setMessage({ type: "success", text: "Entry recorded successfully" });
      },
      onError: (error) => {
        setMessage({ type: "error", text: "Already have active Session!" });
      },
    }
  );

  const exitMutation = useMutation(
    () =>
      axios.post(`${API_URL}/member-attendance/exit`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("todayAttendance");
        setMessage({ type: "success", text: "Exit recorded successfully" });
      },
      onError: (error) => {
        setMessage({ type: "error", text: "Session is already ended" });
      },
    }
  );

  const handleEntry = () => {
    setIsLoading(true);
    entryMutation.mutate();
    setIsLoading(false);
  };

  const handleExit = () => {
    setIsLoading(true);
    exitMutation.mutate();
    setIsLoading(false);
  };

  const MessageDisplay = () => {
    if (!message) return null;
    const Icon = message.type === "success" ? CheckCircleIcon : XCircleIcon;
    const bgColor = message.type === "success" ? "bg-green-100" : "bg-red-100";
    const textColor =
      message.type === "success" ? "text-green-800" : "text-red-800";

    return (
      <div className={`flex items-center p-4 mb-4 rounded-lg ${bgColor}`}>
        <Icon className={`w-5 h-5 mr-2 ${textColor}`} />
        <span className={`text-sm ${textColor}`}>{message.text}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      <MessageDisplay />
      <h2 className="text-2xl font-bold">Record Attendance</h2>
      <div className="flex space-x-4">
        <button
          onClick={handleEntry}
          disabled={isLoading}
          className="px-4 py-2 font-semibold text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Record Entry
        </button>
        <button
          onClick={handleExit}
          disabled={isLoading}
          className="px-4 py-2 font-semibold text-white bg-green-500 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Record Exit
        </button>
      </div>
    </div>
  );
}
