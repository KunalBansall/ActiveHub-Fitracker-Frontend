export {};

declare global {
  interface Window {
    Razorpay: any;
  }

  interface RazorpayPaymentResponse {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }

  interface RazorpayOptions {
    key: string;
    subscription_id: string;
    name?: string;
    description?: string;
    image?: string;
    handler: (response: RazorpayPaymentResponse) => void;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    notes?: Record<string, string>;
    theme?: {
      color?: string;
    };
  }
}
