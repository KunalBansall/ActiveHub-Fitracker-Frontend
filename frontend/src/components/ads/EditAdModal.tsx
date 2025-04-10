import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { Ad } from '../../context/AdContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface EditAdModalProps {
  ad: Ad;
  isOpen: boolean;
  onClose: () => void;
}

interface Gym {
  _id: string;
  gymName: string;
}

// Add API_URL constant and Cloudinary variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ActiveHub';
const CLOUDINARY_CLOUD_NAME = 'diy7wynvw';

const EditAdModal: React.FC<EditAdModalProps> = ({ ad, isOpen, onClose }) => {
  const [title, setTitle] = useState(ad.title);
  const [description, setDescription] = useState(ad.description || '');
  const [contentType, setContentType] = useState<'image' | 'video'>(ad.contentType);
  const [mediaUrl, setMediaUrl] = useState(ad.mediaUrl);
  const [ctaUrl, setCtaUrl] = useState(ad.ctaUrl || '');
  const [targetAudience, setTargetAudience] = useState<'admin' | 'member' | 'both'>(ad.targetAudience);
  const [expiresAt, setExpiresAt] = useState(new Date(ad.expiresAt));
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedGyms, setSelectedGyms] = useState<string[]>(ad.gyms || []);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Add placement to the state
  const [placement, setPlacement] = useState<string>(ad.placement || 'sidebar');

  useEffect(() => {
    // Reset form when ad changes
    setTitle(ad.title);
    setDescription(ad.description || '');
    setContentType(ad.contentType);
    setMediaUrl(ad.mediaUrl);
    setCtaUrl(ad.ctaUrl || '');
    setTargetAudience(ad.targetAudience);
    setExpiresAt(new Date(ad.expiresAt));
    setSelectedGyms(ad.gyms || []);
    setPlacement(ad.placement || 'sidebar'); // Set placement from ad data
    setFile(null);
    setFilePreview(null);

    // Fetch list of gyms
    const fetchGyms = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_URL}/admin/gyms`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGyms(data.gyms || []);
      } catch (error) {
        console.error('Error fetching gyms:', error);
        toast.error('Failed to load gyms');
      } finally {
        setLoading(false);
      }
    };

    fetchGyms();
  }, [ad]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if file is an image or video based on content type
      const fileType = selectedFile.type.split('/')[0];
      if ((contentType === 'image' && fileType !== 'image') || 
          (contentType === 'video' && fileType !== 'video')) {
        toast.error(`Please select a ${contentType} file`);
        return;
      }
      
      setFile(selectedFile);
      
      // Create preview for image files
      if (fileType === 'image') {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFilePreview(event.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        // For video, we use the video element to show preview
        setFilePreview(URL.createObjectURL(selectedFile));
      }
    }
  };

  const uploadToCloudinary = async () => {
    if (!file) return null;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      // Construct the correct Cloudinary upload URL
      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${contentType}/upload`;
      
      const { data } = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Requested-With': 'XMLHttpRequest'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      });
      
      setIsUploading(false);
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      toast.error('Failed to upload media');
      setIsUploading(false);
      return null;
    }
  };

  const handleGymSelection = (gymId: string) => {
    if (selectedGyms.includes(gymId)) {
      setSelectedGyms(selectedGyms.filter(id => id !== gymId));
    } else {
      setSelectedGyms([...selectedGyms, gymId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Validate form
      if (!title) {
        toast.error('Please provide a title for the ad');
        setSubmitting(false);
        return;
      }
      
      // Upload file if selected
      let finalMediaUrl = mediaUrl;
      if (file) {
        const uploadedUrl = await uploadToCloudinary();
        if (!uploadedUrl) {
          setSubmitting(false);
          return;
        }
        finalMediaUrl = uploadedUrl;
      }
      
      if (!finalMediaUrl) {
        toast.error('Please provide a media URL or upload a file');
        setSubmitting(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      
      // Prepare payload
      const adData = {
        title,
        description: description || undefined,
        contentType,
        mediaUrl: finalMediaUrl,
        ctaUrl: ctaUrl || undefined,
        targetAudience,
        gyms: selectedGyms,
        expiresAt: expiresAt.toISOString(),
        placement
      };
      
      // Submit to API
      await axios.patch(`${API_URL}/ads/${ad._id}`, adData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Ad updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating ad:', error);
      toast.error('Failed to update ad');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div>
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Edit Ad
                    </Dialog.Title>
                    
                    <form className="mt-4" onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        {/* Title */}
                        <div className="sm:col-span-6">
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Title *
                          </label>
                          <input
                            type="text"
                            name="title"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                          />
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-6">
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>

                        {/* Content Type */}
                        <div className="sm:col-span-3">
                          <label htmlFor="contentType" className="block text-sm font-medium text-gray-700">
                            Content Type *
                          </label>
                          <select
                            id="contentType"
                            name="contentType"
                            value={contentType}
                            onChange={(e) => {
                              setContentType(e.target.value as 'image' | 'video');
                              // Reset file when content type changes
                              setFile(null);
                              setFilePreview(null);
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                          </select>
                        </div>

                        {/* Target Audience */}
                        <div className="sm:col-span-3">
                          <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">
                            Target Audience *
                          </label>
                          <select
                            id="targetAudience"
                            name="targetAudience"
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value as 'admin' | 'member' | 'both')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="both">Both</option>
                          </select>
                        </div>

                        {/* Current Media */}
                        <div className="sm:col-span-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Media
                          </label>
                          <div className="flex justify-center">
                            {contentType === 'image' ? (
                              <img 
                                src={mediaUrl} 
                                alt={title} 
                                className="h-40 w-auto object-contain rounded-md border border-gray-200"
                              />
                            ) : (
                              <video 
                                src={mediaUrl} 
                                muted
                                autoPlay
                                loop
                                playsInline
                                className="h-40 w-auto object-contain rounded-md border border-gray-200"
                              />
                            )}
                          </div>
                        </div>

                        {/* File Upload */}
                        <div className="sm:col-span-6">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Upload New {contentType === 'image' ? 'Image' : 'Video'}
                          </label>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="file-upload"
                                  className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500"
                                >
                                  <span>Upload a {contentType}</span>
                                  <input 
                                    id="file-upload" 
                                    name="file-upload" 
                                    type="file" 
                                    className="sr-only" 
                                    onChange={handleFileChange}
                                    accept={contentType === 'image' ? 'image/*' : 'video/*'}
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                {contentType === 'image' ? 'PNG, JPG, GIF up to 10MB' : 'MP4, WebM up to 100MB'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Preview area */}
                          {filePreview && (
                            <div className="mt-3 flex justify-center">
                              {contentType === 'image' ? (
                                <img 
                                  src={filePreview} 
                                  alt="Preview" 
                                  className="h-32 w-auto object-contain rounded-md"
                                />
                              ) : (
                                <video 
                                  src={filePreview} 
                                  muted
                                  autoPlay
                                  loop
                                  playsInline
                                  className="h-32 w-auto object-contain rounded-md"
                                />
                              )}
                            </div>
                          )}
                          
                          {/* Upload progress */}
                          {isUploading && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Uploading: {uploadProgress}%
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Media URL */}
                        <div className="sm:col-span-6">
                          <label htmlFor="mediaUrl" className="block text-sm font-medium text-gray-700">
                            Media URL (Alternative)
                          </label>
                          <input
                            type="text"
                            name="mediaUrl"
                            id="mediaUrl"
                            value={mediaUrl}
                            onChange={(e) => setMediaUrl(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            You can either upload a file or update the URL directly
                          </p>
                        </div>

                        {/* CTA URL */}
                        <div className="sm:col-span-6">
                          <label htmlFor="ctaUrl" className="block text-sm font-medium text-gray-700">
                            Call to Action URL
                          </label>
                          <input
                            type="text"
                            name="ctaUrl"
                            id="ctaUrl"
                            value={ctaUrl}
                            onChange={(e) => setCtaUrl(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>

                        {/* Expiry Date */}
                        <div className="sm:col-span-3">
                          <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700">
                            Expires On *
                          </label>
                          <input
                            type="date"
                            name="expiresAt"
                            id="expiresAt"
                            value={format(expiresAt, 'yyyy-MM-dd')}
                            onChange={(e) => setExpiresAt(new Date(e.target.value))}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                          />
                        </div>

                        {/* Gym Targeting */}
                        <div className="sm:col-span-6">
                          <fieldset>
                            <legend className="text-sm font-medium text-gray-700">Target Specific Gyms</legend>
                            <p className="text-xs text-gray-500 mt-1">
                              Leave empty to target all gyms. Select multiple to target specific gyms.
                            </p>
                            
                            {loading ? (
                              <div className="animate-pulse h-10 bg-gray-100 rounded mt-2"></div>
                            ) : gyms.length === 0 ? (
                              <div className="text-sm text-gray-500 mt-2">No gyms found.</div>
                            ) : (
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {gyms.map(gym => (
                                  <div key={gym._id} className="flex items-center">
                                    <input
                                      id={`gym-${gym._id}`}
                                      name={`gym-${gym._id}`}
                                      type="checkbox"
                                      checked={selectedGyms.includes(gym._id)}
                                      onChange={() => handleGymSelection(gym._id)}
                                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor={`gym-${gym._id}`} className="ml-2 text-sm text-gray-700">
                                      {gym.gymName}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </fieldset>
                        </div>

                        {/* Placement */}
                        <div className="sm:col-span-3">
                          <label htmlFor="placement" className="block text-sm font-medium text-gray-700">
                            Ad Placement Location *
                          </label>
                          <select
                            id="placement"
                            name="placement"
                            value={placement}
                            onChange={(e) => setPlacement(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                          >
                            <option value="sidebar">Sidebar</option>
                            <option value="authPage">Login/Auth Page</option>
                            <option value="profile">Profile Footer</option>
                            <option value="topOverlay">Top Overlay</option>
                            <option value="fullScreen">Full Screen (Login only)</option>
                          </select>
                          <p className="mt-1 text-xs text-gray-500">
                            Choose where this ad will be displayed. Full Screen ads appear once after login.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={submitting || isUploading}
                          className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                          {submitting || isUploading ? (
                            <div className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {isUploading ? 'Uploading...' : 'Saving...'}
                            </div>
                          ) : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default EditAdModal; 