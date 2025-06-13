import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';


import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

// Define the API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Define Ad type
export type Ad = {
  _id: string;
  title: string;
  description?: string;
  contentType: 'image' | 'video';
  mediaUrl: string;
  ctaUrl?: string;
  targetAudience: 'admin' | 'member' | 'both';
  gyms: string[];
  active: boolean;
  placement?: 'sidebar' | 'authPage' | 'profile' | 'topOverlay' | 'fullScreen';
  createdAt: string;
  expiresAt: string;
};

// Context interface
interface AdContextType {
  ads: Ad[];
  loading: boolean;
  error: string | null;
  refreshAds: () => Promise<void>;
  recordView: (adId: string) => Promise<void>;
  recordClick: (adId: string, clickType?: 'cta' | 'learn_more' | 'image' | 'video' | 'close' | 'other') => Promise<void>;
  getAdsByPlacement: (placement: string) => Ad[];
}

// Create context
const AdContext = createContext<AdContextType | undefined>(undefined);

// Provider props
interface AdProviderProps {
  children: ReactNode;
  role: 'admin' | 'member';
}

export const AdProvider: React.FC<AdProviderProps> = ({ children, role }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchAds = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        if (role === 'admin') {
          navigate('/signin');
        } else {
          navigate('/memberlogin');
        }
        return;
      }

      const { data } = await axios.get(`${API_URL}/ads`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filter ads based on role
      const filteredAds = data.ads;
      setAds(filteredAds);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch ads');
      console.error('Error fetching ads:', err);
    } finally {
      setLoading(false);
    }
  };

  const recordView = async (adId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Ad view not recorded: No authentication token found');
        return;
      }
      
      if (!adId) {
        console.warn('Ad view not recorded: Invalid ad ID');
        return;
      }
      
      console.log(`Recording ad view - ID: ${adId}`);
      
      // Get device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        path: location.pathname
      };
      
      const response = await axios.post(`${API_URL}/ads/view/${adId}`, { deviceInfo }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Ad view successfully recorded:', response.data);
      return response.data;
    } catch (err: any) {
      console.error('Error recording ad view:', err);
      console.error('Error details:', err.response?.data || err.message);
    }
  };

  const recordClick = async (adId: string, clickType: 'cta' | 'learn_more' | 'image' | 'video' | 'close' | 'other' = 'cta') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Ad click not recorded: No authentication token found');
        return;
      }
      
      if (!adId) {
        console.warn('Ad click not recorded: Invalid ad ID');
        return;
      }
      
      console.log(`Recording ad click - ID: ${adId}, Type: ${clickType}`);
      
      // Get device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        path: location.pathname
      };
      
      const response = await axios.post(`${API_URL}/ads/click/${adId}`, { 
        clickType,
        deviceInfo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Ad click successfully recorded:', response.data);
      return response.data;
    } catch (err: any) {
      console.error(`Error recording ad click (${clickType}):`, err);
      console.error('Error details:', err.response?.data || err.message);
    }
  };

  // Fetch ads on mount
  useEffect(() => {
    fetchAds();
  }, [role, location.pathname]);

  // Add helper function to the provider
  const getAdsByPlacement = (placement: string): Ad[] => {
    return ads.filter(ad => ad.placement === placement);
  };

  return (
    <AdContext.Provider value={{ 
      ads, 
      loading, 
      error, 
      refreshAds: fetchAds,
      recordView,
      recordClick,
      getAdsByPlacement
    }}>
      {children}
    </AdContext.Provider>
  );
};

// Custom hook to use Ad context
export const useAds = () => {
  const context = useContext(AdContext);
  if (context === undefined) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
}; 