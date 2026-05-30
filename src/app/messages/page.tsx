'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import { Chat } from '@/types';
import Link from 'next/link';
import Skeleton from '@/components/ui/Skeleton';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { formatDistanceToNow } from 'date-fns';

export default function InboxPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedChats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      
      setChats(loadedChats);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to chats:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <AuthGuard>
      <div className="flex-1 bg-surface-50 py-10">
        <div className="page-container max-w-4xl">
          <h1 className="text-3xl font-bold font-[var(--font-heading)] text-surface-900 mb-8">
            Messages
          </h1>

          <div className="bg-white rounded-3xl border border-surface-200 overflow-hidden card-shadow">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(n => (
                  <div key={n} className="flex gap-4">
                    <Skeleton variant="circular" width={48} height={48} />
                    <div className="flex-1 space-y-2">
                      <Skeleton width="30%" />
                      <Skeleton width="80%" />
                    </div>
                  </div>
                ))}
              </div>
            ) : chats.length > 0 ? (
              <ul className="divide-y divide-surface-100">
                {chats.map(chat => {
                  const otherUserId = chat.participants.find(id => id !== user?.uid) || '';
                  const otherUserName = chat.participantNames?.[otherUserId] || 'Unknown User';
                  const otherUserPhoto = chat.participantPhotos?.[otherUserId] || `https://ui-avatars.com/api/?name=${otherUserName}`;
                  const timeAgo = chat.lastMessageAt ? formatDistanceToNow(chat.lastMessageAt.toDate(), { addSuffix: true }) : '';

                  return (
                    <li key={chat.id}>
                      <Link href={`/messages/${chat.id}`} className="flex items-center gap-4 p-4 md:p-6 hover:bg-surface-50 transition-colors">
                        <img 
                          src={otherUserPhoto} 
                          alt={otherUserName}
                          className="w-12 h-12 rounded-full border border-surface-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-surface-900 truncate">{otherUserName}</h3>
                            <span className="text-xs text-surface-400 whitespace-nowrap ml-4">{timeAgo}</span>
                          </div>
                          <p className="text-sm text-surface-600 truncate mb-1">
                            {chat.listingTitle || 'General Inquiry'}
                          </p>
                          <p className="text-sm text-surface-500 truncate">
                            {chat.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-20 px-4">
                <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4 text-surface-400">
                  <IoChatbubbleEllipsesOutline size={32} />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 mb-2">No messages yet</h3>
                <p className="text-surface-500 max-w-sm mx-auto">
                  When you contact property owners or renters contact you, those conversations will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
