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
} from "@heroicons/react/24/outline"
import toast from "react-hot-toast"

interface GymAddress {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface GymPhoto {
  id: string
  url: string
  publicId: string
}

interface AdminProfile {
  username: string
  email: string
  gymName: string
  gymType: string
  gymAddress: GymAddress
  photos: GymPhoto[]
  profilePhotoId?: string
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
      return response.data
    },
    {
      enabled: !!token,
    }
  )

  useEffect(() => {
    if (isEditing && profile && !formData) {
      setFormData(JSON.parse(JSON.stringify(profile)))
    }
  }, [isEditing, profile, formData])

  const mutation = useMutation(
    async (updatedProfile: Partial<AdminProfile>) => {
      const response = await axios.put(`${API_URL}/admin/profile`, updatedProfile, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    },
    {
      onSuccess: (updatedProfile) => {
        const updatedUser = { ...user, gymName: updatedProfile.gymName }
        localStorage.setItem("user", JSON.stringify(updatedUser))
        queryClient.invalidateQueries("adminProfile")
        setIsEditing(false)
        setFormData(null)
        toast.success('Profile updated successfully')
      },
      onError: (error) => {
        toast.error('Failed to update profile. Please try again.')
      },
    }
  )

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

        const response = await axios.post(CLOUDINARY_URL, formData)
        uploadedPhotos.push({
          id: response.data.public_id,
          url: response.data.secure_url,
          publicId: response.data.public_id,
        })
      }

      if (formData) {
        const updatedPhotos = [...(formData.photos || []), ...uploadedPhotos]
        setFormData({
          ...formData,
          photos: updatedPhotos,
          profilePhotoId: formData.profilePhotoId || uploadedPhotos[0]?.id,
        })
      }

      toast.success('Photos uploaded successfully')
    } catch (error) {
      toast.error('Failed to upload photos')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handlePhotoSelect = (photo: GymPhoto) => {
    if (formData) {
      setFormData({
        ...formData,
        profilePhotoId: photo.id,
      })
    }
  }

  const nextSlide = () => {
    const photos = formData?.photos || profile?.photos || []
    setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % photos.length)
  }

  const prevSlide = () => {
    const photos = formData?.photos || profile?.photos || []
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
      mutation.mutate(formData)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData(null)
  }

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

  const photos = formData?.photos || profile?.photos || []

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6">
      <div className="h-auto sm:h-48 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <div className="relative sm:-bottom-24 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              <div className="rounded-full bg-white p-2">
                <div className="flex h-20 w-20 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-gray-100 overflow-hidden">
                  {formData?.photos?.find(p => p.id === formData.profilePhotoId)?.url ? (
                    <img
                      src={formData.photos.find(p => p.id === formData.profilePhotoId)?.url}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="text-center sm:text-left mb-4 space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{profile.gymName}</h1>
                <p className="text-blue-100">{profile.gymType} Gym</p>
              </div>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto mb-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit Profile
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mt-16 rounded-lg bg-white shadow-md">
        <div className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Photo Gallery Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PhotoIcon className="h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">Gym Photos</h2>
                </div>
                {isEditing && (
                  <div className="flex items-center gap-2">
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
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                    >
                      {isUploading ? (
                        <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PhotoIcon className="mr-2 h-4 w-4" />
                      )}
                      Upload Photos
                    </label>
                  </div>
                )}
              </div>

              {/* Carousel */}
              <div className="relative h-64 w-full">
                {photos.length > 0 ? (
                  <div className="relative h-full overflow-hidden rounded-lg">
                    {photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className={`absolute w-full h-full transition-all duration-300 ease-in-out transform ${
                          index === currentPhotoIndex ? 'translate-x-0' : index < currentPhotoIndex ? '-translate-x-full' : 'translate-x-full'
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt={`Gym photo ${index + 1}`}
                          className={`w-full h-full object-cover cursor-pointer ${
                            isEditing && formData?.profilePhotoId === photo.id ? 'ring-4 ring-blue-500' : ''
                          }`}
                          onClick={() => isEditing && handlePhotoSelect(photo)}
                        />
                      </div>
                    ))}

                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={prevSlide}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors"
                        >
                          <ChevronLeftIcon className="h-6 w-6" />
                        </button>
                        <button
                          onClick={nextSlide}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors"
                        >
                          <ChevronRightIcon className="h-6 w-6" />
                        </button>
                      </>
                    )}

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                      {photos.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                          onClick={() => setCurrentPhotoIndex(index)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full rounded-lg bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-500">No photos available</p>
                  </div>
                )}
              </div>

              {isEditing && (
                <p className="text-sm text-gray-500">
                  Click on a photo to set it as your profile picture
                </p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={isEditing ? formData?.username : profile.username}
                  onChange={(e) => handleChange(e.target.name, e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={isEditing ? formData?.email : profile.email}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="gymName" className="block text-sm font-medium text-gray-700">
                  Gym Name
                </label>
                <div className="relative">
                  <BuildingOfficeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    id="gymName"
                    name="gymName"
                    type="text"
                    value={isEditing ? formData?.gymName : profile.gymName}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
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
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                >
                  <option value="CrossFit">CrossFit</option>
                  <option value="Yoga">Yoga</option>
                  <option value="Weightlifting">Weightlifting</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Gym Address</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
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
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
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
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
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
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
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
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex flex-col sm:flex-row justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <XMarkIcon className="mr-2 h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutation.isLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
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
          </form>
        </div>
      </div>
    </div>
  )
}

