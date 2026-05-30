'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import ListingCard from '@/components/listings/ListingCard';
import { ListingCardSkeleton } from '@/components/ui/Skeleton';
import { Listing } from '@/types';
import Button from '@/components/ui/Button';
import { IoHeartOutline } from 'react-icons/io5';
import Link from 'next/link';

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<{ id: string; listing: Listing }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'favorites'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      
      const loadedFavorites: { id: string; listing: Listing }[] = [];
      
      for (const favoriteDoc of snap.docs) {
        const data = favoriteDoc.data();
        const listingDoc = await getDoc(doc(db, 'listings', data.listingId));
        if (listingDoc.exists()) {
          loadedFavorites.push({
            id: favoriteDoc.id,
            listing: { id: listingDoc.id, ...listingDoc.data() } as Listing
          });
        }
      }
      
      setFavorites(loadedFavorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await deleteDoc(doc(db, 'favorites', favoriteId));
      setFavorites(favorites.filter(f => f.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  return (
    <AuthGuard>
      <div className="flex-1 bg-surface-50 py-10">
        <div className="page-container">
          <h1 className="text-3xl font-bold font-[var(--font-heading)] text-surface-900 mb-2">
            Your Saved Properties
          </h1>
          <p className="text-surface-500 mb-8">
            Keep track of the homes you love.
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <ListingCardSkeleton key={n} />
              ))}
            </div>
          ) : favorites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map(({ id, listing }) => (
                <ListingCard 
                  key={id} 
                  listing={listing} 
                  isFavorite={true}
                  onToggleFavorite={(e) => removeFavorite(id, e)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-surface-200 border-dashed max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4 text-surface-400">
                <IoHeartOutline size={32} />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">No saved properties yet</h3>
              <p className="text-surface-500 max-w-md mx-auto mb-6">
                When you see a property you like, click the heart icon to save it here for later.
              </p>
              <Link href="/">
                <Button>Browse Listings</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
