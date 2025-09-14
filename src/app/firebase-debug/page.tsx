'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function FirebaseDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFirebaseConnection = async () => {
    setTesting(true);
    setLogs([]);
    
    try {
      addLog('🚀 Starting Firebase connection tests...');
      
      // Test 1: Check Firebase config
      addLog('📋 Checking Firebase configuration...');
      addLog(`Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
      addLog(`Auth Domain: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`);
      addLog(`API Key: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing'}`);
      
      // Test 2: Test authentication initialization
      addLog('🔐 Testing Firebase Auth initialization...');
      if (auth) {
        addLog('✅ Firebase Auth initialized successfully');
        addLog(`Current user: ${auth.currentUser ? auth.currentUser.email : 'None'}`);
      } else {
        addLog('❌ Firebase Auth failed to initialize');
      }
      
      // Test 3: Test Firestore initialization
      addLog('🗄️ Testing Firestore initialization...');
      if (db) {
        addLog('✅ Firestore initialized successfully');
      } else {
        addLog('❌ Firestore failed to initialize');
      }
      
      // Test 4: Test a simple Firestore read
      addLog('📖 Testing Firestore read operation...');
      try {
        const testDoc = await getDoc(doc(db, 'test', 'connection'));
        addLog('✅ Firestore read operation successful');
      } catch (firestoreError: any) {
        addLog(`❌ Firestore read failed: ${firestoreError.code} - ${firestoreError.message}`);
      }
      
      // Test 5: Test creating a test user
      addLog('👤 Testing user creation...');
      const testEmail = `test${Date.now()}@test.com`;
      const testPassword = 'password123';
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        addLog(`✅ User creation successful: ${userCredential.user.email}`);
        
        // Test 6: Test creating user document
        addLog('📝 Testing user document creation...');
        try {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: testEmail,
            type: 'test',
            name: 'Test User',
            profileCompleted: false,
            createdAt: new Date()
          });
          addLog('✅ User document creation successful');
          
          // Clean up - delete the test user
          await userCredential.user.delete();
          addLog('🗑️ Test user cleaned up');
          
        } catch (docError: any) {
          addLog(`❌ User document creation failed: ${docError.code} - ${docError.message}`);
        }
        
      } catch (authError: any) {
        addLog(`❌ User creation failed: ${authError.code} - ${authError.message}`);
      }
      
      addLog('🏁 Firebase connection tests completed');
      
    } catch (error: any) {
      addLog(`💥 Unexpected error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Firebase Connection Debug</h1>
          
          <div className="mb-6">
            <button
              onClick={testFirebaseConnection}
              disabled={testing}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Run Firebase Tests'}
            </button>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div>Click "Run Firebase Tests" to start debugging...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}