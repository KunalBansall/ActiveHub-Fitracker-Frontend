import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  TagIcon,
  XMarkIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { Product, ProductCategory } from "../types";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

export default function ShopPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const queryClient = useQueryClient();

  const categories: { value: ProductCategory | "all"; label: string }[] = [
    { value: "all", label: "All Categories" },
    { value: "supplements", label: "Supplements" },
    { value: "wearables", label: "Gym Wear" },
    { value: "equipment", label: "Equipment" },
    { value: "accessories", label: "Accessories" },
    { value: "other", label: "Other" },
  ];

  // Fetch products
  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery<Product[]>(
    ["products", selectedCategory],
    async () => {
      const url = `${API_URL}/products${
        selectedCategory !== "all" ? `?category=${selectedCategory}` : ""
      }`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    {
      enabled: !!token,
      onError: (err) => {
        console.error("Error fetching products:", err);
        toast.error("Failed to load products");
      },
    }
  );

  // Delete product mutation
  const deleteProductMutation = useMutation(
    async (productId: string) => {
      await axios.delete(`${API_URL}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return productId;
    },
    {
      onSuccess: (deletedProductId) => {
        queryClient.setQueryData<Product[]>(["products", selectedCategory], (oldData = []) =>
          oldData.filter((product) => product._id !== deletedProductId)
        );
        toast.success("Product deleted successfully");
      },
      onError: (err) => {
        console.error("Error deleting product:", err);
        toast.error("Failed to delete product");
      },
    }
  );

  // Toggle product feature status mutation
  const toggleFeatureMutation = useMutation(
    async ({ productId, featured }: { productId: string; featured: boolean }) => {
      const response = await axios.patch(
        `${API_URL}/products/${productId}/feature`,
        { featured },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    {
      onSuccess: (updatedProduct) => {
        queryClient.setQueryData<Product[]>(["products", selectedCategory], (oldData = []) =>
          oldData.map((product) =>
            product._id === updatedProduct._id ? updatedProduct : product
          )
        );
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

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleToggleFeature = (product: Product) => {
    toggleFeatureMutation.mutate({
      productId: product._id,
      featured: !product.featured,
    });
  };

  // Filter products based on search term
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center">
          <ShoppingBagIcon className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Shop Management</h1>
        </div>
        <Link
          to="/shop/add-product"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Add New Product
        </Link>
      </div>

      {/* Search and filters */}
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

      {/* Products list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading products
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Please try again later or contact support.</p>
              </div>
            </div>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new product.
          </p>
          <div className="mt-6">
            <Link
              to="/shop/add-product"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add New Product
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="relative pb-[70%] bg-gray-100">
                {product.images.length > 0 ? (
                  <img
                    src={
                      product.images.find(
                        (img) => img.publicId === product.featuredImageId
                      )?.url || product.images[0].url
                    }
                    alt={product.name}
                    className="absolute h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <ShoppingBagIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {product.featured && (
                  <span className="absolute top-2 right-2 bg-yellow-400 rounded-full px-2 py-1 text-xs font-medium">
                    Featured
                  </span>
                )}
                {product.discountPrice && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs font-medium">
                    Sale
                  </span>
                )}
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
                    {product.name}
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {product.category}
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {product.description}
                </p>

                <div className="mt-2 flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-1" />
                  <span className="font-medium text-gray-900">
                    ₹{product.discountPrice ? product.discountPrice.toFixed(2) : product.price.toFixed(2)}
                  </span>
                  {product.discountPrice && (
                    <span className="ml-2 text-sm text-gray-500 line-through">
                      ₹{product.price.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center">
                  <TagIcon className="h-5 w-5 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-700">
                    Stock: {product.inventory} | Sold: {product.sold}
                  </span>
                </div>

                <div className="mt-2 flex items-center">
                  <div className="flex items-center">
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <StarIcon
                        key={rating}
                        className={`h-4 w-4 ${
                          product.rating > rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-1 text-sm text-gray-500">
                    ({product.reviews?.length || 0})
                  </span>
                </div>

                <div className="mt-4 flex space-x-3">
                  <Link
                    to={`/shop/products/${product._id}`}
                    className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    View
                  </Link>
                  <Link
                    to={`/shop/products/${product._id}/edit`}
                    className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-inset ring-blue-300 hover:bg-blue-50"
                  >
                    Edit
                  </Link>
                </div>

                <div className="mt-2 flex space-x-3">
                  <button
                    onClick={() => handleToggleFeature(product)}
                    className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-amber-600 shadow-sm ring-1 ring-inset ring-amber-300 hover:bg-amber-50"
                  >
                    {product.featured ? "Unfeature" : "Feature"}
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 