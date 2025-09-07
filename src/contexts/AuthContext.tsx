'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface UserData {
  name: string;
  email: string;
  type: 'club' | 'business' | 'admin';
  profileCompleted: boolean;
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Prevent hydration issues by ensuring client-side rendering
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return; // Wait for hydration to complete
    // Always set up Firebase auth listener first
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Firebase user exists - use Firebase auth
          console.log('Firebase user detected:', firebaseUser.email);
          setUser(firebaseUser);
          
          // Clear any demo mode data since we have a real Firebase user
          localStorage.removeItem('sponsorconnect_user');
          
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            console.log('Firestore user data loaded:', userData);
            setUserData(userData);
          } else {
            console.log('No Firestore document found for user');
            setUserData(null);
          }
        } else {
          // No Firebase user - check for demo mode
          console.log('No Firebase user, checking demo mode...');
          
          try {
            const demoUser = localStorage.getItem('sponsorconnect_user');
            if (demoUser) {
              console.log('Demo user detected, using demo mode');
              const userData = JSON.parse(demoUser);
              
              // Create a mock user object for demo mode
              const mockUser = {
                uid: `demo_${userData.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
                email: userData.email,
                displayName: userData.name,
              } as User;
              
              setUser(mockUser);
              setUserData({
                name: userData.name,
                email: userData.email,
                type: userData.type,
                profileCompleted: userData.profileCompleted || false,
                createdAt: userData.createdAt || new Date(),
                ...userData
              });
            } else {
              console.log('No demo user found');
              setUser(null);
              setUserData(null);
            }
          } catch (error) {
            console.error('Error checking demo user:', error);
            setUser(null);
            setUserData(null);
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isHydrated]);

  const logout = async () => {
    try {
      // Clear demo mode data
      localStorage.removeItem('sponsorconnect_user');
      
      // Try Firebase signout (may fail in demo mode)
      try {
        await auth.signOut();
      } catch (error) {
        console.warn('Firebase signout failed (demo mode):', error);
      }
      
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    userData,
    loading: loading || !isHydrated, // Keep loading until hydrated
    logout,
  };

  // Prevent flash of wrong content during hydration
  if (!isHydrated) {
    return (
      <AuthContext.Provider value={{ user: null, userData: null, loading: true, logout: async () => {} }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};