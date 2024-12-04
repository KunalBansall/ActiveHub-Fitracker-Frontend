import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlassIcon, Bars3Icon, ArrowRightOnRectangleIcon, } from "@heroicons/react/24/outline";
import { useQuery } from "react-query";
import axios from "axios";
import MobileMenu from "./MobileMenu";
import { Link } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const { data: searchResults } = useQuery(["memberSearch", searchQuery], async () => {
        if (!searchQuery)
            return [];
        const response = await axios.get(`${API_URL}/members/search?query=${searchQuery}`);
        return response.data;
    }, {
        enabled: searchQuery.length > 2,
    });
    const handleSignOut = () => {
        setIsModalOpen(true); // Open the confirmation modal
    };
    const confirmSignOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/signin");
        setIsModalOpen(false); // Close the modal after confirming
    };
    const cancelSignOut = () => {
        setIsModalOpen(false); // Just close the modal if the user cancels
    };
    return (_jsxs("header", { className: "bg-white shadow", children: [_jsx("div", { className: "mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex h-16 justify-between items-center", children: [_jsx("button", { type: "button", className: "lg:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500", onClick: () => setIsMobileMenuOpen(true), children: _jsx(Bars3Icon, { className: "h-6 w-6" }) }), _jsx("div", { className: "flex-shrink-0", children: _jsx(Link, { to: "/", className: "text-xl font-bold text-blue-400", children: user.gymName || "ActiveHub" }) }), _jsx("div", { className: "flex-1 max-w-lg mx-4", children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx(MagnifyingGlassIcon, { className: "h-5 w-5 text-gray-400" }) }), _jsx("input", { type: "search", placeholder: "Search members...", className: "block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) }), searchResults && searchResults.length > 0 && (_jsx("div", { className: "absolute mt-1 w-full rounded-md bg-white shadow-lg", children: _jsx("ul", { className: "max-h-60 overflow-auto rounded-md py-1 text-base", children: searchResults.map((member) => (_jsx("li", { className: "cursor-pointer px-4 py-2 hover:bg-gray-100", onClick: () => {
                                                    navigate(`/members/${member._id}`);
                                                    setSearchQuery("");
                                                }, children: _jsxs("div", { className: "flex items-center space-x-3", children: [member.photo && (_jsx("img", { src: member.photo, alt: member.name, className: "h-8 w-8 rounded-full" })), _jsx("span", { children: member.name })] }) }, member._id))) }) }))] }) }), _jsx("div", { children: _jsxs("button", { onClick: handleSignOut, className: "relative inline-flex items-center justify-center p-4 px-4 py-2 overflow-hidden font-medium text-indigo-600 transition duration-300 ease-out border-2  border-blue-700 rounded-full shadow-md group", children: [_jsx("span", { className: "absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-blue-700 group-hover:translate-x-0 ease", children: _jsx(ArrowRightOnRectangleIcon, { className: "w-6 h-6" }) }), _jsx("span", { className: "absolute flex items-center justify-center w-full h-full  border-blue-700 transition-all duration-300 transform group-hover:translate-x-full ease", children: "Sign Out" }), _jsx("span", { className: "relative invisible", children: "Sign Out" })] }) })] }) }), _jsx(MobileMenu, { isOpen: isMobileMenuOpen, setIsOpen: setIsMobileMenuOpen }), isModalOpen && (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-50", children: _jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg max-w-sm w-full", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Are you sure you want to sign out?" }), _jsxs("div", { className: "flex justify-end space-x-4", children: [_jsx("button", { onClick: cancelSignOut, className: "bg-gray-200 text-gray-900 py-2 px-4 rounded-md hover:bg-gray-300", children: "Cancel" }), _jsx("button", { onClick: confirmSignOut, className: "bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600", children: "Confirm" })] })] }) }))] }));
}
