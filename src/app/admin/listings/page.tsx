'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Listing } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { IoHomeOutline } from 'react-icons/io5';
import Link from 'next/link';

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const q = query(collection(db, 'listings'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Listing[];
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateListingStatus = async (listingId: string, newStatus: Listing['status']) => {
    try {
      await updateDoc(doc(db, 'listings', listingId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setListings(listings.map(l => l.id === listingId ? { ...l, status: newStatus } : l));
    } catch (error) {
      console.error('Error updating listing:', error);
    }
  };

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold font-[var(--font-heading)] text-surface-900 mb-6">
        Manage Listings
      </h1>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden card-shadow">
        {loading ? (
          <div className="p-8 text-center text-surface-500">Loading listings...</div>
        ) : listings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-surface-600">
              <thead className="bg-surface-50 border-b border-surface-200 text-surface-700">
                <tr>
                  <th className="px-6 py-4 font-medium">Property</th>
                  <th className="px-6 py-4 font-medium">Owner</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {listings.map(l => (
                  <tr key={l.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={l.images?.[0] || 'https://via.placeholder.com/150'} 
                          alt="" 
                          className="w-12 h-12 rounded-lg object-cover border border-surface-200"
                        />
                        <div>
                          <Link href={`/listings/${l.id}`} className="font-medium text-surface-900 hover:text-primary-600 hover:underline">
                            {l.details.bedrooms} Bed {l.propertyType}
                          </Link>
                          <div className="text-xs text-surface-500">{l.area}, {l.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-surface-900">{l.ownerName}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {l.monthlyRent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        l.status === 'active' ? 'success' : 
                        l.status === 'pending' ? 'warning' : 
                        l.status === 'deleted' ? 'danger' : 'default'
                      } className="capitalize">
                        {l.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {l.status !== 'deleted' && (
                        <Button 
                          size="sm" 
                          variant="danger" 
                          onClick={() => updateListingStatus(l.id, 'deleted')}
                        >
                          Delete
                        </Button>
                      )}
                      {l.status === 'deleted' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => updateListingStatus(l.id, 'active')}
                        >
                          Restore
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <IoHomeOutline size={48} className="mx-auto text-surface-300 mb-4" />
            <p className="text-surface-500 font-medium">No listings found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
