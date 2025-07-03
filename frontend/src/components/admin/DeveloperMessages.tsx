import React, { useState, useEffect, useRef, Fragment } from 'react';
import { BellIcon, XMarkIcon, PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { getAdminAnnouncements } from '../../services/developerAnnouncementService';
import { toast } from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';

interface DeveloperAnnouncement {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'update';
  visible: boolean;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | null;
  targetAudience?: 'all' | 'trial' | 'active' | 'expired';
  createdAt: string;
  updatedAt: string;
}

const DeveloperMessages: React.FC = () => {
  const [announcements, setAnnouncements] = useState<DeveloperAnnouncement[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<DeveloperAnnouncement | null>(null);

  // Load announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const response = await getAdminAnnouncements();
        setAnnouncements(response.data);
        
        // Check for unread announcements (using localStorage to track)
        const viewedAnnouncements = JSON.parse(localStorage.getItem('viewedAnnouncements') || '[]');
        const newUnreadCount = response.data.filter(
          (announcement: DeveloperAnnouncement) => !viewedAnnouncements.includes(announcement._id)
        ).length;
        
        setUnreadCount(newUnreadCount);
      } catch (error: unknown) {
        console.error('Error fetching announcements:', error);
        // Only show error toast if there was an actual error, not for empty responses
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status !== 404) {
          toast.error('Failed to load developer announcements');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
    
    // Refresh announcements every 5 minutes
    const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mark announcements as read when opened
  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
    
    if (!isOpen && unreadCount > 0) {
      // Mark all as read
      const viewedAnnouncements = JSON.parse(localStorage.getItem('viewedAnnouncements') || '[]');
      
      const newViewedAnnouncements = [
        ...viewedAnnouncements,
        ...announcements
          .filter((announcement) => !viewedAnnouncements.includes(announcement._id))
          .map((announcement) => announcement._id)
      ];
      
      localStorage.setItem('viewedAnnouncements', JSON.stringify(newViewedAnnouncements));
      setUnreadCount(0);
    }
  };

  // Get background color based on announcement type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'update':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="relative p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none transition-colors duration-200"
        onClick={handleToggleDropdown}
        aria-expanded={isOpen}
      >
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
        <BellIcon className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-x-0 top-14 mx-2 sm:mx-0 sm:absolute sm:right-0 sm:left-auto sm:top-auto sm:mt-2 w-auto sm:w-80 max-w-[95vw] sm:max-w-md bg-white rounded-md shadow-lg z-50 overflow-hidden border border-gray-200">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Developer Announcements</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <svg className="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2">Loading announcements...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No announcements available</p>
              </div>
            ) : (
              <div>
                {announcements.map((announcement) => (
                  <div 
                    key={announcement._id} 
                    className={`p-4 border-b ${getTypeColor(announcement.type)} cursor-pointer hover:bg-opacity-80 transition-colors duration-150`}
                    onClick={() => {
                      setSelectedAnnouncement(announcement);
                      setModalOpen(true);
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                      <h4 className="text-base font-medium text-gray-900">{announcement.title}</h4>
                      <span className="text-xs text-gray-500 mt-1 sm:mt-0">{formatDate(announcement.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{announcement.message}</p>
                    
                    {announcement.mediaUrl && (
                      <div className="mt-2 flex items-center text-xs text-indigo-600">
                        {announcement.mediaType === 'image' ? (
                          <>
                            <PhotoIcon className="h-4 w-4 mr-1" />
                            <span>Image attached</span>
                          </>
                        ) : (
                          <>
                            <VideoCameraIcon className="h-4 w-4 mr-1" />
                            <span>Video attached</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {announcements.length > 0 && (
            <div className="p-2 bg-gray-50 border-t border-gray-200 text-center">
              <button 
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
      {/* Detailed Message Modal */}
      <Transition.Root show={modalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setModalOpen}>
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 w-full max-w-[95vw] sm:max-w-lg sm:p-6 mx-2 sm:mx-auto">
                  {selectedAnnouncement && (
                    <>
                      <div className="absolute right-0 top-0 pr-4 pt-4">
                        <button
                          type="button"
                          className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          onClick={() => setModalOpen(false)}
                        >
                          <span className="sr-only">Close</span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                      <div>
                        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${selectedAnnouncement.type === 'warning' ? 'bg-yellow-100' : selectedAnnouncement.type === 'update' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <BellIcon 
                            className={`h-6 w-6 ${selectedAnnouncement.type === 'warning' ? 'text-yellow-600' : selectedAnnouncement.type === 'update' ? 'text-blue-600' : 'text-gray-600'}`} 
                            aria-hidden="true" 
                          />
                        </div>
                        <div className="mt-3 text-center sm:mt-5">
                          <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                            {selectedAnnouncement.title}
                          </Dialog.Title>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              {selectedAnnouncement.message}
                            </p>
                          </div>
                          
                          {selectedAnnouncement.mediaUrl && (
                            <div className="mt-4 border rounded-md overflow-hidden bg-gray-50">
                              {selectedAnnouncement.mediaType === 'image' ? (
                                <img 
                                  src={selectedAnnouncement.mediaUrl} 
                                  alt="Announcement image" 
                                  className="w-full object-contain max-h-48 sm:max-h-64 mx-auto" 
                                />
                              ) : selectedAnnouncement.mediaType === 'video' ? (
                                <video controls className="w-full max-h-48 sm:max-h-64 mx-auto">
                                  <source src={selectedAnnouncement.mediaUrl} type="video/mp4" />
                                  Your browser does not support the video tag.
                                </video>
                              ) : null}
                            </div>
                          )}
                          
                          <div className="mt-4 text-xs text-gray-500 text-right">
                            Posted on {formatDate(selectedAnnouncement.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 sm:mt-6">
                        <button
                          type="button"
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                          onClick={() => setModalOpen(false)}
                        >
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default DeveloperMessages;
