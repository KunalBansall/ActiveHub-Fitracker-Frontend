import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { UsersIcon, ChartBarIcon, UserPlusIcon, ClockIcon, } from '@heroicons/react/24/outline';
import clsx from 'clsx';
export default function DashboardStats({ stats }) {
    const cards = [
        {
            name: 'Total Members',
            value: stats.totalMembers.count,
            change: stats.totalMembers.growth,
            icon: UsersIcon,
            iconBackground: 'bg-blue-500',
        },
        {
            name: 'Active Today',
            value: stats.activeToday.count,
            change: stats.activeToday.growth,
            icon: ChartBarIcon,
            iconBackground: 'bg-green-500',
        },
        {
            name: 'New Joins',
            value: stats.newJoins.count,
            change: stats.newJoins.growth,
            icon: UserPlusIcon,
            iconBackground: 'bg-purple-500',
        },
        {
            name: 'Expiring Soon',
            value: stats.expiringSoon.count,
            change: stats.expiringSoon.growth,
            icon: ClockIcon,
            iconBackground: 'bg-orange-500',
        },
    ];
    return (_jsx("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4", children: cards.map((card) => (_jsx("div", { className: "overflow-hidden rounded-lg bg-white shadow", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(card.icon, { className: clsx(card.iconBackground, 'h-12 w-12 rounded-md p-2 text-white') }) }), _jsx("div", { className: "ml-5 w-0 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: card.name }), _jsxs("dd", { className: "flex items-baseline", children: [_jsx("div", { className: "text-2xl font-semibold text-gray-900", children: card.value }), _jsxs("div", { className: clsx('ml-2 flex items-baseline text-sm font-semibold', card.change >= 0 ? 'text-green-600' : 'text-red-600'), children: [card.change >= 0 ? '+' : '', card.change, "%"] })] })] }) })] }) }) }, card.name))) }));
}
