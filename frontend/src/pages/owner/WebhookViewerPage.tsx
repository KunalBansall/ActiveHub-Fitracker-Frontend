import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowsUpDownIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

// Import components
import WebhookFilters from '../../components/owner/webhooks/WebhookFilters';
import WebhookTable from '../../components/owner/webhooks/WebhookTable';
import WebhookDetailPanel from '../../components/owner/webhooks/WebhookDetailPanel';
import WebhookAnalytics from '../../components/owner/webhooks/WebhookAnalytics';

// Define types
interface Webhook {
  _id: string;
  event: string;
  eventType: string;
  status: string;
  adminId: string;
  gymName: string;
  email: string;
  amount: number;
  receivedAt: string;
  processedAt: string;
  issueFlag: boolean;
  errorReason: string;
  rawPayload: string;
  processingTimeMs: number;
  duplicate: boolean;
  testMode: boolean;
}

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

interface WebhookResponse {
  success: boolean;
  webhooks: Webhook[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  analytics?: {
    paymentSuccessRate: number;
    eventCounts: { type: string; count: number }[];
    averageProcessingTimeMs: number;
    dailyWebhookCounts: { date: string; count: number }[];
    totalIssues: number;
  };
}

const WebhookViewerPage: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // State
  const [filters, setFilters] = useState<FilterState>({
    event: '',
    eventType: '',
    status: '',
    gymName: '',
    adminId: '',
    issueFlag: '',
    startDate: '',
    endDate: '',
    sortBy: 'receivedAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
    includeAnalytics: true
  });
  
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  
  // Fetch webhook data
  const { data, isLoading, isError, refetch } = useQuery<WebhookResponse>({
    queryKey: ['webhooks', filters],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');
      
      // Build query string
      const queryParams = new URLSearchParams();
      if (filters.event) queryParams.append('event', filters.event);
      if (filters.eventType) queryParams.append('eventType', filters.eventType);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.gymName) queryParams.append('gymName', filters.gymName);
      if (filters.adminId) queryParams.append('adminId', filters.adminId);
      if (filters.issueFlag) queryParams.append('issueFlag', filters.issueFlag);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      queryParams.append('sortBy', filters.sortBy);
      queryParams.append('sortOrder', filters.sortOrder);
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());
      queryParams.append('includeAnalytics', filters.includeAnalytics.toString());
      
      const response = await axios.get(`${apiUrl}/owner/webhooks/detailed?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
  
  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page on filter change
    }));
  };
  
  // Handle sorting
  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };
  
  // Handle webhook selection
  const handleWebhookClick = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setShowDetailPanel(true);
  };
  
  // Close detail panel
  const closeDetailPanel = () => {
    setShowDetailPanel(false);
    setSelectedWebhook(null);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    refetch();
    toast.success('Webhook data refreshed');
  };
  
  // Toggle analytics view
  const toggleAnalytics = () => {
    setShowAnalytics(prev => !prev);
    if (!showAnalytics && !filters.includeAnalytics) {
      setFilters(prev => ({
        ...prev,
        includeAnalytics: true
      }));
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Webhook Management</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <a
            href="/owner-dashboard/webhooks/analytics"
            className="flex items-center gap-1 sm:gap-2 px-3 py-2 text-xs sm:text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden xs:inline">Advanced Analytics</span>
            <span className="xs:hidden">Analytics</span>
          </a>
          <button
            onClick={toggleAnalytics}
            className={`flex items-center gap-1 sm:gap-2 px-3 py-2 text-xs sm:text-sm rounded-lg ${
              showAnalytics 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden xs:inline">{showAnalytics ? 'Hide Analytics' : 'Show Analytics'}</span>
            <span className="xs:hidden">{showAnalytics ? 'Hide' : 'Show'}</span>
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 sm:gap-2 px-3 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden xs:inline">Refresh</span>
            <span className="xs:hidden"><ArrowPathIcon className="h-4 w-4" /></span>
          </button>
        </div>
      </div>
      
      {/* Analytics Section */}
      {showAnalytics && data?.analytics && (
        <WebhookAnalytics analytics={data.analytics} />
      )}
      
      {/* Filters */}
      <WebhookFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />
      
      {/* Webhooks Table */}
      <WebhookTable 
        webhooks={data?.webhooks || []}
        pagination={data?.pagination}
        isLoading={isLoading}
        isError={isError}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onWebhookClick={handleWebhookClick}
      />
      
      {/* Detail Panel */}
      {showDetailPanel && selectedWebhook && (
        <WebhookDetailPanel 
          webhook={selectedWebhook}
          onClose={closeDetailPanel}
        />
      )}
    </div>
  );
};

export default WebhookViewerPage;
