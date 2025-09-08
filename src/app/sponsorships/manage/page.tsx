'use client';

import dynamic from 'next/dynamic';

// Dynamically import the actual manage page component with no SSR
const ManagePage = dynamic(() => import('./ManagePageContent'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  )
});

export default function ManageWrapper() {
  return <ManagePage />;
}