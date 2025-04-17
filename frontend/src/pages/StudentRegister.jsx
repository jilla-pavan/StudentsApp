import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiCheck, FiArrowLeft, FiMapPin, FiKey } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';

export default function StudentRegister() {
  const [step, setStep] = useState(1); // 1: Initial, 2: Form
  const [loading, setLoading] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    gender: '',
    address: '',
  });

  const { studentRegister, completeStudentRegistration } = useAuth();
  const navigate = useNavigate();

  // Countdown effect after successful registration
  useEffect(() => {
    let timer;
    if (showSuccessModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (showSuccessModal && countdown === 0) {
      setShowSuccessModal(false);
      navigate('/login');
    }
    
    return () => clearTimeout(timer);
  }, [showSuccessModal, countdown, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      const result = await studentRegister();
      if (result.success) {
        if (result.isNewUser) {
          // New user, proceed to registration form
          setGoogleUser(result.googleUser);
          setFormData(prev => ({
            ...prev,
            name: result.googleUser.name || '',
          }));
          setStep(2);
          toast.success('Please complete your registration');
        } else {
          // Existing user, redirect to login
          toast.success('You are already registered. Please log in.');
          navigate('/login');
        }
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to register with Google');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!googleUser) {
      toast.error('Google authentication information missing');
      return;
    }
    
    setLoading(true);
    try {
      // Add default values
      const studentDataWithDefaults = {
        ...formData,
        batchId: 'unassigned' // Administrator will assign a batch later
      };
      
      const result = await completeStudentRegistration(studentDataWithDefaults, googleUser);
      
      if (result.success) {
        toast.success('Registration successful!');
        setRegistrationResult(result);
        setShowSuccessModal(true);
        setCountdown(5); // Reset countdown
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to complete registration');
    }
    setLoading(false);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex justify-center items-center py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-4"
          >
            <div className="w-20 h-20 flex items-center justify-center bg-white p-3 rounded-full shadow-md">
              <img 
                src="/images/CSA_Logo_Round.png" 
                alt="Career Sure Academy Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-extrabold text-gray-900"
          >
            Student Registration
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-sm text-gray-600"
          >
            Register to access your student dashboard
          </motion.p>
        </div>

        {step === 1 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8"
          >
            <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-gray-100">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-4">
                    <FcGoogle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Sign Up with Google</h3>
                  <p className="text-sm text-gray-700">
                    To register as a student, please sign in with your Google account first.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handleGoogleRegister}
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 hover:shadow-md"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <FcGoogle className="w-5 h-5 mr-2" /> Continue with Google
                    </>
                  )}
                </button>
                
                <div className="pt-2 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-sm font-medium text-purple-600 hover:text-purple-500"
                  >
                    Already registered? Sign in
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8"
          >
            <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-gray-100">
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <FiUser className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Complete Your Registration</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      We need a few more details to complete your registration
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-start px-3 py-2.5 bg-blue-50 text-sm text-blue-700 rounded-lg">
                  <FiMail className="mr-2 h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">You'll use <strong className="break-all">{googleUser?.email}</strong> to sign in</span>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiPhone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="contactNumber"
                        name="contactNumber"
                        type="tel"
                        required
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Your contact number"
                        value={formData.contactNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="address"
                        name="address"
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Your address (optional)"
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <select
                        id="gender"
                        name="gender"
                        required
                        className="block w-full pl-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 appearance-none"
                        value={formData.gender}
                        onChange={handleChange}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setGoogleUser(null);
                    }}
                    className="text-sm font-medium text-purple-600 hover:text-purple-500 flex items-center"
                  >
                    <FiArrowLeft className="mr-1" /> Back
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <>
                        Complete Registration <FiCheck className="ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <FiCheck className="h-8 w-8 text-green-600" />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">Registration Successful!</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your registration has been completed successfully. A confirmation email has been sent to <strong>{registrationResult?.email}</strong>.
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Redirecting to login page in <span className="font-medium">{countdown}</span> seconds...
                </p>
                
                <button
                  onClick={handleModalClose}
                  className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                >
                  Go to Login Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
} 