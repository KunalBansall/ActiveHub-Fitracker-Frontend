import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ad, useAds } from '../../context/AdContext';

interface ProfileFooterAdProps {
  ad?: Ad;
}

const ProfileFooterAd: React.FC<ProfileFooterAdProps> = ({ ad: providedAd }) => {
  const { getAdsByPlacement, recordView, recordClick } = useAds();
  const [ad, setAd] = useState<Ad | undefined>(providedAd);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  
  // If no ad is provided, get one from the profile placement
  useEffect(() => {
    if (!providedAd) {
      const profileAds = getAdsByPlacement('profile');
      if (profileAds.length > 0) {
        // Select a random ad from the profile placement
        const randomAd = profileAds[Math.floor(Math.random() * profileAds.length)];
        setAd(randomAd);
      }
    } else {
      setAd(providedAd);
    }
  }, [providedAd, getAdsByPlacement]);

  // Record a view when the ad is shown - using a ref to prevent duplicate recordings
  const viewRecorded = useRef<{[key: string]: boolean}>({});
  
  useEffect(() => {
    if (ad && !viewRecorded.current[ad._id]) {
      // Only record view if we haven't already recorded it for this ad
      recordView(ad._id);
      viewRecorded.current[ad._id] = true;
    }
  }, [ad, recordView]);

  const handleClick = () => {
    if (ad) {
      recordClick(ad._id);
      if (ad.ctaUrl) {
        if (ad.ctaUrl.startsWith('http')) {
          window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer');
        } else {
          navigate(ad.ctaUrl);
        }
      }
    }
  };

  if (!ad) return null;

  return (
    <div className="mt-10 border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600"></div>
          <span className="text-sm text-gray-500 font-medium">Sponsored Content</span>
        </div>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">Ad</span>
      </div>
      
      <div 
        className="overflow-hidden rounded-2xl shadow-lg bg-white cursor-pointer hover:shadow-xl transition-all duration-300 group"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        aria-label={`Advertisement: ${ad.title}`}
      >
        <div className="flex flex-col lg:flex-row">
          {/* Media section */}
          <div className="lg:w-2/5 h-56 lg:h-auto relative overflow-hidden">
            {ad.contentType === 'image' ? (
              <img 
                src={ad.mediaUrl} 
                alt={ad.title}
                className="w-full h-full object-cover transition-transform duration-700"
                style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
              />
            ) : (
              <video 
                src={ad.mediaUrl}
                className="w-full h-full object-cover transition-transform duration-700"
                style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
                autoPlay
                muted
                loop
                playsInline
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Optional badge for gym targeting */}
            {ad.gyms && ad.gyms.length > 0 && (
              <div className="absolute bottom-3 left-3">
                <div className="flex flex-wrap gap-1">
                  {ad.gyms.slice(0, 1).map((gym, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-600/80 text-white rounded backdrop-blur-sm">
                      {gym}
                    </span>
                  ))}
                  {ad.gyms.length > 1 && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-600/80 text-white rounded backdrop-blur-sm">
                      +{ad.gyms.length - 1} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Content section */}
          <div className="p-5 lg:p-6 lg:flex-1 flex flex-col justify-between relative">
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 mb-2">{ad.title}</h3>
              {ad.description && (
                <p className="text-sm text-gray-600 line-clamp-3 lg:line-clamp-4 mb-4">{ad.description}</p>
              )}
            </div>
            
            {/* Target audience tag */}
            {ad.targetAudience !== 'both' && (
              <div className="absolute top-5 right-5">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                  ad.targetAudience === 'admin' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  For {ad.targetAudience === 'admin' ? 'Admins' : 'Members'}
                </span>
              </div>
            )}
            
            {ad.ctaUrl && (
              <div className="mt-4">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium rounded-lg transition-all duration-300 transform group-hover:translate-x-1">
                  <span>Learn More</span>
                  <svg 
                    className="ml-2 h-4 w-4 transform transition-transform duration-300" 
                    style={{ transform: isHovered ? 'translateX(3px)' : 'translateX(0)' }}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileFooterAd; 