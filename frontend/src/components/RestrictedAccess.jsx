import React from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import { FiAlertTriangle, FiLock } from 'react-icons/fi';

/**
 * Component that shows a restricted access message for students with unpaid fees
 * It can either completely block access to a feature or show a warning
 */
const RestrictedAccess = ({ 
  children, 
  blockAccess = false,
  featureDescription = 'this feature',
  showWarning = true
}) => {
  const { currentUser, userType } = useAuth();
  
  // Only apply restrictions to student accounts
  if (userType !== 'student') {
    return children;
  }
  
  // Check if the student has unpaid fees
  const hasUnpaidFees = currentUser?.feePaid === false;
  
  if (!hasUnpaidFees) {
    return children;
  }
  
  // If we're blocking access, show the locked content message
  if (blockAccess) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <FiLock className="h-8 w-8 text-red-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-red-800">Access Restricted</h3>
            <p className="mt-1 text-sm text-red-700">
              You cannot access {featureDescription} because you have pending fees.
              Please contact the administration to resolve this issue.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // If we're just showing a warning but allowing access
  if (showWarning) {
    return (
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiAlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your access to some features is limited due to pending fees. 
                Please contact the administration.
              </p>
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }
  
  // No warning or blocking, just return children
  return children;
};

RestrictedAccess.propTypes = {
  children: PropTypes.node.isRequired,
  blockAccess: PropTypes.bool,
  featureDescription: PropTypes.string,
  showWarning: PropTypes.bool
};

export default RestrictedAccess; 