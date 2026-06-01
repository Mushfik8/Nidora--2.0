'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { IoShieldCheckmarkOutline, IoCloudUploadOutline } from 'react-icons/io5';

export default function VerificationPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [documentType, setDocumentType] = useState('national_id');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!file || !user) return;
    setIsSubmitting(true);

    try {
      const url = await uploadToCloudinary(file, { folder: `nidora/verification/${user.uid}` });
      
      // Create request in Firestore
      await addDoc(collection(db, 'verification_requests'), {
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        documentType,
        documentUrl: url,
        status: 'pending',
        reviewedBy: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting verification:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex-1 bg-surface-50 py-12">
        <div className="page-container max-w-2xl">
          
          <div className="bg-white rounded-3xl p-8 md:p-12 card-shadow-lg text-center">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <IoShieldCheckmarkOutline size={40} className="text-primary-600" />
            </div>
            
            <h1 className="text-3xl font-bold font-[var(--font-heading)] text-surface-900 mb-4">
              Verify Your Identity
            </h1>
            <p className="text-surface-500 mb-8 max-w-md mx-auto">
              Get the blue verification badge on your profile and listings to build trust with other users in the Nidora community.
            </p>

            {user?.isVerified ? (
              <div className="bg-success-50 border border-success-200 text-success-700 p-6 rounded-2xl">
                <IoShieldCheckmarkOutline size={32} className="mx-auto mb-2" />
                <h3 className="font-semibold text-lg">You are fully verified!</h3>
                <p className="text-sm mt-1">Thank you for helping keep Nidora safe.</p>
                <Button className="mt-6" variant="outline" onClick={() => router.push('/profile')}>Back to Profile</Button>
              </div>
            ) : submitted ? (
              <div className="bg-primary-50 border border-primary-200 text-primary-700 p-6 rounded-2xl">
                <h3 className="font-semibold text-lg mb-2">Request Submitted Successfully</h3>
                <p className="text-sm">Our team will review your document within 24 hours. You will be notified once approved.</p>
                <Button className="mt-6" variant="outline" onClick={() => router.push('/')}>Return Home</Button>
              </div>
            ) : (
              <div className="space-y-6 text-left bg-surface-50 p-6 rounded-2xl border border-surface-200">
                <Select
                  label="Document Type"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  options={[
                    { value: 'national_id', label: 'National ID Card (NID)' },
                    { value: 'driving_license', label: 'Driving License' }
                  ]}
                />
                
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-2 block">Upload Document</label>
                  <label className="border-2 border-dashed border-primary-300 bg-primary-50/50 hover:bg-primary-50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <IoCloudUploadOutline size={32} className="text-primary-600 mb-3" />
                    <span className="font-medium text-primary-700">
                      {file ? file.name : 'Click to select file'}
                    </span>
                    <span className="text-xs text-primary-600/70 mt-1 mt-1 text-center">
                      Please upload a clear, legible photo of your document.<br/>Your data is encrypted and stored securely.
                    </span>
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)} 
                    />
                  </label>
                </div>

                <Button 
                  fullWidth 
                  size="lg" 
                  onClick={handleSubmit}
                  disabled={!file || isSubmitting}
                  isLoading={isSubmitting}
                >
                  Submit for Verification
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>
    </AuthGuard>
  );
}
