import React, { useState } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  XMarkIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
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

interface WebhookDetailPanelProps {
  webhook: Webhook;
  onClose: () => void;
}

const WebhookDetailPanel: React.FC<WebhookDetailPanelProps> = ({ webhook, onClose }) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [isReplaying, setIsReplaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'payload'>('details');
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Format amount
  const formatAmount = (amount?: number) => {
    if (!amount && amount !== 0) return '-';
    return `₹${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Copy payload to clipboard
  const copyPayload = () => {
    if (webhook.rawPayload) {
      navigator.clipboard.writeText(webhook.rawPayload);
      toast.success('Payload copied to clipboard');
    }
  };
  
  // Replay webhook (optional feature)
  const replayWebhook = async () => {
    try {
      setIsReplaying(true);
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');
      
      // This is a placeholder - actual implementation would depend on your backend
      await axios.post(
        `${apiUrl}/owner/webhooks/replay/${webhook._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      toast.success('Webhook replayed successfully');
    } catch (error) {
      console.error('Error replaying webhook:', error);
      toast.error('Failed to replay webhook');
    } finally {
      setIsReplaying(false);
    }
  };
  
  // Render status badge
  const renderStatusBadge = (status: string | null | undefined) => {
    let bgColor = 'bg-gray-100 text-gray-800';
    let icon = null;
    
    // Handle null or undefined status
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Unknown
        </span>
      );
    }
    
    switch (status.toLowerCase()) {
      case 'captured':
      case 'authorized':
      case 'active':
        bgColor = 'bg-green-100 text-green-800';
        icon = <CheckCircleIcon className="h-4 w-4" />;
        break;
      case 'failed':
      case 'halted':
        bgColor = 'bg-red-100 text-red-800';
        icon = <XCircleIcon className="h-4 w-4" />;
        break;
      case 'refunded':
      case 'cancelled':
        bgColor = 'bg-yellow-100 text-yellow-800';
        icon = <ArrowPathIcon className="h-4 w-4" />;
        break;
      case 'created':
        bgColor = 'bg-blue-100 text-blue-800';
        icon = <ClockIcon className="h-4 w-4" />;
        break;
    }
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${bgColor}`}>
        {icon}
        {status}
      </span>
    );
  };
  
  // Format JSON for display
  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return jsonString;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Webhook Details: {webhook.event}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'details'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'payload'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('payload')}
          >
            Raw Payload
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto p-4 flex-grow">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Basic Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Event</p>
                    <p className="text-sm font-medium">{webhook.event}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-sm font-medium">{renderStatusBadge(webhook.status)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gym</p>
                    <p className="text-sm font-medium">{webhook.gymName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium">{webhook.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-sm font-medium">{formatAmount(webhook.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Webhook ID</p>
                    <p className="text-sm font-medium text-gray-500">{webhook._id}</p>
                  </div>
                </div>
              </div>
              
              {/* Timing Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Timing Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Received At</p>
                    <p className="text-sm font-medium">{formatDate(webhook.receivedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Processed At</p>
                    <p className="text-sm font-medium">
                      {webhook.processedAt ? formatDate(webhook.processedAt) : 'Not processed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Processing Time</p>
                    <p className="text-sm font-medium">
                      {webhook.processingTimeMs ? `${webhook.processingTimeMs}ms` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Flags */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Flags</h4>
                <div className="bg-gray-50 rounded-lg p-4 flex flex-wrap gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    webhook.issueFlag ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {webhook.issueFlag ? 'Has Issues' : 'No Issues'}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    webhook.duplicate ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {webhook.duplicate ? 'Duplicate' : 'Not Duplicate'}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    webhook.testMode ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {webhook.testMode ? 'Test Mode' : 'Live Mode'}
                  </div>
                </div>
              </div>
              
              {/* Error Reason (if any) */}
              {webhook.issueFlag && webhook.errorReason && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Error Information</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Error Reason</p>
                        <p className="text-sm text-red-700 mt-1">{webhook.errorReason}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Payload header with copy button */}
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-500">Raw Payload (JSON)</h4>
                <button
                  onClick={copyPayload}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                  Copy
                </button>
              </div>
              
              {/* JSON payload */}
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                  {webhook.rawPayload ? formatJson(webhook.rawPayload) : 'No payload data available'}
                </pre>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer with actions */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3"
          >
            Close
          </button>
          <button
            onClick={replayWebhook}
            disabled={isReplaying}
            className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReplaying ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4" />
                Replay Webhook
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebhookDetailPanel;
