import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { 
  UserCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  ComputerDesktopIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

// Define types for our data
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

interface LogsResponse {
  logs: Log[];
}

const OwnerActivityPage: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'timestamp' | 'gymName' | 'action'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterAction, setFilterAction] = useState<string>('');
  const itemsPerPage = 15;

  // Fetch logs data
  const { data, isLoading, isError, refetch } = useQuery<LogsResponse>({
    queryKey: ['ownerLogs', searchTerm, filterAction],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterAction) params.append('action', filterAction);
      
      const url = `${apiUrl}/auth/logs${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Handle sorting
  const handleSort = (field: 'timestamp' | 'gymName' | 'action') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort logs
  const filteredAndSortedLogs = React.useMemo(() => {
    if (!data?.logs) return [];

    // Filter by search term if not already filtered by backend
    let filtered = [...data.logs];
    
    if (searchTerm && !filterAction) {
      filtered = filtered.filter(log => 
        (log.adminId?.gymName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (log.adminId?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (log.action?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (log.ipAddress?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    // Sort by field
    filtered = filtered.sort((a, b) => {
      if (sortField === 'timestamp') {
        return sortDirection === 'desc' 
          ? new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          : new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortField === 'gymName') {
        const aName = a.adminId?.gymName || '';
        const bName = b.adminId?.gymName || '';
        return sortDirection === 'desc' ? bName.localeCompare(aName) : aName.localeCompare(bName);
      } else if (sortField === 'action') {
        return sortDirection === 'desc' ? b.action.localeCompare(a.action) : a.action.localeCompare(b.action);
      }
      return 0;
    });

    return filtered;
  }, [data?.logs, searchTerm, filterAction, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil((filteredAndSortedLogs?.length || 0) / itemsPerPage);
  const paginatedLogs = filteredAndSortedLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique actions for filter dropdown
  const uniqueActions = React.useMemo(() => {
    if (!data?.logs) return [];
    const actions = new Set<string>();
    data.logs.forEach(log => {
      if (log.action) actions.add(log.action);
    });
    return Array.from(actions).sort();
  }, [data?.logs]);

  // Handle refresh
  const handleRefresh = () => {
    refetch();
    toast.success('Activity logs refreshed');
  };

  // Render sort icon
  const renderSortIcon = (field: 'timestamp' | 'gymName' | 'action') => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 ml-1" />
      : <ChevronDownIcon className="h-4 w-4 ml-1" />;
  };

  // Format device info
  const formatDeviceInfo = (deviceInfo: string) => {
    try {
      if (!deviceInfo) return 'Unknown device';
      
      // If it's JSON, parse it
      if (deviceInfo.startsWith('{')) {
        const parsed = JSON.parse(deviceInfo);
        return `${parsed.browser || ''} ${parsed.version || ''} on ${parsed.os || 'Unknown OS'}`;
      }
      
      // Otherwise just return the string
      return deviceInfo;
    } catch {
      return deviceInfo || 'Unknown device';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Activity Logs</h1>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search logs..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            
            <div className="relative">
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value);
                  setCurrentPage(1); // Reset to first page on filter change
                }}
              >
                <option value="">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
              <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : isError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
            Failed to load activity logs. Please try again.
          </div>
        ) : !filteredAndSortedLogs || filteredAndSortedLogs.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-500 text-lg">No activity logs found</p>
            {(searchTerm || filterAction) && (
              <p className="text-gray-400 mt-2">
                Try adjusting your search or filter criteria
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('timestamp')}
                    >
                      <div className="flex items-center">
                        Time
                        {renderSortIcon('timestamp')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('gymName')}
                    >
                      <div className="flex items-center">
                        Gym
                        {renderSortIcon('gymName')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('action')}
                    >
                      <div className="flex items-center">
                        Action
                        {renderSortIcon('action')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        Location
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        Device
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.adminId?.gymName || 'Unknown Gym'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.adminId?.email || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.action}</div>
                        <div className="text-xs text-gray-500">{log.ipAddress}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.location ? (
                          <div className="flex items-center">
                            <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-900">
                                {log.location.city}, {log.location.country}
                              </div>
                              <div className="text-xs text-gray-500">
                                {log.location.region}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Unknown location</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ComputerDesktopIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {formatDeviceInfo(log.deviceInfo)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedLogs.length)} of {filteredAndSortedLogs.length} logs
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                    }`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum = currentPage;
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded ${
                            currentPage === pageNum 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${
                      currentPage === totalPages 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerActivityPage;
