import React, { useState, useEffect } from 'react';
import { useAds } from '../context/AdContext';
import TopFullScreenAd from './ads/TopFullScreenAd';

interface TopFullScreenAdContainerProps {
  shouldShow?: boolean; // Optional prop to control when to show the ad
}

const TopFullScreenAdContainer: React.FC<TopFullScreenAdContainerProps> = ({ shouldShow = true }) => {
  const { getAdsByPlacement, loading } = useAds();
  const [showAd, setShowAd] = useState(false);
  
  // Check if user just logged in
  useEffect(() => {
    if (loading || !shouldShow) return;
    
    // Get login status from session storage
    const isJustLoggedIn = sessionStorage.getItem('justLoggedIn') === 'true';
    const hasSeenAd = localStorage.getItem('hasSeenFullScreenAd') === 'true';
    
    // Only show the ad if the user just logged in and hasn't seen it yet
    if (isJustLoggedIn && !hasSeenAd) {
      // Get ads specifically for fullScreen placement first
      let ads = getAdsByPlacement('fullScreen');
      
      // If no fullScreen ads, fall back to topOverlay ads
      if (!ads || ads.length === 0) {
        ads = getAdsByPlacement('topOverlay');
      }
      
      // Only show if there are ads available
      if (ads && ads.length > 0) {
        setShowAd(true);
        
        // Clear the "just logged in" flag to prevent showing ads on page refresh
        sessionStorage.removeItem('justLoggedIn');
      }
    }
  }, [loading, shouldShow, getAdsByPlacement]);
  
  // Handle closing the ad
  const handleClose = () => {
    setShowAd(false);
  };
  
  if (!showAd) return null;
  
  return <TopFullScreenAd onClose={handleClose} />;
};

export default TopFullScreenAdContainer; 