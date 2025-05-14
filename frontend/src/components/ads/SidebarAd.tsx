import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ad, useAds } from '../../context/AdContext';

interface SidebarAdProps {
  ad?: Ad;
}

const SidebarAd: React.FC<SidebarAdProps> = ({ ad: providedAd }) => {
  const { getAdsByPlacement, recordView, recordClick } = useAds();
  const [ad, setAd] = useState<Ad | undefined>(providedAd);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  
  // If no ad is provided, get one from the sidebar placement
  useEffect(() => {
    if (!providedAd) {
      const sidebarAds = getAdsByPlacement('sidebar');
      if (sidebarAds.length > 0) {
        // Select a random ad from the sidebar placement
        const randomAd = sidebarAds[Math.floor(Math.random() * sidebarAds.length)];
        setAd(randomAd);
      }
    } else {
      setAd(providedAd);
    }
  }, [providedAd, getAdsByPlacement]);

  // Record a view when the ad is shown
  useEffect(() => {
    if (ad) {
      recordView(ad._id);
    }
  }, [ad, recordView]);

  const handleClick = (clickType: 'cta' | 'learn_more' | 'image' | 'video' = 'cta') => {
    if (ad) {
      recordClick(ad._id, clickType);
      if (ad.ctaUrl) {
        if (ad.ctaUrl.startsWith('http')) {
          window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer');
        } else {
          navigate(ad.ctaUrl);
        }
      }
    }
  };

  const handleImageClick = () => {
    handleClick('image');
  };

  const handleLearnMoreClick = () => {
    handleClick('learn_more');
  };

  if (!ad) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-gray-400 font-medium">Sponsored</span>
        <span className="text-xs bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded-sm">Ad</span>
      </div>
      <div 
        className="w-full overflow-hidden rounded-lg bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300"
        onClick={() => handleClick('cta')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        aria-label={`Advertisement: ${ad.title}`}
      >
        <div className="relative cursor-pointer overflow-hidden">
          <div className="w-full h-32 overflow-hidden">
            {ad.contentType === 'image' ? (
              <img 
                src={ad.mediaUrl} 
                alt={ad.title}
                className="w-full h-full object-cover transform transition-transform duration-700"
                style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
                onClick={handleImageClick}
              />
            ) : (
              <video 
                src={ad.mediaUrl}
                className="w-full h-full object-cover transform transition-transform duration-700"
                style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
                autoPlay
                muted
                loop
                playsInline
                onClick={() => handleClick('video')}
              />
            )}
            <div 
              className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300"
              style={{ opacity: isHovered ? 0.8 : 0.5 }}
            ></div>
          </div>
        </div>
        
        <div className="p-3 bg-gray-800 text-gray-100">
          <h3 className="text-sm font-medium truncate transition-colors duration-300"
              style={{ color: isHovered ? '#ffffff' : '#e5e7eb' }}>
            {ad.title}
          </h3>
          {ad.description && (
            <p className="mt-1 text-xs text-gray-400 line-clamp-2 transition-all duration-300">
              {ad.description}
            </p>
          )}
          {ad.ctaUrl && (
            <div 
              className="mt-2 overflow-hidden transition-all duration-300 flex items-center"
              style={{ height: isHovered ? '20px' : '0px', opacity: isHovered ? 1 : 0 }}
              onClick={handleLearnMoreClick}
            >
              <span className="text-xs text-blue-400 font-medium mr-1">Learn More</span>
              <svg className="h-3 w-3 text-blue-400 transform transition-transform duration-300"
                   style={{ transform: isHovered ? 'translateX(3px)' : 'translateX(0)' }}
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarAd; 