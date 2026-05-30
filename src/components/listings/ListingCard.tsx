'use client';

import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { Listing } from '@/types';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { IoBedOutline, IoWaterOutline, IoLocationOutline, IoHeartOutline, IoHeart, IoCheckmarkCircle } from 'react-icons/io5';

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
  // Freshness Badge Logic
  const daysOld = differenceInDays(new Date(), listing.createdAt.toDate());
  
  let freshnessVariant: 'success' | 'warning' | 'danger' = 'success';
  let freshnessText = 'Fresh';
  
  if (daysOld >= 4 && daysOld <= 10) {
    freshnessVariant = 'warning';
    freshnessText = 'Aging';
  } else if (daysOld > 10) {
    freshnessVariant = 'danger';
    freshnessText = 'Old';
  }

  const timeAgo = formatDistanceToNow(listing.createdAt.toDate(), { addSuffix: true });

  return (
    <Link href={`/listings/${listing.id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden card-shadow transition-all duration-300 group-hover:card-shadow-hover h-full flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-100">
          <img
            src={listing.images[0] || 'https://via.placeholder.com/600x400?text=No+Image'}
            alt={listing.title || 'Property Image'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Top Left Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <Badge variant={freshnessVariant} size="sm" className="shadow-sm backdrop-blur-md bg-white/90">
              {freshnessText}
            </Badge>
            {listing.isFeatured && (
              <Badge variant="info" size="sm" className="shadow-sm backdrop-blur-md bg-white/90">
                Featured
              </Badge>
            )}
          </div>

          {/* Top Right Favorite Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite?.(e);
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-md text-surface-600 hover:text-danger-500 hover:bg-white transition-colors shadow-sm"
          >
            {isFavorite ? <IoHeart className="text-danger-500" size={20} /> : <IoHeartOutline size={20} />}
          </button>
          
          {/* Bottom Price Overlay */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm font-semibold text-surface-900">
            {listing.country === 'Bangladesh' ? '৳' : listing.country === 'India' ? '₹' : 'Rs'} {listing.monthlyRent.toLocaleString()} <span className="text-sm text-surface-500 font-normal">/mo</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-primary-600 uppercase tracking-wider">
              {listing.propertyType}
            </span>
            <span className="text-xs text-surface-400">
              {timeAgo}
            </span>
          </div>
          
          <h3 className="font-semibold text-surface-900 line-clamp-1 mb-1 group-hover:text-primary-600 transition-colors">
            {listing.details.bedrooms} Bed {listing.propertyType} in {listing.area}
          </h3>
          
          <div className="flex items-center text-surface-500 text-sm mb-3">
            <IoLocationOutline className="mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{listing.area}, {listing.city}</span>
          </div>
          
          <div className="flex items-center gap-4 text-surface-600 text-sm mb-4">
            <div className="flex items-center gap-1.5 bg-surface-50 px-2 py-1 rounded-md">
              <IoBedOutline />
              <span>{listing.details.bedrooms} Beds</span>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-50 px-2 py-1 rounded-md">
              <IoWaterOutline />
              <span>{listing.details.bathrooms} Baths</span>
            </div>
          </div>
          
          <div className="mt-auto pt-3 border-t border-surface-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={listing.ownerPhoto || `https://ui-avatars.com/api/?name=${listing.ownerName}&background=f1f5f9`}
                alt={listing.ownerName}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm font-medium text-surface-700 line-clamp-1">
                {listing.ownerName}
              </span>
              {listing.isVerifiedOwner && (
                <IoCheckmarkCircle className="text-verified w-4 h-4" title="Verified Owner" />
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
