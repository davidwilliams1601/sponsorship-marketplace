'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

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
  general: 'General Support',
};

export default function InterestedSponsorshipsPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (userData && userData.type !== 'business') {
      router.push('/dashboard');
      return;
    }
  }, [user, userData, router]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'sponsorships'),
      where('interestedBusinesses', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const list: Sponsorship[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Sponsorship);
      });
      setSponsorships(list);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching interested sponsorships:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-GB');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Interests</h1>
          <p className="mt-2 text-gray-600">
            Sponsorship requests you&apos;ve shown interest in.
          </p>
        </div>

        {sponsorships.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              No interests yet
            </h3>
            <p className="text-gray-600 mb-6">
              Browse sponsorship requests and click &ldquo;Show Interest&rdquo; to track them here.
            </p>
            <Link href="/browse" className="btn-primary">
              Browse Opportunities
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {sponsorships.map((sponsorship) => (
              <div key={sponsorship.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {sponsorship.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        sponsorship.urgency === 'high' ? 'bg-red-100 text-red-800' :
                        sponsorship.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {sponsorship.urgency === 'low' ? 'Not Urgent' :
                         sponsorship.urgency === 'medium' ? 'Moderate' : 'Urgent'}
                      </span>
                    </div>

                    <p className="text-gray-500 text-sm mb-2">by {sponsorship.clubName}</p>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
                      <span className="font-semibold text-gray-900 text-base">
                        £{sponsorship.amount.toLocaleString()}
                      </span>
                      <span>•</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                        {CATEGORY_LABELS[sponsorship.category] ?? sponsorship.category}
                      </span>
                      {sponsorship.location && (
                        <>
                          <span>•</span>
                          <span>{sponsorship.location}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Posted {formatDate(sponsorship.createdAt)}</span>
                    </div>

                    <p className="text-gray-700 line-clamp-2">{sponsorship.description}</p>
                  </div>

                  <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col space-y-2">
                    <Link
                      href={`/sponsor/${sponsorship.id}`}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-center text-sm transition-colors"
                    >
                      💳 Sponsor Now
                    </Link>
                    <Link
                      href={`/sponsorships/${sponsorship.id}`}
                      className="btn-secondary text-center text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
