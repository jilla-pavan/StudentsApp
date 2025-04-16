import React from 'react';
import { FiUsers, FiPlus } from 'react-icons/fi';

const StudentsView = ({ renderFilters, renderStudentList, onAddStudent, onFilterChange }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {/* Header Card */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FiUsers className="w-5 h-5 text-indigo-600" />
              Students
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your students and their information
            </p>
          </div>
          <button
            onClick={onAddStudent}
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Add New Student
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Filters Section */}
        <div className="p-4 border-b border-gray-100">
          {renderFilters(onFilterChange)}
        </div>
      </div>
      {/* Students List Section */}
      <div className="divide-y divide-gray-100 py-4">
        {renderStudentList()}
      </div>
    </div>
  </div>
);

export default StudentsView;