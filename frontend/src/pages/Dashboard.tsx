import { useQuery } from 'react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import DashboardStats from '../components/DashboardStats';
import MemberList from '../components/MemberList';
import { DashboardStatsData as DashboardStatsType, Member } from '../types';
import React from 'react';


export default function Dashboard() {
  const { data: stats } = useQuery<DashboardStatsType>('dashboardStats', () =>
    axios.get('http://localhost:3000/api/dashboard/stats').then((res) => res.data)
  );

  const { data: members } = useQuery<Member[]>('members', () =>
    axios.get('http://localhost:3000/api/members').then((res) => res.data)
  );

  if (!stats || !members) return null;

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
          Recent Members
        </h2>
        <MemberList members={members.slice(0, 5)} />
      </div>
    </div>
  );
}