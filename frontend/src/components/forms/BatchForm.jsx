import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FiClock } from 'react-icons/fi';

const BatchForm = ({ batch, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: batch?.name || '',
    startDate: batch?.startDate || '',
    timing: batch?.timing || '',
    schedule: batch?.schedule || [],
    trainer: batch?.trainer || '',
    editingBatch: batch || null
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const scheduleOptions = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Batch name is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else if (!formData.editingBatch && new Date(formData.startDate) < new Date().setHours(0, 0, 0, 0)) {
      newErrors.startDate = 'Start date cannot be in the past for new batches';
    }

    if (!formData.timing?.trim()) {
      newErrors.timing = 'Timing is required';
    } else {
      // Validate time format (HH:mm - HH:mm)
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]\s*-\s*([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.timing)) {
        newErrors.timing = 'Invalid time format. Use HH:mm - HH:mm';
      }
    }

    if (!formData.trainer?.trim()) {
      newErrors.trainer = 'Trainer name is required';
    }

    if (!formData.schedule?.length) {
      newErrors.schedule = 'Please select at least one day';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.includes(day)
        ? prev.schedule.filter(d => d !== day)
        : [...prev.schedule, day]
    }));
    // Clear schedule error when days are selected
    if (errors.schedule) {
      setErrors(prev => ({ ...prev, schedule: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to submit form. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Batch Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors(prev => ({ ...prev, name: null }));
            }}
            className={`w-full px-3 py-2 border ${
              errors.name ? 'border-red-500' : 'border-gray-200'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            placeholder="Enter batch name"
            disabled={loading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => {
                setFormData({ ...formData, startDate: e.target.value });
                if (errors.startDate) setErrors(prev => ({ ...prev, startDate: null }));
              }}
              min={formData.editingBatch ? undefined : new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border ${
                errors.startDate ? 'border-red-500' : 'border-gray-200'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              disabled={loading}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timing
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.timing}
                onChange={(e) => {
                  setFormData({ ...formData, timing: e.target.value });
                  if (errors.timing) setErrors(prev => ({ ...prev, timing: null }));
                }}
                placeholder="09:00 - 11:00"
                className={`w-full pl-9 pr-3 py-2 border ${
                  errors.timing ? 'border-red-500' : 'border-gray-200'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                disabled={loading}
              />
              <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.timing && (
              <p className="mt-1 text-sm text-red-500">{errors.timing}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trainer Name
          </label>
          <input
            type="text"
            value={formData.trainer}
            onChange={(e) => {
              setFormData({ ...formData, trainer: e.target.value });
              if (errors.trainer) setErrors(prev => ({ ...prev, trainer: null }));
            }}
            className={`w-full px-3 py-2 border ${
              errors.trainer ? 'border-red-500' : 'border-gray-200'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            placeholder="Enter trainer name"
            disabled={loading}
          />
          {errors.trainer && (
            <p className="mt-1 text-sm text-red-500">{errors.trainer}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Schedule
          </label>
          <div className="flex flex-wrap gap-2">
            {scheduleOptions.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                disabled={loading}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  formData.schedule.includes(day)
                    ? 'bg-green-50 text-green-600 border border-green-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {day}
              </button>
            ))}
          </div>
          {errors.schedule && (
            <p className="mt-1 text-sm text-red-500">{errors.schedule}</p>
          )}
        </div>
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : batch ? 'Update' : 'Create'} Batch
        </button>
      </div>
    </form>
  );
};

BatchForm.propTypes = {
  batch: PropTypes.shape({
    name: PropTypes.string,
    startDate: PropTypes.string,
    timing: PropTypes.string,
    schedule: PropTypes.arrayOf(PropTypes.string),
    trainer: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default BatchForm;