'use client';

import { useAuth } from '@/contexts/AuthContext';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'club' | 'business')[];
  fallback?: React.ReactNode;
}

export default function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return fallback || null;
  }

  if (!user || !userData || !allowedRoles.includes(userData.type)) {
    return fallback || null;
  }

  return <>{children}</>;
}