import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ad, useAds } from '../../context/AdContext';

interface AuthPageAdProps {
  ad?: Ad;
}

const AuthPageAd: React.FC<AuthPageAdProps> = ({ ad: providedAd }) => {
  const { getAdsByPlacement, recordView, recordClick } = useAds();
  const [ad, setAd] = useState<Ad | undefined>(providedAd);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  
  // If no ad is provided, get one from the authPage placement
  useEffect(() => {
    if (!providedAd) {
      const authPageAds = getAdsByPlacement('authPage');
      if (authPageAds.length > 0) {
        // Select a random ad from the authPage placement
        const randomAd = authPageAds[Math.floor(Math.random() * authPageAds.length)];
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
    <div className="relative mb-8">
      <div className="absolute -top-3 left-4 z-10 bg-blue-600 text-white text-xs font-medium py-1 px-2.5 rounded-full shadow-md">
        Sponsored
      </div>
      <div 
        className="w-full overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 relative"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        aria-label={`Advertisement: ${ad.title}`}
      >
        <div className="relative">
          <div className="w-full h-52 md:h-64 overflow-hidden">
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
            
            {/* Overlay gradient for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/5 opacity-60"></div>
            
            {/* Ad content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 transform transition-transform duration-500"
                 style={{ transform: isHovered ? 'translateY(-4px)' : 'translateY(0)' }}>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between">
                <div className="mb-3 md:mb-0 max-w-2xl">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2 drop-shadow-md">{ad.title}</h3>
                  {ad.description && (
                    <p className="text-sm md:text-base text-white/90 line-clamp-2 drop-shadow-sm">{ad.description}</p>
                  )}
                </div>
                
                {ad.ctaUrl && (
                  <div className="flex-shrink-0 transform transition-all duration-500"
                       style={{ transform: isHovered ? 'translateX(4px)' : 'translateX(0)' }}>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 shadow-md transform transition-all hover:scale-105 duration-300">
                      <span>Learn More</span>
                      <svg className="w-4 h-4 transform transition-transform duration-300"
                           style={{ transform: isHovered ? 'translateX(2px)' : 'translateX(0)' }}
                           fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Ad label */}
        <div className="absolute top-3 right-3 bg-black/30 text-white/90 text-xs font-medium px-2 py-1 rounded backdrop-blur-sm">
          Ad
        </div>
      </div>
    </div>
  );
};

export default AuthPageAd; 