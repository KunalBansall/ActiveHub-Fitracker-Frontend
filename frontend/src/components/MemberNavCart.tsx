import React from 'react';
import { ShoppingBagIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

const MemberNavCart: React.FC = () => {
  const { cartItems, setShowCart } = useCart();
  
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  return (
    <div className="flex items-center space-x-4">
      <Link 
        to="/member-orders"
        className="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 flex items-center"
      >
        <ClockIcon className="h-6 w-6 text-white" />
        <span className="ml-1 text-sm hidden sm:inline text-white">Order History</span>
      </Link>
      
      <button
        type="button"
        className="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
        onClick={() => setShowCart(true)}
      >
        <ShoppingBagIcon className="h-6 w-6 text-white" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </button>
    </div>
  );
};

export default MemberNavCart; 