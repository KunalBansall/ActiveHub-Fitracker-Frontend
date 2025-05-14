import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useQuery } from 'react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ShoppingBagIcon,
  DocumentTextIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

// Define types for our data
interface Gym {
  _id: string;
  gymName: string;
  email: string;
  phone: string;
  createdAt: string;
  totalRevenue: number;
  paymentCount: number;
  memberCount: number; // Add memberCount at the gym level
  subscription: {
    status: string;
    memberCount: number;
  };
}

interface GymsResponse {
  gyms: Gym[];
}

interface Log {
  _id: string;
  adminId: {
    _id: string;
    username: string;
    email: string;
    gymName: string;
  };
  action: string;
  timestamp: string;
  ipAddress: string;
  deviceInfo: string;
  location: {
    city: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
  } | null;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  // Extract user from localStorage
  const user = (() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  })();

  // Fetch gyms data
  const { data: gymsData, isLoading, isError } = useQuery<GymsResponse>({
    queryKey: ['ownerGyms'],
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
    enabled: !!user && user.role === 'owner',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Handle loading and error states
  useEffect(() => {
    if (isError) {
      toast.error('Failed to load gyms data. Please try again.');
    }
  }, [isError]);

  // Calculate dashboard stats from real data
  const calculateStats = () => {
    if (!gymsData?.gyms || gymsData.gyms.length === 0) {
      return [
        { 
          title: 'Total Gyms', 
          value: '0', 
          change: '0%', 
          icon: UserGroupIcon, 
          color: 'bg-blue-500',
          link: '/owner-dashboard/gyms'
        },
        { 
          title: 'Total Members', 
          value: '0', 
          change: '0%', 
          icon: UserGroupIcon, 
          color: 'bg-indigo-500',
          link: '/owner-dashboard/gyms'
        },
        { 
          title: 'Active Subscriptions', 
          value: '0', 
          change: '0%', 
          icon: CurrencyDollarIcon, 
          color: 'bg-green-500',
          link: '/owner-dashboard/subscriptions'
        },
        { 
          title: 'Total Revenue', 
          value: '₹0', 
          change: '0%', 
          icon: ChartBarIcon, 
          color: 'bg-purple-500',
          link: '/owner-dashboard/analytics'
        },
        { 
          title: 'Average Revenue', 
          value: '₹0', 
          change: '0%', 
          icon: ShoppingBagIcon, 
          color: 'bg-yellow-500',
          link: '/owner-dashboard/analytics'
        }
      ];
    }

    // Calculate real stats
    const totalGyms = gymsData.gyms.length;
    const activeSubscriptions = gymsData.gyms.filter(gym => 
      gym.subscription?.status === 'active'
    ).length;
    const totalRevenue = gymsData.gyms.reduce(
      (sum, gym) => sum + (gym.totalRevenue || 0), 
      0
    );
    const avgRevenuePerGym = totalGyms > 0 ? totalRevenue / totalGyms : 0;
    
    // Calculate total member count across all gyms
    const totalMembers = gymsData.gyms.reduce(
      (sum, gym) => sum + (gym.memberCount || 0),
      0
    );

    return [
      { 
        title: 'Total Gyms', 
        value: totalGyms.toString(), 
        change: '+' + Math.round(totalGyms * 0.1) + '%', // Placeholder growth rate
        icon: UserGroupIcon, 
        color: 'bg-blue-500',
        link: '/owner-dashboard/gyms'
      },
      { 
        title: 'Total Members', 
        value: totalMembers.toString(), 
        change: '+' + Math.round(totalMembers * 0.08) + '%', // Placeholder growth rate
        icon: UserGroupIcon, 
        color: 'bg-indigo-500',
        link: '/owner-dashboard/gyms'
      },
      { 
        title: 'Active Subscriptions', 
        value: activeSubscriptions.toString(), 
        change: '+' + Math.round(activeSubscriptions * 0.05) + '%', // Placeholder growth rate
        icon: CurrencyDollarIcon, 
        color: 'bg-green-500',
        link: '/owner-dashboard/subscriptions'
      },
      { 
        title: 'Total Revenue', 
        value: '₹' + (totalRevenue / 1000).toFixed(1) + 'K', 
        change: '+' + Math.round(totalRevenue * 0.02 / 1000) + '%', // Placeholder growth rate
        icon: ChartBarIcon, 
        color: 'bg-purple-500',
        link: '/owner-dashboard/analytics'
      },
      { 
        title: 'Avg. Revenue/Gym', 
        value: '₹' + (avgRevenuePerGym / 1000).toFixed(1) + 'K', 
        change: '+' + Math.round(avgRevenuePerGym * 0.03 / 1000) + '%', // Placeholder growth rate
        icon: ShoppingBagIcon, 
        color: 'bg-yellow-500',
        link: '/owner-dashboard/analytics'
      }
    ];
  };

  const stats = calculateStats();

  // Fetch activity logs
  const { data: logsData, isLoading: logsLoading } = useQuery<{ logs: Log[] }>(
    ['ownerLogs'],
    async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');
      
      const response = await axios.get(`${apiUrl}/auth/logs`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      enabled: !!user && user.role === 'owner',
      onError: (error) => {
        console.error('Error fetching logs:', error);
        toast.error('Failed to load activity logs');
      }
    }
  );

  // Define activity interface to fix TypeScript errors
  interface Activity {
    id: string;
    type: 'subscription' | 'payment' | 'webhook';
    gym: string;
    action: string;
    time: string;
    location?: string;
  }

  // Map logs to activity format
  const mapLogsToActivities = (): Activity[] => {
    if (!logsData?.logs || logsData.logs.length === 0) {
      return [
        { id: '1', type: 'subscription', gym: 'No activity', action: 'logs available', time: 'now' }
      ];
    }

    // Take the 5 most recent logs
    const recentLogs = [...logsData.logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 5);

    return recentLogs.map(log => {
      // Determine activity type based on action
      let type: 'subscription' | 'payment' | 'webhook';
      
      if (log.action.includes('login') || log.action.includes('logout')) {
        type = 'subscription';
      } else if (log.action.includes('payment') || log.action.includes('subscription')) {
        type = 'payment';
      } else {
        type = 'webhook';
      }

      return {
        id: log._id,
        type,
        gym: log.adminId?.gymName || 'Unknown Gym',
        action: log.action,
        time: formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }),
        location: log.location ? `${log.location.city}, ${log.location.country}` : undefined
      };
    });
  };

  const recentActivities = mapLogsToActivities();

  if (!user || user.role !== 'owner') return null;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-indigo-700 rounded-lg shadow-md p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome to Owner Dashboard</h1>
        <p className="mt-2 text-indigo-100">
          Manage your gyms, track subscriptions, and monitor revenue from one place.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(stat.link)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <span className="text-green-500 text-sm font-medium">{stat.change}</span>
                  <span className="text-gray-500 text-sm ml-1">vs last month</span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gyms List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Gyms Overview</h2>
          <button 
            onClick={() => navigate('/owner-dashboard/gyms')}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            View all gyms →
          </button>
        </div>
        
        {isLoading ? (
          <div className="py-4 text-center text-gray-500">Loading gyms data...</div>
        ) : isError ? (
          <div className="py-4 text-center text-red-500">Failed to load gyms data</div>
        ) : !gymsData?.gyms || gymsData.gyms.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No gyms found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gym Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gymsData.gyms.slice(0, 5).map((gym) => (
                  <tr key={gym._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/owner-dashboard/gyms/${gym._id}`)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{gym.gymName}</div>
                      <div className="text-sm text-gray-500">{gym.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${gym.subscription?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {gym.subscription?.status || 'inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{gym.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {gym.subscription?.memberCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(gym.createdAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/owner-dashboard/analytics')}
            className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <ChartBarIcon className="h-8 w-8 text-indigo-600" />
            <span className="mt-2 text-sm font-medium text-indigo-700">View Analytics</span>
          </button>
          <button 
            onClick={() => navigate('/owner-dashboard/webhook')}
            className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <BellIcon className="h-8 w-8 text-blue-600" />
            <span className="mt-2 text-sm font-medium text-blue-700">Check Webhooks</span>
          </button>
          <button 
            onClick={() => navigate('/owner-dashboard/reports')}
            className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <DocumentTextIcon className="h-8 w-8 text-green-600" />
            <span className="mt-2 text-sm font-medium text-green-700">Generate Reports</span>
          </button>
          <button 
            onClick={() => navigate('/owner-dashboard/ads')}
            className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <ShoppingBagIcon className="h-8 w-8 text-purple-600" />
            <span className="mt-2 text-sm font-medium text-purple-700">Manage Ads</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <button 
            onClick={() => navigate('/owner-dashboard/activity')}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            View all activity →
          </button>
        </div>
        
        {logsLoading ? (
          <div className="py-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : recentActivities.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No recent activity found</div>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start border-b border-gray-100 pb-3">
                <div className={`p-2 rounded-full mr-3 mt-1 ${
                  activity.type === 'subscription' ? 'bg-blue-100' : 
                  activity.type === 'payment' ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  {activity.type === 'subscription' && <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />}
                  {activity.type === 'payment' && <ChartBarIcon className="h-5 w-5 text-green-600" />}
                  {activity.type === 'webhook' && <BellIcon className="h-5 w-5 text-yellow-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.gym} <span className="text-gray-700">{activity.action}</span></p>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <span>{activity.time}</span>
                    {activity.location ? (
                      <>
                        <span className="mx-1">•</span>
                        <span>{activity.location}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
