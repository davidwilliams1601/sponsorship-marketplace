'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface ProfileFormData {
  // Common fields
  name: string;
  description: string;
  location: string;
  website?: string;
  contactEmail?: string;
  phone?: string;
  
  // Business-specific fields
  businessType?: string;
  industry?: string;
  sponsorshipBudget?: string;
  sponsorshipInterests?: string[];
  
  // Club-specific fields
  clubType?: string;
  foundedYear?: string;
  memberCount?: string;
  ageGroups?: string[];
  achievements?: string;
}

const BUSINESS_TYPES = [
  'Local Business', 'Corporate', 'Startup', 'Non-Profit', 'Professional Services', 'Retail', 'Restaurant/Food', 'Other'
];

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Construction', 'Manufacturing', 'Retail', 'Food & Beverage', 
  'Professional Services', 'Real Estate', 'Transportation', 'Entertainment', 'Education', 'Other'
];

const CLUB_TYPES = [
  'Football', 'Rugby', 'Cricket', 'Tennis', 'Basketball', 'Swimming', 'Athletics', 'Cycling', 
  'Golf', 'Hockey', 'Netball', 'Volleyball', 'Martial Arts', 'Multi-Sport', 'Other'
];

const SPONSORSHIP_INTERESTS = [
  'Equipment & Gear', 'Event Sponsorship', 'Facility & Ground', 'Travel & Transport', 
  'Training & Coaching', 'General Support'
];

const AGE_GROUPS = [
  'Under 8', 'Under 10', 'Under 12', 'Under 14', 'Under 16', 'Under 18', 'Adults', 'Seniors (50+)'
];

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    description: '',
    location: '',
    website: '',
    contactEmail: '',
    phone: '',
    businessType: '',
    industry: '',
    sponsorshipBudget: '',
    sponsorshipInterests: [],
    clubType: '',
    foundedYear: '',
    memberCount: '',
    ageGroups: [],
    achievements: ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Pre-fill with existing data if available
    if (userData) {
      setFormData(prev => ({
        ...prev,
        name: userData.name || '',
        contactEmail: userData.email || '',
      }));
    }
  }, [user, userData, router]);

  if (!user || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCheckboxChange = (field: 'sponsorshipInterests' | 'ageGroups', value: string) => {
    const currentValues = formData[field] as string[];
    const updatedValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    setFormData({
      ...formData,
      [field]: updatedValues
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.location) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Check if we're in demo mode
      const demoUser = localStorage.getItem('sponsorconnect_user');
      
      if (demoUser) {
        // Demo mode: update localStorage
        const userData = JSON.parse(demoUser);
        const updatedUserData = {
          ...userData,
          ...formData,
          profileCompleted: true,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('sponsorconnect_user', JSON.stringify(updatedUserData));
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSuccess('Profile completed successfully!');
        
        // Redirect to dashboard after a moment
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        // Real Firebase mode - update Firestore user document
        console.log('=== FIREBASE PROFILE UPDATE ===');
        console.log('User UID:', user?.uid);
        console.log('Form data:', formData);
        
        const profileData = {
          ...formData,
          type: userData.type,
          email: user?.email || formData.contactEmail,
          profileCompleted: true,
          updatedAt: serverTimestamp()
        };
        
        console.log('Updating Firebase profile with:', profileData);
        
        const userDocRef = doc(db, 'users', user.uid);
        
        try {
          // Try to update existing document first
          await updateDoc(userDocRef, profileData);
          console.log('Profile updated successfully with updateDoc');
        } catch (updateError: any) {
          console.log('updateDoc failed, trying setDoc:', updateError);
          // If document doesn't exist, create it
          if (updateError?.code === 'not-found') {
            await setDoc(userDocRef, {
              ...profileData,
              createdAt: serverTimestamp()
            });
            console.log('Profile created successfully with setDoc');
          } else {
            throw updateError;
          }
        }
        
        setSuccess('Profile updated successfully!');
        
        // Redirect to dashboard after a moment
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
      
    } catch (error: any) {
      console.error('=== PROFILE UPDATE ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      console.error('================================');
      
      let errorMessage = 'Failed to update profile. Please try again.';
      
      // Provide more specific error messages and auto-fallback
      if (error?.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please ensure you are logged in properly.';
      } else if (error?.code === 'network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error?.code === 'unavailable' || error?.message?.includes('Cloud Firestore backend') || error?.message?.includes('Firebase')) {
        errorMessage = 'Database connection failed. Trying demo mode...';
        
        // Auto-fallback to demo mode on Firebase errors
        try {
          console.log('Auto-falling back to demo mode for profile update...');
          const demoUserData = {
            uid: user?.uid || 'demo_user',
            email: user?.email || formData.contactEmail,
            type: userData.type,
            ...formData,
            profileCompleted: true,
            updatedAt: new Date().toISOString()
          };
          
          localStorage.setItem('sponsorconnect_user', JSON.stringify(demoUserData));
          
          console.log('✅ Auto-fallback to demo mode successful');
          setSuccess('Profile saved successfully in demo mode!');
          
          // Redirect to dashboard after a moment
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
          return;
        } catch (fallbackError) {
          console.error('Demo mode fallback also failed:', fallbackError);
          errorMessage = 'Both Firebase and demo mode failed. Please refresh and try again.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="mt-2 text-gray-600">
            Tell us about your {userData.type === 'business' ? 'business' : 'club'} to get the most out of SponsorConnect.
          </p>
          {typeof window !== 'undefined' && localStorage.getItem('sponsorconnect_user') && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700">
                <strong>Demo Mode:</strong> Your profile will be saved locally for demonstration purposes.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {userData.type === 'business' ? 'Business' : 'Club'} Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={userData.type === 'business' ? 'Your Business Name' : 'Your Club Name'}
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Manchester, UK"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={userData.type === 'business' ? 'Tell us about your business, what you do, and your values...' : 'Tell us about your club, your mission, and what makes you special...'}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+44 123 456 7890"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.example.com"
                />
              </div>
            </div>

            {/* Business-specific fields */}
            {userData.type === 'business' && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Business Details</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type
                    </label>
                    <select
                      id="businessType"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select business type</option>
                      {BUSINESS_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <select
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="sponsorshipBudget" className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Sponsorship Budget Range
                  </label>
                  <select
                    id="sponsorshipBudget"
                    name="sponsorshipBudget"
                    value={formData.sponsorshipBudget}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select budget range</option>
                    <option value="under-500">Under £500</option>
                    <option value="500-1000">£500 - £1,000</option>
                    <option value="1000-5000">£1,000 - £5,000</option>
                    <option value="5000-10000">£5,000 - £10,000</option>
                    <option value="10000-25000">£10,000 - £25,000</option>
                    <option value="over-25000">Over £25,000</option>
                  </select>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sponsorship Interests (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {SPONSORSHIP_INTERESTS.map(interest => (
                      <label key={interest} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.sponsorshipInterests?.includes(interest)}
                          onChange={() => handleCheckboxChange('sponsorshipInterests', interest)}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Club-specific fields */}
            {userData.type === 'club' && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Club Details</h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="clubType" className="block text-sm font-medium text-gray-700 mb-2">
                      Club Type/Sport
                    </label>
                    <select
                      id="clubType"
                      name="clubType"
                      value={formData.clubType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select club type</option>
                      {CLUB_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="foundedYear" className="block text-sm font-medium text-gray-700 mb-2">
                      Founded Year
                    </label>
                    <input
                      type="number"
                      id="foundedYear"
                      name="foundedYear"
                      min="1800"
                      max={new Date().getFullYear()}
                      value={formData.foundedYear}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 1995"
                    />
                  </div>

                  <div>
                    <label htmlFor="memberCount" className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Members
                    </label>
                    <select
                      id="memberCount"
                      name="memberCount"
                      value={formData.memberCount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select range</option>
                      <option value="under-25">Under 25</option>
                      <option value="25-50">25-50</option>
                      <option value="51-100">51-100</option>
                      <option value="101-200">101-200</option>
                      <option value="over-200">Over 200</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age Groups We Serve (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {AGE_GROUPS.map(age => (
                      <label key={age} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.ageGroups?.includes(age)}
                          onChange={() => handleCheckboxChange('ageGroups', age)}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{age}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="achievements" className="block text-sm font-medium text-gray-700 mb-2">
                    Recent Achievements or Notable Information
                  </label>
                  <textarea
                    id="achievements"
                    name="achievements"
                    rows={3}
                    value={formData.achievements}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Share any recent wins, tournaments, community achievements, or other notable information..."
                  />
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving Profile...' : 'Complete Profile'}
              </button>
              <Link
                href="/dashboard"
                className="flex-1 btn-secondary text-center"
              >
                Skip for Now
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}