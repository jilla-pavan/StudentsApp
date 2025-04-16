import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDoc
} from 'firebase/firestore';

const COLLECTION_NAME = 'batches';

export const getBatches = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error('Failed to fetch batches');
  }
};

export const addBatch = async (batchData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), batchData);
    return {
      id: docRef.id,
      ...batchData
    };
  } catch (error) {
    throw new Error('Failed to add batch');
  }
};

export const updateBatch = async (id, batchData) => {
  try {
    const batchRef = doc(db, COLLECTION_NAME, id);
    const batchDoc = await getDoc(batchRef);
    
    if (!batchDoc.exists()) {
      throw new Error(`Batch with ID ${id} does not exist`);
    }

    await updateDoc(batchRef, batchData);
    return {
      id,
      ...batchData
    };
  } catch (error) {
    throw new Error(`Failed to update batch: ${error.message}`);
  }
};

export const deleteBatch = async (id) => {
  try {
    const batchRef = doc(db, COLLECTION_NAME, id);
    const batchDoc = await getDoc(batchRef);
    
    if (!batchDoc.exists()) {
      throw new Error(`Batch with ID ${id} does not exist`);
    }

    await deleteDoc(batchRef);
    return id;
  } catch (error) {
    throw new Error(`Failed to delete batch: ${error.message}`);
  }
}; 