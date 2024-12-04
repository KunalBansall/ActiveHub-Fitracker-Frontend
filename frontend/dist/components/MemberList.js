import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { format } from "date-fns";
import clsx from "clsx";
import { Link } from "react-router-dom";
export default function MemberList({ members }) {
    // Sort members by membershipEndDate (ascending)
    const sortedMembers = [...members].sort((a, b) => {
        const dateA = new Date(a.membershipEndDate);
        const dateB = new Date(b.membershipEndDate);
        return dateA.getTime() - dateB.getTime(); // Sort in ascending order
    });
    return (_jsx("div", { className: "mt-8 flow-root", children: _jsx("div", { className: "-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8", children: _jsx("div", { className: "inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-300", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900", children: "MEMBER" }), _jsx("th", { className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "STATUS" }), _jsx("th", { className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "MEMBERSHIP" }), _jsx("th", { className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "EXPIRY DATE" }), _jsx("th", { className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "LAST CHECK-IN" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: sortedMembers.map((member) => {
                                const expiryDate = new Date(member.membershipEndDate);
                                const isExpiringSoon = expiryDate <= new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
                                return (_jsx("tr", { className: "hover:bg-gray-100 cursor-pointer", children: _jsxs(Link, { to: `/members/${member._id}`, className: "contents", children: [_jsx("td", { className: "whitespace-nowrap py-4 pl-4 pr-3", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "h-10 w-10 flex-shrink-0", children: member.photo ? (_jsx("img", { className: "h-10 w-10 rounded-full", src: member.photo, alt: "" })) : (_jsx("div", { className: "h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center", children: _jsx("span", { className: "text-gray-500 font-medium", children: member.name.charAt(0) }) })) }), _jsxs("div", { className: "ml-4", children: [_jsx("div", { className: "font-medium text-gray-900", children: member.name }), _jsx("div", { className: "text-gray-500", children: member.phoneNumber })] })] }) }), _jsx("td", { className: "whitespace-nowrap px-3 py-4", children: _jsx("span", { className: clsx("inline-flex rounded-full px-2 text-xs font-semibold leading-5", {
                                                        "bg-green-100 text-green-800": member.status === "active",
                                                        "bg-red-100 text-red-800": member.status === "expired",
                                                        "bg-yellow-100 text-yellow-800": member.status === "pending",
                                                    }), children: member.status }) }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: member.membershipType }), _jsx("td", { className: clsx("whitespace-nowrap px-3 py-4 text-sm", isExpiringSoon
                                                    ? "text-red-600 font-medium"
                                                    : "text-gray-500"), children: format(expiryDate, "MM/dd/yyyy") }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: member.lastCheckIn
                                                    ? format(new Date(member.lastCheckIn), "MM/dd/yyyy hh:mm a")
                                                    : "No Check-In" })] }) }, member._id));
                            }) })] }) }) }) }));
}
