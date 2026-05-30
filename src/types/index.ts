import { Timestamp } from 'firebase/firestore';

// ─── User ───────────────────────────────────────────────
export interface User {
  uid: string;
  email: string;
  name: string;
  photo: string;
  country: string;
  city: string;
  area: string;
  onboardingCompleted: boolean;
  isVerified: boolean;
  isBlocked?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Listing ────────────────────────────────────────────
export type PropertyType = 'Flat' | 'Family' | 'Bachelor' | 'Sublet' | 'Room';
export type AllowedFor = 'family' | 'bachelor' | 'any';
export type ListingStatus = 'active' | 'paused' | 'rented' | 'expired' | 'archived' | 'deleted';
export type ListingDuration = 7 | 15 | 30;

export interface ListingDetails {
  bedrooms: number;
  bathrooms: number;
  balcony: number;
  furnished: boolean;
  floor: string;
}

export interface Listing {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerPhoto?: string;
  propertyType: PropertyType;
  country: string;
  city: string;
  area: string;
  address: string;
  location: { lat: number; lng: number } | null;
  details: ListingDetails;
  allowedFor: AllowedFor;
  monthlyRent: number;
  rentAdvance: number;
  availableFrom: Timestamp;
  contactPhone: string;
  images: string[];
  status: ListingStatus;
  isFeatured: boolean;
  views: number;
  reportedCount: number;
  isVerifiedOwner: boolean;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Favorite ───────────────────────────────────────────
export interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  createdAt: Timestamp;
}

// ─── Verification ───────────────────────────────────────
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type DocumentType = 'national_id' | 'driving_license';

export interface VerificationRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  documentType: DocumentType;
  documentUrl: string;
  status: VerificationStatus;
  reviewedBy: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Chat & Messages ───────────────────────────────────
export interface Chat {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  participantPhotos?: Record<string, string>;
  listingId: string | null;
  listingTitle?: string;
  lastMessage: string;
  lastMessageAt: Timestamp;
  createdAt: Timestamp;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  read: boolean;
  createdAt: Timestamp;
}

// ─── Report ─────────────────────────────────────────────
export type ReportReason = 'fake_listing' | 'scam' | 'wrong_info' | 'already_rented' | 'spam';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved';

export interface Report {
  id: string;
  listingId: string;
  reporterId: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  createdAt: Timestamp;
}

// ─── Location Data ──────────────────────────────────────
export type Country = 'Bangladesh' | 'India' | 'Pakistan';

export interface LocationArea {
  name: string;
}

export interface LocationCity {
  name: string;
  areas: LocationArea[];
}

export interface LocationCountry {
  name: Country;
  cities: LocationCity[];
}
