'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const baseStyles = 'animate-shimmer';

  const variantStyles = {
    text: 'rounded-md h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={{
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : '100%'),
      }}
    />
  );
}

// Pre-built skeleton patterns
export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden card-shadow">
      <Skeleton height={200} className="rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="80%" />
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width="40%" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Skeleton variant="text" width="30%" height={24} />
          <Skeleton variant="text" width="20%" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton height={60} />
        <Skeleton height={60} />
        <Skeleton height={60} />
      </div>
    </div>
  );
}
