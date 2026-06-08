'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { IoPeopleOutline } from 'react-icons/io5';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as User[];
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockUser = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isBlocked: !currentStatus,
        updatedAt: serverTimestamp()
      });
      setUsers(users.map(u => u.uid === userId ? { ...u, isBlocked: !currentStatus } : u));
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
    }
  };

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold font-[var(--font-heading)] text-surface-900 mb-6">
        Manage Users
      </h1>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden card-shadow">
        {loading ? (
          <div className="p-8 text-center text-surface-500">Loading users...</div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-surface-600">
              <thead className="bg-surface-50 border-b border-surface-200 text-surface-700">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {users.map(u => (
                  <tr key={u.uid} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={u.photo || `https://ui-avatars.com/api/?name=${u.name}`} 
                          alt="" 
                          className="w-10 h-10 rounded-full border border-surface-200"
                        />
                        <div>
                          <div className="font-medium text-surface-900">{u.name || 'Unknown'}</div>
                          <div className="text-xs text-surface-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.city ? `${u.city}, ${u.country}` : 'Not set'}
                    </td>
                    <td className="px-6 py-4">
                      {u.isBlocked ? (
                        <Badge variant="danger">Blocked</Badge>
                      ) : u.isVerified ? (
                        <Badge variant="success">Verified</Badge>
                      ) : (
                        <Badge variant="default">Standard</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.createdAt ? u.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        size="sm" 
                        variant={u.isBlocked ? 'primary' : 'danger'} 
                        onClick={() => toggleBlockUser(u.uid, !!u.isBlocked)}
                      >
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <IoPeopleOutline size={48} className="mx-auto text-surface-300 mb-4" />
            <p className="text-surface-500 font-medium">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
