'use client';

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">SponsorConnect</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🎉 Dashboard Working!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              The deployment is now successful. Authentication will be restored next.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-8">
              <div className="text-sm text-green-700">
                <p className="font-medium">✅ Dashboard successfully deployed!</p>
                <p>Ready to add back authentication and features.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-8 max-w-4xl mx-auto">
              <div className="bg-white overflow-hidden shadow rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  🏆 For Sports Clubs
                </h3>
                <p className="text-gray-600 mb-4">
                  Create sponsorship requests and manage your funding needs
                </p>
                <Link 
                  href="/sponsorships/create" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg block text-center transition-colors"
                >
                  Create Sponsorship Request
                </Link>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  🤝 For Businesses
                </h3>
                <p className="text-gray-600 mb-4">
                  Discover local sports clubs to sponsor and support
                </p>
                <Link 
                  href="/browse" 
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg block text-center transition-colors"
                >
                  Browse Opportunities
                </Link>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Status:</strong> Core pages are being restored one by one.
                <br />
                <strong>Next:</strong> Authentication, navigation, and full features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}