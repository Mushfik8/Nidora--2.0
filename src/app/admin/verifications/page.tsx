'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { VerificationRequest } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { IoCheckmarkOutline, IoCloseOutline, IoDocumentTextOutline } from 'react-icons/io5';

export default function AdminVerificationsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedReq, setSelectedReq] = useState<VerificationRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'verification_requests'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'asc')
      );
      const snap = await getDocs(q);
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VerificationRequest[]);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!selectedReq || !user) return;
    setActionLoading(true);
    try {
      // 1. Update Request
      await updateDoc(doc(db, 'verification_requests', selectedReq.id), {
        status,
        reviewedBy: user.uid,
        updatedAt: serverTimestamp()
      });

      // 2. If approved, update user document
      if (status === 'approved') {
        await updateDoc(doc(db, 'users', selectedReq.userId), {
          isVerified: true,
          updatedAt: serverTimestamp()
        });
        
        // Note: In a real app, we'd also update isVerifiedOwner on their active listings,
        // or rely on fetching the user's status when viewing the listing.
      }

      setRequests(requests.filter(r => r.id !== selectedReq.id));
      setSelectedReq(null);
    } catch (error) {
      console.error(`Error ${status} request:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold font-[var(--font-heading)] text-surface-900 mb-6">
        Pending Verifications
      </h1>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden card-shadow">
        {loading ? (
          <div className="p-8 text-center text-surface-500">Loading requests...</div>
        ) : requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-surface-600">
              <thead className="bg-surface-50 border-b border-surface-200 text-surface-700">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Document Type</th>
                  <th className="px-6 py-4 font-medium">Submitted</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-surface-900">{req.userName}</div>
                      <div className="text-xs text-surface-500">{req.userEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="info" className="capitalize">
                        {req.documentType.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {req.createdAt.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedReq(req)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <IoShieldCheckmarkOutline size={48} className="mx-auto text-surface-300 mb-4" />
            <p className="text-surface-500 font-medium">No pending verification requests.</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal isOpen={!!selectedReq} onClose={() => setSelectedReq(null)} title="Review Document" size="lg">
        {selectedReq && (
          <div className="space-y-6">
            <div className="flex justify-between items-start bg-surface-50 p-4 rounded-xl border border-surface-200">
              <div>
                <p className="font-semibold text-surface-900">{selectedReq.userName}</p>
                <p className="text-sm text-surface-500">{selectedReq.userEmail}</p>
              </div>
              <Badge variant="info" className="capitalize">{selectedReq.documentType.replace('_', ' ')}</Badge>
            </div>

            <div className="bg-surface-200 rounded-xl overflow-hidden aspect-video relative flex items-center justify-center">
              {/* Note: In a real app, since this is in a private storage bucket, we would need to fetch a short-lived download URL from the server using the Admin SDK. Since we only have client SDK here, assuming the rules allow admin read access directly. */}
              <img 
                src={selectedReq.documentUrl} 
                alt="Document" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('bg-danger-50');
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center -z-10 text-surface-400 gap-2">
                <IoDocumentTextOutline size={24} />
                <span>Document Image</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-surface-100">
              <Button 
                className="flex-1" 
                variant="danger" 
                icon={<IoCloseOutline size={20} />}
                onClick={() => handleAction('rejected')}
                isLoading={actionLoading}
              >
                Reject
              </Button>
              <Button 
                className="flex-1" 
                variant="primary" 
                icon={<IoCheckmarkOutline size={20} />}
                onClick={() => handleAction('approved')}
                isLoading={actionLoading}
              >
                Approve & Verify User
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
