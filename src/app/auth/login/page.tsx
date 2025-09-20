'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== LOGIN FORM SUBMITTED ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);
    
    setLoading(true);
    setError('');

    try {
      if (!email || !password) {
        console.log('Missing email or password');
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }

      // Try Firebase authentication first with timeout
      try {
        console.log('=== ATTEMPTING FIREBASE AUTH ===');
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase');
        
        console.log('Firebase modules loaded, attempting login...');
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase login timeout')), 8000)
        );
        
        const userCredential = await Promise.race([
          signInWithEmailAndPassword(auth, email, password),
          timeoutPromise
        ]) as any;
        
        console.log('✅ Firebase authentication successful:', userCredential.user.email);
        console.log('User UID:', userCredential.user.uid);
        
        
        // Redirect to dashboard - AuthContext will handle the user state
        console.log('Redirecting to dashboard...');
        router.push('/dashboard');
        return;
        
      } catch (firebaseError: any) {
        console.log('=== FIREBASE AUTH FAILED ===');
        console.error('Firebase error code:', firebaseError.code);
        console.error('Firebase error message:', firebaseError.message);
        
        // If user not found, try to create account
        if (firebaseError.code === 'auth/user-not-found') {
          try {
            console.log('=== CREATING NEW USER ===');
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            const { doc, setDoc } = await import('firebase/firestore');
            const { auth, db } = await import('@/lib/firebase');
            
            console.log('Creating new Firebase user...');
            
            // Add timeout for user creation
            const createTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Firebase user creation timeout')), 8000)
            );
            
            const userCredential = await Promise.race([
              createUserWithEmailAndPassword(auth, email, password),
              createTimeoutPromise
            ]) as any;
            
            console.log('✅ New Firebase user created:', userCredential.user.email);
            
            // Create user document in Firestore with timeout
            const userType = email.includes('club') ? 'club' : 'business';
            console.log('Creating Firestore document with type:', userType);
            
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
            
            console.log('✅ Firestore document created successfully');
            
            
            // Redirect to dashboard
            console.log('Redirecting to dashboard...');
            router.push('/dashboard');
            return;
            
          } catch (createError: any) {
            console.error('❌ Failed to create Firebase user:', createError);
            console.error('Create error details:', createError.message);
          }
        }
        
        // Firebase authentication failed
        console.log('=== FIREBASE AUTH FAILED ===');
        console.log('Firebase error was:', firebaseError.message || firebaseError.code);

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
      
      console.log('❌ Login validation failed');
      setError('Please enter a valid email and password');
      
    } catch (error: any) {
      console.error('❌ Unexpected login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
      console.log('=== LOGIN PROCESS COMPLETED ===');
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
            Sign in to your account
          </h2>
        </div>
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
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
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}