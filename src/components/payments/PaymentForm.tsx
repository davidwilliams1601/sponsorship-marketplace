'use client';

import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { formatCurrency } from '@/lib/stripe';

interface PaymentFormProps {
  amount: number;
  platformFee: number;
  clubAmount: number;
  onCancel: () => void;
}

export default function PaymentForm({ amount, platformFee, clubAmount, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setErrorMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/sponsor/success`,
      },
    });

    // confirmPayment only returns here if there's an immediate error.
    // Otherwise the customer is redirected to return_url.
    if (error) {
      setErrorMessage(error.message ?? 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between font-semibold text-gray-900 text-base">
          <span>Total</span>
          <span>{formatCurrency(amount)}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>To club</span>
          <span>{formatCurrency(clubAmount)}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Platform fee (5%)</span>
          <span>{formatCurrency(platformFee)}</span>
        </div>
      </div>

      <PaymentElement />

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={!stripe || !elements || processing}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Payments are processed securely by Stripe. Your card details are never stored on our servers.
      </p>
    </form>
  );
}
