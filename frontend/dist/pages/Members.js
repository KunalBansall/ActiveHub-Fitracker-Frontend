import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import MemberList from '../components/MemberList';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export default function Members() {
    const { data: members, isLoading } = useQuery('members', () => axios.get(`${API_URL}/members`).then((res) => res.data));
    if (isLoading)
        return _jsx("div", { children: "Loading..." });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Members" }), _jsx(Link, { to: "/members/add", className: "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700", children: "Add New Member" })] }), members && _jsx(MemberList, { members: members })] }));
}
