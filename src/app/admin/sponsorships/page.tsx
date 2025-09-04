'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit,
  where,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface Sponsorship {
  id: string;
  title: string;
  description: string;
  category: string;
  amount: number;
  urgency: 'low' | 'medium' | 'high';
  status: 'active' | 'funded' | 'paused' | 'expired';
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

const STATUS_COLORS: { [key: string]: string } = {
  active: 'bg-blue-100 text-blue-800',
  funded: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-100 text-red-800'
};

const URGENCY_COLORS: { [key: string]: string } = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

export default function AdminSponsorshipsPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [filteredSponsorships, setFilteredSponsorships] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    category: 'all',
    urgency: 'all',
    search: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    funded: 0,
    paused: 0,
    expired: 0,
    totalValue: 0,
    avgAmount: 0
  });

  // Redirect if not admin
  if (userData && userData.type !== 'admin') {
    router.push('/dashboard');
    return null;
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  useEffect(() => {
    const fetchSponsorships = async () => {
      try {
        const sponsorshipsQuery = query(
          collection(db, 'sponsorships'),
          orderBy('createdAt', 'desc')
        );
        const sponsorshipsSnapshot = await getDocs(sponsorshipsQuery);
        
        const sponsorshipsList: Sponsorship[] = [];
        let total = 0;
        let active = 0;
        let funded = 0;
        let paused = 0;
        let expired = 0;
        let totalValue = 0;

        sponsorshipsSnapshot.forEach((doc) => {
          const sponsorshipData = doc.data();
          const sponsorship: Sponsorship = {
            id: doc.id,
            title: sponsorshipData.title || 'Untitled',
            description: sponsorshipData.description || '',
            category: sponsorshipData.category || 'general',
            amount: sponsorshipData.amount || 0,
            urgency: sponsorshipData.urgency || 'medium',
            status: sponsorshipData.status || 'active',
            createdAt: sponsorshipData.createdAt,
            deadline: sponsorshipData.deadline,
            benefits: sponsorshipData.benefits,
            location: sponsorshipData.location,
            viewCount: sponsorshipData.viewCount || 0,
            interestedBusinesses: sponsorshipData.interestedBusinesses || [],
            clubId: sponsorshipData.clubId || '',
            clubName: sponsorshipData.clubName || 'Unknown Club'
          };
          
          sponsorshipsList.push(sponsorship);
          total++;
          totalValue += sponsorship.amount;
          
          switch (sponsorship.status) {
            case 'active':
              active++;
              break;
            case 'funded':
              funded++;
              break;
            case 'paused':
              paused++;
              break;
            case 'expired':
              expired++;
              break;
          }
        });

        setSponsorships(sponsorshipsList);
        setStats({
          total,
          active,
          funded,
          paused,
          expired,
          totalValue,
          avgAmount: total > 0 ? totalValue / total : 0
        });

      } catch (error) {
        console.error('Error fetching sponsorships:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && userData?.type === 'admin') {
      fetchSponsorships();
    }
  }, [user, userData]);

  useEffect(() => {
    let filtered = sponsorships.filter(sponsorship => {
      // Status filter
      if (filter.status !== 'all' && sponsorship.status !== filter.status) {
        return false;
      }

      // Category filter
      if (filter.category !== 'all' && sponsorship.category !== filter.category) {
        return false;
      }

      // Urgency filter
      if (filter.urgency !== 'all' && sponsorship.urgency !== filter.urgency) {
        return false;
      }

      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        return sponsorship.title.toLowerCase().includes(searchLower) ||
               sponsorship.clubName.toLowerCase().includes(searchLower) ||
               sponsorship.description.toLowerCase().includes(searchLower) ||
               (sponsorship.location && sponsorship.location.toLowerCase().includes(searchLower));
      }

      return true;
    });

    setFilteredSponsorships(filtered);
  }, [sponsorships, filter]);

  const handleUpdateStatus = async (sponsorshipId: string, newStatus: string) => {
    try {
      const sponsorshipRef = doc(db, 'sponsorships', sponsorshipId);
      await updateDoc(sponsorshipRef, {
        status: newStatus
      });

      setSponsorships(sponsorships.map(sponsorship => 
        sponsorship.id === sponsorshipId 
          ? { ...sponsorship, status: newStatus as any }
          : sponsorship
      ));
    } catch (error) {
      console.error('Error updating sponsorship status:', error);
    }
  };

  const handleDeleteSponsorship = async (sponsorshipId: string) => {
    if (!window.confirm('Are you sure you want to delete this sponsorship? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'sponsorships', sponsorshipId));
      setSponsorships(sponsorships.filter(sponsorship => sponsorship.id !== sponsorshipId));
    } catch (error) {
      console.error('Error deleting sponsorship:', error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  const formatDeadline = (deadline: string | undefined) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-600', urgent: true };
    if (diffDays === 0) return { text: 'Today', color: 'text-red-600', urgent: true };
    if (diffDays <= 7) return { text: `${diffDays}d left`, color: 'text-yellow-600', urgent: true };
    return { text: `${diffDays}d left`, color: 'text-gray-600', urgent: false };
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
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-2xl font-bold text-blue-600">
                SponsorConnect Admin
              </Link>
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                Sponsorship Management
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/admin/users" className="text-gray-600 hover:text-gray-900">
                Users
              </Link>
              <Link href="/admin/payments" className="text-gray-600 hover:text-gray-900">
                Payments
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Exit Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sponsorship Management</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage all sponsorship requests on the platform.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🔵</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Funded</p>
                <p className="text-2xl font-bold text-gray-900">{stats.funded}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⏸️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Paused</p>
                <p className="text-2xl font-bold text-gray-900">{stats.paused}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">❌</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Expired</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="text-lg font-bold text-gray-900">£{stats.totalValue.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Avg: £{Math.round(stats.avgAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="funded">Funded</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filter.category}
                onChange={(e) => setFilter({...filter, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
              <select
                value={filter.urgency}
                onChange={(e) => setFilter({...filter, urgency: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Urgency</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search sponsorships, clubs, or locations..."
                value={filter.search}
                onChange={(e) => setFilter({...filter, search: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Sponsorships List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredSponsorships.length} Sponsorship{filteredSponsorships.length !== 1 ? 's' : ''}
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredSponsorships.map((sponsorship) => {
              const deadline = formatDeadline(sponsorship.deadline);
              
              return (
                <div key={sponsorship.id} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Link
                          href={`/sponsorships/${sponsorship.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {sponsorship.title}
                        </Link>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[sponsorship.status]}`}>
                          {sponsorship.status.charAt(0).toUpperCase() + sponsorship.status.slice(1)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${URGENCY_COLORS[sponsorship.urgency]}`}>
                          {sponsorship.urgency.charAt(0).toUpperCase() + sponsorship.urgency.slice(1)}
                        </span>
                        {deadline && deadline.urgent && (
                          <span className={`text-xs font-medium ${deadline.color}`}>
                            {deadline.text}
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 mb-2">by {sponsorship.clubName}</p>

                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
                        <span className="font-medium text-lg text-gray-900">£{sponsorship.amount.toLocaleString()}</span>
                        <span>•</span>
                        <span>{CATEGORY_LABELS[sponsorship.category]}</span>
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
                      </div>
                    </div>

                    <div className="mt-4 lg:mt-0 lg:ml-6">
                      <div className="flex flex-col space-y-2">
                        <select
                          value={sponsorship.status}
                          onChange={(e) => handleUpdateStatus(sponsorship.id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="active">Active</option>
                          <option value="funded">Funded</option>
                          <option value="paused">Paused</option>
                          <option value="expired">Expired</option>
                        </select>
                        
                        <div className="flex space-x-2">
                          <Link
                            href={`/sponsorships/${sponsorship.id}`}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDeleteSponsorship(sponsorship.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSponsorships.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <p className="text-lg font-medium mb-2">No sponsorships found</p>
                <p>Try adjusting your search filters.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}