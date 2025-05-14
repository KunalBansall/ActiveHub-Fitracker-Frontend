import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { format, subDays } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../LoadingSpinner';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Define types for our analytics data
interface OverallStats {
  totalViews: number;
  totalClicks: number;
  uniqueUsers: number;
  ctr: number;
}

interface AdStat {
  adId: string;
  title: string;
  views: number;
  clicks: number;
  uniqueUsers: number;
  ctr: number;
  placement: string;
  targetAudience: string;
  active: boolean;
  createdAt: string;
  expiresAt: string;
}

interface DailyStat {
  date: string;
  adId: string;
  views: number;
  clicks: number;
}

interface AudienceStat {
  role: string;
  adId: string;
  views: number;
  clicks: number;
  ctr: number;
}

interface AnalyticsResponse {
  success: boolean;
  overall: OverallStats;
  adStats: AdStat[];
  dailyStats: DailyStat[];
  audienceStats: AudienceStat[];
}

const AdAnalytics: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedAd, setSelectedAd] = useState<string>('all');

  // Fetch analytics data
  const { data, isLoading, isError, refetch } = useQuery<AnalyticsResponse>({
    queryKey: ['adAnalytics', dateRange, selectedAd],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');
      
      let url = `${apiUrl}/ads/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      if (selectedAd !== 'all') {
        url += `&adId=${selectedAd}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch all ads for the dropdown
  const { data: adsData } = useQuery<{ ads: any[] }>({
    queryKey: ['allAds'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');
      
      const response = await axios.get(`${apiUrl}/ads/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const today = new Date();
    let startDate;
    
    switch (value) {
      case '7days':
        startDate = subDays(today, 7);
        break;
      case '30days':
        startDate = subDays(today, 30);
        break;
      case '90days':
        startDate = subDays(today, 90);
        break;
      default:
        startDate = subDays(today, 30);
    }
    
    setDateRange({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd')
    });
  };

  const handleAdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAd(e.target.value);
  };

  // Prepare data for charts
  const prepareTimeSeriesData = () => {
    if (!data?.dailyStats) return null;
    
    // Create a map of dates
    const dateMap = new Map();
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, 'yyyy-MM-dd');
      dateMap.set(dateStr, { views: 0, clicks: 0 });
    }
    
    // Fill in actual data
    data.dailyStats.forEach(stat => {
      if (dateMap.has(stat.date)) {
        const current = dateMap.get(stat.date);
        dateMap.set(stat.date, {
          views: current.views + stat.views,
          clicks: current.clicks + stat.clicks
        });
      }
    });
    
    // Convert to arrays for chart
    const dates = Array.from(dateMap.keys());
    const viewsData = dates.map(date => dateMap.get(date).views);
    const clicksData = dates.map(date => dateMap.get(date).clicks);
    
    return {
      labels: dates.map(date => format(new Date(date), 'MMM d')),
      datasets: [
        {
          label: 'Views',
          data: viewsData,
          borderColor: 'rgba(53, 162, 235, 1)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Clicks',
          data: clicksData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.3,
          fill: true
        }
      ]
    };
  };

  const prepareAdPerformanceData = () => {
    if (!data?.adStats) return null;
    
    // Sort ads by views
    const sortedAds = [...data.adStats].sort((a, b) => b.views - a.views);
    const topAds = sortedAds.slice(0, 5); // Top 5 ads
    
    return {
      labels: topAds.map(ad => ad.title),
      datasets: [
        {
          label: 'Views',
          data: topAds.map(ad => ad.views),
          backgroundColor: 'rgba(53, 162, 235, 0.7)',
          borderRadius: 4
        },
        {
          label: 'Clicks',
          data: topAds.map(ad => ad.clicks),
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderRadius: 4
        }
      ]
    };
  };

  const prepareAudienceData = () => {
    if (!data?.audienceStats) return null;
    
    // Group by role
    const roleMap = new Map<string, { views: number; clicks: number }>();
    
    data.audienceStats.forEach(stat => {
      if (!roleMap.has(stat.role)) {
        roleMap.set(stat.role, { views: 0, clicks: 0 });
      }
      
      const current = roleMap.get(stat.role)!;
      roleMap.set(stat.role, {
        views: current.views + stat.views,
        clicks: current.clicks + stat.clicks
      });
    });
    
    return {
      labels: Array.from(roleMap.keys()).map(role => role === 'admin' ? 'Gym Admins' : 'Members'),
      datasets: [
        {
          data: Array.from(roleMap.values()).map(data => data.views),
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(75, 192, 192, 0.7)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const timeSeriesData = prepareTimeSeriesData();
  const adPerformanceData = prepareAdPerformanceData();
  const audienceData = prepareAudienceData();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
        <p className="text-center">Failed to load analytics data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Ad Performance Analytics</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedAd}
            onChange={handleAdChange}
          >
            <option value="all">All Ads</option>
            {adsData?.ads.map(ad => (
              <option key={ad._id} value={ad._id}>{ad.title}</option>
            ))}
          </select>
          
          <select
            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleDateRangeChange}
            defaultValue="30days"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Views</p>
              <p className="text-2xl font-bold text-gray-800">{data?.overall.totalViews.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <EyeIcon className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Clicks</p>
              <p className="text-2xl font-bold text-gray-800">{data?.overall.totalClicks.toLocaleString()}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <CursorArrowRaysIcon className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Click-Through Rate</p>
              <p className="text-2xl font-bold text-gray-800">{data?.overall.ctr.toFixed(2)}%</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Unique Users</p>
              <p className="text-2xl font-bold text-gray-800">{data?.overall.uniqueUsers.toLocaleString()}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <UserGroupIcon className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views & Clicks Over Time */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Views & Clicks Over Time</h3>
          {timeSeriesData ? (
            <div className="h-64">
              <Line
                data={timeSeriesData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                    }
                  },
                  interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">No time series data available</p>
          )}
        </div>
        
        {/* Top Performing Ads */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Top Performing Ads</h3>
          {adPerformanceData ? (
            <div className="h-64">
              <Bar
                data={adPerformanceData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    },
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">No ad performance data available</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audience Distribution */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Audience Distribution</h3>
          {audienceData ? (
            <div className="h-64 flex items-center justify-center">
              <Doughnut
                data={audienceData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">No audience data available</p>
          )}
        </div>
        
        {/* Ad Performance Table */}
        <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Ad Performance Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.adStats.map((ad) => (
                  <tr key={ad.adId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ad.title}</div>
                      <div className="text-xs text-gray-500">{ad.placement}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ad.views.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ad.clicks.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ad.ctr.toFixed(2)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ad.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {ad.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {data?.adStats.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No ad data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdAnalytics;
