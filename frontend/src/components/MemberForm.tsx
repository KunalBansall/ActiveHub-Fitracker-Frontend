import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Member } from "../types";
import { Typography } from "@material-tailwind/react";
import { toast } from "react-hot-toast"; // Importing the toast function

const defaultImage = "/ah2.jpeg";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/diy7wynvw/image/upload"; // Cloud Name: diy7wynvw
const UPLOAD_PRESET = "ActiveHub"; // Replace with your upload preset

interface Props {
  onSubmit: (data: Partial<Member>) => void;
  initialData?: Member;
}

const userString = localStorage.getItem("user");
const user = userString ? JSON.parse(userString) : {}; // Fallback to an empty object if "user" is null or undefined
const gymName = user?.gymName; // Safe access with optional chaining


export default function MemberForm({ onSubmit, initialData }: Props) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialData?.photo || null
  );
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleFormSubmit = async (data: Partial<Member>) => {
    setIsSubmitting(true); // Disable the button when submission starts

    try {
      await onSubmit({
        ...data,
        photo: photoPreview,
      });

      // Show success toast when member data is updated
      if (initialData) {
        toast.success(`${initialData.name}'s Profile updated successfully!`);
      } else {
        toast.success("Member added successfully!");
      }
    } catch (error) {
      toast.error("There was an error while submitting the form.");
    } finally {
      setIsSubmitting(false); // Enable the button when submission is complete
    }
  };

  const memberSince = initialData?.createdAt
    ? format(new Date(initialData.createdAt), "MM/yy")
    : null;

  const handleImageClick = () => {
    document.getElementById("fileInput")?.click();
  };

  return (
    <div className="relative font-serif">
      {memberSince && (
        <div className="absolute top-0 right-0 text-sm font-medium text-green-500">
          {/* Member Since {memberSince} */}
        </div>
      )}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Image Section (Left Side) */}
          <div className="flex justify-center items-center">
            <div
              className="relative w-full h-96 overflow-hidden rounded-xl bg-gray-100 cursor-pointer"
              onClick={handleImageClick}
            >
              {photoPreview ? (
                <img
                  className="h-full w-full object-cover object-center"
                  src={photoPreview}
                  alt="Preview"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <img
                    src={defaultImage} // Use the default image from public folder
                    alt="Default"
                    className="h-96 w-full object-top"
                  />
                  <span className="text-blue-800 font-serif font-bold">
                    {/* {gymName} */}
                  </span>
                </div>
              )}

              {isUploading && (
                <div
                  className="absolute top-2 left-2/4 transform -translate-x-2/4 flex flex-col items-center space-y-2 text-green-800"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.7)", // Optional: Add a semi-transparent background for readability
                    padding: "4px 8px",
                    borderRadius: "4px",
                  }}
                >
                  Uploading... {uploadProgress}%
                </div>
              )}

              {/* Blurred Caption */}
              <figcaption className="absolute bottom-8 left-2/4 flex w-[calc(100%-4rem)] -translate-x-2/4 justify-between rounded-xl border border-white bg-white/75 py-4 px-6 shadow-lg shadow-black/5 saturate-200 backdrop-blur-sm">
                <div>
                  <Typography
                    variant="h5"
                    color="blue-gray"
                    className="text-lg font-semibold"
                    {...({
                      children: initialData?.name || "Member Name",
                    } as any)}
                  />

                  <Typography
                    color="blue-gray"
                    className="mt-2 font-normal"
                    type="text" // Optional, if needed
                    {...({ children: memberSince || "MM/YY" } as any)}
                  />
                </div>
                <Typography
                  variant="h5"
                  color="blue-gray"
                  className="text-lg font-semibold mr-3"
                  {...({ children: gymName } as any)}
                />
              </figcaption>
            </div>

            <label className="sr-only">
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Form Fields Section (Right Side) */}
          <div className="space-y-4">
            {/* Name Field */}
            <div className="flex justify-between">
              <Typography
                className="font-semibold"
                {...({ children: "Name" } as any)}
              />

              <input
                {...register("name")}
                type="text"
                defaultValue={initialData?.name || ""}
                className=" p-1 w-1/2 shadow-md"
              />
            </div>

            {/* Phone Number Field */}
            <div className="flex justify-between">
              <Typography
                color="blue-gray"
                className="font-semibold"
                {...({ children: "Phone Number" } as any)}
              />

              <input
                {...register("phoneNumber")}
                type="text"
                defaultValue={initialData?.phoneNumber || ""}
                className=" p-1 w-1/2 shadow-md"
              />
            </div>

            {/* Email Field */}
            <div className="flex justify-between">
              <Typography
                color="blue-gray"
                className="font-semibold"
                {...({ children: "Email" } as any)}
              />

              <input
                {...register("email")}
                type="email"
                defaultValue={initialData?.email || ""}
                className=" p-1 w-1/2 shadow-md"
              />
            </div>

            {/* Weight Field */}
            <div className="flex justify-between">
              <Typography
                color="blue-gray"
                className="font-semibold"
                {...({ children: "Weight (kg)" } as any)}
              />

              <input
                {...register("weight")}
                type="number"
                defaultValue={initialData?.weight || ""}
                className=" p-1 w-1/2 shadow-md"
              />
            </div>

            {/* Height Field */}
            <div className="flex justify-between">
              <Typography
                color="blue-gray"
                className="font-semibold"
                {...({ children: "Height (cm)" } as any)}
              />

              <input
                {...register("height")}
                type="number"
                defaultValue={initialData?.height || ""}
                className=" p-1 w-1/2 shadow-md"
              />
            </div>

            {/* Trainer Assigned Field */}
            <div className="flex justify-between">
              <Typography
                color="blue-gray"
                className="font-semibold"
                {...({ children: "Trainer Assigned" } as any)}
              />

              <input
                {...register("trainerAssigned")}
                type="text"
                defaultValue={initialData?.trainerAssigned || ""}
                className=" p-1 w-1/2 shadow-md"
              />
            </div>

            {/* Membership Type Field */}
            <div className="flex justify-between">
              <Typography
                color="blue-gray"
                className="font-semibold"
                {...({ children: "Membership Type" } as any)}
              />

              <select
                {...register("membershipType")}
                defaultValue={initialData?.membershipType || ""}
                className=" p-1 w-1/2 shadow-md"
              >
                <option value="basic">basic</option>
                <option value="premium">premium</option>
                <option value="platinum">platinum</option>
              </select>
            </div>

            {/* Duration Field */}
            {/* Duration Months */}
            <div className="flex justify-between">
              <Typography
                color="blue-gray"
                className="font-semibold"
                {...({ children: "Duration (months)" } as any)}
              />

              <input
                {...register("durationMonths", {
                  valueAsNumber: true,
                  required: true,
                })}
                type="number"
                min="1" // Ensure it's a positive number
                defaultValue={initialData?.durationMonths || 1}
                className=" p-1 w-1/2 shadow-md"
              />
            </div>

            {/* Fees Field */}
            <div className="flex justify-between">
              <Typography
                color="blue-gray"
                className="font-semibold"
                {...({ children: "Fees" } as any)}
              />

              <input
                {...register("fees", { valueAsNumber: true, required: true })}
                type="number"
                min="0" // Fees should be a positive number
                defaultValue={initialData?.fees || 500}
                className=" p-1 w-1/2 shadow-md"
              />
            </div>

            {/* Fees Status Field */}
            <div className="flex justify-between">
              <Typography
                color="blue-gray"
                className="font-semibold"
                {...({ children: "Fee Status" } as any)}
              />

              <select
                {...register("feeStatus", { required: true })}
                defaultValue={initialData?.feeStatus || "due"} // Default to "due"
                className=" p-1 w-1/2 shadow-md"
              >
                <option value="paid">Paid</option>
                <option value="due">Due</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting} // Disable when submitting
            className={`px-6 py-2 rounded-md text-white ${
              isSubmitting
                ? "bg-gray-500 opacity-50"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isSubmitting
              ? "Adding/Updating..."
              : initialData
              ? "Update Member"
              : "Add Member"}
          </button>
        </div>
      </form>
    </div>
  );
}
