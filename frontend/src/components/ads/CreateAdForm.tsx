import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

// Define the API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ActiveHub';
const CLOUDINARY_CLOUD_NAME = 'diy7wynvw';

interface Gym {
  _id: string;
  gymName: string;
}

interface CreateAdFormProps {
  onSuccess?: () => void;
}

const CreateAdForm: React.FC<CreateAdFormProps> = ({ onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState<'admin' | 'member' | 'both'>('both');
  const [expiresAt, setExpiresAt] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Default 30 days
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedGyms, setSelectedGyms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Add placement field to the state
  const [placement, setPlacement] = useState<'sidebar' | 'authPage' | 'profile' | 'topOverlay' | 'fullScreen'>('sidebar');

  // Fetch list of gyms
  useEffect(() => {
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
  }, []);

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
        gyms: selectedGyms.length > 0 ? selectedGyms : [],
        expiresAt: expiresAt.toISOString(),
        placement // Add placement field to payload
      };
      
      // Submit to API
      await axios.post(`${API_URL}/ads`, adData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setContentType('image');
      setMediaUrl('');
      setCtaUrl('');
      setTargetAudience('both');
      setExpiresAt(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      setSelectedGyms([]);
      setFile(null);
      setFilePreview(null);
      setPlacement('sidebar');
      
      toast.success('Ad created successfully');
      
      // Call success callback if provided
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating ad:', error);
      toast.error('Failed to create ad');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGymSelection = (gymId: string) => {
    if (selectedGyms.includes(gymId)) {
      setSelectedGyms(selectedGyms.filter(id => id !== gymId));
    } else {
      setSelectedGyms([...selectedGyms, gymId]);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h2 className="text-lg font-medium text-gray-800">Create New Ad</h2>
      </div>
      
      <form className="p-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter ad title"
              required
            />
          </div>
          
          {/* Description */}
          <div className="col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter ad description (optional)"
            />
          </div>
          
          {/* Content Type */}
          <div>
            <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-1">
              Content Type *
            </label>
            <select
              id="contentType"
              value={contentType}
              onChange={(e) => {
                setContentType(e.target.value as 'image' | 'video');
                // Reset file when content type changes
                setFile(null);
                setFilePreview(null);
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>
          
          {/* Target Audience */}
          <div>
            <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-1">
              Target Audience *
            </label>
            <select
              id="targetAudience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as 'admin' | 'member' | 'both')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="both">Both</option>
            </select>
          </div>
          
          {/* File Upload */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload {contentType === 'image' ? 'Image' : 'Video'} *
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
          
          {/* Media URL (Alternative) */}
          <div className="col-span-2">
            <label htmlFor="mediaUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Media URL (Alternative)
            </label>
            <input
              id="mediaUrl"
              type="text"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Or enter Cloudinary URL directly"
            />
            <p className="mt-1 text-xs text-gray-500">
              You can either upload a file or provide a URL directly
            </p>
          </div>
          
          {/* CTA URL */}
          <div className="col-span-2">
            <label htmlFor="ctaUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Call to Action URL
            </label>
            <input
              id="ctaUrl"
              type="text"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter link URL (optional)"
            />
          </div>
          
          {/* Expiry Date */}
          <div>
            <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-1">
              Expires On *
            </label>
            <DatePicker
              selected={expiresAt}
              onChange={(date: Date | null) => date && setExpiresAt(date)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              minDate={new Date()}
              dateFormat="MMMM d, yyyy"
              required
            />
          </div>
          
          {/* Gym Targeting */}
          <div className="col-span-2 mt-4">
            <fieldset>
              <legend className="text-sm font-medium text-gray-700">Target Specific Gyms</legend>
              <p className="text-xs text-gray-500 mb-2">
                Leave empty to target all gyms. Select multiple to target specific gyms.
              </p>
              
              {loading ? (
                <div className="animate-pulse h-10 bg-gray-100 rounded"></div>
              ) : gyms.length === 0 ? (
                <div className="text-sm text-gray-500">No gyms found.</div>
              ) : (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {gyms.map(gym => (
                    <div key={gym._id} className="flex items-center">
                      <input
                        id={`gym-${gym._id}`}
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
          
          {/* Placement Selection */}
          <div>
            <label htmlFor="placement" className="block text-sm font-medium text-gray-700 mb-1">
              Ad Placement Location *
            </label>
            <select
              id="placement"
              value={placement}
              onChange={(e) => setPlacement(e.target.value as 'sidebar' | 'authPage' | 'profile' | 'topOverlay' | 'fullScreen')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="sidebar">Sidebar</option>
              <option value="authPage">Login/Auth Page</option>
              <option value="profile">Profile Footer</option>
              <option value="topOverlay">Top Overlay</option>
              <option value="fullScreen">Full Screen (Login only)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Choose where this ad will be displayed in the application. Full Screen ads appear once after login and take up 50% of screen height.
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={submitting || isUploading}
            className="flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting || isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{isUploading ? 'Uploading...' : 'Creating...'}</span>
              </>
            ) : (
              'Create Ad'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAdForm; 