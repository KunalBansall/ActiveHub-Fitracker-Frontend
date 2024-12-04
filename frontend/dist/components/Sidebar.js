import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { UsersIcon, ClockIcon, CreditCardIcon, ChartBarIcon, BellIcon, Cog6ToothIcon, } from '@heroicons/react/24/outline';
import clsx from 'clsx';
export const navigation = [
    { name: 'Members', href: '/members', icon: UsersIcon },
    { name: 'Attendance', href: '/attendance', icon: ClockIcon },
    { name: 'Payments', href: '/payments', icon: CreditCardIcon },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon },
    { name: 'Notifications', href: '/notifications', icon: BellIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];
export default function Sidebar() {
    const location = useLocation();
    return (_jsx("div", { className: "hidden lg:flex h-full w-64 flex-col bg-gray-900", children: _jsx("nav", { className: "flex-1 space-y-1 px-2 py-4", children: navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (_jsxs(Link, { to: item.href, className: clsx(isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white', 'group flex items-center rounded-md px-2 py-2 text-sm font-medium'), children: [_jsx(item.icon, { className: clsx(isActive ? 'text-white' : 'text-gray-400 group-hover:text-white', 'mr-3 h-6 w-6 flex-shrink-0'), "aria-hidden": "true" }), item.name] }, item.name));
            }) }) }));
}
