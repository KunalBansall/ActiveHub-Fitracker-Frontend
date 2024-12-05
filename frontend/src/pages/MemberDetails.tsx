import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import MemberForm from '../components/MemberForm';
import { Member } from '../types';
import React from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function MemberDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get token from localStorage
  const token = localStorage.getItem('token');

  // Fetch member details
  const { data: member } = useQuery<Member>(['member', id], () =>
    axios
      .get(`${API_URL}/members/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => res.data)
  );

  // Update member details
  const mutation = useMutation(
    (updatedMember: Partial<Member>) =>
      axios.patch(`${API_URL}/members/${id}`, updatedMember, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['member', id]); // Refetch updated member data
        queryClient.invalidateQueries('members'); // Refetch members list
        navigate('/members'); // Redirect to members list
      },
    }
  );

  const handleSubmit = (data: Partial<Member>) => {
    mutation.mutate(data);
  };

  if (!member) return null;

  return (
    <div className="flex-1 p-2">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900">Update Member</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <MemberForm onSubmit={handleSubmit} initialData={member} />
      </div>
    </div>
  );
}
