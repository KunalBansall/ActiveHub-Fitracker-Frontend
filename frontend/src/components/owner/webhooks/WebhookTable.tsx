import React from 'react';
import { format } from 'date-fns';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';

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

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface WebhookTableProps {
  webhooks: Webhook[];
  pagination?: Pagination;
  isLoading: boolean;
  isError: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
  onWebhookClick: (webhook: Webhook) => void;
}

const WebhookTable: React.FC<WebhookTableProps> = ({
  webhooks,
  pagination,
  isLoading,
  isError,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
  onWebhookClick
}) => {
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Render sort icon
  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
    }
    
    return sortOrder === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 text-indigo-600" />
      : <ChevronDownIcon className="h-4 w-4 text-indigo-600" />;
  };
  
  // Render status badge
  const renderStatusBadge = (status: string | null | undefined) => {
    let bgColor = 'bg-gray-100 text-gray-800';
    
    // Handle null or undefined status
    if (!status) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Unknown
        </span>
      );
    }
    
    switch (status.toLowerCase()) {
      case 'captured':
      case 'authorized':
      case 'active':
        bgColor = 'bg-green-100 text-green-800';
        break;
      case 'failed':
      case 'halted':
        bgColor = 'bg-red-100 text-red-800';
        break;
      case 'refunded':
      case 'cancelled':
        bgColor = 'bg-yellow-100 text-yellow-800';
        break;
      case 'created':
        bgColor = 'bg-blue-100 text-blue-800';
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {status}
      </span>
    );
  };
  
  // Render event type badge
  const renderEventTypeBadge = (eventType: string | null | undefined) => {
    let bgColor = 'bg-gray-100 text-gray-800';
    
    // Handle null or undefined eventType
    if (!eventType) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Unknown
        </span>
      );
    }
    
    switch (eventType.toLowerCase()) {
      case 'payment':
        bgColor = 'bg-green-100 text-green-800';
        break;
      case 'subscription':
        bgColor = 'bg-blue-100 text-blue-800';
        break;
      case 'order':
        bgColor = 'bg-purple-100 text-purple-800';
        break;
      case 'refund':
        bgColor = 'bg-yellow-100 text-yellow-800';
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {eventType}
      </span>
    );
  };
  
  // Format amount
  const formatAmount = (amount?: number) => {
    if (!amount && amount !== 0) return '-';
    return `₹${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center">
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
          <h3 className="text-lg font-medium text-gray-900">Error Loading Webhooks</h3>
          <p className="mt-2 text-sm text-gray-500">
            There was an error loading the webhook data. Please try again later.
          </p>
        </div>
      </div>
    );
  }
  
  // Render empty state
  if (webhooks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-4">
          <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Webhooks Found</h3>
          <p className="mt-2 text-sm text-gray-500">
            No webhook events match your current filters. Try adjusting your search criteria.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full divide-y divide-gray-200 table-fixed md:table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/3 sm:w-auto"
                onClick={() => onSort('event')}
              >
                <div className="flex items-center gap-1">
                  <span>Event</span>
                  {renderSortIcon('event')}
                </div>
              </th>
              <th
                scope="col"
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/3 sm:w-auto"
                onClick={() => onSort('status')}
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>
              <th
                scope="col"
                className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => onSort('gymName')}
              >
                <div className="flex items-center gap-1">
                  <span>Gym</span>
                  {renderSortIcon('gymName')}
                </div>
              </th>
              <th
                scope="col"
                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/3 sm:w-auto"
                onClick={() => onSort('amount')}
              >
                <div className="flex items-center gap-1">
                  <span>Amount</span>
                  {renderSortIcon('amount')}
                </div>
              </th>
              <th
                scope="col"
                className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => onSort('receivedAt')}
              >
                <div className="flex items-center gap-1">
                  <span>Received</span>
                  {renderSortIcon('receivedAt')}
                </div>
              </th>
              <th
                scope="col"
                className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => onSort('processingTimeMs')}
              >
                <div className="flex items-center gap-1">
                  <span>Processing</span>
                  {renderSortIcon('processingTimeMs')}
                </div>
              </th>
              <th
                scope="col"
                className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Flags
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {webhooks.map(webhook => (
              <tr 
                key={webhook._id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onWebhookClick(webhook)}
              >
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                      {webhook.event}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {renderEventTypeBadge(webhook.eventType)}
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  {renderStatusBadge(webhook.status)}
                </td>
                <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 truncate max-w-[150px] lg:max-w-none">{webhook.gymName}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[150px] lg:max-w-none">{webhook.email}</div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatAmount(webhook.amount)}
                </td>
                <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(webhook.receivedAt)}
                </td>
                <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {webhook.processingTimeMs ? `${webhook.processingTimeMs}ms` : '-'}
                </td>
                <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    {webhook.issueFlag && (
                      <span title="Has issues">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                      </span>
                    )}
                    {webhook.duplicate && (
                      <span title="Duplicate event">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </span>
                    )}
                    {webhook.testMode && (
                      <span title="Test mode">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(Math.min(pagination.pages, pagination.page + 1))}
              disabled={pagination.page === pagination.pages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.page === pagination.pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    pagination.page === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum: number;
                  
                  if (pagination.pages <= 5) {
                    // Show all pages if 5 or fewer
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    // Near the start
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    // Near the end
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    // In the middle
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        pagination.page === pageNum
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } text-sm font-medium`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onPageChange(Math.min(pagination.pages, pagination.page + 1))}
                  disabled={pagination.page === pagination.pages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    pagination.page === pagination.pages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookTable;
