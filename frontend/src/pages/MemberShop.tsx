import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Product, ProductCategory } from "../types";
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  FunnelIcon,
  StarIcon as StarIconOutline,
  ClockIcon
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast";
import MemberNavCart from "../components/MemberNavCart";
import Cart from "../components/Cart";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const categories: { value: ProductCategory | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "supplements", label: "Supplements" },
  { value: "wearables", label: "Gym Wear" },
  { value: "equipment", label: "Equipment" },
  { value: "accessories", label: "Accessories" },
  { value: "other", label: "Other" },
];

const MemberShop: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No token found, please log in.");
      return;
    }

    try {
      setLoading(true);
      const url = `${API_URL}/member/products${
        selectedCategory !== "all" ? `?category=${selectedCategory}` : ""
      }`;
      
      // First try with member-specific endpoint
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Filter out inactive products
        const activeProducts = response.data.filter((product: Product) => product.isActive);
        setProducts(activeProducts);
        setError(null);
      } catch (memberEndpointError) {
        console.error("Error with member endpoint:", memberEndpointError);
        
        // Fall back to regular products endpoint
        const fallbackUrl = `${API_URL}/products${
          selectedCategory !== "all" ? `?category=${selectedCategory}` : ""
        }`;
        
        const fallbackResponse = await axios.get(fallbackUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Filter out inactive products from fallback response
        const activeProducts = fallbackResponse.data.filter((product: Product) => product.isActive);
        setProducts(activeProducts);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products. Please try again later.");
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) && product.isActive
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Shop</h1>
            <div className="flex items-center space-x-4">
              <MemberNavCart />
              <Link
                to="/member-orders"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ClockIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
                View My Orders
              </Link>
              <Link
                to={`/member/${localStorage.getItem("userId")}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FunnelIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
              Filters
            </button>
          </div>

          {/* Filter options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setSelectedCategory(category.value)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                      selectedCategory === category.value
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Products */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading products</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-w-3 aspect-h-2 bg-gray-200 group-hover:opacity-75">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images.find(img => img.publicId === product.featuredImageId)?.url || product.images[0].url}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center">
                      <ShoppingBagIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  {product.featured && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded">
                      FEATURED
                    </div>
                  )}
                  {product.discountPrice && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      SALE
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                  <div className="mt-1 flex items-center">
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <StarIcon
                        key={rating}
                        className={`h-4 w-4 ${
                          product.rating > rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-xs text-gray-500">
                      ({product.reviews?.length || 0})
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-900">
                      ₹{product.price}
                      {product.discountPrice && (
                        <span className="ml-1 text-xs text-gray-500 line-through">
                          ₹{product.discountPrice}
                        </span>
                      )}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {product.category}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Link
                      to={`/member-shop/product/${product._id}`}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Include cart component */}
      <Cart />
    </div>
  );
};

export default MemberShop; 