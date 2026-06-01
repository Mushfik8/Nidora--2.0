'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { countries, getCitiesForCountry, getAreasForCity } from '@/data/locations';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { compressImage } from '@/lib/imageCompression';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { IoImageOutline, IoCloseOutline, IoCheckmarkCircleOutline, IoArrowForwardOutline, IoArrowBackOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';



export default function CreateListingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
  
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [duration, setDuration] = useState('15');
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem('nidora_listing_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.propertyType) setPropertyType(parsed.propertyType);
        if (parsed.country) setCountry(parsed.country);
        if (parsed.city) setCity(parsed.city);
        if (parsed.area) setArea(parsed.area);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.monthlyRent) setMonthlyRent(parsed.monthlyRent);
        if (parsed.contactPhone) setContactPhone(parsed.contactPhone);
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  }, []);

  // Save draft periodically
  useEffect(() => {
    const draft = { propertyType, country, city, area, address, monthlyRent, contactPhone };
    localStorage.setItem('nidora_listing_draft', JSON.stringify(draft));
  }, [propertyType, country, city, area, address, monthlyRent, contactPhone]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const remainingSlots = 10 - imageFiles.length;
      const filesToAdd = files.slice(0, remainingSlots);
      
      // Compress immediately
      const compressedFiles = await Promise.all(filesToAdd.map(compressImage));
      
      const newFiles = [...imageFiles, ...compressedFiles];
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
    if (step === 1) return propertyType !== '';
    if (step === 2) return country && city && area && address;
    if (step === 3) return bedrooms && bathrooms && monthlyRent && contactPhone;
    if (step === 4) return imageFiles.length > 0;
    if (step === 5) return duration;
    return false;
  };

  const nextStep = () => { if (validateStep()) setStep(s => s + 1); };
  const prevStep = () => { setStep(s => Math.max(1, s - 1)); };

  const handleSubmit = async () => {
    if (!user || !validateStep()) return;
    setIsSubmitting(true);
    try {
      // 1. Upload Images
      const imageUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const url = await uploadToCloudinary(imageFiles[i], {
          folder: `nidora/listings/${user.uid}`,
          onProgress: (progress) => setUploadProgress(Math.round(progress))
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
        location: null,
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
      
      // Track Analytics
      try {
        await addDoc(collection(db, 'analytics_events'), {
          eventName: 'listing_created',
          userId: user.uid,
          listingId: docRef.id,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.error('Analytics failed', e);
      }

      // Clear draft
      localStorage.removeItem('nidora_listing_draft');
      
      toast.success('Listing published successfully!');
      router.push(`/listings/${docRef.id}`);
    } catch (error) {
      console.error('CRITICAL FAILURE:', error);
      setIsSubmitting(false);
      toast.error(`Publishing failed. Please check your network or image file size.`);
    }
  };

  const steps = [
    { id: 1, title: 'Property Type' },
    { id: 2, title: 'Location' },
    { id: 3, title: 'Details & Rent' },
    { id: 4, title: 'Photos' },
    { id: 5, title: 'Review & Publish' }
  ];

  return (
    <AuthGuard>
      <div className="flex-1 bg-white md:bg-surface-50 py-0 md:py-10 pb-24 md:pb-10 min-h-screen">
        <div className="page-container max-w-2xl px-4 md:px-0 h-full">
          
          <div className="bg-white md:rounded-3xl md:p-8 md:card-shadow-lg h-full flex flex-col">
            {/* Header & Progress */}
            <div className="mb-8 pt-4 md:pt-0">
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={prevStep} 
                  className={`p-2 rounded-full hover:bg-surface-100 transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  <IoArrowBackOutline size={24} />
                </button>
                <span className="font-bold font-[var(--font-heading)] text-surface-900">Step {step} of 5</span>
                <div className="w-10" /> {/* Spacer */}
              </div>
              
              <h1 className="text-3xl font-bold font-[var(--font-heading)] mb-6 text-surface-900">
                {steps[step-1].title}
              </h1>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      s <= step ? 'bg-primary-900' : 'bg-surface-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    {['Flat', 'Family', 'Bachelor', 'Sublet', 'Room'].map((type) => (
                      <div 
                        key={type}
                        onClick={() => setPropertyType(type)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          propertyType === type ? 'border-primary-900 bg-primary-50' : 'border-surface-200 hover:border-surface-300'
                        }`}
                      >
                        <span className="font-medium text-surface-900">{type}</span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          propertyType === type ? 'border-primary-900 bg-primary-900' : 'border-surface-300'
                        }`}>
                          {propertyType === type && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                    <Select label="Country" value={country} onChange={(e) => { setCountry(e.target.value); setCity(''); setArea(''); }} options={countries.map((c) => ({ value: c.name, label: c.name }))} />
                    <Select label="City" value={city} onChange={(e) => { setCity(e.target.value); setArea(''); }} options={getCitiesForCountry(country).map((c) => ({ value: c.name, label: c.name }))} disabled={!country} />
                    <Select label="Area / Neighborhood" value={area} onChange={(e) => setArea(e.target.value)} options={getAreasForCity(country, city).map((a) => ({ value: a.name, label: a.name }))} disabled={!city} />
                    <Input label="Detailed Address" placeholder="House 12, Road 4, Block C..." value={address} onChange={(e) => setAddress(e.target.value)} />
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                    <div className="grid grid-cols-3 gap-3">
                      <Input label="Beds" type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
                      <Input label="Baths" type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
                      <Input label="Balcony" type="number" min="0" value={balcony} onChange={(e) => setBalcony(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Floor" placeholder="e.g., 5th" value={floor} onChange={(e) => setFloor(e.target.value)} />
                      <Select label="Furnished" value={furnished} onChange={(e) => setFurnished(e.target.value)} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
                    </div>
                    <Select label="Allowed For" value={allowedFor} onChange={(e) => setAllowedFor(e.target.value)} options={[{ value: 'any', label: 'Anyone' }, { value: 'family', label: 'Family Only' }, { value: 'bachelor', label: 'Bachelors Only' }]} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Monthly Rent (৳)" type="number" min="0" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} />
                      <Input label="Advance (Optional)" type="number" min="0" value={rentAdvance} onChange={(e) => setRentAdvance(e.target.value)} />
                    </div>
                    <Input label="Contact Phone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div>
                      <p className="text-surface-500 mb-4">Upload up to 10 clear photos of your property. We automatically compress them for fast loading.</p>
                      
                      {imagePreviewUrls.length < 10 && (
                        <label className="border-2 border-dashed border-surface-300 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-50 hover:border-primary-900 transition-colors">
                          <IoImageOutline size={48} className="text-surface-300 mb-4" />
                          <span className="text-base text-surface-900 font-bold mb-1">Add Photos</span>
                          <span className="text-sm text-surface-500">Max 10 images</span>
                          <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
                        </label>
                      )}

                      {imagePreviewUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          {imagePreviewUrls.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-surface-200">
                              <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                              <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full shadow-sm">
                                <IoCloseOutline size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100 flex gap-4">
                      <IoCheckmarkCircleOutline className="text-primary-600 shrink-0" size={32} />
                      <div>
                        <h3 className="font-bold text-primary-900 mb-1">Almost Done!</h3>
                        <p className="text-sm text-primary-700">Your property looks great. Choose how long you want to keep it listed.</p>
                      </div>
                    </div>

                    <div>
                      <Select
                        label="Listing Duration"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        options={[
                          { value: '7', label: '7 Days' },
                          { value: '15', label: '15 Days (Recommended)' },
                          { value: '30', label: '30 Days' },
                        ]}
                      />
                      <p className="text-xs text-surface-500 mt-1">Listings expire automatically. You can always renew them for free.</p>
                    </div>

                    {isSubmitting && (
                      <div className="w-full bg-surface-100 rounded-full h-2 mt-4 overflow-hidden">
                        <div className="bg-primary-900 h-2 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Sticky Bar for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-surface-200 md:static md:bg-transparent md:border-none md:p-0 md:pt-8 mt-auto z-40">
              <Button 
                fullWidth 
                size="lg" 
                onClick={step === 5 ? handleSubmit : nextStep} 
                disabled={!validateStep() || isSubmitting}
                isLoading={isSubmitting}
                className="rounded-2xl"
              >
                {step === 5 ? 'Publish Listing' : 'Next'}
              </Button>
            </div>
            
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
