'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface User {
  id: string;
  name: string;
  type: 'club' | 'business';
  email: string;
}

function NewMessagePageContent() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  useEffect(() => {
    // Get URL parameters for pre-filling
    const toUserId = searchParams.get('to');
    const subjectParam = searchParams.get('subject');
    
    if (subjectParam) {
      setSubject(decodeURIComponent(subjectParam));
    }

    // Fetch potential recipients (opposite user type)
    const fetchUsers = async () => {
      try {
        const targetUserType = userData?.type === 'club' ? 'business' : 'club';
        const q = query(
          collection(db, 'users'),
          where('type', '==', targetUserType)
        );
        
        const querySnapshot = await getDocs(q);
        const usersList: User[] = [];
        
        querySnapshot.forEach((doc) => {
          if (doc.id !== user.uid) { // Exclude current user
            usersList.push({
              id: doc.id,
              ...doc.data()
            } as User);
          }
        });
        
        setUsers(usersList);
        
        // Pre-select user if specified in URL
        if (toUserId) {
          setSelectedUser(toUserId);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, userData, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !message.trim() || sending) return;

    setSending(true);
    try {
      // Get recipient details
      const recipientDoc = await getDoc(doc(db, 'users', selectedUser));
      if (!recipientDoc.exists()) {
        throw new Error('Recipient not found');
      }
      
      const recipientData = recipientDoc.data();

      // Create conversation
      const conversationData = {
        participants: [user.uid, selectedUser],
        participantNames: {
          [user.uid]: userData?.name || 'Unknown User',
          [selectedUser]: recipientData.name || 'Unknown User'
        },
        participantTypes: {
          [user.uid]: userData?.type || 'user',
          [selectedUser]: recipientData.type || 'user'
        },
        lastMessage: message.trim(),
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      // Add subject/sponsorship context if provided
      if (subject) {
        conversationData.sponsorshipTitle = subject;
      }

      // Create conversation document
      const conversationRef = await addDoc(collection(db, 'conversations'), conversationData);

      // Add first message
      await addDoc(collection(db, 'conversations', conversationRef.id, 'messages'), {
        text: message.trim(),
        senderId: user.uid,
        senderName: userData?.name || 'Unknown User',
        timestamp: serverTimestamp(),
        read: false
      });

      // Redirect to the new conversation
      router.push(`/messages/${conversationRef.id}`);

    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Start New Conversation</h1>
          <p className="mt-2 text-gray-600">
            Send a message to a {userData?.type === 'club' ? 'business' : 'sports club'} about sponsorship opportunities.
          </p>
        </div>

        {users.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              No {userData?.type === 'club' ? 'businesses' : 'clubs'} available
            </h3>
            <p className="text-gray-600 mb-6">
              There are currently no {userData?.type === 'club' ? 'businesses' : 'clubs'} registered on the platform to message.
            </p>
            <Link href="/dashboard" className="btn-primary">
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Recipient Selection */}
              <div>
                <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
                  To <span className="text-red-500">*</span>
                </label>
                <select
                  id="recipient"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select recipient...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.type === 'club' ? 'Sports Club' : 'Business'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Interested in sponsorship opportunity"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    userData?.type === 'club' 
                      ? "Hi! I'm interested in discussing a potential sponsorship opportunity with your business..."
                      : "Hello! I'd like to learn more about your sponsorship needs and how our business might be able to help..."
                  }
                />
              </div>

              {/* Quick Templates */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Templates:</p>
                <div className="space-y-2">
                  {userData?.type === 'club' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setMessage("Hi! I'm reaching out to see if your business would be interested in sponsoring our sports club. We have great opportunities for local business exposure through our team activities and events. I'd love to discuss how we can work together!")}
                        className="text-left text-sm text-blue-600 hover:text-blue-800 block"
                      >
                        Template: General sponsorship inquiry
                      </button>
                      <button
                        type="button"
                        onClick={() => setMessage("Hello! We're a local sports club looking for equipment sponsorship. In return, we offer logo placement on uniforms, social media promotion, and recognition at our events. Would you be interested in learning more about this opportunity?")}
                        className="text-left text-sm text-blue-600 hover:text-blue-800 block"
                      >
                        Template: Equipment sponsorship request
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setMessage("Hello! I represent a local business interested in supporting sports clubs in our community. We're looking for sponsorship opportunities that align with our values and provide meaningful community engagement. I'd love to discuss potential partnerships!")}
                        className="text-left text-sm text-blue-600 hover:text-blue-800 block"
                      >
                        Template: Business introduction
                      </button>
                      <button
                        type="button"
                        onClick={() => setMessage("Hi! I saw your sponsorship request and think it might be a great fit for our business. Could we schedule a time to discuss the details and what kind of partnership would work best for both of us?")}
                        className="text-left text-sm text-blue-600 hover:text-blue-800 block"
                      >
                        Template: Responding to sponsorship request
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="submit"
                  disabled={!selectedUser || !message.trim() || sending}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
                <Link
                  href="/messages"
                  className="flex-1 btn-secondary text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewMessagePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <NewMessagePageContent />
    </Suspense>
  );
}