import React from "react";
import { FiEdit2, FiTrash2, FiCalendar, FiUser, FiTag, FiEye, FiEyeOff, FiImage, FiVideo } from "react-icons/fi";
import { format } from "date-fns";

interface AnnouncementListProps {
  announcements: any[];
  onEdit: (announcement: any) => void;
  onDelete: (id: string) => void;
}

const AnnouncementList: React.FC<AnnouncementListProps> = ({
  announcements,
  onEdit,
  onDelete,
}) => {
  // Function to get badge color based on category
  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "news":
        return "bg-blue-100 text-blue-800";
      case "information":
        return "bg-green-100 text-green-800";
      case "event":
        return "bg-purple-100 text-purple-800";
      case "tip":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to format category name for display
  const formatCategory = (category: string) => {
    switch (category) {
      case "news":
        return "News";
      case "information":
        return "Information";
      case "event":
        return "Event";
      case "tip":
        return "Fitness Tip";
      default:
        return category;
    }
  };

  // Function to render the media content (image or video)
  const renderMedia = (announcement: any) => {
    if (!announcement.image) return null;
    
    if (announcement.mediaType === "video") {
      return (
        <div className="h-48 overflow-hidden relative">
          <video
            src={announcement.image}
            className="w-full h-full object-cover"
            controls
            onError={(e) => {
              console.error("Video error:", e);
              // Replace with fallback image on error
              (e.target as HTMLVideoElement).style.display = "none";
              const fallbackImg = document.createElement('img');
              fallbackImg.src = "https://via.placeholder.com/400x200?text=Video+Not+Available";
              fallbackImg.className = "w-full h-full object-cover";
              (e.target as HTMLVideoElement).parentNode?.appendChild(fallbackImg);
            }}
          >
            Your browser does not support the video tag.
          </video>
          <div className="absolute top-2 right-2 bg-black bg-opacity-60 p-1 rounded-md">
            <FiVideo className="text-white" />
          </div>
        </div>
      );
    }
    
    // Default to image
    return (
      <div className="h-48 overflow-hidden relative">
        <img
          src={announcement.image}
          alt={announcement.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Image+Not+Found";
          }}
        />
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 p-1 rounded-md">
          <FiImage className="text-white" />
        </div>
      </div>
    );
  };

  if (announcements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No announcements found. Create your first announcement!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {announcements.map((announcement) => (
        <div
          key={announcement._id}
          className={`bg-white rounded-lg shadow-md overflow-hidden ${
            !announcement.isActive ? "border-l-4 border-gray-400" : ""
          }`}
        >
          {renderMedia(announcement)}
          
          <div className="p-5">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold text-gray-800 max-w-[80%]">
                {announcement.title}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(
                  announcement.category
                )}`}
              >
                <FiTag className="inline mr-1" />
                {formatCategory(announcement.category)}
              </span>
            </div>
            
            <p className="text-gray-600 mb-4 line-clamp-3">{announcement.message}</p>
            
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <FiCalendar className="mr-1" />
              <span>
                {format(new Date(announcement.createdAt), "MMM d, yyyy")}
              </span>
              {announcement.createdBy && (
                <>
                  <span className="mx-2">•</span>
                  <FiUser className="mr-1" />
                  <span>{announcement.createdBy.username}</span>
                </>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                {announcement.isActive ? (
                  <span className="inline-flex items-center text-sm text-green-600">
                    <FiEye className="mr-1" /> Visible
                  </span>
                ) : (
                  <span className="inline-flex items-center text-sm text-gray-500">
                    <FiEyeOff className="mr-1" /> Hidden
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(announcement)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Edit"
                >
                  <FiEdit2 />
                </button>
                <button
                  onClick={() => onDelete(announcement._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementList; 