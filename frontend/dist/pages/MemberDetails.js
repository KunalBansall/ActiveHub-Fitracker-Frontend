import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import MemberForm from '../components/MemberForm';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export default function MemberDetails() {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { data: member } = useQuery(['member', id], () => axios.get(`${API_URL}/members/${id}`).then((res) => res.data));
    const mutation = useMutation((updatedMember) => axios.patch(`${API_URL}/members/${id}`, updatedMember), {
        onSuccess: () => {
            queryClient.invalidateQueries(['member', id]);
            queryClient.invalidateQueries('members');
            navigate('/members');
        },
    });
    const handleSubmit = (data) => {
        mutation.mutate(data);
    };
    if (!member)
        return null;
    return (_jsxs("div", { className: "flex-1 p-2", children: [_jsx("div", { className: "mb-2", children: _jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Update Member" }) }), _jsx("div", { className: "bg-white shadow rounded-lg p-6", children: _jsx(MemberForm, { onSubmit: handleSubmit, initialData: member }) })] }));
}
