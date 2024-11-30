import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Member } from '../types';
import MemberList from '../components/MemberList';
import React from 'react';


export default function Members() {
  const { data: members, isLoading } = useQuery<Member[]>('members', () =>
    axios.get('http://localhost:3000/api/members').then((res) => res.data)
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Members</h1>
        <Link
          to="/members/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Member
        </Link>
      </div>

      {members && <MemberList members={members} />}
    </div>
  );
}