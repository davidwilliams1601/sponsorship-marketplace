'use client';
// Manage sponsorship requests page

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
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

const URGENCY_STYLES: { [key: string]: string } = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

const STATUS_STYLES: { [key: string]: string } = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-blue-100 text-blue-800',
  funded: 'bg-green-100 text-green-800',
  paused: 'bg-gray-100 text-gray-800',
  expired: 'bg-red-100 text-red-800'
};

export default function ManageSponsorshipsPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    console.log('=== MANAGE PAGE LOADING SPONSORSHIPS ===');
    console.log('User:', user ? { uid: user.uid, email: user.email } : null);

    try {
      const q = query(
        collection(db, 'sponsorships'),
        where('clubId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log('Firebase query returned:', querySnapshot.size, 'sponsorships');
        const sponsorshipsList: Sponsorship[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Found sponsorship:', doc.id, data.title);
          sponsorshipsList.push({
            id: doc.id,
            ...data
          } as Sponsorship);
        });

        console.log('Final sponsorships list:', sponsorshipsList);
        setSponsorships(sponsorshipsList);
        setLoading(false);
      }, (error) => {
        console.error('=== FIREBASE QUERY ERROR ===');
        console.error('Error details:', error);
        setSponsorships([]);
        setLoading(false);
      });

      return () => unsubscribe();

    } catch (queryError) {
      console.error('=== FIREBASE QUERY SETUP ERROR ===');
      console.error('Query creation failed:', queryError);
      setSponsorships([]);
      setLoading(false);
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sponsorship request?')) {
      return;
    }

    setDeleting(id);

    try {
      await deleteDoc(doc(db, 'sponsorships', id));
      console.log('Sponsorship deleted successfully');
    } catch (error) {
      console.error('Error deleting sponsorship:', error);
      alert('Failed to delete sponsorship request');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  if (!userData || userData.type !== 'club') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">This page is only available to sports clubs.</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Sponsorship Requests</h1>
          <p className="mt-2 text-gray-600">
            Manage your active sponsorship requests and track their performance.
          </p>
        </div>

        {/* Create New Button */}
        <div className="mb-6">
          <Link
            href="/sponsorships/create"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + Create New Request
          </Link>
        </div>

        {/* Sponsorships List */}
        {sponsorships.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              No sponsorship requests yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first sponsorship request to start connecting with local businesses.
            </p>
            <Link
              href="/sponsorships/create"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Create Your First Request
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {sponsorships.map((sponsorship) => (
              <div key={sponsorship.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {sponsorship.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span className="font-medium text-lg text-gray-900">
                        £{sponsorship.amount.toLocaleString()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_LABELS[sponsorship.category]}`}>
                        {CATEGORY_LABELS[sponsorship.category]}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${URGENCY_STYLES[sponsorship.urgency]}`}>
                        {sponsorship.urgency === 'low' ? 'Not Urgent' :
                         sponsorship.urgency === 'medium' ? 'Moderate' : 'Urgent'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[sponsorship.status]}`}>
                        {sponsorship.status.charAt(0).toUpperCase() + sponsorship.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3 line-clamp-2">
                      {sponsorship.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Posted {formatDate(sponsorship.createdAt)}</span>
                      <span>•</span>
                      <span>{sponsorship.viewCount || 0} views</span>
                      <span>•</span>
                      <span>{sponsorship.interestedBusinesses?.length || 0} interested</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-6">
                    <Link
                      href={`/sponsorships/${sponsorship.id}`}
                      className="btn-secondary text-center text-sm"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleDelete(sponsorship.id)}
                      disabled={deleting === sponsorship.id}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      {deleting === sponsorship.id ? 'Deleting...' : 'Delete'}
                    </button>
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