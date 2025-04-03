import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Member } from "../types";
import { Typography } from "@material-tailwind/react";
import { toast } from "react-hot-toast";
import { isValidEmail } from "../config/validations";
import { Slider } from "@material-tailwind/react";

const defaultImage = "/ah2.jpeg";
const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

interface Props {
  onSubmit: (data: Partial<Member>) => void;
  initialData?: Member;
}

const userString = localStorage.getItem("user");
const user = userString ? JSON.parse(userString) : {};
const gymName = user?.gymName;

export default function MemberForm({ onSubmit, initialData }: Props) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialData?.photo || null
  );
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [membershipEndDate, setMembershipEndDate] = useState<string>(
    initialData?.membershipEndDate 
      ? format(new Date(initialData.membershipEndDate), "yyyy-MM-dd")
      : format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd") // Default to 30 days from now
  );

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
    setIsSubmitting(true);

    try {
      await onSubmit({
        ...data,
        photo: photoPreview,
        membershipEndDate: membershipEndDate, // Use the selected date instead of calculating from duration
      });

      if (initialData) {
        toast.success(`${initialData.name}'s Profile updated successfully!`);
      } else {
        toast.success("New member added successfully!");
      }
    } catch (error) {
      toast.error("There was an error while submitting the form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const memberSince = initialData?.createdAt
    ? format(new Date(initialData.createdAt), "MMM/yy")
    : null;

  const MembershipEndDate = initialData?.membershipEndDate
    ? format(new Date(initialData.membershipEndDate), "dd/MMM")
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
                    src={defaultImage}
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
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                  }}
                >
                  Uploading... {uploadProgress}%
                </div>
              )}

              {/* Blurred Caption */}
              <figcaption className="absolute bottom-8 left-2/4 flex w-[calc(100%-4rem)] -translate-x-2/4 justify-between rounded-xl border border-white bg-white/75 py-4 px-6 shadow-lg shadow-black/5 saturate-200 backdrop-blur-sm ">
                <div className="mr-5">
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

                <div>
                  <Typography
                    variant="h5"
                    color="blue-gray"
                    className="text-lg font-semibold mr-3"
                    {...({ children: gymName } as any)}
                  />
                  <Typography
                    variant="h5"
                    color="blue-gray"
                    className=" mt-2 font-normal mr-3"
                    {...({
                      children: MembershipEndDate || " Expiry Date",
                    } as any)}
                  />
                </div>
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
            <div className="flex flex-col">
              <div className="flex justify-between">
                <Typography
                  className="font-semibold"
                  {...({ children: "Name" } as any)}
                />
                <input
                  {...register("name", { required: "Name is required" })}
                  type="text"
                  defaultValue={initialData?.name || ""}
                  className="p-1 w-1/2 shadow-md"
                />
              </div>
              {errors.name && (
                <span className="text-red-500 text-sm">
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* Phone Number Field */}
            <div className="flex flex-col">
              <div className="flex justify-between">
                <Typography
                  color="blue-gray"
                  className="font-semibold"
                  {...({ children: "Phone Number" } as any)}
                />
                <input
                  {...register("phoneNumber", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[0-9]+$/,
                      message: "Please enter only numbers",
                    },
                  })}
                  type="tel"
                  defaultValue={initialData?.phoneNumber || ""}
                  className="p-1 w-1/2 shadow-md"
                />
              </div>
              {errors.phoneNumber && (
                <span className="text-red-500 text-sm">
                  {errors.phoneNumber.message}
                </span>
              )}
            </div>

            {/* Email Field */}
            <div className="flex flex-col">
              <div className="flex justify-between">
                <Typography
                  color="blue-gray"
                  className="font-semibold"
                  {...({ children: "Email" } as any)}
                />
                <input
                  {...register("email", {
                    required: "Email is required",
                    validate: (value) =>
                      isValidEmail(value || "") || "Invalid email address", // Handle undefined value
                  })}
                  type="email"
                  defaultValue={initialData?.email || ""}
                  className="p-1 w-1/2 shadow-md"
                />
              </div>
              {errors.email && (
                <span className="text-red-500 text-sm">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Weight Field */}
            <div className="flex flex-col">
              <div className="flex justify-between">
                <Typography
                  color="blue-gray"
                  className="font-semibold"
                  {...({ children: "Weight (kg)" } as any)}
                />
                <input
                  {...register("weight", {
                    required: "Weight is required",
                    valueAsNumber: true,
                  })}
                  type="number"
                  defaultValue={initialData?.weight ?? 50} // Fallback to 0 if undefined
                  className="p-1 w-1/2 shadow-md"
                />
              </div>
              {errors.weight && (
                <span className="text-red-500 text-sm">
                  {errors.weight.message}
                </span>
              )}
            </div>

            {/* Height Field */}
            <div className="flex flex-col">
              <div className="flex justify-between">
                <Typography
                  color="blue-gray"
                  className="font-semibold"
                  {...({ children: "Height (cm)" } as any)}
                />
                <input
                  {...register("height", {
                    required: "Height is required",
                    valueAsNumber: true,
                  })}
                  type="number"
                  defaultValue={initialData?.height ?? 160} // Fallback to 0 if undefined
                  className="p-1 w-1/2 shadow-md"
                />
              </div>
              {errors.height && (
                <span className="text-red-500 text-sm">
                  {errors.height.message}
                </span>
              )}
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
                defaultValue={initialData?.trainerAssigned || "Yes"} // Fallback to empty string if undefined
                className="p-1 w-1/2 shadow-md"
              />
            </div>

            {/* Membership Type Field */}
            <div className="flex justify-between">
              <Typography
                color="blue-gray"
                className="font-semibold"
                {...({ children: "Slot" } as any)}
              />
              <select
                {...register("slot")}
                defaultValue={initialData?.slot || "Evening"} // Fallback to "basic" if undefined
                className="p-1 w-1/2 shadow-md"
              >
                <option value="Evening">Evening</option>
                <option value="Morning">Morning</option>
                <option value="Free Pass">Free Pass</option>
              </select>
            </div>

            {/* Membership End Date Field */}
            <div className="flex flex-col">
              <div className="flex justify-between">
                <Typography
                  color="blue-gray"
                  className="font-semibold"
                  {...({ children: "Membership End Date" } as any)}
                />
                <input
                  type="date"
                  value={membershipEndDate}
                  onChange={(e) => setMembershipEndDate(e.target.value)}
                  className="p-1 w-1/2 shadow-md"
                />
              </div>
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
                min="0"
                defaultValue={initialData?.fees ?? 500} // Fallback to 500 if undefined
                className="p-1 w-1/2 shadow-md"
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
                defaultValue={initialData?.feeStatus ?? "paid"} // Fallback to "due" if undefined
                className="p-1 w-1/2 shadow-md"
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
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-md text-white ${
              isSubmitting
                ? "bg-gray-500 opacity-50"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isSubmitting
              ? "Processing..."
              : initialData
              ? "Update Member"
              : "Add Member"}
          </button>
        </div>
      </form>
    </div>
  );
}
