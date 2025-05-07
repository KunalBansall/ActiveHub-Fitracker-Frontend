import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChartBarIcon,
  HomeIcon,
  CogIcon,
  BellIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface NavItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
}

const OwnerSidebar: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/owner-dashboard', icon: HomeIcon },
    { name: 'Analytics', href: '/owner-analytics', icon: ChartBarIcon },
    { name: 'Webhooks', href: '/owner-dashboard/webhook', icon: BellIcon },
    { name: 'Gyms', href: '/owner-dashboard/gyms', icon: UserGroupIcon },
    { name: 'Subscriptions', href: '/owner-dashboard/subscriptions', icon: CurrencyDollarIcon },
    { name: 'Products', href: '/owner-dashboard/products', icon: ShoppingBagIcon },
    { name: 'Ads', href: '/owner-dashboard/ads', icon: DocumentTextIcon },
    { name: 'Reports', href: '/owner-dashboard/reports', icon: DocumentTextIcon },
    { name: 'Settings', href: '/owner-dashboard/settings', icon: CogIcon },
  ];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={clsx(
      'bg-indigo-900 text-white transition-all duration-300 ease-in-out h-screen flex flex-col',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex items-center justify-between p-4 border-b border-indigo-800">
        {!collapsed && (
          <h1 className="text-xl font-bold text-white">Owner Portal</h1>
        )}
        <button
          onClick={toggleSidebar}
          className={clsx(
            'p-1 rounded-md text-indigo-200 hover:text-white focus:outline-none',
            collapsed && 'mx-auto'
          )}
        >
          <ArrowLeftOnRectangleIcon className={clsx(
            'h-6 w-6 transform transition-transform duration-300',
            collapsed && 'rotate-180'
          )} />
        </button>
      </div>

      <nav className="flex-1 pt-5 pb-4 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                to={item.href}
                className={clsx(
                  'flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200',
                  location.pathname === item.href
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-100 hover:bg-indigo-800 hover:text-white',
                  collapsed && 'justify-center'
                )}
              >
                <item.icon className={clsx(
                  'flex-shrink-0 h-6 w-6',
                  location.pathname === item.href ? 'text-white' : 'text-indigo-300'
                )} />
                {!collapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-indigo-800">
        <div className="flex items-center">
          <div className={clsx(
            'flex-shrink-0 bg-indigo-700 rounded-full p-1',
            collapsed ? 'mx-auto' : ''
          )}>
            <CogIcon className="h-5 w-5 text-indigo-200" />
          </div>
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Owner Mode</p>
              <p className="text-xs text-indigo-300">v1.0</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerSidebar;
