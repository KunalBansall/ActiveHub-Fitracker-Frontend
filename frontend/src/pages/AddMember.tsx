import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MemberForm from '../components/MemberForm';
import { Member } from '../types';
import React from 'react';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export default function AddMember() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation(
    (newMember: Partial<Member>) =>
      axios.post(`${API_URL}/members`, newMember),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('members');
        navigate('/members');
      },
    }
  );

  const handleSubmit = (data: Partial<Member>) => {
    mutation.mutate(data);
  };

  return (
    <div className="flex-1 p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Add New Member</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-3">
        <MemberForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}