'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function DashboardPage() {
  const { user, userData, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Your Dashboard
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              You are logged in as a <span className="font-semibold capitalize">{userData.type}</span>
            </p>
            
            {!userData.profileCompleted && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-8">
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">Complete your profile to get started!</p>
                  <button className="mt-2 text-yellow-800 underline hover:text-yellow-900">
                    Complete Profile →
                  </button>
                </div>
              </div>
            )}

            {userData.type === 'club' && (
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="card">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Create Sponsorship Request
                  </h3>
                  <p className="text-gray-600 mb-4">
                    List equipment or event sponsorship needs to attract local businesses
                  </p>
                  <Link href="/sponsorships/create" className="btn-primary block text-center">
                    Create Request
                  </Link>
                </div>
                <div className="card">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    My Requests
                  </h3>
                  <p className="text-gray-600 mb-4">
                    View and manage your active sponsorship requests
                  </p>
                  <Link href="/sponsorships/manage" className="btn-secondary block text-center">
                    View Requests
                  </Link>
                </div>
              </div>
            )}

            {userData.type === 'business' && (
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="card">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Browse Opportunities
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Discover local sports clubs looking for sponsorship
                  </p>
                  <Link href="/browse" className="btn-primary block text-center">
                    Browse Opportunities
                  </Link>
                </div>
                <div className="card">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    My Interests
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Track sponsorships you've shown interest in
                  </p>
                  <Link href="/sponsorships/interested" className="btn-secondary block text-center">
                    View Interests
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