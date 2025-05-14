import React, { useState, useEffect, Fragment, useRef } from 'react';
import { format } from 'date-fns';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  PhotoIcon,
  VideoCameraIcon,
  ChevronUpDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { 
  DeveloperAnnouncement, 
  createAnnouncement, 
  getOwnerAnnouncements, 
  updateAnnouncement, 
  deleteAnnouncement 
} from '../../services/developerAnnouncementService';
import Layout from '../../components/owner/Layout';

const DeveloperAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<DeveloperAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [openForm, setOpenForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'update'>('info');
  const [visible, setVisible] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [targetAudience, setTargetAudience] = useState<'all' | 'trial' | 'active' | 'expired'>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cloudinary configuration
  const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL || 'https://api.cloudinary.com/v1_1/diy7wynvw/upload';
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ActiveHub';

  // Fetch announcements on component mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Fetch all announcements
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await getOwnerAnnouncements();
      setAnnouncements(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open form dialog for creating a new announcement
  const handleOpenCreateForm = () => {
    const resetForm = () => {
      setCurrentId(null);
      setTitle('');
      setMessage('');
      setType('info');
      setVisible(true);
      setSendEmail(false);
      setMediaUrl(null);
      setMediaType(null);
      setTargetAudience('all');
      setEditMode(false);
      setUploadProgress(0);
    };

    resetForm();
    setOpenForm(true);
  };

  // Open form dialog for editing an existing announcement
  const handleOpenEditForm = (announcement: DeveloperAnnouncement) => {
    setCurrentId(announcement._id);
    setTitle(announcement.title);
    setMessage(announcement.message);
    setType(announcement.type);
    setVisible(announcement.visible);
    setMediaUrl(announcement.mediaUrl || null);
    setMediaType(announcement.mediaType || null);
    setTargetAudience(announcement.targetAudience || 'all');
    setEditMode(true);
    setOpenForm(true);
  };

  // Close form dialog
  const handleCloseForm = () => {
    setOpenForm(false);
  };

  // Upload media to Cloudinary
  const uploadToCloudinary = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      setUploading(true);
      setUploadProgress(0);
      
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      
      // Setup progress listener
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });
      
      xhr.open('POST', CLOUDINARY_URL, true);
      
      xhr.onload = function() {
        if (this.status === 200) {
          const response = JSON.parse(this.responseText);
          setUploading(false);
          resolve(response.secure_url);
        } else {
          setUploading(false);
          reject(new Error('Upload failed'));
        }
      };
      
      xhr.onerror = function() {
        setUploading(false);
        reject(new Error('Upload failed'));
      };
      
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      
      xhr.send(formData);
    });
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      // Determine media type
      const fileType = file.type.startsWith('image/') ? 'image' : 
                       file.type.startsWith('video/') ? 'video' : null;
      
      if (!fileType) {
        toast.error('Unsupported file type. Please upload an image or video.');
        return;
      }
      
      setMediaType(fileType as 'image' | 'video');
      
      // Upload to Cloudinary
      const uploadedUrl = await uploadToCloudinary(file);
      setMediaUrl(uploadedUrl);
      toast.success('Media uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload media. Please try again.');
    }
  };

  // Handle form submission (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (submitting) return;
    
    try {
      setSubmitting(true);
      
      if (!title.trim() || !message.trim()) {
        toast.error('Title and message are required');
        setSubmitting(false);
        return;
      }

      if (editMode && currentId) {
        // Update existing announcement
        await updateAnnouncement(currentId, {
          title,
          message,
          type,
          visible,
          mediaUrl,
          mediaType,
          targetAudience
        });
        toast.success('Announcement updated successfully');
      } else {
        // Create new announcement
        await createAnnouncement({
          title,
          message,
          type,
          sendEmail,
          mediaUrl,
          mediaType,
          targetAudience
        });
        toast.success('Announcement created successfully');
      }

      // Refresh announcements list
      fetchAnnouncements();
      
      // Close form and reset fields
      setOpenForm(false);
      const resetForm = () => {
        setCurrentId(null);
        setTitle('');
        setMessage('');
        setType('info');
        setVisible(true);
        setSendEmail(false);
        setMediaUrl(null);
        setMediaType(null);
        setTargetAudience('all');
        setEditMode(false);
        setUploadProgress(0);
      };
      resetForm();
    } catch (err) {
      console.error('Error saving announcement:', err);
      toast.error('Error saving announcement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle announcement visibility
  const handleToggleVisibility = async (announcement: DeveloperAnnouncement) => {
    try {
      await updateAnnouncement(announcement._id, {
        visible: !announcement.visible
      });
      fetchAnnouncements();
      toast.success(`Announcement ${!announcement.visible ? 'published' : 'hidden'} successfully`);
    } catch (err) {
      console.error('Error toggling visibility:', err);
      toast.error('Failed to update announcement visibility');
    }
  };

  // Delete announcement
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteAnnouncement(id);
        fetchAnnouncements();
        toast.success('Announcement deleted successfully');
      } catch (err) {
        console.error('Error deleting announcement:', err);
        toast.error('Failed to delete announcement');
      }
    }
  };

  // Get badge color based on announcement type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800';
      case 'update':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <div className="flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Developer Announcements</h1>
            <p className="mt-2 text-sm text-gray-700">
              Create and manage announcements for your admin users.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-0 sm:ml-4 md:ml-16 flex-none">
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={handleOpenCreateForm}
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Announcement
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <p className="text-gray-600">
            Create and manage announcements that will be displayed to all gym admins. Use this feature to communicate important updates, new features, or system maintenance.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700">No announcements yet</h2>
            <p className="text-gray-500 mt-2">
              Create your first announcement to communicate with gym admins
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop table view (hidden on mobile) */}
            <div className="hidden sm:block bg-white shadow overflow-hidden rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {announcements.map((announcement) => (
                    <tr key={announcement._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{announcement.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(announcement.type)}`}>
                          {announcement.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(announcement.createdAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {announcement.visible ? (
                          <span className="text-green-600 font-medium">Visible</span>
                        ) : (
                          <span className="text-gray-400">Hidden</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleToggleVisibility(announcement)}
                            className="text-gray-600 hover:text-gray-900"
                            title={announcement.visible ? 'Hide announcement' : 'Show announcement'}
                          >
                            {announcement.visible ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenEditForm(announcement)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit announcement"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(announcement._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete announcement"
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

            {/* Mobile card view (shown only on mobile) */}
            <div className="sm:hidden space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement._id} className="bg-white shadow overflow-hidden rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div className="text-sm font-medium text-gray-900 flex-1">{announcement.title}</div>
                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(announcement.type)}`}>
                      {announcement.type}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {format(new Date(announcement.createdAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                    <div>
                      {announcement.visible ? (
                        <span className="text-xs text-green-600 font-medium">Visible</span>
                      ) : (
                        <span className="text-xs text-gray-400">Hidden</span>
                      )}
                    </div>
                  </div>

                  {announcement.mediaUrl && (
                    <div className="mt-3 border rounded-md overflow-hidden bg-gray-50 h-20">
                      {announcement.mediaType === 'image' ? (
                        <img src={announcement.mediaUrl} alt="Announcement media" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <VideoCameraIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end space-x-4">
                    <button
                      onClick={() => handleToggleVisibility(announcement)}
                      className="text-gray-600 hover:text-gray-900 flex items-center"
                    >
                      {announcement.visible ? (
                        <>
                          <EyeSlashIcon className="h-5 w-5 mr-1" />
                          <span className="text-xs">Hide</span>
                        </>
                      ) : (
                        <>
                          <EyeIcon className="h-5 w-5 mr-1" />
                          <span className="text-xs">Show</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenEditForm(announcement)}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center"
                    >
                      <PencilIcon className="h-5 w-5 mr-1" />
                      <span className="text-xs">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(announcement._id)}
                      className="text-red-600 hover:text-red-900 flex items-center"
                    >
                      <TrashIcon className="h-5 w-5 mr-1" />
                      <span className="text-xs">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create/Edit Announcement Dialog */}
        <Transition appear show={openForm} as={Fragment}>
          <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={handleCloseForm}>
            <div className="min-h-screen px-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
              </Transition.Child>

              {/* This element is to trick the browser into centering the modal contents. */}
              <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
              
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div className="inline-block w-full max-w-md p-4 sm:p-6 my-8 mx-2 sm:mx-auto overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {editMode ? 'Edit Announcement' : 'Create New Announcement'}
                  </Dialog.Title>
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        id="title"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                        placeholder="E.g., New Feature Release"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                      <textarea
                        id="message"
                        rows={6}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={message}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                        placeholder="Enter your announcement message here..."
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        id="type"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        value={type}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as 'info' | 'warning' | 'update')}
                      >
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="update">Update</option>
                      </select>
                    </div>
                    
                    {editMode ? (
                      <div className="flex items-center">
                        <input
                          id="visible"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={visible}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVisible(e.target.checked)}
                        />
                        <label htmlFor="visible" className="ml-2 block text-sm text-gray-900">
                          Visible to admins
                        </label>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <input
                          id="sendEmail"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={sendEmail}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSendEmail(e.target.checked)}
                        />
                        <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-900">
                          Send email notification to all admins
                        </label>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Target Audience
                      </label>
                      <Listbox value={targetAudience} onChange={setTargetAudience}>
                        <div className="relative mt-1">
                          <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                            <span className="block truncate">
                              {targetAudience === 'all' ? 'All Admins' :
                               targetAudience === 'trial' ? 'Admins on Trial' :
                               targetAudience === 'active' ? 'Admins with Active Subscription' :
                               'Admins with Expired Subscription'}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              <Listbox.Option
                                className={({ active }) =>
                                  `${active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'}
                                    cursor-default select-none relative py-2 pl-10 pr-4`
                                }
                                value="all"
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                                      All Admins
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Listbox.Option>
                              <Listbox.Option
                                className={({ active }) =>
                                  `${active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'}
                                    cursor-default select-none relative py-2 pl-10 pr-4`
                                }
                                value="trial"
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                                      Admins on Trial
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Listbox.Option>
                              <Listbox.Option
                                className={({ active }) =>
                                  `${active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'}
                                    cursor-default select-none relative py-2 pl-10 pr-4`
                                }
                                value="active"
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                                      Admins with Active Subscription
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Listbox.Option>
                              <Listbox.Option
                                className={({ active }) =>
                                  `${active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'}
                                    cursor-default select-none relative py-2 pl-10 pr-4`
                                }
                                value="expired"
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                                      Admins with Expired Subscription
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Listbox.Option>
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Media Attachment (Optional)
                      </label>
                      <div className="mt-1 flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          disabled={uploading}
                        >
                          {uploading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Uploading ({uploadProgress}%)
                            </>
                          ) : (
                            <>
                              {mediaType === 'image' ? <PhotoIcon className="h-4 w-4 mr-2" /> : 
                               mediaType === 'video' ? <VideoCameraIcon className="h-4 w-4 mr-2" /> : 
                               <PlusIcon className="h-4 w-4 mr-2" />}
                              {mediaUrl ? 'Change Media' : 'Upload Media'}
                            </>
                          )}
                        </button>
                        {mediaUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setMediaUrl(null);
                              setMediaType(null);
                            }}
                            className="inline-flex items-center px-2 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {mediaUrl && (
                        <div className="mt-2 border rounded-md p-2 bg-gray-50">
                          {mediaType === 'image' ? (
                            <img src={mediaUrl} alt="Attachment preview" className="h-32 object-contain mx-auto" />
                          ) : mediaType === 'video' ? (
                            <video controls className="h-32 mx-auto">
                              <source src={mediaUrl} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={handleCloseForm}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {editMode ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editMode ? 'Update' : 'Create'
                      )}
                    </button>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>
      </div>
  
  );
};

export default DeveloperAnnouncementsPage;
