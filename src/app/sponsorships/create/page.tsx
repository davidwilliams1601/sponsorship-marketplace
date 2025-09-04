'use client';
// Create new sponsorship request page

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

const SPONSORSHIP_CATEGORIES = [
  { id: 'equipment', label: 'Equipment & Gear', description: 'Uniforms, balls, protective gear, training equipment' },
  { id: 'event', label: 'Event Sponsorship', description: 'Tournament entry fees, match sponsorship, awards' },
  { id: 'facility', label: 'Facility & Ground', description: 'Ground hire, facility improvements, maintenance' },
  { id: 'travel', label: 'Travel & Transport', description: 'Away game transport, tournament travel costs' },
  { id: 'training', label: 'Training & Coaching', description: 'Coach fees, training camps, skill development' },
  { id: 'general', label: 'General Support', description: 'Club running costs, administrative expenses' }
];

const URGENCY_LEVELS = [
  { id: 'low', label: 'Not Urgent', color: 'bg-green-100 text-green-800' },
  { id: 'medium', label: 'Moderately Urgent', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'high', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

export default function CreateSponsorshipPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    amount: '',
    urgency: 'medium',
    deadline: '',
    benefits: '',
    location: '',
    images: []
  });

  // Redirect if not a club
  if (userData && userData.type !== 'club') {
    router.push('/dashboard');
    return null;
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== SPONSORSHIP CREATE FORM SUBMITTED ===');
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.category || !formData.amount) {
        console.log('Validation failed: missing required fields');
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Always check for demo mode first
      const demoUser = localStorage.getItem('sponsorconnect_user');
      console.log('Demo user check:', demoUser ? 'Demo mode detected' : 'No demo user found');
      
      if (demoUser) {
        console.log('=== USING DEMO MODE FOR SPONSORSHIP CREATION ===');
        // Demo mode: simulate creation and store locally
        const sponsorshipData = {
          id: `demo_${Date.now()}`,
          ...formData,
          amount: parseFloat(formData.amount),
          clubId: user?.uid || 'demo_club',
          clubName: userData?.name || 'Demo Club',
          status: 'active',
          createdAt: { seconds: Date.now() / 1000 },
          updatedAt: { seconds: Date.now() / 1000 },
          viewCount: 0,
          interestedBusinesses: []
        };

        console.log('Creating sponsorship data:', sponsorshipData);

        // Store in localStorage for demo mode
        const existingRequests = JSON.parse(localStorage.getItem('sponsorconnect_requests') || '[]');
        console.log('Existing requests:', existingRequests.length);
        
        existingRequests.push(sponsorshipData);
        localStorage.setItem('sponsorconnect_requests', JSON.stringify(existingRequests));
        
        console.log('✅ Demo sponsorship saved to localStorage');
        console.log('Total requests now:', existingRequests.length);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Redirecting to manage page...');
        router.push('/sponsorships/manage');
      } else {
        // Real Firebase mode
        const sponsorshipData = {
          ...formData,
          amount: parseFloat(formData.amount),
          clubId: user?.uid || '',
          clubName: userData?.name || 'Unknown Club',
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          viewCount: 0,
          interestedBusinesses: []
        };

        const docRef = await addDoc(collection(db, 'sponsorships'), sponsorshipData);
        
        console.log('Sponsorship created with ID:', docRef.id);
        router.push('/sponsorships/manage');
      }
      
    } catch (error: any) {
      console.error('Error creating sponsorship:', error);
      setError('Failed to create sponsorship request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Sponsorship Request</h1>
          <p className="mt-2 text-gray-600">
            Create a detailed sponsorship request to attract local businesses to support your club.
          </p>
          {typeof window !== 'undefined' && localStorage.getItem('sponsorconnect_user') && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700">
                <strong>Demo Mode:</strong> Your sponsorship request will be saved locally for demonstration purposes while Firebase connection issues are being resolved.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Sponsorship Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., New Team Uniforms for Youth Football Team"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {SPONSORSHIP_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {formData.category && (
                <p className="mt-1 text-sm text-gray-600">
                  {SPONSORSHIP_CATEGORIES.find(c => c.id === formData.category)?.description}
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Sponsorship Amount Needed <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">£</span>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  required
                  min="1"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what you need sponsorship for, why it's important for your club, and how it will benefit your players..."
              />
            </div>

            {/* Benefits */}
            <div>
              <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-2">
                What Can You Offer Sponsors?
              </label>
              <textarea
                id="benefits"
                name="benefits"
                rows={3}
                value={formData.benefits}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Logo on uniforms, mention in social media posts, banner at home games, newsletter features..."
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Club Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Manchester, UK"
              />
            </div>

            {/* Urgency & Deadline */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Level
                </label>
                <select
                  id="urgency"
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {URGENCY_LEVELS.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Sponsorship Request'}
              </button>
              <Link
                href="/dashboard"
                className="flex-1 btn-secondary text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}