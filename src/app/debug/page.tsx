'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function DebugPage() {
  const { user, userData, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Loading State:</h3>
              <p className="text-gray-600">{loading ? 'Loading...' : 'Not Loading'}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg">Firebase User:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {user ? JSON.stringify({
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName,
                  emailVerified: user.emailVerified
                }, null, 2) : 'null'}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-lg">User Data from Firestore:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {userData ? JSON.stringify(userData, null, 2) : 'null'}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-lg">Navigation Logic:</h3>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <p><strong>User Type:</strong> {userData?.type || 'undefined'}</p>
                <p><strong>Should show Browse:</strong> {userData?.type === 'business' ? 'Yes' : 'No'}</p>
                <p><strong>Should show Create:</strong> {userData?.type === 'club' ? 'Yes' : 'No'}</p>
                <p><strong>Should show My Requests:</strong> {userData?.type === 'club' ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg">LocalStorage Check:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {typeof window !== 'undefined' ? 
                  localStorage.getItem('sponsorconnect_user') || 'No demo data' : 
                  'Server-side rendering'}
              </pre>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2">Quick Actions:</h3>
            <div className="flex gap-4">
              <button
                onClick={() => window.location.href = '/browse'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Browse (Direct)
              </button>
              <button
                onClick={() => window.location.href = '/sponsorships/create'}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Go to Create (Direct)
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}