'use client';

import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { IoPeopleOutline, IoHomeOutline, IoShieldCheckmarkOutline, IoFlagOutline } from 'react-icons/io5';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    users: 0,
    activeListings: 0,
    pendingVerifications: 0,
    pendingReports: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getCountFromServer(collection(db, 'users'));
        
        const listingsQ = query(collection(db, 'listings'), where('status', '==', 'active'));
        const listingsSnap = await getCountFromServer(listingsQ);
        
        const verifQ = query(collection(db, 'verification_requests'), where('status', '==', 'pending'));
        const verifSnap = await getCountFromServer(verifQ);
        
        const reportsQ = query(collection(db, 'reports'), where('status', '==', 'pending'));
        const reportsSnap = await getCountFromServer(reportsQ);

        setStats({
          users: usersSnap.data().count,
          activeListings: listingsSnap.data().count,
          pendingVerifications: verifSnap.data().count,
          pendingReports: reportsSnap.data().count,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: 'Total Users', count: stats.users, icon: <IoPeopleOutline size={28} />, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { title: 'Active Listings', count: stats.activeListings, icon: <IoHomeOutline size={28} />, color: 'bg-green-50 text-green-600 border-green-100' },
    { title: 'Pending Verifications', count: stats.pendingVerifications, icon: <IoShieldCheckmarkOutline size={28} />, color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { title: 'Pending Reports', count: stats.pendingReports, icon: <IoFlagOutline size={28} />, color: 'bg-red-50 text-red-600 border-red-100' },
  ];

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold font-[var(--font-heading)] text-surface-900 mb-2">
        Dashboard Overview
      </h1>
      <p className="text-surface-500 mb-8">
        Welcome to the Nidora Admin Panel. Here's what's happening today.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className={`p-6 rounded-2xl border ${card.color} flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/50 rounded-xl">
                {card.icon}
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold mb-1">{card.count}</p>
              <p className="text-sm font-medium opacity-80">{card.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
