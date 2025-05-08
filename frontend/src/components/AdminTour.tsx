import React, { useState, useEffect, ReactNode } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import axios from 'axios';
import { motion } from 'framer-motion';

// Custom Welcome Component
const WelcomeTooltip = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl shadow-2xl p-6 max-w-xl bg-white/90 backdrop-blur border border-gray-200"
      style={{ fontFamily: 'Inter, sans-serif', color: '#1f2937' }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 flex items-center justify-center text-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white rounded-xl shadow-md">
          🏋️‍♂️
        </div>
        <h2 className="text-xl font-semibold text-indigo-600">
          Welcome to ActiveHub FitTracker!
        </h2>
      </div>

      <p className="text-gray-600 mb-4 leading-relaxed">
        Let's take a quick tour of your powerful dashboard.
      </p>

      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { icon: '📊', text: 'Track Stats' },
          { icon: '💰', text: 'View Revenue' },
          { icon: '📱', text: 'Manage Anywhere' },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-10 h-10 flex items-center justify-center text-xl bg-gray-100 rounded-lg">
              {item.icon}
            </div>
            <p className="text-sm text-center text-gray-500 font-medium mt-2">{item.text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AdminTourProps {
  shouldRun: boolean;
  adminId: string;
  onComplete?: () => void;
}

const AdminTour: React.FC<AdminTourProps> = ({ shouldRun, adminId, onComplete }) => {
  const [run, setRun] = useState(false); // Start with tour not running
  const [steps, setSteps] = useState<Step[]>([]);
  const [adsChecked, setAdsChecked] = useState(false);

  // Check for ads and set up event listeners for ad dismissal
  useEffect(() => {
    if (!shouldRun) return;
    
    // First check if tour has been completed (either in DB or localStorage)
    const tourCompletedLocally = localStorage.getItem('adminTourCompleted') === 'true';
    if (tourCompletedLocally) {
      // Don't start the tour if it's been completed
      setRun(false);
      return;
    }
    
    // Function to check if we can start the tour
    const checkAndStartTour = () => {
      // Check if fullscreen ad is visible (by DOM presence)
      const fullScreenAdElement = document.querySelector('[data-testid="fullscreen-ad"]');
      const topOverlayAdElement = document.querySelector('[data-testid="overlay-ad"]');
      
      // If no ads are visible, we can start the tour
      if (!fullScreenAdElement && !topOverlayAdElement) {
        // Delay slightly to ensure UI is settled
        setTimeout(() => {
          // Double-check that tour hasn't been completed during the timeout
          const stillNotCompleted = localStorage.getItem('adminTourCompleted') !== 'true';
          if (stillNotCompleted) {
            setRun(true);
            setAdsChecked(true);
          }
        }, 1000); // Increased delay to ensure ads are fully processed
      }
    };
    
    // Set up a MutationObserver to watch for ad removal from DOM
    const observer = new MutationObserver((mutations) => {
      // Check if any mutations involve removing an ad
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          // Check if we can start the tour after DOM changes
          checkAndStartTour();
        }
      }
    });
    
    // Don't start observing immediately - give ads time to appear first
    setTimeout(() => {
      // Start observing the document body for ad-related changes
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Initial check in case ads are already gone
      checkAndStartTour();
    }, 1500); // Wait 1.5 seconds before starting to observe
    
    // Clean up the observer when component unmounts
    return () => observer.disconnect();
  }, [shouldRun]);

  useEffect(() => {
    // Define the tour steps
    const tourSteps: Step[] = [
      {
        target: 'body',
        content: <WelcomeTooltip />,
        placement: 'center',
        disableBeacon: true,
        styles: {
          options: {
            zIndex: 10000,
          },
          tooltip: {
            padding: 0,
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }
        }
      },
      {
        target: '[data-tour="sidebar"]',
        content: 'This is your navigation menu. Use it to access all areas of your gym management system.',
        placement: 'right',
      },
      {
        target: '[data-tour="dashboard-stats"]',
        content: 'Here you can see key metrics about your gym at a glance, including total members, active members today, new joins, and memberships expiring soon.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="revenue-overview"]',
        content: 'Track your gym\'s revenue performance, including membership fees and shop sales.',
        placement: 'top',
      },
    
      {
        target: '[data-tour="add-member"]',
        content: 'Click here to add new members to your gym.',
        placement: 'left',
      },
    ];

    setSteps(tourSteps);
  }, []);

  // Handle tour callbacks
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, action } = data;
    
    // Log tour interactions for analytics (optional)
    console.log('Tour step:', type, data);

    // Handle tour completion, skipping, or closing
    if (
      status === STATUS.FINISHED || 
      status === STATUS.SKIPPED ||
      action === 'close'
    ) {
      // Immediately stop the tour
      setRun(false);
      
      // Mark tour as completed in the database
      markTourCompleted();
      
      // We don't need to update shouldRunTour since this component will unmount
      
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
      
      // Store completion in localStorage as a fallback
      localStorage.setItem('adminTourCompleted', 'true');
    }
  };

  // Mark the tour as completed in the database
  const markTourCompleted = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/admin/tour-completed`,
        { adminId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Tour marked as completed');
    } catch (error) {
      console.error('Failed to mark tour as completed:', error);
    }
  };

  // Custom styles for the tour
  const tourStyles = {
    options: {
      zIndex: 10000,
      primaryColor: '#4f46e5', // Indigo color for primary buttons
      textColor: '#1f2937', // Gray-800 for text
    },
    tooltipContainer: {
      textAlign: 'left' as const,
    },
    buttonNext: {
      backgroundColor: '#4f46e5',
      color: '#ffffff',
      fontSize: '14px',
      padding: '8px 16px',
      borderRadius: '0.375rem',
      marginBottom: '10px',
      marginRight: '10px',
    },
    buttonBack: {
      color: '#4f46e5',
      fontSize: '14px',
      marginRight: '8px',
      marginBottom: '10px',

    },
    buttonSkip: {
      color: '#6b7280', // Gray-500
      fontSize: '14px',
      padding: '8px 16px',
      marginBottom: '10px',
    },
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={tourStyles}
      disableScrolling={false}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Done',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default AdminTour;
