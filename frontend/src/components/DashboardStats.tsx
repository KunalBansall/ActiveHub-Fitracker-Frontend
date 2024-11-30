import { DashboardStatsData } from '../types';
import {
  UsersIcon,
  ChartBarIcon,
  UserPlusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import React from 'react';


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

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.name}
          className="overflow-hidden rounded-lg bg-white shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <card.icon
                  className={clsx(
                    card.iconBackground,
                    'h-12 w-12 rounded-md p-2 text-white'
                  )}
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {card.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {card.value}
                    </div>
                    <div
                      className={clsx(
                        'ml-2 flex items-baseline text-sm font-semibold',
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
        </div>
      ))}
    </div>
  );
}