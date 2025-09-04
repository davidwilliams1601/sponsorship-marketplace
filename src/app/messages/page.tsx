'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface Conversation {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  participantTypes: { [key: string]: string };
  lastMessage: string;
  lastMessageAt: any;
  unreadCount?: number;
  sponsorshipTitle?: string;
}

export default function MessagesPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  useEffect(() => {
    if (!user) return;

    // Query conversations where user is a participant
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const conversationsList: Conversation[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const conversation: Conversation = {
          id: docSnapshot.id,
          participants: data.participants,
          participantNames: data.participantNames || {},
          participantTypes: data.participantTypes || {},
          lastMessage: data.lastMessage || 'No messages yet',
          lastMessageAt: data.lastMessageAt,
          sponsorshipTitle: data.sponsorshipTitle
        };

        // Fetch missing participant names if needed
        for (const participantId of data.participants) {
          if (!conversation.participantNames[participantId] && participantId !== user.uid) {
            try {
              const userDoc = await getDoc(doc(db, 'users', participantId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                conversation.participantNames[participantId] = userData.name || 'Unknown User';
                conversation.participantTypes[participantId] = userData.type || 'user';
              }
            } catch (error) {
              console.error('Error fetching participant data:', error);
              conversation.participantNames[participantId] = 'Unknown User';
            }
          }
        }

        conversationsList.push(conversation);
      }
      
      setConversations(conversationsList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getOtherParticipant = (conversation: Conversation) => {
    const otherParticipantId = conversation.participants.find(id => id !== user?.uid);
    if (!otherParticipantId) return null;
    
    return {
      id: otherParticipantId,
      name: conversation.participantNames[otherParticipantId] || 'Unknown User',
      type: conversation.participantTypes[otherParticipantId] || 'user'
    };
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="mt-2 text-gray-600">
            Communicate with potential sponsors and clubs about opportunities.
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-1.024L3 21l1.024-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                No messages yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start a conversation with {userData?.type === 'club' ? 'businesses' : 'clubs'} to discuss sponsorship opportunities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/messages/new" className="btn-primary">
                  Start a Conversation
                </Link>
                <Link 
                  href={userData?.type === 'business' ? '/browse' : '/sponsorships/create'}
                  className="btn-secondary"
                >
                  {userData?.type === 'business' ? 'Browse Opportunities' : 'Create Request'}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {conversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                
                return (
                  <Link
                    key={conversation.id}
                    href={`/messages/${conversation.id}`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                              otherParticipant?.type === 'club' ? 'bg-blue-600' : 'bg-green-600'
                            }`}>
                              {otherParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-lg font-medium text-gray-900 truncate">
                                {otherParticipant?.name || 'Unknown User'}
                              </p>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                otherParticipant?.type === 'club' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {otherParticipant?.type === 'club' ? 'Club' : 'Business'}
                              </span>
                            </div>
                            {conversation.sponsorshipTitle && (
                              <p className="text-sm text-blue-600 truncate">
                                Re: {conversation.sponsorshipTitle}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm text-gray-500">
                            {formatDate(conversation.lastMessageAt)}
                          </p>
                          {conversation.unreadCount && conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}