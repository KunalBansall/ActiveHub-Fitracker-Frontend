import React from 'react';
import { FaExclamationCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

interface SubscriptionBannerProps {
  subscriptionStatus: string;
  trialEndDate?: string;
  graceEndDate?: string;
  subscriptionEndDate?: string;
  subscriptionStartDate?: string;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({
  subscriptionStatus,
  trialEndDate,
  graceEndDate,
  subscriptionEndDate,
}) => {
  // Calculate days remaining
  const calculateDaysRemaining = (dateString?: string): number => {
    if (!dateString) return 0;
    const endDate = new Date(dateString);
    const now = new Date();
    return Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Calculate days remaining for each period
  const trialDaysRemaining = calculateDaysRemaining(trialEndDate);
  const graceDaysRemaining = calculateDaysRemaining(graceEndDate);
  const subscriptionDaysRemaining = calculateDaysRemaining(subscriptionEndDate);

  // No banner for free tier or if all dates are missing
  if (
    subscriptionStatus === 'free' || 
    (!trialEndDate && !graceEndDate && !subscriptionEndDate)
  ) {
    return null;
  }

  // Handle trial period
  if (subscriptionStatus === 'trial') {
    // Trial expired
    if (trialDaysRemaining === 0) {
      return (
        <div className="w-full mb-4">
          <div className="flex items-center bg-red-50 border-l-4 border-red-500 py-2 px-3 rounded-md shadow-sm">
            <FaTimesCircle className="text-red-500 mr-2" />
            <span className="text-sm font-medium text-red-800">
              Your trial period has expired.
              <a href="/subscription" className="ml-2 underline hover:text-red-900">Upgrade now</a>
            </span>
          </div>
        </div>
      );
    }
    
    // Trial active
    return (
      <div className="w-full mb-4">
        <div className="flex items-center bg-blue-50 border-l-4 border-blue-500 py-2 px-3 rounded-md shadow-sm">
          <FaInfoCircle className="text-blue-500 mr-2" />
          <span className="text-sm font-medium text-blue-800">
            {trialDaysRemaining === 1 
              ? "Your trial expires tomorrow."
              : `Your trial expires in ${trialDaysRemaining} days (${formatDate(trialEndDate)})`
            }
            <a href="/subscription" className="ml-2 underline hover:text-blue-900">Upgrade now</a>
          </span>
        </div>
      </div>
    );
  }

  // Handle grace period
  if (subscriptionStatus === 'grace') {
    // Grace period expired
    if (graceDaysRemaining === 0) {
      return (
        <div className="w-full mb-4">
          <div className="flex items-center bg-red-50 border-l-4 border-red-500 py-2 px-3 rounded-md shadow-sm">
            <FaTimesCircle className="text-red-500 mr-2" />
            <span className="text-sm font-medium text-red-800">
              Your grace period has expired. Your account has limited functionality.
              <a href="/subscription" className="ml-2 underline hover:text-red-900">Renew now</a>
            </span>
          </div>
        </div>
      );
    }
    
    // Grace period active
    return (
      <div className="w-full mb-4">
        <div className="flex items-center bg-red-50 border-l-4 border-red-500 py-2 px-3 rounded-md shadow-sm">
          <FaExclamationCircle className="text-red-500 mr-2" />
          <span className="text-sm font-medium text-red-800">
            {graceDaysRemaining === 1 
              ? "Your grace period expires tomorrow." 
              : `Your grace period expires in ${graceDaysRemaining} days (${formatDate(graceEndDate)})`
            }
            <a href="/subscription" className="ml-2 underline hover:text-red-900">Renew now</a>
          </span>
        </div>
      </div>
    );
  }

  // For active subscription - only show banner if 3 days or less remaining
  if (subscriptionStatus === 'active' && subscriptionDaysRemaining <= 3) {
    return (
      <div className="w-full mb-4">
        <div className="flex items-center bg-amber-50 border-l-4 border-amber-500 py-2 px-3 rounded-md shadow-sm">
          <FaExclamationCircle className="text-amber-500 mr-2" />
          <span className="text-sm font-medium text-amber-800">
            {subscriptionDaysRemaining === 0 
              ? "Your subscription expires today." 
              : `Your subscription expires in ${subscriptionDaysRemaining} ${subscriptionDaysRemaining === 1 ? 'day' : 'days'} (${formatDate(subscriptionEndDate)})`
            }
            <a href="/subscription" className="ml-2 underline hover:text-amber-900">Renew now</a>
          </span>
        </div>
      </div>
    );
  }

  // Expired or cancelled subscription
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

  // Default - don't show banner for active subscription with more than 3 days remaining
  return null;
};

export default SubscriptionBanner;
