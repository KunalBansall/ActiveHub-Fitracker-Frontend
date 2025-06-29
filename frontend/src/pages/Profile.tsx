'use client'

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "react-query"
import axios from "axios"
import {
  MapPinIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  UserCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  PhotoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CameraIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  CloudArrowUpIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline"
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid"
import toast from "react-hot-toast"
import ProfileFooterAd from "../components/ads/ProfileFooterAd"
import { useAds } from "../context/AdContext"

interface GymAddress {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface GymPhoto {
  publicId: string
  url: string
}

interface AdminProfile {
  username: string
  email: string
  gymName: string
  gymType: string
  gymAddress: GymAddress
  photos: GymPhoto[]
  profilePhotoId?: string
  profilePhotoUrl?: string
}

const API_URL = import.meta.env.VITE_API_URL
const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export default function ModernProfilePage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {}

  const [formData, setFormData] = useState<AdminProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')
  const queryClient = useQueryClient()

  const { data: profile, isLoading, isError, error } = useQuery<AdminProfile>(
    "adminProfile",
    async () => {
      const response = await axios.get(`${API_URL}/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log('API Profile Response:', response.data)
      return response.data
    },
    {
      enabled: !!token,
      onSuccess: (data) => {
        console.log('Profile loaded successfully:', data)
      },
      onError: (err) => {
        console.error('Error loading profile:', err)
      }
    }
  )

  useEffect(() => {
    if (isEditing && profile && !formData) {
      setFormData({
        username: profile.username || "",
        email: profile.email || "",
        gymName: profile.gymName || "",
        gymType: profile.gymType || "",
        gymAddress: profile.gymAddress || { street: "", city: "", state: "", zipCode: "", country: "" },
        photos: profile.photos || [],
        profilePhotoId: profile.profilePhotoId || undefined,
        profilePhotoUrl: profile.profilePhotoUrl || undefined,
      })
    }
  }, [isEditing, profile, formData])

  const mutation = useMutation(
    async (updatedProfile: Partial<AdminProfile>) => {
      const loadingToastId = toast.loading('Updating profile...')
      
      if (!updatedProfile.photos && formData?.photos) {
        updatedProfile.photos = formData.photos
      }
      
      const completeProfile = {
        username: updatedProfile.username || profile?.username || '',
        email: updatedProfile.email || profile?.email || '',
        gymName: updatedProfile.gymName || profile?.gymName || '',
        gymType: updatedProfile.gymType || profile?.gymType || '',
        gymAddress: updatedProfile.gymAddress || profile?.gymAddress || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        photos: updatedProfile.photos || profile?.photos || [],
        profilePhotoId: updatedProfile.profilePhotoId || profile?.profilePhotoId
      }
      
      try {
        const response = await axios.put(`${API_URL}/admin/profile`, completeProfile, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.dismiss(loadingToastId)
        return response.data
      } catch (error) {
        toast.dismiss(loadingToastId)
        throw error
      }
    },
    {
      onSuccess: (updatedProfile) => {
        const updatedUser = { 
          ...user, 
          gymName: updatedProfile.gymName,
          profilePhotoUrl: updatedProfile.photos?.find((p: GymPhoto) => p.publicId === updatedProfile.profilePhotoId)?.url
        }
        localStorage.setItem("user", JSON.stringify(updatedUser))
        
        queryClient.invalidateQueries("adminProfile")
        setIsEditing(false)
        setFormData(null)
        toast.success('Profile updated successfully')
      },
      onError: (error: any) => {
        if (error.response?.data?.error?.includes('E11000 duplicate key error') && error.response?.data?.error?.includes('email')) {
          toast.error('This email is already in use. Please use a different email address.')
        } else {
          toast.error(error.response?.data?.message || 'Failed to update profile. Please try again.')
        }
      },
    }
  )

  const handleRemovePhoto = (photoId: string) => {
    if (!formData) return
    
    if (formData.photos.length <= 1) {
      toast.error('You must have at least one photo')
      return
    }

    const updatedPhotos = formData.photos.filter(photo => photo.publicId !== photoId)
    
    let newProfilePhotoId = formData.profilePhotoId
    if (photoId === formData.profilePhotoId) {
      newProfilePhotoId = updatedPhotos[0]?.publicId
      if (newProfilePhotoId) {
        toast.success('Profile photo updated to the next available photo')
      }
    }

    setFormData({
      ...formData,
      photos: updatedPhotos,
      profilePhotoId: newProfilePhotoId
    })
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)
    const uploadedPhotos: GymPhoto[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)
        formDataUpload.append('upload_preset', UPLOAD_PRESET)

        setUploadProgress((i / files.length) * 100)

        const response = await axios.post(CLOUDINARY_URL, formDataUpload)
        uploadedPhotos.push({
          publicId: response.data.public_id,
          url: response.data.secure_url,
        })
      }

      if (formData) {
        const updatedPhotos = [...(formData.photos || []), ...uploadedPhotos]
        setFormData({
          ...formData,
          photos: updatedPhotos,
          profilePhotoId: formData.profilePhotoId || uploadedPhotos[0]?.publicId,
        })
      }

      setUploadProgress(100)
      toast.success(`Successfully uploaded ${uploadedPhotos.length} photos`)
    } catch (error) {
      toast.error('Failed to upload photos. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handlePhotoSelect = (photo: GymPhoto) => {
    if (formData) {
      setFormData({
        ...formData,
        profilePhotoId: photo.publicId,
      })
      toast.success('Profile photo updated! Save changes to apply.')
    }
  }

  const nextSlide = () => {
    const photos = (isEditing ? formData?.photos : profile?.photos) || []
    setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % photos.length)
  }

  const prevSlide = () => {
    const photos = (isEditing ? formData?.photos : profile?.photos) || []
    setCurrentPhotoIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length)
  }

  const getCurrentPhotos = () => {
    return (isEditing ? formData?.photos : profile?.photos) || []
  }

  const handleChange = (name: string, value: string) => {
    if (!formData || !profile) return

    if (name.startsWith("gymAddress.")) {
      const field = name.split(".")[1] as keyof GymAddress
      setFormData({
        ...formData,
        gymAddress: {
          ...formData.gymAddress,
          [field]: value
        }
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData) {
      const completeData = {
        ...formData,
        photos: formData.photos || [],
        profilePhotoId: formData.profilePhotoId || (formData.photos && formData.photos.length > 0 ? formData.photos[0].publicId : undefined)
      }
      
      mutation.mutate(completeData)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData(null)
  }

  const { ads, loading: adsLoading } = useAds();

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center space-x-3 text-red-600">
            <ExclamationCircleIcon className="h-6 w-6" />
            <p className="font-semibold text-lg">Authentication Required</p>
          </div>
          <p className="text-gray-600 mt-2">Please log in to access your profile.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Loading Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 h-72">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
            <div className="flex items-end space-x-6">
              <div className="h-32 w-32 rounded-3xl bg-white/20 animate-pulse" />
              <div className="space-y-4 pb-6">
                <div className="h-8 w-48 bg-white/20 rounded-lg animate-pulse" />
                <div className="h-5 w-32 bg-white/20 rounded-lg animate-pulse" />
                <div className="h-4 w-40 bg-white/20 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="space-y-4">
                <div className="h-6 w-32 bg-gray-200 rounded-lg animate-pulse" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center space-x-3 text-red-600">
            <ExclamationCircleIcon className="h-6 w-6" />
            <p className="font-semibold text-lg">Error Loading Profile</p>
          </div>
          <p className="text-gray-600 mt-2">
            {error instanceof Error ? error.message : "Failed to load profile data"}
          </p>
        </div>
      </div>
    )
  }

  const photos = getCurrentPhotos()
  const currentProfilePhoto = photos.find(
    (p) => p.publicId === (isEditing ? formData?.profilePhotoId : profile?.profilePhotoId)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Modern Header Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=1920')] bg-cover bg-center opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between space-y-8 lg:space-y-0">
            {/* Profile Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-6 sm:space-y-0 sm:space-x-8">
              {/* Enhanced Profile Photo */}
              <div className="relative group">
                <div className="h-36 w-36 lg:h-44 lg:w-44 rounded-3xl border-4 border-white/30 bg-white/10 p-1.5 shadow-2xl backdrop-blur-sm transition-all duration-300 group-hover:scale-105">
                  {currentProfilePhoto?.url ? (
                    <img
                      src={currentProfilePhoto.url || "/placeholder.svg"}
                      alt="Profile"
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white/10">
                      <UserCircleIcon className="h-20 w-20 text-white/60" />
                    </div>
                  )}

                  {/* Status Indicator */}
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-green-500 border-4 border-white shadow-lg">
                    <div className="h-full w-full rounded-full bg-green-500 animate-pulse" />
                  </div>
                </div>

                {isEditing && (
                  <button
                    type="button"
                    className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                  >
                    <CameraIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Gym Info */}
              <div className="text-center sm:text-left space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <h1 className="text-4xl lg:text-5xl font-bold text-white">{profile.gymName}</h1>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Verified
                  </span>
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-2 text-white/90">
                  <BuildingOfficeIcon className="h-5 w-5" />
                  <span className="text-xl font-medium">{profile.gymType} Gym</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-2 text-white/80">
                  <MapPinIcon className="h-5 w-5" />
                  <span className="text-lg">
                    {profile.gymAddress.city}, {profile.gymAddress.state}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-full font-medium backdrop-blur-sm transition-all duration-300 hover:scale-105"
              >
                <PencilIcon className="mr-2 h-5 w-5" />
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-4">
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-full font-medium backdrop-blur-sm transition-all duration-300"
                >
                  <XMarkIcon className="mr-2 h-5 w-5" />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={mutation.isLoading}
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-600 hover:bg-white/90 rounded-full font-medium shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
                >
                  {mutation.isLoading ? (
                    <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <CheckIcon className="mr-2 h-5 w-5" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          {/* Custom Tabs */}
          <div className="space-y-8">
            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center lg:justify-start space-x-1 bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
              {[
                { id: 'overview', label: 'Overview', icon: UserCircleIcon },
                { id: 'photos', label: 'Photos', icon: PhotoIcon },
                { id: 'details', label: 'Details', icon: BuildingOfficeIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Basic Information Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <UserCircleIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                        Username
                      </label>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        value={isEditing ? formData?.username : profile.username}
                        onChange={(e) => handleChange(e.target.name, e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-3 h-6 w-6 text-gray-400" />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={isEditing ? formData?.email : profile.email}
                          onChange={(e) => handleChange(e.target.name, e.target.value)}
                          disabled={!isEditing}
                          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gym Information Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Gym Information</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="gymName" className="block text-sm font-semibold text-gray-700 mb-2">
                        Gym Name
                      </label>
                      <input
                        id="gymName"
                        name="gymName"
                        type="text"
                        value={isEditing ? formData?.gymName : profile.gymName}
                        onChange={(e) => handleChange(e.target.name, e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                      />
                    </div>

                    <div>
                      <label htmlFor="gymType" className="block text-sm font-semibold text-gray-700 mb-2">
                        Gym Type
                      </label>
                      <select
                        id="gymType"
                        name="gymType"
                        value={isEditing ? formData?.gymType : profile.gymType}
                        onChange={(e) => handleChange(e.target.name, e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                      >
                        <option value="CrossFit">CrossFit</option>
                        <option value="Yoga">Yoga</option>
                        <option value="Weightlifting">Weightlifting</option>
                        <option value="Cardio">Cardio</option>
                        <option value="Mixed">Mixed</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <PhotoIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Gym Photos</h2>
                      <p className="text-gray-600">
                        {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
                      </p>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex items-center space-x-4">
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={isUploading}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        disabled={isUploading}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
                      >
                        {isUploading ? (
                          <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <CloudArrowUpIcon className="mr-2 h-5 w-5" />
                        )}
                        Upload Photos
                      </button>
                    </div>
                  )}
                </div>

                {isUploading && (
                  <div className="mb-8 p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center justify-between text-sm text-blue-800 mb-2">
                      <span className="font-medium">Uploading photos...</span>
                      <span className="font-bold">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {photos.length > 0 ? (
                  <div className="space-y-8">
                    {/* Main Photo Display */}
                    <div className="relative h-96 w-full overflow-hidden rounded-2xl bg-gray-100 shadow-inner">
                      {photos.map((photo, index) => (
                        <div
                          key={photo.publicId}
                          className={`absolute h-full w-full transition-all duration-500 ease-in-out ${
                            index === currentPhotoIndex
                              ? 'translate-x-0 opacity-100'
                              : index < currentPhotoIndex
                                ? '-translate-x-full opacity-0'
                                : 'translate-x-full opacity-0'
                          }`}
                        >
                          <div className="relative group h-full">
                            <img
                              src={photo.url || "/placeholder.svg"}
                              alt={`Gym photo ${index + 1}`}
                              className={`h-full w-full object-cover transition-all duration-300 ${
                                (isEditing ? formData?.profilePhotoId : profile?.profilePhotoId) === photo.publicId
                                  ? 'ring-4 ring-blue-500 ring-offset-4'
                                  : ''
                              }`}
                              onClick={() => isEditing && handlePhotoSelect(photo)}
                            />

                            {/* Photo Actions Overlay */}
                            {isEditing && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePhotoSelect(photo)
                                  }}
                                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg transition-all duration-300"
                                >
                                  <StarIcon className="mr-2 h-4 w-4" />
                                  Set as Profile
                                </button>

                                {photos.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemovePhoto(photo.publicId)
                                    }}
                                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-lg transition-all duration-300"
                                  >
                                    <TrashIcon className="mr-2 h-4 w-4" />
                                    Remove
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Profile Photo Badge */}
                            {(isEditing ? formData?.profilePhotoId : profile?.profilePhotoId) === photo.publicId && (
                              <div className="absolute top-4 left-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white shadow-lg">
                                  <StarSolidIcon className="mr-1 h-4 w-4" />
                                  Profile Photo
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Navigation Controls */}
                      {photos.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg transition-all duration-300"
                            onClick={prevSlide}
                          >
                            <ChevronLeftIcon className="h-6 w-6" />
                          </button>
                          <button
                            type="button"
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg transition-all duration-300"
                            onClick={nextSlide}
                          >
                            <ChevronRightIcon className="h-6 w-6" />
                          </button>
                        </>
                      )}

                      {/* Photo Indicators */}
                      {photos.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                          {photos.map((_, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setCurrentPhotoIndex(index)}
                              className={`h-3 w-3 rounded-full transition-all duration-300 ${
                                index === currentPhotoIndex 
                                  ? 'bg-white scale-125' 
                                  : 'bg-white/50 hover:bg-white/75'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Photo Grid Thumbnails */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
                      {photos.map((photo, index) => (
                        <button
                          key={photo.publicId}
                          type="button"
                          onClick={() => setCurrentPhotoIndex(index)}
                          className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-300 ${
                            index === currentPhotoIndex
                              ? 'ring-2 ring-blue-500 scale-105'
                              : 'hover:scale-105 hover:shadow-lg'
                          }`}
                        >
                          <img
                            src={photo.url || "/placeholder.svg"}
                            alt={`Thumbnail ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          {(isEditing ? formData?.profilePhotoId : profile?.profilePhotoId) === photo.publicId && (
                            <div className="absolute top-1 right-1">
                              <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <PhotoIcon className="h-20 w-20 mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
                    <p className="text-center mb-6 max-w-md">
                      Upload photos to showcase your gym and attract more members. High-quality images help build trust with potential clients.
                    </p>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg transition-all duration-300 hover:scale-105"
                      >
                        <CloudArrowUpIcon className="mr-2 h-5 w-5" />
                        Upload Your First Photo
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <MapPinIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Gym Address</h2>
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label htmlFor="street" className="block text-sm font-semibold text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      id="street"
                      name="gymAddress.street"
                      type="text"
                      value={isEditing ? formData?.gymAddress?.street : profile.gymAddress.street}
                      onChange={(e) => handleChange(e.target.name, e.target.value)}
                      disabled={!isEditing}
                      placeholder="123 Main Street"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      id="city"
                      name="gymAddress.city"
                      type="text"
                      value={isEditing ? formData?.gymAddress?.city : profile.gymAddress.city}
                      onChange={(e) => handleChange(e.target.name, e.target.value)}
                      disabled={!isEditing}
                      placeholder="New York"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      id="state"
                      name="gymAddress.state"
                      type="text"
                      value={isEditing ? formData?.gymAddress?.state : profile.gymAddress.state}
                      onChange={(e) => handleChange(e.target.name, e.target.value)}
                      disabled={!isEditing}
                      placeholder="NY"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-semibold text-gray-700 mb-2">
                      Zip Code
                    </label>
                    <input
                      id="zipCode"
                      name="gymAddress.zipCode"
                      type="text"
                      value={isEditing ? formData?.gymAddress?.zipCode : profile.gymAddress.zipCode}
                      onChange={(e) => handleChange(e.target.name, e.target.value)}
                      disabled={!isEditing}
                      placeholder="10001"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      id="country"
                      name="gymAddress.country"
                      type="text"
                      value={isEditing ? formData?.gymAddress?.country : profile.gymAddress.country}
                      onChange={(e) => handleChange(e.target.name, e.target.value)}
                      disabled={!isEditing}
                      placeholder="United States"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Footer Ad */}
      {!adsLoading && ads.length > 0 && (
        <ProfileFooterAd ad={ads[1]} />
      )}
    </div>
  )
}
