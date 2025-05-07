import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  CreditCardIcon,
  ClockIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  InformationCircleIcon,
  BoltIcon
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
  memberCount?: number; // Add memberCount at the gym level
  subscription: {
    status: string;
    plan?: string;
    startDate?: string;
    endDate?: string;
    trialEndsAt?: string;
  };
}

interface Payment {
  _id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  description: string;
}

interface WebhookLog {
  _id: string;
  eventType: string;
  adminId: string;
  status: 'success' | 'failed';
  amount?: number;
  createdAt: string;
  payload?: any;
  error?: string;
  processingTimeMs?: number;
}

interface SubscriptionHistory {
  _id: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
  createdAt: string;
}

interface GymsResponse {
  gyms: Gym[];
}

const GymsPage: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Gym>('gymName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // State for the detail panel
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'webhooks' | 'subscriptions'>('overview');

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
  const handleSort = (field: keyof Gym) => {
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

    // Filter by search term
    let filtered = data.gyms.filter(gym => 
      gym.gymName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gym.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gym.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort by field
    filtered = [...filtered].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle nested properties
      if (sortField === 'subscription') {
        aValue = a.subscription?.status;
        bValue = b.subscription?.status;
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
    toast.success('Gym data refreshed');
  };
  
  // Handle gym selection
  const handleGymClick = (gym: Gym) => {
    setSelectedGym(gym);
    setShowDetailPanel(true);
    setActiveTab('overview');
  };
  
  // Close detail panel
  const closeDetailPanel = () => {
    setShowDetailPanel(false);
    setSelectedGym(null);
  };
  
  // Fetch payments for selected gym
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery(
    ['gymPayments', selectedGym?._id],
    async () => {
      if (!selectedGym) return { payments: [] };
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');
      
      const response = await axios.get(`${apiUrl}/owner/payments?adminId=${selectedGym._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    },
    {
      enabled: !!selectedGym && activeTab === 'payments',
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );
  
  // Fetch webhook logs for selected gym
  const { data: webhookData, isLoading: webhooksLoading } = useQuery(
    ['gymWebhooks', selectedGym?._id],
    async () => {
      if (!selectedGym) return { webhooks: [] };
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');
      
      const response = await axios.get(`${apiUrl}/owner/gym-webhooks?adminId=${selectedGym._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    },
    {
      enabled: !!selectedGym && activeTab === 'webhooks',
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );
  
  // Fetch subscription history for selected gym
  const { data: subscriptionData, isLoading: subscriptionsLoading } = useQuery(
    ['gymSubscriptions', selectedGym?._id],
    async () => {
      if (!selectedGym) return { subscriptions: [] };
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');
      
      const response = await axios.get(`${apiUrl}/owner/subscriptions?adminId=${selectedGym._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    },
    {
      enabled: !!selectedGym && activeTab === 'subscriptions',
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );

  // Render sort icon
  const renderSortIcon = (field: keyof Gym) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 ml-1" />
      : <ChevronDownIcon className="h-4 w-4 ml-1" />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Gyms Management</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search gyms..."
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
            Failed to load gyms data. Please try again.
          </div>
        ) : !filteredAndSortedGyms || filteredAndSortedGyms.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-500 text-lg">No gyms found</p>
            {searchTerm && (
              <p className="text-gray-400 mt-2">
                Try adjusting your search criteria
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="relative overflow-x-auto -mx-4 sm:mx-0 pb-2 shadow-md sm:rounded-lg">
              <div className="min-w-full">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <table className="w-full text-sm text-left rtl:text-right text-gray-500 table-auto min-w-[800px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/3 sm:w-auto"
                      onClick={() => handleSort('gymName')}
                    >
                      <div className="flex items-center">
                        <span className="hidden xs:inline">Gym Name</span>
                        <span className="xs:hidden">Gym</span>
                        {renderSortIcon('gymName')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/3 sm:w-auto"
                      onClick={() => handleSort('subscription')}
                    >
                      <div className="flex items-center">
                        Status
                        {renderSortIcon('subscription')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('totalRevenue')}
                    >
                      <div className="flex items-center">
                        Revenue
                        {renderSortIcon('totalRevenue')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3 sm:w-auto"
                    >
                      <div className="flex items-center">
                        Members
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center">
                        Created
                        {renderSortIcon('createdAt')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Contact
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedGyms.map((gym) => (
                    <tr 
                      key={gym._id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleGymClick(gym)}
                    >
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{gym.gymName}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          gym.subscription?.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {gym.subscription?.status || 'inactive'}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{gym.totalRevenue.toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {gym.memberCount || 0}
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(gym.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 truncate max-w-[150px] lg:max-w-none">{gym.email}</div>
                        <div className="text-sm text-gray-500 truncate max-w-[150px] lg:max-w-none">{gym.phone}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedGyms.length)} of {filteredAndSortedGyms.length} gyms
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
      
      {/* Detail Side Panel */}
      {showDetailPanel && selectedGym && (
        <div className="fixed inset-0 overflow-hidden z-50" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Background overlay */}
            <div 
              className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={closeDetailPanel}
            ></div>
            
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
              <div className="pointer-events-auto relative w-screen max-w-full sm:max-w-md">
                <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl transition-all duration-300 ease-in-out">
                  <div className="sticky top-0 bg-white z-10 px-3 py-4 sm:px-6 sm:py-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-medium text-gray-900" id="slide-over-title">
                        Gym Details
                      </h2>
                      <div className="ml-3 flex h-7 items-center">
                        <button
                          type="button"
                          className="rounded-full p-1 bg-gray-100 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          onClick={closeDetailPanel}
                        >
                          <span className="sr-only">Close panel</span>
                          <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tabs */}
                  <div className="border-b border-gray-200 bg-white">
                    <div className="px-2 sm:px-6">
                      <nav className="-mb-px flex overflow-x-auto hide-scrollbar space-x-2 sm:space-x-6" aria-label="Tabs">
                        <button
                          className={`${activeTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center`}
                          onClick={() => setActiveTab('overview')}
                        >
                          <InformationCircleIcon className="h-4 w-4 mr-1 sm:mr-2 hidden xs:block" />
                          Overview
                        </button>
                        <button
                          className={`${activeTab === 'payments' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center`}
                          onClick={() => setActiveTab('payments')}
                        >
                          <CreditCardIcon className="h-4 w-4 mr-1 sm:mr-2 hidden xs:block" />
                          Payments
                        </button>
                        <button
                          className={`${activeTab === 'webhooks' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center`}
                          onClick={() => setActiveTab('webhooks')}
                        >
                          <BoltIcon className="h-4 w-4 mr-1 sm:mr-2 hidden xs:block" />
                          Webhooks
                        </button>
                        <button
                          className={`${activeTab === 'subscriptions' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center`}
                          onClick={() => setActiveTab('subscriptions')}
                        >
                          <ClockIcon className="h-4 w-4 mr-1 sm:mr-2 hidden xs:block" />
                          Subs
                        </button>
                      </nav>
                    </div>
                  </div>
                  
                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                      <div className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="space-y-4 sm:space-y-6">
                          <div>
                            <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 flex items-center break-words">
                              <BuildingOfficeIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-500 flex-shrink-0" />
                              <span className="truncate">{selectedGym.gymName}</span>
                            </h3>
                            <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                              <div className="flex items-center text-xs sm:text-sm text-gray-500">
                                <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{selectedGym.email}</span>
                              </div>
                              <div className="flex items-center text-xs sm:text-sm text-gray-500">
                                <PhoneIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-400 flex-shrink-0" />
                                <span>{selectedGym.phone}</span>
                              </div>
                              <div className="flex items-center text-xs sm:text-sm text-gray-500">
                                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-400 flex-shrink-0" />
                                <span>Created {format(new Date(selectedGym.createdAt), 'PPP')}</span>
                              </div>
                              <div className="flex items-center text-xs sm:text-sm text-gray-500">
                                <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-400 flex-shrink-0" />
                                <span className="font-medium">{selectedGym.memberCount || 0} Members</span>
                              </div>
                              <div className="flex items-center text-xs sm:text-sm text-gray-500">
                                <span className="ml-1 text-xs text-gray-400">
                                  ({formatDistanceToNow(new Date(selectedGym.createdAt), { addSuffix: true })})
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 pt-3 sm:pt-4">
                            <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 flex items-center">
                              <CreditCardIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-500 flex-shrink-0" />
                              Subscription
                            </h3>
                            <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="text-xs sm:text-sm text-gray-500">Current Plan</div>
                                <div className="text-xs sm:text-sm font-medium text-gray-900 max-w-[150px] sm:max-w-none truncate text-right">
                                  {selectedGym.subscription?.plan || 'No active plan'}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-xs sm:text-sm text-gray-500">Status</div>
                                <div>
                                  <span className={`px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full ${selectedGym.subscription?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {selectedGym.subscription?.status || 'inactive'}
                                  </span>
                                </div>
                              </div>
                              {selectedGym.subscription?.trialEndsAt && (
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-gray-500">Trial Ends</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {format(new Date(selectedGym.subscription.trialEndsAt), 'PPP')}
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="text-xs sm:text-sm text-gray-500">Members</div>
                                <div className="text-xs sm:text-sm font-medium text-gray-900">
                                  {selectedGym.memberCount || 0}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 pt-3 sm:pt-4">
                            <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 flex items-center">
                              <CreditCardIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-500 flex-shrink-0" />
                              Financial Summary
                            </h3>
                            <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="text-xs sm:text-sm text-gray-500">Total Revenue</div>
                                <div className="text-xs sm:text-sm font-medium text-gray-900">
                                  ₹{selectedGym.totalRevenue.toLocaleString()}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-xs sm:text-sm text-gray-500">Payment Count</div>
                                <div className="text-xs sm:text-sm font-medium text-gray-900">
                                  {selectedGym.paymentCount}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-xs sm:text-sm text-gray-500">Average Payment</div>
                                <div className="text-xs sm:text-sm font-medium text-gray-900">
                                  ₹{selectedGym.paymentCount > 0 ? Math.round(selectedGym.totalRevenue / selectedGym.paymentCount).toLocaleString() : 0}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Payments Tab */}
                    {activeTab === 'payments' && (
                      <div className="px-3 sm:px-6 py-3 sm:py-4">
                        <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 mb-3 sm:mb-4 flex items-center">
                          <CreditCardIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-500 flex-shrink-0" />
                          Payment History
                        </h3>
                        
                        {paymentsLoading ? (
                          <div className="flex justify-center py-6 sm:py-8">
                            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-indigo-500"></div>
                          </div>
                        ) : !paymentsData?.payments || paymentsData.payments.length === 0 ? (
                          <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-gray-500">
                            No payment records found for this gym.
                          </div>
                        ) : (
                          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300 table-fixed sm:table-auto">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="py-2 sm:py-3.5 pl-3 sm:pl-4 pr-2 sm:pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4 sm:w-auto">Date</th>
                                  <th scope="col" className="px-2 sm:px-3 py-2 sm:py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4 sm:w-auto">Amount</th>
                                  <th scope="col" className="px-2 sm:px-3 py-2 sm:py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4 sm:w-auto">Status</th>
                                  <th scope="col" className="hidden sm:table-cell px-2 sm:px-3 py-2 sm:py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {paymentsData.payments.map((payment: Payment) => (
                                  <tr key={payment._id}>
                                    <td className="whitespace-nowrap py-2 sm:py-4 pl-3 sm:pl-4 pr-2 sm:pr-3 text-xs sm:text-sm text-gray-900">
                                      {format(new Date(payment.createdAt), 'MMM d, yy')}
                                    </td>
                                    <td className="whitespace-nowrap px-2 sm:px-3 py-2 sm:py-4 text-xs sm:text-sm text-gray-900">₹{payment.amount ? payment.amount.toLocaleString() : '0'}</td>
                                    <td className="whitespace-nowrap px-2 sm:px-3 py-2 sm:py-4 text-xs sm:text-sm">
                                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full ${payment.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {payment.status}
                                      </span>
                                    </td>
                                    <td className="hidden sm:table-cell whitespace-nowrap px-2 sm:px-3 py-2 sm:py-4 text-xs sm:text-sm text-gray-500">{payment.paymentMethod}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Webhooks Tab */}
                    {activeTab === 'webhooks' && (
                      <div className="px-3 sm:px-6 py-3 sm:py-4">
                        <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 mb-3 sm:mb-4 flex items-center">
                          <BoltIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-500 flex-shrink-0" />
                          Webhook Logs
                        </h3>
                        
                        {webhooksLoading ? (
                          <div className="flex justify-center py-6 sm:py-8">
                            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-indigo-500"></div>
                          </div>
                        ) : !webhookData?.webhooks || webhookData.webhooks.length === 0 ? (
                          <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-gray-500">
                            No webhook logs found for this gym.
                          </div>
                        ) : (
                          <div className="overflow-x-auto pb-2 shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="py-2 sm:py-3.5 pl-3 sm:pl-4 pr-2 sm:pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Event Type</th>
                                  <th scope="col" className="px-2 sm:px-3 py-2 sm:py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                                  <th scope="col" className="px-2 sm:px-3 py-2 sm:py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Amount</th>
                                  <th scope="col" className="px-2 sm:px-3 py-2 sm:py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                                  <th scope="col" className="px-2 sm:px-3 py-2 sm:py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Processing Time</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {webhookData.webhooks.map((log: WebhookLog) => (
                                  <tr key={log._id}>
                                    <td className="whitespace-nowrap py-2 sm:py-4 pl-3 sm:pl-4 pr-2 sm:pr-3 text-xs sm:text-sm font-medium text-gray-900">{log.eventType}</td>
                                    <td className="whitespace-nowrap px-2 sm:px-3 py-2 sm:py-4 text-xs sm:text-sm">
                                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {log.status}
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-2 sm:px-3 py-2 sm:py-4 text-xs sm:text-sm text-gray-900">
                                      {log.amount ? `₹${log.amount.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="whitespace-nowrap px-2 sm:px-3 py-2 sm:py-4 text-xs sm:text-sm text-gray-500">
                                      {format(new Date(log.createdAt), 'MMM d, yy')}
                                    </td>
                                    <td className="whitespace-nowrap px-2 sm:px-3 py-2 sm:py-4 text-xs sm:text-sm text-gray-500">
                                      {log.processingTimeMs ? `${log.processingTimeMs}ms` : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Subscriptions Tab */}
                    {activeTab === 'subscriptions' && (
                      <div className="px-3 sm:px-6 py-3 sm:py-4">
                        <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 mb-3 sm:mb-4 flex items-center">
                          <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-500 flex-shrink-0" />
                          Subscription History
                        </h3>
                        
                        {subscriptionsLoading ? (
                          <div className="flex justify-center py-6 sm:py-8">
                            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-indigo-500"></div>
                          </div>
                        ) : !subscriptionData?.subscriptions || subscriptionData.subscriptions.length === 0 ? (
                          <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-gray-500">
                            No subscription history found for this gym.
                          </div>
                        ) : (
                          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {subscriptionData.subscriptions.map((subscription: SubscriptionHistory) => (
                                  <tr key={subscription._id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{subscription.plan}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${subscription.status === 'active' ? 'bg-green-100 text-green-800' : subscription.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {subscription.status}
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {format(new Date(subscription.startDate), 'MMM d, yyyy')} - 
                                      {subscription.endDate ? format(new Date(subscription.endDate), 'MMM d, yyyy') : 'Present'}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">₹{subscription.amount ? subscription.amount.toLocaleString() : '0'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymsPage;
