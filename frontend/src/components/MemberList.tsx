import { Member } from "../types";
import { format } from "date-fns";
import clsx from "clsx";
import { Link } from "react-router-dom";
import React, { useState } from "react";

interface Props {
  members: Member[];
}

export default function MemberList({ members }: Props) {
  // State for toggling between expiry date and created at
  const [sortBy, setSortBy] = useState<'expiryDate' | 'createdAt'>('expiryDate'); // Default to 'expiryDate'
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Ascending order by default

  // Sort members based on the selected filter and order
 // Sort members based on the selected filter and order
// Sort members based on the selected filter and order
// Sort members based on the selected filter and order
const sortedMembers = [...members].sort((a, b) => {
  let valueA: number = 0;
  let valueB: number = 0;

  // Ensure we check the sort criteria (expiryDate or createdAt)
  if (sortBy === 'expiryDate') {
    valueA = a.membershipEndDate ? new Date(a.membershipEndDate).getTime() : 0;
    valueB = b.membershipEndDate ? new Date(b.membershipEndDate).getTime() : 0;
  } else if (sortBy === 'createdAt') {
    // Ensure 'createdAt' is parsed correctly
    valueA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    valueB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  }

  // Sorting based on order (desc for most recent join date at the top)
  if (sortOrder === 'asc') {
    return valueA - valueB; // Ascending order
  } else {
    return valueB - valueA; // Descending order (recent created at the top)
  }
});




  // Toggle sorting method between Expiry Date and Created At
  const toggleSortBy = () => {
    setSortBy((prevSortBy) => (prevSortBy === 'expiryDate' ? 'createdAt' : 'expiryDate'));
  };
  

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="mb-4 flex justify-between">
          <button
  onClick={toggleSortBy}
  className="bg-blue-500 text-white px-4 py-2 rounded-md"
>
  Sort by {sortBy === 'expiryDate' ? 'Join Date' : 'Expiry Date'}
</button>

          </div>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedMembers.map((member) => {
                const expiryDate = new Date(member.membershipEndDate);
                const isExpiringSoon =
                  expiryDate <= new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

                return (
                  <tr
                    key={member._id}
                    className="hover:bg-gray-100 cursor-pointer"
                  >
                    <td className="whitespace-nowrap py-4 pl-4 pr-3">
                      <Link to={`/members/${member._id}`} className="flex items-center">
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
                          <div className="text-gray-500">
                            {member.phoneNumber}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <span
                        className={clsx(
                          "inline-flex rounded-full px-2 text-xs font-semibold leading-5",
                          {
                            "bg-green-100 text-green-800": member.status === "active",
                            "bg-red-100 text-red-800": member.status === "expired",
                            "bg-yellow-100 text-yellow-800": member.status === "pending",
                          }
                        )}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {member.membershipType}
                    </td>
                    <td
                      className={clsx(
                        "whitespace-nowrap px-3 py-4 text-sm",
                        isExpiringSoon
                          ? "text-red-600 font-medium"
                          : "text-gray-500"
                      )}
                    >
                      {format(expiryDate, "MM/dd/yyyy")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {member.lastCheckIn
                        ? format(new Date(member.lastCheckIn), "MM/dd/yyyy hh:mm a")
                        : "No Check-In"}
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
