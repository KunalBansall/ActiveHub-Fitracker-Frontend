import { toast } from "react-hot-toast"; // Importing the toast function
import { Member } from "../types";
import { format } from "date-fns";
import clsx from "clsx";
import { Link } from "react-router-dom";
import React, { useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import axios from "axios";

interface Props {
  members: Member[];
}

export default function MemberList({ members }: Props) {
  const [sortBy, setSortBy] = useState<"expiryDate" | "createdAt">(
    "expiryDate"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isNotifying, setIsNotifying] = useState<string | null>(null); // Track the notifying state

  const sortedMembers = [...members].sort((a, b) => {
    let valueA = 0;
    let valueB = 0;

    if (sortBy === "expiryDate") {
      valueA = a.membershipEndDate
        ? new Date(a.membershipEndDate).getTime()
        : 0;
      valueB = b.membershipEndDate
        ? new Date(b.membershipEndDate).getTime()
        : 0;
    } else if (sortBy === "createdAt") {
      valueA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      valueB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    }

    return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
  });

  const toggleSortBy = () => {
    setSortBy((prevSortBy) =>
      prevSortBy === "expiryDate" ? "createdAt" : "expiryDate"
    );
  };

  // Send notification
  const sendNotification = async (member: Member) => {
    setIsNotifying(member._id); // Disable button for this member
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await axios.post(
        `${API_URL}/members/renewal-reminder`,
        { memberId: member._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Display success toast
      toast.success(`Notification sent to ${member.name}`);
    } catch (error) {
      console.error("Error sending notification:", error);
      // Display error toast
      toast.error(`Failed to send notification to ${member.name}`);
    } finally {
      setIsNotifying(null); // Re-enable button after sending the notification
    }
  };

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="mb-4 flex justify-between">
            <button
              onClick={toggleSortBy}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Sort by {sortBy === "expiryDate" ? "Join Date" : "Expiry Date"}
            </button>
          </div>
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                  MEMBER
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  STATUS
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  MEMBERSHIP
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  EXPIRY DATE
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedMembers.map((member) => {
                const expiryDate = new Date(member.membershipEndDate);
                const isExpiringSoon =
                  expiryDate <= new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

                return (
                  <tr
                    key={member._id}
                    className="hover:bg-gray-100 cursor-pointer"
                  >
                    <td className="whitespace-nowrap py-4 pl-4 pr-3">
                      <Link
                        to={`/members/${member._id}`}
                        className="flex items-center"
                      >
                        <div className="h-10 w-10 flex-shrink-0">
                          {member.photo ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={member.photo}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 font-medium">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {member.name}
                          </div>
                          <div className="text-gray-500">
                            {member.phoneNumber}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <span
                        className={clsx(
                          "inline-flex rounded-full px-2 text-xs font-semibold leading-5",
                          {
                            "bg-green-100 text-green-800":
                              member.status === "active",
                            "bg-red-100 text-red-800":
                              member.status === "expired",
                            "bg-yellow-100 text-yellow-800":
                              member.status === "pending",
                          }
                        )}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {member.membershipType}
                    </td>
                    <td
                      className={clsx(
                        "whitespace-nowrap px-3 py-4 text-sm",
                        isExpiringSoon
                          ? "text-red-600 font-medium"
                          : "text-gray-500"
                      )}
                    >
                      {format(expiryDate, "MM/dd/yyyy")}
                      {isExpiringSoon && (
                        <BellIcon className="h-5 w-5 text-red-500 inline ml-2" />
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <button
                        onClick={() => sendNotification(member)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md"
                        disabled={isNotifying === member._id} // Disable button while notifying
                      >
                        {isNotifying === member._id ? "Notifying..." : "Notify"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
