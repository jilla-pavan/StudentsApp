import React, { useState } from 'react';
import PropTypes from 'prop-types';

const MockTestForm = ({ test, batches, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: test?.name || '',
    date: test?.date || '',
    totalMarks: test?.totalMarks || 100,
    passingMarks: test?.passingMarks || 40,
    duration: test?.duration || 60,
    batches: test?.batches || [],
    description: test?.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleBatch = (batchId) => {
    setFormData(prev => ({
      ...prev,
      batches: prev.batches.includes(batchId)
        ? prev.batches.filter(id => id !== batchId)
        : [...prev.batches, batchId]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Test Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Test Date
        </label>
        <input
          type="date"
          id="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="totalMarks" className="block text-sm font-medium text-gray-700">
            Total Marks
          </label>
          <input
            type="number"
            id="totalMarks"
            value={formData.totalMarks}
            onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="0"
            required
          />
        </div>

        <div>
          <label htmlFor="passingMarks" className="block text-sm font-medium text-gray-700">
            Passing Marks
          </label>
          <input
            type="number"
            id="passingMarks"
            value={formData.passingMarks}
            onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="0"
            required
          />
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Duration (minutes)
          </label>
          <input
            type="number"
            id="duration"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="0"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Batches
        </label>
        <div className="flex flex-wrap gap-2">
          {batches.map((batch) => (
            <button
              key={batch.id}
              type="button"
              onClick={() => toggleBatch(batch.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                formData.batches.includes(batch.id)
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {batch.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {test ? 'Update' : 'Create'} Mock Test
        </button>
      </div>
    </form>
  );
};

MockTestForm.propTypes = {
  test: PropTypes.shape({
    name: PropTypes.string,
    date: PropTypes.string,
    totalMarks: PropTypes.number,
    passingMarks: PropTypes.number,
    duration: PropTypes.number,
    batches: PropTypes.arrayOf(PropTypes.string),
    description: PropTypes.string,
  }),
  batches: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default MockTestForm; 