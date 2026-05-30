'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { ReportReason } from '@/types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
}

export default function ReportModal({ isOpen, onClose, listingId }: ReportModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reason) return;

    setIsSubmitting(true);
    try {
      // 1. Create Report
      await addDoc(collection(db, 'reports'), {
        listingId,
        reporterId: user.uid,
        reason,
        details,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // 2. Increment report count on listing
      await updateDoc(doc(db, 'listings', listingId), {
        reportedCount: increment(1)
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setReason('');
    setDetails('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Report Listing">
      {submitted ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4 text-success-500 text-2xl">
            ✓
          </div>
          <h3 className="text-xl font-bold text-surface-900 mb-2">Report Submitted</h3>
          <p className="text-surface-500 mb-6">
            Thank you for keeping Nidora safe. Our admin team will review this listing shortly.
          </p>
          <Button fullWidth onClick={handleClose}>Close</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-surface-600 text-sm">
            If you believe this listing violates our terms, please let us know. False reports may lead to account suspension.
          </p>

          <Select
            label="Reason for reporting"
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            options={[
              { value: 'fake_listing', label: 'Fake or Fraudulent Listing' },
              { value: 'scam', label: 'Scam / Phishing' },
              { value: 'wrong_info', label: 'Incorrect Information' },
              { value: 'already_rented', label: 'Property Already Rented' },
              { value: 'spam', label: 'Spam' },
            ]}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-surface-700">Additional Details (Optional)</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl text-sm bg-surface-50 border border-surface-200 text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none h-32"
              placeholder="Please provide any additional context..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={!reason || isSubmitting} isLoading={isSubmitting}>
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
