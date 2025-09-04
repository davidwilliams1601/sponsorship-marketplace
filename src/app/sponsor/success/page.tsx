'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatCurrency } from '@/lib/stripe';
import Link from 'next/link';

interface Agreement {
  id: string;
  sponsorshipTitle: string;
  clubName: string;
  amount: number;
  platformFee: number;
  clubAmount: number;
  createdAt: any;
  paymentIntentId: string;
}

function PaymentSuccessPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const paymentIntentId = searchParams.get('agreement');

  useEffect(() => {
    if (!user || !paymentIntentId) return;

    const fetchAgreement = async () => {
      try {
        const q = query(
          collection(db, 'agreements'),
          where('paymentIntentId', '==', paymentIntentId),
          where('businessId', '==', user.uid),
          limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setAgreement({
            id: doc.id,
            ...doc.data()
          } as Agreement);
        }
      } catch (error) {
        console.error('Error fetching agreement:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgreement();
  }, [user, paymentIntentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
              SponsorConnect
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Success Content */}
      <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful! 🎉
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Thank you for sponsoring a local sports club. Your payment has been processed successfully.
          </p>

          {agreement && (
            <div className="bg-gray-50 rounded-lg p-6 text-left mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sponsorship Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sponsorship:</span>
                  <span className="font-medium">{agreement.sponsorshipTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Club:</span>
                  <span className="font-medium">{agreement.clubName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold">{formatCurrency(agreement.amount)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>To Club:</span>
                  <span>{formatCurrency(agreement.clubAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Platform Fee:</span>
                  <span>{formatCurrency(agreement.platformFee)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Payment ID:</span>
                  <span className="font-mono">{agreement.paymentIntentId}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">What Happens Next?</h3>
            <div className="text-left text-blue-800 space-y-2">
              <p>✅ The club has been notified of your sponsorship</p>
              <p>✅ You'll receive an email receipt shortly</p>
              <p>✅ The club will reach out to coordinate benefits delivery</p>
              <p>✅ You can track this sponsorship in your dashboard</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="btn-primary text-center"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/browse"
              className="btn-secondary text-center"
            >
              Browse More Opportunities
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact us at support@sponsorconnect.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PaymentSuccessPageContent />
    </Suspense>
  );
}