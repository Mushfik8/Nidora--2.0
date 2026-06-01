'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Listing } from '@/types';
import ListingCard from '@/components/listings/ListingCard';
import { ListingCardSkeleton } from '@/components/ui/Skeleton';
import Select from '@/components/ui/Select';
import { countries, getCitiesForCountry, getAreasForCity } from '@/data/locations';
import { IoSearchOutline, IoFilterOutline, IoHomeOutline } from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // Search State
  const [country, setCountry] = useState('Bangladesh');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [propertyType, setPropertyType] = useState('');

  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    fetchListings();
  }, [country, city, area, propertyType, authLoading]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'listings'),
        where('status', '==', 'active')
      );

      if (country) q = query(q, where('country', '==', country));
      if (city) q = query(q, where('city', '==', city));
      if (area) q = query(q, where('area', '==', area));
      if (propertyType) q = query(q, where('propertyType', '==', propertyType));

      const querySnapshot = await getDocs(q);
      const rawListings = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Listing[];

      const now = new Date();
      
      const fetched = rawListings.filter((listing) => {
        if (!listing || typeof listing !== "object") return false;
        // Client-side Spark expiration check
        if (!listing.expiresAt) return true;
        
        // Firestore Timestamp safety check
        const expiryDate = 
          typeof listing.expiresAt.toDate === "function"
            ? listing.expiresAt.toDate()
            : new Date(listing.expiresAt as any);
            
        return expiryDate > now;
      });

      // Sort client-side to avoid Firebase composite index requirements
      fetched.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return dateB - dateA; // Descending
      });

      setListings(fetched);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setCountry('Bangladesh');
    setCity('');
    setArea('');
    setPropertyType('');
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Mobile Sticky Search Box */}
      <div className="md:hidden sticky top-16 z-30 bg-white border-b border-surface-200 p-3 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          <select className="input h-10 text-sm flex-shrink-0 w-auto" value={city} onChange={e => {setCity(e.target.value); setArea('')}}>
            <option value="">All Cities</option>
            {getCitiesForCountry(country).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <select className="input h-10 text-sm flex-shrink-0 w-auto" value={area} onChange={e => setArea(e.target.value)} disabled={!city}>
            <option value="">All Areas</option>
            {getAreasForCity(country, city).map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
          </select>
          <select className="input h-10 text-sm flex-shrink-0 w-auto" value={propertyType} onChange={e => setPropertyType(e.target.value)}>
            <option value="">All Types</option>
            {['Flat', 'Family', 'Bachelor', 'Sublet', 'Room'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="page-container py-6 md:py-10 max-w-[1440px] w-full mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Main Content (Listings) */}
        <section className="flex-1">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-2xl font-bold font-[var(--font-heading)] text-surface-900 tracking-tight">
              {propertyType ? `${propertyType}s in ${city || country}` : `Recent Properties in ${city || country}`}
            </h2>
            <span className="text-sm font-medium text-surface-500 hidden sm:block">{listings.length} homes</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <ListingCardSkeleton key={n} />
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 pb-20 md:pb-0">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-32">
              <div className="w-20 h-20 bg-surface-50 rounded-full flex items-center justify-center mb-6 text-surface-300">
                <IoHomeOutline size={40} />
              </div>
              <h3 className="text-2xl font-bold font-[var(--font-heading)] text-surface-900 mb-2">No homes found</h3>
              <p className="text-surface-500 max-w-md mx-auto mb-8">
                We couldn't find any exact matches for your search. Try broadening your criteria or exploring nearby areas.
              </p>
              <button onClick={handleClearFilters} className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Clear all filters
              </button>
            </div>
          )}
        </section>

        {/* Desktop Sticky Sidebar */}
        <aside className="hidden md:block w-72 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-surface-200 card-shadow-sm">
              <h3 className="font-bold text-lg text-surface-900 mb-4 flex items-center gap-2">
                <IoSearchOutline /> Search Filters
              </h3>
              
              <div className="space-y-4">
                <Select
                  label="Country"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setCity('');
                    setArea('');
                  }}
                  options={countries.map((c) => ({ value: c.name, label: c.name }))}
                />
                <Select
                  label="City"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setArea('');
                  }}
                  options={getCitiesForCountry(country).map((c) => ({ value: c.name, label: c.name }))}
                  disabled={!country}
                />
                <Select
                  label="Area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  options={getAreasForCity(country, city).map((a) => ({ value: a.name, label: a.name }))}
                  disabled={!city}
                />
                
                <div className="pt-2">
                  <label className="block text-sm font-medium text-surface-700 mb-2">Property Type</label>
                  <div className="flex flex-wrap gap-2">
                    {['Flat', 'Family', 'Bachelor', 'Sublet', 'Room'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setPropertyType(propertyType === type ? '' : type)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                          propertyType === type 
                            ? 'bg-primary-900 border-primary-900 text-white' 
                            : 'bg-white border-surface-200 text-surface-700 hover:border-surface-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {(city || area || propertyType) && (
                <div className="mt-6 pt-4 border-t border-surface-100">
                  <button onClick={handleClearFilters} className="text-sm font-semibold text-danger-600 hover:text-danger-700 w-full text-left transition-colors">
                    Reset filters
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-surface-50 p-6 rounded-3xl border border-surface-200 text-center">
              <h4 className="font-bold text-surface-900 mb-2">Own a property?</h4>
              <p className="text-sm text-surface-500 mb-4">Post it on Nidora and find reliable tenants instantly.</p>
              {/* Note: the FAB covers the actual action, but this is a nice CTA */}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
