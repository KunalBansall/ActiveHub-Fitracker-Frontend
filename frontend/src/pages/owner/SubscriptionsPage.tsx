import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

// Define types for our data
interface Gym {
  _id: string;
  gymName: string;
  email: string;
  phone: string;
  createdAt: string;
  subscription: {
    status: string;
    memberCount: number;
    plan?: string;
    startDate?: string;
    endDate?: string;
    trialEndsAt?: string;
    amount?: number;
  };
}

interface GymsResponse {
  gyms: Gym[];
}

const SubscriptionsPage: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('gymName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch gyms data with search support
  const { data, isLoading, isError, refetch } = useQuery<GymsResponse>({
    queryKey: ['ownerGyms', searchTerm],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');
      
      // Add search term as a query parameter if provided
      const url = searchTerm
        ? `${apiUrl}/owner/gyms?search=${encodeURIComponent(searchTerm)}`
        : `${apiUrl}/owner/gyms`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute - shorter stale time for search results
  });

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort gyms
  const filteredAndSortedGyms = React.useMemo(() => {
    if (!data?.gyms) return [];

    // First filter to only include gyms with active or expired subscriptions
    let filtered = data.gyms.filter(gym => 
      gym.subscription && ['active', 'expired'].includes(gym.subscription.status)
    );
    
    // Then filter by search term
    filtered = filtered.filter(gym => 
      gym.gymName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gym.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gym.subscription?.plan && gym.subscription.plan.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort by field
    filtered = [...filtered].sort((a, b) => {
      let aValue: any = a.gymName;
      let bValue: any = b.gymName;

      // Handle nested properties
      if (sortField === 'status') {
        aValue = a.subscription?.status || '';
        bValue = b.subscription?.status || '';
      } else if (sortField === 'plan') {
        aValue = a.subscription?.plan || '';
        bValue = b.subscription?.plan || '';
      } else if (sortField === 'endDate') {
        aValue = a.subscription?.endDate ? new Date(a.subscription.endDate).getTime() : 0;
        bValue = b.subscription?.endDate ? new Date(b.subscription.endDate).getTime() : 0;
      } else if (sortField === 'amount') {
        aValue = a.subscription?.amount || 0;
        bValue = b.subscription?.amount || 0;
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle number comparison
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [data?.gyms, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil((filteredAndSortedGyms?.length || 0) / itemsPerPage);
  const paginatedGyms = filteredAndSortedGyms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle refresh
  const handleRefresh = () => {
    refetch();
    toast.success('Subscription data refreshed');
  };

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      case 'grace':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render sort icon
  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 ml-1" />
      : <ChevronDownIcon className="h-4 w-4 ml-1" />;
  };

  // Format subscription date range
  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate) return 'Not set';
    
    const start = format(new Date(startDate), 'MMM d, yyyy');
    const end = endDate ? format(new Date(endDate), 'MMM d, yyyy') : 'Ongoing';
    
    return `${start} - ${end}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Subscriptions Management</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search gyms or plans..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
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
            Failed to load subscription data. Please try again.
          </div>
        ) : !filteredAndSortedGyms || filteredAndSortedGyms.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-500 text-lg">No subscription data found</p>
            {searchTerm && (
              <p className="text-gray-400 mt-2">
                Try adjusting your search criteria
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
                      onClick={() => handleSort('gymName')}
                    >
                      <div className="flex items-center">
                        Gym Name
                        {renderSortIcon('gymName')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('plan')}
                    >
                      <div className="flex items-center">
                        Plan
                        {renderSortIcon('plan')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {renderSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('endDate')}
                    >
                      <div className="flex items-center">
                        Period
                        {renderSortIcon('endDate')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center">
                        Amount
                        {renderSortIcon('amount')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Members
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedGyms.map((gym) => (
                    <tr key={gym._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{gym.gymName}</div>
                        <div className="text-sm text-gray-500">{gym.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{gym.subscription?.plan || 'No Plan'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                          getStatusBadgeClass(gym.subscription?.status || 'inactive')
                        }`}>
                          {gym.subscription?.status || 'inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDateRange(gym.subscription?.startDate, gym.subscription?.endDate)}
                        </div>
                        {gym.subscription?.trialEndsAt && (
                          <div className="text-xs text-blue-500 mt-1">
                            Trial ends: {format(new Date(gym.subscription.trialEndsAt), 'MMM d, yyyy')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <CurrencyRupeeIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {gym.subscription?.amount ? gym.subscription.amount.toLocaleString() : '0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {gym.subscription?.memberCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Cancel
                          </button>
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
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedGyms.length)} of {filteredAndSortedGyms.length} subscriptions
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
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-800">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Active Subscriptions</h2>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredAndSortedGyms?.filter(gym => gym.subscription?.status === 'active').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-800">
              <ClockIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Trial Subscriptions</h2>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredAndSortedGyms?.filter(gym => gym.subscription?.status === 'trial').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-800">
              <XCircleIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Expired Subscriptions</h2>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredAndSortedGyms?.filter(gym => gym.subscription?.status === 'expired').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-800">
              <CurrencyRupeeIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Total Revenue</h2>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{filteredAndSortedGyms?.reduce((total, gym) => total + (gym.subscription?.amount || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsPage;
