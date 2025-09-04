'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  showFor?: 'all' | 'club' | 'business' | 'admin';
}

export default function Navigation() {
  const { user, userData, logout } = useAuth();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', showFor: 'all' },
    { href: '/browse', label: 'Browse Marketplace', showFor: 'all' },
    { href: '/sponsorships/create', label: 'Create Request', showFor: 'club' },
    { href: '/sponsorships/manage', label: 'My Requests', showFor: 'club' },
    { href: '/sponsorships/interested', label: 'My Interests', showFor: 'business' },
    { href: '/messages', label: 'Messages', showFor: 'all' },
    { href: '/admin', label: 'Admin', showFor: 'admin' },
  ];

  const filteredItems = navItems.filter(item => {
    if (item.showFor === 'all') return true;
    if (item.showFor === userData?.type) return true;
    if (item.showFor === 'admin' && userData?.isAdmin) return true;
    return false;
  });

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex-shrink-0 text-xl sm:text-2xl font-bold text-blue-600">
            SponsorConnect
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {filteredItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <>
                <span className="text-gray-700 text-sm px-3">
                  {userData?.name || 'User'}
                </span>
                <button
                  onClick={logout}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile Navigation - Horizontal Scroll */}
          <div className="md:hidden flex-1 ml-4 overflow-x-auto mobile-nav-scroll">
            <div className="flex items-center space-x-2 py-2 px-2">
              {filteredItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium flex-shrink-0 ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {user && (
                <button
                  onClick={logout}
                  className="whitespace-nowrap text-gray-600 hover:text-gray-900 text-sm font-medium px-3 py-1.5 flex-shrink-0"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}