import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, getDocs, query, where, orderBy, limit, DocumentData } from 'firebase/firestore';
import { db } from './firebase';

// Audit Logging Service
export const logAudit = async (
  userId: string, 
  userEmail: string, 
  action: string, 
  resource: string, 
  resourceId: string, 
  details: Record<string, any> = {}
) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      userId,
      userEmail,
      action,
      resource,
      resourceId,
      details,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to write audit log', error);
  }
};

// Error Logging Service
export const logError = async (
  context: string, 
  errorMessage: string, 
  userId?: string,
  extraData?: any
) => {
  try {
    await addDoc(collection(db, 'error_logs'), {
      context,
      message: errorMessage,
      userId: userId || 'anonymous',
      extraData,
      createdAt: serverTimestamp(),
    });
    console.error(`[${context}]`, errorMessage, extraData);
  } catch (err) {
    console.error('Failed to write error log', err);
  }
};

// Unified Update Service (Soft Delete / Update)
export const updateRecord = async (
  collectionName: string, 
  recordId: string, 
  data: Partial<DocumentData>,
  auditInfo?: { userId: string, userEmail: string, action: string }
) => {
  try {
    const docRef = doc(db, collectionName, recordId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    if (auditInfo) {
      await logAudit(auditInfo.userId, auditInfo.userEmail, auditInfo.action, collectionName, recordId, data);
    }
    return true;
  } catch (error: any) {
    await logError(`updateRecord:${collectionName}`, error.message, auditInfo?.userId, { recordId, data });
    throw error;
  }
};

// Unified Create Service
export const createRecord = async (
  collectionName: string, 
  data: DocumentData,
  auditInfo?: { userId: string, userEmail: string, action: string }
) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false
    });
    
    if (auditInfo) {
      await logAudit(auditInfo.userId, auditInfo.userEmail, auditInfo.action, collectionName, docRef.id, data);
    }
    return docRef.id;
  } catch (error: any) {
    await logError(`createRecord:${collectionName}`, error.message, auditInfo?.userId, { data });
    throw error;
  }
};
