import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { Member } from "../types";
import { 
  BellIcon, 
  ArrowsUpDownIcon, 
  ChevronRightIcon, 
  UserCircleIcon, 
  PhoneIcon,
  CalendarIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";
import axios from "axios";

interface Props {
  members: Member[];
}

const MemberList: React.FC<Props> = ({ members }) => {
  const [sortBy, setSortBy] = useState<"expiryDate" | "createdAt">("expiryDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isNotifying, setIsNotifying] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<"grid" | "list">("grid");

  // Memoized sorted members
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      let valueA =
        sortBy === "expiryDate"
          ? new Date(a.membershipEndDate).getTime()
          : new Date(a.createdAt).getTime();
      let valueB =
        sortBy === "expiryDate"
          ? new Date(b.membershipEndDate).getTime()
          : new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    });
  }, [members, sortBy, sortOrder]);

  const toggleSort = () => {
    if (sortBy === "expiryDate") {
      setSortBy("createdAt");
      setSortOrder("desc");
    } else {
      setSortBy("expiryDate");
      setSortOrder("asc");
    }
  };

  // Notification logic with local storage tracking to prevent redundant calls
  const sendNotification = async (member: Member) => {
    const lastNotified = localStorage.getItem(`notified_${member._id}`);
    if (lastNotified && Date.now() - Number(lastNotified) < 3600000) {
      // 1 hour
      toast.error("Notification already sent recently.");
      return;
    }

    setIsNotifying(member._id);
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
      localStorage.setItem(`notified_${member._id}`, String(Date.now()));
      toast.success(response.data.message || `Notification sent to ${member.name}`);
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error(`Failed to send notification to ${member.name}`);
    } finally {
      setIsNotifying(null);
    }
  };

  const getMembershipStatusInfo = (member: Member) => {
    const expiryDate = new Date(member.membershipEndDate);
    const isExpired = expiryDate < new Date();
    const isExpiringSoon = !isExpired && expiryDate <= new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    
    return {
      status: isExpired ? "expired" : isExpiringSoon ? "expiring" : "active",
      date: expiryDate,
      isExpired,
      isExpiringSoon
    };
  };

  const getStatusStyles = (status: string) => {
    switch(status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'expiring':
        return <ExclamationCircleIcon className="h-4 w-4" />;
      case 'expired':
        return <ExclamationCircleIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with filters and view options */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Members</h2>
          <p className="text-sm text-gray-500 mt-1">Total: {members.length} members</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Sort button */}
          <button
            onClick={toggleSort}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-1.5"
          >
            <ArrowsUpDownIcon className="h-4 w-4 text-gray-500" />
            {sortBy === "expiryDate" ? "Expiry Date" : "Join Date"}
            <span className="text-xs text-gray-500 font-normal">{sortOrder === "asc" ? "↑" : "↓"}</span>
          </button>
          
          {/* View mode toggle */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveViewMode("grid")}
              className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 ${
                activeViewMode === "grid"
                  ? "bg-blue-50 text-blue-600 border-r border-gray-300"
                  : "bg-white text-gray-600 border-r border-gray-300 hover:bg-gray-50"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
              </svg>
              Grid
            </button>
            <button
              onClick={() => setActiveViewMode("list")}
              className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 ${
                activeViewMode === "list"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              List
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {activeViewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedMembers.map((member) => {
            const { status, date, isExpiringSoon } = getMembershipStatusInfo(member);
            const statusStyles = getStatusStyles(status);
            const statusIcon = getStatusIcon(status);

            return (
              <Link
                to={`/members/${member._id}`}
                key={member._id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col group"
              >
                <div className="relative p-4 pb-3 flex flex-col items-center">
                  {/* Member Photo */}
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm group-hover:border-blue-200 transition-all duration-300">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        <UserCircleIcon className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  
                  {/* Member Details */}
                  <h3 className="font-semibold text-gray-900 mt-3 text-center group-hover:text-blue-600 transition-colors duration-200">
                    {member.name}
                  </h3>
                  
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <PhoneIcon className="h-3.5 w-3.5 mr-1" />
                    {member.phoneNumber}
                  </div>
                  
                  <div className={`mt-3 flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles}`}>
                    {statusIcon && <span className="mr-1">{statusIcon}</span>}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </div>
                </div>
                
                {/* Info Footer */}
                <div className="mt-auto border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="font-medium">Membership:</div>
                    <div>{member.slot}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="font-medium flex items-center">
                      <CalendarIcon className="h-3.5 w-3.5 mr-1" /> Expires on:
                    </div>
                    <div className={isExpiringSoon || status === 'expired' ? "text-red-600 font-medium" : ""}>
                      {format(date, "MMM dd, yyyy")}
                    </div>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="bg-gray-50 border-t border-gray-100 p-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      sendNotification(member);
                    }}
                    disabled={isNotifying === member._id}
                    className={`w-full flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md ${
                      isNotifying === member._id
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    }`}
                  >
                    <BellIcon className="h-4 w-4 mr-1.5" />
                    {isNotifying === member._id ? "Notifying..." : "Send Reminder"}
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* List View (Traditional table for larger screens, cards for mobile) */}
      {activeViewMode === "list" && (
        <>
          {/* Desktop Table View - Hidden on small screens */}
          <div className="hidden sm:block rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left font-medium p-4">Member</th>
                  <th className="text-left font-medium p-4">Status</th>
                  <th className="text-left font-medium p-4">Membership</th>
                  <th className="text-left font-medium p-4">Expiry Date</th>
                  <th className="text-right font-medium p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((member) => {
                  const { status, date, isExpiringSoon } = getMembershipStatusInfo(member);
                  const statusStyles = getStatusStyles(status);
                  const statusIcon = getStatusIcon(status);

                  return (
                    <tr
                      key={member._id}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <Link
                          to={`/members/${member._id}`}
                          className="flex items-center space-x-3 group"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border border-gray-100 overflow-hidden">
                            {member.photo ? (
                              <img
                                src={member.photo}
                                alt={member.name}
                                className="w-10 h-10 object-cover"
                              />
                            ) : (
                              <UserCircleIcon className="h-7 w-7 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold group-hover:text-blue-600 transition-colors">
                              {member.name}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center mt-0.5">
                              <PhoneIcon className="h-3 w-3 mr-1" />
                              {member.phoneNumber}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles}`}>
                          {statusIcon && <span className="mr-1">{statusIcon}</span>}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{member.slot}</td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                          <span className={isExpiringSoon || status === 'expired' ? "text-red-600 font-medium" : "text-gray-600"}>
                            {format(date, "MMM dd, yyyy")}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => sendNotification(member)}
                          disabled={isNotifying === member._id}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md inline-flex items-center ${
                            isNotifying === member._id
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          }`}
                        >
                          <BellIcon className="h-3.5 w-3.5 mr-1.5" />
                          {isNotifying === member._id ? "Notifying..." : "Notify"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile List View - Only visible on small screens */}
          <div className="sm:hidden space-y-3">
            {sortedMembers.map((member) => {
              const { status, date, isExpiringSoon } = getMembershipStatusInfo(member);
              const statusStyles = getStatusStyles(status);
              const statusIcon = getStatusIcon(status);

              return (
                <div key={member._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <Link to={`/members/${member._id}`} className="flex items-start p-4">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-100">
                        {member.photo ? (
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-12 h-12 object-cover"
                          />
                        ) : (
                          <UserCircleIcon className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{member.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center">
                            <PhoneIcon className="h-3 w-3 mr-1" />
                            {member.phoneNumber}
                          </p>
                        </div>
                        <div className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles}`}>
                          {statusIcon && <span className="mr-1">{statusIcon}</span>}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <ClockIcon className="h-3.5 w-3.5 mr-1" />
                          {member.slot}
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                          <span className={isExpiringSoon || status === 'expired' ? "text-red-600 font-medium" : ""}>
                            {format(date, "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400 mt-1 ml-2" />
                  </Link>
                  <div className="border-t border-gray-100 bg-gray-50 p-2">
                    <button
                      onClick={() => sendNotification(member)}
                      disabled={isNotifying === member._id}
                      className={`w-full py-1.5 text-xs font-medium rounded-md ${
                        isNotifying === member._id
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      }`}
                    >
                      <BellIcon className="h-3.5 w-3.5 inline-block mr-1" />
                      {isNotifying === member._id ? "Notifying..." : "Send Reminder"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty State */}
      {sortedMembers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <UserCircleIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first member.</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(MemberList);
