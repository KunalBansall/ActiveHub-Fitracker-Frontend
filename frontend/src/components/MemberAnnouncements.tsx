import React, { useState } from "react";
import { useQuery } from "react-query";
import axios from "axios";
import { format } from "date-fns";
import { FiCalendar, FiTag, FiChevronDown, FiChevronUp, FiImage, FiVideo } from "react-icons/fi";
import LoadingSpinner from "./LoadingSpinner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface MemberAnnouncementsProps {
  gymId: string;
}

const MemberAnnouncements: React.FC<MemberAnnouncementsProps> = ({ gymId }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch announcements for this gym
  const {
    data: announcements,
    isLoading,
    isError,
    error,
  } = useQuery(
    ["memberAnnouncements", gymId],
    async () => {
      // Use the public endpoint that doesn't require authentication
      const response = await axios.get(
        `${API_URL}/public/announcements?gymId=${gymId}`
      );
      return response.data.data;
    },
    {
      // Refresh announcements every 5 minutes
      refetchInterval: 5 * 60 * 1000,
      // Don't throw on error so we can handle it gracefully
      onError: (err) => {
        console.error("Error fetching announcements:", err);
      },
    }
  );

  // Function to toggle expanded announcement
  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

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

  // Function to render media content (image or video)
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
          className="w-full h-full object-cover"
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-6">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-500 py-4">
        Unable to load announcements
      </div>
    );
  }

  if (!announcements || announcements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 text-center">
        <p className="text-gray-500">No announcements available at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Announcements</h2>
      
      {announcements.map((announcement: any) => (
        <div
          key={announcement._id}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          {renderMedia(announcement)}
          
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-800">
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
            
            <div className="mb-3 text-sm text-gray-500">
              <FiCalendar className="inline mr-1" />
              {format(new Date(announcement.createdAt), "MMM d, yyyy")}
            </div>
            
            <div className={expandedId === announcement._id ? "" : "line-clamp-2"}>
              <p className="text-gray-600">{announcement.message}</p>
            </div>
            
            {/* Show/hide button if message is long */}
            {announcement.message.length > 120 && (
              <button
                onClick={() => toggleExpand(announcement._id)}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                {expandedId === announcement._id ? (
                  <>
                    Show less <FiChevronUp className="ml-1" />
                  </>
                ) : (
                  <>
                    Read more <FiChevronDown className="ml-1" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MemberAnnouncements; 