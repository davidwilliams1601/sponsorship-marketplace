'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface Sponsorship {
  id: string;
  title: string;
  description: string;
  category: string;
  amount: number;
  urgency: string;
  status: string;
  createdAt: any;
  deadline?: string;
  benefits?: string;
  location?: string;
  viewCount: number;
  interestedBusinesses: string[];
  clubId: string;
  clubName: string;
}

const CATEGORY_LABELS: { [key: string]: string } = {
  equipment: 'Equipment & Gear',
  event: 'Event Sponsorship',
  facility: 'Facility & Ground',
  travel: 'Travel & Transport',
  training: 'Training & Coaching',
  general: 'General Support'
};

const URGENCY_STYLES: { [key: string]: string } = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

const STATUS_STYLES: { [key: string]: string } = {
  active: 'bg-blue-100 text-blue-800',
  funded: 'bg-green-100 text-green-800',
  paused: 'bg-gray-100 text-gray-800',
  expired: 'bg-red-100 text-red-800'
};

export default function SponsorshipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const [sponsorship, setSponsorship] = useState<Sponsorship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showingInterest, setShowingInterest] = useState(false);

  const sponsorshipId = params.id as string;

  useEffect(() => {
    const fetchSponsorship = async () => {
      if (!sponsorshipId) return;

      try {
        const docRef = doc(db, 'sponsorships', sponsorshipId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Sponsorship;
          setSponsorship(data);

          // Increment view count if user is not the owner
          if (user && user.uid !== data.clubId) {
            await updateDoc(docRef, {
              viewCount: increment(1)
            });
          }
        } else {
          setError('Sponsorship request not found');
        }
      } catch (error) {
        console.error('Error fetching sponsorship:', error);
        setError('Failed to load sponsorship request');
      } finally {
        setLoading(false);
      }
    };

    fetchSponsorship();
  }, [sponsorshipId, user]);

  const handleShowInterest = async () => {
    if (!user || !sponsorship || userData?.type !== 'business') return;

    setShowingInterest(true);
    try {
      const docRef = doc(db, 'sponsorships', sponsorshipId);
      
      // Check if already interested
      if (sponsorship.interestedBusinesses.includes(user.uid)) {
        // Remove interest
        const updatedBusinesses = sponsorship.interestedBusinesses.filter(id => id !== user.uid);
        await updateDoc(docRef, {
          interestedBusinesses: updatedBusinesses
        });
        setSponsorship(prev => prev ? {
          ...prev,
          interestedBusinesses: updatedBusinesses
        } : null);
      } else {
        // Add interest
        const updatedBusinesses = [...sponsorship.interestedBusinesses, user.uid];
        await updateDoc(docRef, {
          interestedBusinesses: updatedBusinesses
        });
        setSponsorship(prev => prev ? {
          ...prev,
          interestedBusinesses: updatedBusinesses
        } : null);
      }
    } catch (error) {
      console.error('Error updating interest:', error);
    } finally {
      setShowingInterest(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDeadline = (deadline: string) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      date: deadlineDate.toLocaleDateString('en-GB'),
      daysLeft: diffDays,
      isOverdue: diffDays < 0,
      isUrgent: diffDays <= 7 && diffDays >= 0
    };
  };

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
          <Link href="/dashboard" className="btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.uid === sponsorship.clubId;
  const isBusiness = userData?.type === 'business';
  const isInterested = sponsorship.interestedBusinesses.includes(user?.uid || '');
  const deadline = sponsorship.deadline ? formatDeadline(sponsorship.deadline) : null;

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
              {isOwner ? (
                <>
                  <Link href="/sponsorships/manage" className="text-gray-600 hover:text-gray-900">
                    My Requests
                  </Link>
                  <Link
                    href={`/sponsorships/${sponsorshipId}/edit`}
                    className="btn-secondary"
                  >
                    Edit Request
                  </Link>
                </>
              ) : (
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{sponsorship.title}</h1>
                <p className="text-blue-100 mb-4">by {sponsorship.clubName}</p>
                
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-white text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {CATEGORY_LABELS[sponsorship.category]}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    sponsorship.urgency === 'high' ? 'bg-red-500 text-white' :
                    sponsorship.urgency === 'medium' ? 'bg-yellow-500 text-white' :
                    'bg-green-500 text-white'
                  }`}>
                    {sponsorship.urgency === 'low' ? 'Not Urgent' : 
                     sponsorship.urgency === 'medium' ? 'Moderately Urgent' : 'Urgent'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    sponsorship.status === 'active' ? 'bg-blue-500 text-white' :
                    sponsorship.status === 'funded' ? 'bg-green-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {sponsorship.status.charAt(0).toUpperCase() + sponsorship.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="mt-4 lg:mt-0 lg:ml-6 text-right">
                <div className="text-3xl font-bold mb-1">
                  £{sponsorship.amount.toLocaleString()}
                </div>
                <div className="text-blue-100 text-sm">
                  {sponsorship.viewCount} views • {sponsorship.interestedBusinesses.length} interested
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Deadline Warning */}
            {deadline && (deadline.isOverdue || deadline.isUrgent) && (
              <div className={`mb-6 p-4 rounded-lg ${
                deadline.isOverdue ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className={`font-medium ${deadline.isOverdue ? 'text-red-800' : 'text-yellow-800'}`}>
                  {deadline.isOverdue ? 'Deadline Passed' : 'Deadline Approaching'}
                </div>
                <div className={`text-sm ${deadline.isOverdue ? 'text-red-600' : 'text-yellow-600'}`}>
                  Deadline: {deadline.date} {!deadline.isOverdue && `(${deadline.daysLeft} days left)`}
                </div>
              </div>
            )}

            {/* Interest Button for Businesses */}
            {!isOwner && isBusiness && user && (
              <div className="space-y-4 mb-6">
                <Link
                  href={`/sponsor/${sponsorshipId}`}
                  className="w-full block py-3 px-6 rounded-lg font-semibold text-lg text-center bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  💳 Sponsor This Club Now
                </Link>
                <button
                  onClick={handleShowInterest}
                  disabled={showingInterest}
                  className={`w-full py-2 px-6 rounded-lg font-medium transition-colors ${
                    isInterested
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {showingInterest
                    ? 'Updating...'
                    : isInterested
                      ? '✓ Interested - Click to Remove'
                      : '👍 Show Interest (No Payment)'
                  }
                </button>
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <div className="prose max-w-none text-gray-700">
                {sponsorship.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Benefits */}
            {sponsorship.benefits && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">What We Offer Sponsors</h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-gray-700">
                    {sponsorship.benefits.split('\n').map((benefit, index) => (
                      <p key={index} className="mb-2">
                        {benefit}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Amount Needed</dt>
                    <dd className="text-lg font-semibold text-gray-900">£{sponsorship.amount.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="text-gray-900">{CATEGORY_LABELS[sponsorship.category]}</dd>
                  </div>
                  {sponsorship.location && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Location</dt>
                      <dd className="text-gray-900">{sponsorship.location}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Posted</dt>
                    <dd className="text-gray-900">{formatDate(sponsorship.createdAt)}</dd>
                  </div>
                  {sponsorship.deadline && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Deadline</dt>
                      <dd className="text-gray-900">{deadline?.date}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Views</dt>
                    <dd className="text-lg font-semibold text-gray-900">{sponsorship.viewCount}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Interested Businesses</dt>
                    <dd className="text-lg font-semibold text-green-600">
                      {sponsorship.interestedBusinesses.length}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Contact Section for Businesses */}
            {!isOwner && isBusiness && user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Interested in Sponsoring?
                </h3>
                <p className="text-blue-800 mb-4">
                  Contact {sponsorship.clubName} to discuss this sponsorship opportunity.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/messages/new?to=${sponsorship.clubId}&subject=${encodeURIComponent(`Re: ${sponsorship.title}`)}`}
                    className="btn-primary text-center"
                  >
                    Send Message
                  </Link>
                  <Link
                    href={`/messages/new?to=${sponsorship.clubId}&subject=${encodeURIComponent(`More info needed: ${sponsorship.title}`)}`}
                    className="btn-secondary text-center"
                  >
                    Request More Info
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}