'use client';

// import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
// import Navigation from '@/components/Navigation';

export default function DashboardPage() {
  // Temporary simplified version without auth dependencies
  // const { user, userData, loading, logout } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/auth/login');
  //   }
  // }, [user, loading, router]);

  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  //     </div>
  //   );
  // }

  // if (!user || !userData) {
  //   return null;
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Temporarily remove Navigation */}
      {/* <Navigation /> */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Your Dashboard (Fixed)
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Dashboard is now working! Authentication will be restored after testing.
            </p>
            
            {/* Temporarily simplified without userData */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-8">
              <div className="text-sm text-blue-700">
                <p className="font-medium">Dashboard successfully deployed!</p>
              </div>
            </div>

            {/* Show both club and business options for now */}
            {true && (
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

            
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white overflow-hidden shadow rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Browse Opportunities
                </h3>
                <p className="text-gray-600 mb-4">
                  Discover local sports clubs looking for sponsorship
                </p>
                <Link href="/browse" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg block text-center">
                  Browse Opportunities
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}