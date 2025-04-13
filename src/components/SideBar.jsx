import { FiUsers } from 'react-icons/fi';
import { BsBook } from 'react-icons/bs';
import { RiFileListLine } from 'react-icons/ri';
import { AiOutlineClockCircle } from 'react-icons/ai';
import { BiBarChart } from 'react-icons/bi';
import { useNavigate, useLocation } from 'react-router-dom';



const renderSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    return (
      <div className="w-64 bg-[#f8f2ff] h-screen fixed left-0 top-0 border-r border-purple-100 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-purple-900">
            Career Sure Academy
          </h1>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => navigate('/students')}
              className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-md ${location.pathname === '/students'
                  ? 'bg-purple-100 text-purple-900'
                  : 'text-gray-700 hover:bg-purple-50'
                }`}
            >
              <FiUsers className="text-xl" />
              Students
            </button>
            <button
              onClick={() => navigate('/batches')}
              className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-md ${location.pathname === '/batches'
                  ? 'bg-purple-100 text-purple-900'
                  : 'text-gray-700 hover:bg-purple-50'
                }`}
            >
              <BsBook className="text-xl" />
              Batches
            </button>
            <button
              onClick={() => navigate('/attendance')}
              className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-md ${location.pathname === '/attendance'
                  ? 'bg-purple-100 text-purple-900'
                  : 'text-gray-700 hover:bg-purple-50'
                }`}
            >
              <RiFileListLine className="text-xl" />
              Attendance
            </button>
            <button
              onClick={() => navigate('/mock-tests')}
              className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-md ${location.pathname === '/mock-tests'
                  ? 'bg-purple-100 text-purple-900'
                  : 'text-gray-700 hover:bg-purple-50'
                }`}
            >
              <AiOutlineClockCircle className="text-xl" />
              Mock Tests
            </button>
          </div>
        </nav>
      </div>
    );
  };

  export default renderSidebar;