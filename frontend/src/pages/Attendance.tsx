import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Member } from "../types";
import React from "react";
import { MagnifyingGlassIcon, ArrowPathIcon, UserGroupIcon, CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Attendance() {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("record"); // "record" or "history"
  const queryClient = useQueryClient();

  // Get token from localStorage
  const token = localStorage.getItem("token");

  const { data: members, isLoading: membersLoading } = useQuery<Member[]>("members", () =>
    axios
      .get(`${API_URL}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => res.data)
  );

  // Search results based on query
  const { data: searchResults } = useQuery(
    ["memberSearch", searchQuery],
    async () => {
      if (!searchQuery) return [];

      const response = await axios.get(
        `${API_URL}/members/search?query=${searchQuery}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    {
      enabled: searchQuery.length > 2,
    }
  );

  const { data: todayAttendance, isLoading: attendanceLoading } = useQuery("todayAttendance", () =>
    axios
      .get(`${API_URL}/attendance/today`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => res.data)
  );

  const entryMutation = useMutation(
    (memberId: string) =>
      axios.post(`${API_URL}/attendance/entry/${memberId}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("todayAttendance");
        toast.success("Entry recorded successfully");
        setSelectedMemberId("");
        setErrorMessage("");
      },
      onError: (error: any) => {
        // Handle specific error messages from backend
        if (error.response) {
          const errorMsg = error.response.data.message;
          if (errorMsg === "Already active session" || errorMsg.includes("already active")) {
            toast.error("Member already has an active session");
            setErrorMessage("This member is already checked in.");
          } else {
            toast.error(errorMsg || "Failed to record entry");
            setErrorMessage(errorMsg || "An error occurred while recording entry.");
          }
        } else {
          toast.error("Network error. Please try again.");
          setErrorMessage("Network error. Please try again.");
        }
      }
    }
  );

  const exitMutation = useMutation(
    (memberId: string) =>
      axios.post(`${API_URL}/attendance/exit/${memberId}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("todayAttendance");
        toast.success("Exit recorded successfully");
        setErrorMessage("");
      },
      onError: (error: any) => {
        // Handle specific error messages from backend
        if (error.response) {
          const errorMsg = error.response.data.message;
          if (errorMsg === "No active session" || errorMsg.includes("no active")) {
            toast.error("Member does not have an active session");
            setErrorMessage("This member is not currently checked in.");
          } else {
            toast.error(errorMsg || "Failed to record exit");
            setErrorMessage(errorMsg || "An error occurred while recording exit.");
          }
        } else {
          toast.error("Network error. Please try again.");
          setErrorMessage("Network error. Please try again.");
        }
      }
    }
  );

  const handleSelectSearchResult = (memberId: string) => {
    setSelectedMemberId(memberId);
    setSearchQuery(""); // Clear search after selection
    setErrorMessage(""); // Clear error message when member changes
  };

  // Get active and checked out count
  const activeCount = todayAttendance?.filter((record: any) => !record.exitTime).length || 0;
  const checkedOutCount = todayAttendance?.filter((record: any) => record.exitTime).length || 0;
  const totalCount = todayAttendance?.length || 0;

  const selectedMember = members?.find(member => member._id === selectedMemberId);

  // Sort attendance records with most recent first (based on entry time)
  const sortedAttendance = todayAttendance ? [...todayAttendance].sort((a, b) => {
    return new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime();
  }) : [];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-500 mt-1">Track and manage member check-ins and check-outs</p>
        </div>
        
        {/* Stats Cards */}
        <div className="flex space-x-3">
          <div className="bg-blue-50 rounded-lg px-4 py-2 flex items-center">
            <div className="rounded-full bg-blue-100 p-2 mr-3">
              <UserGroupIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">{totalCount}</p>
              <p className="text-xs text-blue-500">Total Today</p>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg px-4 py-2 flex items-center">
            <div className="rounded-full bg-green-100 p-2 mr-3">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">{activeCount}</p>
              <p className="text-xs text-green-500">Active Now</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg px-4 py-2 flex items-center">
            <div className="rounded-full bg-gray-100 p-2 mr-3">
              <XCircleIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{checkedOutCount}</p>
              <p className="text-xs text-gray-500">Checked Out</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("record")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "record"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Record Attendance
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "history"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Today's History
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className={activeTab === "record" ? "block" : "hidden"}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel - Member Search */}
          <div className="md:col-span-1">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Find Member</h2>
              
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search members..."
                  className="block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-2.5 pl-10 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                
                {searchResults && searchResults.length > 0 && (
                  <div className="absolute mt-2 w-full rounded-lg bg-white shadow-lg z-50 overflow-hidden border border-gray-200">
                    <div className="py-2 px-3 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs font-medium text-gray-500">
                        {searchResults.length} member{searchResults.length !== 1 ? 's' : ''} found
                      </p>
                    </div>
                    <ul className="max-h-64 overflow-auto py-1">
                      {searchResults.map((member: Member) => (
                        <li
                          key={member._id}
                          className="cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                          onClick={() => handleSelectSearchResult(member._id)}
                        >
                          <div className="px-4 py-3">
                            <div className="flex items-center">
                              {member.photo && (
                                <img
                                  src={member.photo}
                                  alt={member.name}
                                  className="h-10 w-10 flex-shrink-0 rounded-full object-cover border border-gray-200"
                                />
                              )}
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500">ID: {member._id.substring(0, 8)}...</p>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {membersLoading && (
                <div className="py-8 flex justify-center">
                  <ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin" />
                </div>
              )}

              {!searchQuery && !selectedMemberId && !membersLoading && (
                <div className="py-8 text-center text-gray-500">
                  <UserGroupIcon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">Search for a member or select from the list</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Panel - Record Entry/Exit */}
          <div className="md:col-span-2">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Attendance</h2>
              
              {!selectedMemberId ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                  <div className="rounded-full bg-blue-50 p-4 mb-4">
                    <UserGroupIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-lg font-medium text-gray-600 mb-1">No Member Selected</p>
                  <p className="text-sm max-w-sm">
                    Use the search panel to find a member, then record their entry or exit
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Member Info Card */}
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center">
                    {selectedMember?.photo ? (
                      <img
                        src={selectedMember.photo}
                        alt={selectedMember.name}
                        className="h-16 w-16 rounded-full mr-4 object-cover border-2 border-white shadow"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                        <UserGroupIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedMember?.name}</h3>
                      <p className="text-sm text-gray-500">Member ID: {selectedMember?._id.substring(0, 8)}...</p>
                    </div>
                  </div>
                  
                  {/* Error message display */}
                  {errorMessage && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start">
                      <XCircleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                      <p>{errorMessage}</p>
                    </div>
                  )}
                  
                  {/* Entry/Exit Buttons */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      onClick={() => selectedMemberId && entryMutation.mutate(selectedMemberId)}
                      disabled={!selectedMemberId || entryMutation.isLoading}
                      className="flex items-center justify-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {entryMutation.isLoading ? (
                        <span className="inline-block animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full mr-2"></span>
                      ) : (
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                      )}
                      Record Entry
                    </button>
                    
                    <button
                      onClick={() => selectedMemberId && exitMutation.mutate(selectedMemberId)}
                      disabled={!selectedMemberId || exitMutation.isLoading}
                      className="flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {exitMutation.isLoading ? (
                        <span className="inline-block animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full mr-2"></span>
                      ) : (
                        <XCircleIcon className="h-5 w-5 mr-2" />
                      )}
                      Record Exit
                    </button>
                  </div>
                  
                  {/* Quick Instructions */}
                  <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Help</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                        <span>Use <span className="font-medium">Record Entry</span> when a member arrives at the gym</span>
                      </li>
                      <li className="flex items-start">
                        <XCircleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                        <span>Use <span className="font-medium">Record Exit</span> when a member leaves the gym</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Attendance Tab */}
      <div className={activeTab === "history" ? "block" : "hidden"}>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Today's Attendance History</h2>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center">
              <button 
                onClick={() => queryClient.invalidateQueries("todayAttendance")} 
                className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>
          
          {attendanceLoading ? (
            <div className="py-12 flex justify-center">
              <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          ) : sortedAttendance.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No attendance records for today</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Attendance records will appear here once members check in or out of the gym today.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden shadow-sm border border-gray-200 rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entry Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exit Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedAttendance.map((record: any) => {
                      const entryTime = new Date(record.entryTime);
                      const exitTime = record.exitTime ? new Date(record.exitTime) : null;
                      
                      // Calculate duration if both entry and exit times exist
                      let duration = null;
                      if (exitTime) {
                        const diff = exitTime.getTime() - entryTime.getTime();
                        const minutes = Math.floor(diff / 60000);
                        const hours = Math.floor(minutes / 60);
                        const remainingMinutes = minutes % 60;
                        duration = `${hours}h ${remainingMinutes}m`;
                      }
                      
                      return (
                        <tr key={record._id} className={!record.exitTime ? "bg-green-50" : ""}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {record.memberId.photo ? (
                                <img
                                  src={record.memberId.photo}
                                  alt=""
                                  className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <UserGroupIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {record.memberId.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {record.memberId._id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <ClockIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                              {entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">
                              {exitTime ? (
                                <div className="flex items-center">
                                  <ClockIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                                  {exitTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">
                              {duration || (
                                <span className="text-sm italic text-gray-400">In Progress</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {!record.exitTime ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Completed
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {record.entryTime && !record.exitTime && (
                              <button
                                onClick={() => exitMutation.mutate(record.memberId._id)}
                                disabled={exitMutation.isLoading}
                                className="text-white bg-red-500 hover:bg-red-600 rounded-md px-3 py-1.5 text-xs font-medium inline-flex items-center transition-colors"
                              >
                                {exitMutation.isLoading && exitMutation.variables === record.memberId._id ? (
                                  <span className="inline-block animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1"></span>
                                ) : null}
                                Mark Exit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
