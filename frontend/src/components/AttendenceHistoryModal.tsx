"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { useQuery } from "react-query"
import axios from "axios"
import {
  Calendar,
  Clock,
  LogOut,
  Timer,
  X,
  ChevronDown,
  AlertCircle,
  Loader2,
  TrendingUp,
  Activity,
  CheckCircle2,
  PlayCircle,
  BarChart3,
  Filter,
  MapPin,
  Coffee,
  Zap,
} from "lucide-react"

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
  const [filterPeriod, setFilterPeriod] = useState<"all" | "week" | "month">("all")

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

  // Filter attendance based on selected period
  const filteredAttendance = useMemo(() => {
    if (!localAttendance.length) return []

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return localAttendance.filter((record) => {
      const recordDate = new Date(record.entryTime)

      switch (filterPeriod) {
        case "week":
          return recordDate >= startOfWeek
        case "month":
          return recordDate >= startOfMonth
        default:
          return true
      }
    })
  }, [localAttendance, filterPeriod])

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    }

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
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

  const getDurationInHours = (entryTime: string, exitTime: string | null) => {
    const entry = new Date(entryTime)
    const exit = exitTime ? new Date(exitTime) : new Date()
    const diff = exit.getTime() - entry.getTime()
    return diff / 3600000
  }

  const getStats = () => {
    if (!filteredAttendance.length) return { total: 0, totalHours: 0, avgHours: 0, activeSession: false }

    const totalHours = filteredAttendance.reduce((total, record) => {
      return total + getDurationInHours(record.entryTime, record.exitTime || null)
    }, 0)

    const activeSession = filteredAttendance.some((record) => !record.exitTime)

    return {
      total: filteredAttendance.length,
      totalHours: Math.round(totalHours * 10) / 10,
      avgHours: Math.round((totalHours / filteredAttendance.length) * 10) / 10,
      activeSession,
    }
  }

  const stats = getStats()

  const getSessionType = (hours: number) => {
    if (hours >= 8) return { label: "Full Day", icon: Zap, color: "emerald" }
    if (hours >= 4) return { label: "Half Day", icon: Coffee, color: "blue" }
    if (hours >= 1) return { label: "Short Session", icon: Clock, color: "amber" }
    return { label: "Quick Check", icon: MapPin, color: "gray" }
  }

  const getDurationDisplay = (entryTime: string, exitTime: string | null) => {
    const hours = getDurationInHours(entryTime, exitTime)
    const sessionType = getSessionType(hours)
    const IconComponent = sessionType.icon

    return {
      duration: calculateDuration(entryTime, exitTime),
      type: sessionType.label,
      icon: IconComponent,
      colorClass: `text-${sessionType.color}-600 bg-${sessionType.color}-50 border-${sessionType.color}-200`,
    }
  }

  const handleLoadMore = () => {
    setDisplayCount((prevCount) => prevCount + 10)
  }

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={onClose}>
        <div className="min-h-screen px-2 sm:px-4 text-center">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
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
            <div className="inline-block w-full max-w-sm sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl sm:rounded-3xl">
              {/* Header */}
              <div className="relative px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg">
                      <Activity className="w-4 h-4 sm:w-5 lg:w-6 text-white" />
                    </div>
                    <div>
                      <Dialog.Title as="h2" className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                        Attendance Overview
                      </Dialog.Title>
                      <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                        Your complete attendance history and insights
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-lg sm:rounded-xl transition-all duration-200"
                  >
                    <X className="w-5 h-5 sm:w-6 lg:w-6" />
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="mt-4 sm:mt-6 lg:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-white/50 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg">
                        <BarChart3 className="w-3 h-3 sm:w-4 lg:w-4 text-indigo-600" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600">Sessions</span>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-white/50 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg">
                        <Timer className="w-3 h-3 sm:w-4 lg:w-4 text-emerald-600" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600">Hours</span>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.totalHours}h</p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-white/50 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                        <TrendingUp className="w-3 h-3 sm:w-4 lg:w-4 text-blue-600" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600">Average</span>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.avgHours}h</p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-white/50 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <div
                        className={`p-1.5 sm:p-2 rounded-lg ${stats.activeSession ? "bg-emerald-100" : "bg-gray-100"}`}
                      >
                        <Activity
                          className={`w-3 h-3 sm:w-4 lg:w-4 ${stats.activeSession ? "text-emerald-600" : "text-gray-400"}`}
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600">Status</span>
                    </div>
                    <p
                      className={`text-sm sm:text-base lg:text-lg font-semibold ${stats.activeSession ? "text-emerald-600" : "text-gray-500"}`}
                    >
                      {stats.activeSession ? "Active" : "Offline"}
                    </p>
                  </div>
                </div>

                {/* Filters */}
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filter:</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {(["all", "week", "month"] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setFilterPeriod(period)}
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                          filterPeriod === period
                            ? "bg-indigo-600 text-white shadow-md"
                            : "bg-white/60 text-gray-600 hover:bg-white/80"
                        }`}
                      >
                        {period === "all" ? "All Time" : period === "week" ? "This Week" : "This Month"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-h-[60vh] sm:max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12 sm:py-16">
                    <div className="text-center">
                      <div className="relative">
                        <div className="w-12 h-12 sm:w-16 lg:w-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                          <Loader2 className="w-6 h-6 sm:w-8 lg:w-8 text-indigo-600 animate-spin" />
                        </div>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Loading Your Data</h3>
                      <p className="text-sm text-gray-500">Fetching your attendance history...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-12 sm:py-16">
                    <div className="text-center">
                      <div className="w-12 h-12 sm:w-16 lg:w-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                        <AlertCircle className="w-6 h-6 sm:w-8 lg:w-8 text-red-500" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Unable to Load Data</h3>
                      <p className="text-sm text-gray-500 mb-4">There was an error loading your attendance history</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : filteredAttendance && filteredAttendance.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        Recent Sessions ({filteredAttendance.length})
                      </h3>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      {filteredAttendance.slice(0, displayCount).map((record, index) => {
                        const durationInfo = getDurationDisplay(record.entryTime, record.exitTime || null)
                        const IconComponent = durationInfo.icon

                        return (
                          <div
                            key={record._id}
                            className="group p-4 sm:p-5 lg:p-6 bg-gray-50/50 hover:bg-white hover:shadow-md rounded-xl sm:rounded-2xl border border-gray-100 transition-all duration-300"
                          >
                            {/* Mobile Layout */}
                            <div className="block sm:hidden">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center shadow-sm">
                                    {record.exitTime ? (
                                      <CheckCircle2 className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <PlayCircle className="w-4 h-4 text-emerald-500" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="text-base font-semibold text-gray-900">
                                      {formatDate(new Date(record.entryTime))}
                                    </h4>
                                    <span
                                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                        record.exitTime
                                          ? "bg-gray-100 text-gray-600"
                                          : "bg-emerald-100 text-emerald-700"
                                      }`}
                                    >
                                      {record.exitTime ? "Completed" : "Active"}
                                      {!record.exitTime && (
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full ml-2 animate-pulse" />
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2 mb-3">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-4 h-4 text-emerald-500" />
                                    <span>Check In</span>
                                  </div>
                                  <span className="font-medium text-gray-900">{formatTime(record.entryTime)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <LogOut className="w-4 h-4 text-gray-400" />
                                    <span>Check Out</span>
                                  </div>
                                  <span className="font-medium text-gray-900">
                                    {record.exitTime ? formatTime(record.exitTime) : "Still active"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                                  <IconComponent className="w-4 h-4 text-indigo-600" />
                                  <span className="text-sm font-medium text-gray-700">{durationInfo.type}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-gray-900">{durationInfo.duration}</div>
                                </div>
                              </div>
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden sm:block">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 lg:gap-5">
                                  <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center shadow-sm">
                                      {record.exitTime ? (
                                        <CheckCircle2 className="w-5 h-5 text-gray-400" />
                                      ) : (
                                        <PlayCircle className="w-5 h-5 text-emerald-500" />
                                      )}
                                    </div>
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-4 mb-3">
                                      <h4 className="text-lg font-semibold text-gray-900">
                                        {formatDate(new Date(record.entryTime))}
                                      </h4>
                                      <span
                                        className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                                          record.exitTime
                                            ? "bg-gray-100 text-gray-600"
                                            : "bg-emerald-100 text-emerald-700"
                                        }`}
                                      >
                                        {record.exitTime ? "Completed" : "Active Session"}
                                        {!record.exitTime && (
                                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full ml-2 animate-pulse" />
                                        )}
                                      </span>
                                      <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-gray-200">
                                        <IconComponent className="w-4 h-4 text-indigo-600" />
                                        <span className="text-sm font-medium text-gray-700">{durationInfo.type}</span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-emerald-500" />
                                        <span className="text-gray-600">Check In:</span>
                                        <span className="font-medium text-gray-900">
                                          {formatTime(record.entryTime)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <LogOut className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">Check Out:</span>
                                        <span className="font-medium text-gray-900">
                                          {record.exitTime ? formatTime(record.exitTime) : "Still active"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-2xl font-bold text-gray-900 mb-1">{durationInfo.duration}</div>
                                  <p className="text-xs text-gray-500">Total Duration</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12 sm:py-16">
                    <div className="text-center">
                      <div className="w-12 h-12 sm:w-16 lg:w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                        <Calendar className="w-6 h-6 sm:w-8 lg:w-8 text-gray-400" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                        No Records for{" "}
                        {filterPeriod === "all" ? "All Time" : filterPeriod === "week" ? "This Week" : "This Month"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {filterPeriod === "all"
                          ? "Your attendance history will appear here once you start checking in"
                          : "Try selecting a different time period to see more records"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-2xl sm:rounded-b-3xl">
                {filteredAttendance && filteredAttendance.length > displayCount && (
                  <button
                    onClick={handleLoadMore}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Load {Math.min(10, filteredAttendance.length - displayCount)} More Records
                  </button>
                )}
                <div className="w-full sm:w-auto sm:ml-auto">
                  <button
                    type="button"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
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
