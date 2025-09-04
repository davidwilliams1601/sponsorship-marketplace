'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, addDoc, collection, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { stripePromise, formatCurrency, calculatePlatformFee, calculateClubAmount } from '@/lib/stripe';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface Sponsorship {
  id: string;
  title: string;
  description: string;
  amount: number;
  clubId: string;
  clubName: string;
  category: string;
  benefits?: string;
}

// Payment form component
function PaymentForm({ sponsorship }: { sponsorship: Sponsorship }) {
  const { user, userData } = useAuth();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const platformFee = calculatePlatformFee(sponsorship.amount);
  const clubAmount = calculateClubAmount(sponsorship.amount);

  useEffect(() => {
    if (!user || userData?.type !== 'business') return;

    // Create payment intent
    const createPaymentIntent = async () => {
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
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError(data.error || 'Failed to initialize payment');
        }
      } catch (error) {
        setError('Failed to initialize payment');
        console.error('Payment intent error:', error);
      }
    };

    createPaymentIntent();
  }, [user, userData, sponsorship.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    // Confirm payment
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: userData?.name,
          email: userData?.email,
        },
      },
    });

    if (error) {
      setError(error.message || 'Payment failed');
      setProcessing(false);
    } else if (paymentIntent?.status === 'succeeded') {
      // Create agreement record
      try {
        await addDoc(collection(db, 'agreements'), {
          sponsorshipId: sponsorship.id,
          clubId: sponsorship.clubId,
          businessId: user.uid,
          amount: sponsorship.amount,
          platformFee: platformFee,
          clubAmount: clubAmount,
          paymentIntentId: paymentIntent.id,
          status: 'active',
          createdAt: serverTimestamp(),
          sponsorshipTitle: sponsorship.title,
          clubName: sponsorship.clubName,
          businessName: userData?.name || 'Unknown Business',
        });

        // Update sponsorship status
        await updateDoc(doc(db, 'sponsorships', sponsorship.id), {
          status: 'funded',
          fundedAt: serverTimestamp(),
          fundedBy: user.uid,
        });

        // Redirect to success page
        router.push(`/sponsor/success?agreement=${paymentIntent.id}`);
      } catch (error) {
        console.error('Error creating agreement:', error);
        setError('Payment succeeded but failed to create agreement. Please contact support.');
      }
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Payment Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Payment Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-blue-800">Sponsorship Amount:</span>
            <span className="font-semibold">{formatCurrency(sponsorship.amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">To Club:</span>
            <span>{formatCurrency(clubAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">Platform Fee (5%):</span>
            <span>{formatCurrency(platformFee)}</span>
          </div>
          <div className="border-t border-blue-200 pt-2 mt-2">
            <div className="flex justify-between font-bold text-blue-900">
              <span>Total Charge:</span>
              <span>{formatCurrency(sponsorship.amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Details
        </label>
        <div className="p-4 border border-gray-300 rounded-lg">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Terms */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Agreement Terms</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• By completing this payment, you agree to sponsor "{sponsorship.title}"</p>
          <p>• The club will receive {formatCurrency(clubAmount)} after the platform fee</p>
          <p>• Sponsorship benefits as described by the club apply</p>
          <p>• This transaction is processed securely by Stripe</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing || !clientSecret}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3 text-lg"
      >
        {processing ? 'Processing Payment...' : `Pay ${formatCurrency(sponsorship.amount)}`}
      </button>
    </form>
  );
}

export default function SponsorshipPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const [sponsorship, setSponsorship] = useState<Sponsorship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sponsorshipId = params.sponsorshipId as string;

  // Redirect if not a business
  if (userData && userData.type !== 'business') {
    router.push('/dashboard');
    return null;
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  useEffect(() => {
    const fetchSponsorship = async () => {
      if (!sponsorshipId) return;

      try {
        const docRef = doc(db, 'sponsorships', sponsorshipId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Check if sponsorship is still available
          if (data.status !== 'active') {
            setError('This sponsorship is no longer available for funding.');
            setLoading(false);
            return;
          }

          setSponsorship({
            id: docSnap.id,
            ...data
          } as Sponsorship);
        } else {
          setError('Sponsorship not found');
        }
      } catch (error) {
        console.error('Error fetching sponsorship:', error);
        setError('Failed to load sponsorship details');
      } finally {
        setLoading(false);
      }
    };

    fetchSponsorship();
  }, [sponsorshipId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !sponsorship) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Sponsorship not found'}
          </h1>
          <Link href="/browse" className="btn-primary">
            Browse Other Opportunities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sponsor This Club</h1>
          <p className="mt-2 text-gray-600">
            Complete your sponsorship payment securely with Stripe
          </p>
        </div>

        {/* Sponsorship Details */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{sponsorship.title}</h2>
          <p className="text-gray-600 mb-4">by {sponsorship.clubName}</p>
          <p className="text-gray-700 mb-4">{sponsorship.description}</p>
          
          {sponsorship.benefits && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">What You'll Get</h3>
              <p className="text-green-800 text-sm">{sponsorship.benefits}</p>
            </div>
          )}
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <Elements stripe={stripePromise}>
            <PaymentForm sponsorship={sponsorship} />
          </Elements>
        </div>
      </div>
    </div>
  );
}