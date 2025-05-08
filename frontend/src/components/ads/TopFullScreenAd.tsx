import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Ad, useAds } from '../../context/AdContext';

interface TopFullScreenAdProps {
  ad?: Ad;
  onClose?: () => void;
}

const TopFullScreenAd: React.FC<TopFullScreenAdProps> = ({ ad: providedAd, onClose }) => {
  const { getAdsByPlacement, recordView, recordClick } = useAds();
  const [ad, setAd] = useState<Ad | undefined>(providedAd);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimated, setIsAnimated] = useState(false);
  const navigate = useNavigate();
  
  // Dismiss the ad
  const handleDismiss = useCallback(() => {
    setIsAnimated(false);
    
    // Wait for exit animation to complete before removing from DOM
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 500);
  }, [onClose]);
  
  // Check if the ad has been shown already in this session
  useEffect(() => {
    const hasSeenAd = localStorage.getItem('hasSeenFullScreenAd');
    if (hasSeenAd === 'true') {
      setIsVisible(false);
      if (onClose) onClose();
    }
  }, [onClose]);

  // If no ad is provided, get one from the fullScreen placement
  useEffect(() => {
    if (!providedAd) {
      // First look for fullScreen placement ads
      let fullScreenAds = getAdsByPlacement('fullScreen');
      
      // If no fullScreen ads, fall back to topOverlay
      if (fullScreenAds.length === 0) {
        fullScreenAds = getAdsByPlacement('topOverlay');
      }
      
      if (fullScreenAds.length > 0) {
        // Select a random ad from the available ads
        const randomAd = fullScreenAds[Math.floor(Math.random() * fullScreenAds.length)];
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
    }
  }, [ad, isVisible, recordView]);

  // Animation on mount
  useEffect(() => {
    if (ad && isVisible) {
      // Animate in
      const animateTimer = setTimeout(() => {
        setIsAnimated(true);
      }, 100);
      
      return () => {
        clearTimeout(animateTimer);
      };
    }
  }, [ad, isVisible]);

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

  if (!ad || !isVisible) return null;

  return (
    <div 
      data-testid="fullscreen-ad"
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm transform transition-all duration-700 ease-in-out overflow-hidden"
      style={{
        opacity: isAnimated ? 1 : 0,
        transform: isAnimated ? 'scale(1)' : 'scale(0.98)'
      }}
    >
      <div className="relative h-full w-full flex items-center justify-center overflow-y-auto">
        {/* Responsive layout - stack on mobile, side-by-side on desktop */}
        <div className="w-full h-full max-w-7xl mx-auto flex flex-col md:flex-row items-center">
          {/* Media column - height adjusted for mobile */}
          <div className="relative w-full md:w-3/5 h-1/2 md:h-full overflow-hidden">
            {ad.contentType === 'image' ? (
              <img 
                src={ad.mediaUrl} 
                alt=""
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="relative w-full h-full bg-black">
                <video 
                  src={ad.mediaUrl}
                  className="w-full h-full object-contain"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              </div>
            )}
          </div>
          
          {/* Content column - better padding for mobile */}
          <div className="relative z-10 w-full md:w-2/5 p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-center">
            <div className="max-w-lg mx-auto md:mx-0">
              <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-md mb-4 sm:mb-6 inline-block">
                Sponsored
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 tracking-tight leading-tight">
                {ad.title}
              </h2>
              
              {ad.description && (
                <p className="text-base sm:text-lg text-gray-200 mb-6 sm:mb-8 leading-relaxed">
                  {ad.description}
                </p>
              )}
              
              {ad.ctaUrl && (
                <button 
                  onClick={handleClick}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg flex items-center justify-center sm:justify-start space-x-2"
                >
                  <span>Learn More</span>
                  <svg className="w-5 h-5 ml-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Close button - adjusted for mobile */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white hover:bg-gray-100 text-gray-900 rounded-full p-1.5 sm:p-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 z-50"
          aria-label="Close advertisement"
        >
          <XMarkIcon className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>
      </div>
    </div>
  );
};

export default TopFullScreenAd; 