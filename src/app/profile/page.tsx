'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, deleteDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { Listing, VerificationRequest } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { IoCheckmarkCircle, IoListOutline, IoHeartOutline, IoShieldCheckmarkOutline, IoTimeOutline, IoSettingsOutline, IoLogOutOutline, IoTrashOutline, IoRefreshOutline } from 'react-icons/io5';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'activity' | 'settings'>('listings');

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch user's listings
      const qListings = query(
        collection(db, 'listings'),
        where('ownerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapListings = await getDocs(qListings);
      setMyListings(snapListings.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));

      // Fetch verification status
      const qVer = query(
        collection(db, 'verification_requests'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapVer = await getDocs(qVer);
      if (!snapVer.empty) {
        setVerificationStatus(snapVer.docs[0].data().status);
      } else if (user.isVerified) {
        setVerificationStatus('approved');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateListingStatus = async (id: string, status: Listing['status']) => {
    try {
      let dataToUpdate: any = { status, updatedAt: serverTimestamp() };
      
      // If renewing, extend expiry by 30 days
      if (status === 'active') {
        const now = new Date();
        now.setDate(now.getDate() + 30);
        dataToUpdate.expiresAt = Timestamp.fromDate(now);
      }
      
      await updateDoc(doc(db, 'listings', id), dataToUpdate);
      setMyListings(prev => prev.map(l => l.id === id ? { ...l, ...dataToUpdate, expiresAt: dataToUpdate.expiresAt || l.expiresAt } : l));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await deleteDoc(doc(db, 'listings', id));
      setMyListings(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-surface-50 min-h-screen pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <img 
              src={user.photo || `https://ui-avatars.com/api/?name=${user.name}`} 
              alt={user.name} 
              className="w-24 h-24 rounded-full border-4 border-white card-shadow"
            />
            <div className="flex-1">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <h1 className="text-2xl font-bold font-[var(--font-heading)] text-surface-900">{user.name}</h1>
                {user.isVerified && <IoCheckmarkCircle className="text-verified" size={24} title="Verified User" />}
              </div>
              <p className="text-surface-500 mb-4">{user.email}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Link href="/favorites">
                  <Button variant="outline" size="sm" icon={<IoHeartOutline size={18} />}>
                    Saved Listings
                  </Button>
                </Link>
                {verificationStatus !== 'approved' && (
                  <Link href="/profile/verify">
                    <Button variant="secondary" size="sm" icon={<IoShieldCheckmarkOutline size={18} />}>
                      Get Verified
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" icon={<IoLogOutOutline size={18} />} onClick={() => signOut()} className="text-danger-600 hover:bg-danger-50">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex border-b border-surface-200 mb-8 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'listings' ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}
          >
            My Listings ({myListings.length})
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'activity' ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}
          >
            Activity Feed
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'settings' ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}
          >
            Settings
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-surface-500">Loading...</div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'listings' && (
              myListings.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-surface-200">
                  <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4 text-surface-400">
                    <IoListOutline size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-surface-900 mb-2">No listings yet</h3>
                  <p className="text-surface-500 mb-6 max-w-sm mx-auto">You haven't posted any properties. Share your space and find great tenants.</p>
                  <Link href="/listings/new">
                    <Button>Post a Rental</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myListings.map(listing => (
                    <div key={listing.id} className="bg-white p-4 sm:p-6 rounded-2xl border border-surface-200 flex flex-col sm:flex-row gap-6 items-start">
                      <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden shrink-0 bg-surface-100">
                        <img src={listing.images[0]} alt="Property" className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <Badge variant={
                            listing.status === 'active' ? 'success' : 
                            listing.status === 'rented' ? 'warning' : 'default'
                          } className="uppercase">
                            {listing.status}
                          </Badge>
                          <span className="text-sm font-medium flex items-center gap-1 text-surface-500">
                            👁 {listing.views || 0} views
                          </span>
                        </div>
                        
                        <Link href={`/listings/${listing.id}`} className="hover:underline">
                          <h3 className="text-lg font-bold text-surface-900 truncate">
                            {listing.details.bedrooms} Bed {listing.propertyType} in {listing.area}
                          </h3>
                        </Link>
                        
                        <p className="text-primary-600 font-bold mb-4">৳{listing.monthlyRent.toLocaleString()}/mo</p>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          {listing.status === 'active' && (
                            <Button size="sm" variant="outline" className="bg-warning-50 text-warning-700 border-warning-200 hover:bg-warning-100" onClick={() => updateListingStatus(listing.id, 'rented')}>
                              Mark as Rented
                            </Button>
                          )}
                          {(listing.status === 'rented' || listing.status === 'expired') && (
                            <Button size="sm" variant="outline" icon={<IoRefreshOutline />} onClick={() => updateListingStatus(listing.id, 'active')}>
                              Renew
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-danger-500 hover:bg-danger-50" icon={<IoTrashOutline />} onClick={() => deleteListing(listing.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'activity' && (
              <div className="bg-white rounded-2xl border border-surface-200 p-6">
                <h3 className="font-bold text-surface-900 mb-6">Recent Activity</h3>
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-surface-200 before:to-transparent">
                  {myListings.slice(0, 5).map(listing => (
                    <div key={listing.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary-100 text-primary-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <IoCheckmarkCircle size={20} />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-surface-100 card-shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-surface-900">Listing Published</span>
                          <span className="text-xs text-surface-400">{new Date(listing.createdAt.toDate()).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-surface-500">You published a {listing.propertyType} in {listing.area}.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl border border-surface-200 p-6 max-w-2xl">
                <h3 className="font-bold text-surface-900 mb-6">Profile Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Full Name</label>
                    <input type="text" className="input" defaultValue={user.name} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Email Address</label>
                    <input type="email" className="input bg-surface-50" defaultValue={user.email} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Phone Number</label>
                    <input type="tel" className="input" defaultValue={user.phone || ''} placeholder="e.g. 01712345678" disabled />
                    <p className="text-xs text-surface-500 mt-1">To update details, please contact support.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
