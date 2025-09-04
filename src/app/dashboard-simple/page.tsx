'use client';

import Link from 'next/link';

export default function SimpleDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Dashboard (Simple Test)
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              This is a simplified dashboard to test deployment
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white overflow-hidden shadow rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Browse Opportunities
                </h3>
                <p className="text-gray-600 mb-4">
                  Discover local sports clubs looking for sponsorship
                </p>
                <Link href="/browse" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">
                  Browse Opportunities
                </Link>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Create Request
                </h3>
                <p className="text-gray-600 mb-4">
                  List equipment or event sponsorship needs
                </p>
                <Link href="/sponsorships/create" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg">
                  Create Request
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}