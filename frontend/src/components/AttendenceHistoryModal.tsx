import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useQuery } from "react-query";
import axios from "axios";
import { Attendance } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface AttendanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId?: string;
  attendance?: Attendance[];
}

export default function AttendanceHistoryModal({
  isOpen,
  onClose,
  memberId,
  attendance: propAttendance,
}: AttendanceHistoryModalProps) {
  const [displayCount, setDisplayCount] = useState(10);
  const [localAttendance, setLocalAttendance] = useState<Attendance[]>([]);

  const token = localStorage.getItem("token");

  const {
    data: fetchedAttendance,
    isLoading,
    error,
  } = useQuery<Attendance[]>(
    ["attendanceHistory", memberId],
    () =>
      axios
        .get(`${API_URL}/member-attendance/history`, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then((res) => res.data),
    {
      enabled: !!memberId && isOpen && !propAttendance,
    }
  );

  useEffect(() => {
    if (propAttendance) {
      setLocalAttendance(propAttendance);
    } else if (fetchedAttendance) {
      setLocalAttendance(fetchedAttendance);
    }
  }, [propAttendance, fetchedAttendance]);

  const formatDate = (date: Date) => {
    return `${date.getDate().toString().padStart(2, "0")}/${date.toLocaleString(
      "default",
      { month: "short" }
    )}/${date.getFullYear().toString().slice(2)}`;
  };

  const calculateDuration = (entryTime: string, exitTime: string | null) => {
    const entry = new Date(entryTime);
    const exit = exitTime ? new Date(exitTime) : new Date();
    const diff = exit.getTime() - entry.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleLoadMore = () => {
    setDisplayCount((prevCount) => prevCount + 10);
  };

  // console.log("Local attendance:", localAttendance);
  // console.log("Display count:", displayCount);

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={onClose}
      >
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

          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
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
            <div className="inline-block w-full max-w-xl p-6 my-8 overflow-hidden text-center align-middle transition-all transform bg-white shadow-xl rounded-2xl ">
              <Dialog.Title
                as="h3"
                className="text-2xl leading-6 text-blue-900 font-bold mb-4 text-shadow-2xl"
              >
                Attendance History
              </Dialog.Title>
              <div className="mt-2">
                {isLoading ? (
                  <p className="text-sm text-gray-500">
                    Loading attendance history...
                  </p>
                ) : error ? (
                  <p className="text-sm text-red-500">
                    Error loading attendance history.
                  </p>
                ) : localAttendance && localAttendance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                          >
                            Entry Time
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                          >
                            Exit Time
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                          >
                            Session Duration
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {localAttendance
                          .slice(0, displayCount)
                          .map((record) => (
                            <tr key={record._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {formatDate(new Date(record.entryTime))}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(
                                  record.entryTime
                                ).toLocaleTimeString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {record.exitTime
                                  ? new Date(
                                      record.exitTime
                                    ).toLocaleTimeString()
                                  : "Still Active"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {calculateDuration(
                                  record.entryTime,
                                  record.exitTime ?? null
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No attendance history found for this member.
                  </p>
                )}
              </div>

              {localAttendance && localAttendance.length > displayCount && (
                <div className="mt-4 text-center">
                  <button
                    onClick={handleLoadMore}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 transition-colors duration-200"
                  >
                    Load More
                  </button>
                </div>
              )}

              <div className="mt-6">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 transition-colors duration-200"
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
