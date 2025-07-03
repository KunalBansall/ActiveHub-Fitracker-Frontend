import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  ClockIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  TruckIcon,
  UserIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import React from "react";
import SidebarAd from "./ads/SidebarAd";
import { useAds } from "../context/AdContext";

// Admin navigation items
export const navigation = [
  // { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Members", href: "/members", icon: UsersIcon },
  { name: "Attendance", href: "/attendance", icon: ClockIcon },
  { name: "Revenue", href: "/revenue", icon: BanknotesIcon },
  { name: "Shop", href: "/shop", icon: ShoppingBagIcon },
  { name: "Orders", href: "/orders", icon: TruckIcon },
  { name: "Trainers", href: "/admin/trainers", icon: UserGroupIcon },
  // { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  { name: "Profile", href: "/profile", icon: UserIcon },
];

const Sidebar = () => {
  const location = useLocation();
  const { ads, loading } = useAds();

  return (
    <div className="hidden lg:flex h-full w-64 flex-col bg-gray-800">
      
      
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
                         (item.href !== '/' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white",
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200"
              )}
            >
              <item.icon
                className={clsx(
                  isActive ? "text-blue-400" : "text-gray-400 group-hover:text-gray-300",
                  "mr-3 flex-shrink-0 h-5 w-5"
                )}
                aria-hidden="true"
              />
              {item.name}
              {isActive && (
                <span className="ml-auto inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* SidebarAd at the bottom */}
      <div className="p-3 border-t border-gray-700">
        {!loading && ads.length > 0 ? (
          <SidebarAd ad={ads[0]} />
        ) : (
          <div className="text-center text-xs text-gray-400 mt-2">
            No active ads
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
