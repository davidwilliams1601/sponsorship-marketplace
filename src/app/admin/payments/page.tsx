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
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatCurrency } from '@/lib/stripe';
import Link from 'next/link';

interface Payment {
  id: string;
  sponsorshipId: string;
  sponsorshipTitle: string;
  clubId: string;
  clubName: string;
  businessId: string;
  businessName: string;
  amount: number;
  platformFee: number;
  clubAmount: number;
  paymentIntentId: string;
  status: 'active' | 'completed' | 'disputed' | 'refunded';
  createdAt: any;
  paymentMethod?: string;
}

const STATUS_COLORS: { [key: string]: string } = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  disputed: 'bg-yellow-100 text-yellow-800',
  refunded: 'bg-red-100 text-red-800'
};

export default function AdminPaymentsPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    timeRange: 'all',
    search: ''
  });
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalRevenue: 0,
    totalFees: 0,
    averagePayment: 0,
    thisMonth: 0,
    thisWeek: 0,
    activePayments: 0,
    disputedPayments: 0
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
    const fetchPayments = async () => {
      try {
        const paymentsQuery = query(
          collection(db, 'agreements'),
          orderBy('createdAt', 'desc')
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);
        
        const paymentsList: Payment[] = [];
        let totalRevenue = 0;
        let totalFees = 0;
        let thisMonthRevenue = 0;
        let thisWeekRevenue = 0;
        let activePayments = 0;
        let disputedPayments = 0;

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        paymentsSnapshot.forEach((doc) => {
          const paymentData = doc.data();
          const payment: Payment = {
            id: doc.id,
            sponsorshipId: paymentData.sponsorshipId || '',
            sponsorshipTitle: paymentData.sponsorshipTitle || 'Unknown Sponsorship',
            clubId: paymentData.clubId || '',
            clubName: paymentData.clubName || 'Unknown Club',
            businessId: paymentData.businessId || '',
            businessName: paymentData.businessName || 'Unknown Business',
            amount: paymentData.amount || 0,
            platformFee: paymentData.platformFee || 0,
            clubAmount: paymentData.clubAmount || 0,
            paymentIntentId: paymentData.paymentIntentId || '',
            status: paymentData.status || 'active',
            createdAt: paymentData.createdAt,
            paymentMethod: paymentData.paymentMethod
          };
          
          paymentsList.push(payment);
          totalRevenue += payment.amount;
          totalFees += payment.platformFee;

          // Calculate time-based stats
          if (payment.createdAt) {
            const paymentDate = new Date(payment.createdAt.seconds * 1000);
            if (paymentDate > oneMonthAgo) {
              thisMonthRevenue += payment.amount;
            }
            if (paymentDate > oneWeekAgo) {
              thisWeekRevenue += payment.amount;
            }
          }

          // Status-based stats
          if (payment.status === 'active') activePayments++;
          if (payment.status === 'disputed') disputedPayments++;
        });

        setPayments(paymentsList);
        setStats({
          totalPayments: paymentsList.length,
          totalRevenue,
          totalFees,
          averagePayment: paymentsList.length > 0 ? totalRevenue / paymentsList.length : 0,
          thisMonth: thisMonthRevenue,
          thisWeek: thisWeekRevenue,
          activePayments,
          disputedPayments
        });

      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && userData?.type === 'admin') {
      fetchPayments();
    }
  }, [user, userData]);

  useEffect(() => {
    let filtered = payments.filter(payment => {
      // Status filter
      if (filter.status !== 'all' && payment.status !== filter.status) {
        return false;
      }

      // Time range filter
      if (filter.timeRange !== 'all' && payment.createdAt) {
        const paymentDate = new Date(payment.createdAt.seconds * 1000);
        const now = new Date();
        
        switch (filter.timeRange) {
          case 'today':
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (paymentDate < today) return false;
            break;
          case 'week':
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (paymentDate < oneWeekAgo) return false;
            break;
          case 'month':
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (paymentDate < oneMonthAgo) return false;
            break;
        }
      }

      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        return payment.sponsorshipTitle.toLowerCase().includes(searchLower) ||
               payment.clubName.toLowerCase().includes(searchLower) ||
               payment.businessName.toLowerCase().includes(searchLower) ||
               payment.paymentIntentId.toLowerCase().includes(searchLower);
      }

      return true;
    });

    setFilteredPayments(filtered);
  }, [payments, filter]);

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    try {
      const paymentRef = doc(db, 'agreements', paymentId);
      await updateDoc(paymentRef, {
        status: newStatus
      });

      setPayments(payments.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: newStatus as any }
          : payment
      ));
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                Payment Management
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/admin/users" className="text-gray-600 hover:text-gray-900">
                Users
              </Link>
              <Link href="/admin/sponsorships" className="text-gray-600 hover:text-gray-900">
                Sponsorships
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
          <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="mt-2 text-gray-600">
            Monitor all payments and agreements on the platform.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-gray-500">{stats.totalPayments} payments</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Platform Fees</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalFees)}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalRevenue > 0 ? 
                    `${((stats.totalFees / stats.totalRevenue) * 100).toFixed(1)}% of revenue` : 
                    'No fees yet'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.thisMonth)}</p>
                <p className="text-xs text-gray-500">Week: {formatCurrency(stats.thisWeek)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⚠️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Needs Attention</p>
                <p className="text-2xl font-bold text-gray-900">{stats.disputedPayments}</p>
                <p className="text-xs text-gray-500">disputed payments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="disputed">Disputed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
              <select
                value={filter.timeRange}
                onChange={(e) => setFilter({...filter, timeRange: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by sponsorship, club, business, or payment ID..."
                value={filter.search}
                onChange={(e) => setFilter({...filter, search: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredPayments.length} Payment{filteredPayments.length !== 1 ? 's' : ''}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.sponsorshipTitle}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(payment.createdAt)}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {payment.paymentIntentId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div><strong>Club:</strong> {payment.clubName}</div>
                        <div><strong>Business:</strong> {payment.businessName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-semibold">{formatCurrency(payment.amount)}</div>
                        <div className="text-xs text-gray-500">
                          Club: {formatCurrency(payment.clubAmount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Fee: {formatCurrency(payment.platformFee)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[payment.status]}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <select
                          value={payment.status}
                          onChange={(e) => handleUpdateStatus(payment.id, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="disputed">Disputed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                        
                        <Link
                          href={`/sponsorships/${payment.sponsorshipId}`}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs text-center hover:bg-blue-200"
                        >
                          View Sponsorship
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <p className="text-lg font-medium mb-2">No payments found</p>
                <p>Try adjusting your search filters.</p>
              </div>
            </div>
          )}
        </div>

        {/* Summary Section */}
        {filteredPayments.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Filtered Results</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.amount, 0))}
                </p>
                <p className="text-xs text-gray-500">
                  from {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Platform Fees (Filtered)</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.platformFee, 0))}
                </p>
                <p className="text-xs text-gray-500">
                  {filteredPayments.length > 0 ? 
                    `${((filteredPayments.reduce((sum, p) => sum + p.platformFee, 0) / filteredPayments.reduce((sum, p) => sum + p.amount, 0)) * 100).toFixed(1)}% of total` : 
                    'No fees'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Payment</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(filteredPayments.length > 0 ? filteredPayments.reduce((sum, p) => sum + p.amount, 0) / filteredPayments.length : 0)}
                </p>
                <p className="text-xs text-gray-500">per transaction</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}