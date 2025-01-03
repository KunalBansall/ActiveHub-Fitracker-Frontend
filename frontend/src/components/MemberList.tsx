import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { Member } from "../types";
import { BellIcon, ArrowsUpDownIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import StatusBadge,{HollowStatusBadge} from "./StatusBadge";

interface Props {
  members: Member[];
}

const MemberList: React.FC<Props> = ({ members }) => {
  const [sortBy, setSortBy] = useState<"expiryDate" | "createdAt">("expiryDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isNotifying, setIsNotifying] = useState<string | null>(null);

  interface filtersInitType{
    filterOptions:string[],
    selectedFilters:string[]
  }
  const filtersInit : filtersInitType={"filterOptions":["expired","expires soon"],"selectedFilters":[]};
  
  const [filters,setFilters]=useState(filtersInit);
 
  const addFilter = (e:React.MouseEvent<HTMLElement>)=>{
    const value=e.currentTarget.dataset.value;
 
    setFilters((prev:any)=>(
        {   ...prev,
            filterOptions:prev.filterOptions.filter((f:string)=>f!=value),
            selectedFilters:[...prev.selectedFilters,value]
        }
        ))
  }
  const removeFilter = (e:React.MouseEvent<HTMLButtonElement>)=>{
        const value = e.currentTarget.dataset.value;
 
        setFilters((prev:any)=>({
                selectedFilters:prev.selectedFilters.filter((f:string)=>f!=value),
                filterOptions:[...prev.filterOptions,value]
        }))
  }

  // Memoized sorted members
  const sortedMembers = useMemo(() => {
    const sortedMembers = [...members].sort((a, b) => {
      let valueA =
        sortBy === "expiryDate"
          ? new Date(a.membershipEndDate).getTime()
          : new Date(a.createdAt).getTime();
      let valueB =
        sortBy === "expiryDate"
          ? new Date(b.membershipEndDate).getTime()
          : new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    });

    if(filters?.selectedFilters.length > 0 ){
        
        return sortedMembers.filter((m)=>{
            const FiltersAsSet =new Set(filters.selectedFilters);
            const daysToExpiry=Math.round((Number(new Date(m.membershipEndDate)) - Number(new Date(Date.now()))) / (24 * 60 * 60 * 1000));

            if(FiltersAsSet.has("expired") && ( daysToExpiry <= 0)){
                return true;
            }
            
            if(FiltersAsSet.has("expires soon") && ( daysToExpiry>=1 && daysToExpiry <= 5  )){
                return true;
            }
            
            return false;
        
        })
    }
    return sortedMembers;
  
}, [members, sortBy, sortOrder,filters.selectedFilters]);

  const toggleSort = () => {
    if (sortBy === "expiryDate") {
      setSortBy("createdAt");
      setSortOrder("desc");
    } else {
      setSortBy("expiryDate");
      setSortOrder("asc");
    }
  };

  // Notification logic with local storage tracking to prevent redundant calls
  const sendNotification = async (member: Member) => {
    const lastNotified = localStorage.getItem(`notified_${member._id}`);
    if (lastNotified && Date.now() - Number(lastNotified) < 3600000) {
      // 1 hour
      toast.error("Notification already sent recently.");
      return;
    }

    setIsNotifying(member._id);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await axios.post(
        `${API_URL}/members/renewal-reminder`,
        { memberId: member._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      localStorage.setItem(`notified_${member._id}`, String(Date.now()));
      toast.success(response.data.message || `Notification sent to ${member.name}`);
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error(`Failed to send notification to ${member.name}`);
    } finally {
      setIsNotifying(null);
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <button
          onClick={toggleSort}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center gap-2"
        >
          Sort by {sortBy === "expiryDate" ? "Join Date" : "Expiry Date"}
          <ArrowsUpDownIcon className="h-4 w-4" />
        </button>
        {filters?.selectedFilters && filters.selectedFilters.map((s)=><StatusBadge Text={s} isRemovable={true} removeFilter={removeFilter}/>)}
        
       {filters.filterOptions.map((f)=><HollowStatusBadge Text={f} isRemovable={true} Handler={addFilter}/>)}

      </div>
      <div className="rounded-md border overflow-hidden overflow-x-visible">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left font-medium p-4 w-[250px]">Member</th>
              <th className="text-left font-medium p-4">Status</th>
              <th className="text-left font-medium p-4">Membership</th>
              <th className="text-left font-medium p-4">Expiry Date</th>
              <th className="text-left font-medium p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedMembers.map((member) => {
              const expiryDate = new Date(member.membershipEndDate);
              const isExpired = expiryDate < new Date();
              const isExpiringSoon = expiryDate <= new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
              const membershipStatus = isExpired ? "expired" : "active";

              return (
                <tr
                  key={member._id}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-4">
                    <Link
                      to={`/members/${member._id}`}
                      className="flex items-center space-x-4 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {member.photo ? (
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500 font-medium">
                            {member.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold group-hover:text-blue-600 transition-colors">
                          {member.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.phoneNumber}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="p-4">
                    <StatusBadge Text={membershipStatus}/>
                  </td>
                  <td className="p-4">{member.slot}</td>
                  <td className="p-4">
                    <div className="flex items-center">
                      <span
                        className={
                          isExpiringSoon ? "text-red-600 font-medium" : ""
                        }
                      >
                        {format(expiryDate, "MMM dd, yyyy")}
                      </span>
                      {isExpiringSoon && (
                        <BellIcon className="h-4 w-4 text-red-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => sendNotification(member)}
                      disabled={isNotifying === member._id}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        isNotifying === member._id
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      }`}
                    >
                      {isNotifying === member._id ? "Notifying..." : "Notify"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(MemberList);
