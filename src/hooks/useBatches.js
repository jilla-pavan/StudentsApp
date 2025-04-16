import { useState, useEffect } from 'react';
import * as batchService from '../services/batchService';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, 'batches'),
      (snapshot) => {
        const batchesData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          ...doc.data()
        }));
        setBatches(batchesData);
        setError(null);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching batches:', error);
        setError('Failed to fetch batches');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addBatch = async (batchData) => {
    try {
      const newBatch = await batchService.addBatch(batchData);
      // No need to update state manually since onSnapshot will catch the change
      return newBatch;
    } catch (error) {
      console.error('Error adding batch:', error);
      return null;
    }
  };

  const updateBatch = async (batchId, batchData) => {
    try {
      const updatedBatch = await batchService.updateBatch(batchId, batchData);
      // No need to update state manually since onSnapshot will catch the change
      return updatedBatch;
    } catch (error) {
      console.error('Error updating batch:', error);
      return null;
    }
  };

  const deleteBatch = async (batchId) => {
    try {
      await batchService.deleteBatch(batchId);
      // No need to update state manually since onSnapshot will catch the change
      return true;
    } catch (error) {
      console.error('Error deleting batch:', error);
      return false;
    }
  };

  const getBatchStatus = (batch) => {
    const startDate = batch.startDate ? new Date(batch.startDate) : null;
    const endDate = batch.endDate ? new Date(batch.endDate) : null;
    const now = new Date();

    if (!startDate) return 'Pending';
    if (startDate > now) return 'Scheduled';
    if (endDate && endDate < now) return 'Completed';
    return 'Active';
  };

  const getBatchStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'blue';
      case 'Active': return 'green';
      case 'Completed': return 'gray';
      case 'Pending':
      default: return 'yellow';
    }
  };

  return {
    batches,
    loading,
    error,
    addBatch,
    updateBatch,
    deleteBatch,
    getBatchStatus,
    getBatchStatusColor
  };
}; 