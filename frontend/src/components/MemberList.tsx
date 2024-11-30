import { Member } from '../types';
import { format } from 'date-fns';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import React from 'react';


interface Props {
  members: Member[];
}

export default function MemberList({ members }: Props) {
  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                  MEMBER
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  STATUS
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  MEMBERSHIP
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  EXPIRY DATE
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  LAST CHECK-IN
                </th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {members.map((member) => {
                const expiryDate = new Date(member.membershipEndDate);
                const isExpiringSoon = expiryDate <= new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
                
                return (
                  <tr key={member._id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {member.photo ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={member.photo}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 font-medium">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {member.name}
                          </div>
                          <div className="text-gray-500">{member.phoneNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <span
                        className={clsx(
                          'inline-flex rounded-full px-2 text-xs font-semibold leading-5',
                          {
                            'bg-green-100 text-green-800': member.status === 'active',
                            'bg-red-100 text-red-800': member.status === 'expired',
                            'bg-yellow-100 text-yellow-800':
                              member.status === 'pending',
                          }
                        )}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {member.membershipType}
                    </td>
                    <td className={clsx(
                      "whitespace-nowrap px-3 py-4 text-sm",
                      isExpiringSoon ? "text-red-600 font-medium" : "text-gray-500"
                    )}>
                      {format(expiryDate, 'MM/dd/yyyy')}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {/* This would come from attendance data */}
                      N/A
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <Link
                        to={`/members/${member._id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}