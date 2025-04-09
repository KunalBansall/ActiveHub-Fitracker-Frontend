import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import {
  ArrowLeftIcon,
  StarIcon,
  ShoppingCartIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  HeartIcon,
  TagIcon,
  ArrowPathIcon,
  ShoppingBagIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { Product, ProductReview } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Fetch product data
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery<Product>(
    ["product", id],
    async () => {
      const response = await axios.get(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    {
      enabled: !!id && !!token,
      onError: (err) => {
        console.error("Error fetching product:", err);
        toast.error("Failed to load product details");
      },
    }
  );

  // Delete product mutation
  const deleteProductMutation = useMutation(
    async () => {
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("products");
        toast.success("Product deleted successfully");
        navigate("/shop");
      },
      onError: (err) => {
        console.error("Error deleting product:", err);
        toast.error("Failed to delete product");
      },
    }
  );

  // Toggle product feature status mutation
  const toggleFeatureMutation = useMutation(
    async (featured: boolean) => {
      const response = await axios.patch(
        `${API_URL}/products/${id}/feature`,
        { featured },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    {
      onSuccess: (updatedProduct) => {
        queryClient.setQueryData(["product", id], updatedProduct);
        queryClient.invalidateQueries("products");
        toast.success(
          `Product ${updatedProduct.featured ? "marked as featured" : "removed from featured"}`
        );
      },
      onError: (err) => {
        console.error("Error updating product feature status:", err);
        toast.error("Failed to update product");
      },
    }
  );

  const handleDeleteProduct = () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate();
    }
  };

  const handleToggleFeature = () => {
    if (product) {
      toggleFeatureMutation.mutate(!product.featured);
    }
  };

  const nextImage = () => {
    if (product?.images.length) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images.length) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading product details
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Please try again later or go back to the shop.</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate("/shop")}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowLeftIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                  Back to Shop
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => navigate("/shop")}
          className="mr-4 rounded-full p-2 text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Product Details</h1>
      </div>

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

                {product.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 bg-white/80 text-gray-800 hover:bg-white shadow-sm"
                    >
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
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

              {/* Action Buttons */}
              <div className="mt-6 flex space-x-4">
                <Link
                  to={`/shop/products/${product._id}/edit`}
                  className="flex-1 inline-flex justify-center items-center py-2.5 px-4 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PencilIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                  Edit Product
                </Link>
                <button
                  type="button"
                  onClick={handleToggleFeature}
                  className="flex-1 inline-flex justify-center items-center py-2.5 px-4 border border-amber-300 rounded-md shadow-sm text-sm font-medium text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                  <StarIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                  {product.featured ? "Unfeature" : "Feature"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  className="flex-1 inline-flex justify-center items-center py-2.5 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                  Delete
                </button>
              </div>
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
                    <h3 className="ml-2 text-lg text-gray-500 line-through">
                      ₹{product.price.toFixed(2)}
                    </h3>
                  )}
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Description</h3>
                <div className="mt-2 text-base text-gray-500 space-y-2">
                  <p>{product.description}</p>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Stock</span>
                    <span className="font-medium text-gray-900">{product.inventory} items</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sold</span>
                    <span className="font-medium text-gray-900">{product.sold} items</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Added On</span>
                    <span className="font-medium text-gray-900">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Updated</span>
                    <span className="font-medium text-gray-900">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Customer Reviews</h3>
                  <span className="text-sm text-gray-500">
                    {product.reviews?.length || 0} reviews
                  </span>
                </div>

                <div className="mt-4">
                  {product.reviews && product.reviews.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {product.reviews.slice(0, 3).map((review) => (
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
                    <div className="text-center py-4 bg-gray-50 rounded-md">
                      <ChatBubbleLeftEllipsisIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Be the first to review this product
                      </p>
                    </div>
                  )}

                  {product.reviews && product.reviews.length > 3 && (
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        See all reviews
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 