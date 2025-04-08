import { DashboardStatsData } from '../types';
import {
  UsersIcon,
  ChartBarIcon,
  UserPlusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link

interface Props {
  stats: DashboardStatsData;
}

export default function DashboardStats({ stats }: Props) {
  const cards = [
    {
      name: 'Total Members',
      value: stats.totalMembers.count,
      change: stats.totalMembers.growth,
      icon: UsersIcon,
      iconBackground: 'bg-blue-500',
      link: '/members', // Add link to Total Members card
    },
    {
      name: 'Active Today',
      value: stats.activeToday.count,
      change: stats.activeToday.growth,
      icon: ChartBarIcon,
      iconBackground: 'bg-green-500',
      link: '/attendance', // Add link to Active Today card
    },
    {
      name: 'New Joins',
      value: stats.newJoins.count,
      change: stats.newJoins.growth,
      icon: UserPlusIcon,
      iconBackground: 'bg-purple-500',
      link: '', // Add link to New Joins card
    },
    {
      name: 'Expiring Soon',
      value: stats.expiringSoon.count,
      change: stats.expiringSoon.growth,
      icon: ClockIcon,
      iconBackground: 'bg-orange-500',
      link: '', // Add link to Expiring Soon card
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Link to={card.link} key={card.name} className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-3 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <card.icon
                  className={clsx(
                    card.iconBackground,
                    'h-8 w-8 sm:h-12 sm:w-12 rounded-md p-1.5 sm:p-2 text-white'
                  )}
                />
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    {card.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-lg sm:text-2xl font-semibold text-gray-900">
                      {card.value}
                    </div>
                    <div
                      className={clsx(
                        'ml-2 flex items-baseline text-xs sm:text-sm font-semibold',
                        card.change >= 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {card.change >= 0 ? '+' : ''}
                      {card.change}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
