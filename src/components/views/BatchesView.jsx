import React from 'react';

const BatchesView = ({ renderBatchList, onAddBatch, totalBatches }) => (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-8">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Batches</h1>
          <p className="mt-1 text-sm text-gray-500 max-w-2xl">
            Manage your training batches and schedules
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <div className="bg-blue-50 px-4 py-3 rounded-lg">
            <div className="flex sm:flex-col justify-between sm:justify-start items-center sm:items-start">
              <span className="text-sm text-gray-600">Total Batches</span>
              <span className="text-xl sm:text-2xl font-semibold text-blue-600">{totalBatches}</span>
            </div>
          </div>
          <button
            onClick={onAddBatch}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Batch
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-hidden">
          {renderBatchList()}
        </div>
      </div>
    </div>
);

export default BatchesView;