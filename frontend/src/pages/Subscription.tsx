import React, { useEffect, useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { FaCrown, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
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
      } catch (error) {
        console.error('Error fetching payment history:', error);
        toast.error('Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'trial':
        return 'text-blue-500';
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
        return <FaCheckCircle className="text-green-500" />;
      case 'trial':
        return <FaClock className="text-blue-500" />;
      case 'grace':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'expired':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
                </span>
              </div>
            </div>
            {subscriptionStatus === 'trial' && trialEndDate && (
              <div>
                <p className="text-gray-600 mb-2">Trial Ends</p>
                <p className="font-medium">{formatDate(trialEndDate)}</p>
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
        </div>

        {/* ActiveHub Pro Upgrade Section */}
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
              <RazorpayIntegration />
            </div>
          </div>
        </div>

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
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscription; 