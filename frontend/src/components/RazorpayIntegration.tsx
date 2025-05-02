import { useEffect } from "react";
import axios from "axios";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const loadRazorpayScript = () => {
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.async = true;
  document.body.appendChild(script);
};

const RazorpayIntegration = () => {
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const openRazorpayCheckout = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/payment/create-subscription`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { subscriptionId } = res.data;

      const options: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "", // Required key
        subscription_id: subscriptionId,
        name: "ActiveHub Subscription",
        description: "Gym Management Software",
        handler:async function (response: RazorpayPaymentResponse) {
          alert("✅ Payment successful! ID: " + response.razorpay_payment_id);
          // You can also send response.razorpay_subscription_id and signature to backend here
          try {
            await axios.post(
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
            alert("🛡️ Payment verified on server");
          } catch (error) {
            alert("❌ Payment verification failed on server.");
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
      alert("❌ Failed to create subscription. Try again.");
    }
  };

  return (
    <div>
      <button
        onClick={openRazorpayCheckout}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md"
      >
        Subscribe Now
      </button>
    </div>
  );
};

export default RazorpayIntegration;
