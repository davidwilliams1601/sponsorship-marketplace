'use client';
// Browse sponsorship opportunities page

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
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
  all: 'All Categories'
};

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'amount_desc', label: 'Highest Amount' },
  { id: 'amount_asc', label: 'Lowest Amount' },
  { id: 'deadline', label: 'Deadline Soon' },
  { id: 'popular', label: 'Most Popular' }
];

export default function BrowsePage() {
  const { user, userData } = useAuth();
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [filteredSponsorships, setFilteredSponsorships] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    maxAmount: '',
    location: '',
    urgency: 'all',
    sort: 'newest'
  });

  useEffect(() => {
    // Check if we're in demo mode (localStorage user exists)
    const demoUser = localStorage.getItem('sponsorconnect_user');
    
    if (demoUser) {
      // Demo mode: use mock data
      const mockSponsorships: Sponsorship[] = [
        {
          id: 'demo1',
          title: 'New Football Kit Sponsorship',
          description: 'Our local football club needs sponsorship for new team kits for the upcoming season. We have 25 players who need quality jerseys and shorts.',
          category: 'equipment',
          amount: 2500,
          urgency: 'high',
          status: 'active',
          createdAt: { seconds: Date.now() / 1000 - 86400 * 2 }, // 2 days ago
          deadline: new Date(Date.now() + 86400 * 14000).toISOString(), // 2 weeks from now
          location: 'Manchester',
          viewCount: 45,
          interestedBusinesses: [],
          clubId: 'club1',
          clubName: 'Manchester United FC Youth'
        },
        {
          id: 'demo2',
          title: 'Tennis Court Maintenance Fund',
          description: 'Our tennis club courts need resurfacing and net replacement. This will benefit our 50+ members and local community.',
          category: 'facility',
          amount: 5000,
          urgency: 'medium',
          status: 'active',
          createdAt: { seconds: Date.now() / 1000 - 86400 * 5 }, // 5 days ago
          location: 'Birmingham',
          viewCount: 23,
          interestedBusinesses: [],
          clubId: 'club2',
          clubName: 'Birmingham Tennis Club'
        },
        {
          id: 'demo3',
          title: 'Youth Cricket Team Travel Support',
          description: 'Our under-16 cricket team has qualified for regional championships and needs travel support for accommodation and transport.',
          category: 'travel',
          amount: 1200,
          urgency: 'high',
          status: 'active',
          createdAt: { seconds: Date.now() / 1000 - 86400 * 1 }, // 1 day ago
          deadline: new Date(Date.now() + 86400 * 7000).toISOString(), // 1 week from now
          location: 'London',
          viewCount: 67,
          interestedBusinesses: ['demo_business1'],
          clubId: 'club3',
          clubName: 'London Youth Cricket'
        },
        {
          id: 'demo4',
          title: 'Swimming Pool Equipment Upgrade',
          description: 'Our swimming club needs new lane ropes and timing equipment to host regional competitions.',
          category: 'equipment',
          amount: 3000,
          urgency: 'low',
          status: 'active',
          createdAt: { seconds: Date.now() / 1000 - 86400 * 7 }, // 1 week ago
          location: 'Liverpool',
          viewCount: 31,
          interestedBusinesses: [],
          clubId: 'club4',
          clubName: 'Liverpool Swimming Club'
        }
      ];
      
      setSponsorships(mockSponsorships);
      setLoading(false);
    } else {
      // Real Firebase mode
      const q = query(
        collection(db, 'sponsorships'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(100)
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
  }, []);

  useEffect(() => {
    // Apply filters and sorting
    let filtered = sponsorships.filter(sponsorship => {
      // Category filter
      if (filters.category !== 'all' && sponsorship.category !== filters.category) {
        return false;
      }

      // Max amount filter
      if (filters.maxAmount && sponsorship.amount > parseFloat(filters.maxAmount)) {
        return false;
      }

      // Location filter (case insensitive partial match)
      if (filters.location && sponsorship.location &&
          !sponsorship.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      // Urgency filter
      if (filters.urgency !== 'all' && sponsorship.urgency !== filters.urgency) {
        return false;
      }

      return true;
    });

    // Apply sorting
    switch (filters.sort) {
      case 'amount_desc':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount_asc':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
      case 'deadline':
        filtered.sort((a, b) => {
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
        break;
      case 'popular':
        filtered.sort((a, b) => (b.viewCount + b.interestedBusinesses.length * 3) - (a.viewCount + a.interestedBusinesses.length * 3));
        break;
      default: // newest
        filtered.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
    }

    setFilteredSponsorships(filtered);
  }, [sponsorships, filters]);

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

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Discover Sponsorship Opportunities
            </h1>
            <p className="text-xl text-blue-100">
              Support local sports clubs and build community connections
            </p>
            {typeof window !== 'undefined' && localStorage.getItem('sponsorconnect_user') && (
              <div className="mt-4 p-3 bg-blue-500 border border-blue-300 rounded-md">
                <p className="text-sm text-blue-100">
                  <strong>Demo Mode:</strong> Showing sample sponsorship opportunities while Firebase connection issues are being resolved.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>

            {/* Max Amount Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
              <input
                type="number"
                placeholder="£ Max"
                value={filters.maxAmount}
                onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                placeholder="Search location"
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Urgency Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
              <select
                value={filters.urgency}
                onChange={(e) => setFilters({...filters, urgency: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Urgencies</option>
                <option value="high">Urgent</option>
                <option value="medium">Moderate</option>
                <option value="low">Not Urgent</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sort}
                onChange={(e) => setFilters({...filters, sort: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredSponsorships.length} Sponsorship{filteredSponsorships.length !== 1 ? 's' : ''} Available
          </h2>
        </div>

        {filteredSponsorships.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                No sponsorships match your filters
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or browse all opportunities.
              </p>
              <button
                onClick={() => setFilters({
                  category: 'all',
                  maxAmount: '',
                  location: '',
                  urgency: 'all',
                  sort: 'newest'
                })}
                className="btn-primary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredSponsorships.map((sponsorship) => {
              const deadline = sponsorship.deadline ? formatDeadline(sponsorship.deadline) : null;
              const isInterested = user && sponsorship.interestedBusinesses.includes(user.uid);

              return (
                <div key={sponsorship.id} className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Link href={`/sponsorships/${sponsorship.id}`} className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                          {sponsorship.title}
                        </Link>
                        {isInterested && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-medium rounded-full">
                            Interested
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 mb-3">by {sponsorship.clubName}</p>

                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
                        <span className="font-medium text-lg text-gray-900">£{sponsorship.amount.toLocaleString()}</span>
                        <span>•</span>
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                          {CATEGORY_LABELS[sponsorship.category]}
                        </span>
                        <span>•</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sponsorship.urgency === 'high' ? 'bg-red-100 text-red-800' :
                          sponsorship.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {sponsorship.urgency === 'low' ? 'Not Urgent' : 
                           sponsorship.urgency === 'medium' ? 'Moderate' : 'Urgent'}
                        </span>
                        {sponsorship.location && (
                          <>
                            <span>•</span>
                            <span>{sponsorship.location}</span>
                          </>
                        )}
                      </div>

                      <p className="text-gray-700 mb-3 line-clamp-2">
                        {sponsorship.description}
                      </p>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Posted {formatDate(sponsorship.createdAt)}</span>
                        <span>•</span>
                        <span>{sponsorship.viewCount} views</span>
                        <span>•</span>
                        <span>{sponsorship.interestedBusinesses.length} interested</span>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}