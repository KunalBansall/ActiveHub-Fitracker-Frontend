import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns"; // Importing date-fns for formatting
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/diy7wynvw/image/upload"; // Cloud Name: diy7wynvw
const UPLOAD_PRESET = "ActiveHub"; // Replace with your upload preset
export default function MemberForm({ onSubmit, initialData }) {
    const [photoPreview, setPhotoPreview] = useState(initialData?.photo || null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const { register, handleSubmit, formState: { errors }, } = useForm({
        defaultValues: initialData,
    });
    const handlePhotoChange = async (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsUploading(true);
            setUploadProgress(0);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", UPLOAD_PRESET);
            const xhr = new XMLHttpRequest();
            xhr.open("POST", CLOUDINARY_URL, true);
            xhr.upload.onprogress = (e) => {
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
                }
                else {
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
    const handleFormSubmit = (data) => {
        onSubmit({
            ...data,
            photo: photoPreview,
        });
    };
    // Calculate "Member Since" date
    const memberSince = initialData?.createdAt
        ? format(new Date(initialData.createdAt), "MM/yy")
        : null;
    return (_jsxs("div", { className: "relative", children: [memberSince && (_jsxs("div", { className: "absolute top-0 right-0 text-sm text-gray-500", children: ["Member Since ", memberSince] })), _jsxs("form", { onSubmit: handleSubmit(handleFormSubmit), className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2", children: [_jsxs("div", { className: "col-span-2", children: [_jsxs("div", { className: "flex flex-col items-center space-y-4", children: [_jsx("div", { className: "h-24 w-24 overflow-hidden rounded-full bg-gray-100", children: photoPreview ? (_jsx("img", { src: photoPreview, alt: "Preview", className: "h-full w-full object-cover" })) : (_jsx("div", { className: "flex h-full items-center justify-center", children: _jsx("span", { className: "text-gray-400", children: "No photo" }) })) }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "sr-only", children: "Choose photo" }), _jsx("input", { type: "file", accept: "image/*", onChange: handlePhotoChange, className: "block w-full text-sm text-gray-500\n                  file:mr-4 file:py-2 file:px-4\n                  file:rounded-md file:border-0\n                  file:text-sm file:font-semibold\n                  file:bg-blue-50 file:text-blue-700\n                  hover:file:bg-blue-100" })] })] }), isUploading && (_jsxs("div", { className: "mt-2 text-sm text-green-600", children: ["Uploading... ", uploadProgress, "%"] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Name" }), _jsx("input", { type: "text", ...register("name", { required: "Name is required" }), className: "mt-1 block w-full rounded-md font-serif border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" }), errors.name && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.name.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Email" }), _jsx("input", { type: "email", ...register("email", { required: "Email is required" }), className: "mt-1 block w-full font-serif rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" }), errors.email && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.email.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Phone Number" }), _jsx("input", { type: "tel", ...register("phoneNumber", { required: "Phone number is required" }), className: "mt-1 block w-full rounded-md font-serif border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" }), errors.phoneNumber && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.phoneNumber.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Weight (kg)" }), _jsx("input", { type: "number", ...register("weight", {
                                            required: "Weight is required",
                                            min: { value: 20, message: "Weight must be at least 20kg" },
                                            max: { value: 300, message: "Weight must be less than 300kg" },
                                        }), className: "mt-1 block w-full rounded-md font-serif border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" }), errors.weight && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.weight.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Height (cm)" }), _jsx("input", { type: "number", ...register("height", {
                                            required: "Height is required",
                                            min: { value: 100, message: "Height must be at least 100cm" },
                                            max: { value: 250, message: "Height must be less than 250cm" },
                                        }), className: "mt-1 block w-full rounded-md font-serif border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" }), errors.height && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.height.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Trainer Assigned" }), _jsx("input", { type: "text", ...register("trainerAssigned"), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm font-serif focus:border-blue-500 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Membership Type" }), _jsxs("select", { ...register("membershipType", { required: "Membership type is required" }), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm font-serif focus:border-blue-500 focus:ring-blue-500", children: [_jsx("option", { value: "basic", children: "Basic" }), _jsx("option", { value: "silver", children: "Silver" }), _jsx("option", { value: "gold", children: "Gold" }), _jsx("option", { value: "platinum", children: "Platinum" })] }), errors.membershipType && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.membershipType.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Duration (months)" }), _jsx("input", { type: "number", ...register("durationMonths", {
                                            required: "Duration is required",
                                            min: { value: 1, message: "Duration must be at least 1 month" },
                                            max: { value: 36, message: "Duration cannot exceed 36 months" },
                                        }), className: "mt-1 block w-full rounded-md font-serif border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" }), errors.durationMonths && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.durationMonths.message }))] })] }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { type: "submit", className: "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700", children: initialData ? "Update Member" : "Add Member" }) })] })] }));
}
