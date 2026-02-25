'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');

    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setResetError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setResetError('Please enter a valid email address.');
      } else {
        setResetError('Failed to send reset email. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!email || !password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }

      // Try Firebase authentication first with timeout
      try {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase');

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Firebase login timeout')), 8000)
        );

        const userCredential = await Promise.race([
          signInWithEmailAndPassword(auth, email, password),
          timeoutPromise
        ]) as any;

        router.push('/dashboard');
        return;

      } catch (firebaseError: any) {
        // If user not found, try to create account
        if (firebaseError.code === 'auth/user-not-found') {
          try {
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            const { doc, setDoc } = await import('firebase/firestore');
            const { auth, db } = await import('@/lib/firebase');

            const createTimeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Firebase user creation timeout')), 8000)
            );

            const userCredential = await Promise.race([
              createUserWithEmailAndPassword(auth, email, password),
              createTimeoutPromise
            ]) as any;

            const userType = email.includes('club') ? 'club' : 'business';

            const firestoreTimeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Firestore write timeout')), 5000)
            );

            await Promise.race([
              setDoc(doc(db, 'users', userCredential.user.uid), {
                name: email.split('@')[0],
                email: email,
                type: userType,
                profileCompleted: false,
                createdAt: new Date()
              }),
              firestoreTimeoutPromise
            ]);

            router.push('/dashboard');
            return;

          } catch (createError: any) {
            console.error('Failed to create Firebase user:', createError);
          }
        }

        let errorMessage = 'Authentication failed. Please check your credentials.';
        if (firebaseError.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email. Please register first.';
        } else if (firebaseError.code === 'auth/wrong-password') {
          errorMessage = 'Incorrect password. Please try again.';
        } else if (firebaseError.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address.';
        }

        setError(errorMessage);
      }

      setError('Please enter a valid email and password');

    } catch (error: any) {
      console.error('Unexpected login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
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
            {showForgotPassword ? 'Reset your password' : 'Sign in to your account'}
          </h2>
        </div>

        {showForgotPassword ? (
          <div className="mt-8 space-y-6">
            {resetSent ? (
              <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-4 rounded text-center">
                <p className="font-medium">Reset email sent!</p>
                <p className="text-sm mt-1">Check your inbox for instructions to reset your password.</p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {resetError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {resetError}
                  </div>
                )}
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="resetEmail"
                    type="email"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {resetLoading ? 'Sending...' : 'Send reset email'}
                </button>
              </form>
            )}
            <div className="text-center">
              <button
                onClick={() => { setShowForgotPassword(false); setResetSent(false); setResetError(''); }}
                className="text-blue-600 hover:text-blue-500 text-sm"
              >
                Back to sign in
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setResetEmail(email); }}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center">
              <Link href="/auth/register" className="text-blue-600 hover:text-blue-500">
                Don&apos;t have an account? Sign up
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
