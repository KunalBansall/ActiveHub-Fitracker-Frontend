import React, { useEffect, useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { FaCrown, FaCheckCircle, FaClock, FaExclamationTriangle, FaCalendarAlt, FaCreditCard, FaRegTimesCircle, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import RazorpayIntegration from '../components/RazorpayIntegration';
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";


interface PaymentHistory {
  paymentId: string;
  amount: number;
  plan: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

const Subscription: React.FC = () => {
  const { subscriptionStatus, trialEndDate, graceEndDate, subscriptionEndDate } = useSubscription();
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubscription, setActiveSubscription] = useState<PaymentHistory | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [hasCancelled, setHasCancelled] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');
  const [shouldShowResubscribe, setShouldShowResubscribe] = useState(false);
  const [isSubscribedDuringTrial, setIsSubscribedDuringTrial] = useState(false);
  
  // Helper to determine if the user has subscribed during trial period
  const checkIfSubscribedDuringTrial = (history: PaymentHistory[], status: string) => {
    if (status !== 'trial' || !trialEndDate) return false;
    
    // Check if we have any completed payments while in trial
    return history.some(payment => 
      payment.status === 'completed' && 
      payment.startDate && 
      new Date(payment.startDate).getTime() > new Date().getTime()
    );
  };

  // Check if date is within 2 days from now
  const isWithinTwoDays = (dateStr?: string | null): boolean => {
    if (!dateStr) return false;
    
    const targetDate = new Date(dateStr);
    const now = new Date();
    
    // Calculate difference in milliseconds
    const diffTime = targetDate.getTime() - now.getTime();
    // Convert to days and check if less than or equal to 2
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    return diffDays <= 2 && diffDays > 0;
  };
  
  // Check if date has passed
  const hasDatePassed = (dateStr?: string | null): boolean => {
    if (!dateStr) return false;
    
    const targetDate = new Date(dateStr);
    const now = new Date();
    
    return now > targetDate;
  };

  // Update subscription UI state based on current date and subscription status
  useEffect(() => {
    // Only run if we have a subscription end date
    if (subscriptionStatus === 'active' && hasCancelled && subscriptionEndDate) {
      // Check if within 2 days of billing date for showing resubscribe button
      if (isWithinTwoDays(subscriptionEndDate)) {
        setShouldShowResubscribe(true);
      } else {
        setShouldShowResubscribe(false);
      }
    } else {
      setShouldShowResubscribe(false);
    }
    
    // We also need to check if this component should refresh when subscription end date passes
    if (subscriptionStatus === 'active' && subscriptionEndDate && hasDatePassed(subscriptionEndDate)) {
      // The subscription end date has passed, so we should refresh data
      // This helps with updating UI state if the user keeps the page open past their expiration
      const fetchData = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          
          const response = await axios.get(`${API_URL}/payment/history`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setPaymentHistory(response.data);
        } catch (error) {
          console.error("Failed to refresh payment data after end date:", error);
        }
      };
      
      fetchData();
    }
  }, [subscriptionStatus, hasCancelled, subscriptionEndDate]);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Authentication token not found');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_URL}/payment/history`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setPaymentHistory(response.data);
        
        // Check if user has subscribed during trial period
        setIsSubscribedDuringTrial(checkIfSubscribedDuringTrial(response.data, subscriptionStatus));
        
        // Find most recent active subscription
        if (subscriptionStatus === 'active' && response.data.length > 0) {
          // Sort by start date descending to get the most recent payment
          const sortedPayments = [...response.data].sort((a, b) => 
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
          
          // Find the first payment that has an end date in the future
          const now = new Date();
          const currentSubscription = sortedPayments.find(payment => 
            new Date(payment.endDate) > now
          );
          
          if (currentSubscription) {
            setActiveSubscription(currentSubscription);
          }
          
          // Check if user has already cancelled
          const hasCancellationScheduled = response.data.some(
            (payment: PaymentHistory) => payment.status === 'cancellation_scheduled'
          );
          setHasCancelled(hasCancellationScheduled);
        }
      } catch (error) {
        console.error('Error fetching payment history:', error);
        toast.error('Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
    
    // Set up an interval to refresh data periodically
    // This will ensure UI updates if end date approaches/passes while user has page open
    const intervalId = setInterval(() => {
      if (subscriptionStatus === 'active' && hasCancelled) {
        fetchPaymentHistory();
      }
    }, 60 * 60 * 1000); // Refresh every hour
    
    return () => clearInterval(intervalId);
  }, [subscriptionStatus, trialEndDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return hasCancelled ? 'text-yellow-500' : 'text-green-500';
      case 'trial':
        return isSubscribedDuringTrial ? 'text-purple-500' : 'text-blue-500';
      case 'grace':
        return 'text-yellow-500';
      case 'expired':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return hasCancelled ? 
          <FaExclamationTriangle className="text-yellow-500" /> : 
          <FaCheckCircle className="text-green-500" />;
      case 'trial':
        return isSubscribedDuringTrial ? 
          <FaCrown className="text-purple-500" /> : 
          <FaClock className="text-blue-500" />;
      case 'grace':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'expired':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openCancelConfirmation = () => {
    setShowCancelConfirm(true);
  };

  const closeCancelConfirmation = () => {
    setShowCancelConfirm(false);
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelling(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      const response = await axios.post(
        `${API_URL}/payment/cancel-subscription`, 
        {}, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      toast.success(response.data.message);
      setCancelMessage(response.data.message);
      setHasCancelled(true);
      
      // Refresh payment history after successful cancellation
      const historyResponse = await axios.get(`${API_URL}/payment/history`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPaymentHistory(historyResponse.data);
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  // Determine what subscription UI elements to show
  const showSubscribeButton = !subscriptionStatus || 
                             (subscriptionStatus === 'trial' && !isSubscribedDuringTrial) || 
                             subscriptionStatus === 'grace' || 
                             subscriptionStatus === 'expired' || 
                             subscriptionStatus === 'cancelled' || 
                             (subscriptionStatus === 'active' && hasCancelled && hasDatePassed(subscriptionEndDate));
  
  // Show the resubscribe button only when we're close to end date
  const showResubscribeButton = subscriptionStatus === 'active' && hasCancelled && shouldShowResubscribe;
  
  // Show the cancel button only for active, non-cancelled subscriptions
  const showCancelButton = subscriptionStatus === 'active' && !hasCancelled;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>

        {/* Current Subscription Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 mb-2">Status</p>
              <div className="flex items-center">
                {getStatusIcon(subscriptionStatus)}
                <span className={`ml-2 font-medium ${getStatusColor(subscriptionStatus)}`}>
                  {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
                  {hasCancelled && " (Cancellation Scheduled)"}
                  {isSubscribedDuringTrial && " (Pro Plan Activated)"}
                </span>
              </div>
            </div>
            {subscriptionStatus === 'trial' && trialEndDate && (
              <div>
                <p className="text-gray-600 mb-2">Trial Ends</p>
                <p className="font-medium">{formatDate(trialEndDate)}</p>
                {isSubscribedDuringTrial && (
                  <p className="text-sm text-purple-500 mt-1">
                    Your Pro Plan will start after trial ends
                  </p>
                )}
              </div>
            )}
            {subscriptionStatus === 'grace' && graceEndDate && (
              <div>
                <p className="text-gray-600 mb-2">Grace Period Ends</p>
                <p className="font-medium">{formatDate(graceEndDate)}</p>
              </div>
            )}
            {subscriptionStatus === 'active' && subscriptionEndDate && (
              <div>
                <p className="text-gray-600 mb-2">Next Billing Date</p>
                <p className="font-medium">{formatDate(subscriptionEndDate)}</p>
              </div>
            )}
          </div>
          
          {/* Display special trial-to-active message */}
          {isSubscribedDuringTrial && (
            <div className="mt-4 p-3 bg-purple-50 border-l-4 border-purple-400 text-purple-800 rounded">
              <div className="flex">
                <FaInfoCircle className="text-purple-500 mr-2 mt-1" />
                <div>
                  <p className="font-medium">Pro Plan Activated During Trial</p>
                  <p>
                    You've subscribed to the Pro Plan during your trial. Your trial benefits continue until {formatDate(trialEndDate)}, 
                    after which your paid subscription will begin automatically. Your first renewal payment will be on {formatDate(activeSubscription?.endDate || trialEndDate)}.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Display cancellation message if applicable */}
          {hasCancelled && subscriptionStatus === 'active' && (
            <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
              <p>
                Your membership has been cancelled. You will have access to Pro features until {formatDate(subscriptionEndDate)}.
                After that date, to continue using Pro features, please subscribe again.
              </p>
              
              {/* Show resubscribe button if close to expiration */}
              {showResubscribeButton && (
                <div className="mt-3">
                  <RazorpayIntegration buttonLabel="Subscribe Again" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active Subscription Details */}
        {(subscriptionStatus === 'active' || isSubscribedDuringTrial) && activeSubscription && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-green-500">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaCrown className="text-yellow-500 mr-2" />
              {isSubscribedDuringTrial ? "Upcoming Pro Plan Details" : "Active Plan Details"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 mb-2">Plan</p>
                <p className="font-medium">{activeSubscription.plan}</p>
                
                <p className="text-gray-600 mt-4 mb-2">Payment ID</p>
                <p className="font-medium text-sm truncate">{activeSubscription.paymentId}</p>
                
                <p className="text-gray-600 mt-4 mb-2">Amount</p>
                <p className="font-medium">₹{activeSubscription.amount}</p>
              </div>
              <div>
                <div className="flex items-center mb-4">
                  <FaCalendarAlt className="text-gray-500 mr-2" />
                  <div>
                    <p className="text-gray-600 mb-1">
                      {isSubscribedDuringTrial ? "Will Start On" : "Start Date"}
                    </p>
                    <p className="font-medium">{formatDate(activeSubscription.startDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center mb-4">
                  <FaCalendarAlt className="text-gray-500 mr-2" />
                  <div>
                    <p className="text-gray-600 mb-1">
                      {isSubscribedDuringTrial ? "First Renewal On" : "End Date"}
                    </p>
                    <p className="font-medium">{formatDate(activeSubscription.endDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FaCreditCard className="text-gray-500 mr-2" />
                  <div>
                    <p className="text-gray-600 mb-1">Payment Method</p>
                    <p className="font-medium">Razorpay</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ActiveHub Pro Upgrade Section - Only show if should display subscribe button */}
        {showSubscribeButton && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center mb-4">
              <FaCrown className="text-yellow-500 text-2xl mr-2" />
              <h2 className="text-xl font-semibold">ActiveHub Pro</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Pro Features</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <FaCheckCircle className="text-green-500 mr-2" />
                    Unlimited Members
                  </li>
                  <li className="flex items-center">
                    <FaCheckCircle className="text-green-500 mr-2" />
                    Advanced Analytics
                  </li>
                  <li className="flex items-center">
                    <FaCheckCircle className="text-green-500 mr-2" />
                    Priority Support
                  </li>
                  <li className="flex items-center">
                    <FaCheckCircle className="text-green-500 mr-2" />
                    Custom Branding
                  </li>
                </ul>
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold">₹199</p>
                  <p className="text-gray-600">per month</p>
                </div>
                {subscriptionStatus === 'trial' && (
                  <div className="mb-4 text-center text-sm text-purple-700">
                    <p>Subscribe now and your Pro Plan will start after your trial period ends.</p>
                  </div>
                )}
                <RazorpayIntegration />
              </div>
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Payment History</h2>
          {loading ? (
            <p>Loading payment history...</p>
          ) : paymentHistory.length === 0 ? (
            <p>No payment history available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentHistory.map((payment) => (
                    <tr key={payment.paymentId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ₹{payment.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.plan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(payment.startDate)} - {formatDate(payment.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          payment.status === 'cancellation_scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status === 'cancellation_scheduled' ? 'Cancellation Scheduled' : payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Conditional Cancel Subscription Button - only show for active subscriptions that haven't been cancelled */}
        {showCancelButton && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={openCancelConfirmation}
              disabled={cancelling}
              className="flex items-center justify-center px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors duration-300 disabled:opacity-50"
            >
              {cancelling ? (
                'Processing...'
              ) : (
                <>
                  <FaRegTimesCircle className="mr-2" />
                  Cancel Membership
                </>
              )}
            </button>
          </div>
        )}

        {/* Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Cancel Membership</h3>
              <p className="mb-6">
                Are you sure you want to cancel your Pro Plan? You will continue to have access to Pro features until the end of your current billing period.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeCancelConfirmation}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-300"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300 disabled:opacity-50"
                >
                  {cancelling ? 'Processing...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription; 