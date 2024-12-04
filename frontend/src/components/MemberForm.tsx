import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns"; // Importing date-fns for formatting
import { Member } from "../types"; // Assuming Member type is defined elsewhere

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/diy7wynvw/image/upload"; // Cloud Name: diy7wynvw
const UPLOAD_PRESET = "ActiveHub"; // Replace with your upload preset

interface Props {
  onSubmit: (data: Partial<Member>) => void;
  initialData?: Member;
}

export default function MemberForm({ onSubmit, initialData }: Props) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialData?.photo || null
  );
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Partial<Member>>({
    defaultValues: initialData,
  });

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", CLOUDINARY_URL, true);

      xhr.upload.onprogress = (e: ProgressEvent) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          setPhotoPreview(result.secure_url);
          setIsUploading(false);
        } else {
          console.error("Error uploading file:", xhr.responseText);
          setIsUploading(false);
          alert("Failed to upload the image. Please try again.");
        }
      };

      xhr.onerror = () => {
        console.error("Error uploading file:", xhr.responseText);
        setIsUploading(false);
        alert("Failed to upload the image. Please try again.");
      };

      xhr.send(formData);
    }
  };

  const handleFormSubmit = (data: Partial<Member>) => {
    onSubmit({
      ...data,
      photo: photoPreview,
    });
  };

  // Calculate "Member Since" date
  const memberSince = initialData?.createdAt
    ? format(new Date(initialData.createdAt), "MM/yy")
    : null;

  return (
    <div className="relative">
      {/* Member Since label */}
      {memberSince && (
        <div className="absolute top-0 right-0 text-sm font-serif font-medium text-green-500">
          Member Since {memberSince}
        </div>
      )}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="col-span-2">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-24 w-24 overflow-hidden rounded-full bg-gray-100">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-gray-400">No photo</span>
                  </div>
                )}
              </div>
              <label className="block">
                <span className="sr-only">Choose photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
                />
              </label>
            </div>
            {isUploading && (
              <div className="mt-2 text-sm text-green-600 flex flex-col items-center space-y-6">
                Uploading... {uploadProgress}%
              </div>
            )}
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              {...register("name", { required: "Name is required" })}
              className="mt-1 block w-full rounded-md font-serif border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              {...register("email", { required: "Email is required" })}
              className="mt-1 block w-full font-serif rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone Number Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              {...register("phoneNumber", {
                required: "Phone number is required",
              })}
              className="mt-1 block w-full rounded-md font-serif border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* Weight Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Weight (kg)
            </label>
            <input
              type="number"
              {...register("weight", {
                required: "Weight is required",
                min: { value: 20, message: "Weight must be at least 20kg" },
                max: { value: 300, message: "Weight must be less than 300kg" },
              })}
              className="mt-1 block w-full rounded-md font-serif border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.weight && (
              <p className="mt-1 text-sm text-red-600">
                {errors.weight.message}
              </p>
            )}
          </div>

          {/* Height Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Height (cm)
            </label>
            <input
              type="number"
              {...register("height", {
                required: "Height is required",
                min: { value: 100, message: "Height must be at least 100cm" },
                max: { value: 250, message: "Height must be less than 250cm" },
              })}
              className="mt-1 block w-full rounded-md font-serif border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.height && (
              <p className="mt-1 text-sm text-red-600">
                {errors.height.message}
              </p>
            )}
          </div>

          {/* Trainer Assigned Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Trainer Assigned
            </label>
            <input
              type="text"
              {...register("trainerAssigned")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm font-serif focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Membership Type Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Membership Type
            </label>
            <select
              {...register("membershipType", {
                required: "Membership type is required",
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm font-serif focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="basic">Basic</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </select>
            {errors.membershipType && (
              <p className="mt-1 text-sm text-red-600">
                {errors.membershipType.message}
              </p>
            )}
          </div>

          {/* Duration Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Duration (months)
            </label>
            <input
              type="number"
              {...register("durationMonths", {
                required: "Duration is required",
                min: { value: 1, message: "Duration must be at least 1 month" },
                max: { value: 36, message: "Duration cannot exceed 36 months" },
              })}
              className="mt-1 block w-full rounded-md font-serif border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.durationMonths && (
              <p className="mt-1 text-sm text-red-600">
                {errors.durationMonths.message}
              </p>
            )}
          </div>
          {/* Fees Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fees
            </label>
            <input
              type="number"
              {...register("fees", { required: "Fees is required", min: 0 })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.fees && (
              <p className="mt-1 text-sm text-red-600">{errors.fees.message}</p>
            )}
          </div>

          {/* Fee Status Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fee Status
            </label>
            <select
              {...register("feeStatus", { required: "Fee status is required" })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            {errors.feeStatus && (
              <p className="mt-1 text-sm text-red-600">
                {errors.feeStatus.message}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {initialData ? "Update Member" : "Add Member"}
          </button>
        </div>
      </form>
    </div>
  );
}
