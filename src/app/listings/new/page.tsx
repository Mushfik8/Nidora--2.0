'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { countries, getCitiesForCountry, getAreasForCity } from '@/data/locations';
import { uploadImage } from '@/lib/storage';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { IoImageOutline, IoCloseOutline } from 'react-icons/io5';
import { motion } from 'framer-motion';

export default function CreateListingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [propertyType, setPropertyType] = useState('Flat');
  const [country, setCountry] = useState(user?.country || 'Bangladesh');
  const [city, setCity] = useState(user?.city || '');
  const [area, setArea] = useState(user?.area || '');
  const [address, setAddress] = useState('');
  
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [balcony, setBalcony] = useState('0');
  const [furnished, setFurnished] = useState('false');
  const [floor, setFloor] = useState('1st');
  
  const [allowedFor, setAllowedFor] = useState('any');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [rentAdvance, setRentAdvance] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  
  const [contactPhone, setContactPhone] = useState('');
  const [duration, setDuration] = useState('15'); // 7, 15, 30 days
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Limit to 5 images
      const newFiles = [...imageFiles, ...files].slice(0, 5);
      setImageFiles(newFiles);
      
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(newUrls);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);
    
    const newUrls = [...imagePreviewUrls];
    URL.revokeObjectURL(newUrls[index]);
    newUrls.splice(index, 1);
    setImagePreviewUrls(newUrls);
  };

  const validateStep = () => {
    if (step === 1) return propertyType && country && city && area && address;
    if (step === 2) return bedrooms && bathrooms && monthlyRent && contactPhone;
    if (step === 3) return imageFiles.length > 0;
    return false;
  };

  const handleSubmit = async () => {
    if (!user || !validateStep()) return;

    setIsSubmitting(true);
    try {
      // 1. Upload Images
      const imageUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const url = await uploadImage(imageFiles[i], `listings/${user.uid}`, (progress) => {
          setUploadProgress(Math.round(progress));
        });
        imageUrls.push(url);
      }

      // 2. Calculate Dates
      const now = new Date();
      const expiresDate = new Date(now.getTime() + parseInt(duration) * 24 * 60 * 60 * 1000);
      const availableDate = availableFrom ? new Date(availableFrom) : now;

      // 3. Save to Firestore
      const listingData = {
        ownerId: user.uid,
        ownerName: user.name,
        ownerPhoto: user.photo,
        propertyType,
        country,
        city,
        area,
        address,
        location: null, // Placeholder until Maps API
        details: {
          bedrooms: parseInt(bedrooms),
          bathrooms: parseInt(bathrooms),
          balcony: parseInt(balcony),
          furnished: furnished === 'true',
          floor,
        },
        allowedFor,
        monthlyRent: parseInt(monthlyRent),
        rentAdvance: rentAdvance ? parseInt(rentAdvance) : 0,
        availableFrom: Timestamp.fromDate(availableDate),
        contactPhone,
        images: imageUrls,
        status: 'active',
        isFeatured: false,
        views: 0,
        reportedCount: 0,
        isVerifiedOwner: user.isVerified || false,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresDate),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'listings'), listingData);
      
      router.push(`/listings/${docRef.id}`);
    } catch (error) {
      console.error('Error creating listing:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex-1 bg-surface-50 py-10">
        <div className="page-container max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 card-shadow-lg"
          >
            <h1 className="text-2xl font-bold font-[var(--font-heading)] mb-6 text-surface-900">
              Create a Listing
            </h1>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    s <= step ? 'bg-primary-500' : 'bg-surface-200'
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Basic & Location */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <Select
                  label="Property Type"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  options={[
                    { value: 'Flat', label: 'Flat / Apartment' },
                    { value: 'Family', label: 'Family House' },
                    { value: 'Bachelor', label: 'Bachelor Pad' },
                    { value: 'Sublet', label: 'Sublet' },
                    { value: 'Room', label: 'Single Room' },
                  ]}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Select
                    label="Country"
                    value={country}
                    onChange={(e) => { setCountry(e.target.value); setCity(''); setArea(''); }}
                    options={countries.map((c) => ({ value: c.name, label: c.name }))}
                  />
                  <Select
                    label="City"
                    value={city}
                    onChange={(e) => { setCity(e.target.value); setArea(''); }}
                    options={getCitiesForCountry(country).map((c) => ({ value: c.name, label: c.name }))}
                  />
                </div>

                <Select
                  label="Area / Neighborhood"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  options={getAreasForCity(country, city).map((a) => ({ value: a.name, label: a.name }))}
                />

                <Input
                  label="Detailed Address"
                  placeholder="House 12, Road 4, Block C..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />

                <div className="flex justify-end pt-4 border-t border-surface-100">
                  <Button onClick={() => setStep(2)} disabled={!validateStep()}>Next Step</Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Details & Pricing */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  <Input label="Bedrooms" type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
                  <Input label="Bathrooms" type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
                  <Input label="Balcony" type="number" min="0" value={balcony} onChange={(e) => setBalcony(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <Input label="Floor" placeholder="e.g., 5th" value={floor} onChange={(e) => setFloor(e.target.value)} />
                  <Select
                    label="Furnished"
                    value={furnished}
                    onChange={(e) => setFurnished(e.target.value)}
                    options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
                  />
                </div>

                <Select
                  label="Allowed For"
                  value={allowedFor}
                  onChange={(e) => setAllowedFor(e.target.value)}
                  options={[
                    { value: 'any', label: 'Anyone' },
                    { value: 'family', label: 'Family Only' },
                    { value: 'bachelor', label: 'Bachelors Only' },
                  ]}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="Monthly Rent" type="number" min="0" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} />
                  <Input label="Advance / Deposit (Optional)" type="number" min="0" value={rentAdvance} onChange={(e) => setRentAdvance(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="Contact Phone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                  <Input label="Available From" type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
                </div>

                <div className="flex justify-between pt-4 border-t border-surface-100">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => setStep(3)} disabled={!validateStep()}>Next Step</Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Media & Publish */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-2 block">Upload Photos (Max 5)</label>
                  
                  {imagePreviewUrls.length < 5 && (
                    <label className="border-2 border-dashed border-surface-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-50 hover:border-primary-400 transition-colors">
                      <IoImageOutline size={40} className="text-surface-400 mb-2" />
                      <span className="text-sm text-surface-600 font-medium">Click to upload images</span>
                      <span className="text-xs text-surface-400 mt-1">PNG, JPG, WEBP up to 5MB</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  )}

                  {imagePreviewUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {imagePreviewUrls.map((url, idx) => (
                        <div key={idx} className="relative aspect-[4/3] rounded-lg overflow-hidden group">
                          <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <IoCloseOutline size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Select
                  label="Listing Duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  options={[
                    { value: '7', label: '7 Days' },
                    { value: '15', label: '15 Days (Recommended)' },
                    { value: '30', label: '30 Days' },
                  ]}
                  hint="The listing will automatically expire after this period."
                />

                {isSubmitting && (
                  <div className="w-full bg-surface-100 rounded-full h-2 mt-4 overflow-hidden">
                    <div className="bg-primary-500 h-2 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}

                <div className="flex justify-between pt-6 border-t border-surface-100">
                  <Button variant="ghost" onClick={() => setStep(2)} disabled={isSubmitting}>Back</Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!validateStep() || isSubmitting} 
                    isLoading={isSubmitting}
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish Listing'}
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  );
}
