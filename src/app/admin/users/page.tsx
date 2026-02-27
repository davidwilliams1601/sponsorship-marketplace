'use client';

import { useState, useEffect, useRef } from 'react';
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
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
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

interface UserDetail extends User {
  contactEmail?: string;
  phone?: string;
  website?: string;
  address?: string;
  description?: string;
  businessType?: string;
  industry?: string;
  sponsorshipBudget?: number;
  sponsorshipInterests?: string[];
  clubType?: string;
  foundedYear?: number;
  memberCount?: number;
  ageGroups?: string[];
  achievements?: string;
}

interface EmailLogEntry {
  subject: string;
  sentAt: any;
}

export default function AdminUsersPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: 'all', status: 'all', search: '' });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    clubs: 0,
    businesses: 0,
    admins: 0,
  });

  // Detail modal state
  const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Email logs: userId -> list of sends
  const [emailLogsMap, setEmailLogsMap] = useState<Map<string, EmailLogEntry[]>>(new Map());

  // Email state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<User[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailPreviewMode, setEmailPreviewMode] = useState(false);
  const [lastFocused, setLastFocused] = useState<'subject' | 'body'>('body');
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ success?: string; error?: string } | null>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

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
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const usersSnapshot = await getDocs(usersQuery);

        const usersList: User[] = [];
        let totalUsers = 0, activeUsers = 0, clubs = 0, businesses = 0, admins = 0;

        usersSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const u: User = {
            id: docSnap.id,
            name: data.name || 'Unknown',
            email: data.email || '',
            type: data.type || 'club',
            createdAt: data.createdAt,
            lastLoginAt: data.lastLoginAt,
            isActive: data.isActive !== false,
            profileComplete: data.profileComplete || false,
            location: data.location,
          };
          usersList.push(u);
          totalUsers++;
          if (u.isActive) activeUsers++;
          if (u.type === 'club') clubs++;
          if (u.type === 'business') businesses++;
          if (u.type === 'admin') admins++;
        });

        setUsers(usersList);
        setStats({ totalUsers, activeUsers, clubs, businesses, admins });

        const sponsorshipsSnapshot = await getDocs(query(collection(db, 'sponsorships')));
        const agreementsSnapshot = await getDocs(query(collection(db, 'agreements')));

        const userStatsMap = new Map();

        sponsorshipsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const clubId = data.clubId;
          if (!userStatsMap.has(clubId)) userStatsMap.set(clubId, { sponsorshipsCreated: 0, totalRaised: 0 });
          userStatsMap.get(clubId).sponsorshipsCreated++;
        });

        agreementsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const businessId = data.businessId;
          const clubId = data.clubId;
          if (!userStatsMap.has(businessId)) userStatsMap.set(businessId, { sponsorshipsFunded: 0, totalSpent: 0 });
          if (!userStatsMap.has(clubId)) userStatsMap.set(clubId, { sponsorshipsCreated: 0, totalRaised: 0 });
          userStatsMap.get(businessId).sponsorshipsFunded++;
          userStatsMap.get(businessId).totalSpent =
            (userStatsMap.get(businessId).totalSpent || 0) + (data.amount || 0);
          userStatsMap.get(clubId).totalRaised =
            (userStatsMap.get(clubId).totalRaised || 0) + (data.clubAmount || 0);
        });

        setUsers(usersList.map((u) => ({ ...u, ...userStatsMap.get(u.id) })));

        // Fetch email logs
        try {
          const logsSnapshot = await getDocs(query(collection(db, 'emailLogs'), orderBy('sentAt', 'desc')));
          const logsMap = new Map<string, EmailLogEntry[]>();
          logsSnapshot.forEach((logDoc) => {
            const logData = logDoc.data();
            const entry: EmailLogEntry = { subject: logData.subject, sentAt: logData.sentAt };
            (logData.recipients || []).forEach((r: any) => {
              if (!logsMap.has(r.id)) logsMap.set(r.id, []);
              logsMap.get(r.id)!.push(entry);
            });
          });
          setEmailLogsMap(logsMap);
        } catch {
          // Non-fatal
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && userData?.type === 'admin') fetchUsers();
  }, [user, userData]);

  useEffect(() => {
    setFilteredUsers(
      users.filter((u) => {
        if (filter.type !== 'all' && u.type !== filter.type) return false;
        if (filter.status === 'active' && !u.isActive) return false;
        if (filter.status === 'inactive' && u.isActive) return false;
        if (filter.search) {
          const s = filter.search.toLowerCase();
          return (
            u.name.toLowerCase().includes(s) ||
            u.email.toLowerCase().includes(s) ||
            (u.location?.toLowerCase().includes(s) ?? false)
          );
        }
        return true;
      })
    );
  }, [users, filter]);

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isActive: !currentStatus });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: !currentStatus } : u)));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to promote this user to admin? This will give them full administrative privileges.'
      )
    )
      return;
    try {
      await updateDoc(doc(db, 'users', userId), { type: 'admin' });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, type: 'admin' as any } : u)));
    } catch (error) {
      console.error('Error promoting user to admin:', error);
    }
  };

  const handleViewDetails = async (userId: string) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    setDetailUser(null);
    try {
      const docSnap = await getDoc(doc(db, 'users', userId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDetailUser({
          id: docSnap.id,
          name: data.name || 'Unknown',
          email: data.email || '',
          type: data.type || 'club',
          createdAt: data.createdAt,
          lastLoginAt: data.lastLoginAt,
          isActive: data.isActive !== false,
          profileComplete: data.profileComplete || false,
          location: data.location,
          contactEmail: data.contactEmail,
          phone: data.phone,
          website: data.website,
          address: data.address,
          description: data.description,
          businessType: data.businessType,
          industry: data.industry,
          sponsorshipBudget: data.sponsorshipBudget,
          sponsorshipInterests: data.sponsorshipInterests,
          clubType: data.clubType,
          foundedYear: data.foundedYear,
          memberCount: data.memberCount,
          ageGroups: data.ageGroups,
          achievements: data.achievements,
        });
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(userId) : next.delete(userId);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedUserIds(checked ? new Set(filteredUsers.map((u) => u.id)) : new Set());
  };

  const handleOpenEmailForUser = (u: User) => {
    setEmailRecipients([u]);
    setEmailSubject('');
    setEmailBody('');
    setEmailPreviewMode(false);
    setEmailResult(null);
    setShowEmailModal(true);
  };

  const handleOpenEmailForSelected = () => {
    setEmailRecipients(filteredUsers.filter((u) => selectedUserIds.has(u.id)));
    setEmailSubject('');
    setEmailBody('');
    setEmailPreviewMode(false);
    setEmailResult(null);
    setShowEmailModal(true);
  };

  const insertMergeTag = (tag: string) => {
    if (lastFocused === 'subject' && subjectInputRef.current) {
      const el = subjectInputRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const newVal = el.value.slice(0, start) + tag + el.value.slice(end);
      setEmailSubject(newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else if (bodyTextareaRef.current) {
      const el = bodyTextareaRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const newVal = el.value.slice(0, start) + tag + el.value.slice(end);
      setEmailBody(newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    }
  };

  const renderPreview = (template: string, recipient: User): string =>
    template
      .replace(/\{\{name\}\}/g, recipient.name || '')
      .replace(/\{\{email\}\}/g, recipient.email || '')
      .replace(/\{\{type\}\}/g, recipient.type || '')
      .replace(/\{\{location\}\}/g, recipient.location || '')
      .replace(
        /\{\{contactEmail\}\}/g,
        (recipient as UserDetail).contactEmail || recipient.email || ''
      );

  const handleSendEmail = async () => {
    if (!user) return;
    setEmailSending(true);
    setEmailResult(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipients: emailRecipients.map((r) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            type: r.type,
            location: r.location || '',
            contactEmail: (r as UserDetail).contactEmail || r.email,
          })),
          subjectTemplate: emailSubject,
          bodyTemplate: emailBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailResult({ error: data.error || 'Failed to send emails' });
      } else {
        setEmailResult({ success: `Sent ${data.sent} of ${data.total} emails successfully.` });
      }
    } catch {
      setEmailResult({ error: 'Network error. Please try again.' });
    } finally {
      setEmailSending(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'club': return 'bg-blue-100 text-blue-800';
      case 'business': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const allSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.has(u.id));

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
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link href="/admin/sponsorships" className="text-gray-600 hover:text-gray-900">Sponsorships</Link>
              <Link href="/admin/payments" className="text-gray-600 hover:text-gray-900">Payments</Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Exit Admin</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">Manage all users on the SponsorConnect platform.</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">🏟️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Clubs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.clubs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">🏢</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Businesses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.businesses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">👑</span>
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
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
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
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
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
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredUsers.length} User{filteredUsers.length !== 1 ? 's' : ''}
            </h2>
            {selectedUserIds.size > 0 && (
              <button
                onClick={handleOpenEmailForSelected}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
              >
                Email Selected ({selectedUserIds.size})
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                    />
                  </th>
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
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-gray-50 ${selectedUserIds.has(u.id) ? 'bg-indigo-50' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(u.id)}
                        onChange={(e) => handleSelectUser(u.id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{u.name}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                          {u.location && <div className="text-xs text-gray-400">{u.location}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(u.type)}`}
                      >
                        {u.type.charAt(0).toUpperCase() + u.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Joined {formatDate(u.createdAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Last login {formatDate(u.lastLoginAt)}
                        </div>
                        {emailLogsMap.has(u.id) && (
                          <div className="text-xs text-indigo-600 mt-1">
                            Emailed {formatDate(emailLogsMap.get(u.id)![0].sentAt)} ({emailLogsMap.get(u.id)!.length}x)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.type === 'club' && (
                        <div>
                          <div>{u.sponsorshipsCreated || 0} sponsorships</div>
                          <div>£{(u.totalRaised || 0).toLocaleString()} raised</div>
                        </div>
                      )}
                      {u.type === 'business' && (
                        <div>
                          <div>{u.sponsorshipsFunded || 0} sponsored</div>
                          <div>£{(u.totalSpent || 0).toLocaleString()} spent</div>
                        </div>
                      )}
                      {u.type === 'admin' && <div className="text-purple-600">Admin User</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => handleViewDetails(u.id)}
                          className="px-3 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleOpenEmailForUser(u)}
                          className="px-3 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                        >
                          Email
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            u.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        {u.type !== 'admin' && (
                          <button
                            onClick={() => handlePromoteToAdmin(u.id)}
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

      {/* ── User Detail Modal ── */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {detailLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            )}

            {!detailLoading && detailUser && (
              <div className="p-6 space-y-6">
                {/* Identity */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Identity
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">{detailUser.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(detailUser.type)}`}
                      >
                        {detailUser.type.charAt(0).toUpperCase() + detailUser.type.slice(1)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          detailUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {detailUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Profile Complete</p>
                      <p className="text-sm text-gray-900">{detailUser.profileComplete ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </section>

                <hr className="border-gray-200" />

                {/* Contact & Location */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Contact &amp; Location
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{detailUser.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Contact Email</p>
                      <p className="text-sm text-gray-900">{detailUser.contactEmail || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900">{detailUser.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Website</p>
                      <p className="text-sm text-gray-900">{detailUser.website || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm text-gray-900">{detailUser.location || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm text-gray-900">{detailUser.address || '—'}</p>
                    </div>
                  </div>
                </section>

                <hr className="border-gray-200" />

                {/* Description */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Description
                  </h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {detailUser.description || '—'}
                  </p>
                </section>

                {/* Business Details */}
                {detailUser.type === 'business' && (
                  <>
                    <hr className="border-gray-200" />
                    <section>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Business Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Business Type</p>
                          <p className="text-sm text-gray-900">{detailUser.businessType || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Industry</p>
                          <p className="text-sm text-gray-900">{detailUser.industry || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Sponsorship Budget</p>
                          <p className="text-sm text-gray-900">
                            {detailUser.sponsorshipBudget != null
                              ? `£${detailUser.sponsorshipBudget.toLocaleString()}`
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Sponsorship Interests</p>
                          <p className="text-sm text-gray-900">
                            {detailUser.sponsorshipInterests?.join(', ') || '—'}
                          </p>
                        </div>
                      </div>
                    </section>
                  </>
                )}

                {/* Club Details */}
                {detailUser.type === 'club' && (
                  <>
                    <hr className="border-gray-200" />
                    <section>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Club Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Club Type</p>
                          <p className="text-sm text-gray-900">{detailUser.clubType || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Founded Year</p>
                          <p className="text-sm text-gray-900">{detailUser.foundedYear || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Member Count</p>
                          <p className="text-sm text-gray-900">{detailUser.memberCount ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Age Groups</p>
                          <p className="text-sm text-gray-900">
                            {detailUser.ageGroups?.join(', ') || '—'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Achievements</p>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {detailUser.achievements || '—'}
                          </p>
                        </div>
                      </div>
                    </section>
                  </>
                )}

                {/* Account */}
                <hr className="border-gray-200" />
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Account
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">User ID</p>
                      <p className="text-xs font-mono text-gray-700 break-all">{detailUser.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Joined</p>
                      <p className="text-sm text-gray-900">{formatDate(detailUser.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last Login</p>
                      <p className="text-sm text-gray-900">{formatDate(detailUser.lastLoginAt)}</p>
                    </div>
                  </div>
                </section>

                {/* Email History */}
                {emailLogsMap.has(detailUser.id) && (
                  <>
                    <hr className="border-gray-200" />
                    <section>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Email History ({emailLogsMap.get(detailUser.id)!.length} sent)
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {emailLogsMap.get(detailUser.id)!.map((log, i) => (
                          <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                            <span className="text-gray-900 truncate flex-1 mr-4">{log.subject}</span>
                            <span className="text-xs text-gray-500 shrink-0">{formatDate(log.sentAt)}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </div>
            )}

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Email Compose Modal ── */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Compose Email</h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Recipients */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  To: {emailRecipients.length} recipient{emailRecipients.length !== 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {emailRecipients.map((r) => (
                    <span
                      key={r.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {r.name} &lt;{r.email}&gt;
                    </span>
                  ))}
                </div>
              </div>

              {/* Compose / Preview tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setEmailPreviewMode(false)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                    !emailPreviewMode
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Compose
                </button>
                <button
                  onClick={() => setEmailPreviewMode(true)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                    emailPreviewMode
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Preview
                </button>
              </div>

              {!emailPreviewMode ? (
                <>
                  {/* Merge tag toolbar */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">
                      Insert merge tag (click to insert at cursor):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['{{name}}', '{{email}}', '{{type}}', '{{location}}', '{{contactEmail}}'].map(
                        (tag) => (
                          <button
                            key={tag}
                            onClick={() => insertMergeTag(tag)}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-mono"
                          >
                            {tag}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      ref={subjectInputRef}
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      onFocus={() => setLastFocused('subject')}
                      placeholder="Email subject..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                    <textarea
                      ref={bodyTextareaRef}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      onFocus={() => setLastFocused('body')}
                      rows={8}
                      placeholder="Email body..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              ) : (
                /* Preview mode */
                <div>
                  {emailRecipients.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500">
                        Preview for: {emailRecipients[0].name}
                      </p>
                      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-900 mb-3">
                          Subject:{' '}
                          {renderPreview(emailSubject, emailRecipients[0]) || (
                            <span className="text-gray-400 italic">No subject</span>
                          )}
                        </p>
                        <hr className="border-gray-200 mb-3" />
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {renderPreview(emailBody, emailRecipients[0]) || (
                            <span className="text-gray-400 italic">No body</span>
                          )}
                        </p>
                      </div>
                      {emailRecipients.length > 1 && (
                        <p className="text-xs text-gray-400">
                          + {emailRecipients.length - 1} more recipient
                          {emailRecipients.length - 1 !== 1 ? 's' : ''} (each will receive a
                          personalised version)
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No recipients selected.</p>
                  )}
                </div>
              )}

              {/* Result feedback */}
              {emailResult?.success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                  {emailResult.success}
                </div>
              )}
              {emailResult?.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  {emailResult.error}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={
                  !emailSubject.trim() ||
                  !emailBody.trim() ||
                  emailSending ||
                  !!emailResult?.success
                }
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailSending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
