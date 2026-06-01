'use client';

import { formatDistanceToNow } from 'date-fns';
import { Listing } from '@/types';
import Link from 'next/link';
import { IoLocationOutline, IoHeartOutline, IoHeart, IoCheckmarkCircle } from 'react-icons/io5';

interface ListingCardProps {
  listing: Listing;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

export default function ListingCard({
  listing,
  isFavorite = false,
  onToggleFavorite,
}: ListingCardProps) {
  const timeAgo = formatDistanceToNow(listing.createdAt.toDate(), { addSuffix: true });

  return (
    <Link href={`/listings/${listing.id}`} className="block group">
      <div className="bg-transparent flex flex-col group hover:-translate-y-1 transition-transform duration-300">
        
        {/* Image Container */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-100 rounded-[20px] mb-3">
          <img
            src={listing.images[0] || 'https://via.placeholder.com/600x400?text=No+Image'}
            alt={`${listing.propertyType} in ${listing.area}`}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Top Right Favorite Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite?.(e);
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md text-surface-600 hover:text-danger-500 hover:scale-110 active:scale-95 transition-all shadow-sm z-10"
          >
            {isFavorite ? <IoHeart className="text-danger-500" size={20} /> : <IoHeartOutline size={20} />}
          </button>
        </div>

        {/* Content */}
        <div className="px-1 flex flex-col">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className="font-semibold text-surface-900 text-lg line-clamp-1 leading-tight group-hover:text-primary-600 transition-colors">
              {listing.area}, {listing.city}
            </h3>
            <span className="text-sm font-medium flex items-center gap-1 text-surface-500 shrink-0">
              👁 {listing.views || 0}
            </span>
          </div>
          
          <div className="flex items-center text-surface-500 text-sm mb-1.5">
            <span className="line-clamp-1">{listing.details.bedrooms} Beds · {listing.propertyType}</span>
          </div>

          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-surface-900">
              {listing.country === 'Bangladesh' ? '৳' : listing.country === 'India' ? '₹' : 'Rs'} {listing.monthlyRent.toLocaleString()}
            </span>
            <span className="text-sm text-surface-500">/mo</span>
          </div>
          
          <div className="mt-3 flex items-center gap-2">
            <img
              src={listing.ownerPhoto || `https://ui-avatars.com/api/?name=${listing.ownerName}&background=f1f5f9`}
              alt={listing.ownerName}
              className="w-5 h-5 rounded-full"
            />
            <span className="text-xs font-medium text-surface-600 line-clamp-1">
              {listing.ownerName}
            </span>
            {listing.isVerifiedOwner && (
              <IoCheckmarkCircle className="text-verified w-3.5 h-3.5 -ml-1" title="Verified Owner" />
            )}
            <span className="text-xs text-surface-400 ml-auto">{timeAgo}</span>
          </div>
        </div>
        
      </div>
    </Link>
  );
}
