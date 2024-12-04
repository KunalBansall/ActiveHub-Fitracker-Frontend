import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export default function Attendance() {
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const queryClient = useQueryClient();
    const { data: members } = useQuery('members', () => axios.get(`${API_URL}/members`).then((res) => res.data));
    const { data: todayAttendance } = useQuery('todayAttendance', () => axios.get(`${API_URL}/attendance/today`).then((res) => res.data));
    const entryMutation = useMutation((memberId) => axios.post(`${API_URL}/attendance/entry/${memberId}`), {
        onSuccess: () => {
            queryClient.invalidateQueries('todayAttendance');
            toast.success('Entry recorded successfully');
            setSelectedMemberId('');
        },
    });
    const exitMutation = useMutation((memberId) => axios.post(`${API_URL}/attendance/exit/${memberId}`), {
        onSuccess: () => {
            queryClient.invalidateQueries('todayAttendance');
            toast.success('Exit recorded successfully');
        },
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Attendance" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-white p-4 rounded-lg shadow", children: [_jsx("h2", { className: "text-lg font-medium mb-4", children: "Record Entry/Exit" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("select", { value: selectedMemberId, onChange: (e) => setSelectedMemberId(e.target.value), className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Select Member" }), members?.map((member) => (_jsxs("option", { value: member._id, children: [member.photo && (_jsx("img", { src: member.photo, alt: member.name, className: "inline-block h-8 w-8 rounded-full mr-2" })), member.name] }, member._id)))] }), selectedMemberId && members && (_jsx("div", { className: "flex items-center space-x-4 mt-4", children: members.map((member) => member._id === selectedMemberId ? (_jsxs("div", { className: "flex items-center", children: [member.photo && (_jsx("img", { src: member.photo, alt: member.name, className: "h-12 w-12 rounded-full mr-4" })), _jsx("span", { className: "text-lg font-medium text-gray-900", children: member.name })] }, member._id)) : null) })), _jsxs("div", { className: "flex space-x-4 mt-4", children: [_jsx("button", { onClick: () => selectedMemberId && entryMutation.mutate(selectedMemberId), disabled: !selectedMemberId, className: "flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50", children: "Record Entry" }), _jsx("button", { onClick: () => selectedMemberId && exitMutation.mutate(selectedMemberId), disabled: !selectedMemberId, className: "flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50", children: "Record Exit" })] })] })] }), _jsxs("div", { className: "bg-white p-4 rounded-lg shadow", children: [_jsx("h2", { className: "text-lg font-medium mb-4", children: "Today's Attendance" }), _jsx("div", { className: "overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-300", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900", children: "Member" }), _jsx("th", { className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "Entry Time" }), _jsx("th", { className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "Exit Time" }), _jsx("th", { className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200 bg-white", children: todayAttendance?.map((record) => (_jsxs("tr", { children: [_jsx("td", { className: "whitespace-nowrap py-4 pl-4 pr-3 text-sm", children: _jsxs("div", { className: "flex items-center", children: [record.memberId.photo && (_jsx("img", { src: record.memberId.photo, alt: "", className: "h-8 w-8 rounded-full mr-2" })), record.memberId.name] }) }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: new Date(record.entryTime).toLocaleTimeString() }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: record.exitTime
                                                            ? new Date(record.exitTime).toLocaleTimeString()
                                                            : '-' }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: record.entryTime && !record.exitTime && (_jsx("button", { onClick: () => exitMutation.mutate(record.memberId._id), className: "bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700", children: "Mark Exit" })) })] }, record._id))) })] }) })] })] })] }));
}
