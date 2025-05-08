import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AdminTourProps {
  shouldRun: boolean;
  adminId: string;
  onComplete?: () => void;
}

const AdminTour: React.FC<AdminTourProps> = ({ shouldRun, adminId, onComplete }) => {
  const [run, setRun] = useState(shouldRun);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    // Define the tour steps
    const tourSteps: Step[] = [
      {
        target: '[data-tour="sidebar"]',
        content: 'This is your navigation menu. Use it to access all areas of your gym management system.',
        disableBeacon: true,
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
    const { status, type } = data;
    
    // Log tour interactions for analytics (optional)
    console.log('Tour step:', type, data);

    // Handle tour completion or skipping
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      markTourCompleted();
      
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
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
    },
    buttonBack: {
      color: '#4f46e5',
      fontSize: '14px',
      marginRight: '8px',
    },
    buttonSkip: {
      color: '#6b7280', // Gray-500
      fontSize: '14px',
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
