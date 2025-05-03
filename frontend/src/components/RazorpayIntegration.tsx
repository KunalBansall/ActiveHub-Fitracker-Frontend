import { useEffect, useState } from "react";
import axios from "axios";
import { useSubscription } from '../context/SubscriptionContext';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface RazorpayResponse {
  subscriptionId: string;
  planId: string;
  calculatedStartDate: string;
  calculatedEndDate: string;
  trialPeriodDays: number;
  nextDueOn: string;
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayPaymentResponse) => void;
  theme: {
    color: string;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = () => {
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.async = true;
  document.body.appendChild(script);
};

interface RazorpayIntegrationProps {
  buttonLabel?: string;
}

const RazorpayIntegration = ({ buttonLabel = "Subscribe Now" }: RazorpayIntegrationProps) => {
  const { subscriptionStatus, trialEndDate } = useSubscription();
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const openRazorpayCheckout = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      
      const res = await axios.post<RazorpayResponse>(
        `${API_URL}/payment/create-subscription`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { subscriptionId, calculatedStartDate, calculatedEndDate, trialPeriodDays } = res.data;
      
      // Show information to the user about their subscription dates
      if (subscriptionStatus === 'trial' && trialPeriodDays > 0) {
        toast.success(
          `Your Pro Plan will begin on ${new Date(calculatedStartDate).toLocaleDateString()} after your trial ends. You won't be billed again until ${new Date(calculatedEndDate).toLocaleDateString()}.`,
          { duration: 6000 }
        );
      }

      const options: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "", // Required key
        subscription_id: subscriptionId,
        name: "ActiveHub Subscription",
        description: trialPeriodDays > 0 
          ? `Pro Plan (Starts after trial on ${new Date(calculatedStartDate).toLocaleDateString()})` 
          : "Pro Plan (Starts today)",
        handler: async function (response: RazorpayPaymentResponse) {
          try {
            const verifyResponse = await axios.post(
              `${API_URL}/payment/verify-subscription`,
              {
                ...response,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            
            toast.success("Payment successful! Your subscription is now active.");
            
            // Notify user about their subscription dates
            if (subscriptionStatus === 'trial' && trialPeriodDays > 0) {
              toast.success(
                `Your existing trial continues until ${new Date(calculatedStartDate).toLocaleDateString()}, after which your paid subscription begins.`,
                { duration: 5000 }
              );
            } else {
              toast.success(
                `Your subscription is active until ${new Date(calculatedEndDate).toLocaleDateString()}.`,
                { duration: 5000 }
              );
            }
            
            // Reload the page after subscription to update UI
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          } catch (error) {
            toast.error("Payment verification failed. Please contact support.");
            console.error("Verification error:", error);
          }
        },
        theme: {
          color: "#1F2937",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Razorpay subscription error:", error);
      toast.error("Failed to create subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={openRazorpayCheckout}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Processing..." : buttonLabel}
      </button>
    </div>
  );
};

export default RazorpayIntegration;
