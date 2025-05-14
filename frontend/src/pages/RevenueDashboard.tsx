import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { ChevronDownIcon, CalendarIcon } from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Types for revenue data
interface RevenueOverview {
  totalMembershipRevenue: number;
  totalShopRevenue: number;
  collectedShopRevenue: number;
  totalExpectedRevenue: number;
  totalCollectedRevenue: number;
  remainingRevenue: number;
  pendingMembershipRevenue: number;
  collectedMembershipRevenue: number;
}

interface RevenueTrend {
  period: string;
  membershipRevenue: number;
  shopRevenue: number;
}

// Define a type for the pie chart data
interface PieChartData {
  name: string;
  value: number;
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Interface for archived monthly revenue data
interface ArchivedMonthlyRevenue {
  gymId: string;
  month: number;
  year: number;
  monthName: string;
  expectedRevenue: {
    total: number;
    membership: number;
    shop: number;
  };
  collectedRevenue: {
    total: number;
    membership: number;
    shop: number;
  };
  remainingRevenue: number;
  growthMetrics: {
    totalGrowth: number;
    membershipGrowth: number;
    shopGrowth: number;
  };
  metadata: {
    archivedAt: string;
    archivedBy: string;
  };
}

const RevenueDashboard: React.FC = () => {
  const [interval, setInterval] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedMonth, setSelectedMonth] = useState<string>('current');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [availableMonths, setAvailableMonths] = useState<{id: string, label: string}[]>([]);
  const token = localStorage.getItem('token');

  // Fetch available archived months
  const { data: archivedMonths, isLoading: isLoadingArchives } = useQuery(
    'archivedMonths',
    async () => {
      const response = await axios.get(`${API_URL}/admin/revenue/archived-months`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Format months for dropdown
        const formattedMonths = data.map((item: any) => ({
          id: `${item.month}-${item.year}`,
          label: `${item.monthName} ${item.year}`,
          month: item.month,
          year: item.year
        }));
        
        // Add 'Current Month' option at the top
        setAvailableMonths([
          { id: 'current', label: 'Current Month' },
          ...formattedMonths
        ]);
      }
    }
  );
  
  // Fetch archived revenue data if a specific month is selected
  const { data: archivedData, isLoading: isLoadingArchived } = useQuery(
    ['archivedRevenue', selectedMonth],
    async () => {
      if (selectedMonth === 'current') return null;
      
      const [month, year] = selectedMonth.split('-').map(Number);
      const response = await axios.get(`${API_URL}/admin/revenue/archived/${month}/${year}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    {
      enabled: selectedMonth !== 'current',
    }
  );
  
  // Fetch current revenue overview data
  const { data: currentOverviewData, isLoading: isLoadingCurrentOverview } = useQuery<RevenueOverview>(
    'revenueOverview',
    async () => {
      const response = await axios.get(`${API_URL}/admin/revenue/overview`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    {
      enabled: selectedMonth === 'current',
    }
  );

  // Fetch revenue trends data
  const { data: trendsData, isLoading: isLoadingTrends } = useQuery<RevenueTrend[]>(
    ['revenueTrends', interval],
    async () => {
      const response = await axios.get(`${API_URL}/admin/revenue/trends?interval=${interval}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    }
  );

  // Fetch gym settings for threshold data
  const { data: gymSettings } = useQuery(
    'gymSettings',
    async () => {
      const response = await axios.get(`${API_URL}/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    }
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Prepare pie chart data
  const preparePieData = (overview: RevenueOverview): PieChartData[] => {
    return [
      { name: 'Memberships', value: overview.collectedMembershipRevenue },
      { name: 'Shop Sales', value: overview.collectedShopRevenue },
    ];
  };

  // Calculate progress percentage
  const calculateProgress = (overview: RevenueOverview) => {
    if (!overview.totalExpectedRevenue) return 100; // If no expected revenue, show 100%
    return Math.min(100, Math.round((overview.totalCollectedRevenue / overview.totalExpectedRevenue) * 100));
  };

  // Determine progress bar color based on settings and current progress
  const getProgressColor = (overview: RevenueOverview, progress: number) => {
    // Use the alertThresholdPercentage from settings, or default to 15 if not available
    const alertThreshold = gymSettings?.alertThresholdPercentage || 15;
    
    if (progress >= 100) return '#4CAF50'; // Green for goal achieved
    if (progress < alertThreshold) return '#f44336'; // Red for below threshold
    return '#FF9800'; // Yellow/Orange for in between
  };

  // Combine data based on selected month
  const overviewData = selectedMonth === 'current' ? currentOverviewData : archivedData ? {
    totalMembershipRevenue: archivedData.expectedRevenue.membership,
    totalShopRevenue: archivedData.expectedRevenue.shop,
    totalExpectedRevenue: archivedData.expectedRevenue.total,
    totalCollectedRevenue: archivedData.collectedRevenue.total,
    collectedMembershipRevenue: archivedData.collectedRevenue.membership,
    collectedShopRevenue: archivedData.collectedRevenue.shop,
    remainingRevenue: archivedData.remainingRevenue,
    pendingMembershipRevenue: archivedData.expectedRevenue.membership - archivedData.collectedRevenue.membership
  } : null;

  // Handle loading states
  const isLoading = selectedMonth === 'current' 
    ? (isLoadingCurrentOverview || isLoadingTrends || isLoadingArchives)
    : (isLoadingArchived || isLoadingTrends || isLoadingArchives);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!overviewData || !trendsData) {
    return <div className="p-4">Failed to load revenue data.</div>;
  }

  const progressPercentage = calculateProgress(overviewData);
  const progressColor = getProgressColor(overviewData, progressPercentage);
  const pieData = preparePieData(overviewData);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Revenue Dashboard</h1>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          {/* Month Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <CalendarIcon className="w-5 h-5 mr-2 text-gray-500" />
              {availableMonths.find(m => m.id === selectedMonth)?.label || 'Current Month'}
              <ChevronDownIcon className="w-5 h-5 ml-2 -mr-1 text-gray-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  {availableMonths.map((month) => (
                    <button
                      key={month.id}
                      className={`block w-full text-left px-4 py-2 text-sm ${selectedMonth === month.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
                      onClick={() => {
                        setSelectedMonth(month.id);
                        setDropdownOpen(false);
                      }}
                    >
                      {month.label}
                      {month.id === 'current' && <span className="ml-2 text-xs text-blue-600">(Live)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Trend Interval Selector */}
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                interval === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setInterval('weekly')}
            >
              Weekly
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                interval === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setInterval('monthly')}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>
      
      {/* Show archived data notice if viewing past month */}
      {selectedMonth !== 'current' && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                You are viewing archived data for {availableMonths.find(m => m.id === selectedMonth)?.label}. 
                <button 
                  className="font-medium underline hover:text-blue-600" 
                  onClick={() => setSelectedMonth('current')}
                >
                  Switch to current month
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <h2 className="text-gray-500 text-sm font-medium uppercase">Total Collected Revenue</h2>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {formatCurrency(overviewData.totalCollectedRevenue)}
          </p>
          <div className="text-xs text-gray-500 mt-2">
            Memberships: {formatCurrency(overviewData.collectedMembershipRevenue)} | 
            Shop: {formatCurrency(overviewData.collectedShopRevenue)}
          </div>
          <div className="text-xs text-gray-500 mt-1 italic">
            *Includes paid membership fees and delivered orders only
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <h2 className="text-gray-500 text-sm font-medium uppercase">Expected Revenue</h2>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {formatCurrency(overviewData.totalExpectedRevenue)}
          </p>
          <div className="text-xs text-gray-500 mt-2">
            Memberships: {formatCurrency(overviewData.totalMembershipRevenue)} | 
            Shop: {formatCurrency(overviewData.totalShopRevenue)}
          </div>
          <div className="text-xs text-gray-500 mt-1 italic">
            *Includes all members' fees and all shop orders
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
          <h2 className="text-gray-500 text-sm font-medium uppercase">Remaining Revenue</h2>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {formatCurrency(overviewData.remainingRevenue)}
          </p>
          <div className="text-xs text-gray-500 mt-2">
            {overviewData.pendingMembershipRevenue > 0 && 
              `Pending membership fees: ${formatCurrency(overviewData.pendingMembershipRevenue)}`}
          </div>
          <div className="text-xs text-gray-500 mt-1 italic">
            *Expected revenue minus collected revenue
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-gray-700 font-medium mb-2">Total Revenue Collection Progress</h2>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="h-4 rounded-full transition-all duration-500"
            style={{ 
              width: `${progressPercentage}%`,
              backgroundColor: progressColor
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-sm text-gray-600">
          <span>{progressPercentage}% Complete</span>
          <span>
            {progressPercentage >= 100 
              ? 'Goal Achieved!' 
              : `${formatCurrency(overviewData.totalCollectedRevenue)} of ${formatCurrency(overviewData.totalExpectedRevenue)}`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Source Split Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-gray-700 font-medium mb-2">Collected Revenue Sources</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}: {name: string, percent: number}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trends Line Chart */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-gray-700 font-medium mb-2">Revenue Trends</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis 
                  tickFormatter={(value: number) => `₹${value}`} 
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="membershipRevenue"
                  name="Membership Revenue"
                  stroke="#0088FE"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="shopRevenue"
                  name="Shop Revenue"
                  stroke="#00C49F"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueDashboard; 