import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MemberForm from '../components/MemberForm';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export default function AddMember() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const mutation = useMutation((newMember) => axios.post(`${API_URL}/members`, newMember), {
        onSuccess: () => {
            queryClient.invalidateQueries('members');
            navigate('/members');
        },
    });
    const handleSubmit = (data) => {
        mutation.mutate(data);
    };
    return (_jsxs("div", { className: "flex-1 p-4", children: [_jsx("div", { className: "mb-8", children: _jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Add New Member" }) }), _jsx("div", { className: "bg-white shadow rounded-lg p-3", children: _jsx(MemberForm, { onSubmit: handleSubmit }) })] }));
}
