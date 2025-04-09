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
  ClockIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { StarIcon } from "@heroicons/react/24/outline";
import { useCart } from "../context/CartContext";
import Cart from "../components/Cart";
import MemberNavCart from "../components/MemberNavCart";

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

  const handleAddToCart = () => {
    if (product && product.inventory > 0) {
      addToCart(product, quantity);
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
      <div className="flex justify-center py-12 min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading product</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error || "Product not found"}</p>
                </div>
                <div className="mt-4">
                  <Link
                    to="/member-shop"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ArrowLeftIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
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
              <h1 className="text-xl font-semibold text-gray-900 truncate">
                {loading ? "Loading..." : product?.name}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/member-orders"
                className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                <ClockIcon className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">My Orders</span>
              </Link>
              <MemberNavCart />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Product Images */}
              <div className="lg:w-1/2">
                <div className="relative rounded-lg overflow-hidden bg-gray-100 h-80 lg:h-96">
                  {product.images.length > 0 ? (
                    <img
                      src={product.images[currentImageIndex].url}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ShoppingBagIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  
                  {product.featured && (
                    <div className="absolute top-4 right-4 bg-yellow-400 text-xs font-semibold px-2 py-1 rounded-full">
                      Featured
                    </div>
                  )}

                  {product.discountPrice && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      Sale
                    </div>
                  )}

                  {product.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 bg-white/80 text-gray-800 hover:bg-white shadow-sm"
                      >
                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 bg-white/80 text-gray-800 hover:bg-white shadow-sm"
                      >
                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {product.images.length > 1 && (
                  <div className="mt-4 flex overflow-x-auto space-x-4 pb-2">
                    {product.images.map((image, index) => (
                      <button
                        key={image.publicId}
                        type="button"
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition-all ${
                          index === currentImageIndex ? "border-blue-500" : "border-gray-200"
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

              {/* Product Details */}
              <div className="lg:w-1/2">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                    <div className="mt-1 flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <div className="flex items-center">
                        {[0, 1, 2, 3, 4].map((rating) => (
                          <StarIconSolid
                            key={rating}
                            className={`h-4 w-4 ${
                              product.rating > rating ? "text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-sm text-gray-500">
                          ({product.reviews?.length || 0} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-end">
                    <h3 className="text-3xl font-bold text-gray-900">₹{product.discountPrice ? product.discountPrice.toFixed(2) : product.price.toFixed(2)}</h3>
                    {product.discountPrice && (
                      <>
                        <h3 className="ml-2 text-lg text-gray-500 line-through">
                          ₹{product.price.toFixed(2)}
                        </h3>
                        <span className="ml-2 text-lg font-medium text-green-600">
                          ({Math.round(((product.price - product.discountPrice) / product.price) * 100)}% off)
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {product.inventory > 0 ? (
                      <span className="text-green-600 font-medium">In Stock</span>
                    ) : (
                      <span className="text-red-600 font-medium">Out of Stock</span>
                    )}
                    {product.inventory > 0 && (
                      <span className="ml-2">({product.inventory} available)</span>
                    )}
                  </p>
                </div>

                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900">Description</h3>
                  <div className="mt-2 text-base text-gray-500 space-y-2">
                    <p>{product.description}</p>
                  </div>
                </div>

                {/* Add to Cart Section */}
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="flex items-center">
                    <label htmlFor="quantity" className="mr-4 text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <select
                      id="quantity"
                      name="quantity"
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="rounded-md border-gray-300 py-1.5 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      disabled={product.inventory <= 0}
                    >
                      {[...Array(Math.min(product.inventory, 10)).keys()].map((i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="w-full bg-blue-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      disabled={product.inventory <= 0}
                    >
                      <ShoppingCartIcon className="h-5 w-5 mr-2" />
                      {product.inventory > 0 ? "Add to Cart" : "Out of Stock"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-12 border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Customer Reviews</h3>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {showReviewForm ? "Cancel" : "Write a Review"}
                </button>
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h4 className="text-base font-medium text-gray-900">Write Your Review</h4>
                  
                  <form onSubmit={handleSubmitReview}>
                    <div className="mt-4">
                      <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
                        Rating
                      </label>
                      <div className="mt-1 flex items-center">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setReviewRating(rating)}
                            className="focus:outline-none"
                          >
                            {rating <= reviewRating ? (
                              <StarIconSolid className="h-6 w-6 text-yellow-400" />
                            ) : (
                              <StarIcon className="h-6 w-6 text-gray-300 hover:text-yellow-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                        Comment
                      </label>
                      <textarea
                        id="comment"
                        name="comment"
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Share your experience with this product..."
                        required
                      />
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                        disabled={submittingReview}
                      >
                        {submittingReview && (
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                        )}
                        Submit Review
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Reviews List */}
              <div className="mt-6">
                {product.reviews && product.reviews.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {product.reviews.map((review) => (
                      <li key={review._id} className="py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                              <span className="text-sm font-medium leading-none text-gray-600">
                                {review.memberName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900">{review.memberName}</p>
                              <span className="mx-2 text-gray-300">•</span>
                              <time
                                dateTime={review.createdAt}
                                className="text-xs text-gray-500"
                              >
                                {new Date(review.createdAt).toLocaleDateString()}
                              </time>
                            </div>
                            <div className="mt-1 flex items-center">
                              {[0, 1, 2, 3, 4].map((rating) => (
                                <StarIconSolid
                                  key={rating}
                                  className={`h-4 w-4 ${
                                    review.rating > rating ? "text-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-md">
                    <ChatBubbleLeftEllipsisIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Be the first to review this product
                    </p>
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