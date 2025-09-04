'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Sponsorship {
  id: string;
  title: string;
  description: string;
  amount: number;
  clubId: string;
  clubName: string;
  category: string;
  benefits?: string;
}

export default function SponsorPage() {
  const params = useParams();
  const router = useRouter();
  const [sponsorship, setSponsorship] = useState<Sponsorship | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading a sponsorship (placeholder functionality)
    setLoading(false);
    setSponsorship({
      id: params.sponsorshipId as string,
      title: "Sample Sponsorship Request",
      description: "This is a placeholder for sponsorship details while we fix the build issues.",
      amount: 1000,
      clubId: "club123",
      clubName: "Sample Sports Club",
      category: "equipment",
      benefits: "Logo on uniforms, social media mentions"
    });
  }, [params.sponsorshipId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!sponsorship) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sponsorship Not Found</h2>
          <Link href="/browse" className="text-blue-600 hover:text-blue-800">
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bold text-blue-600">SponsorConnect</h1>
              </Link>
            </div>
            <div className="flex space-x-4">
              <Link href="/browse" className="text-gray-600 hover:text-gray-900">
                Browse
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{sponsorship.title}</h1>
            <p className="text-lg text-gray-600 mb-2">by {sponsorship.clubName}</p>
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold text-green-600">£{sponsorship.amount.toLocaleString()}</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
                {sponsorship.category}
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Description</h3>
            <p className="text-gray-700 leading-relaxed">{sponsorship.description}</p>
          </div>

          {sponsorship.benefits && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">What You Get</h3>
              <p className="text-gray-700 leading-relaxed">{sponsorship.benefits}</p>
            </div>
          )}

          {/* Payment section placeholder */}
          <div className="border-t pt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Sponsor This Request</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-blue-700 mb-4">
                <strong>Payment Integration Coming Soon!</strong> 
                While we're fixing technical issues, payment processing is temporarily disabled.
              </p>
              <p className="text-sm text-blue-600">
                For now, you can contact the club directly or check back later when payment processing is restored.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                disabled
                className="flex-1 bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
              >
                Payment Coming Soon
              </button>
              <Link
                href="/browse"
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
              >
                Back to Browse
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}