'use client';

import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/guards/AuthGuard';
import Link from 'next/link';

export default function AdminDashboard() {
  const { userData, logout } = useAuth();

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-blue-600">
                  SponsorConnect
                </Link>
                <span className="ml-4 px-3 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                  Admin Panel
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {userData?.name}
                </span>
                <button
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage users, sponsorships, and platform settings
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      View and manage all platform users
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    href="/admin/users"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Manage Users
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Sponsorships</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Monitor all sponsorship activities
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    href="/admin/sponsorships"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    View Sponsorships
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Payments</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Track payments and financial data
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    href="/admin/payments"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                  >
                    View Payments
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </AuthGuard>
  );
}