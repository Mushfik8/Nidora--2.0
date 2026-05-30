'use client';

import { useEffect, useState, use } from 'react';
import { doc, getDoc, updateDoc, increment, deleteDoc, collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Listing } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import ReportModal from '@/components/listings/ReportModal';
import { 
  IoLocationOutline, IoBedOutline, IoWaterOutline, IoHeartOutline, IoHeart, 
  IoShareOutline, IoCheckmarkCircle, IoInformationCircleOutline, IoCallOutline, IoChatbubbleOutline
} from 'react-icons/io5';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { user } = useAuth();
  const router = useRouter();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

  useEffect(() => {
    if (user && listing) checkFavorite();
  }, [user, listing]);

  const fetchListing = async () => {
    try {
      const docRef = doc(db, 'listings', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Listing;
        setListing(data);
        
        // Increment views if not owner
        if (user?.uid !== data.ownerId) {
          await updateDoc(docRef, { views: increment(1) });
        }
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    if (!user || !listing) return;
    const q = query(collection(db, 'favorites'), where('userId', '==', user.uid), where('listingId', '==', listing.id));
    const snap = await getDocs(q);
    if (!snap.empty) {
      setIsFavorite(true);
      setFavoriteId(snap.docs[0].id);
    }
  };

  const toggleFavorite = async () => {
    if (!user) return router.push('/onboarding'); // or login
    if (!listing) return;
    
    try {
      if (isFavorite && favoriteId) {
        await deleteDoc(doc(db, 'favorites', favoriteId));
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        const ref = await addDoc(collection(db, 'favorites'), {
          userId: user.uid,
          listingId: listing.id,
          createdAt: serverTimestamp()
        });
        setIsFavorite(true);
        setFavoriteId(ref.id);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleContactOwner = async () => {
    if (!user) return router.push('/');
    if (!listing) return;

    setActionLoading(true);
    try {
      // Check if chat already exists
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      const snap = await getDocs(q);
      
      let existingChatId = null;
      snap.forEach(doc => {
        const data = doc.data();
        if (data.participants.includes(listing.ownerId) && data.listingId === listing.id) {
          existingChatId = doc.id;
        }
      });

      if (existingChatId) {
        router.push(`/messages/${existingChatId}`);
      } else {
        // Create new chat
        const chatRef = await addDoc(collection(db, 'chats'), {
          participants: [user.uid, listing.ownerId],
          participantNames: {
            [user.uid]: user.name,
            [listing.ownerId]: listing.ownerName
          },
          participantPhotos: {
            [user.uid]: user.photo,
            [listing.ownerId]: listing.ownerPhoto
          },
          listingId: listing.id,
          listingTitle: `${listing.details.bedrooms} Bed ${listing.propertyType} in ${listing.area}`,
          lastMessage: '',
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        router.push(`/messages/${chatRef.id}`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      setActionLoading(false);
    }
  };

  // Owner Actions
  const updateStatus = async (newStatus: Listing['status']) => {
    if (!listing) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'listings', listing.id), { status: newStatus, updatedAt: serverTimestamp() });
      setListing({ ...listing, status: newStatus });
    } finally {
      setActionLoading(false);
    }
  };

  const renewListing = async () => {
    if (!listing) return;
    setActionLoading(true);
    try {
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 15); // Renew for 15 days
      await updateDoc(doc(db, 'listings', listing.id), { 
        status: 'active', 
        expiresAt: Timestamp.fromDate(newExpiresAt),
        updatedAt: serverTimestamp() 
      });
      setListing({ ...listing, status: 'active', expiresAt: Timestamp.fromDate(newExpiresAt) });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container py-8 max-w-5xl">
        <Skeleton height={400} className="rounded-2xl mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Skeleton height={40} width="80%" />
            <Skeleton height={20} width="40%" />
            <Skeleton height={100} />
          </div>
          <div className="space-y-4">
            <Skeleton height={200} />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="page-container py-20 text-center">
        <h1 className="text-2xl font-bold text-surface-900">Listing not found</h1>
        <p className="text-surface-500 mt-2">The property may have been removed or is no longer available.</p>
        <Button className="mt-6" onClick={() => router.push('/')}>Back to Browse</Button>
      </div>
    );
  }

  const isOwner = user?.uid === listing.ownerId;
  const daysOld = differenceInDays(new Date(), listing.createdAt.toDate());
  
  let freshnessVariant: 'success' | 'warning' | 'danger' = 'success';
  let freshnessText = 'Fresh Listing';
  if (daysOld >= 4 && daysOld <= 10) { freshnessVariant = 'warning'; freshnessText = 'Aging Listing'; } 
  else if (daysOld > 10) { freshnessVariant = 'danger'; freshnessText = 'Old Listing'; }

  return (
    <div className="bg-surface-50 min-h-screen">
      <div className="page-container py-8 max-w-5xl">
        
        {/* Status Banner */}
        {listing.status !== 'active' && (
          <div className="mb-6 bg-warning-500/10 border border-warning-500/20 text-warning-700 p-4 rounded-xl flex items-center gap-2">
            <IoInformationCircleOutline size={20} />
            <span className="font-medium">
              This listing is currently <strong className="uppercase">{listing.status}</strong>. 
              {isOwner ? " Use the controls on the right to manage it." : " It may no longer be available."}
            </span>
          </div>
        )}

        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 h-[40vh] md:h-[50vh] rounded-2xl overflow-hidden">
          <div className="bg-surface-200 w-full h-full">
            <img src={listing.images[0]} alt="Property" className="w-full h-full object-cover" />
          </div>
          <div className="hidden md:grid grid-cols-2 grid-rows-2 gap-4">
            {listing.images.slice(1, 5).map((url, idx) => (
              <div key={idx} className="bg-surface-200 w-full h-full rounded-xl overflow-hidden">
                <img src={url} alt={`Property ${idx+2}`} className="w-full h-full object-cover" />
              </div>
            ))}
            {/* Fill empty spots if less than 5 images */}
            {Array.from({ length: Math.max(0, 4 - (listing.images.length - 1)) }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-surface-100 w-full h-full rounded-xl" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant={freshnessVariant}>{freshnessText}</Badge>
                <Badge variant="default" className="uppercase">{listing.propertyType}</Badge>
                {listing.isFeatured && <Badge variant="info">Featured</Badge>}
                <span className="text-sm text-surface-500 ml-auto">
                  Posted {formatDistanceToNow(listing.createdAt.toDate(), { addSuffix: true })}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold font-[var(--font-heading)] text-surface-900 mb-2">
                {listing.details.bedrooms} Bed {listing.propertyType} in {listing.area}
              </h1>
              
              <div className="flex items-center text-surface-500 gap-1 mb-6">
                <IoLocationOutline size={18} />
                <span>{listing.address}, {listing.area}, {listing.city}, {listing.country}</span>
              </div>

              <div className="flex items-center gap-6 py-6 border-y border-surface-200">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-surface-900">{listing.details.bedrooms}</p>
                  <p className="text-sm text-surface-500">Bedrooms</p>
                </div>
                <div className="w-px h-10 bg-surface-200" />
                <div className="text-center">
                  <p className="text-2xl font-semibold text-surface-900">{listing.details.bathrooms}</p>
                  <p className="text-sm text-surface-500">Bathrooms</p>
                </div>
                <div className="w-px h-10 bg-surface-200" />
                <div className="text-center">
                  <p className="text-2xl font-semibold text-surface-900">{listing.details.balcony}</p>
                  <p className="text-sm text-surface-500">Balconies</p>
                </div>
                <div className="w-px h-10 bg-surface-200" />
                <div className="text-center">
                  <p className="text-2xl font-semibold text-surface-900">{listing.details.floor}</p>
                  <p className="text-sm text-surface-500">Floor</p>
                </div>
              </div>
            </div>

            {/* Details List */}
            <div>
              <h2 className="text-xl font-bold font-[var(--font-heading)] mb-4">Property Details</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                <li className="flex justify-between border-b border-surface-100 pb-2">
                  <span className="text-surface-500">Furnished</span>
                  <span className="font-medium text-surface-900">{listing.details.furnished ? 'Yes' : 'No'}</span>
                </li>
                <li className="flex justify-between border-b border-surface-100 pb-2">
                  <span className="text-surface-500">Allowed For</span>
                  <span className="font-medium text-surface-900 capitalize">{listing.allowedFor}</span>
                </li>
                <li className="flex justify-between border-b border-surface-100 pb-2">
                  <span className="text-surface-500">Available From</span>
                  <span className="font-medium text-surface-900">
                    {listing.availableFrom ? new Date(listing.availableFrom.toDate()).toLocaleDateString() : 'Immediately'}
                  </span>
                </li>
                <li className="flex justify-between border-b border-surface-100 pb-2">
                  <span className="text-surface-500">Property Views</span>
                  <span className="font-medium text-surface-900">{listing.views}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl card-shadow border border-surface-100 sticky top-24">
              <div className="mb-6 pb-6 border-b border-surface-100">
                <p className="text-surface-500 text-sm mb-1">Monthly Rent</p>
                <p className="text-3xl font-bold text-primary-600">
                  {listing.country === 'Bangladesh' ? '৳' : listing.country === 'India' ? '₹' : 'Rs'} 
                  {listing.monthlyRent.toLocaleString()}
                </p>
                {listing.rentAdvance > 0 && (
                  <p className="text-sm text-surface-500 mt-2">
                    Advance: {listing.rentAdvance.toLocaleString()}
                  </p>
                )}
              </div>

              {!isOwner ? (
                <div className="space-y-3">
                  <Button 
                    fullWidth 
                    size="lg" 
                    icon={<IoChatbubbleOutline size={20} />}
                    onClick={handleContactOwner}
                    isLoading={actionLoading}
                  >
                    Message Owner
                  </Button>
                  <Button 
                    fullWidth 
                    variant="outline" 
                    size="lg" 
                    icon={<IoCallOutline size={20} />}
                    onClick={() => alert(`Call Owner: ${listing.contactPhone}`)}
                  >
                    Show Phone Number
                  </Button>
                  <div className="flex gap-3 pt-3">
                    <Button 
                      className="flex-1" 
                      variant="ghost" 
                      icon={isFavorite ? <IoHeart className="text-danger-500" size={20} /> : <IoHeartOutline size={20} />}
                      onClick={toggleFavorite}
                    >
                      {isFavorite ? 'Saved' : 'Save'}
                    </Button>
                    <Button className="flex-1" variant="ghost" icon={<IoShareOutline size={20} />}>
                      Share
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-surface-900 mb-2">Owner Controls</p>
                  
                  {listing.status === 'active' && (
                    <Button fullWidth variant="outline" onClick={() => updateStatus('paused')} isLoading={actionLoading}>
                      Pause Listing
                    </Button>
                  )}
                  {listing.status === 'paused' && (
                    <Button fullWidth variant="primary" onClick={() => updateStatus('active')} isLoading={actionLoading}>
                      Resume Listing
                    </Button>
                  )}
                  
                  {(listing.status === 'active' || listing.status === 'paused') && (
                    <Button fullWidth variant="secondary" className="bg-success-500/10 text-success-700 hover:bg-success-500/20" onClick={() => updateStatus('rented')} isLoading={actionLoading}>
                      Mark as Rented
                    </Button>
                  )}
                  
                  {(listing.status === 'expired' || listing.status === 'archived' || listing.status === 'rented') && (
                    <Button fullWidth variant="primary" onClick={renewListing} isLoading={actionLoading}>
                      Renew Listing
                    </Button>
                  )}
                  
                  <Button fullWidth variant="danger" onClick={() => updateStatus('deleted')} isLoading={actionLoading}>
                    Delete Listing
                  </Button>
                </div>
              )}
            </div>

            {/* Owner Profile Snippet */}
            <div className="bg-white p-6 rounded-2xl card-shadow border border-surface-100">
              <p className="text-sm font-medium text-surface-500 mb-4">Listed by</p>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={listing.ownerPhoto || `https://ui-avatars.com/api/?name=${listing.ownerName}`}
                  alt={listing.ownerName}
                  className="w-14 h-14 rounded-full border border-surface-200"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-surface-900">{listing.ownerName}</p>
                    {listing.isVerifiedOwner && <IoCheckmarkCircle className="text-verified" size={18} title="Verified User" />}
                  </div>
                  <p className="text-sm text-surface-500">
                    {listing.isVerifiedOwner ? 'Identity Verified' : 'Unverified User'}
                  </p>
                </div>
              </div>
              
              {!isOwner && (
                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className="text-xs text-surface-400 hover:text-danger-500 transition-colors w-full text-center mt-2"
                >
                  Report this listing
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        listingId={listing.id} 
      />
    </div>
  );
}
