import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Switch } from '@headlessui/react';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Ad } from '../../context/AdContext';
import EditAdModal from './EditAdModal';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';
// Define the API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AdListProps {
  onEdit?: (ad: Ad) => void;
  refreshTrigger?: number;
}

const AdList: React.FC<AdListProps> = ({ onEdit, refreshTrigger = 0 }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'admin' | 'member' | 'both'>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  const fetchAds = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Special endpoint to fetch all ads for owner
      const { data } = await axios.get(`${API_URL}/ads/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAds(data.ads || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast.error('Failed to load ads');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAds();
  }, [refreshTrigger]);
  
  const toggleAdStatus = async (adId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.patch(
        `${API_URL}/ads/${adId}`,
        { active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setAds(prevAds => 
        prevAds.map(ad => 
          ad._id === adId ? { ...ad, active: !currentStatus } : ad
        )
      );
      
      toast.success(`Ad ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling ad status:', error);
      toast.error('Failed to update ad status');
    }
  };
  
  const handleEditClick = (ad: Ad) => {
    setEditingAd(ad);
  };
  
  const handleEditComplete = () => {
    setEditingAd(null);
    fetchAds(); // Refresh the list
  };

  const handleDeleteClick = (adId: string) => {
    setConfirmDelete(adId);
  };

  const confirmDeleteAd = async () => {
    if (!confirmDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(
        `${API_URL}/ads/${confirmDelete}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setAds(prevAds => prevAds.filter(ad => ad._id !== confirmDelete));
      
      toast.success('Ad deleted successfully');
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error('Failed to delete ad');
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };
  
  // Apply filters
  const filteredAds = ads.filter(ad => {
    // Status filter
    if (filter === 'active' && !ad.active) return false;
    if (filter === 'inactive' && ad.active) return false;
    
    // Audience filter
    if (audienceFilter !== 'all' && ad.targetAudience !== audienceFilter) return false;
    
    return true;
  });

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium text-gray-800">Ad Management</h2>
        
        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
            <select 
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value as any)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center p-8">
          {/* <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div> */}
          <LoadingSpinner size="xl" />
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No ads found matching the selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAds.map((ad) => (
                <tr key={ad._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 ring-1 ring-gray-200">
                        {ad.contentType === 'image' ? (
                          <img 
                            src={ad.mediaUrl} 
                            alt={ad.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <video 
                            src={ad.mediaUrl}
                            className="h-full w-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                          />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-1 max-w-xs">
                          {ad.title}
                        </div>
                        {ad.description && (
                          <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">
                            {ad.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ad.contentType === 'image' 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {ad.contentType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="flex items-center">
                      <span className={`h-2 w-2 rounded-full mr-1.5 ${
                        ad.targetAudience === 'both' 
                          ? 'bg-green-500' 
                          : ad.targetAudience === 'admin' 
                            ? 'bg-blue-500' 
                            : 'bg-yellow-500'
                      }`}></span>
                      {ad.targetAudience}
                    </span>
                    {ad.gyms && ad.gyms.length > 0 && (
                      <span className="ml-1 text-xs text-gray-400 flex items-center">
                        <svg className="h-3 w-3 mr-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {ad.gyms.length}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span className="font-medium">{format(new Date(ad.expiresAt), 'MMM d, yyyy')}</span>
                      <span className={`text-xs ${
                        new Date(ad.expiresAt) < new Date() 
                          ? 'text-red-500' 
                          : 'text-gray-400'
                      }`}>
                        {new Date(ad.expiresAt) < new Date() 
                          ? 'Expired' 
                          : `${Math.ceil((new Date(ad.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`
                        }
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Switch
                      checked={ad.active}
                      onChange={() => toggleAdStatus(ad._id, ad.active)}
                      className={`${
                        ad.active ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full`}
                    >
                      <span className="sr-only">
                        {ad.active ? 'Active' : 'Inactive'}
                      </span>
                      <span
                        className={`${
                          ad.active ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                      />
                    </Switch>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(ad.mediaUrl, '_blank')}
                        className="text-blue-600 hover:text-blue-900"
                        title="Preview"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEditClick(ad)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(ad._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Edit Modal */}
      {editingAd && (
        <EditAdModal
          ad={editingAd}
          isOpen={!!editingAd}
          onClose={handleEditComplete}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Delete Ad
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this ad? This action cannot be undone and all data associated with this ad will be permanently removed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDeleteAd}
                >
                  Delete
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={cancelDelete}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdList; 