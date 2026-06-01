'use client';

import { useEffect, useState, useRef, use } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import { Chat, Message } from '@/types';
import Button from '@/components/ui/Button';
import { IoSend, IoChevronBack, IoCheckmarkCircle } from 'react-icons/io5';
import Link from 'next/link';

export default function ChatThreadPage({ params }: { params: Promise<{ chatId: string }> }) {
  const resolvedParams = use(params);
  const { chatId } = resolvedParams;
  const { user } = useAuth();
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUserVerified, setOtherUserVerified] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch Chat Meta
    const fetchChat = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'chats', chatId));
      if (docSnap.exists()) {
        const chatData = { id: docSnap.id, ...docSnap.data() } as Chat;
        // Verify user is part of chat
        if (!chatData.participants.includes(user.uid)) {
          window.location.href = '/messages';
          return;
        }
        setChat(chatData);

        // Check if other user is verified
        const otherId = chatData.participants.find(id => id !== user.uid);
        if (otherId) {
          const otherUserDoc = await getDoc(doc(db, 'users', otherId));
          if (otherUserDoc.exists() && otherUserDoc.data().isVerified) {
            setOtherUserVerified(true);
          }
        }
      }
      } catch (error) {
        console.error('Error fetching chat meta:', error);
        window.location.href = '/messages';
      }
    };
    fetchChat();

    // Listen to Messages
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(loadedMessages);
      setLoading(false);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Mark messages as read
      snapshot.docs.forEach(msgDoc => {
        const msg = msgDoc.data() as Message;
        if (msg.senderId !== user.uid && !msg.read) {
          updateDoc(doc(db, 'chats', chatId, 'messages', msgDoc.id), { read: true });
        }
      });
    }, (error) => {
      console.error('Error listening to chat messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chat) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      // 1. Add message to subcollection
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        text,
        read: false,
        createdAt: serverTimestamp()
      });

      // 2. Update chat metadata
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastMessageAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!chat) return null;

  const otherUserId = chat.participants.find(id => id !== user?.uid) || '';
  const otherUserName = chat.participantNames?.[otherUserId] || 'User';
  const otherUserPhoto = chat.participantPhotos?.[otherUserId] || `https://ui-avatars.com/api/?name=${otherUserName}`;

  return (
    <AuthGuard>
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] bg-surface-50">
        <div className="flex-1 page-container max-w-4xl py-6 flex flex-col h-full">
          
          <div className="flex-1 flex flex-col bg-white rounded-3xl border border-surface-200 card-shadow overflow-hidden h-full">
            {/* Chat Header */}
            <div className="h-20 px-6 border-b border-surface-200 flex items-center gap-4 bg-white z-10 shrink-0">
              <Link href="/messages" className="text-surface-500 hover:text-surface-900 md:hidden">
                <IoChevronBack size={24} />
              </Link>
              <img src={otherUserPhoto} alt={otherUserName} className="w-10 h-10 rounded-full" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-semibold text-surface-900">{otherUserName}</h2>
                  {otherUserVerified && <IoCheckmarkCircle className="text-verified" size={16} title="Verified User" />}
                </div>
                {chat.listingId && (
                  <Link href={`/listings/${chat.listingId}`} className="text-xs text-primary-600 hover:underline">
                    {chat.listingTitle || 'View Listing'}
                  </Link>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-50">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-surface-400 text-sm">
                  Say hi to {otherUserName}!
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.uid;
                  const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId === user?.uid);
                  
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
                      <div className={`flex max-w-[75%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        
                        {!isMe && (
                          <div className="w-8 shrink-0">
                            {showAvatar && <img src={otherUserPhoto} className="w-8 h-8 rounded-full" />}
                          </div>
                        )}
                        
                        <div className={`
                          px-4 py-2 rounded-2xl
                          ${isMe ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white border border-surface-200 text-surface-900 rounded-bl-sm shadow-sm'}
                        `}>
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          <div className={`text-[10px] mt-1 ${isMe ? 'text-primary-100 text-right' : 'text-surface-400 text-left'}`}>
                            {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-surface-200 shrink-0 flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-surface-100 rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-600 text-white disabled:opacity-50 disabled:bg-surface-300 transition-colors"
              >
                <IoSend size={18} className="ml-1" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </AuthGuard>
  );
}
