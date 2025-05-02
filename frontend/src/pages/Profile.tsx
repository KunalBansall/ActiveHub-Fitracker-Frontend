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
} from "@heroicons/react/24/outline"
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

export default function ProfilePage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {}
  const [formData, setFormData] = useState<AdminProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
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
        // console.log('Profile loaded successfully:', data)
        // console.log('Photo data:', data.photos)
      },
      onError: (err) => {
        // console.error('Error loading profile:', err)
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
  

  // Add effect to verify photos persist after reload
  useEffect(() => {
    if (profile) {
      // console.log('Profile Photos after load:', profile.photos)
    }
  }, [profile])

  const mutation = useMutation(
    async (updatedProfile: Partial<AdminProfile>) => {
      const loadingToastId = toast.loading('Updating profile...')
      
      // console.log('Sending profile update with data:', updatedProfile)
      
      // Ensure photos array is included in the update
      if (!updatedProfile.photos && formData?.photos) {
        updatedProfile.photos = formData.photos
      }
      
      // Ensure all required fields are present for a successful update
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
      
      console.log('Sending complete profile update:', completeProfile)
      
      try {
        const response = await axios.put(`${API_URL}/admin/profile`, completeProfile, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.dismiss(loadingToastId)
        console.log('Profile update response:', response.data)
        return response.data
      } catch (error) {
        toast.dismiss(loadingToastId)
        console.error('Error updating profile:', error)  
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
      onError: (error) => {
        // console.error('Profile update error:', error)
        toast.error('Failed to update profile. Please try again.')
      },
    }
  )

  /**
   * Handles uploading one or more photos to Cloudinary.
   * On success, adds the photos to the form data and selects the first one as the profile photo if none is set.
   */
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const uploadedPhotos: GymPhoto[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', UPLOAD_PRESET)

        // Show a loading toast
        const loadingToastId = toast.loading(`Uploading photo ${i + 1} of ${files.length}...`)
        
        const response = await axios.post(CLOUDINARY_URL, formData)
        uploadedPhotos.push({
          publicId: response.data.public_id,
          url: response.data.secure_url,
        })
        
        // Dismiss loading toast
        toast.dismiss(loadingToastId)
      }

      if (formData) {
        const updatedPhotos = [...(formData.photos || []), ...uploadedPhotos]
        setFormData({
          ...formData,
          photos: updatedPhotos,
          // Set the first uploaded photo as the profile photo if none is set
          profilePhotoId: formData.profilePhotoId || uploadedPhotos[0]?.publicId,
        })
      }

      toast.success(`Successfully uploaded ${uploadedPhotos.length} photos`)
    } catch (error) {
      // console.error('Upload error:', error)
      toast.error('Failed to upload photos. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  /**
   * Sets the selected photo as the profile photo in formData.
   * The update will be applied when the form is submitted.
   */
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
      // Ensure we have the complete data with photos
      const completeData = {
        ...formData,
        // Make sure photos array is present
        photos: formData.photos || [],
        // Ensure profilePhotoId is set if photos exist and it's not already set
        profilePhotoId: formData.profilePhotoId || (formData.photos && formData.photos.length > 0 ? formData.photos[0].publicId : undefined)
      }
      
      // console.log('Submitting form with data:', completeData)
      mutation.mutate(completeData)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData(null)
  }

  // Add a function to manually save photos if needed
  const savePhotosDirectly = async () => {
    if (!profile || !token) return
    
    const loadingToastId = toast.loading('Saving photos...')
    try {
      // Create a complete payload that matches backend expectation
      const photoPayload = {
        username: profile.username,
        email: profile.email,
        gymName: profile.gymName,
        gymType: profile.gymType,
        gymAddress: profile.gymAddress,
        photos: formData?.photos || profile.photos || [],
        profilePhotoId: formData?.profilePhotoId || profile.profilePhotoId
      }
      
      // console.log('Saving photos directly with full profile data:', photoPayload)
      
      const response = await axios.put(`${API_URL}/admin/profile`, photoPayload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      toast.dismiss(loadingToastId)
      toast.success('Photos saved successfully')
      // console.log('Photo save response:', response.data)
      
      // Refresh the profile data
      queryClient.invalidateQueries("adminProfile")
    } catch (error) {
      toast.dismiss(loadingToastId)
      toast.error('Failed to save photos')
      // console.error('Photo save error:', error)
    }
  }

  const { ads, loading: adsLoading } = useAds();

  if (!token) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg bg-white shadow-md">
        <div className="p-6">
          <p className="text-red-500">Authentication required</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6">
        <div className="h-48 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="relative -bottom-24">
              <div className="h-32 w-32 animate-pulse rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
        <div className="mt-16 rounded-lg bg-white p-6 shadow-md">
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg bg-white shadow-md">
        <div className="p-6">
          <p className="text-red-500">
            {error instanceof Error ? error.message : "Failed to load profile"}
          </p>
        </div>
      </div>
    )
  }

  // Ensure photos array exists and is properly initialized
  const photos = (isEditing ? formData?.photos : profile?.photos) || []
  
  // Log current photo state for debugging
  //    console.log('Current photos state:', {
  //   isEditing,
  //   formDataPhotos: formData?.photos,
  //   profilePhotos: profile?.photos,
  //   displayedPhotos: photos
  // })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center space-y-4 sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
            {/* Profile Info */}
            <div className="flex flex-col items-center space-y-4 sm:flex-row sm:items-end sm:space-x-6 sm:space-y-0">
              {/* Profile Photo */}
              <div className="relative">
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-white/20 bg-white/10 p-1 shadow-xl backdrop-blur-sm">
                  {isEditing ? (
                    formData?.photos?.find(p => p.publicId === formData.profilePhotoId)?.url ? (
                      <img
                        src={formData.photos.find(p => p.publicId === formData.profilePhotoId)?.url}
                        alt="Profile"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-white/10">
                        <UserCircleIcon className="h-12 w-12 text-white/60" />
                      </div>
                    )
                  ) : (
                    profile?.photos?.find(p => p.publicId === profile.profilePhotoId)?.url ? (
                      <img
                        src={profile.photos.find(p => p.publicId === profile.profilePhotoId)?.url}
                        alt="Profile"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-white/10">
                        <UserCircleIcon className="h-12 w-12 text-white/60" />
                      </div>
                    )
                  )}
                </div>
                {isEditing && (
                  <button
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    className="absolute -bottom-2 -right-2 rounded-full bg-blue-500 p-2 text-white shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <CameraIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Gym Info */}
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">{profile.gymName}</h1>
                <p className="mt-1 text-base text-white/80">{profile.gymType} Gym</p>
              </div>
            </div>

            {/* Edit Button */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit Profile
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Photo Gallery Section */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <PhotoIcon className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">Gym Photos</h2>
              </div>
              {isEditing && (
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <input
                      type="file"
                      id="photo-upload"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="photo-upload"
                      className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {isUploading ? (
                        <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PhotoIcon className="mr-2 h-4 w-4" />
                      )}
                      Upload Photos
                    </label>
                  </div>
                  {photos.length > 0 && (
                    <button
                      onClick={savePhotosDirectly}
                      className="inline-flex items-center rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Save Photos
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Photo Carousel */}
            <div className="relative h-64 w-full overflow-hidden rounded-xl bg-gray-50">
              {photos.length > 0 ? (
                <>
                  {photos.map((photo, index) => (
                    <div
                      key={photo.publicId}
                      className={`absolute h-full w-full transition-all duration-500 ${
                        index === currentPhotoIndex
                          ? 'translate-x-0 opacity-100'
                          : index < currentPhotoIndex
                          ? '-translate-x-full opacity-0'
                          : 'translate-x-full opacity-0'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={`Gym photo ${index + 1}`}
                        className={`h-full w-full object-cover ${
                          isEditing && formData?.profilePhotoId === photo.publicId
                            ? 'ring-4 ring-blue-500'
                            : ''
                        }`}
                        onClick={() => isEditing && handlePhotoSelect(photo)}
                      />
                      {isEditing && (
                        <div className="absolute bottom-4 right-4 rounded-lg bg-black/70 px-4 py-2 text-sm text-white backdrop-blur-sm">
                          {formData?.profilePhotoId === photo.publicId
                            ? 'Current Profile Photo'
                            : 'Click to set as profile photo'}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Navigation Controls */}
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/70"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/70"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {/* Indicator Dots */}
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
                    {photos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`h-2 w-2 rounded-full transition-all ${
                          index === currentPhotoIndex
                            ? 'scale-125 bg-white'
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center">
                  <PhotoIcon className="h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No photos available</p>
                  {isEditing && (
                    <p className="mt-1 text-xs text-gray-400">
                      Upload photos to showcase your gym
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form Sections */}
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center space-x-3">
                <UserCircleIcon className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={isEditing ? formData?.username : profile.username}
                      onChange={(e) => handleChange(e.target.name, e.target.value)}
                      disabled={!isEditing}
                      className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={isEditing ? formData?.email : profile.email}
                      onChange={(e) => handleChange(e.target.name, e.target.value)}
                      disabled={!isEditing}
                      className="block w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="gymName" className="block text-sm font-medium text-gray-700">
                    Gym Name
                  </label>
                  <div className="relative">
                    <BuildingOfficeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="gymName"
                      name="gymName"
                      type="text"
                      value={isEditing ? formData?.gymName : profile.gymName}
                      onChange={(e) => handleChange(e.target.name, e.target.value)}
                      disabled={!isEditing}
                      className="block w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="gymType" className="block text-sm font-medium text-gray-700">
                    Gym Type
                  </label>
                  <select
                    id="gymType"
                    name="gymType"
                    value={isEditing ? formData?.gymType : profile.gymType}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                    disabled={!isEditing}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
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

            {/* Address Section */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center space-x-3">
                <MapPinIcon className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">Gym Address</h2>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                    Street
                  </label>
                  <input
                    id="street"
                    name="gymAddress.street"
                    type="text"
                    value={isEditing ? formData?.gymAddress?.street : profile.gymAddress.street}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                    disabled={!isEditing}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    id="city"
                    name="gymAddress.city"
                    type="text"
                    value={isEditing ? formData?.gymAddress?.city : profile.gymAddress.city}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                    disabled={!isEditing}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    id="state"
                    name="gymAddress.state"
                    type="text"
                    value={isEditing ? formData?.gymAddress?.state : profile.gymAddress.state}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                    disabled={!isEditing}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                    Zip Code
                  </label>
                  <input
                    id="zipCode"
                    name="gymAddress.zipCode"
                    type="text"
                    value={isEditing ? formData?.gymAddress?.zipCode : profile.gymAddress.zipCode}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                    disabled={!isEditing}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <input
                    id="country"
                    name="gymAddress.country"
                    type="text"
                    value={isEditing ? formData?.gymAddress?.country : profile.gymAddress.country}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                    disabled={!isEditing}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex flex-col space-y-3 sm:flex-row sm:justify-end sm:space-x-4 sm:space-y-0">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <XMarkIcon className="mr-2 h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isLoading}
                className="inline-flex items-center justify-center rounded-full border border-transparent bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {mutation.isLoading ? (
                  <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckIcon className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Add the ProfileFooterAd component at the bottom */}
      {!adsLoading && ads.length > 0 && (
        <ProfileFooterAd ad={ads[1]} />
      )}
    </div>
  )
}

