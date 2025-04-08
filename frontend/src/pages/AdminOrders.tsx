import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  ShoppingBagIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

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
  memberName?: string;
  memberEmail?: string;
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const statusOptions = [
  { value: 'pending', label: 'Pending', icon: ClockIcon, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'processing', label: 'Processing', icon: ClockIcon, color: 'bg-blue-100 text-blue-800' },
  { value: 'shipped', label: 'Shipped', icon: TruckIcon, color: 'bg-indigo-100 text-indigo-800' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircleIcon, color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircleIcon, color: 'bg-red-100 text-red-800' }
];

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusUpdating, setStatusUpdating] = useState<{ [key: string]: boolean }>({});
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication required');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setOrders(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setStatusUpdating(prev => ({ ...prev, [orderId]: true }));
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      await axios.patch(
        `${API_URL}/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update the local state to reflect the change
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus as Order['status'] } : order
      ));
      
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update order status:', err);
      toast.error('Failed to update order status');
    } finally {
      setStatusUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const filterOrdersByStatus = (orders: Order[], status: string) => {
    if (status === 'all') return orders;
    return orders.filter(order => order.status === status);
  };

  const filterOrdersBySearch = (orders: Order[], term: string) => {
    if (!term) return orders;
    
    const lowerTerm = term.toLowerCase();
    return orders.filter(order => 
      order._id.toLowerCase().includes(lowerTerm) ||
      order.address.name.toLowerCase().includes(lowerTerm) ||
      order.memberEmail?.toLowerCase().includes(lowerTerm) ||
      order.memberName?.toLowerCase().includes(lowerTerm) ||
      order.products.some(product => product.name.toLowerCase().includes(lowerTerm))
    );
  };

  const filteredOrders = filterOrdersByStatus(filterOrdersBySearch(orders, searchTerm), selectedFilter);

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    if (!statusOption) return null;
    
    const StatusIcon = statusOption.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusOption.color}`}>
        <StatusIcon className="h-4 w-4 mr-1" />
        {statusOption.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Order Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage customer orders, update status, and track deliveries.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={fetchOrders}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh Orders
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden mb-8">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search orders by ID, name, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  selectedFilter === 'all' 
                    ? 'bg-indigo-100 text-indigo-800' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Orders
              </button>
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setSelectedFilter(status.value)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    selectedFilter === status.value 
                      ? status.color 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md m-6">
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
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedFilter !== 'all' 
                ? 'Try adjusting your search filters'
                : 'There are no orders in the system yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <React.Fragment key={order._id}>
                    <tr 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleOrderExpansion(order._id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        # {order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.address.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{order.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="capitalize">{order.paymentMethod}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrderExpansion(order._id);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 ml-2"
                        >
                          {expandedOrderId === order._id ? (
                            <ChevronUpIcon className="h-5 w-5" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                    
                    {expandedOrderId === order._id && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Order Details</h4>
                              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <dt className="text-gray-500">Order ID</dt>
                                <dd className="text-gray-900">{order._id}</dd>
                                
                                <dt className="text-gray-500">Order Date</dt>
                                <dd className="text-gray-900">{formatDate(order.createdAt)}</dd>
                                
                                <dt className="text-gray-500">Payment Method</dt>
                                <dd className="text-gray-900 capitalize">{order.paymentMethod}</dd>
                                
                                <dt className="text-gray-500">Total Amount</dt>
                                <dd className="text-gray-900 font-medium">₹{order.totalAmount.toFixed(2)}</dd>
                              </dl>

                              <div className="mt-6">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Update Status</h4>
                                <div className="flex flex-wrap gap-2">
                                  {statusOptions.map((option) => (
                                    <button
                                      key={option.value}
                                      onClick={() => updateOrderStatus(order._id, option.value)}
                                      disabled={order.status === option.value || statusUpdating[order._id]}
                                      className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                                        order.status === option.value 
                                          ? option.color
                                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                      } ${statusUpdating[order._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      {statusUpdating[order._id] ? (
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                      ) : (
                                        option.label
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h4>
                              <address className="text-sm text-gray-900 not-italic">
                                <p className="font-medium">{order.address.name}</p>
                                <p>{order.address.street}</p>
                                <p>
                                  {order.address.city}, {order.address.state} {order.address.zipCode}
                                </p>
                                <p>{order.address.country}</p>
                                <p className="mt-2">Phone: {order.address.phoneNumber}</p>
                              </address>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Ordered Items</h4>
                            <div className="overflow-x-auto shadow-sm rounded-md border border-gray-200">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Product
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Price
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Quantity
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Total
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {order.products.map((item) => (
                                    <tr key={item.productId}>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden border border-gray-200">
                                            <img 
                                              src={item.image} 
                                              alt={item.name} 
                                              className="h-full w-full object-cover"
                                            />
                                          </div>
                                          <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                              {item.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                              ID: {item.productId}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                        ₹{item.price.toFixed(2)}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                        {item.quantity}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                        ₹{(item.price * item.quantity).toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                  <tr>
                                    <th scope="row" colSpan={3} className="hidden sm:table-cell px-6 py-3 text-sm font-medium text-gray-900 text-right">
                                      Subtotal
                                    </th>
                                    <th scope="row" className="sm:hidden px-6 py-3 text-sm font-medium text-gray-900 text-right">
                                      Subtotal
                                    </th>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                      ₹{order.totalAmount.toFixed(2)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders; 