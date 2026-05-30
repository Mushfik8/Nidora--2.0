'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Listing } from '@/types';
import ListingCard from '@/components/listings/ListingCard';
import { ListingCardSkeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { countries, getCitiesForCountry, getAreasForCity } from '@/data/locations';
import { IoSearchOutline, IoFilterOutline } from 'react-icons/io5';

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // Search State
  const [country, setCountry] = useState('Bangladesh');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [propertyType, setPropertyType] = useState('');

  useEffect(() => {
    fetchListings();
  }, [country, city, area, propertyType]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'listings'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      // Filters
      if (country) q = query(q, where('country', '==', country));
      if (city) q = query(q, where('city', '==', city));
      if (area) q = query(q, where('area', '==', area));
      if (propertyType) q = query(q, where('propertyType', '==', propertyType));

      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Listing[];

      setListings(fetched);
    } catch (error) {
      console.error('Error fetching listings:', error);
      // Fallback empty state for now
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
    <div className="flex-1 flex flex-col bg-surface-50">
      {/* Hero Search Section */}
      <section className="bg-white border-b border-surface-200 pt-10 pb-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold font-[var(--font-heading)] text-surface-900 tracking-tight">
              Find verified homes directly.
            </h1>
            <p className="text-lg text-surface-500 max-w-2xl mx-auto">
              Skip the middleman. Discover flats, sublets, and family rentals in your city with trusted, verified owners.
            </p>
          </div>

          {/* Search Box */}
          <div className="bg-white p-2 rounded-2xl card-shadow-lg border border-surface-100 flex flex-col md:flex-row gap-2">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
              <Select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setCity('');
                  setArea('');
                }}
                options={countries.map((c) => ({ value: c.name, label: c.name }))}
                placeholder="Country"
                className="bg-transparent border-none shadow-none focus:ring-0 focus:bg-surface-50 h-12"
              />
              <Select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setArea('');
                }}
                options={getCitiesForCountry(country).map((c) => ({
                  value: c.name,
                  label: c.name,
                }))}
                placeholder="Any City"
                className="bg-transparent border-none shadow-none focus:ring-0 focus:bg-surface-50 h-12 border-l border-surface-100"
              />
              <Select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                options={getAreasForCity(country, city).map((a) => ({
                  value: a.name,
                  label: a.name,
                }))}
                placeholder="Any Area"
                className="bg-transparent border-none shadow-none focus:ring-0 focus:bg-surface-50 h-12 border-l border-surface-100"
              />
            </div>
            <Button size="lg" className="h-12 px-8 rounded-xl shrink-0" onClick={fetchListings} icon={<IoSearchOutline size={20} />}>
              Search
            </Button>
          </div>
          
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {['Flat', 'Family', 'Bachelor', 'Sublet', 'Room'].map((type) => (
              <button
                key={type}
                onClick={() => setPropertyType(propertyType === type ? '' : type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  propertyType === type 
                    ? 'bg-primary-50 border-primary-500 text-primary-700' 
                    : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="page-container py-10 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-[var(--font-heading)] text-surface-900">
            {propertyType ? `${propertyType}s in ${city || country}` : `Latest Properties in ${city || country}`}
          </h2>
          <Button variant="ghost" size="sm" icon={<IoFilterOutline size={18} />}>
            More Filters
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <ListingCardSkeleton key={n} />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-surface-200 border-dashed">
            <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4 text-surface-400">
              <IoSearchOutline size={32} />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 mb-2">No listings found</h3>
            <p className="text-surface-500 max-w-md mx-auto mb-6">
              We couldn't find any properties matching your current filters. Try adjusting your search criteria or clearing filters.
            </p>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
