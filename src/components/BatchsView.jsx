import React from 'react';

const BatchesView = ({ renderBatchList, onAddBatch, totalBatches }) => (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your training batches
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="bg-blue-50 px-4 py-2 rounded-lg w-full sm:w-auto">
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">Total Batches</span>
              <span className="text-2xl font-semibold text-blue-600">{totalBatches}</span>
            </div>
          </div>
          <button
            onClick={onAddBatch}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            <span className="text-lg">+</span>
            Add New Batch
          </button>
        </div>
      </div>
      {renderBatchList()}
    </div>
  );

  export default BatchesView;