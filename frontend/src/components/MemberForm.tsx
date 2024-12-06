import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Member } from "../types";
import { Typography } from "@material-tailwind/react";

const defaultImage = "/Designer.jpeg";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/diy7wynvw/image/upload"; // Cloud Name: diy7wynvw
const UPLOAD_PRESET = "ActiveHub"; // Replace with your upload preset

interface Props {
  onSubmit: (data: Partial<Member>) => void;
  initialData?: Member;
}

const user = JSON.parse(localStorage.getItem("user") || "{}"); // Get user from localStorage
const gymName = user.gymName;

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
                  </span>{" "}
                  {/* Dynamic gym name */}
                </div>
              )}

              {/* Blurred Caption */}
              <figcaption className="absolute bottom-8 left-2/4 flex w-[calc(100%-4rem)] -translate-x-2/4 justify-between rounded-xl border border-white bg-white/75 py-4 px-6 shadow-lg shadow-black/5 saturate-200 backdrop-blur-sm">
                <div>
                  <Typography
                    variant="h5"
                    color="blue-gray"
                    className="text-lg font-semibold"
                    onPointerEnterCapture={() => {}}
                    onPointerLeaveCapture={() => {}}
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
                  className="text-lg font-semibold"
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

            {isUploading && (
              <div className="mt-2 text-sm text-green-600 flex flex-col items-center space-y-6">
                Uploading... {uploadProgress}%
              </div>
            )}
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
                defaultValue={initialData?.fees || 0}
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
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {initialData ? "Update Member" : "Add Member"}
          </button>
        </div>
      </form>
    </div>
  );
}
