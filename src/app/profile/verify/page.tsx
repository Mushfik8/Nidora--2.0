'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { uploadToCloudinary } from '@/lib/cloudinary';
import AuthGuard from '@/components/auth/AuthGuard';
import Button from '@/components/ui/Button';
import { IoShieldCheckmarkOutline, IoCloudUploadOutline, IoCheckmarkCircle, IoEyeOutline, IoStarOutline, IoChatbubbleOutline, IoArrowBack } from 'react-icons/io5';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';

export default function VerifyPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [documentType, setDocumentType] = useState<'national_id' | 'driving_license'>('national_id');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');

  useEffect(() => {
    if (!user) return;
    checkExistingStatus();
  }, [user]);

  const checkExistingStatus = async () => {
    if (!user) return;
    
    if (user.isVerified) {
      setCurrentStatus('approved');
      return;
    }
    
    try {
      const q = query(
        collection(db, 'verification_requests'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setCurrentStatus(snap.docs[0].data().status);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async () => {
    if (!user || !file) return;
    setIsSubmitting(true);
    
    try {
      const url = await uploadToCloudinary(file, { folder: `nidora/verification/${user.uid}` });
      
      await addDoc(collection(db, 'verification_requests'), {
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        documentType,
        documentUrl: url,
        status: 'pending',
        reviewedBy: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Track analytics
      try {
        await addDoc(collection(db, 'analytics_events'), {
          eventName: 'verification_submitted',
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
      } catch (e) { /* silent */ }
      
      setCurrentStatus('pending');
      toast.success('Verification submitted! We\'ll review it shortly.');
    } catch (error) {
      console.error('Verification upload failed:', error);
      toast.error('Upload failed. Please check your network or image file size.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="bg-surface-50 min-h-screen pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-8">
          
          <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-900 mb-6 transition-colors">
            <IoArrowBack size={18} /> Back to Profile
          </Link>

          <h1 className="text-3xl font-bold font-[var(--font-heading)] text-surface-900 mb-2">Get Verified</h1>
          <p className="text-surface-500 mb-8">Increase your credibility and get more responses from potential tenants.</p>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-white rounded-2xl p-5 border border-surface-200">
              <IoEyeOutline size={24} className="text-primary-600 mb-3" />
              <h4 className="font-bold text-surface-900 mb-1">More Visibility</h4>
              <p className="text-sm text-surface-500">Verified listings appear higher in search results.</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-surface-200">
              <IoShieldCheckmarkOutline size={24} className="text-primary-600 mb-3" />
              <h4 className="font-bold text-surface-900 mb-1">Trusted by Renters</h4>
              <p className="text-sm text-surface-500">Renters prefer verified owners for safer deals.</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-surface-200">
              <IoCheckmarkCircle size={24} className="text-primary-600 mb-3" />
              <h4 className="font-bold text-surface-900 mb-1">Blue Badge</h4>
              <p className="text-sm text-surface-500">Get a verified checkmark on your profile and listings.</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-surface-200">
              <IoChatbubbleOutline size={24} className="text-primary-600 mb-3" />
              <h4 className="font-bold text-surface-900 mb-1">Better Responses</h4>
              <p className="text-sm text-surface-500">Verified owners get up to 3x more messages.</p>
            </div>
          </div>

          {/* Status Display */}
          {currentStatus === 'approved' && (
            <div className="bg-success-50 border border-success-200 rounded-2xl p-6 text-center">
              <IoCheckmarkCircle size={48} className="text-success-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-success-800 mb-1">You are Verified!</h3>
              <p className="text-success-600">Your blue badge is now visible on all your listings and profile.</p>
            </div>
          )}

          {currentStatus === 'pending' && (
            <div className="bg-warning-50 border border-warning-200 rounded-2xl p-6 text-center">
              <IoShieldCheckmarkOutline size={48} className="text-warning-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-warning-800 mb-1">Under Review</h3>
              <p className="text-warning-600">Your document has been submitted. An admin will review it shortly.</p>
            </div>
          )}

          {currentStatus === 'rejected' && (
            <div className="bg-danger-50 border border-danger-200 rounded-2xl p-6 text-center mb-8">
              <h3 className="text-xl font-bold text-danger-800 mb-1">Verification Rejected</h3>
              <p className="text-danger-600 mb-4">Your previous submission was not approved. Please try again with a clearer document.</p>
            </div>
          )}

          {/* Upload Form */}
          {(currentStatus === 'none' || currentStatus === 'rejected') && (
            <div className="bg-white rounded-2xl border border-surface-200 p-6 mt-6">
              <h3 className="font-bold text-surface-900 mb-4">Upload your ID</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">Document Type</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDocumentType('national_id')}
                      className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        documentType === 'national_id' ? 'border-primary-900 bg-primary-50 text-primary-900' : 'border-surface-200 text-surface-600'
                      }`}
                    >
                      National ID
                    </button>
                    <button
                      onClick={() => setDocumentType('driving_license')}
                      className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        documentType === 'driving_license' ? 'border-primary-900 bg-primary-50 text-primary-900' : 'border-surface-200 text-surface-600'
                      }`}
                    >
                      Driving License
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">Upload Document</label>
                  {previewUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-surface-200">
                      <img src={previewUrl} alt="Document preview" className="w-full h-48 object-cover" />
                      <button onClick={() => { setFile(null); setPreviewUrl(''); }} className="absolute top-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-surface-300 rounded-xl p-8 flex flex-col items-center cursor-pointer hover:border-primary-900 hover:bg-surface-50 transition-colors">
                      <IoCloudUploadOutline size={40} className="text-surface-400 mb-2" />
                      <span className="text-sm font-medium text-surface-700">Click to upload</span>
                      <span className="text-xs text-surface-400 mt-1">JPG, PNG up to 5MB</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </div>

              <Button 
                fullWidth 
                size="lg"
                onClick={handleSubmit}
                disabled={!file || isSubmitting}
                isLoading={isSubmitting}
                className="rounded-2xl"
              >
                Submit for Verification
              </Button>
            </div>
          )}

        </div>
      </div>
    </AuthGuard>
  );
}
