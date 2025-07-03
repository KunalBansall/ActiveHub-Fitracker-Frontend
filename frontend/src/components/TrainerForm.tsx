import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Plus, X, User, Users, Search } from 'lucide-react';
import axios from 'axios';
import { useQuery, useQueryClient } from 'react-query';

interface TrainerFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  onCancel: () => void;
}

interface Member {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  photo?: string;
}

const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const defaultImage = "/ah2.jpeg";

export default function TrainerForm({ onSubmit, initialData, onCancel }: TrainerFormProps) {
  const queryClient = useQueryClient();
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.image || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMemberList, setShowMemberList] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>(initialData?.assignedMembers || []);
  const [assignedToAll, setAssignedToAll] = useState(initialData?.assignedToAll || false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: initialData || {
      name: '',
      email: '',
      phone: '',
      assignedToAll: false,
      assignedMembers: []
    }
  });

  // Fetch all members for assignment
  const { data: members = [], isLoading: isLoadingMembers, error: membersError } = useQuery<Member[]>('members', async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching members from:', `${import.meta.env.VITE_API_URL}/members`);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Members API response:', response.data);
      // The API returns the array directly, not wrapped in a data property
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
  });

  // Filter members based on search term
  const filteredMembers = (members || []).filter(member =>
    (member.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (member.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ).filter(member => !selectedMembers.some(selected => selected._id === member._id));

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const response = await axios.post(CLOUDINARY_URL, formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(progress);
        },
      });
      setPhotoPreview(response.data.secure_url);
      setValue('image', response.data.secure_url);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageClick = () => {
    document.getElementById('fileInput')?.click();
  };

  const toggleMemberSelection = (member: Member) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m._id === member._id);
      if (isSelected) {
        return prev.filter(m => m._id !== member._id);
      } else {
        return [...prev, member];
      }
    });
  };

  const removeMember = (memberId: string) => {
    setSelectedMembers(prev => prev.filter(m => m._id !== memberId));
  };

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        image: photoPreview,
        assignedToAll,
        assignedMembers: assignedToAll ? [] : selectedMembers.map(m => m._id)
      });
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('There was an error while submitting the form.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setValue('assignedToAll', assignedToAll);
    if (assignedToAll) {
      setSelectedMembers([]);
    }
  }, [assignedToAll, setValue]);

  return (
    <div className="relative font-serif p-4">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left Column - Image */}
          <div className="space-y-4">
            <div 
              className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
              onClick={handleImageClick}
            >
              <img
                src={photoPreview || defaultImage}
                alt="Trainer Preview"
                className="w-full h-full object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="w-64 bg-gray-200 rounded-full h-2.5 mb-2">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p>Uploading... {uploadProgress}%</p>
                  </div>
                </div>
              )}
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  className="w-full p-2 border rounded-md"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="w-full p-2 border rounded-md"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  {...register('phone', { 
                    required: 'Phone is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Please enter a valid 10-digit phone number'
                    }
                  })}
                  type="tel"
                  className="w-full p-2 border rounded-md"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message as string}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Member Assignment */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="assignToAll"
                checked={assignedToAll}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setAssignedToAll(isChecked);
                  setValue('assignedToAll', isChecked);
                  if (isChecked) {
                    setSelectedMembers([]);
                  }
                }}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="assignToAll" className="ml-2 block text-sm text-gray-900">
                Assign to all members
              </label>
            </div>

            {!assignedToAll && (
              <div className="space-y-4">
                <div className="relative">
                  <div className="flex items-center">
                    <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setShowMemberList(true)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  {showMemberList && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {isLoadingMembers ? (
                        <div className="p-4 text-center text-gray-500">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                          Loading members...
                        </div>
                      ) : membersError ? (
                        <div className="p-4 text-center text-red-500">
                          Failed to load members. Please try again.
                          <button 
                            onClick={() => queryClient.refetchQueries('members')}
                            className="mt-2 text-sm text-blue-500 hover:underline"
                          >
                            Retry
                          </button>
                        </div>
                      ) : members.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No members found in the system.
                        </div>
                      ) : filteredMembers.length > 0 ? (
                        filteredMembers.map((member) => (
                          <div
                            key={member._id}
                            className="p-3 hover:bg-gray-100 cursor-pointer flex items-center"
                            onClick={() => {
                              if (!selectedMembers.some(m => m._id === member._id)) {
                                setSelectedMembers([...selectedMembers, member]);
                              }
                              setSearchTerm('');
                              setShowMemberList(false);
                            }}
                          >
                            <img
                              src={member.photo || defaultImage}
                              alt={member.name}
                              className="w-8 h-8 rounded-full mr-3 object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = defaultImage;
                              }}
                            />
                            <div>
                              <p className="font-medium text-sm">{member.name || 'No Name'}</p>
                              <p className="text-xs text-gray-500">{member.email || 'No Email'}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500">No members found</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">Assigned Members ({selectedMembers.length})</h3>
                  <div className="space-y-1">
                    {selectedMembers.length > 0 ? (
                      selectedMembers.map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {member.photo ? (
                                <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                              ) : (
                                <User className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                            <span className="text-sm">{member.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMember(member._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded-md">
                        No members assigned yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isSubmitting ? 'Saving...' : 'Save Trainer'}
          </button>
        </div>
      </form>
    </div>
  );
}
