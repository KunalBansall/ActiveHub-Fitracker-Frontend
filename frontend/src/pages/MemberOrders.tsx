import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ShoppingBagIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import MemberNavCart from '../components/MemberNavCart';
import Cart from '../components/Cart';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  _id: string;
  memberId: string;
  products: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  address: {
    name: string;
    phoneNumber: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    case 'processing':
      return <ClockIcon className="h-5 w-5 text-blue-500" />;
    case 'shipped':
      return <TruckIcon className="h-5 w-5 text-blue-600" />;
    case 'delivered':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'cancelled':
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    default:
      return <ClockIcon className="h-5 w-5 text-gray-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-indigo-100 text-indigo-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const MemberOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('Please log in to view your orders');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const response = await axios.get(`${API_URL}/member/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setOrders(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load your orders. Please try again later.');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderDetails = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to="/member-shop"
                className="inline-flex items-center mr-4 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                Back to Shop
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900">Your Orders</h1>
            </div>
            <div className="flex items-center">
              <MemberNavCart />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading orders</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={fetchOrders}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't placed any orders yet.
            </p>
            <div className="mt-6">
              <Link
                to="/member-shop"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow overflow-hidden">
                <div 
                  className="px-4 py-5 sm:px-6 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleOrderDetails(order._id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <ShoppingBagIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Order #{order._id.substring(order._id.length - 8)}
                      </h3>
                      <p className="max-w-2xl text-sm text-gray-500">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </span>
                    <span className="text-lg font-medium text-gray-900">
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {expandedOrder === order._id && (
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    {/* Order Details */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Shipping Address</h4>
                        <div className="mt-2 text-sm text-gray-900 space-y-1">
                          <p className="font-medium">{order.address.name}</p>
                          <p>{order.address.street}</p>
                          <p>{order.address.city}, {order.address.state} {order.address.zipCode}</p>
                          <p>{order.address.country}</p>
                          <p>Phone: {order.address.phoneNumber}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Payment Information</h4>
                        <div className="mt-2 text-sm text-gray-900 space-y-1">
                          <p className="capitalize">Method: {order.paymentMethod}</p>
                          <p>Total: ₹{order.totalAmount.toFixed(2)}</p>
                          <p>Status: <span className="capitalize">{order.status}</span></p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-500">Order Items</h4>
                      <ul className="mt-2 divide-y divide-gray-200">
                        {order.products.map((item) => (
                          <li key={item.productId} className="py-4 flex">
                            <div className="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-md overflow-hidden">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-center object-cover"
                              />
                            </div>
                            <div className="ml-4 flex-1 flex flex-col">
                              <div>
                                <div className="flex justify-between text-sm font-medium text-gray-900">
                                  <h3>
                                    <Link 
                                      to={`/member-shop/product/${item.productId}`}
                                      className="hover:text-blue-600"
                                    >
                                      {item.name}
                                    </Link>
                                  </h3>
                                  <p className="ml-4">₹{item.price.toFixed(2)}</p>
                                </div>
                              </div>
                              <div className="flex-1 flex items-end justify-between text-sm">
                                <p className="text-gray-500">Qty {item.quantity}</p>
                                <p className="font-medium text-gray-900">
                                  Subtotal: ₹{(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Include the Cart component */}
      <Cart />
    </div>
  );
};

export default MemberOrders; 