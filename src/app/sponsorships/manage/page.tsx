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

  // Redirect if not a club
  if (userData && userData.type !== 'club') {
    router.push('/dashboard');
    return null;
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  useEffect(() => {
    if (!user) return;

    // Check if we're in demo mode
    const demoUser = localStorage.getItem('sponsorconnect_user');
    
    if (demoUser) {
      // Demo mode: load from localStorage
      const loadDemoRequests = () => {
        try {
          const existingRequests = JSON.parse(localStorage.getItem('sponsorconnect_requests') || '[]');
          setSponsorships(existingRequests);
          setLoading(false);
        } catch (error) {
          console.error('Error loading demo requests:', error);
          setSponsorships([]);
          setLoading(false);
        }
      };
      
      loadDemoRequests();
    } else {
      // Real Firebase mode
      const q = query(
        collection(db, 'sponsorships'),
        where('clubId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const sponsorshipsList: Sponsorship[] = [];
        querySnapshot.forEach((doc) => {
          sponsorshipsList.push({
            id: doc.id,
            ...doc.data()
          } as Sponsorship);
        });
        setSponsorships(sponsorshipsList);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching sponsorships:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sponsorship request?')) {
      return;
    }

    setDeleting(id);
    
    try {
      // Check if we're in demo mode
      const demoUser = localStorage.getItem('sponsorconnect_user');
      
      if (demoUser) {
        // Demo mode: remove from localStorage
        const existingRequests = JSON.parse(localStorage.getItem('sponsorconnect_requests') || '[]');
        const updatedRequests = existingRequests.filter((req: any) => req.id !== id);
        localStorage.setItem('sponsorconnect_requests', JSON.stringify(updatedRequests));
        
        // Update local state
        setSponsorships(updatedRequests);
      } else {
        // Real Firebase mode
        await deleteDoc(doc(db, 'sponsorships', id));
      }
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

  const formatDeadline = (deadline: string) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-600' };
    if (diffDays === 0) return { text: 'Today', color: 'text-red-600' };
    if (diffDays === 1) return { text: '1 day left', color: 'text-yellow-600' };
    if (diffDays <= 7) return { text: `${diffDays} days left`, color: 'text-yellow-600' };
    return { text: `${diffDays} days left`, color: 'text-gray-600' };
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Sponsorship Requests</h1>
          <p className="mt-2 text-gray-600">
            Manage your active sponsorship requests and track their performance.
          </p>
          {typeof window !== 'undefined' && localStorage.getItem('sponsorconnect_user') && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700">
                <strong>Demo Mode:</strong> Your sponsorship requests are stored locally for demonstration purposes while Firebase connection issues are being resolved.
              </p>
            </div>
          )}
        </div>

        {sponsorships.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                No Sponsorship Requests Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first sponsorship request to start attracting local business sponsors.
              </p>
              <Link href="/sponsorships/create" className="btn-primary">
                Create Your First Request
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {sponsorships.map((sponsorship) => {
              const deadline = sponsorship.deadline ? formatDeadline(sponsorship.deadline) : null;
              
              return (
                <div key={sponsorship.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {sponsorship.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[sponsorship.status]}`}>
                          {sponsorship.status.charAt(0).toUpperCase() + sponsorship.status.slice(1)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${URGENCY_STYLES[sponsorship.urgency]}`}>
                          {sponsorship.urgency === 'low' ? 'Not Urgent' : 
                           sponsorship.urgency === 'medium' ? 'Moderate' : 'Urgent'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className="font-medium">£{sponsorship.amount.toLocaleString()}</span>
                        <span>•</span>
                        <span>{CATEGORY_LABELS[sponsorship.category]}</span>
                        <span>•</span>
                        <span>{sponsorship.viewCount} views</span>
                        {sponsorship.interestedBusinesses.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-medium">
                              {sponsorship.interestedBusinesses.length} interested
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-gray-700 mb-3 line-clamp-2">
                        {sponsorship.description}
                      </p>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Created {formatDate(sponsorship.createdAt)}</span>
                        {deadline && (
                          <>
                            <span>•</span>
                            <span className={deadline.color}>
                              {deadline.text}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row lg:flex-col space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-0 lg:space-y-2">
                      <Link
                        href={`/sponsorships/${sponsorship.id}`}
                        className="btn-primary text-center text-sm"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/sponsorships/${sponsorship.id}/edit`}
                        className="btn-secondary text-center text-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(sponsorship.id)}
                        disabled={deleting === sponsorship.id}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      >
                        {deleting === sponsorship.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sponsorships.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/sponsorships/create"
              className="btn-primary"
            >
              Create Another Request
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}