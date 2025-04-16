import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Member, Product, Attendance } from "../types";
import { useForm } from "react-hook-form";
import {
  ArrowRightOnRectangleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  UserCircleIcon,
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  ShoppingBagIcon,
  BellIcon,
  ChartBarIcon,
  HomeIcon,
  StarIcon as StarIconOutline,
  FireIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import AttendanceHistoryModal from "../components/AttendenceHistoryModal";
import { MemberAttendance } from "../components/MemberAttendence";
import MemberNavCart from "../components/MemberNavCart";
import Cart from "../components/Cart";
import MemberAnnouncements from "../components/MemberAnnouncements";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Tabs for the profile page - reordered as requested
const tabs = [
  { id: 'shop', name: 'Shop', icon: ShoppingBagIcon },
  { id: 'announcements', name: 'Announcements', icon: SpeakerWaveIcon },
  { id: 'attendance', name: 'Attendance', icon: CalendarIcon },
  { id: 'membership', name: 'Membership', icon: CreditCardIcon },
  { id: 'profile', name: 'Profile', icon: UserCircleIcon },
];

interface Order {
  _id: string;
  products: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const MemberProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>('shop'); // Set Shop as the default tab
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [shopLoading, setShopLoading] = useState<boolean>(false);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<Partial<Member>>({
    defaultValues: member || undefined,
  });

  useEffect(() => {
    const fetchMember = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No token found, please log in.");
        navigate("/memberlogin");
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${API_URL}/member-auth/member/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        // Store member data
        setMember(response.data);
        
        // Try to get the photo from the API response
        if (response.data.photo) {
        setPhotoPreview(response.data.photo);
        } else {
          // If no photo in API response, try to get from localStorage as backup
          const savedPhoto = localStorage.getItem(`member_${id}_photo`);
          if (savedPhoto) {
            setPhotoPreview(savedPhoto);
            
            // If we found a photo in localStorage but not in API response,
            // we should update the server with this photo
            await updateProfilePhoto(savedPhoto);
          }
        }
        
        // Reset form with all member data
        reset(response.data);
      } catch (error: any) {
        toast.error(
          error.response?.data.message || "Failed to fetch member data"
        );
        navigate("/memberlogin");
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id, navigate, reset]);

  useEffect(() => {
    // Always fetch featured products on initial load since Shop is the default tab
    fetchFeaturedProducts();
    
    // Fetch data based on current tab
    if (currentTab === 'attendance') {
      fetchRecentAttendance();
    } else if (currentTab === 'orders') {
      fetchRecentOrders();
    }
  }, [currentTab]);

  const fetchFeaturedProducts = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setShopLoading(true);
      // Using the same pattern as your other API calls
      const response = await axios.get(
        `${API_URL}/member/products?featured=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFeaturedProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch featured products:", error);
      // Fallback to public products endpoint if member endpoint fails
      try {
        // Get the gym ID from the member data
        // Note: gymId might be added to the member data by the backend but not in the TypeScript interface
        // @ts-ignore - Ignore TypeScript error as gymId might be present at runtime
        const gymId = member?.gymId;
        
        if (gymId) {
          const publicResponse = await axios.get(
            `${API_URL}/public/products/featured?gymId=${gymId}`
          );
          setFeaturedProducts(publicResponse.data);
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        setFeaturedProducts([]); // Set empty array on total failure
      }
    } finally {
      setShopLoading(false);
    }
  };
  
  const fetchRecentAttendance = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const response = await axios.get(
        `${API_URL}/member-attendance/history`, // Adjust this endpoint as needed
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data) {
        setRecentAttendance(response.data.slice(0, 5)); // Show only the 5 most recent
      }
    } catch (error) {
      console.error("Failed to fetch recent attendance:", error);
      setRecentAttendance([]);
    }
  };

  const fetchRecentOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      setOrdersLoading(true);
      const response = await axios.get(
        `${API_URL}/member/orders?limit=3`, // Limit to 3 recent orders
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setRecentOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch recent orders:", error);
      setRecentOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    toast.success("Signed out successfully");
    navigate("/memberlogin");
  };

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

        const response = await axios.post(CLOUDINARY_URL, formData);
        const photoUrl = response.data.secure_url;
        setPhotoPreview(photoUrl);
        
        // Immediately update the profile picture in the database
        await updateProfilePhoto(photoUrl);
      } catch (error) {
        toast.error("Failed to upload the image. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };
  
  const updateProfilePhoto = async (photoUrl: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No token found, please log in.");
        navigate("/memberlogin");
        return;
      }
      
      // First, store the photo URL directly in the full member data, not just patch the photo
      const response = await axios.put(
        `${API_URL}/member-auth/member/${id}`,
        { 
          ...member,  // Send all existing member data
          photo: photoUrl  // Override just the photo field
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      toast.success("Profile picture updated successfully");
      
      // Refresh member data
      const updatedMember = await axios.get(
        `${API_URL}/member-auth/member/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Update both state variables
      setMember(updatedMember.data);
      setPhotoPreview(updatedMember.data.photo);
      
      // Update form values too
      reset({
        ...updatedMember.data,
        photo: updatedMember.data.photo
      });
      
      // Also store the photo URL in localStorage as a backup
      localStorage.setItem(`member_${id}_photo`, updatedMember.data.photo);
    } catch (error) {
      toast.error("Failed to update profile picture. Please try again.");
      console.error("Error updating profile picture:", error);
    }
  };

  const handleSave = async (data: Partial<Member>) => {
    try {
      setLoading(true);
      const updatedData = { 
        ...data, 
        photo: photoPreview 
      };

      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${API_URL}/member-auth/member/${id}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(response.data.message || "Member updated successfully");
      setIsEditing(false);
      
      // Refresh member data after successful update
      const updatedMember = await axios.get(
        `${API_URL}/member-auth/member/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Update state with fresh data
      setMember(updatedMember.data);
      setPhotoPreview(updatedMember.data.photo || photoPreview);
      reset(updatedMember.data);
      
      // Store photo URL in localStorage as backup
      if (updatedMember.data.photo) {
        localStorage.setItem(`member_${id}_photo`, updatedMember.data.photo);
      }
    } catch (error: any) {
      const rawMessage =
        error.response?.data.error || error.response?.data.message;

      if (rawMessage?.includes("E11000")) {
        const match = rawMessage.match(/dup key: { (\w+): "(.*?)" }/);
        const field = match?.[1];
        const value = match?.[2];

        if (field && value) {
          toast.error(
            `${
              field.charAt(0).toUpperCase() + field.slice(1)
            } "${value}" is already registered.`
          );
        } else {
          toast.error("Duplicate value detected. Please use unique data.");
        }
      } else {
        toast.error(rawMessage || "Failed to update member");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderProfileTab = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-3 sm:p-6">
        <form onSubmit={handleSubmit(handleSave)} className="space-y-3 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-3 sm:mb-6">
            <h3 className="text-base sm:text-xl font-semibold text-gray-800">Personal Information</h3>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-2 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Edit Profile
              </button>
            ) : null}
      </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 sm:gap-x-6 gap-y-3 sm:gap-y-4">
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                id="name"
                {...register("name")}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                {...register("email")}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-xs sm:text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="text"
                id="phoneNumber"
                {...register("phoneNumber")}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="slot" className="block text-xs sm:text-sm font-medium text-gray-700">Slot</label>
              <input
                type="text"
                id="slot"
                {...register("slot")}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 text-xs sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-4 sm:mt-8">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Membership Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-6 gap-y-3 sm:gap-y-4 p-2 sm:p-4 bg-gray-50 rounded-lg">
              <div>
                <label htmlFor="membershipStartDate" className="block text-xs sm:text-sm font-medium text-gray-500">Start Date</label>
                <input
                  type="text"
                  id="membershipStartDate"
                  value={member?.membershipStartDate ? new Date(member.membershipStartDate).toLocaleDateString() : ''}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 text-xs sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="membershipEndDate" className="block text-xs sm:text-sm font-medium text-gray-500">End Date</label>
                <input
                  type="text"
                  id="membershipEndDate"
                  value={member?.membershipEndDate ? new Date(member.membershipEndDate).toLocaleDateString() : ''}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 text-xs sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="fees" className="block text-xs sm:text-sm font-medium text-gray-500">Fees</label>
                <input
                  type="text"
                  id="fees"
                  value={member?.fees || ''}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 text-xs sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="feeStatus" className="block text-xs sm:text-sm font-medium text-gray-500">Fee Status</label>
                <div className="mt-1 flex items-center">
                  <span className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs sm:text-sm ${
                    member?.feeStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {member?.feeStatus?.toUpperCase() || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-6">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="flex items-center justify-center">
                  <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Cancel
                </span>
              </button>
          <button
                type="submit"
                className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="flex items-center justify-center">
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Save Changes
                </span>
          </button>
            </div>
          )}
        </form>
        </div>

      <div className="p-3 sm:p-6 bg-gray-50 border-t border-gray-100">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Profile Photo</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-6">
          <div className="relative h-20 w-20 sm:h-32 sm:w-32 rounded-full overflow-hidden border-4 border-white shadow-md group">
            {photoPreview ? (
              <img
                src={photoPreview}
                  alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-200">
                <UserCircleIcon className="h-12 w-12 sm:h-24 sm:w-24 text-gray-400" />
              </div>
            )}
            
            {/* Edit button overlay */}
            <label 
              htmlFor="profile-photo-input" 
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-200 cursor-pointer"
            >
              <div className="bg-white rounded-full p-1.5 sm:p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <PencilIcon className="h-3 w-3 sm:h-5 sm:w-5 text-gray-700" />
              </div>
            </label>
            
            {/* Hidden file input */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
              id="profile-photo-input"
                  />
              </div>
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm font-medium text-gray-900">Upload a new photo</p>
            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">
              JPG, PNG or GIF. Max size of 2MB.
            </p>
                        <label
              htmlFor="profile-photo-input-button"
              className="mt-2 sm:mt-4 inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                        >
              Change Photo
                        </label>
                        <input
              id="profile-photo-input-button"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handlePhotoChange}
            />
          </div>
        </div>
      </div>
                      </div>
                    );

  const renderAttendanceTab = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Attendance Check-In</h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
            <MemberAttendance memberId={id || ''} />
          </div>
        </div>
              </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Recent Activity</h3>
                    <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-900 transition-colors"
                    >
              View Full History 
              <ChevronRightIcon className="ml-1 h-5 w-5" />
                    </button>
          </div>
          
          {recentAttendance.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {recentAttendance.map((attendance, index) => (
                <div key={index} className="py-3 sm:py-4 flex items-center">
                  <div className="bg-indigo-100 rounded-full p-2 mr-3 sm:mr-4">
                    <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                      {new Date(attendance.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {new Date(attendance.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {attendance.exitTime ? ` - ${new Date(attendance.exitTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}` : ' - Current Session'}
                    </p>
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      attendance.exitTime ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {attendance.exitTime ? 'Completed' : 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <CalendarIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recent attendance</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">Start checking in to see your activity here.</p>
            </div>
          )}
        </div>
      </div>
      
      <AttendanceHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        memberId={id || ''}
      />
    </div>
  );

  const renderMembershipTab = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Current Membership</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-indigo-100 text-xs sm:text-sm">Status</p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-opacity-25 ${
                  member?.status === 'active' ? 'bg-green-100 text-green-100' : 'bg-red-100 text-red-100'
                }`}>
                  {member?.status?.toUpperCase() || 'INACTIVE'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-indigo-100 text-xs sm:text-sm">Plan Duration</p>
              <p className="text-white text-base sm:text-lg font-semibold">{member?.durationMonths || 0} Months</p>
            </div>
            <div>
              <p className="text-indigo-100 text-xs sm:text-sm">Fees</p>
              <p className="text-white text-base sm:text-lg font-semibold">₹{member?.fees || 0}</p>
            </div>
            <div>
              <p className="text-indigo-100 text-xs sm:text-sm">Payment Status</p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-opacity-25 ${
                  member?.feeStatus === 'paid' ? 'bg-green-100 text-green-100' : 'bg-red-100 text-red-100'
                }`}>
                  {member?.feeStatus?.toUpperCase() || 'UNPAID'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Membership Details</h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Start Date</dt>
              <dd className="mt-1 text-sm sm:text-base text-gray-900">
                {member?.membershipStartDate ? new Date(member.membershipStartDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : '-'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">End Date</dt>
              <dd className="mt-1 text-sm sm:text-base text-gray-900">
                {member?.membershipEndDate ? new Date(member.membershipEndDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : '-'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Assigned Trainer</dt>
              <dd className="mt-1 text-sm sm:text-base text-gray-900">{member?.trainerAssigned || 'None'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Slot</dt>
              <dd className="mt-1 text-sm sm:text-base text-gray-900">{member?.slot || '-'}</dd>
            </div>
          </dl>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Membership Timeline</h3>
          <div className="relative">
            <div className="absolute top-0 left-3 sm:left-4 h-full w-0.5 bg-gray-200"></div>
            <ul className="space-y-4 sm:space-y-6 relative">
              <li className="ml-5 sm:ml-6">
                <div className="absolute -left-3">
                  <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full ring-8 ring-white">
                    <CheckIcon className="w-3 h-3 text-green-600" />
                  </div>
                </div>
                <div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-medium text-gray-900">Membership Started</h4>
                    <time className="text-xs text-gray-500">
                      {member?.membershipStartDate ? new Date(member.membershipStartDate).toLocaleDateString() : ''}
                    </time>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {member?.durationMonths} Month Plan Activated
                  </p>
                </div>
              </li>
              
              {member?.feeStatus === 'paid' && (
                <li className="ml-5 sm:ml-6">
                  <div className="absolute -left-3">
                    <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full ring-8 ring-white">
                      <CreditCardIcon className="w-3 h-3 text-blue-600" />
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm sm:text-base font-medium text-gray-900">Payment Completed</h4>
                      <time className="text-xs text-gray-500">
                        {member?.membershipStartDate ? new Date(member.membershipStartDate).toLocaleDateString() : ''}
                      </time>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">
                      ₹{member?.fees} fee paid successfully
                    </p>
                  </div>
                </li>
              )}
              
              {member?.membershipEndDate && (
                <li className="ml-5 sm:ml-6">
                  <div className="absolute -left-3">
                    <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded-full ring-8 ring-white">
                      <CalendarIcon className="w-3 h-3 text-gray-600" />
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-medium text-gray-900">Membership Renewal</h4>
                      <time className="text-xs text-gray-500">
                        {new Date(member.membershipEndDate).toLocaleDateString()}
                      </time>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Membership expires on this date
                    </p>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderShopTab = () => (
    <div className="space-y-3 sm:space-y-6">
      {/* Hero Banner for Shop */}
      <div className="relative rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 to-purple-600/90 mix-blend-multiply"></div>
        <div className="relative bg-cover bg-center h-40 sm:h-64" style={{ backgroundImage: "url('/Activehub04.jpeg')" }}>
          <div className="px-3 sm:px-6 py-4 sm:py-10 h-full flex flex-col justify-between">
            <div>
              <h2 className="text-xl sm:text-3xl font-bold text-white">Welcome back, {member?.name || 'Member'}!</h2>
              <p className="mt-1 sm:mt-2 text-sm sm:text-xl text-indigo-100">Discover products tailored to your fitness journey</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-2">
              <Link
                to="/member-shop"
                className="inline-flex items-center px-2 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Browse All Products
                <ChevronRightIcon className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
              </Link>
              <Link
                to={`/member-shop?category=supplements`}
                className="inline-flex items-center px-2 sm:px-4 py-1.5 sm:py-2 border border-white/30 text-xs sm:text-sm font-medium rounded-md shadow-sm text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50"
              >
                My Favorites
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Member Stats and Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-indigo-50 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="flex-shrink-0 rounded-md bg-indigo-100 p-2 sm:p-3">
              <CreditCardIcon className="h-4 w-4 sm:h-6 sm:w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-indigo-700">Membership Status</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 mt-0.5 sm:mt-1">
                {member?.status?.toUpperCase() || 'ACTIVE'}
              </p>
              <div className="mt-0.5 sm:mt-2">
                <span className="text-xs inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  {member?.status === 'active' ? '15%' : '10%'} Shop Discount
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-50 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="flex-shrink-0 rounded-md bg-amber-100 p-2 sm:p-3">
              <StarIcon className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-amber-700">Loyalty Points</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 mt-0.5 sm:mt-1">
                {member?.fees ? Math.floor(member.fees / 100) : 0} points
              </p>
              <div className="mt-0.5 sm:mt-2">
                <span className="text-xs inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Redeem for discounts
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-emerald-50 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="flex-shrink-0 rounded-md bg-emerald-100 p-2 sm:p-3">
              <CalendarIcon className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-emerald-700">Membership Duration</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 mt-0.5 sm:mt-1">
                {member?.durationMonths || 0} Months Plan
              </p>
              <div className="mt-0.5 sm:mt-2">
                <span className="text-xs inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {member?.membershipEndDate ? 
                    `Expires ${new Date(member.membershipEndDate).toLocaleDateString()}` : 
                    'Active Membership'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Personalized Recommendations */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 mb-3 sm:mb-6">
            <h3 className="text-base sm:text-xl font-semibold text-gray-800">Recommended For You</h3>
            <span className="text-xs sm:text-sm text-gray-500">Based on your {member?.status || 'active'} membership</span>
          </div>

          {shopLoading ? (
            <div className="py-6 sm:py-12 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-10 sm:w-10 border-t-2 border-indigo-500"></div>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="py-6 sm:py-12 text-center">
              <ShoppingBagIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products available</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">Check back soon for new products!</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {featuredProducts.slice(0, 3).map((product) => (
                  <div 
                    key={product._id} 
                    className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="aspect-w-4 aspect-h-3 bg-gray-200 group-hover:opacity-90 transition-opacity">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images.find(img => img.publicId === product.featuredImageId)?.url || product.images[0].url}
                          alt={product.name}
                          className="w-full h-36 sm:h-48 object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-36 sm:h-48 flex items-center justify-center">
                          <ShoppingBagIcon className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                        </div>
                      )}
                      {product.discountPrice && (
                        <div className="absolute top-0 left-0 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 m-1.5 sm:m-2 rounded">
                          SALE
              </div>
                      )}
                    </div>
                    <div className="p-2 sm:p-4">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                      <div className="mt-1 flex items-center">
                        <div className="flex flex-1">
                          {[0, 1, 2, 3, 4].map((rating) => (
                            <StarIcon
                              key={rating}
                              className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                product.rating > rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          ({product.reviews?.length || 0})
                        </span>
                      </div>
                      <div className="mt-1 sm:mt-2 flex justify-between items-center">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                          ₹{product.price}
                          {product.discountPrice && (
                            <span className="ml-1 text-xs text-gray-500 line-through">
                              ₹{product.discountPrice}
                            </span>
                          )}
                        </p>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                          {product.category}
                        </span>
                      </div>
                      <div className="mt-2 sm:mt-4">
                        <Link
                          to={`/member-shop/product/${product._id}`}
                          className="w-full inline-flex justify-center items-center px-2 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 sm:mt-8 text-center">
                <Link
                  to="/member-shop"
                  className="inline-flex items-center px-2 sm:px-4 py-1.5 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  View All Products
                  <ChevronRightIcon className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Featured Categories */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-3 sm:p-6">
          <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-6">Shop by Category</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {['Supplements', 'Equipment', 'Apparel', 'Accessories'].map((category) => (
              <Link
                key={category}
                to={`/member-shop?category=${category.toLowerCase()}`}
                className="group block"
              >
                <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden bg-gray-100 shadow-sm group-hover:opacity-75 transition-opacity">
                  <div className="p-2 sm:p-4 flex flex-col items-center justify-center h-full bg-gradient-to-br from-indigo-50 to-purple-50 group-hover:from-indigo-100 group-hover:to-purple-100 transition-colors">
                    <ShoppingBagIcon className="h-5 w-5 sm:h-8 sm:w-8 text-indigo-500 mb-1 sm:mb-3" />
                    <span className="text-xs sm:text-sm font-medium text-gray-900">{category}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* Special Offers */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-3 sm:p-6">
          <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-6">Special Offers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 sm:p-4 rounded-lg border border-indigo-100">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-indigo-100 rounded-full p-2 sm:p-3">
                    <FireIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                  </div>
                </div>
                <div className="ml-3 sm:ml-4">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900">{member?.status || 'Member'} Special</h4>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500">
                    Get 20% off for items in your wishlist this week
                  </p>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium text-indigo-600">
                    Use code: MEMBER{member?._id?.substring(0, 4) || '2023'}
                              </p>
                            </div>
                          </div>
            </div>
              
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 sm:p-4 rounded-lg border border-amber-100">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-amber-100 rounded-full p-2 sm:p-3">
                    <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                  </div>
                </div>
                <div className="ml-3 sm:ml-4">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900">Limited Time Offer</h4>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500">
                    Buy one get one free on selected supplements
                  </p>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium text-amber-600">
                    Expires in 5 days
                              </p>
                            </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrdersTab = () => {
    if (ordersLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
        </div>
      );
    }

    if (recentOrders.length === 0) {
      return (
        <div className="text-center py-10">
          <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No orders yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't placed any orders yet.
          </p>
          <div className="mt-6">
            <Link
              to="/member-shop"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Start Shopping
            </Link>
                            </div>
                          </div>
      );
    }

    return (
      <div className="space-y-6 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
          <Link 
            to="/member-orders"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            View All Orders
          </Link>
        </div>

        <div className="space-y-4">
          {recentOrders.map((order) => {
            // Calculate how many products to show and if we need "and X more"
            const productsToShow = order.products.slice(0, 2);
            const remainingCount = order.products.length - productsToShow.length;
            
            return (
              <div key={order._id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900">
                        Order #{order._id.substring(order._id.length - 8)}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'}`}
                      >
                        {order.status}
                      </span>
                      <span className="ml-4 text-base font-medium text-gray-900">
                        ₹{order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-3 sm:px-6">
                  <div className="flow-root">
                    <ul className="-my-5 divide-y divide-gray-200">
                      {productsToShow.map((product) => (
                        <li key={product.productId} className="py-2 flex">
                          <div className="flex-shrink-0 w-12 h-12 border border-gray-200 rounded-md overflow-hidden">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-center object-cover"
                            />
                          </div>
                          <div className="ml-3 flex-1 flex flex-col">
                            <div className="flex justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                              <p className="ml-2 text-sm text-gray-500">
                                x{product.quantity}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500">
                              ₹{product.price.toFixed(2)}
                            </p>
                          </div>
                    </li>
                      ))}
                </ul>
                    
                    {remainingCount > 0 && (
                      <p className="mt-2 text-sm text-gray-500 italic">
                        +{remainingCount} more item{remainingCount > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
              </div>

                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
                  <Link
                    to="/member-orders"
                    className="flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    View Order Details
                    <ChevronRightIcon className="ml-1 h-4 w-4" />
                  </Link>
              </div>
            </div>
            );
          })}
          </div>
      </div>
    );
  };

  const renderAnnouncementsTab = () => {
    if (!member) return <div className="py-6">Loading...</div>;

    // Use the gymId if available or fallback to member's _id which should be associated with a gym
    const gymIdentifier = (member as any).gymId || member._id;

    return (
      <div className="px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Gym Announcements
          </h2>
          <p className="text-gray-500 mt-1">
            Stay updated with the latest news and events at your gym
          </p>
        </div>
        
        <MemberAnnouncements gymId={gymIdentifier} />
      </div>
    );
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'profile':
        return renderProfileTab();
      case 'attendance':
        return renderAttendanceTab();
      case 'membership':
        return renderMembershipTab();
      case 'shop':
        return renderShopTab();
      case 'announcements':
        return renderAnnouncementsTab();
      case 'orders':
        return renderOrdersTab();
      default:
        return renderShopTab(); // Default to Shop tab
    }
  };

  if (loading && !member) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with added cart icon */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {member?.photo ? (
                  <img 
                    src={member.photo} 
                    alt={member.name || 'Profile'} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="h-full w-full text-gray-400" />
                )}
              </div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{member?.name || 'Member Profile'}</h1>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
              <MemberNavCart />
              <div className="sm:mt-0">
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-2 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-indigo-700 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Content */}
      <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-8">
        {/* Tab navigation - Make scrollable on mobile */}
        <div className="border-b border-gray-200 mb-3 sm:mb-6">
          <nav className="-mb-px flex overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setCurrentTab('shop')}
              className={`whitespace-nowrap py-2 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex-shrink-0 ${
                currentTab === 'shop'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ShoppingBagIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1" />
              <span>Shop</span>
            </button>
            <button
              onClick={() => setCurrentTab('orders')}
              className={`whitespace-nowrap py-2 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex-shrink-0 ${
                currentTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1" />
              <span>Orders</span>
            </button>
            <button
              onClick={() => setCurrentTab('attendance')}
              className={`whitespace-nowrap py-2 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex-shrink-0 ${
                currentTab === 'attendance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1" />
              <span>Attendance</span>
            </button>
            <button
              onClick={() => setCurrentTab('profile')}
              className={`whitespace-nowrap py-2 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex-shrink-0 ${
                currentTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => setCurrentTab('membership')}
              className={`whitespace-nowrap py-2 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex-shrink-0 ${
                currentTab === 'membership'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CreditCardIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1" />
              <span>Membership</span>
            </button>
            <button
              onClick={() => setCurrentTab('announcements')}
              className={`whitespace-nowrap py-2 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex-shrink-0 ${
                currentTab === 'announcements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <SpeakerWaveIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1" />
              <span>Announcements</span>
            </button>
          </nav>
        </div>

        {/* Tab content */}
        {renderTabContent()}
      </div>

      {/* Include cart drawer */}
      <Cart />
    </div>
  );
};

export default MemberProfile;
