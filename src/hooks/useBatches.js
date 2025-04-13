import { useState, useEffect } from 'react';
import * as batchService from '../services/batchService';

export const useBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch batches on mount
  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const data = await batchService.getBatches();
      setBatches(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch batches');
      console.error('Error fetching batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const addBatch = async (batchData) => {
    try {
      const newBatch = await batchService.addBatch(batchData);
      setBatches(prev => [...prev, newBatch]);
      return newBatch;
    } catch (err) {
      setError('Failed to add batch');
      console.error('Error adding batch:', err);
      throw err;
    }
  };

  const updateBatch = async (id, batchData) => {
    try {
      const updatedBatch = await batchService.updateBatch(id, batchData);
      setBatches(prev => prev.map(batch => 
        batch.id === id ? { ...batch, ...updatedBatch } : batch
      ));
      return updatedBatch;
    } catch (err) {
      setError('Failed to update batch');
      console.error('Error updating batch:', err);
      throw err;
    }
  };

  const deleteBatch = async (id) => {
    try {
      setLoading(true);
      await batchService.deleteBatch(id);
      setBatches(prev => prev.filter(batch => batch.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete batch');
      console.error('Error deleting batch:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getBatchById = (id) => {
    return batches.find(batch => batch.id === id);
  };

  const getBatchProgress = (batchId) => {
    const batch = getBatchById(batchId);
    if (!batch) return 0;
    
    const today = new Date();
    const startDate = new Date(batch.startDate);
    const endDate = new Date(batch.endDate);
    
    if (today < startDate) return 0;
    if (today > endDate) return 100;
    
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const daysElapsed = (today - startDate) / (1000 * 60 * 60 * 24);
    
    return Math.round((daysElapsed / totalDays) * 100);
  };

  const getBatchStatus = (batchId) => {
    const batch = getBatchById(batchId);
    if (!batch) return 'unknown';

    const today = new Date();
    const startDate = new Date(batch.startDate);
    const endDate = new Date(batch.endDate);

    if (today < startDate) return 'upcoming';
    if (today > endDate) return 'completed';
    return 'ongoing';
  };

  const getBatchStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'text-blue-600';
      case 'ongoing':
        return 'text-green-600';
      case 'completed':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return {
    batches,
    loading,
    error,
    addBatch,
    updateBatch,
    deleteBatch,
    getBatchById,
    getBatchProgress,
    getBatchStatus,
    getBatchStatusColor,
    refreshBatches: fetchBatches
  };
}; 