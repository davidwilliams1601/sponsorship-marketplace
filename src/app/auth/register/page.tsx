'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get('type') || 'club';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== REGISTER FORM SUBMITTED ===');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('User type:', userType);
    console.log('Password length:', password.length);
    
    setLoading(true);
    setError('');

    try {
      if (!name || !email || !password) {
        console.log('Missing required fields');
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      // Try Firebase registration first with timeout and better error handling
      try {
        console.log('=== ATTEMPTING FIREBASE REGISTRATION ===');
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase registration timeout')), 8000)
        );
        
        const userCredential = await Promise.race([
          createUserWithEmailAndPassword(auth, email, password),
          timeoutPromise
        ]) as any;
        
        console.log('✅ Firebase registration successful:', userCredential.user.email);
        
        // Create user document in Firestore with timeout
        const firestoreTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firestore write timeout')), 5000)
        );
        
        await Promise.race([
          setDoc(doc(db, 'users', userCredential.user.uid), {
            name,
            email,
            type: userType,
            profileCompleted: false,
            createdAt: serverTimestamp(),
          }),
          firestoreTimeoutPromise
        ]);

        console.log('✅ Firestore document created successfully');
        
        
        console.log('Redirecting to dashboard...');
        router.push('/dashboard');
        return;

      } catch (firebaseError: any) {
        console.log('=== FIREBASE REGISTRATION FAILED ===');
        console.error('Firebase error:', firebaseError);
        
        // Firebase registration failed
        console.log('=== FIREBASE REGISTRATION FAILED ===');

        let errorMessage = 'Registration failed. Please try again.';
        if (firebaseError.code === 'auth/email-already-in-use') {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (firebaseError.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak. Please choose a stronger password.';
        } else if (firebaseError.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address.';
        }

        setError(errorMessage);
      }
      
      console.log('❌ Registration validation failed');
      setError('Please enter valid information for all fields');
      
    } catch (error: any) {
      console.error('❌ Unexpected registration error:', error);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
      console.log('=== REGISTRATION PROCESS COMPLETED ===');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/" className="flex justify-center">
            <h1 className="text-3xl font-bold text-blue-600">SponsorConnect</h1>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Register as a {userType === 'club' ? 'Sports Club' : 'Business'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {userType === 'club' ? 'Club Name' : 'Business Name'}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}