import React from 'react';
import { FaExclamationCircle, FaTimesCircle } from 'react-icons/fa';

interface SubscriptionBannerProps {
  subscriptionStatus: string;
  trialEndDate?: string;
  graceEndDate?: string;
  subscriptionEndDate?: string;
  subscriptionStartDate?: string;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({
  subscriptionStatus,
  subscriptionEndDate,
}) => {
  // Only show for active subscription with end date that's close to expiring
  // Or for expired/cancelled subscriptions
  if (
    (subscriptionStatus !== 'active' && subscriptionStatus !== 'expired' && subscriptionStatus !== 'cancelled') || 
    (subscriptionStatus === 'active' && !subscriptionEndDate)
  ) {
    return null;
  }

  // Calculate days remaining
  const calculateDaysRemaining = (dateString?: string): number => {
    if (!dateString) return 0;
    const endDate = new Date(dateString);
    const now = new Date();
    return Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = calculateDaysRemaining(subscriptionEndDate);
  
  // For active subscriptions, only show banner if 3 days or less remaining
  if (subscriptionStatus === 'active' && daysRemaining > 3) {
    return null;
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Different banner for expired vs. about to expire
  if (subscriptionStatus === 'expired' || subscriptionStatus === 'cancelled') {
    return (
      <div className="w-full mb-4">
        <div className="flex items-center bg-red-50 border-l-4 border-red-500 py-2 px-3 rounded-md shadow-sm">
          <FaTimesCircle className="text-red-500 mr-2" />
          <span className="text-sm font-medium text-red-800">
            Your subscription has expired.
            <a href="/subscription" className="ml-2 underline hover:text-red-900">Renew now</a>
          </span>
        </div>
      </div>
    );
  }

  // For active subscription about to expire
  return (
    <div className="w-full mb-4">
      <div className="flex items-center bg-amber-50 border-l-4 border-amber-500 py-2 px-3 rounded-md shadow-sm">
        <FaExclamationCircle className="text-amber-500 mr-2" />
        <span className="text-sm font-medium text-amber-800">
          {daysRemaining === 0 
            ? "Your subscription expires today." 
            : `Your subscription expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} (${formatDate(subscriptionEndDate)})`
          }
          <a href="/subscription" className="ml-2 underline hover:text-amber-900">Renew now</a>
        </span>
      </div>
    </div>
  );
};

export default SubscriptionBanner;
