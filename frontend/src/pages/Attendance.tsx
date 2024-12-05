import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Member } from '../types';
import React from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Attendance() {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const queryClient = useQueryClient();

  // Get token from localStorage
  const token = localStorage.getItem('token');

  const { data: members } = useQuery<Member[]>('members', () =>
    axios.get(`${API_URL}/members`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.data)
  );

  const { data: todayAttendance } = useQuery('todayAttendance', () =>
    axios.get(`${API_URL}/attendance/today`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.data)
  );

  const entryMutation = useMutation(
    (memberId: string) =>
      axios.post(`${API_URL}/attendance/entry/${memberId}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('todayAttendance');
        toast.success('Entry recorded successfully');
        setSelectedMemberId('');
      },
    }
  );

  const exitMutation = useMutation(
    (memberId: string) =>
      axios.post(`${API_URL}/attendance/exit/${memberId}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('todayAttendance');
        toast.success('Exit recorded successfully');
      },
    }
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Attendance</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Record Entry/Exit */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Record Entry/Exit</h2>
          <div className="space-y-4">
            {/* Member selection dropdown */}
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Member</option>
              {members?.map((member) => (
                <option key={member._id} value={member._id}>
                  {/* Display photo and name in dropdown */}
                  {member.photo && (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="inline-block h-8 w-8 rounded-full mr-2"
                    />
                  )}
                  {member.name}
                </option>
              ))}
            </select>

            {/* Display selected member's photo and name */}
            {selectedMemberId && members && (
              <div className="flex items-center space-x-4 mt-4">
                {/* Find the selected member */}
                {members.map((member) =>
                  member._id === selectedMemberId ? (
                    <div key={member._id} className="flex items-center">
                      {member.photo && (
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="h-12 w-12 rounded-full mr-4"
                        />
                      )}
                      <span className="text-lg font-medium text-gray-900">{member.name}</span>
                    </div>
                  ) : null
                )}
              </div>
            )}

            <div className="flex space-x-4 mt-4">
              {/* Record Entry */}
              <button
                onClick={() => selectedMemberId && entryMutation.mutate(selectedMemberId)}
                disabled={!selectedMemberId}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Record Entry
              </button>

              {/* Record Exit */}
              <button
                onClick={() => selectedMemberId && exitMutation.mutate(selectedMemberId)}
                disabled={!selectedMemberId}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Record Exit
              </button>
            </div>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Today's Attendance</h2>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                    Member
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Entry Time
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Exit Time
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {todayAttendance?.map((record: any) => (
                  <tr key={record._id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                      <div className="flex items-center">
                        {/* Display member photo and name */}
                        {record.memberId.photo && (
                          <img
                            src={record.memberId.photo}
                            alt=""
                            className="h-8 w-8 rounded-full mr-2"
                          />
                        )}
                        {record.memberId.name}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Date(record.entryTime).toLocaleTimeString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {record.exitTime
                        ? new Date(record.exitTime).toLocaleTimeString()
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {/* Display Mark Exit button only if entry is done */}
                      {record.entryTime && !record.exitTime && (
                        <button
                          onClick={() => exitMutation.mutate(record.memberId._id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                        >
                          Mark Exit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
