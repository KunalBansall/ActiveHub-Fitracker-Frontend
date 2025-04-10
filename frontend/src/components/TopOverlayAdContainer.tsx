import React from 'react';
import { useAds } from '../context/AdContext';
import TopOverlayAd from './ads/TopOverlayAd';

const TopOverlayAdContainer: React.FC = () => {
  const { ads, loading } = useAds();
  
  // Return null if loading or no ads available
  if (loading || !ads || ads.length === 0) {
    return null;
  }
  
  // Use the last ad for the overlay (if there are multiple ads)
  // This way we can use the first ones for other placements
  const adToShow = ads[ads.length - 1];
  
  return <TopOverlayAd ad={adToShow} />;
};

export default TopOverlayAdContainer; 