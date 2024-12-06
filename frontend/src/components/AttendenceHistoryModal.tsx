import React from "react";
import { useQuery } from "react-query";
import axios from "axios";
import { Attendance } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface Props {
  memberId: string;
  onClose: () => void;
}

export default function AttendanceHistoryModal({ memberId, onClose }: Props) {
  const token = localStorage.getItem("token");

  // Fetch attendance history
  const { data: history, isLoading, error } = useQuery<Attendance[]>(
    ["attendanceHistory", memberId],
    () =>
      axios
        .get(`${API_URL}/attendance/history/${memberId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => res.data)
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading attendance history.</div>;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-1/2">
        <h2 className="text-2xl font-semibold mb-4">Attendance History</h2>

        {history && history.length > 0 ? (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b py-2">Date</th>
                <th className="border-b py-2">Entry Time</th>
                <th className="border-b py-2">Exit Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
                <tr key={record._id}>
                  <td className="border-b text-center">
                    {new Date(record.entryTime).toLocaleDateString()}
                  </td>
                  <td className="border-b text-center">
                    {new Date(record.entryTime).toLocaleTimeString()}
                  </td>
                  <td className="border-b text-center">
                    {record.exitTime
                      ? new Date(record.exitTime).toLocaleTimeString()
                      : "Still Active"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No attendance history found for this member.</p>
        )}

        <button
          onClick={onClose}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
