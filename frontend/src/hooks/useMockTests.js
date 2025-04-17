import { useState, useEffect } from 'react';
import * as mockTestService from '../services/mockTestService';

export const useMockTests = () => {
  const [mockTests, setMockTests] = useState([]);
  const [selectedMockTests, setSelectedMockTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch mock tests on mount
  useEffect(() => {
    fetchMockTests();
  }, []);

  const fetchMockTests = async () => {
    try {
      setLoading(true);
      const data = await mockTestService.getMockTests();
      setMockTests(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch mock tests');
      console.error('Error fetching mock tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const addMockTest = async (mockTestData) => {
    try {
      const newMockTest = await mockTestService.addMockTest(mockTestData);
      setMockTests(prev => [...prev, newMockTest]);
      return newMockTest;
    } catch (err) {
      setError('Failed to add mock test');
      console.error('Error adding mock test:', err);
      throw err;
    }
  };

  const updateMockTest = async (id, mockTestData) => {
    try {
      const updatedMockTest = await mockTestService.updateMockTest(id, mockTestData);
      setMockTests(prev => prev.map(test => 
        test.id === id ? { ...test, ...updatedMockTest } : test
      ));
      return updatedMockTest;
    } catch (err) {
      setError('Failed to update mock test');
      console.error('Error updating mock test:', err);
      throw err;
    }
  };

  const deleteMockTest = async (id) => {
    try {
      await mockTestService.deleteMockTest(id);
      setMockTests(prev => prev.filter(test => test.id !== id));
      setSelectedMockTests(prev => prev.filter(testId => testId !== id));
    } catch (err) {
      setError('Failed to delete mock test');
      console.error('Error deleting mock test:', err);
      throw err;
    }
  };

  const toggleMockTestSelection = (testId) => {
    setSelectedMockTests(prev => 
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const selectAllMockTests = (selected) => {
    setSelectedMockTests(selected ? mockTests.map(test => test.id) : []);
  };

  const getFilteredMockTests = (filters) => {
    return mockTests.filter(test => {
      const matchesBatch = !filters.batch || filters.batch === 'all' || test.batchId === filters.batch;
      const matchesStatus = !filters.status || filters.status === 'all' || getMockTestStatus(test) === filters.status;
      const matchesSearch = !filters.search || 
        test.title.toLowerCase().includes(filters.search.toLowerCase());
      return matchesBatch && matchesStatus && matchesSearch;
    });
  };

  const getMockTestById = (id) => {
    return mockTests.find(test => test.id === id);
  };

  const getMockTestStatus = (test) => {
    const testDate = new Date(test.date);
    const today = new Date();
    return testDate > today ? 'upcoming' : 'completed';
  };

  const getMockTestReport = (testId, students) => {
    const test = getMockTestById(testId);
    if (!test) return null;

    return mockTestService.getClassPerformance(testId, students);
  };

  return {
    mockTests,
    selectedMockTests,
    loading,
    error,
    addMockTest,
    updateMockTest,
    deleteMockTest,
    toggleMockTestSelection,
    selectAllMockTests,
    getFilteredMockTests,
    getMockTestById,
    getMockTestReport,
    refreshMockTests: fetchMockTests
  };
}; 