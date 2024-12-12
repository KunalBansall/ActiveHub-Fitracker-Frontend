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
    <div className="flex-1 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <Link
          to="/members/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Member
        </Link>
      </div>

      <DashboardStats stats={stats} />

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Expiring Soon Members ⬇️
           </h2>
        <MemberList members={sortedMembers.slice(0, 5)} />{" "}
        {/* Show top 5 members */}
      </div>
    </div>
  );
}
