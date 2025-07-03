import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const TrainerDashboard = () => {
  const navigate = useNavigate();
  // Using react-hot-toast directly
  const [isLoading, setIsLoading] = useState(true);
  const [trainer, setTrainer] = useState<any>(null);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('trainerToken');
        const trainerData = localStorage.getItem('trainer');
        
        if (!token || !trainerData) {
          navigate('/signin');
          return;
        }

        // Use the trainer data already stored in localStorage
        const parsedTrainer = JSON.parse(trainerData);
        setTrainer(parsedTrainer);
        
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('trainerToken');
        localStorage.removeItem('trainer');
        navigate('/signin');
        toast.error('Session expired. Please log in again');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('trainerToken');
    localStorage.removeItem('trainer');
    navigate('/signin');
    toast.success('You have been logged out successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Trainer Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {trainer?.name || 'Trainer'}
            </span>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Classes Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">My Classes</h3>
              <p className="mt-1 text-sm text-gray-500">View and manage your scheduled classes</p>
              <div className="mt-4">
                <button 
                  onClick={() => navigate('/trainer/classes')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  View Classes
                </button>
              </div>
            </div>
          </div>

          {/* Members Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">My Members</h3>
              <p className="mt-1 text-sm text-gray-500">View and manage your assigned members</p>
              <div className="mt-4">
                <button 
                  onClick={() => navigate('/trainer/members')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Manage Members
                </button>
              </div>
            </div>
          </div>

          {/* Schedule Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">My Schedule</h3>
              <p className="mt-1 text-sm text-gray-500">View and manage your availability</p>
              <div className="mt-4">
                <button 
                  onClick={() => navigate('/trainer/schedule')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  View Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrainerDashboard;
