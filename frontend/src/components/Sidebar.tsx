import { Link, useLocation } from "react-router-dom";
import {
  UsersIcon,
  ClockIcon,
  CreditCardIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon,
  UserIcon,
  ShoppingBagIcon,
  TruckIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import SidebarAd from "./ads/SidebarAd";
import { useAds } from "../context/AdContext";
import { jwtDecode } from "jwt-decode";

// Create regular navigation items without the Ads entry
export const regularNavigation = [
  { name: "Members", href: "/members", icon: UsersIcon },
  { name: "Attendance", href: "/attendance", icon: ClockIcon },
  { name: "Payments", href: "/payments", icon: CreditCardIcon },
  { name: "Shop", href: "/shop", icon: ShoppingBagIcon },
  { name: "Orders", href: "/orders", icon: TruckIcon },
  { name: "Notifications", href: "/notifications", icon: BellIcon },
  { name: "Profile", href: "/profile", icon: UserIcon },
];

// The Ads navigation item
const adsNavItem = { name: "Ads", href: "/ads", icon: MegaphoneIcon };

export default function Sidebar() {
  const location = useLocation();
  const { ads, loading } = useAds();
  const [isOwner, setIsOwner] = useState(false);
  const [navigation, setNavigation] = useState(regularNavigation);

  // Check if the current user is the owner
  useEffect(() => {
    const checkIfOwner = () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const decoded = jwtDecode(token);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Check if user's email matches OWNER_EMAIL or role is 'owner'
        if (user.role === 'owner' || user.email === import.meta.env.VITE_OWNER_EMAIL) {
          setIsOwner(true);
          // Add the Ads item to navigation if the user is the owner
          setNavigation([...regularNavigation, adsNavItem]);
        }
      } catch (error) {
        console.error('Error checking owner status:', error);
      }
    };
    
    checkIfOwner();
  }, []);

  return (
    <div className="hidden lg:flex h-full w-64 flex-col bg-gray-900">
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== '/' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white",
                "group flex items-center rounded-md px-2 py-2 text-sm font-medium"
              )}
            >
              <item.icon
                className={clsx(
                  isActive
                    ? "text-white"
                    : "text-gray-400 group-hover:text-white",
                  "mr-3 h-6 w-6 flex-shrink-0"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* SidebarAd at the bottom */}
      <div className="mt-auto p-3">
        {!loading && ads.length > 0 && (
          <SidebarAd ad={ads[0]} />
        )}
      </div>
    </div>
  );
}
