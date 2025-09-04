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

  useEffect(() => {
    // Check for demo mode user in localStorage first
    const checkDemoUser = () => {
      try {
        const demoUser = localStorage.getItem('sponsorconnect_user');
        if (demoUser) {
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
          setLoading(false);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error checking demo user:', error);
        return false;
      }
    };

    // Try demo mode first, then Firebase auth
    if (!checkDemoUser()) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            setUser(user);
            // Fetch user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              setUserData(userDoc.data() as UserData);
            } else {
              setUserData(null);
            }
          } else {
            setUser(null);
            setUserData(null);
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
    }
  }, []);

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
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};