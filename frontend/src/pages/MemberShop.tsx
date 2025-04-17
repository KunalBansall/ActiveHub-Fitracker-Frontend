import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Product, ProductCategory } from "../types";
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  FunnelIcon,
  StarIcon as StarIconOutline,
  ClockIcon,
  ArrowLeftIcon,
  CheckBadgeIcon,
  TagIcon,
  FireIcon,
  BeakerIcon,
  AdjustmentsHorizontalIcon,
  SquaresPlusIcon,
  HeartIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast";
import MemberNavCart from "../components/MemberNavCart";
import Cart from "../components/Cart";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const categories: { value: ProductCategory | "all"; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All Categories", icon: TagIcon },
  { value: "supplements", label: "Supplements", icon: BeakerIcon },
  { value: "wearables", label: "Gym Wear", icon: ShoppingBagIcon },
  { value: "equipment", label: "Equipment", icon: AdjustmentsHorizontalIcon },
  { value: "accessories", label: "Accessories", icon: SquaresPlusIcon },
  { value: "other", label: "Other", icon: TagIcon },
];

const MemberShop: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<string>("featured");

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

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case "priceLow":
        return (a.discountPrice || a.price) - (b.discountPrice || b.price);
      case "priceHigh":
        return (b.discountPrice || b.price) - (a.discountPrice || a.price);
      case "rating":
        return b.rating - a.rating;
      case "newest":
        return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
      case "featured":
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header - ActiveHub Standard - Now Sticky */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 relative">
            {/* Brand Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="flex items-center">
                  <HeartIcon className="h-5 w-5 text-pink-400 mr-2" />
                  <span className="text-white text-lg font-bold tracking-tight">
                    ActiveHub<span className="text-pink-300 font-light hidden sm:inline">FlexTracker</span>
                  </span>
                </span>
              </div>
            </div>
            
            {/* Page Title & Actions */}
            <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
              <h1 className="text-lg font-semibold text-white">Shop</h1>
            </div>
            
            {/* Right Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <MemberNavCart />
              <div className="flex gap-2">
                <Link
                  to="/member-orders"
                  className="inline-flex items-center px-3 py-1.5 border border-white/20 rounded-md text-sm font-medium text-white hover:bg-white/10 transition-colors"
                >
                  <ClockIcon className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Orders</span>
                </Link>
                <Link
                  to={`/member/${localStorage.getItem("userId")}`}
                  className="inline-flex items-center px-3 py-1.5 border border-white/20 rounded-md text-sm font-medium text-white hover:bg-white/10 transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Title - Only shown on small screens - Also Sticky */}
      <div className="sticky top-14 z-40 bg-white shadow-sm border-b border-gray-200 md:hidden">
        <div className="max-w-7xl mx-auto py-2 px-4">
          <h1 className="text-lg font-semibold text-gray-900 text-center">Shop</h1>
        </div>
      </div>

      {/* Search and filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 backdrop-blur-sm">
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="featured">Featured</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
              </select>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <FunnelIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                Filters
              </button>
            </div>
          </div>

          {/* Filter options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {categories.map((category) => {
                  const CategoryIcon = category.icon;
                  return (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setSelectedCategory(category.value)}
                      className={`flex flex-col items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedCategory === category.value
                          ? "bg-indigo-100 text-indigo-800 border-2 border-indigo-200 shadow-sm transform scale-105"
                          : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <CategoryIcon className={`h-5 w-5 mb-1 ${
                        selectedCategory === category.value ? "text-indigo-600" : "text-gray-500"
                      }`} />
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Products */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="mt-4 text-sm text-gray-600">Loading products...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-200">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading products</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 px-4">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">{sortedProducts.length} products found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProducts.map((product) => (
                <div
                  key={product._id}
                  className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:translate-y-[-4px]"
                >
                  <div className="aspect-w-3 aspect-h-2 bg-gray-200 group-hover:opacity-90 transition-opacity duration-300 relative">
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
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-sm">
                        <FireIcon className="h-3 w-3 mr-1 text-white" />
                        <span className="text-white">FEATURED</span>
                      </div>
                    )}
                    {product.discountPrice && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                        -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">{product.name}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        {product.category}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center">
                      {[0, 1, 2, 3, 4].map((rating) => (
                        <StarIcon
                          key={rating}
                          className={`h-4 w-4 ${
                            product.rating > rating ? 'text-amber-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-xs text-gray-500">
                        ({product.reviews?.length || 0})
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <div>
                        {product.discountPrice ? (
                          <div className="flex items-baseline">
                            <span className="text-lg font-bold text-indigo-600">₹{product.discountPrice.toFixed(2)}</span>
                            <span className="ml-1 text-xs text-gray-500 line-through">₹{product.price.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-indigo-600">₹{product.price.toFixed(2)}</span>
                        )}
                      </div>
                      {product.inventory > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckBadgeIcon className="h-3 w-3 mr-1" />
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Out of Stock
                        </span>
                      )}
                    </div>
                    <div className="mt-4">
                      <Link
                        to={`/member-shop/product/${product._id}`}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-sm transform transition-all duration-200 hover:shadow"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Include cart component */}
      <Cart />
    </div>
  );
};

export default MemberShop; 