'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  general: 'General Support'
};

export default function SponsorPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const [sponsorship, setSponsorship] = useState<Sponsorship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const sponsorshipId = params.sponsorshipId as string;

  useEffect(() => {
    if (!sponsorshipId) return;

    const fetchSponsorship = async () => {
      try {
        console.log('Loading sponsorship:', sponsorshipId);
        const docRef = doc(db, 'sponsorships', sponsorshipId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Sponsorship loaded:', data);
          setSponsorship({
            id: docSnap.id,
            ...data
          } as Sponsorship);
        } else {
          console.log('Sponsorship not found');
          setError('Sponsorship request not found');
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

  const handleSponsorNow = async () => {
    if (!user || !sponsorship) return;

    setProcessing(true);
    try {
      // Here you would integrate with Stripe for payment processing
      // For now, we'll redirect to a success page
      console.log('Processing sponsorship for:', sponsorship.title);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to success page
      router.push(`/sponsor/success?sponsorship=${sponsorship.id}&amount=${sponsorship.amount}`);
    } catch (error) {
      console.error('Error processing sponsorship:', error);
      setError('Failed to process sponsorship. Please try again.');
    } finally {
      setProcessing(false);
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

  if (error || !sponsorship) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Sponsorship Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">
            The sponsorship request you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/browse" className="btn-primary">
            Browse Other Opportunities
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  const formatDeadline = (deadline: string) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/browse" className="text-blue-600 hover:text-blue-800">
                ← Back to Browse
              </Link>
            </div>
            <div className="text-sm text-gray-500">
              Sponsor Opportunity
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{sponsorship.title}</h1>
                <p className="text-green-100 text-lg">by {sponsorship.clubName}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">£{sponsorship.amount.toLocaleString()}</div>
                <div className="text-green-100">Sponsorship Amount</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Details */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{CATEGORY_LABELS[sponsorship.category]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium capitalize">{sponsorship.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Posted:</span>
                    <span className="font-medium">{formatDate(sponsorship.createdAt)}</span>
                  </div>
                  {deadline && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deadline:</span>
                      <span className={`font-medium ${deadline.color}`}>{deadline.text}</span>
                    </div>
                  )}
                  {sponsorship.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{sponsorship.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Impact</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Views:</span>
                    <span className="font-medium">{sponsorship.viewCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interested Businesses:</span>
                    <span className="font-medium">{sponsorship.interestedBusinesses?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">{sponsorship.description}</p>
              </div>
            </div>

            {/* Benefits */}
            {sponsorship.benefits && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sponsorship Benefits</h3>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed">{sponsorship.benefits}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleSponsorNow}
                disabled={processing}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : `💳 Sponsor Now - £${sponsorship.amount.toLocaleString()}`}
              </button>
              <Link
                href={`/sponsorships/${sponsorship.id}`}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg text-center transition-colors"
              >
                📋 View Full Details
              </Link>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">How Sponsorship Works</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your sponsorship directly supports {sponsorship.clubName}</li>
            <li>• Payments are processed securely through our platform</li>
            <li>• You'll receive confirmation and impact reports</li>
            <li>• Build genuine community connections</li>
          </ul>
        </div>
      </div>
    </div>
  );
}