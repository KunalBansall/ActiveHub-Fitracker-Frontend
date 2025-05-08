import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Ad, useAds } from '../../context/AdContext';

interface TopOverlayAdProps {
  ad?: Ad;
  onClose?: () => void;
}

const TopOverlayAd: React.FC<TopOverlayAdProps> = ({ ad: providedAd, onClose }) => {
  const { getAdsByPlacement, recordView, recordClick } = useAds();
  const [ad, setAd] = useState<Ad | undefined>(providedAd);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimated, setIsAnimated] = useState(false);
  const navigate = useNavigate();
  
  // Check if ad has been shown in this session
  useEffect(() => {
    const hasSeenAd = localStorage.getItem('hasSeenTopOverlayAd');
    if (hasSeenAd === 'true') {
      setIsVisible(false);
      if (onClose) onClose();
    }
  }, [onClose]);

  // If no ad is provided, get one from the topOverlay placement
  useEffect(() => {
    if (!providedAd) {
      const topOverlayAds = getAdsByPlacement('topOverlay');
      if (topOverlayAds.length > 0) {
        // Select a random ad from the topOverlay placement
        const randomAd = topOverlayAds[Math.floor(Math.random() * topOverlayAds.length)];
        setAd(randomAd);
      }
    } else {
      setAd(providedAd);
    }
  }, [providedAd, getAdsByPlacement]);

  // Record a view when the ad is shown
  useEffect(() => {
    if (ad && isVisible) {
      recordView(ad._id);
      // Mark that the user has seen the ad
      localStorage.setItem('hasSeenTopOverlayAd', 'true');
    }
  }, [ad, isVisible, recordView]);

  // Set animation after component mounts
  useEffect(() => {
    if (ad) {
      // Slight delay to ensure elements are rendered first
      const timer = setTimeout(() => {
        setIsAnimated(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [ad]);

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

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!ad || !isVisible) return null;

  return (
    <div 
      data-testid="overlay-ad"
      className="fixed inset-x-0 top-0 z-50 bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg transform transition-all duration-500 ease-in-out"
      style={{
        opacity: isAnimated ? 1 : 0,
        transform: isAnimated ? 'translateY(0)' : 'translateY(-100%)'
      }}
    >
      <div className="container mx-auto px-4 py-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center space-x-4">
            <div className="relative h-10 w-10 rounded-md overflow-hidden flex items-center justify-center bg-white/10 backdrop-blur-sm shadow-inner">
              {ad.contentType === 'image' ? (
                <img 
                  src={ad.mediaUrl} 
                  alt={ad.title}
                  className="h-full w-full object-cover transform hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <video 
                  src={ad.mediaUrl}
                  className="h-full w-full object-cover transform hover:scale-110 transition-transform duration-700"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-50"></div>
            </div>
            <div className="flex-1 transform transition-all duration-500" 
                 style={{ transform: isAnimated ? 'translateX(0)' : 'translateX(-10px)', opacity: isAnimated ? 1 : 0 }}>
              <p className="text-sm font-semibold text-white tracking-tight">{ad.title}</p>
              {ad.description && (
                <p className="text-xs text-blue-50 hidden md:block max-w-md truncate">{ad.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3 transform transition-all duration-500" 
               style={{ transform: isAnimated ? 'translateX(0)' : 'translateX(10px)', opacity: isAnimated ? 1 : 0 }}>
            {ad.ctaUrl && (
              <button 
                onClick={handleClick}
                className="group px-3 py-1.5 bg-white text-blue-600 text-xs font-medium rounded-md hover:bg-blue-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-1 focus:ring-offset-blue-600 shadow-sm"
              >
                <span className="flex items-center">
                  Learn More
                  <svg className="ml-1 h-3 w-3 transform group-hover:translate-x-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            )}
            <button 
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 rounded-full p-1"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="absolute top-0 right-16 bg-white/20 backdrop-blur-sm rounded-b-md px-2 py-0.5 text-xs text-white/90 font-medium tracking-wide">
          Sponsored
        </div>
      </div>
    </div>
  );
};

export default TopOverlayAd; 