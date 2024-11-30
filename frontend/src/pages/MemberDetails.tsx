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

  const { data: member } = useQuery<Member>(['member', id], () =>
    axios.get(`${API_URL}/members/${id}`).then((res) => res.data)
  );

  const mutation = useMutation(
    (updatedMember: Partial<Member>) =>
      axios.patch(`${API_URL}/members/${id}`, updatedMember),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['member', id]);
        queryClient.invalidateQueries('members');
        navigate('/members');
      },
    }
  );

  const handleSubmit = (data: Partial<Member>) => {
    mutation.mutate(data);
  };

  if (!member) return null;

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Member</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <MemberForm onSubmit={handleSubmit} initialData={member} />
      </div>
    </div>
  );
}