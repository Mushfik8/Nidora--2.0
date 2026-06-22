'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface UnreadContextType {
  unreadCount: number;
}

const UnreadContext = createContext<UnreadContextType>({ unreadCount: 0 });

export function UnreadProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const messageUnsubscribesRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Track per-chat unread counts
    const countsMap: Record<string, number> = {};

    const updateTotal = () => {
      const total = Object.values(countsMap).reduce((sum, c) => sum + c, 0);
      setUnreadCount(total);
    };

    // Cleanup previous message listeners
    const cleanupMessageListeners = () => {
      messageUnsubscribesRef.current.forEach(unsub => unsub());
      messageUnsubscribesRef.current = [];
    };

    // Listen to all chats the user is part of
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribeChats = onSnapshot(chatsQuery, (chatsSnapshot) => {
      cleanupMessageListeners();

      const chatIds = chatsSnapshot.docs.map(d => d.id);
      // Remove counts for chats that no longer exist
      Object.keys(countsMap).forEach(key => {
        if (!chatIds.includes(key)) {
          delete countsMap[key];
        }
      });

      if (chatIds.length === 0) {
        setUnreadCount(0);
        return;
      }

      // For each chat, listen to unread messages not sent by current user
      // We query only unread messages and filter senderId on client side
      // to avoid requiring a composite Firestore index
      chatIds.forEach(chatId => {
        const messagesQuery = query(
          collection(db, 'chats', chatId, 'messages'),
          where('read', '==', false)
        );

        const unsub = onSnapshot(messagesQuery, (messagesSnapshot) => {
          // Filter out messages sent by the current user (only count others' unread)
          const unreadFromOthers = messagesSnapshot.docs.filter(
            d => d.data().senderId !== user.uid
          ).length;
          countsMap[chatId] = unreadFromOthers;
          updateTotal();
        }, (error) => {
          // Silently handle permission errors
          console.error(`Error listening to messages in chat ${chatId}:`, error);
          countsMap[chatId] = 0;
          updateTotal();
        });

        messageUnsubscribesRef.current.push(unsub);
      });
    }, (error) => {
      console.error('Error listening to chats for unread count:', error);
    });

    return () => {
      cleanupMessageListeners();
      unsubscribeChats();
    };
  }, [user]);

  return (
    <UnreadContext.Provider value={{ unreadCount }}>
      {children}
    </UnreadContext.Provider>
  );
}

export const useUnread = () => useContext(UnreadContext);
