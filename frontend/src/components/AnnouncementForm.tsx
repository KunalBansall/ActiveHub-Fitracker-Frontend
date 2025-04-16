import React, { useState, useEffect } from "react";
import { FiSave, FiX, FiUpload, FiImage, FiVideo, FiLink } from "react-icons/fi";
import toast from "react-hot-toast";

// Cloudinary configuration from environment variables
const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

interface AnnouncementFormProps {
  announcement?: any;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  announcement,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    image: "",
    mediaType: "image", // 'image' or 'video'
    category: "information",
    isActive: true,
  });

  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [urlInput, setUrlInput] = useState(false);

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || "",
        message: announcement.message || "",
        image: announcement.image || "",
        mediaType: announcement.mediaType || "image",
        category: announcement.category || "information",
        isActive: announcement.isActive !== false, // Default to true if not defined
      });

      // Set preview for existing media
      if (announcement.image) {
        setMediaPreview(announcement.image);
      }
    }
  }, [announcement]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleMediaTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, mediaType: e.target.value });
    // Reset media preview when changing types
    setMediaPreview(null);
    setMediaFile(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileType = file.type.split('/')[0]; // 'image' or 'video'
    
    // Validate file type
    if (formData.mediaType === 'image' && fileType !== 'image') {
      toast.error('Please select an image file');
      return;
    }
    
    if (formData.mediaType === 'video' && fileType !== 'video') {
      toast.error('Please select a video file');
      return;
    }
    
    // Check file size (limit to 10MB for now)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB.');
      return;
    }

    setMediaFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Upload the file immediately
    uploadToCloudinary(file);
  };

  const uploadToCloudinary = (file: File) => {
    if (!file) return;
    
    setUploadingMedia(true);
    setUploadProgress(0);
    
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', UPLOAD_PRESET);
    
    // Use XMLHttpRequest for better progress tracking
    const xhr = new XMLHttpRequest();
    xhr.open('POST', CLOUDINARY_URL, true);
    
    xhr.upload.onprogress = (e: ProgressEvent) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percent);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        setFormData({
          ...formData,
          image: result.secure_url,
        });
        setUploadingMedia(false);
        toast.success('Media uploaded successfully!');
      } else {
        console.error('Error uploading file:', xhr.responseText);
        setUploadingMedia(false);
        toast.error('Failed to upload media. Please try again.');
      }
    };
    
    xhr.onerror = () => {
      console.error('Error uploading file');
      setUploadingMedia(false);
      toast.error('Failed to upload media. Please try again.');
    };
    
    xhr.send(uploadData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If still uploading, show a warning
    if (uploadingMedia) {
      toast.error('Please wait for the media to finish uploading');
      return;
    }
    
    onSubmit(formData);
  };

  const toggleUrlInput = () => {
    setUrlInput(!urlInput);
    if (!urlInput) {
      // Clear file input when switching to URL input
      setMediaFile(null);
      setMediaPreview(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 w-full max-w-full">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">
        {announcement ? "Edit Announcement" : "Create New Announcement"}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="title">
            Title*
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="Enter announcement title"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="message">
            Message*
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            rows={4}
            placeholder="Enter announcement message"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Media
          </label>
          
          <div className="flex flex-col sm:flex-row mb-3 gap-2">
            <select
              id="mediaType"
              name="mediaType"
              value={formData.mediaType}
              onChange={handleMediaTypeChange}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:mr-3 mb-2 sm:mb-0"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
            
            <button
              type="button"
              onClick={toggleUrlInput}
              className="flex items-center justify-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition"
            >
              {urlInput ? <FiUpload className="mr-2" /> : <FiLink className="mr-2" />}
              {urlInput ? "Upload File" : "Enter URL"}
            </button>
          </div>
          
          {urlInput ? (
            <div className="mb-4">
              <input
                type="url"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Enter ${formData.mediaType} URL`}
              />
            </div>
          ) : (
            <div className="mb-4">
              <label 
                htmlFor="mediaUpload" 
                className="flex items-center justify-center w-full h-24 sm:h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-blue-400 focus:outline-none"
              >
                <span className="flex flex-col items-center space-y-2 text-center">
                  {formData.mediaType === "image" ? (
                    <FiImage className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                  ) : (
                    <FiVideo className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                  )}
                  <span className="font-medium text-sm sm:text-base text-gray-600">
                    {uploadingMedia ? (
                      <span>Uploading... {uploadProgress}%</span>
                    ) : (
                      <span>
                        Drop {formData.mediaType} here or click to browse
                      </span>
                    )}
                  </span>
                </span>
                <input
                  type="file"
                  id="mediaUpload"
                  accept={formData.mediaType === "image" ? "image/*" : "video/*"}
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploadingMedia}
                />
              </label>
            </div>
          )}
          
          {/* Preview for uploaded file or URL */}
          {(mediaPreview || formData.image) && (
            <div className="mt-3 flex justify-center">
              {formData.mediaType === "image" ? (
                <img
                  src={mediaPreview || formData.image}
                  alt="Preview"
                  className="max-w-full h-auto max-h-48 sm:max-h-64 object-contain rounded-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=Invalid+Image";
                  }}
                />
              ) : (
                <video
                  src={mediaPreview || formData.image}
                  controls
                  className="max-w-full h-auto max-h-48 sm:max-h-64 rounded-md"
                  onError={(e) => {
                    console.error("Video error:", e);
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="news">News</option>
            <option value="information">Important Information</option>
            <option value="event">Event Notification</option>
            <option value="tip">Health or Fitness Tip</option>
          </select>
        </div>

        {announcement && (
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={(e) => 
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="text-gray-700" htmlFor="isActive">
              Active (visible to members)
            </label>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end sm:space-x-4 mt-6 space-y-2 sm:space-y-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading || uploadingMedia}
          >
            <FiX className="mr-2 h-5 w-5" />
            Cancel
          </button>
          <button
            type="submit"
            className={`flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              (isLoading || uploadingMedia) ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={isLoading || uploadingMedia}
          >
            <FiSave className="mr-2 h-5 w-5" />
            {isLoading ? "Saving..." : uploadingMedia ? `Uploading ${uploadProgress}%...` : "Save Announcement"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnnouncementForm; 