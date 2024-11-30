import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Member } from '../types';
import React from 'react';


export default function Attendance() {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const queryClient = useQueryClient();

  const { data: members } = useQuery<Member[]>('members', () =>
    axios.get('http://localhost:3000/api/members').then((res) => res.data)
  );

  const { data: todayAttendance } = useQuery('todayAttendance', () =>
    axios.get('http://localhost:3000/api/attendance/today').then((res) => res.data)
  );

  const entryMutation = useMutation(
    (memberId: string) => axios.post(`http://localhost:3000/api/attendance/entry/${memberId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('todayAttendance');
        toast.success('Entry recorded successfully');
        setSelectedMemberId('');
      },
    }
  );

  const exitMutation = useMutation(
    (memberId: string) => axios.post(`http://localhost:3000/api/attendance/exit/${memberId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('todayAttendance');
        toast.success('Exit recorded successfully');
        setSelectedMemberId('');
      },
    }
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Attendance</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Record Entry/Exit</h2>
          <div className="space-y-4">
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Member</option>
              {members?.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
            <div className="flex space-x-4">
              <button
                onClick={() => selectedMemberId && entryMutation.mutate(selectedMemberId)}
                disabled={!selectedMemberId}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Record Entry
              </button>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {todayAttendance?.map((record: any) => (
                  <tr key={record._id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                      <div className="flex items-center">
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