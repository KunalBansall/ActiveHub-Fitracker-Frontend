import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import LoadingSpinner from '../../components/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL;

// Types for analytics data
interface AnalyticsOverview {
  totalRevenue: number;
  totalCapturedPayments: {
    count: number;
    amount: number;
  };
  totalFailedPayments: {
    count: number;
    amount: number;
  };
  totalRefunds: {
    count: number;
    amount: number;
  };
  subscriptionStats: {
    created: number;
    renewed: number;
    cancelled: number;
  };
  monthlyRevenueChart: {
    month: string;
    total: number;
  }[];
  topPlans: {
    planName: string;
    count: number;
  }[];
  topPayingGyms: {
    _id: string;
    gymName: string;
    total: number;
  }[];
}

// Types for webhook logs
interface WebhookLog {
  _id: string;
  eventType: string;
  adminId: string;
  gymInfo?: {
    _id: string;
    gymName: string;
    email: string;
  };
  paymentId?: string;
  amount?: number;
  status: 'success' | 'failed';
  createdAt: string;
}

interface FilterState {
  eventType: string;
  gymName: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

const EVENT_TYPES = [
  'payment.captured',
  'payment.failed',
  'subscription.created',
  'subscription.renewed',
  'subscription.cancelled',
  'refund.created',
  'refund.failed',
  'all'
];

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>({
    eventType: '',
    gymName: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(1);
  const [gyms, setGyms] = useState<Array<{_id: string, gymName: string, email: string}>>([]);
  const [filteredGyms, setFilteredGyms] = useState<Array<{_id: string, gymName: string, email: string}>>([]);
  const [showGymSuggestions, setShowGymSuggestions] = useState(false);

  // Extract user from localStorage
  const user = (() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  })();

  // Check if user is owner
  useEffect(() => {
    if (!user || user.role !== 'owner') {
      toast.error('You are not authorized to access this page');
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch gyms for autocomplete
  useEffect(() => {
    const fetchGyms = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get(`${API_URL}/owner/gyms`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.gyms) {
          setGyms(response.data.gyms.map((gym: any) => ({
            _id: gym._id,
            gymName: gym.gymName,
            email: gym.email
          })));
        }
      } catch (error) {
        console.error('Error fetching gyms:', error);
      }
    };
    
    fetchGyms();
  }, []);
  
  // Filter gyms based on search input
  useEffect(() => {
    if (filters.gymName.trim() === '') {
      setFilteredGyms([]);
      return;
    }
    
    const filtered = gyms.filter(gym => 
      gym.gymName.toLowerCase().includes(filters.gymName.toLowerCase()) ||
      gym.email.toLowerCase().includes(filters.gymName.toLowerCase())
    );
    
    setFilteredGyms(filtered);
  }, [filters.gymName, gyms]);

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery<AnalyticsOverview>(
    ['ownerAnalytics', filters.startDate, filters.endDate],
    async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      let url = `${API_URL}/owner/analytics`;
      
      // Add date filters if provided
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    {
      enabled: !!user && user.role === 'owner',
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      onError: (err) => {
        console.error('Error fetching analytics:', err);
        toast.error('Failed to load analytics data');
      }
    }
  );

  // Fetch webhook logs with filtering and pagination
  const { 
    data: webhookData, 
    isLoading: webhooksLoading,
    refetch: refetchWebhooks
  } = useQuery(
    ['ownerWebhooks', filters],
    async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      let url = `${API_URL}/owner/webhooks`;
      
      // Add filters if provided
      const params = new URLSearchParams();
      if (filters.eventType && filters.eventType !== 'all') params.append('eventType', filters.eventType);
      if (filters.gymName) params.append('gymName', filters.gymName);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());
      
      url += `?${params.toString()}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update total pages
      if (response.data.totalPages) {
        setTotalPages(response.data.totalPages);
      }
      
      return response.data;
    },
    {
      enabled: !!user && user.role === 'owner',
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: 1,
      onError: (err) => {
        console.error('Error fetching webhook logs:', err);
        toast.error('Failed to load webhook logs');
      }
    }
  );

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: name === 'page' ? parseInt(value) : prev.page
    }));
    
    if (name === 'gymName') {
      setShowGymSuggestions(true);
    }
  };
  
  const handleGymSelect = (gymName: string) => {
    setFilters(prev => ({
      ...prev,
      gymName: gymName
    }));
    setShowGymSuggestions(false);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Safely access nested properties
  const safeGet = (obj: any, path: string, fallback: any = 0) => {
    return path.split('.').reduce((prev, curr) => {
      return prev && prev[curr] !== undefined ? prev[curr] : fallback;
    }, obj);
  };

  // Render analytics cards
  const renderAnalyticsCards = () => {
    if (analyticsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      );
    }

    if (analyticsError) {
      return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <p className="text-red-700">Error loading analytics data. Please try again.</p>
        </div>
      );
    }

    const cards = [
      {
        title: 'Total Revenue',
        value: `₹${safeGet(analyticsData, 'totalRevenue', 0).toLocaleString()}`,
        change: '+12%',
        bgColor: 'bg-green-500',
        textColor: 'text-green-500'
      },
      {
        title: 'Captured Payments',
        value: safeGet(analyticsData, 'totalPayments.captured', 0).toLocaleString(),
        subValue: `₹${safeGet(analyticsData, 'totalRevenue', 0).toLocaleString()}`,
        change: '+5%',
        bgColor: 'bg-blue-500',
        textColor: 'text-blue-500'
      },
      {
        title: 'Failed Payments',
        value: safeGet(analyticsData, 'totalPayments.failed', 0).toLocaleString(),
        change: '-2%',
        bgColor: 'bg-red-500',
        textColor: 'text-red-500'
      },
      {
        title: 'Total Refunds',
        value: safeGet(analyticsData, 'totalRefunds.count', 0).toLocaleString(),
        subValue: `₹${safeGet(analyticsData, 'totalRefunds.amount', 0).toLocaleString()}`,
        change: '+3%',
        bgColor: 'bg-yellow-500',
        textColor: 'text-yellow-500'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">{card.title}</h3>
            <div className="mt-1">
              <p className="text-2xl font-bold">{card.value}</p>
              {card.subValue && (
                <p className="text-sm text-gray-500">{card.subValue}</p>
              )}
            </div>
            <div className="mt-2 flex items-center">
              <span className={`${card.textColor} text-sm font-medium`}>
                {card.change}
              </span>
              <span className="text-gray-500 text-sm ml-1">vs last month</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render subscription stats
  const renderSubscriptionStats = () => {
    if (!analyticsData) return null;

    const subscriptionData = [
      { name: 'Created', value: safeGet(analyticsData, 'subscriptionStats.created', 0) },
      { name: 'Renewed', value: safeGet(analyticsData, 'subscriptionStats.renewed', 0) },
      { name: 'Cancelled', value: safeGet(analyticsData, 'subscriptionStats.cancelled', 0) }
    ];

    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-700 text-lg font-medium mb-4">Subscription Stats</h3>
        <div className="grid grid-cols-3 gap-4">
          {subscriptionData.map((item, index) => (
            <div key={index} className="text-center">
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-sm text-gray-500">{item.name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render revenue chart
  const renderRevenueChart = () => {
    if (!analyticsData?.monthlyRevenueChart) return null;

    const chartData = analyticsData.monthlyRevenueChart.map(item => ({
      month: item.month.substring(5), // Remove year part for cleaner display
      revenue: item.total
    }));

    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-700 text-lg font-medium mb-4">Monthly Revenue</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
              <Legend />
              <Bar dataKey="revenue" fill="#4f46e5" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render top paying gyms
  const renderTopGyms = () => {
    if (!analyticsData?.topPayingGyms) return null;

    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-700 text-lg font-medium mb-4">Top Paying Gyms</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gym Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.topPayingGyms.map((gym) => (
                <tr key={gym._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{gym.gymName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{gym.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render top subscription plans
  const renderTopPlans = () => {
    if (!analyticsData?.topPlans) return null;

    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-700 text-lg font-medium mb-4">Top Subscription Plans</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.topPlans.map((plan, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{plan.planName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render webhook logs
  const renderWebhookLogs = () => {
    if (webhooksLoading) {
      return (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (!webhookData || !webhookData.webhooks) {
      return (
        <div className="text-center py-8 text-gray-500">
          No webhook logs found.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gym</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {webhookData.webhooks.map((log: WebhookLog) => (
              <tr key={log._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.eventType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.gymInfo ? log.gymInfo.gymName : 'Unknown Gym'}
                  {log.gymInfo && <div className="text-xs text-gray-400">{log.gymInfo.email}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.amount ? `₹${log.amount.toLocaleString()}` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            Showing page {filters.page} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1}
              className={`px-3 py-1 rounded ${
                filters.page === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page === totalPages}
              className={`px-3 py-1 rounded ${
                filters.page === totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!user || user.role !== 'owner') return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-800">Owner Analytics</h1>
        <p className="text-gray-600 mt-1">
          Overview of your business performance and webhook logs
        </p>
      </div>

      {/* Analytics Overview */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Analytics Overview</h2>
          <div className="flex space-x-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        {renderAnalyticsCards()}

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderRevenueChart()}
          {renderSubscriptionStats()}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderTopGyms()}
          {renderTopPlans()}
        </div>
      </div>

      {/* Webhook Logs */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Webhook Logs</h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label htmlFor="eventType" className="block text-sm font-medium text-gray-700">Event Type</label>
            <select
              id="eventType"
              name="eventType"
              value={filters.eventType}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Events</option>
              {EVENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="gymName" className="block text-sm font-medium text-gray-700">Gym Name</label>
            <div className="relative">
              <input
                type="text"
                id="gymName"
                name="gymName"
                value={filters.gymName}
                onChange={handleFilterChange}
                onFocus={() => setShowGymSuggestions(true)}
                onBlur={() => setTimeout(() => setShowGymSuggestions(false), 200)}
                placeholder="Search by gym name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {showGymSuggestions && filteredGyms.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-sm">
                  {filteredGyms.slice(0, 5).map(gym => (
                    <div 
                      key={gym._id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleGymSelect(gym.gymName)}
                    >
                      <div className="font-medium">{gym.gymName}</div>
                      <div className="text-xs text-gray-500">{gym.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="webhookStartDate" className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              id="webhookStartDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="webhookEndDate" className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              id="webhookEndDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        
        {/* Webhook Logs Table */}
        {renderWebhookLogs()}
      </div>
    </div>
  );
};

export default AnalyticsPage;
