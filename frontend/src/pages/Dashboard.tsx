import { useQuery } from "react-query";
import axios from "axios";
import { Link } from "react-router-dom";
import DashboardStats from "../components/DashboardStats";
import MemberList from "../components/MemberList";
import { DashboardStatsData as DashboardStatsType, Member } from "../types";
import React, { useState, useEffect } from "react";
import AdminTour from "../components/AdminTour";

// Define revenue data type
interface RevenueData {
  totalCollectedRevenue: number;
  collectedMembershipRevenue: number;
  collectedShopRevenue: number;
  remainingRevenue: number;
  totalMembershipRevenue: number;
  totalShopRevenue: number;
  pendingMembershipRevenue: number;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Dashboard() {
  const token = localStorage.getItem("token");
  const [shouldRunTour, setShouldRunTour] = useState(false);
  const [adminId, setAdminId] = useState("");
  
  // Fetch admin data to check if tour should run
  const { data: adminData } = useQuery("adminData", () =>
    axios
      .get(`${API_URL}/admin/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        // Set the admin ID for the tour
        if (res.data && res.data._id) {
          setAdminId(res.data._id);
        }
        return res.data;
      })
  );
  
  // Determine if the tour should run based on admin data
  useEffect(() => {
    // Check localStorage first as a fallback to prevent tour restart
    const tourCompletedLocally = localStorage.getItem('adminTourCompleted') === 'true';
    
    // Only run the tour if admin exists, hasn't completed the tour, and it's not marked as completed locally
    if (adminData && adminData.hasCompletedTour === false && !tourCompletedLocally) {
      setShouldRunTour(true);
    } else {
      setShouldRunTour(false);
    }
  }, [adminData]);

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

  // Fetch revenue overview
  const { data: revenueData } = useQuery<RevenueData>("revenueOverview", () =>
    axios
      .get(`${API_URL}/admin/revenue/overview`, {
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

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    // Make sure amount is a valid number
    const validAmount = amount && !isNaN(Number(amount)) ? Number(amount) : 0;
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(validAmount);
  };

  // Sort members by membership end date (earliest first)
  const sortedMembers = members
    .filter((member) => member.membershipEndDate) // Ensure members have an end date
    .sort(
      (a, b) =>
        new Date(a.membershipEndDate!).getTime() -
        new Date(b.membershipEndDate!).getTime()
    );

  // Handle tour completion
  const handleTourComplete = () => {
    console.log("Tour completed");
    // Update local state to prevent tour from showing again
    setShouldRunTour(false);
    // Store completion in localStorage as a fallback
    localStorage.setItem('adminTourCompleted', 'true');
  };

  return (
    <div className="flex-1 p-4 sm:p-8">
      {/* Admin Tour Component */}
      {shouldRunTour && adminId && (
        <AdminTour 
          shouldRun={shouldRunTour} 
          adminId={adminId}
          onComplete={handleTourComplete}
        />
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
        <Link
          to="/members/add"
          data-tour="add-member"
          className="w-full sm:w-auto inline-flex justify-center items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add New Member
        </Link>
      </div>

      <div data-tour="dashboard-stats">
        <DashboardStats stats={stats} />
      </div>

      {/* Revenue Summary Section */}
      {revenueData && (
        <div data-tour="revenue-overview" className="mt-6 bg-white rounded-lg shadow overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">
              Revenue Overview
            </h2>
            <Link
              to="/revenue"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View Details →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0">
            {/* Total Collected Revenue */}
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-1">Total Collected</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(revenueData.totalCollectedRevenue)}</p>
            </div>
            
            {/* Membership Revenue */}
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-1">From Memberships</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(revenueData.collectedMembershipRevenue)}</p>
            </div>
            
            {/* Shop Revenue */}
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-1">From Shop Sales</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(revenueData.collectedShopRevenue)}</p>
            </div>
            
            {/* Pending Revenue */}
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-1">Pending Collection</p>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(revenueData.remainingRevenue)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6" data-tour="member-management">
        <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
          Expiring Soon Members ⬇️
        </h2>
        <MemberList members={sortedMembers.slice(0, 5)} />
      </div>
    </div>
  );
}
