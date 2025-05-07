import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { format, subDays } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  ArrowPathIcon,
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

// Define types
interface WebhookAnalytics {
  totalWebhooks: number;
  paymentStatusCounts: { _id: string; count: number }[];
  subscriptionStatusCounts: { _id: string; count: number }[];
  eventTypeCounts: { _id: string; count: number }[];
  gymCounts: { _id: string; count: number; issueCount: number }[];
  dailyTrends: { date: string; total: number; success: number; failed: number }[];
  hourlyDistribution: { _id: number; count: number }[];
  processingTimeByType: { 
    _id: string; 
    avgTime: number;
    minTime: number;
    maxTime: number;
  }[];
  issueCount: number;
  duplicateCount: number;
  testModeCount: number;
}

interface FilterState {
  startDate: string;
  endDate: string;
  adminId: string;
  gymName: string;
}

const WebhookAnalyticsDashboard: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // Set default date range to last 30 days
  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30);
  
  // State
  const [filters, setFilters] = useState<FilterState>({
    startDate: format(thirtyDaysAgo, 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
    adminId: '',
    gymName: ''
  });
  
  // Fetch gyms for dropdown
  const { data: gymsData } = useQuery({
    queryKey: ['gyms-for-analytics'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');
      
      const response = await axios.get(`${apiUrl}/owner/gyms`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch webhook analytics
  const { data, isLoading, isError, refetch } = useQuery<{ success: boolean; analytics: WebhookAnalytics }>({
    queryKey: ['webhook-analytics', filters],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');
      
      // Build query string
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.adminId) queryParams.append('adminId', filters.adminId);
      if (filters.gymName) queryParams.append('gymName', filters.gymName);
      
      const response = await axios.get(`${apiUrl}/owner/webhooks/analytics?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle refresh
  const handleRefresh = () => {
    refetch();
    toast.success('Analytics data refreshed');
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy');
  };
  
  // Calculate success rate
  const calculateSuccessRate = (statusCounts: { _id: string; count: number }[]) => {
    const successStatuses = ['captured', 'authorized', 'active'];
    const totalCount = statusCounts.reduce((sum, item) => sum + item.count, 0);
    const successCount = statusCounts
      .filter(item => successStatuses.includes(item._id))
      .reduce((sum, item) => sum + item.count, 0);
    
    return totalCount > 0 ? (successCount / totalCount) * 100 : 0;
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex space-x-4 items-center">
          <div className="rounded-full bg-indigo-100 h-12 w-12 flex items-center justify-center">
            <ClockIcon className="h-6 w-6 text-indigo-500" />
          </div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-indigo-100 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-indigo-100 rounded"></div>
              <div className="h-4 bg-indigo-100 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-4">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Error Loading Analytics</h3>
          <p className="mt-2 text-sm text-gray-500">
            There was an error loading the analytics data. Please try again later.
          </p>
        </div>
      </div>
    );
  }
  
  const analytics = data?.analytics;
  
  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-4">
          <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Data Available</h3>
          <p className="mt-2 text-sm text-gray-500">
            No webhook data available for the selected filters.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Webhook Analytics Dashboard</h1>
        <div className="flex items-center gap-3">
          <a
            href="/owner-dashboard/webhooks"
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Webhooks</span>
          </a>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <CalendarIcon className="h-5 w-5 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <div className="relative">
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <CalendarIcon className="h-5 w-5 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gym
            </label>
            <select
              name="adminId"
              value={filters.adminId}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Gyms</option>
              {gymsData?.gyms?.map((gym: any) => (
                <option key={gym._id} value={gym._id}>
                  {gym.gymName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Webhooks */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Webhooks</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analytics.totalWebhooks.toLocaleString()}
              </p>
            </div>
            <div className="bg-indigo-100 rounded-full p-3">
              <ChartBarIcon className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {formatDate(filters.startDate)} - {formatDate(filters.endDate)}
          </p>
        </div>
        
        {/* Payment Success Rate */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Payment Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {calculateSuccessRate(analytics.paymentStatusCounts).toFixed(1)}%
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Based on {analytics.paymentStatusCounts.reduce((sum, item) => sum + item.count, 0)} payment events
          </p>
        </div>
        
        {/* Issues */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Issues Detected</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analytics.issueCount.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {analytics.totalWebhooks > 0 
              ? `${((analytics.issueCount / analytics.totalWebhooks) * 100).toFixed(1)}% of total webhooks`
              : 'No webhooks received'}
          </p>
        </div>
        
        {/* Avg Processing Time */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Processing Time</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analytics.processingTimeByType.length > 0
                  ? `${(analytics.processingTimeByType.reduce((sum, item) => sum + item.avgTime, 0) / 
                      analytics.processingTimeByType.length).toFixed(2)}ms`
                  : 'N/A'}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Across all event types
          </p>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends Chart */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Daily Webhook Trends</h3>
          
          <div className="h-64 flex items-end space-x-1">
            {analytics.dailyTrends.map((day, index) => {
              const maxValue = Math.max(...analytics.dailyTrends.map(d => d.total));
              const successHeight = maxValue > 0 ? (day.success / maxValue) * 100 : 0;
              const failedHeight = maxValue > 0 ? (day.failed / maxValue) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col-reverse h-full">
                    {/* Failed bar */}
                    <div 
                      className="w-full bg-red-400 hover:bg-red-500 transition-all cursor-pointer relative group"
                      style={{ height: `${Math.max(failedHeight, 0)}%` }}
                    >
                      {failedHeight > 0 && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                          {day.failed} failed
                        </div>
                      )}
                    </div>
                    
                    {/* Success bar */}
                    <div 
                      className="w-full bg-green-400 hover:bg-green-500 transition-all cursor-pointer relative group"
                      style={{ height: `${Math.max(successHeight, 0)}%` }}
                    >
                      {successHeight > 0 && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                          {day.success} successful
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                    {format(new Date(day.date), 'MMM dd')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Event Type Distribution */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Event Type Distribution</h3>
          
          <div className="space-y-4">
            {analytics.eventTypeCounts.map((item, index) => {
              const percentage = analytics.totalWebhooks > 0 
                ? (item.count / analytics.totalWebhooks) * 100 
                : 0;
              
              // Determine color based on event type
              let barColor = 'bg-gray-400';
              let textColor = 'text-gray-700';
              
              switch ((item._id || 'unknown').toLowerCase()) {
                case 'payment':
                  barColor = 'bg-green-400';
                  textColor = 'text-green-700';
                  break;
                case 'subscription':
                  barColor = 'bg-blue-400';
                  textColor = 'text-blue-700';
                  break;
                case 'order':
                  barColor = 'bg-purple-400';
                  textColor = 'text-purple-700';
                  break;
                case 'refund':
                  barColor = 'bg-yellow-400';
                  textColor = 'text-yellow-700';
                  break;
              }
              
              return (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-medium ${textColor}`}>
                      {item._id || 'Unknown'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {item.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`${barColor} h-2.5 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Gym Performance Table */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Gym Performance</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gym Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Webhook Count
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issues
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.gymCounts.map((gym, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {gym._id || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {gym.count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {gym.issueCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            gym.count > 0 && (gym.issueCount / gym.count) > 0.1 
                              ? 'bg-red-500' 
                              : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${gym.count > 0 ? (gym.issueCount / gym.count) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {gym.count > 0 ? ((gym.issueCount / gym.count) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WebhookAnalyticsDashboard;
