import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import CreateAdForm from '../../components/ads/CreateAdForm';
import AdList from '../../components/ads/AdList';
import AdAnalytics from '../../components/ads/AdAnalytics';
import { 
  ChartBarIcon, 
  PlusIcon, 
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

// Simple classNames utility function
const classNames = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

const AdManager: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is owner
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'owner') {
      toast.error('You are not authorized to access this page');
      navigate('/');
    } else {
      setIsAuthorized(true);
      setLoading(false);
    }
  }, [navigate]);

  const handleAdCreated = () => {
    toast.success('Ad created successfully!');
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Ad Manager</h1>
        
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-indigo-50 p-1">
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-indigo-700 shadow'
                    : 'text-indigo-500 hover:bg-white/[0.12] hover:text-indigo-600'
                )
              }
            >
              <div className="flex items-center justify-center">
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Ad
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-indigo-700 shadow'
                    : 'text-indigo-500 hover:bg-white/[0.12] hover:text-indigo-600'
                )
              }
            >
              <div className="flex items-center justify-center">
                <ListBulletIcon className="w-5 h-5 mr-2" />
                Manage Ads
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-indigo-700 shadow'
                    : 'text-indigo-500 hover:bg-white/[0.12] hover:text-indigo-600'
                )
              }
            >
              <div className="flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 mr-2" />
                Analytics
              </div>
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-6">
            <Tab.Panel className={classNames('rounded-xl p-3')}>
              <CreateAdForm onAdCreated={handleAdCreated} />
            </Tab.Panel>
            <Tab.Panel className={classNames('rounded-xl p-3')}>
              <AdList refreshTrigger={refreshTrigger} />
            </Tab.Panel>
            <Tab.Panel className={classNames('rounded-xl p-3')}>
              <AdAnalytics />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default AdManager;
