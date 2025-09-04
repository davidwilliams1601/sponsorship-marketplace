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

interface User {
  id: string;
  name: string;
  email: string;
  type: 'club' | 'business' | 'admin';
  createdAt: any;
  lastLoginAt?: any;
  isActive: boolean;
  profileComplete: boolean;
  location?: string;
  sponsorshipsCreated?: number;
  sponsorshipsFunded?: number;
  totalSpent?: number;
  totalRaised?: number;
}

export default function AdminUsersPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: 'all',
    status: 'all',
    search: ''
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    clubs: 0,
    businesses: 0,
    admins: 0
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
    const fetchUsers = async () => {
      try {
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc')
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        const usersList: User[] = [];
        let totalUsers = 0;
        let activeUsers = 0;
        let clubs = 0;
        let businesses = 0;
        let admins = 0;

        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          const user: User = {
            id: doc.id,
            name: userData.name || 'Unknown',
            email: userData.email || '',
            type: userData.type || 'club',
            createdAt: userData.createdAt,
            lastLoginAt: userData.lastLoginAt,
            isActive: userData.isActive !== false,
            profileComplete: userData.profileComplete || false,
            location: userData.location
          };
          
          usersList.push(user);
          totalUsers++;
          
          if (user.isActive) activeUsers++;
          if (user.type === 'club') clubs++;
          if (user.type === 'business') businesses++;
          if (user.type === 'admin') admins++;
        });

        setUsers(usersList);
        setStats({ totalUsers, activeUsers, clubs, businesses, admins });

        // Fetch additional stats for clubs and businesses
        const sponsorshipsQuery = query(collection(db, 'sponsorships'));
        const sponsorshipsSnapshot = await getDocs(sponsorshipsQuery);
        
        const agreementsQuery = query(collection(db, 'agreements'));
        const agreementsSnapshot = await getDocs(agreementsQuery);

        // Calculate user-specific stats
        const userStatsMap = new Map();
        
        sponsorshipsSnapshot.forEach((doc) => {
          const data = doc.data();
          const clubId = data.clubId;
          if (!userStatsMap.has(clubId)) {
            userStatsMap.set(clubId, { sponsorshipsCreated: 0, totalRaised: 0 });
          }
          userStatsMap.get(clubId).sponsorshipsCreated++;
        });

        agreementsSnapshot.forEach((doc) => {
          const data = doc.data();
          const businessId = data.businessId;
          const clubId = data.clubId;
          
          if (!userStatsMap.has(businessId)) {
            userStatsMap.set(businessId, { sponsorshipsFunded: 0, totalSpent: 0 });
          }
          if (!userStatsMap.has(clubId)) {
            userStatsMap.set(clubId, { sponsorshipsCreated: 0, totalRaised: 0 });
          }
          
          userStatsMap.get(businessId).sponsorshipsFunded++;
          userStatsMap.get(businessId).totalSpent = (userStatsMap.get(businessId).totalSpent || 0) + (data.amount || 0);
          userStatsMap.get(clubId).totalRaised = (userStatsMap.get(clubId).totalRaised || 0) + (data.clubAmount || 0);
        });

        // Update users with stats
        const usersWithStats = usersList.map(user => ({
          ...user,
          ...userStatsMap.get(user.id)
        }));

        setUsers(usersWithStats);

      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && userData?.type === 'admin') {
      fetchUsers();
    }
  }, [user, userData]);

  useEffect(() => {
    let filtered = users.filter(user => {
      // Type filter
      if (filter.type !== 'all' && user.type !== filter.type) {
        return false;
      }

      // Status filter
      if (filter.status === 'active' && !user.isActive) {
        return false;
      }
      if (filter.status === 'inactive' && user.isActive) {
        return false;
      }

      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        return user.name.toLowerCase().includes(searchLower) ||
               user.email.toLowerCase().includes(searchLower) ||
               (user.location && user.location.toLowerCase().includes(searchLower));
      }

      return true;
    });

    setFilteredUsers(filtered);
  }, [users, filter]);

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: !currentStatus
      });

      setUsers(users.map(user => 
        user.id === userId ? { ...user, isActive: !currentStatus } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    if (!window.confirm('Are you sure you want to promote this user to admin? This will give them full administrative privileges.')) {
      return;
    }

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        type: 'admin'
      });

      setUsers(users.map(user => 
        user.id === userId ? { ...user, type: 'admin' as any } : user
      ));
    } catch (error) {
      console.error('Error promoting user to admin:', error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'club':
        return 'bg-blue-100 text-blue-800';
      case 'business':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
                User Management
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/admin/sponsorships" className="text-gray-600 hover:text-gray-900">
                Sponsorships
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
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage all users on the SponsorConnect platform.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
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
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🏟️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Clubs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.clubs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🏢</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Businesses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.businesses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👑</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
              <select
                value={filter.type}
                onChange={(e) => setFilter({...filter, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="club">Clubs</option>
                <option value="business">Businesses</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name, email, or location..."
                value={filter.search}
                onChange={(e) => setFilter({...filter, search: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredUsers.length} User{filteredUsers.length !== 1 ? 's' : ''}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.location && (
                            <div className="text-xs text-gray-400">{user.location}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(user.type)}`}>
                        {user.type.charAt(0).toUpperCase() + user.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Joined {formatDate(user.createdAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Last login {formatDate(user.lastLoginAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.type === 'club' && (
                        <div>
                          <div>{user.sponsorshipsCreated || 0} sponsorships</div>
                          <div>£{(user.totalRaised || 0).toLocaleString()} raised</div>
                        </div>
                      )}
                      {user.type === 'business' && (
                        <div>
                          <div>{user.sponsorshipsFunded || 0} sponsored</div>
                          <div>£{(user.totalSpent || 0).toLocaleString()} spent</div>
                        </div>
                      )}
                      {user.type === 'admin' && (
                        <div className="text-purple-600">Admin User</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            user.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        {user.type !== 'admin' && (
                          <button
                            onClick={() => handlePromoteToAdmin(user.id)}
                            className="px-3 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200"
                          >
                            Make Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <p className="text-lg font-medium mb-2">No users found</p>
                <p>Try adjusting your search filters.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}