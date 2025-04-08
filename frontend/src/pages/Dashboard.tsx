import { useQuery } from "react-query";
import axios from "axios";
import { Link } from "react-router-dom";
import DashboardStats from "../components/DashboardStats";
import MemberList from "../components/MemberList";
import { DashboardStatsData as DashboardStatsType, Member } from "../types";
import React from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Dashboard() {
  const token = localStorage.getItem("token");

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStatsType>("dashboardStats", () =>
    axios
      .get(`${API_URL}/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => res.data)
  );

  // Fetch members
  const { data: members } = useQuery<Member[]>("members", () =>
    axios
      .get(`${API_URL}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => res.data)
  );

  if (!stats || !members) return null;

  // Sort members by membership end date (earliest first)
  const sortedMembers = members
    .filter((member) => member.membershipEndDate) // Ensure members have an end date
    .sort(
      (a, b) =>
        new Date(a.membershipEndDate!).getTime() -
        new Date(b.membershipEndDate!).getTime()
    );

  return (
    <div className="flex-1 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
        <Link
          to="/members/add"
          className="w-full sm:w-auto inline-flex justify-center items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add New Member
        </Link>
      </div>

      <DashboardStats stats={stats} />

      <div className="mt-4 sm:mt-8">
        <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
          Expiring Soon Members ⬇️
        </h2>
        <MemberList members={sortedMembers.slice(0, 5)} />
      </div>
    </div>
  );
}
