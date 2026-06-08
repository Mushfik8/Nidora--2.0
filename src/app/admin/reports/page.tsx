'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { IoFlagOutline } from 'react-icons/io5';
import Link from 'next/link';

export default function AdminReportsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'resolved',
        updatedAt: serverTimestamp()
      });
      setReports(reports.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    } catch (error) {
      console.error('Error resolving report:', error);
    }
  };

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold font-[var(--font-heading)] text-surface-900 mb-6">
        Review Reports
      </h1>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden card-shadow">
        {loading ? (
          <div className="p-8 text-center text-surface-500">Loading reports...</div>
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-surface-600">
              <thead className="bg-surface-50 border-b border-surface-200 text-surface-700">
                <tr>
                  <th className="px-6 py-4 font-medium">Reported Item</th>
                  <th className="px-6 py-4 font-medium">Reason</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4">
                      {r.listingId ? (
                         <Link href={`/listings/${r.listingId}`} className="font-medium text-primary-600 hover:underline">
                           View Listing
                         </Link>
                      ) : (
                         <span className="text-surface-900">Unknown Item</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-surface-900 capitalize">{r.reason?.replace('-', ' ')}</div>
                      {r.details && <div className="text-xs text-surface-500 mt-1 max-w-xs truncate" title={r.details}>{r.details}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={r.status === 'resolved' ? 'success' : 'warning'} className="capitalize">
                        {r.status || 'pending'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {r.createdAt ? r.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.status !== 'resolved' && (
                        <Button 
                          size="sm" 
                          variant="primary" 
                          onClick={() => resolveReport(r.id)}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <IoFlagOutline size={48} className="mx-auto text-surface-300 mb-4" />
            <p className="text-surface-500 font-medium">No reports filed yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
