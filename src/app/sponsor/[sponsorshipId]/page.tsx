'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { stripePromise, formatCurrency } from '@/lib/stripe';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '@/components/payments/PaymentForm';
import Link from 'next/link';

interface Sponsorship {
  id: string;
  title: string;
  description: string;
  amount: number;
  clubId: string;
  clubName: string;
  category: string;
  urgency: string;
  status: string;
  benefits?: string;
  location?: string;
  createdAt: any;
  deadline?: string;
  viewCount: number;
  interestedBusinesses: string[];
}

const CATEGORY_LABELS: { [key: string]: string } = {
  equipment: 'Equipment & Gear',
  event: 'Event Sponsorship',
  facility: 'Facility & Ground',
  travel: 'Travel & Transport',
  training: 'Training & Coaching',
  general: 'General Support',
};

interface PaymentDetails {
  clientSecret: string;
  amount: number;
  platformFee: number;
  clubAmount: number;
}

export default function SponsorPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const [sponsorship, setSponsorship] = useState<Sponsorship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [preparingPayment, setPreparingPayment] = useState(false);

  const sponsorshipId = params.sponsorshipId as string;

  useEffect(() => {
    if (!sponsorshipId) return;

    const fetchSponsorship = async () => {
      try {
        const docRef = doc(db, 'sponsorships', sponsorshipId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSponsorship({ id: docSnap.id, ...docSnap.data() } as Sponsorship);
        } else {
          setError('Sponsorship request not found');
        }
      } catch (err) {
        console.error('Error fetching sponsorship:', err);
        setError('Failed to load sponsorship details');
      } finally {
        setLoading(false);
      }
    };

    fetchSponsorship();
  }, [sponsorshipId]);

  const handleProceedToPayment = async () => {
    if (!user || !sponsorship) return;

    setPreparingPayment(true);
    setError('');

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sponsorshipId: sponsorship.id,
          businessId: user.uid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to prepare payment');
      }

      setPaymentDetails(data);
    } catch (err: any) {
      console.error('Error preparing payment:', err);
      setError(err.message ?? 'Failed to prepare payment. Please try again.');
    } finally {
      setPreparingPayment(false);
    }
  };

  if (!userData || userData.type !== 'business') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">This page is only available to business users.</p>
          <Link href="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !sponsorship) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Sponsorship Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">
            The sponsorship request you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/browse" className="btn-primary">
            Browse Other Opportunities
          </Link>
        </div>
      </div>
    );
  }

  if (!sponsorship) return null;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-GB');
  };

  const formatDeadline = (deadline: string) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const diffDays = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-600' };
    if (diffDays === 0) return { text: 'Today', color: 'text-red-600' };
    if (diffDays <= 7) return { text: `${diffDays}d left`, color: 'text-yellow-600' };
    return { text: `${diffDays}d left`, color: 'text-gray-600' };
  };

  const deadline = sponsorship.deadline ? formatDeadline(sponsorship.deadline) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/browse" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            ← Back to Browse
          </Link>
          <span className="text-sm text-gray-500">Secure Checkout</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-8">

        {/* Left: Sponsorship summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-5 py-6 text-white">
              <h1 className="text-xl font-bold mb-1">{sponsorship.title}</h1>
              <p className="text-green-100 text-sm">by {sponsorship.clubName}</p>
              <p className="text-2xl font-bold mt-3">{formatCurrency(sponsorship.amount)}</p>
            </div>

            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Category</span>
                <span className="font-medium text-gray-900">
                  {CATEGORY_LABELS[sponsorship.category] ?? sponsorship.category}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Posted</span>
                <span className="font-medium text-gray-900">{formatDate(sponsorship.createdAt)}</span>
              </div>
              {sponsorship.location && (
                <div className="flex justify-between text-gray-600">
                  <span>Location</span>
                  <span className="font-medium text-gray-900">{sponsorship.location}</span>
                </div>
              )}
              {deadline && (
                <div className="flex justify-between text-gray-600">
                  <span>Deadline</span>
                  <span className={`font-medium ${deadline.color}`}>{deadline.text}</span>
                </div>
              )}
            </div>
          </div>

          {sponsorship.description && (
            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">About this request</h3>
              <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                {sponsorship.description}
              </p>
              <Link
                href={`/sponsorships/${sponsorship.id}`}
                className="text-blue-600 hover:text-blue-800 text-xs mt-2 inline-block"
              >
                Read full details →
              </Link>
            </div>
          )}
        </div>

        {/* Right: Payment area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            {!paymentDetails ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Your Sponsorship</h2>
                <p className="text-gray-600 text-sm mb-6">
                  Your payment will directly support {sponsorship.clubName}.
                  A 5% platform fee helps us maintain and grow the service.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm mb-6">
                  <div className="flex justify-between font-semibold text-gray-900 text-base">
                    <span>Total charge</span>
                    <span>{formatCurrency(sponsorship.amount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>To {sponsorship.clubName}</span>
                    <span>{formatCurrency(sponsorship.amount * 0.95)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Platform fee (5%)</span>
                    <span>{formatCurrency(sponsorship.amount * 0.05)}</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleProceedToPayment}
                  disabled={preparingPayment}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {preparingPayment ? 'Preparing...' : `Continue to Payment — ${formatCurrency(sponsorship.amount)}`}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  🔒 Payments processed securely by Stripe
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Enter Payment Details</h2>

                {stripePromise ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: paymentDetails.clientSecret,
                      appearance: { theme: 'stripe' },
                    }}
                  >
                    <PaymentForm
                      amount={paymentDetails.amount}
                      platformFee={paymentDetails.platformFee}
                      clubAmount={paymentDetails.clubAmount}
                      onCancel={() => setPaymentDetails(null)}
                    />
                  </Elements>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Payment processing is not available. Please try again later.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
