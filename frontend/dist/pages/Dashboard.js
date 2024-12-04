import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from 'react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import DashboardStats from '../components/DashboardStats';
import MemberList from '../components/MemberList';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export default function Dashboard() {
    const { data: stats } = useQuery('dashboardStats', () => axios.get(`${API_URL}/dashboard/stats`).then((res) => res.data));
    const { data: members } = useQuery('members', () => axios.get(`${API_URL}/members`).then((res) => res.data));
    if (!stats || !members)
        return null;
    return (_jsxs("div", { className: "flex-1 p-8", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Dashboard" }), _jsx(Link, { to: "/members/add", className: "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700", children: "Add New Member" })] }), _jsx(DashboardStats, { stats: stats }), _jsxs("div", { className: "mt-8", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900 mb-4", children: "Recent Members" }), _jsx(MemberList, { members: members.slice(0, 5) })] })] }));
}
