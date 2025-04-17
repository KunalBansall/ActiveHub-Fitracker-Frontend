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
        className="relative p-2 text-indigo-600 bg-white/20 hover:bg-white/30 rounded-md flex items-center shadow-sm backdrop-blur-sm transition-colors"
      >
        <ClockIcon className="h-5 w-5 text-white" />
        <span className="ml-1 text-sm hidden sm:inline text-white font-medium">Order History</span>
      </Link>
      
      <button
        type="button"
        className="relative p-1.5 bg-white/20 hover:bg-white/30 rounded-md shadow-sm backdrop-blur-sm transition-colors"
        onClick={() => setShowCart(true)}
      >
        <ShoppingBagIcon className="h-5 w-5 text-white" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border border-white/50 shadow-sm">
            {totalItems}
          </span>
        )}
      </button>
    </div>
  );
};

export default MemberNavCart; 