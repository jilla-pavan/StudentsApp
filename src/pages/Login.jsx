import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiMail, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHelpInfo, setShowHelpInfo] = useState(false);

  const { currentUser, userType, adminLogin, studentLoginWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      if (userType === 'admin') {
        navigate('/');
      } else if (userType === 'student') {
        navigate(`/student/${currentUser.id}`);
      }
    }
  }, [currentUser, userType, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === 'admin') {
        const result = await adminLogin(email, password);
        if (result.success) {
          toast.success('Welcome back, admin!');
          navigate('/');
        } else {
          toast.error(result.error);
        }
      } else {
        // Student login with email and student ID
        if (!studentEmail.trim() || !studentPassword.trim()) {
          toast.error("Please enter both email and Student ID");
          setLoading(false);
          return;
        }

        // Attempt login
        const result = await studentLoginWithEmail(studentEmail, studentPassword);

        if (result.success) {
          toast.success('Welcome back!');

          // Check for fee status message
          if (result.feeStatus && !result.feeStatus.feePaid && result.feeStatus.message) {
            // Show warning for unpaid fees
            toast.error(result.feeStatus.message, {
              duration: 5000, // Show for longer
              icon: '⚠️',
            });
          }

          navigate(`/student/${result.studentId}`);
        } else {
          toast.error(result.error || 'Invalid email or student ID');
        }
      }
    } catch (error) {
      toast.error('Failed to log in. Please try again.');
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex justify-center items-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-4 sm:px-0"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-4"
          >
            <div className="w-20 h-20 flex items-center justify-center">
              <img 
                src="/images/CSA_Logo_Round.png" 
                alt="Career Sure Academy Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2"
          >
            Career Sure Academy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-gray-600"
          >
            Sign in to access your dashboard
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white shadow-xl rounded-2xl p-6 sm:p-8"
        >
          {/* Login Type Tabs */}
          <div className="flex rounded-xl shadow-sm p-1 bg-gray-100 mb-6" role="group">
            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out
                ${activeTab === 'student'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out
                ${activeTab === 'admin'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'admin' ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                        Email address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="email-address"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          required
                          className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Help icon for student login */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowHelpInfo(!showHelpInfo)}
                        className="text-gray-400 hover:text-purple-600 flex items-center gap-1 text-xs"
                      >
                        <FiInfo className="h-4 w-4" />
                        Need help signing in?
                      </button>
                    </div>

                    {/* Help info panel */}
                    <AnimatePresence>
                      {showHelpInfo && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800 mb-4"
                        >
                          <p className="font-medium mb-1">How to sign in:</p>
                          <ul className="list-disc pl-5 space-y-1 text-xs">
                            <li>Use the email address you registered with</li>
                            <li>If you've been assigned to a batch, check your email for login credentials</li>
                            <li>Contact support if you can't access your account</li>
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div>
                      <label htmlFor="student-email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="student-email"
                          name="studentEmail"
                          type="email"
                          autoComplete="email"
                          required
                          className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter your registered email"
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <label htmlFor="student-password" className="block text-sm font-medium text-gray-700 mb-1">
                          Password
                        </label>
                        <span className="text-xs text-gray-500">Sent to your email</span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="student-password"
                          name="studentPassword"
                          type="password"
                          autoComplete="current-password"
                          required
                          className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter your Password"
                          value={studentPassword}
                          onChange={(e) => setStudentPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {loading ? 'Signing in...' : 'Sign In'}
                      </button>
                    </div>

                    <div className="pt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={() => navigate('/register')}
                        className="text-sm font-medium text-purple-600 hover:text-purple-500 flex items-center"
                      >
                        New student? Register here
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Only show submit button for admin login */}
            {activeTab === 'admin' && (
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
} 