"use client"

import React, { useState, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { useQuery } from "react-query"
import axios from "axios"
import { Calendar, Clock, LogOut, Timer, X, ChevronDown, AlertCircle, Loader2, TrendingUp } from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

interface Attendance {
  _id: string
  entryTime: string
  exitTime?: string
  memberId?: string
}

interface AttendanceHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  memberId?: string
  attendance?: Attendance[]
  isAdmin?: boolean
}

export default function AttendanceHistoryModal({
  isOpen,
  onClose,
  memberId,
  attendance: propAttendance,
  isAdmin = false,
}: AttendanceHistoryModalProps) {
  const [displayCount, setDisplayCount] = useState(10)
  const [localAttendance, setLocalAttendance] = useState<Attendance[]>([])

  const token = localStorage.getItem("token")

  const {
    data: fetchedAttendance,
    isLoading,
    error,
  } = useQuery<Attendance[]>(
    ["attendanceHistory", memberId, isAdmin],
    () => {
      const endpoint = isAdmin ? `${API_URL}/attendance/history/${memberId}` : `${API_URL}/member-attendance/history`

      return axios
        .get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => res.data)
    },
    {
      enabled: !!token && isOpen && !propAttendance,
    },
  )

  useEffect(() => {
    if (propAttendance) {
      setLocalAttendance(propAttendance)
    } else if (fetchedAttendance) {
      setLocalAttendance(fetchedAttendance)
    }
  }, [propAttendance, fetchedAttendance])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const calculateDuration = (entryTime: string, exitTime: string | null) => {
    const entry = new Date(entryTime)
    const exit = exitTime ? new Date(exitTime) : new Date()
    const diff = exit.getTime() - entry.getTime()
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getTotalHours = () => {
    if (!localAttendance.length) return 0

    const totalMs = localAttendance.reduce((total, record) => {
      const entry = new Date(record.entryTime)
      const exit = record.exitTime ? new Date(record.exitTime) : new Date()
      return total + (exit.getTime() - entry.getTime())
    }, 0)

    return Math.round((totalMs / 3600000) * 10) / 10
  }

  const getStatusBadge = (exitTime: string | null) => {
    if (!exitTime) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Active
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
        <LogOut className="w-3 h-3" />
        Completed
      </span>
    )
  }

  const handleLoadMore = () => {
    setDisplayCount((prevCount) => prevCount + 10)
  }

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={onClose}>
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
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

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
            <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
              {/* Header */}
              <div className="relative px-6 py-6 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                        Attendance History
                      </Dialog.Title>
                      <p className="text-sm text-gray-500 mt-1">Track your attendance records and session durations</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Stats */}
                {localAttendance.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-gray-600">Total Sessions</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{localAttendance.length}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Total Hours</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{getTotalHours()}h</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-600">Avg Session</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {Math.round((getTotalHours() / localAttendance.length) * 10) / 10}h
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="px-6 py-6 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                      <p className="text-sm text-gray-500">Loading attendance history...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
                      <p className="text-sm text-red-600 font-medium">Error loading attendance history</p>
                      <p className="text-xs text-gray-500 mt-1">Please try again later</p>
                    </div>
                  </div>
                ) : localAttendance && localAttendance.length > 0 ? (
                  <div className="space-y-3">
                    {localAttendance.slice(0, displayCount).map((record, index) => (
                      <div
                        key={record._id}
                        className="group p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-gray-600" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="text-sm font-semibold text-gray-900">
                                  {formatDate(new Date(record.entryTime))}
                                </p>
                                {getStatusBadge(record.exitTime || null)}
                              </div>
                              <div className="flex items-center gap-6 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>In: {formatTime(record.entryTime)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <LogOut className="w-3 h-3" />
                                  <span>Out: {record.exitTime ? formatTime(record.exitTime) : "Active"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                              <Timer className="w-4 h-4 text-gray-400" />
                              {calculateDuration(record.entryTime, record.exitTime || null)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm text-gray-500 font-medium">No attendance records found</p>
                      <p className="text-xs text-gray-400 mt-1">Your attendance history will appear here</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                {localAttendance && localAttendance.length > displayCount && (
                  <button
                    onClick={handleLoadMore}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Load More ({localAttendance.length - displayCount} remaining)
                  </button>
                )}
                <div className="ml-auto">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-900 border border-transparent rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
