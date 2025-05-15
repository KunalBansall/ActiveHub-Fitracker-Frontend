import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Member, Product, Attendance } from "../types";
import { useForm } from "react-hook-form";
import ReactDOM from 'react-dom';
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
  Cog6ToothIcon,
  HeartIcon,
  TrophyIcon,
  BookOpenIcon,
  PhoneIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  IdentificationIcon,
  CheckCircleIcon,
  GiftIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  ClipboardIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  ArrowsUpDownIcon,
  ShoppingCartIcon,
  MegaphoneIcon,
  UserIcon,
  TagIcon,
  BeakerIcon,
  AdjustmentsHorizontalIcon,
  SquaresPlusIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import AttendanceHistoryModal from "../components/AttendenceHistoryModal";
import { MemberAttendance } from "../components/MemberAttendence";
import MemberNavCart from "../components/MemberNavCart";
import Cart from "../components/Cart";
import MemberAnnouncements from "../components/MemberAnnouncements";
import SignOutConfirmation from '../components/SignOutConfirmation';

// Import the workout service and types
import { 
  getMemberWorkoutPlan, 
  getTodaysWorkout, 
  updateExerciseStatus, 
  addMemberNotes 
} from '../services/workoutService';
import { WorkoutPlan, DailyWorkout, Exercise } from '../types';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Tabs for the profile page - expanded navigation for a complete dashboard
const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
  { id: 'workout', name: 'Workouts', icon: FireIcon },
  { id: 'shop', name: 'Shop', icon: ShoppingBagIcon },
  { id: 'announcements', name: 'Announcements', icon: SpeakerWaveIcon },
  { id: 'attendance', name: 'Attendance', icon: CalendarDaysIcon },
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

const MemberProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>('dashboard'); // Set Dashboard as the default tab
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [shopLoading, setShopLoading] = useState<boolean>(false);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [completedWorkoutsCount, setCompletedWorkoutsCount] = useState<number>(0);
  const [attendancePercentage, setAttendancePercentage] = useState<number>(0);
  const [monthlyVisitCount, setMonthlyVisitCount] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  // Add a ref for the profile menu
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside the profile menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Don't close if clicking on menu items - they'll handle their own closing
      const target = event.target as HTMLElement;
      if (target.closest('[role="menuitem"]')) {
        return;
      }
      
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);

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
    // Fetch attendance data right after fetching member data
    if (member) {
      fetchRecentAttendance();
    }
  }, [member]);

  useEffect(() => {
    // Always fetch featured products on initial load since Shop is the default tab
    fetchFeaturedProducts();
    
    // Fetch data based on current tab
    if (currentTab === 'attendance') {
      fetchRecentAttendance();
    } else if (currentTab === 'orders') {
      fetchRecentOrders();
    } else if (currentTab === 'dashboard') {
      // Fetch workout plan and latest announcement for the dashboard
      fetchWorkoutPlan();
      fetchLatestAnnouncements();
    }
  }, [currentTab]);

  // Calculate attendance percentage, monthly visits, and fitness streaks when recentAttendance changes
  useEffect(() => {
    if (member && member.membershipStartDate) {
      // Calculate attendance percentage
      calculateAttendancePercentage();
      // Calculate monthly visit count
      calculateMonthlyVisits();
      // Calculate fitness streak
      calculateFitnessStreak();
    }
  }, [recentAttendance, member]);
  
  // Function to calculate attendance percentage
  const calculateAttendancePercentage = () => {
    if (!recentAttendance || recentAttendance.length === 0) return;
    
    // Get current month and year
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Calculate total business days in the current month (excluding only Sundays)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let businessDaysInMonth = 0;
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const day = date.getDay(); // 0 is Sunday
      
      // Count Monday through Saturday (1-6) as business days
      if (day !== 0) {
        businessDaysInMonth++;
      }
    }
    
    // Get today's date
    const currentDate = today.getDate();
    
    // Calculate business days so far this month
    let businessDaysSoFar = 0;
    for (let i = 1; i <= currentDate; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const day = date.getDay();
      
      // Count all days except Sunday
      if (day !== 0) {
        businessDaysSoFar++;
      }
    }
    
    // Filter attendance records for the current month
    const currentMonthAttendance = recentAttendance.filter(record => {
      const attendanceDate = new Date(record.entryTime);
      return (
        attendanceDate.getMonth() === currentMonth &&
        attendanceDate.getFullYear() === currentYear
      );
    });
    
    // Calculate attendance percentage for current month
    // Use days so far as the denominator to avoid unfairly penalizing for future days
    const percentage = Math.min(100, Math.round((currentMonthAttendance.length / businessDaysSoFar) * 100));
    
    setAttendancePercentage(percentage || 0);
  };
  
  // Function to calculate monthly visits
  const calculateMonthlyVisits = () => {
    if (!recentAttendance || recentAttendance.length === 0) return;
    
    // Get current month and year
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Filter attendance records for the current month
    const currentMonthAttendance = recentAttendance.filter(record => {
      const attendanceDate = new Date(record.entryTime);
      return (
        attendanceDate.getMonth() === currentMonth &&
        attendanceDate.getFullYear() === currentYear
      );
    });
    
    // Set the monthly visit count
    setMonthlyVisitCount(currentMonthAttendance.length);
  };
  
  // Function to calculate fitness streak (consecutive days)
  const calculateFitnessStreak = () => {
    if (!recentAttendance || recentAttendance.length === 0) return;
    
    // Sort attendance records by date (newest first)
    const sortedAttendance = [...recentAttendance].sort((a, b) => {
      return new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime();
    });
    
    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if there's an attendance record for today
    const todayAttendance = sortedAttendance.find(record => {
      const recordDate = new Date(record.entryTime);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
    
    // If no attendance today, start checking from yesterday
    let currentDate = new Date(today);
    if (!todayAttendance) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    let streak = todayAttendance ? 1 : 0;
    let checkDate = new Date(currentDate);
    
    // Check consecutive days backwards
    while (true) {
      // If we're checking before today, look for attendance on this date
      const dateAttendance = sortedAttendance.find(record => {
        const recordDate = new Date(record.entryTime);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === checkDate.getTime();
      });
      
      // If no attendance on this date, break the streak
      if (!dateAttendance) break;
      
      // Move to the previous day
      checkDate.setDate(checkDate.getDate() - 1);
      
      // If we found attendance for today, increment streak
      if (dateAttendance) streak++;
    }
    
    // Adjust streak if we didn't have attendance today
    if (!todayAttendance && streak > 0) streak--;
    
    setCurrentStreak(streak);
  };

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
    setIsSignOutModalOpen(false); // Make sure to close the modal
    setProfileMenuOpen(false); // Close profile dropdown
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

  // First, update the handleProfileMenuClick function to properly handle tab changes
  const handleProfileMenuClick = (tab: string) => {
    setCurrentTab(tab);
    setProfileMenuOpen(false);
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
    <div className="space-y-4 sm:space-y-6">
      
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
      
      {/* Spacing element to maintain layout */}
      
      
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
                          <ShoppingBagIcon className="h-8 w-8 sm:h-10 sm:w-10 " />
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
                          {product.discountPrice ? (
                            <>
                              ₹{product.discountPrice.toFixed(2)}
                            <span className="ml-1 text-xs text-gray-500 line-through">
                                ₹{product.price.toFixed(2)}
                            </span>
                  </>
                ) : (
                            <>₹{product.price.toFixed(2)}</>
                          )}
                        </p>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                          {product.category}
                        </span>
                      </div>
                      <div className="mt-2 sm:mt-4">
                  <button
                          onClick={() => {
                            // Navigate to product detail page using navigate
                            navigate(`/member-shop/product/${product._id}`);
                          }}
                          className="w-full inline-flex justify-center items-center px-2 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          View Details
                  </button>
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

  const renderDashboardTab = () => {
    // Get the latest announcement if available
    const latestAnnouncement = announcements && announcements.length > 0 
      ? announcements[0] 
      : null;
    
    // Get workout data for the Next Workout card
    const nextWorkout = workoutPlan?.dailyWorkouts?.find((workout: any) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      return workout.day === today;
    }) || null;

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg overflow-hidden shadow-lg">
          <div className="px-4 py-5 sm:p-6 text-white">
            <h2 className="text-xl font-bold">Welcome back, {member?.name?.split(' ')[0] || 'Member'}!</h2>
            <p className="mt-1 text-indigo-100">Track your fitness journey and manage your membership</p>
            
            <div className="mt-4 sm:mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => setCurrentTab('attendance')}
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50"
              >
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5" aria-hidden="true" />
                Check In
              </button>
              <button
                onClick={() => setCurrentTab('workout')}
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-white/30 rounded-md text-sm font-medium text-white hover:bg-white/20"
              >
                <FireIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5" aria-hidden="true" />
                Today's Workout
              </button>
            </div>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Next Workout Card */}
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FireIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Next Workout</h3>
                <div className="mt-1 text-sm text-gray-600">
                  <p className="font-medium">{nextWorkout ? nextWorkout.focus : "Upper Body Strength"}</p>
                  <p className="text-xs mt-1">Today • {member?.slot || '5:00 PM'}</p>
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => setCurrentTab('workout')}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                  >
                    View details
                    <ChevronRightIcon className="ml-1 h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Membership Status Card */}
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CreditCardIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Membership Status</h3>
                <div className="mt-1 text-sm text-gray-600">
                  <p className="font-medium">{member?.status === 'active' ? 'Active' : 'Inactive'}</p>
                  <p className="text-xs mt-1">
                    {member?.membershipEndDate ? 
                      `Valid until ${new Date(member.membershipEndDate).toLocaleDateString()}` : 
                      'No expiration date'}
                  </p>
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => setCurrentTab('membership')}
                    className="text-xs text-green-600 hover:text-green-800 font-medium flex items-center"
                  >
                    View details
                    <ChevronRightIcon className="ml-1 h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Latest Announcements Card */}
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-500">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <SpeakerWaveIcon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Latest Announcements</h3>
                <div className="mt-1 text-sm text-gray-600">
                  {latestAnnouncement ? (
                    <>
                      <p className="font-medium">{latestAnnouncement.title}</p>
                      <p className="text-xs mt-1">
                        Posted {new Date(latestAnnouncement.createdAt).toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">New classes added</p>
                      <p className="text-xs mt-1">Posted 2 days ago</p>
                    </>
                  )}
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => setCurrentTab('announcements')}
                    className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center"
                  >
                    View all announcements
                    <ChevronRightIcon className="ml-1 h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fitness Achievements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Visit Milestones */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-teal-200">
            <div className="bg-teal-50 px-4 py-3 border-b border-teal-100">
              <h2 className="font-bold text-gray-800 flex items-center">
                <CheckBadgeIcon className="h-5 w-5 mr-2 text-teal-600" />
                Visit Milestones
              </h2>
            </div>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-teal-100 rounded-full p-3 mr-4">
                  <CheckBadgeIcon className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {monthlyVisitCount > 0 ? (
                      <span>
                        You've completed {monthlyVisitCount} visit{monthlyVisitCount !== 1 ? 's' : ''} this month
                        {monthlyVisitCount >= 10 ? ' 🎉' : ''}
                      </span>
                    ) : (
                      <span>No visits recorded this month</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {monthlyVisitCount >= 20 ? 'Superstar Status!' : 
                     monthlyVisitCount >= 15 ? 'Elite Status!' : 
                     monthlyVisitCount >= 10 ? 'Gold Status!' : 
                     monthlyVisitCount >= 5 ? 'Silver Status!' : 'Keep going!'}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-teal-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (monthlyVisitCount / 20) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                  <span>15</span>
                  <span>20+</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Fitness Streaks */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-rose-200">
            <div className="bg-rose-50 px-4 py-3 border-b border-rose-100">
              <h2 className="font-bold text-gray-800 flex items-center">
                <FireIcon className="h-5 w-5 mr-2 text-rose-600" />
                Fitness Streak
              </h2>
            </div>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-rose-100 rounded-full p-3 mr-4">
                  <FireIcon className="h-6 w-6 text-rose-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {currentStreak > 0 ? (
                      <span>
                        {currentStreak} day{currentStreak !== 1 ? 's' : ''} in a row—keep it up!
                      </span>
                    ) : (
                      <span>Start your streak today!</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentStreak >= 7 ? 'On fire! 🔥' : 
                     currentStreak >= 5 ? 'Excellent streak!' : 
                     currentStreak >= 3 ? 'Great progress!' : 
                     currentStreak >= 1 ? 'Good start!' : 'Visit today!'}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-rose-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (currentStreak / 7) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>3</span>
                  <span>5</span>
                  <span>7+</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Products Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-100">
          <div className="bg-gradient-to-r from-indigo-700 to-purple-600 px-4 py-4 text-white">
            <h2 className="font-bold flex items-center">
              <ShoppingBagIcon className="h-5 w-5 mr-2" />
              Featured Products
            </h2>
            <p className="text-sm text-indigo-100 mt-1">Special items curated just for you</p>
          </div>
          
          <div className="p-4">
            {shopLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : featuredProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No featured products available right now.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {featuredProducts.slice(0, 4).map((product) => (
                  <div 
                    key={product._id} 
                    className="group relative bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-100 relative">
                      <img
                        src={product.images?.[0]?.url || "https://via.placeholder.com/150"}
                        alt={product.name}
                        className="h-full w-full object-cover object-center group-hover:opacity-90 transition-opacity duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Discount badge */}
                      {product.discountPrice && product.discountPrice < product.price && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full transform rotate-3 animate-pulse">
                          {Math.round((1 - product.discountPrice / product.price) * 100)}% OFF
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors duration-200">
                        {product.name}
                      </h3>
                      {product.discountPrice && product.discountPrice < product.price ? (
                        <div className="mt-1 flex flex-col">
                          <p className="text-sm font-bold text-red-600">
                            ₹{product.discountPrice.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 line-through">
                            ₹{product.price.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm font-bold text-gray-900">
                          ₹{product.price.toFixed(2)}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          // Navigate to product detail page using navigate
                          navigate(`/member-shop/product/${product._id}`);
                        }}
                        className="mt-2 w-full text-xs bg-indigo-500 text-white hover:bg-indigo-700 font-medium px-2 py-1.5 rounded-md transition-all duration-200 flex items-center justify-center"
                      >
                        <ShoppingCartIcon className="h-3.5 w-3.5 mr-1" />
                        View Product
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-3 text-center">
              <button
                 onClick={() => {
                  // Navigate to product detail page using navigate
                  navigate(`/member-shop`);
                }}
                className="inline-flex items-center px-4 py-2 bg-transparent hover:bg-indigo-50 border border-indigo-600 text-indigo-600 text-sm font-medium rounded-md transition-colors duration-200"
              >
                <ShoppingBagIcon className="h-4 w-4 mr-2" />
                Shop All Products
              </button>
            </div>
          </div>
        </div>

        {/* Shop by Category */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-100">
          <div className="px-4 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center">
              <TagIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Shop by Category
            </h2>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['Supplements', 'Apparel', 'Equipment', 'Accessories'].map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setCurrentTab('shop');
                    // Additional logic to filter by category if needed
                  }}
                  className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-all duration-200 group border border-gray-100 hover:border-indigo-200"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-2 group-hover:bg-indigo-200 transition-colors duration-200">
                    {category === 'Supplements' && <BeakerIcon className="h-6 w-6 text-indigo-600" />}
                    {category === 'Apparel' && <ShoppingBagIcon className="h-6 w-6 text-indigo-600" />}
                    {category === 'Equipment' && <AdjustmentsHorizontalIcon className="h-6 w-6 text-indigo-600" />}
                    {category === 'Accessories' && <SquaresPlusIcon className="h-6 w-6 text-indigo-600" />}
                  </div>
                  <span className="text-sm font-medium text-gray-800 group-hover:text-indigo-700 transition-colors duration-200">{category}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Special Member Benefits */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-100">
          <div className="bg-gradient-to-r from-purple-700 to-pink-600 px-4 py-4 text-white">
            <h2 className="font-bold flex items-center">
              <GiftIcon className="h-5 w-5 mr-2" />
              Member Benefits
            </h2>
            <p className="text-sm text-purple-100 mt-1">Special perks for our valued members</p>
          </div>
          
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex items-start p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200">
                <ShieldCheckIcon className="h-5 w-5 text-purple-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Member Discount</h3>
                  <p className="text-xs text-gray-600">Get 10% off on all products with your membership</p>
                </div>
              </div>
              
              <div className="flex items-start p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors duration-200">
                <SparklesIcon className="h-5 w-5 text-pink-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Exclusive Access</h3>
                  <p className="text-xs text-gray-600">Early access to new products and limited edition items</p>
                </div>
              </div>
              
              <div className="flex items-start p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200">
                <TrophyIcon className="h-5 w-5 text-indigo-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Points Program</h3>
                  <p className="text-xs text-gray-600">Earn points with every purchase to redeem for rewards</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  // Handle navigation to benefits page or show benefits modal
                }}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-md transition-all duration-200 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105"
              >
                <GiftIcon className="h-4 w-4 mr-2" />
                Explore Benefits
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [todaysWorkout, setTodaysWorkout] = useState<DailyWorkout | null>(null);
  const [motivationalQuote, setMotivationalQuote] = useState<string>('');
  const [activeDay, setActiveDay] = useState<string>('');
  const [loadingWorkout, setLoadingWorkout] = useState<boolean>(false);
  const [editingNotes, setEditingNotes] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Fetch the workout plan
  const fetchWorkoutPlan = async () => {
    setLoadingWorkout(true);
    try {
      const { workoutPlan, motivationalQuote } = await getMemberWorkoutPlan();
      setWorkoutPlan(workoutPlan);
      setMotivationalQuote(motivationalQuote);
      
      // Calculate completed workouts
      if (workoutPlan && workoutPlan.dailyWorkouts) {
        let completedCount = 0;
        
        // Count completed exercises
        workoutPlan.dailyWorkouts.forEach(workout => {
          workout.exercises.forEach(exercise => {
            if (exercise.completed === 'completed') {
              completedCount++;
            }
          });
        });
        
        setCompletedWorkoutsCount(completedCount);
      }
      
      // Set the active day to today or the first available day
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      
      const todaysWorkoutExists = workoutPlan.dailyWorkouts.some(workout => workout.day === today);
      setActiveDay(todaysWorkoutExists ? today : workoutPlan.dailyWorkouts[0]?.day || '');
    } catch (error: any) {
      console.error('Error fetching workout plan:', error);
      // Set workout plan to null if it's a 404 (No active workout plan found)
      if (error.response && error.response.status === 404) {
        setWorkoutPlan(null);
        // Don't show an error toast for "No active workout plan found"
      } else {
        // Show an error toast for other errors
        toast.error('Failed to load workout plan. Please try again later.');
      }
    } finally {
      setLoadingWorkout(false);
    }
  };

  // Fetch today's workout
  const fetchTodaysWorkout = async () => {
    try {
      const response = await getTodaysWorkout();
      
      // Update the states based on the response
      setTodaysWorkout(response.todaysWorkout);
      setMotivationalQuote(response.motivationalQuote);
      
      // Handle rest day case
      if (response.restDay && workoutPlan) {
        // If it's a rest day, we want to show this in the UI
        // Find today's day of the week
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        
        // Set the active day to today or the first day if there's no workout for today
        setActiveDay(today);
      }
      
      // Handle the case when there's no active workout plan
      if (response.noWorkoutPlan) {
        // We'll let the UI handle this case by showing the appropriate message
        // The workoutPlan being null will trigger the "No Active Workout Plan" view
        setWorkoutPlan(null);
      }
    } catch (error) {
      console.error('Error fetching today\'s workout:', error);
      // Don't show a toast since this might be normal (no workout scheduled)
    }
  };

  // Handle exercise status update
  const handleExerciseStatus = async (dayIndex: number, exerciseIndex: number, status: 'completed' | 'skipped' | 'rescheduled' | 'pending') => {
    if (!workoutPlan) return;
    
    try {
      const { workoutPlan: updatedPlan } = await updateExerciseStatus(
        workoutPlan._id,
        dayIndex,
        exerciseIndex,
        status
      );
      
      setWorkoutPlan(updatedPlan);
      
      if (status === 'completed') {
        toast.success('Exercise marked as completed!');
      } else if (status === 'skipped') {
        toast.success('Exercise marked as skipped.');
      } else if (status === 'rescheduled') {
        toast.success('Exercise rescheduled.');
      }
    } catch (error) {
      console.error('Error updating exercise status:', error);
      toast.error('Failed to update exercise status.');
    }
  };

  // Handle adding notes to a workout day
  const handleSaveNotes = async (dayIndex: number) => {
    if (!workoutPlan || !notes) return;
    
    try {
      const { workoutPlan: updatedPlan } = await addMemberNotes(
        workoutPlan._id,
        dayIndex,
        notes
      );
      
      setWorkoutPlan(updatedPlan);
      setEditingNotes(false);
      toast.success('Notes saved successfully!');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes.');
    }
  };

  // Use effect to fetch workout data when the tab changes
  useEffect(() => {
    if (currentTab === 'workout') {
      fetchWorkoutPlan();
      fetchTodaysWorkout();
    }
  }, [currentTab]);

  // Get the active day's workout
  const getActiveDayWorkout = () => {
    if (!workoutPlan) return null;
    return workoutPlan.dailyWorkouts.find(workout => workout.day === activeDay) || null;
  };

  // Get the index of the active day
  const getActiveDayIndex = () => {
    if (!workoutPlan) return -1;
    return workoutPlan.dailyWorkouts.findIndex(workout => workout.day === activeDay);
  };

  // Function to render exercise status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Skipped
          </span>
        );
      case 'rescheduled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Rescheduled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Pending
          </span>
        );
    }
  };

  const renderWorkoutTab = () => {
    const activeDayWorkout = getActiveDayWorkout();
    const activeDayIndex = getActiveDayIndex();
    
    // Show loading state if loading
    if (loadingWorkout) {
      return (
        <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      );
    }
    
    // Show message if no workout plan is found
    if (!workoutPlan) {
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-5 sm:px-6 sm:py-6 text-white">
              <h2 className="text-xl font-bold">No Active Workout Plan</h2>
              <p className="mt-1 text-indigo-100">You don't have an active workout plan yet.</p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <p className="text-gray-500 mb-4">Contact your trainer to create a personalized workout plan for you.</p>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setCurrentTab('membership')}
                >
                  <CalendarIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                  Go to Membership
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Workout Plan Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-5 sm:px-6 sm:py-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{workoutPlan.name}</h2>
                <p className="mt-1 text-indigo-100">
                  {workoutPlan.goal.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} • 
                  {workoutPlan.experienceLevel.charAt(0).toUpperCase() + workoutPlan.experienceLevel.slice(1)} Level
                </p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/20">
                  {new Date(workoutPlan.startDate).toLocaleDateString()} - {new Date(workoutPlan.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {/* Motivational Quote */}
            {motivationalQuote && (
              <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                <p className="text-sm italic text-white">"{motivationalQuote}"</p>
              </div>
            )}
          </div>
          
          {/* Weekly Progress */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-medium text-gray-700">Weekly Progress</h3>
              <span className="text-xs text-gray-500">{workoutPlan.completedWorkouts} of {workoutPlan.dailyWorkouts.length} workouts completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full" 
                style={{ width: `${workoutPlan.consistency}%` }}
              ></div>
            </div>
          </div>
          
          {/* Day Selector */}
          <div className="p-2 bg-white border-b border-gray-200 overflow-x-auto hide-scrollbar">
            <div className="flex space-x-2">
              {workoutPlan.dailyWorkouts.map((workout, index) => (
                <button
                  key={workout.day}
                  onClick={() => setActiveDay(workout.day)}
                  className={`flex flex-col items-center py-2 px-3 rounded-lg ${
                    activeDay === workout.day
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xs font-medium">{workout.day.substring(0, 3)}</span>
                  <span className={`mt-1 h-2 w-2 rounded-full ${
                    workout.completed 
                      ? 'bg-green-500' 
                      : 'bg-gray-300'
                  }`}></span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Active Day Workout */}
        {activeDayWorkout && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">{activeDayWorkout.day} - {activeDayWorkout.focus}</h3>
                {activeDayWorkout.completed ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {activeDayWorkout.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }) ? 'Today' : 'Upcoming'}
                  </span>
                )}
              </div>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-6">
                {/* Warm-up */}
                <div>
                  <h3 className="text-base font-medium text-gray-900">Warm-up (10 minutes)</h3>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600">
                    {activeDayWorkout.warmup.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>{item}</span>
                    </li>
                    ))}
                  </ul>
                </div>
                
                {/* Main Workout */}
                <div>
                  <h3 className="text-base font-medium text-gray-900">Main Workout</h3>
                  <ul className="mt-2 space-y-4 text-sm text-gray-600">
                    {activeDayWorkout.exercises.map((exercise, exerciseIndex) => (
                      <li key={exerciseIndex} className="border-l-4 border-indigo-200 pl-3 py-2 rounded-r-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{exercise.name}</p>
                            <p>{exercise.sets} sets of {exercise.reps} | Rest: {exercise.restTime} seconds</p>
                            
                            {/* Equipment */}
                            {exercise.equipmentRequired.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Equipment: {exercise.equipmentRequired.join(', ')}
                              </p>
                            )}
                            
                            {/* Alternative Exercise */}
                            {exercise.alternativeExercise && (
                              <p className="text-xs text-indigo-600 mt-1">
                                Alternative: {exercise.alternativeExercise}
                              </p>
                            )}
                          </div>
                          
                          {/* Status Badge */}
                          <div className="ml-2 flex-shrink-0">
                            {renderStatusBadge(exercise.completed)}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="mt-2 flex space-x-2">
                          <button
                            onClick={() => handleExerciseStatus(activeDayIndex, exerciseIndex, 'completed')}
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                              exercise.completed === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800'
                            }`}
                          >
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Complete
                          </button>
                          <button
                            onClick={() => handleExerciseStatus(activeDayIndex, exerciseIndex, 'skipped')}
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                              exercise.completed === 'skipped'
                                ? 'bg-gray-200 text-gray-800'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <XMarkIcon className="h-3 w-3 mr-1" />
                            Skip
                          </button>
                          <button
                            onClick={() => handleExerciseStatus(activeDayIndex, exerciseIndex, 'rescheduled')}
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                              exercise.completed === 'rescheduled'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-amber-800'
                            }`}
                          >
                            <ArrowPathIcon className="h-3 w-3 mr-1" />
                            Reschedule
                          </button>
                        </div>
                        
                        {/* Notes */}
                        {exercise.notes && (
                          <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            <p className="font-medium">Notes:</p>
                            <p>{exercise.notes}</p>
                          </div>
                        )}
                      </li>
                    ))}
                </ul>
              </div>

                {/* Cool Down */}
                <div>
                  <h3 className="text-base font-medium text-gray-900">Cool Down (10 minutes)</h3>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600">
                    {activeDayWorkout.cooldown.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Member Notes */}
                <div className="mt-8 border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-900">Your Notes</h3>
                <button
                      onClick={() => {
                        setEditingNotes(!editingNotes);
                        setNotes(activeDayWorkout.memberNotes || '');
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      {editingNotes ? 'Cancel' : activeDayWorkout.memberNotes ? 'Edit' : 'Add Notes'}
                </button>
              </div>
                  
                  {editingNotes ? (
                    <div>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        rows={3}
                        placeholder="Add your notes about this workout day..."
                      />
                      <button
                        onClick={() => handleSaveNotes(activeDayIndex)}
                        className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <ArrowPathIcon className="h-4 w-4 mr-1" />
                        Save Notes
                      </button>
            </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
                      {activeDayWorkout.memberNotes ? (
                        activeDayWorkout.memberNotes
                      ) : (
                        <span className="text-gray-400 italic">No notes yet. Click 'Add Notes' to add your thoughts about this workout.</span>
                      )}
          </div>
        )}
      </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Workout Statistics */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Your Progress</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-gray-500">Workouts Completed</p>
                <p className="mt-2 text-3xl font-bold text-indigo-600">{workoutPlan.completedWorkouts}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-gray-500">Consistency</p>
                <p className="mt-2 text-3xl font-bold text-green-600">{workoutPlan.consistency}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-gray-500">Days Remaining</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {Math.max(0, Math.ceil((new Date(workoutPlan.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
                </p>
              </div>
            </div>
          </div>
          </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return renderDashboardTab();
      case 'shop':
        return renderShopTab();
      case 'workout':
        return renderWorkoutTab();
      case 'announcements':
        return renderAnnouncementsTab();
      case 'attendance':
        return renderAttendanceTab();
      case 'membership':
        return renderMembershipTab();
      case 'profile':
        return renderProfileTab();
      case 'orders':
        return renderOrdersTab();
      default:
        return renderDashboardTab();
    }
  };

  // Fetch latest announcements for the dashboard
  const fetchLatestAnnouncements = async () => {
    try {
      // Get gym ID from the member object using type assertion
      const gymId = (member as any)?.gymId;
      if (!gymId) return;

      // Use the public endpoint that doesn't require authentication, same as MemberAnnouncements component
      const response = await axios.get(
        `${API_URL}/public/announcements?gymId=${gymId}`
      );
      
      // The response format is different, based on MemberAnnouncements
      setAnnouncements(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch latest announcements:", error);
      setAnnouncements([]);
    }
  };

  // Fetch data when member changes
  useEffect(() => {
    if (member && (member as any).gymId) {
      fetchLatestAnnouncements();
    }
  }, [member]);

  if (loading && !member) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 font-sans">
      {/* Top Navigation Bar with Branding and Account Actions - Now Sticky */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-indigo-700 to-purple-700 text-white">
        <div className="absolute inset-0 bg-pattern opacity-10" style={{ backgroundImage: "url('/pattern.svg')" }}></div>
        
        {/* Brand Navigation Bar */}
        <div className="relative z-10 border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 relative">
              {/* Brand Logo */}
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Link to={`/member/${localStorage.getItem("userId")}`} className="flex items-center">
                    <HeartIcon className="h-5 w-5 text-pink-400 mr-2" />
                    <span className="text-white text-lg font-bold tracking-tight">
                      ActiveHub<span className="text-pink-300 font-light">FitTracker</span>
                    </span>
                  </Link>
                </div>
              </div>
              
              {/* Account Actions */}
              <div className="flex items-center space-x-2 sm:space-x-4 relative" style={{ zIndex: 200 }}>
                <div className="hidden md:flex items-center space-x-1 text-white/80 text-sm">
                  <span className="bg-white/10 px-2 py-0.5 rounded text-xs">
                    {member?.status === 'active' ? 'Premium Member' : 'Basic Member'}
                  </span>
                </div>
                <MemberNavCart />
                <div className="relative" ref={profileMenuRef} style={{ zIndex: 999 }}>
                  <button 
                    className="flex items-center focus:outline-none" 
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    aria-expanded={profileMenuOpen}
                    aria-haspopup="true"
                    id="profile-menu-button"
                  >
                    <div className="h-7 w-7 rounded-full overflow-hidden border-2 border-white/30">
                {member?.photo ? (
                  <img 
                    src={member.photo} 
                          alt={member?.name || 'Profile'} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                        <UserCircleIcon className="h-full w-full text-white" />
                )}
              </div>
                  </button>
                  {/* Dropdown menu using React Portal */}
                  {profileMenuOpen && ReactDOM.createPortal(
                    <div 
                      className="fixed rounded-md shadow-lg overflow-hidden bg-white z-[9999] w-48"
                      style={{ 
                        top: profileMenuRef.current ? profileMenuRef.current.getBoundingClientRect().bottom + window.scrollY + 10 : 0,
                        right: window.innerWidth <= 640 ? '0.5rem' : '1rem',
                        filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))',
                        pointerEvents: 'auto'
                      }}
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="profile-menu-button"
                    >
                      <div className="px-4 py-2 text-sm text-gray-800 border-b border-gray-100">
                        <p className="font-semibold">{member?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{member?.email}</p>
            </div>
                <button
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentTab('profile');
                          setProfileMenuOpen(false);
                        }}
                        role="menuitem"
                >
                        Profile Settings
                </button>
                      <button 
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentTab('membership');
                          setProfileMenuOpen(false);
                        }}
                        role="menuitem"
                      >
                        Membership
                      </button>
                      <button 
                        className="w-full text-left block px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 cursor-pointer" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSignOutModalOpen(true);
                          setProfileMenuOpen(false);
                        }}
                        role="menuitem"
                      >
                        <div className="flex items-center">
                          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2 text-red-500" />
                          Sign Out
              </div>
                      </button>
                    </div>,
                    document.body
                  )}
            </div>
          </div>
        </div>
      </div>
        </div>
      </header>

      {/* Member Profile Banner - Shown on dashboard and attendance tabs */}
      {(currentTab === 'dashboard' || currentTab === 'attendance') && (
        <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-md relative overflow-hidden">
          {/* Add animated pattern background */}
          <div className="absolute inset-0 bg-pattern opacity-10" style={{ backgroundImage: "url('/pattern.svg')" }}></div>
          
          {/* Add subtle glow effect */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-pink-500 opacity-10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6">
              {/* Profile Picture with hover effect */}
              <div className="mx-auto sm:mx-0 group">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden bg-white/20 ring-4 ring-white/30 shadow-lg group-hover:ring-white/50 transition-all duration-300 transform group-hover:scale-105">
                  {member?.photo ? (
                    <img 
                      src={member.photo} 
                      alt={member?.name || 'Profile'} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="h-full w-full text-white/70" />
                  )}
                </div>
              </div>
              
              {/* Profile Info with improved typography */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2">
                  <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{member?.name || 'Member'}</h1>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    member?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {member?.status?.toUpperCase() || 'INACTIVE'}
                  </span>
                </div>
                
                <p className="text-white/80 mt-0.5 text-sm sm:text-base font-light">
                  Member since {member?.membershipStartDate ? new Date(member.membershipStartDate).toLocaleDateString() : '-'}
                </p>
                
                {/* Badges for tablet and larger screens */}
                <div className="mt-3 hidden sm:flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200">
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                    {member?.membershipEndDate ? 
                      `Expires: ${new Date(member.membershipEndDate).toLocaleDateString()}` : 
                      'No expiration date'}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200">
                    <TrophyIcon className="h-3.5 w-3.5 mr-1.5" />
                    {member?.durationMonths || 0} Month Plan
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200">
                    <ClockIcon className="h-3.5 w-3.5 mr-1.5" />
                    Slot: {member?.slot || 'Flexible'}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200">
                    <CheckBadgeIcon className="h-3.5 w-3.5 mr-1.5" />
                    {monthlyVisitCount} Visits {monthlyVisitCount >= 10 ? '🎉' : ''}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200">
                    <FireIcon className="h-3.5 w-3.5 mr-1.5" />
                    {currentStreak} Day Streak {currentStreak >= 7 ? '🔥' : ''}
                  </span>
                </div>
                
                {/* Mobile view stats */}
                <div className="mt-3 flex sm:hidden flex-wrap justify-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm">
                    <CheckBadgeIcon className="h-3.5 w-3.5 mr-1.5" />
                    {monthlyVisitCount} Visits {monthlyVisitCount >= 10 ? '🎉' : ''}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm">
                    <FireIcon className="h-3.5 w-3.5 mr-1.5" />
                    {currentStreak} Day Streak {currentStreak >= 7 ? '🔥' : ''}
                  </span>
                </div>
              </div>
              
              {/* Quick Stats with improved cards and hover effects */}
              <div className="hidden lg:flex gap-3 relative z-10">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center transform transition-all duration-300 hover:bg-white/20 hover:scale-105">
                  <p className="text-2xl font-bold">{completedWorkoutsCount}</p>
                  <p className="text-xs text-white/80">Workouts</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center transform transition-all duration-300 hover:bg-white/20 hover:scale-105">
                  <p className="text-2xl font-bold">{attendancePercentage}%</p>
                  <p className="text-xs text-white/80">Attendance</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center transform transition-all duration-300 hover:bg-white/20 hover:scale-105">
                  <p className="text-2xl font-bold">{monthlyVisitCount}</p>
                  <p className="text-xs text-white/80">Monthly Visits {monthlyVisitCount >= 10 ? '🎉' : ''}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center transform transition-all duration-300 hover:bg-white/20 hover:scale-105">
                  <p className="text-2xl font-bold">{currentStreak}</p>
                  <p className="text-xs text-white/80">Day Streak {currentStreak >= 7 ? '🔥' : ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation - Hide on mobile and show horizontal scroll */}
      <div className="sticky top-14 z-20 bg-white shadow-sm border-b border-gray-200 hidden sm:block">
        <div className="max-w-7xl mx-auto">
          <nav className="flex justify-between overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
            <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex flex-1 flex-col items-center py-3 px-1 sm:px-4 relative overflow-hidden transition-all duration-300 ${
                  currentTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-500 hover:text-indigo-500 border-b-2 border-transparent'
                }`}
              >
                {/* Hover animation effect - sliding background */}
                <div className={`absolute inset-0 bg-indigo-50 transform ${
                  currentTab === tab.id 
                    ? 'translate-y-0' 
                    : 'translate-y-full'
                } transition-transform duration-300 ease-in-out`}></div>
                
                {/* Icon with bounce effect on hover */}
                <tab.icon 
                  className={`h-5 w-5 relative z-10 transition-all duration-300 ease-in-out transform hover:scale-110 ${
                    currentTab === tab.id ? 'text-indigo-600' : 'text-gray-400'
                  }`} 
                />
                
                {/* Text with sliding underline effect */}
                <span className="mt-0.5 text-xs font-medium relative z-10 group">
                  {tab.name}
                  <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out ${
                    currentTab === tab.id ? 'scale-x-100' : ''
                  }`}></span>
                </span>
            </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="py-2 sm:py-3 relative pb-20 sm:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Content Area with Animation */}
          <div className="transition-all duration-300 ease-in-out relative z-10">
            {renderTabContent()}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="grid grid-cols-5 h-16">
          {tabs.slice(0, 5).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 transition-all duration-300 ${
                currentTab === tab.id ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-500'
              }`}
            >
              <div className="relative">
                <tab.icon className={`h-6 w-6 transition-all duration-300 transform ${
                  currentTab === tab.id 
                    ? 'text-indigo-600 scale-110' 
                    : 'text-gray-400 hover:scale-110'
                }`} />
                
                {/* Animated dot indicator */}
                {currentTab === tab.id && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-indigo-600 rounded-full animate-pulse"></span>
                )}
              </div>
              <span className="mt-1 text-[10px] font-medium relative">
                {tab.name}
                {/* Sliding underline */}
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 transform ${
                  currentTab === tab.id ? 'scale-x-100' : 'scale-x-0 hover:scale-x-100'
                } transition-transform duration-300 ease-in-out`}></span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Menu button for additional tabs on mobile */}
      <div className="sm:hidden fixed bottom-[72px] right-4 z-30">
            <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="bg-indigo-600 text-white p-3 rounded-full shadow-lg"
        >
          {showMobileMenu ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Cog6ToothIcon className="h-6 w-6" />
          )}
            </button>
        
        {/* Additional tabs menu */}
        {showMobileMenu && (
          <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl w-48 overflow-hidden">
            {tabs.slice(5).map((tab) => (
            <button
                key={tab.id}
                onClick={() => {
                  setCurrentTab(tab.id);
                  setShowMobileMenu(false);
                }}
                className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
              >
                <tab.icon className="h-5 w-5 mr-3 text-gray-400" />
                <span>{tab.name}</span>
            </button>
            ))}
          </div>
        )}
        </div>

      {/* Footer - Hide on mobile for space efficiency */}
      <footer className="bg-gray-800 text-white mt-12 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <HeartIcon className="h-5 w-5 text-pink-400 mr-2" />
                <span>ActiveHub<span className="text-pink-300 font-light">FitTracker</span></span>
              </h3>
              <p className="text-gray-400 text-sm">
                Your all-in-one fitness membership management platform. Track progress, 
                manage attendance, and access exclusive member benefits.
              </p>
      </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => setCurrentTab('dashboard')} className="hover:text-white transition-colors">Dashboard</button></li>
                <li><button onClick={() => setCurrentTab('workout')} className="hover:text-white transition-colors">Workouts</button></li>
                <li><button onClick={() => setCurrentTab('attendance')} className="hover:text-white transition-colors">Attendance</button></li>
                <li><button onClick={() => setCurrentTab('announcements')} className="hover:text-white transition-colors">Announcements</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center"><BellIcon className="h-4 w-4 mr-2" />activehubfitracker@gmail.com</li></ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} ActiveHub FlexTracker. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Include modals */}
        <AttendanceHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
        memberId={id || ''}
      />

      {/* Include cart drawer */}
      <Cart />

      {/* Sign Out Confirmation Modal */}
      <SignOutConfirmation
        open={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleSignOut}
      />
    </div>
  );
};

export default MemberProfile;
