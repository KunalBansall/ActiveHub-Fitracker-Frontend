import React from "react";
import { Dialog, Transition } from '@headlessui/react';
import { useQuery } from "react-query";
import axios from "axios";
import { Attendance, Member } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface AttendanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId?: string;
  attendance?: Attendance[];
}

export default function AttendanceHistoryModal({ isOpen, onClose, memberId, attendance: propAttendance }: AttendanceHistoryModalProps) {
  const token = localStorage.getItem("token");

  const { data: fetchedAttendance, isLoading, error } = useQuery<Attendance[]>(
    ["attendanceHistory", memberId],
    () => 
      axios
        .get(`${API_URL}/attendance/history/${memberId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => res.data),
    {
      enabled: !!memberId && isOpen,
    }
  );

  const attendance = propAttendance || fetchedAttendance;

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={onClose}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>
          
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                Attendance History
              </Dialog.Title>
              <div className="mt-2">
                {isLoading ? (
                  <p className="text-sm text-gray-500">Loading attendance history...</p>
                ) : error ? (
                  <p className="text-sm text-red-500">Error loading attendance history.</p>
                ) : attendance && attendance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Entry Time
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Exit Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendance.map((record) => (
                          <tr key={record._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(record.entryTime).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(record.entryTime).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {record.exitTime
                                ? new Date(record.exitTime).toLocaleTimeString()
                                : "Still Active"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No attendance history found for this member.</p>
                )}
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

