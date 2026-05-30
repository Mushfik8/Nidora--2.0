import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// 1. CRON: Expire active listings past expiresAt
export const expireListings = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  
  const q = db.collection('listings')
    .where('status', '==', 'active')
    .where('expiresAt', '<=', now);
    
  const snap = await q.get();
  
  const batch = db.batch();
  snap.forEach(doc => {
    batch.update(doc.ref, { 
      status: 'expired',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
  console.log(`Expired ${snap.size} listings.`);
});

// 2. CRON: Archive expired listings after 7 days
export const archiveListings = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const sevenDaysAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  
  const q = db.collection('listings')
    .where('status', '==', 'expired')
    .where('updatedAt', '<=', sevenDaysAgo);
    
  const snap = await q.get();
  
  const batch = db.batch();
  snap.forEach(doc => {
    batch.update(doc.ref, { 
      status: 'archived',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
  console.log(`Archived ${snap.size} listings.`);
});

// 3. CRON: Delete archived listings after 30 days
export const deleteListings = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  
  const q = db.collection('listings')
    .where('status', '==', 'archived')
    .where('updatedAt', '<=', thirtyDaysAgo);
    
  const snap = await q.get();
  
  const batch = db.batch();
  snap.forEach(doc => {
    batch.update(doc.ref, { 
      status: 'deleted',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
  console.log(`Deleted ${snap.size} listings.`);
});

// 4. CRON: Delete messages older than 15 days
export const cleanMessages = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const fifteenDaysAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000));
  
  // Need to use Firestore Collection Group Queries
  const q = db.collectionGroup('messages')
    .where('createdAt', '<=', fifteenDaysAgo);
    
  const snap = await q.get();
  
  let deletedCount = 0;
  
  // Batch deletes (max 500 per batch)
  let batch = db.batch();
  let count = 0;
  
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    count++;
    deletedCount++;
    
    if (count === 500) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  
  if (count > 0) {
    await batch.commit();
  }
  
  console.log(`Deleted ${deletedCount} old messages.`);
});

// 5. Callable: Set Admin Claim
export const setAdminClaim = functions.https.onCall(async (data, context) => {
  // Only existing admins can make new admins. 
  // For the first admin, you must run this script locally using service account or set a master email here.
  const isSuperUser = context.auth?.token.email === 'mushfikurr19@gmail.com';
  
  if (!context.auth?.token.admin && !isSuperUser) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can make other admins.');
  }

  const { targetUid } = data;
  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'targetUid is required.');
  }

  await admin.auth().setCustomUserClaims(targetUid, { admin: true });
  
  // Also update firestore user doc for easy querying
  await db.collection('users').doc(targetUid).update({
    role: 'admin',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, message: `Successfully made ${targetUid} an admin.` };
});
