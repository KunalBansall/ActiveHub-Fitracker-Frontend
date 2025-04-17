import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Product, ProductReview } from "../types";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  ChatBubbleLeftEllipsisIcon,
  PlusIcon,
  MinusIcon,
  ClockIcon,
  HeartIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  TruckIcon,
  ShieldCheckIcon,
  XCircleIcon,
  XMarkIcon,
  PencilIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { StarIcon } from "@heroicons/react/24/outline";
import { useCart } from "../context/CartContext";
import Cart from "../components/Cart";
import MemberNavCart from "../components/MemberNavCart";
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const MemberProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  
  // Get cart functions from context
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No token found, please log in.");
      navigate("/memberlogin");
      return;
    }

    try {
      setLoading(true);
      // First try with member-specific endpoint
      try {
        const response = await axios.get(`${API_URL}/member/products/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Check if product is active
        if (!response.data.isActive) {
          setError("This product is currently not available.");
          setProduct(null);
          return;
        }
        
        setProduct(response.data);
        setError(null);
      } catch (memberEndpointError) {
        console.error("Error with member endpoint:", memberEndpointError);
        
        // Fall back to regular products endpoint if member endpoint fails
        const fallbackResponse = await axios.get(`${API_URL}/products/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Check if product is active in fallback response
        if (!fallbackResponse.data.isActive) {
          setError("This product is currently not available.");
          setProduct(null);
          return;
        }
        
        setProduct(fallbackResponse.data);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      setError("Failed to load product details. Please try again later.");
      toast.error("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevImage = () => {
    if (product?.images && product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
    }
  };

  const handleNextImage = () => {
    if (product?.images && product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuantity(parseInt(e.target.value));
  };

  const handleAddToCart = async () => {
    if (product && product.inventory > 0) {
      setIsAddingToCart(true);
      try {
        await addToCart(product, quantity);
      } catch (err) {
        console.error("Error adding to cart:", err);
        toast.error("Failed to add to cart. Please try again later.");
      } finally {
        setIsAddingToCart(false);
      }
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.error("Please write a comment for your review");
      return;
    }

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName") || "Member";

    if (!token || !userId) {
      toast.error("You must be logged in to submit a review");
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await axios.post(
        `${API_URL}/member/products/${id}/reviews`,
        {
          memberId: userId,
          memberName: userName,
          rating: reviewRating,
          comment: reviewComment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProduct(response.data);
      setReviewComment("");
      setShowReviewForm(false);
      toast.success("Review submitted successfully");
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Failed to submit review. Please try again later.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-12 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-md border border-red-100">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Unable to load product</h3>
                <div className="mt-2 text-sm text-gray-600">
                  <p>{error || "Product not found"}</p>
                </div>
                <div className="mt-4">
                  <Link
                    to="/member-shop"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-sm transition-all duration-200"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back to Shop
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header - Fixed and Modernized */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 relative">
            {/* Brand and Back Button */}
            <div className="flex items-center">
              <Link
                to="/member-shop"
                className="inline-flex items-center text-white mr-4 hover:bg-white/10 px-3 py-1.5 rounded-md transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                Back
              </Link>
              <div className="hidden md:flex">
                <span className="flex items-center">
                  <Link
                    to={`/member/${localStorage.getItem("userId")}`}
                    className="flex items-center text-white hover:bg-white/10 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <HeartIcon className="h-5 w-5 text-pink-400 mr-2" />
                    <span className="text-white text-lg font-bold tracking-tight">
                      ActiveHub<span className="text-pink-300 font-light">FlexTracker</span>
                    </span>
                  </Link>
                </span>
              </div>
            </div>
            
            {/* Right Actions */}
            <div className="flex items-center">
              <MemberNavCart />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Product Images - Enhanced Gallery */}
              <div className="lg:w-1/2">
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 h-80 lg:h-[28rem] shadow-sm border border-gray-200">
                  {product.images.length > 0 ? (
                    <img
                      src={product.images[currentImageIndex].url}
                      alt={product.name}
                      className="w-full h-full object-contain p-4 transition-all duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ShoppingBagIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  
                  {product.featured && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm flex items-center">
                      <StarIconSolid className="h-3 w-3 mr-1 text-white" />
                      Featured
                    </div>
                  )}

                  {product.discountPrice && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                      -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                    </div>
                  )}

                  {product.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2.5 bg-white/80 text-gray-800 hover:bg-white shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2.5 bg-white/80 text-gray-800 hover:bg-white shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails Row */}
                {product.images.length > 1 && (
                  <div className="mt-4 flex overflow-x-auto space-x-3 pb-1 px-1">
                    {product.images.map((image, index) => (
                      <button
                        key={image.publicId}
                        type="button"
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden shadow-sm transition-all duration-300 transform hover:scale-105 ${
                          index === currentImageIndex 
                            ? "ring-2 ring-indigo-500 border-2 border-white" 
                            : "border border-gray-200 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={`Product thumbnail ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details - Modernized */}
              <div className="lg:w-1/2">
                <div className="space-y-6">
                  {/* Product Title and Category */}
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {product.category}
                      </span>
                      {product.inventory <= 5 && product.inventory > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Low Stock
                        </span>
                      )}
                    </div>
                    
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{product.name}</h1>
                    
                    <div className="mt-2 flex items-center">
                      <div className="flex items-center">
                        {[0, 1, 2, 3, 4].map((rating) => (
                          <StarIconSolid
                            key={rating}
                            className={`h-5 w-5 ${
                              product.rating > rating ? "text-amber-400" : "text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        {product.rating.toFixed(1)} ({product.reviews?.length || 0} reviews)
                      </span>
                    </div>
                  </div>
                  
                  {/* Price Section */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-baseline">
                      {product.discountPrice ? (
                        <>
                          <h2 className="text-3xl font-bold text-gray-900">₹{product.discountPrice.toFixed(2)}</h2>
                          <p className="ml-2 text-lg text-gray-500 line-through">
                            ₹{product.price.toFixed(2)}
                          </p>
                          <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold text-white bg-gradient-to-r from-green-600 to-green-500">
                            SAVE {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                          </span>
                        </>
                      ) : (
                        <h2 className="text-3xl font-bold text-gray-900">₹{product.price.toFixed(2)}</h2>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center">
                      {product.inventory > 0 ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircleIcon className="h-5 w-5 mr-1.5" />
                          <span className="font-medium">In Stock</span>
                          <span className="ml-1 text-sm text-gray-600">
                            ({product.inventory} available)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <XCircleIcon className="h-5 w-5 mr-1.5" />
                          <span className="font-medium">Out of Stock</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Product Benefits */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start p-3 bg-green-50 rounded-lg border border-green-100">
                      <TruckIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Free Delivery</h3>
                        <p className="text-xs text-gray-600">On orders above ₹500</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <ArrowPathIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Easy Returns</h3>
                        <p className="text-xs text-gray-600">7 day return policy</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Description</h3>
                    <div className="mt-2 prose prose-sm text-gray-600">
                      <p>{product.description}</p>
                    </div>
                  </div>

                  {/* Add to Cart Section */}
                  <div className="space-y-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center">
                      <label htmlFor="quantity" className="mr-4 text-sm font-medium text-gray-700">
                        Quantity
                      </label>
                      <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
                        <button 
                          type="button"
                          className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300"
                          onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                          disabled={product.inventory <= 0 || quantity <= 1}
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center font-medium">{quantity}</span>
                        <button 
                          type="button"
                          className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300"
                          onClick={() => quantity < Math.min(product.inventory, 10) && setQuantity(quantity + 1)}
                          disabled={product.inventory <= 0 || quantity >= Math.min(product.inventory, 10)}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border border-transparent rounded-lg py-3 px-8 flex items-center justify-center text-base font-medium text-white shadow-sm hover:shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
                      disabled={product.inventory <= 0}
                    >
                      {isAddingToCart ? (
                        <div className="flex items-center">
                          <div className="animate-spin mr-2 h-5 w-5 border-2 border-t-transparent border-white rounded-full"></div>
                          <span>Adding to Cart...</span>
                        </div>
                      ) : (
                        <>
                          <ShoppingCartIcon className="h-5 w-5 mr-2" />
                          {product.inventory > 0 ? "Add to Cart" : "Out of Stock"}
                        </>
                      )}
                    </button>
                    
                    {/* Safety & Trust */}
                    <div className="flex items-center justify-center text-sm text-gray-500 mt-3">
                      <ShieldCheckIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                      <span>Secure checkout & 100% authentic products</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section - Modernized */}
            <div className="mt-12 border-t border-gray-200 pt-8">
              <div className="flex flex-wrap items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mr-2 text-indigo-600" />
                  Customer Reviews
                </h2>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="mt-2 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  {showReviewForm ? (
                    <>
                      <XMarkIcon className="h-4 w-4 mr-1.5" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <PencilIcon className="h-4 w-4 mr-1.5" />
                      Write a Review
                    </>
                  )}
                </button>
              </div>

              {/* Review Stats Summary */}
              {product.reviews && product.reviews.length > 0 && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className="flex items-center">
                      <div className="text-4xl font-bold text-gray-900 mr-2">{product.rating.toFixed(1)}</div>
                      <div className="flex flex-col">
                        <div className="flex">
                          {[0, 1, 2, 3, 4].map((rating) => (
                            <StarIconSolid
                              key={rating}
                              className={`h-5 w-5 ${
                                product.rating > rating ? "text-amber-400" : "text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-gray-500">{product.reviews.length} reviews</div>
                      </div>
                    </div>
                    
                    <div className="ml-0 md:ml-12 mt-4 md:mt-0">
                      <div className="space-y-1">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const reviews = product.reviews || [];
                          const count = reviews.filter(review => review.rating === star).length;
                          const percentage = (count / reviews.length) * 100;
                          
                          return (
                            <div key={star} className="flex items-center text-sm">
                              <div className="w-8 text-gray-600">{star}</div>
                              <StarIconSolid className="h-4 w-4 text-amber-400 mr-1" />
                              <div className="w-48 bg-gray-200 rounded-full h-2.5 mr-2">
                                <div 
                                  className="bg-amber-400 h-2.5 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500">{count}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Form */}
              {showReviewForm && (
                <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900">Share Your Experience</h3>
                  
                  <form onSubmit={handleSubmitReview} className="mt-4">
                    <div>
                      <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
                        Your Rating
                      </label>
                      <div className="mt-2 flex items-center">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setReviewRating(rating)}
                            className="focus:outline-none"
                          >
                            {rating <= reviewRating ? (
                              <StarIconSolid className="h-8 w-8 text-amber-400 hover:text-amber-500 transition-colors" />
                            ) : (
                              <StarIcon className="h-8 w-8 text-gray-300 hover:text-amber-400 transition-colors" />
                            )}
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-gray-500">
                          {reviewRating === 5 ? "Excellent" : 
                           reviewRating === 4 ? "Very Good" :
                           reviewRating === 3 ? "Good" :
                           reviewRating === 2 ? "Fair" : "Poor"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                        Your Review
                      </label>
                      <textarea
                        id="comment"
                        name="comment"
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share what you liked or didn't like about this product..."
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={submittingReview || !reviewComment.trim()}
                      >
                        {submittingReview ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckIcon className="h-4 w-4 mr-1.5" />
                            Submit Review
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Reviews List */}
              <div className="mt-8">
                {product.reviews && product.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {product.reviews.map((review) => (
                      <div key={review._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700">
                              <span className="font-medium text-lg">
                                {review.memberName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex flex-wrap items-center justify-between">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900">{review.memberName}</h4>
                                <div className="mt-1 flex items-center">
                                  <div className="flex">
                                    {[0, 1, 2, 3, 4].map((rating) => (
                                      <StarIconSolid
                                        key={rating}
                                        className={`h-4 w-4 ${
                                          review.rating > rating ? "text-amber-400" : "text-gray-200"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <time className="ml-2 text-xs text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString(undefined, {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </time>
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-700">
                              <p>{review.comment}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
                    <ChatBubbleLeftEllipsisIcon className="mx-auto h-10 w-10 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Be the first to share your experience with this product.
                    </p>
                    {!showReviewForm && (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                      >
                        <PencilIcon className="h-4 w-4 mr-1.5" />
                        Write a Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Include the Cart component */}
      <Cart />
    </div>
  );
};

export default MemberProductDetail; 