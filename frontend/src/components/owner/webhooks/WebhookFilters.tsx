import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { 
  FunnelIcon, 
  XMarkIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface FilterState {
  event: string;
  eventType: string;
  status: string;
  gymName: string;
  adminId: string;
  issueFlag: string;
  startDate: string;
  endDate: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
  includeAnalytics: boolean;
}

interface Gym {
  _id: string;
  gymName: string;
}

interface WebhookFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

const WebhookFilters: React.FC<WebhookFiltersProps> = ({ filters, onFilterChange }) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  
  // Fetch gyms for dropdown
  const { data: gymsData } = useQuery<{ gyms: Gym[] }>({
    queryKey: ['gyms-for-webhooks'],
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
  
  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: checked ? 'true' : ''
    }));
  };
  
  // Apply filters
  const applyFilters = () => {
    onFilterChange(localFilters);
  };
  
  // Reset filters
  const resetFilters = () => {
    const resetState = {
      event: '',
      eventType: '',
      status: '',
      gymName: '',
      adminId: '',
      issueFlag: '',
      startDate: '',
      endDate: '',
      sortBy: 'receivedAt',
      sortOrder: 'desc' as const,
      page: 1,
      limit: 20,
      includeAnalytics: true
    };
    setLocalFilters(resetState);
    onFilterChange(resetState);
  };
  
  // Toggle filters panel
  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };
  
  // Quick filter presets
  const applyQuickFilter = (preset: string) => {
    let newFilters: Partial<FilterState> = {};
    
    switch (preset) {
      case 'issues':
        newFilters = { issueFlag: 'true' };
        break;
      case 'payments':
        newFilters = { eventType: 'payment' };
        break;
      case 'subscriptions':
        newFilters = { eventType: 'subscription' };
        break;
      case 'failures':
        newFilters = { status: 'failed' };
        break;
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        newFilters = { startDate: today, endDate: today };
        break;
      case 'last7days':
        const today7 = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today7.getDate() - 7);
        newFilters = { 
          startDate: sevenDaysAgo.toISOString().split('T')[0],
          endDate: today7.toISOString().split('T')[0]
        };
        break;
    }
    
    setLocalFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    onFilterChange(newFilters);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Quick filters and toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleFilters}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100"
          >
            <FunnelIcon className="h-4 w-4" />
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
          
          <div className="h-6 border-l border-gray-300 mx-1"></div>
          
          {/* Quick filter buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyQuickFilter('issues')}
              className={`px-2 py-1 text-xs rounded-full ${
                localFilters.issueFlag === 'true'
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Issues Only
            </button>
            <button
              onClick={() => applyQuickFilter('payments')}
              className={`px-2 py-1 text-xs rounded-full ${
                localFilters.eventType === 'payment'
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Payments
            </button>
            <button
              onClick={() => applyQuickFilter('subscriptions')}
              className={`px-2 py-1 text-xs rounded-full ${
                localFilters.eventType === 'subscription'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => applyQuickFilter('failures')}
              className={`px-2 py-1 text-xs rounded-full ${
                localFilters.status === 'failed'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Failures
            </button>
            <button
              onClick={() => applyQuickFilter('today')}
              className={`px-2 py-1 text-xs rounded-full ${
                localFilters.startDate === new Date().toISOString().split('T')[0] &&
                localFilters.endDate === new Date().toISOString().split('T')[0]
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => applyQuickFilter('last7days')}
              className={`px-2 py-1 text-xs rounded-full ${
                localFilters.startDate && localFilters.endDate &&
                new Date(localFilters.endDate).getTime() - new Date(localFilters.startDate).getTime() <= 7 * 24 * 60 * 60 * 1000
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 Days
            </button>
          </div>
        </div>
        
        {/* Active filters count */}
        {Object.entries(localFilters).filter(([key, value]) => 
          value && key !== 'page' && key !== 'limit' && key !== 'sortBy' && key !== 'sortOrder' && key !== 'includeAnalytics'
        ).length > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
          >
            <XMarkIcon className="h-4 w-4" />
            <span>Clear All Filters</span>
          </button>
        )}
      </div>
      
      {/* Detailed filters panel */}
      {showFilters && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Event Type filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                name="eventType"
                value={localFilters.eventType}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">All Event Types</option>
                <option value="payment">Payment</option>
                <option value="subscription">Subscription</option>
                <option value="order">Order</option>
                <option value="refund">Refund</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {/* Event Name filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Name
              </label>
              <input
                type="text"
                name="event"
                value={localFilters.event}
                onChange={handleInputChange}
                placeholder="e.g. payment.captured"
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={localFilters.status}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="captured">Captured</option>
                <option value="authorized">Authorized</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="created">Created</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="halted">Halted</option>
              </select>
            </div>
            
            {/* Gym filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gym
              </label>
              <select
                name="adminId"
                value={localFilters.adminId}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">All Gyms</option>
                {gymsData?.gyms.map(gym => (
                  <option key={gym._id} value={gym._id}>
                    {gym.gymName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date Range filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="startDate"
                  value={localFilters.startDate}
                  onChange={handleInputChange}
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
                  value={localFilters.endDate}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <CalendarIcon className="h-5 w-5 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            
            {/* Issues Only checkbox */}
            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                id="issueFlag"
                name="issueFlag"
                checked={localFilters.issueFlag === 'true'}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="issueFlag" className="ml-2 block text-sm text-gray-700">
                Show Issues Only
              </label>
            </div>
          </div>
          
          {/* Apply filters button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookFilters;
