import React, { createContext, useContext, useState, useEffect } from 'react';

interface SubscriptionContextProps {
  subscriptionStatus: string;
  trialEndDate: string | null;
  graceEndDate: string | null;
  subscriptionEndDate: string | null;
  updateSubscriptionInfo: (data: any) => void;
}

const defaultState: SubscriptionContextProps = {
  subscriptionStatus: '',
  trialEndDate: null,
  graceEndDate: null,
  subscriptionEndDate: null,
  updateSubscriptionInfo: () => {},
};

const SubscriptionContext = createContext<SubscriptionContextProps>(defaultState);

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [subscriptionData, setSubscriptionData] = useState({
    subscriptionStatus: '',
    trialEndDate: null,
    graceEndDate: null,
    subscriptionEndDate: null,
  });

  useEffect(() => {
    // Load subscription data from localStorage on component mount
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (user && user.subscriptionStatus) {
        setSubscriptionData({
          subscriptionStatus: user.subscriptionStatus || '',
          trialEndDate: user.trialEndDate || null,
          graceEndDate: user.graceEndDate || null,
          subscriptionEndDate: user.subscriptionEndDate || null,
        });
      }
    } catch (error) {
      console.error('Error loading subscription data from localStorage', error);
    }
  }, []);

  const updateSubscriptionInfo = (userData: any) => {
    const newData = {
      subscriptionStatus: userData.subscriptionStatus || '',
      trialEndDate: userData.trialEndDate || null,
      graceEndDate: userData.graceEndDate || null,
      subscriptionEndDate: userData.subscriptionEndDate || null,
    };
    
    setSubscriptionData(newData);
    
    // Also update localStorage
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { 
        ...user, 
        subscriptionStatus: newData.subscriptionStatus,
        trialEndDate: newData.trialEndDate,
        graceEndDate: newData.graceEndDate,
        subscriptionEndDate: newData.subscriptionEndDate
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating subscription data in localStorage', error);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        ...subscriptionData,
        updateSubscriptionInfo,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext; 