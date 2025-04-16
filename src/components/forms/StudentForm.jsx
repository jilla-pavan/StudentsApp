import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiUpload, FiDollarSign, FiUser, FiMail, FiPhone, FiHash, FiUsers } from 'react-icons/fi';
import { BiMale } from 'react-icons/bi';

const StudentForm = ({ student, batches, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : '',
    email: student?.email || '',
    contactNumber: student?.contactNumber || '',
    batchId: student?.batchId || '',
    rollNumber: student?.rollNumber || '',
    gender: student?.gender || '',
    feePaid: student?.feePaid !== undefined ? student?.feePaid : true,
    id: student?.id || null,
    ...student
  });

  useEffect(() => {
    if (student) {
      console.log('📝 FORM: Editing student with ID:', student.id);
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedData = {
      ...formData,
      name: formData.name.trim(),
    };
    
    if (student) {
      console.log('📝 FORM: Submitting edit for student ID:', formData.id);
      formattedData.editingStudent = student;
    } else {
      console.log('📝 FORM: Creating new student');
    }
    
    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form Header - Hidden since it's redundant with modal title */}
      {/* <div className="flex items-center pb-4 mb-2 border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
          <FiUser className="text-purple-600 h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {student ? 'Edit Student Details' : 'Add New Student'}
          </h3>
          <p className="text-sm text-gray-500">
            {student ? 'Update the information below for the existing student' : 'Fill in the information to create a new student'}
          </p>
        </div>
      </div> */}
      
      {/* Profile Image Upload */}
      <div className="flex justify-center mb-4">
        <div className="w-28 h-28 relative rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-300 transition-all hover:border-purple-300 group">
          {formData.image ? (
            <img
              src={formData.image}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="text-center p-2 group-hover:scale-110 transition-transform">
              <FiUpload className="mx-auto h-6 w-6 text-gray-400 group-hover:text-purple-500 transition-colors" />
              <p className="mt-1 text-xs text-gray-500 group-hover:text-purple-600 transition-colors">Upload Photo</p>
            </div>
          )}
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setFormData({ ...formData, image: reader.result });
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FiUser className="mr-2 h-4 w-4 text-gray-500" />
            Full Name <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="Enter student's full name"
            />
          </div>
        </div>
        
        {/* Roll Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FiHash className="mr-2 h-4 w-4 text-gray-500" />
            Roll Number <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleChange}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="Enter roll number"
            />
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <BiMale className="mr-2 h-4 w-4 text-gray-500" />
            Gender <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors appearance-none"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem" }}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FiMail className="mr-2 h-4 w-4 text-gray-500" />
            Email <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="Enter email address"
            />
          </div>
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FiPhone className="mr-2 h-4 w-4 text-gray-500" />
            Contact Number <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="Enter contact number"
            />
          </div>
        </div>

        {/* Batch */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FiUsers className="mr-2 h-4 w-4 text-gray-500" />
            Batch <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <select
              name="batchId"
              value={formData.batchId}
              onChange={handleChange}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors appearance-none"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem" }}
            >
              <option value="">Select Batch</option>
              {batches.map(batch => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fee Payment Status */}
        <div className="md:col-span-2 mt-1">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiDollarSign className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fee Payment Status
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.feePaid 
                      ? 'Student has paid fees and has full access.' 
                      : 'Student has pending fees and will have restricted access.'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className={`text-sm font-medium mr-3 ${formData.feePaid ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.feePaid ? 'Paid' : 'Unpaid'}
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    name="feePaid"
                    id="feePaid"
                    checked={formData.feePaid}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <label
                    htmlFor="feePaid"
                    className="flex h-6 w-11 cursor-pointer rounded-full bg-gray-200 peer-checked:bg-green-500 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 transition-colors"
                  >
                    <span 
                      className="h-6 w-6 rounded-full bg-white border border-gray-200 shadow-sm transform duration-300 ease-in-out"
                      style={{ transform: formData.feePaid ? 'translateX(100%)' : 'translateX(0)' }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Footer with Buttons */}
      <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors flex items-center"
        >
          <span className="mr-1">{student ? 'Update' : 'Add'} Student</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={student ? "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
          </svg>
        </button>
      </div>
    </form>
  );
};

StudentForm.propTypes = {
  student: PropTypes.shape({
    id: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    contactNumber: PropTypes.string,
    batchId: PropTypes.string,
    rollNumber: PropTypes.string,
    gender: PropTypes.string,
    feePaid: PropTypes.bool
  }),
  batches: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default StudentForm; 