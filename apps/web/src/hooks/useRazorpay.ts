import { useEffect, useState } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Dynamically loads Razorpay checkout.js only when needed
export function useRazorpay() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.Razorpay) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => console.error("Failed to load Razorpay");
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  function openRazorpay(options: {
    orderId: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    userEmail: string;
    userName: string;
    onSuccess: (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => void;
    onDismiss: () => void;
  }) {
    if (!loaded) {
      console.error("Razorpay not loaded yet");
      return;
    }

    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: options.amount,
      currency: options.currency,
      name: options.name,
      description: options.description,
      order_id: options.orderId,
      prefill: {
        name: options.userName,
        email: options.userEmail,
      },
      theme: { color: "#000000" },
      modal: {
        ondismiss: options.onDismiss,
      },
      handler: (response: any) => {
        const payload = {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        };
        try {
          const result = options.onSuccess(payload) as unknown;
          if (
            result !== null &&
            result !== undefined &&
            typeof (result as Promise<unknown>).then === "function"
          ) {
            void (result as Promise<unknown>).catch((err) => {
              console.error("[Razorpay] onSuccess failed:", err);
            });
          }
        } catch (err) {
          console.error("[Razorpay] onSuccess failed:", err);
        }
      },
    });

    rzp.open();
  }

  return { loaded, openRazorpay };
}
