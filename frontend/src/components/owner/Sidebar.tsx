import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  ShoppingBagIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  ClockIcon,
  DocumentTextIcon,
  BellAlertIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Function to close sidebar and navigate
  const handleNavigation = (path: string) => {
    // Add a small delay to make the animation look better
    setTimeout(() => {
      // Dispatch event to close sidebar on mobile
      const event = new CustomEvent('closeSidebar');
      window.dispatchEvent(event);
      
      // Navigate to the path
      navigate(path);
    }, 50);
  };

  const navigationItems = [
    { name: 'Dashboard', icon: HomeIcon, path: '/owner-dashboard' },
    { name: 'Analytics', icon: ChartBarIcon, path: '/owner-dashboard/analytics' },
    { name: 'Gyms', icon: BuildingOfficeIcon, path: '/owner-dashboard/gyms' },
    { name: 'Subscriptions', icon: CreditCardIcon, path: '/owner-dashboard/subscriptions' },
    { name: 'Webhooks', icon: BellAlertIcon, path: '/owner-dashboard/webhooks' },
    { name: 'Products', icon: ShoppingBagIcon, path: '/owner-dashboard/products' },
    { name: 'Announcements', icon: MegaphoneIcon, path: '/owner-dashboard/announcements' },
    { name: 'Reports', icon: DocumentChartBarIcon, path: '/owner-dashboard/reports' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/owner-dashboard/settings' },
    { name: 'Activity Log', icon: ClockIcon, path: '/owner-dashboard/activity' },
    { name: 'Ads', icon: DocumentTextIcon, path: '/owner-dashboard/ads' }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col h-0 flex-1 bg-indigo-700">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <span className="text-white text-xl font-bold">ActiveHub Owner</span>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                className={`${
                  isActive(item.path)
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-100 hover:bg-indigo-600'
                } group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-left`}
                onClick={() => handleNavigation(item.path)}
              >
                <item.icon
                  className={`${
                    isActive(item.path) ? 'text-indigo-200' : 'text-indigo-300 group-hover:text-indigo-200'
                  } mr-3 flex-shrink-0 h-6 w-6`}
                  aria-hidden="true"
                />
                {item.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-indigo-800 p-4">
          <div className="flex items-center">
            <div>
              <div className="text-sm font-medium text-white">Owner Portal</div>
              <div className="text-xs text-indigo-200">v1.0.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
