import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import CreateAdForm from '../components/ads/CreateAdForm';
import AdList from '../components/ads/AdList';
import { 
  ChartBarIcon, 
  PlusIcon, 
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

// Simple classNames utility function
const classNames = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

const AdManager: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Check if the current user is the owner
  useEffect(() => {
    const checkOwnerStatus = () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/signin');
          return;
        }
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Check if user's email matches OWNER_EMAIL or role is 'owner'
        if (user.role === 'owner' || user.email === import.meta.env.VITE_OWNER_EMAIL) {
          setIsAuthorized(true);
        } else {
          // Redirect non-owners
          navigate('/');
          toast.error('Access denied. Only the owner can access ad management.');
        }
      } catch (error) {
        console.error('Error checking owner status:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    checkOwnerStatus();
  }, [navigate]);
  
  const handleAdCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // This will prevent flashing content before redirect
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <header className="mb-6">
        <div className="flex flex-wrap items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Ad Management</h1>
        </div>
        <p className="mt-2 text-sm text-gray-700">
          Create and manage ads to display to admins and members
        </p>
      </header>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/10 p-1 mb-6">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'flex items-center justify-center',
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'
              )
            }
          >
            <ListBulletIcon className="h-5 w-5 mr-2" />
            View Ads
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'flex items-center justify-center',
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'
              )
            }
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Ad
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'flex items-center justify-center',
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'
              )
            }
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Analytics
          </Tab>
        </Tab.List>
        
        <Tab.Panels className="mt-2">
          <Tab.Panel className="rounded-xl bg-white p-3">
            <AdList refreshTrigger={refreshTrigger} />
          </Tab.Panel>
          <Tab.Panel className="rounded-xl bg-white p-3">
            <CreateAdForm onSuccess={handleAdCreated} />
          </Tab.Panel>
          <Tab.Panel className="rounded-xl bg-white p-3">
            <div className="p-8 text-center">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Analytics Coming Soon</h3>
              <p className="mt-1 text-sm text-gray-500">
                View detailed analytics for your ads, including views, clicks, and engagement rates.
                This feature is under development and will be available soon.
              </p>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default AdManager; 