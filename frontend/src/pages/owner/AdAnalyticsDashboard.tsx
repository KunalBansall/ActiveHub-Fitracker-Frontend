import React from 'react';
import AdAnalytics from '../../components/ads/AdAnalytics';

const AdAnalyticsDashboard: React.FC = () => {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <header className="mb-6">
        <div className="flex flex-wrap items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Ad Analytics Dashboard</h1>
        </div>
        <p className="mt-2 text-sm text-gray-700">
          Comprehensive analytics for all your advertising campaigns
        </p>
      </header>

      <div className="bg-white rounded-lg shadow-md p-6">
        <AdAnalytics />
      </div>
    </div>
  );
};

export default AdAnalyticsDashboard;
