import React, { useState } from 'react';
import { XMarkIcon, ShoppingBagIcon, TrashIcon, PlusIcon, MinusIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Payment method options
const PAYMENT_METHODS = [
  { id: 'card', name: 'Credit/Debit Card' },
  { id: 'upi', name: 'UPI Payment' },
  { id: 'cash', name: 'Cash on Delivery' },
  { id: 'wallet', name: 'Digital Wallet' },
];

const Cart: React.FC = () => {
  const { 
    cartItems, 
    cartTotal, 
    showCart, 
    setShowCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart 
  } = useCart();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // Address form state
  const [address, setAddress] = useState({
    name: '',
    phoneNumber: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  // Order notes
  const [orderNotes, setOrderNotes] = useState('');
  
  // Handle address form input changes
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  if (!showCart) return null;
  
  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setShowAddressForm(true);
  };
  
  const handleBackToCart = () => {
    setShowAddressForm(false);
  };
  
  const validateAddress = () => {
    const requiredFields = ['name', 'phoneNumber', 'street', 'city', 'state', 'zipCode'];
    for (const field of requiredFields) {
      if (!address[field as keyof typeof address]) {
        toast.error(`Please enter your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    
    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(address.phoneNumber)) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }
    
    return true;
  };
  
  const handleCheckout = async () => {
    if (!validateAddress()) {
      return;
    }
    
    setIsCheckingOut(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to checkout');
        setIsCheckingOut(false);
        return;
      }
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const memberId = localStorage.getItem('userId');
      
      // Create order payload according to backend requirements
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      }));
      
      const response = await axios.post(
        `${API_URL}/member/orders`,
        { 
          memberId,
          products: orderItems,
          totalAmount: cartTotal,
          paymentMethod,
          address,
          notes: orderNotes
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setOrderId(response.data._id || 'ORD-' + Date.now());
      setCheckoutSuccess(true);
      clearCart();
      toast.success('Order placed successfully!');
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Show checkout success screen
  if (checkoutSuccess) {
    return (
      <div className="fixed inset-0 overflow-hidden z-50">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={() => {
            setCheckoutSuccess(false);
            setShowCart(false);
          }}
        />
        
        {/* Success panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
              <div className="px-4 py-6 bg-green-600 sm:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white flex items-center">
                    <CheckCircleIcon className="h-6 w-6 mr-2" />
                    Order Confirmation
                  </h2>
                  <button
                    type="button"
                    className="rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
                    onClick={() => {
                      setCheckoutSuccess(false);
                      setShowCart(false);
                    }}
                  >
                    <span className="sr-only">Close panel</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 py-6 px-4 sm:px-6 overflow-auto">
                <div className="text-center py-10">
                  <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
                  <h3 className="mt-2 text-xl font-bold text-gray-900">Order Placed!</h3>
                  
                  <div className="mt-4 bg-green-50 rounded-lg p-4 border border-green-100">
                    <p className="text-sm text-gray-600">Your order ID:</p>
                    <p className="text-lg font-semibold text-gray-900">{orderId}</p>
                  </div>
                  
                  <p className="mt-6 text-sm text-gray-500">
                    Thank you for your purchase! Your order has been received and is being processed.
                    You'll receive a confirmation email shortly.
                  </p>
                  
                  <div className="mt-6 space-y-3">
                    <Link
                      to="/member-shop"
                      className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                      onClick={() => {
                        setCheckoutSuccess(false);
                        setShowCart(false);
                      }}
                    >
                      Continue Shopping
                    </Link>
                    <Link
                      to="/member-orders"
                      className="block mt-2 text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        setCheckoutSuccess(false);
                        setShowCart(false);
                      }}
                    >
                      View Order History
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show checkout address form
  if (showAddressForm) {
    return (
      <div className="fixed inset-0 overflow-hidden z-50">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={() => setShowCart(false)}
        />
        
        {/* Sliding panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
              {/* Header */}
              <div className="px-4 py-6 bg-blue-600 sm:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white flex items-center">
                    <ShoppingBagIcon className="h-6 w-6 mr-2" />
                    Checkout
                  </h2>
                  <button
                    type="button"
                    className="rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
                    onClick={() => setShowCart(false)}
                  >
                    <span className="sr-only">Close panel</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Checkout form */}
              <div className="flex-1 py-6 px-4 sm:px-6 overflow-auto">
                <button
                  type="button"
                  onClick={handleBackToCart}
                  className="mb-4 flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back to cart
                </button>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Order Summary</h3>
                  <div className="text-sm text-gray-600">
                    <p>{cartItems.length} items: ₹{cartTotal.toFixed(2)}</p>
                    <p>Shipping: ₹50.00</p>
                    <p>Tax (5%): ₹{(cartTotal * 0.05).toFixed(2)}</p>
                    <div className="border-t border-gray-200 mt-2 pt-2 font-medium text-gray-900">
                      Total: ₹{(cartTotal + 50 + (cartTotal * 0.05)).toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <form>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h3>
                  
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={address.name}
                        onChange={handleAddressChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={address.phoneNumber}
                        onChange={handleAddressChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                        Street Address
                      </label>
                      <input
                        type="text"
                        id="street"
                        name="street"
                        value={address.street}
                        onChange={handleAddressChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                          City
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={address.city}
                          onChange={handleAddressChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                          State
                        </label>
                        <input
                          type="text"
                          id="state"
                          name="state"
                          value={address.state}
                          onChange={handleAddressChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                          ZIP / Postal Code
                        </label>
                        <input
                          type="text"
                          id="zipCode"
                          name="zipCode"
                          value={address.zipCode}
                          onChange={handleAddressChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                          Country
                        </label>
                        <select
                          id="country"
                          name="country"
                          value={address.country}
                          onChange={handleAddressChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="India">India</option>
                          <option value="USA">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="UK">United Kingdom</option>
                          <option value="Australia">Australia</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Payment Method</h3>
                  <div className="space-y-3 mb-4">
                    {PAYMENT_METHODS.map((method) => (
                      <div key={method.id} className="flex items-center">
                        <input
                          id={`payment-${method.id}`}
                          name="paymentMethod"
                          type="radio"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`payment-${method.id}`} className="ml-3 block text-sm font-medium text-gray-700">
                          {method.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Special instructions for delivery..."
                    />
                  </div>
                  
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleCheckout}
                      className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                        isCheckingOut ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                      disabled={isCheckingOut}
                    >
                      {isCheckingOut ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        'Place Order'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default cart view
  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
        onClick={() => setShowCart(false)}
      />
      
      {/* Sliding panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
            {/* Header */}
            <div className="px-4 py-6 bg-blue-600 sm:px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-white flex items-center">
                  <ShoppingBagIcon className="h-6 w-6 mr-2" />
                  Your Cart ({cartItems.length})
                </h2>
                <button
                  type="button"
                  className="rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
                  onClick={() => setShowCart(false)}
                >
                  <span className="sr-only">Close panel</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Cart content */}
            <div className="flex-1 py-6 px-4 sm:px-6 overflow-auto">
              {cartItems.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start adding some items to your cart!
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/member-shop"
                      className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                      onClick={() => setShowCart(false)}
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="-my-6 divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <li key={item.productId} className="py-6 flex">
                        <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-center object-cover"
                          />
                        </div>

                        <div className="ml-4 flex-1 flex flex-col">
                          <div>
                            <div className="flex justify-between text-base font-medium text-gray-900">
                              <h3>
                                <Link 
                                  to={`/member-shop/product/${item.productId}`}
                                  onClick={() => setShowCart(false)}
                                >
                                  {item.name}
                                </Link>
                              </h3>
                              <p className="ml-4">₹{item.price.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="flex-1 flex items-end justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="p-1 rounded-full border border-gray-300 hover:bg-gray-100"
                              >
                                <MinusIcon className="h-4 w-4" />
                              </button>
                              <span className="font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="p-1 rounded-full border border-gray-300 hover:bg-gray-100"
                                disabled={item.quantity >= item.productDetails.inventory}
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="flex">
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.productId)}
                                className="font-medium text-red-600 hover:text-red-500"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Cart footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <p>Subtotal</p>
                  <p>₹{cartTotal.toFixed(2)}</p>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">
                  Shipping and taxes calculated at checkout.
                </p>
                
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                    onClick={handleProceedToCheckout}
                  >
                    Proceed to Checkout
                  </button>
                  
                  <button
                    type="button"
                    onClick={clearCart}
                    className="w-full flex justify-center items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <TrashIcon className="h-5 w-5 mr-2" />
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart; 