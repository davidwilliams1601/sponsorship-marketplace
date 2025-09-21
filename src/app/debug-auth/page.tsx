'use client';

import { useAuth } from '@/contexts/AuthContext';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

export default function DebugAuthPage() {
  const { user, userData, loading } = useAuth();
  const [firebaseTest, setFirebaseTest] = useState<string>('Testing...');
  const [firestoreTest, setFirestoreTest] = useState<string>('Testing...');

  useEffect(() => {
    // Test Firebase connection
    if (auth) {
      setFirebaseTest('Firebase Auth initialized ✅');
    } else {
      setFirebaseTest('Firebase Auth failed ❌');
    }

    // Test Firestore connection
    const testFirestore = async () => {
      try {
        // Try to read a document (this should work even without auth)
        const testDoc = doc(db, 'test', 'test');
        await getDoc(testDoc);
        setFirestoreTest('Firestore connection works ✅');
      } catch (error: any) {
        setFirestoreTest(`Firestore error: ${error.message} ❌`);
      }
    };

    testFirestore();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>

        <div className="grid gap-6">
          {/* AuthContext Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">AuthContext Status</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? '🔄 Yes' : '✅ No'}</p>
              <p><strong>User:</strong> {user ? `✅ ${user.email} (${user.uid})` : '❌ None'}</p>
              <p><strong>User Data:</strong> {userData ? `✅ ${userData.name} (${userData.type})` : '❌ None'}</p>
            </div>
          </div>

          {/* Firebase Tests */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Firebase Connection</h2>
            <div className="space-y-2">
              <p><strong>Firebase Auth:</strong> {firebaseTest}</p>
              <p><strong>Firestore:</strong> {firestoreTest}</p>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibent mb-4">Environment Variables</h2>
            <div className="space-y-2 text-sm">
              <p><strong>API Key:</strong> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>Auth Domain:</strong> {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>Project ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'}</p>
            </div>
          </div>

          {/* Console Logs */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Instructions</h2>
            <div className="space-y-2 text-sm">
              <p>1. Check browser console for detailed errors</p>
              <p>2. If user is null, try logging in at <a href="/auth/login" className="text-blue-600">/auth/login</a></p>
              <p>3. If Firestore fails, check Firebase console permissions</p>
              <p>4. Channel 400 errors usually indicate auth/permission issues</p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="flex gap-4">
              <a href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded">
                Go to Login
              </a>
              <a href="/auth/register" className="bg-green-600 text-white px-4 py-2 rounded">
                Go to Register
              </a>
              <a href="/dashboard" className="bg-gray-600 text-white px-4 py-2 rounded">
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}