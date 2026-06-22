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
      <div className="flex-1 bg-surface-50 py-4 md:py-10 pb-20 md:pb-10">
        <div className="page-container max-w-4xl">
          <h1 className="text-2xl md:text-3xl font-bold font-[var(--font-heading)] text-surface-900 mb-4 md:mb-8">
            Messages
          </h1>

          <div className="bg-white rounded-2xl md:rounded-3xl border border-surface-200 overflow-hidden card-shadow">
            {loading ? (
              <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                {[1, 2, 3].map(n => (
                  <div key={n} className="flex gap-3 md:gap-4">
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
                      <Link href={`/messages/${chat.id}`} className="flex items-center gap-3 md:gap-4 p-3 md:p-6 hover:bg-surface-50 active:bg-surface-100 transition-colors">
                        <img 
                          src={otherUserPhoto} 
                          alt={otherUserName}
                          className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-surface-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5 md:mb-1">
                            <h3 className="font-semibold text-surface-900 text-sm md:text-base truncate">{otherUserName}</h3>
                            <span className="text-[10px] md:text-xs text-surface-400 whitespace-nowrap ml-2 md:ml-4 shrink-0">{timeAgo}</span>
                          </div>
                          <p className="text-xs md:text-sm text-surface-600 truncate mb-0.5 md:mb-1">
                            {chat.listingTitle || 'General Inquiry'}
                          </p>
                          <p className="text-xs md:text-sm text-surface-500 truncate">
                            {chat.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-16 md:py-20 px-4">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4 text-surface-400">
                  <IoChatbubbleEllipsesOutline size={28} />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-surface-900 mb-2">No messages yet</h3>
                <p className="text-sm md:text-base text-surface-500 max-w-sm mx-auto">
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
