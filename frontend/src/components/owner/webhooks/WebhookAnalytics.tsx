import React from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  paymentSuccessRate: number;
  eventCounts: { type: string; count: number }[];
  averageProcessingTimeMs: number;
  dailyWebhookCounts: { date: string; count: number }[];
  totalIssues: number;
}

interface WebhookAnalyticsProps {
  analytics: AnalyticsData;
}

const WebhookAnalytics: React.FC<WebhookAnalyticsProps> = ({ analytics }) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' }).format(date);
  };
  
  // Get max count for scaling the chart
  const maxCount = Math.max(...analytics.dailyWebhookCounts.map(item => item.count), 1);
  
  // Get total events
  const totalEvents = analytics.eventCounts.reduce((sum, item) => sum + item.count, 0);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
        <ChartBarIcon className="h-5 w-5 text-indigo-500" />
        Webhook Analytics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Payment Success Rate */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-800 font-medium">Payment Success Rate</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {analytics.paymentSuccessRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-green-200 rounded-full p-2">
              <CheckCircleIcon className="h-6 w-6 text-green-700" />
            </div>
          </div>
        </div>
        
        {/* Average Processing Time */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-800 font-medium">Avg. Processing Time</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {analytics.averageProcessingTimeMs.toFixed(2)}ms
              </p>
            </div>
            <div className="bg-blue-200 rounded-full p-2">
              <ClockIcon className="h-6 w-6 text-blue-700" />
            </div>
          </div>
        </div>
        
        {/* Total Issues */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-800 font-medium">Issues Detected</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {analytics.totalIssues}
              </p>
            </div>
            <div className="bg-red-200 rounded-full p-2">
              <ExclamationCircleIcon className="h-6 w-6 text-red-700" />
            </div>
          </div>
        </div>
        
        {/* Total Events */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-800 font-medium">Total Events</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {totalEvents}
              </p>
            </div>
            <div className="bg-purple-200 rounded-full p-2">
              <BuildingOfficeIcon className="h-6 w-6 text-purple-700" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Webhook Volume Chart */}
        <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Daily Webhook Volume</h3>
          
          <div className="h-64 flex items-end space-x-2">
            {analytics.dailyWebhookCounts.map((item, index) => {
              const height = (item.count / maxCount) * 100;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-indigo-400 rounded-t hover:bg-indigo-500 transition-all cursor-pointer relative group"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      {item.count} events on {formatDate(item.date)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                    {formatDate(item.date)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Event Type Distribution */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Event Type Distribution</h3>
          
          <div className="space-y-4">
            {analytics.eventCounts.map((item, index) => {
              const percentage = totalEvents > 0 ? (item.count / totalEvents) * 100 : 0;
              
              // Determine color based on event type
              let barColor = 'bg-gray-400';
              let textColor = 'text-gray-700';
              
              switch (item.type.toLowerCase()) {
                case 'payment':
                  barColor = 'bg-green-400';
                  textColor = 'text-green-700';
                  break;
                case 'subscription':
                  barColor = 'bg-blue-400';
                  textColor = 'text-blue-700';
                  break;
                case 'order':
                  barColor = 'bg-purple-400';
                  textColor = 'text-purple-700';
                  break;
                case 'refund':
                  barColor = 'bg-yellow-400';
                  textColor = 'text-yellow-700';
                  break;
              }
              
              return (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-medium ${textColor}`}>
                      {item.type || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${barColor} h-2 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookAnalytics;
