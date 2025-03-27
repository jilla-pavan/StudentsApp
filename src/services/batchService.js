import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';

const COLLECTION_NAME = 'batches';

export const getBatches = async () => {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const addBatch = async (batchData) => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), batchData);
  return {
    id: docRef.id,
    ...batchData
  };
};

export const updateBatch = async (id, batchData) => {
  const batchRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(batchRef, batchData);
  return {
    id,
    ...batchData
  };
};

export const deleteBatch = async (id) => {
  const batchRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(batchRef);
  return id;
}; 