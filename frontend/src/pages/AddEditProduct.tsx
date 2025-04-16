import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "react-query";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
import {
  ArrowLeftIcon,
  PhotoIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { Product, ProductCategory, ProductImage } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
const API_URL = import.meta.env.VITE_API_URL;
const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

type FormValues = {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: ProductCategory;
  inventory: number;
  featured: boolean;
  isActive: boolean;
};

export default function AddEditProductPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [featuredImageId, setFeaturedImageId] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      discountPrice: undefined,
      category: "supplements",
      inventory: 1,
      featured: false,
      isActive: true,
    },
  });

  // Fetch product data if in edit mode
  const { data: product, isLoading: isLoadingProduct } = useQuery<Product>(
    ["product", id],
    async () => {
      const response = await axios.get(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    {
      enabled: isEditMode && !!token,
      onSuccess: (data) => {
        // Set form values
        reset({
          name: data.name,
          description: data.description,
          price: data.price,
          discountPrice: data.discountPrice,
          category: data.category,
          inventory: data.inventory,
          featured: data.featured,
          isActive: data.isActive,
        });

        // Set images and featured image
        setImages(data.images || []);
        setFeaturedImageId(data.featuredImageId);
      },
      onError: (error) => {
        console.error("Failed to fetch product:", error);
        toast.error("Failed to load product data");
        navigate("/shop");
      },
    }
  );

  // Create or update product mutation
  const mutation = useMutation(
    async (data: FormValues) => {
      const productData = {
        ...data,
        images,
        featuredImageId,
      };

      if (isEditMode) {
        const response = await axios.put(`${API_URL}/products/${id}`, productData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
      } else {
        const response = await axios.post(`${API_URL}/products`, productData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
      }
    },
    {
      onSuccess: () => {
        toast.success(`Product ${isEditMode ? "updated" : "created"} successfully`);
        navigate("/shop");
      },
      onError: (error) => {
        console.error("Failed to save product:", error);
        toast.error(`Failed to ${isEditMode ? "update" : "create"} product`);
      },
    }
  );

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedImages: ProductImage[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        // Show loading toast
        const loadingToastId = toast.loading(`Uploading image ${i + 1} of ${files.length}...`);

        const response = await axios.post(CLOUDINARY_URL, formData);
        uploadedImages.push({
          publicId: response.data.public_id,
          url: response.data.secure_url,
        });

        // Dismiss loading toast
        toast.dismiss(loadingToastId);
      }

      const newImages = [...images, ...uploadedImages];
      setImages(newImages);
      
      // Set the first uploaded image as featured if none is set
      if (!featuredImageId && uploadedImages.length > 0) {
        setFeaturedImageId(uploadedImages[0].publicId);
      }

      toast.success(`Successfully uploaded ${uploadedImages.length} images`);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSetFeaturedImage = (imageId: string) => {
    setFeaturedImageId(imageId);
    toast.success("Featured image updated");
  };

  const handleRemoveImage = (publicId: string) => {
    setImages(images.filter(img => img.publicId !== publicId));
    if (featuredImageId === publicId) {
      setFeaturedImageId(images.length > 1 ? images[0].publicId : undefined);
    }
  };

  const nextSlide = () => {
    if (images.length > 1) {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }
  };

  const prevSlide = () => {
    if (images.length > 1) {
      setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const onSubmit = (data: FormValues) => {
    if (images.length === 0) {
      toast.error("Please upload at least one product image");
      return;
    }

    mutation.mutate(data);
  };

  if (isEditMode && isLoadingProduct) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex items-center mb-8">
        <button
          type="button"
          onClick={() => navigate("/shop")}
          className="mr-4 rounded-full p-2 text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? "Edit Product" : "Add New Product"}
        </h1>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-medium text-gray-900">Product Images</h2>
                <p className="text-sm text-gray-500">
                  Upload high-quality images of your product (recommended size: 800x800px)
                </p>
              </div>

              <div className="mb-6">
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-500">
                      {images.length === 0
                        ? "No product images uploaded yet"
                        : `${images.length} product image${images.length > 1 ? "s" : ""} uploaded`}
                    </p>
                    <div className="mt-3">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Upload Image
                      </label>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                  {isUploading && (
                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center">
                        {/* <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div> */}
                        <LoadingSpinner size="xl" />
                        <span className="text-sm text-gray-500">Uploading...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Preview Gallery */}
              {images.length > 0 && (
                <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                  <div className="relative h-72">
                    {images.map((image, index) => (
                      <div
                        key={image.publicId}
                        className={`absolute inset-0 transition-opacity duration-300 ${
                          index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={`Product image ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleSetFeaturedImage(image.publicId)}
                            className={`rounded-full p-1.5 shadow-sm ${
                              featuredImageId === image.publicId
                                ? "bg-yellow-400 text-white"
                                : "bg-white text-gray-700 border border-gray-200"
                            }`}
                            title={
                              featuredImageId === image.publicId
                                ? "Current featured image"
                                : "Set as featured image"
                            }
                          >
                            <StarIcon className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(image.publicId)}
                            className="rounded-full p-1.5 bg-white text-red-500 border border-gray-200 shadow-sm hover:bg-red-50"
                            title="Remove image"
                          >
                            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={prevSlide}
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 bg-white/80 text-gray-800 hover:bg-white"
                        >
                          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={nextSlide}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 bg-white/80 text-gray-800 hover:bg-white"
                        >
                          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div className="flex p-2 overflow-x-auto space-x-2">
                      {images.map((image, index) => (
                        <button
                          key={image.publicId}
                          type="button"
                          onClick={() => setCurrentSlide(index)}
                          className={`relative flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 ${
                            index === currentSlide ? "border-blue-500" : "border-transparent"
                          }`}
                        >
                          <img
                            src={image.url}
                            alt={`Thumbnail ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          {featuredImageId === image.publicId && (
                            <div className="absolute top-0 right-0 p-0.5 bg-yellow-400 rounded-bl-md">
                              <StarIcon className="h-3 w-3 text-white" aria-hidden="true" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product Details Form */}
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-medium text-gray-900">Product Details</h2>
                <p className="text-sm text-gray-500">
                  Provide comprehensive information about your product
                </p>
              </div>

              <div className="space-y-6">
                {/* Product Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Product Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    {...register("name", { required: "Product name is required" })}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.name ? "border-red-300" : ""
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description*
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    {...register("description", { required: "Description is required" })}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.description ? "border-red-300" : ""
                    }`}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category*
                  </label>
                  <select
                    id="category"
                    {...register("category", { required: "Category is required" })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="supplements">Supplements</option>
                    <option value="wearables">Gym Wear</option>
                    <option value="equipment">Equipment</option>
                    <option value="accessories">Accessories</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Actual Price* (₹)
                    </label>
                    <input
                      type="number"
                      id="price"
                      step="0.01"
                      min="0"
                      {...register("price", {
                        required: "Price is required",
                        valueAsNumber: true,
                        min: { value: 0, message: "Price must be positive" },
                      })}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                        errors.price ? "border-red-300" : ""
                      }`}
                    />
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="discountPrice"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Selling Price (₹)
                    </label>
                    <input
                      type="number"
                      id="discountPrice"
                      step="0.01"
                      min="0"
                      {...register("discountPrice", {
                        valueAsNumber: true,
                        validate: (value, formValues) =>
                          !value || value < formValues.price || "Selling price must be less than actual price",
                      })}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                        errors.discountPrice ? "border-red-300" : ""
                      }`}
                    />
                    {errors.discountPrice && (
                      <p className="mt-1 text-sm text-red-600">{errors.discountPrice.message}</p>
                    )}
                  </div>
                </div>

                {/* Inventory */}
                <div>
                  <label htmlFor="inventory" className="block text-sm font-medium text-gray-700">
                    Inventory*
                  </label>
                  <input
                    type="number"
                    id="inventory"
                    min="0"
                    {...register("inventory", {
                      required: "Inventory is required",
                      valueAsNumber: true,
                      min: { value: 0, message: "Inventory must be non-negative" },
                    })}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.inventory ? "border-red-300" : ""
                    }`}
                  />
                  {errors.inventory && (
                    <p className="mt-1 text-sm text-red-600">{errors.inventory.message}</p>
                  )}
                </div>

                {/* Featured */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    {...register("featured")}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                    Featured Product
                  </label>
                </div>

                {/* Active */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register("isActive")}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active Product
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate("/shop")}
              className="rounded-md bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="inline-flex items-center rounded-md bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isSubmitting && (
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
              )}
              {isEditMode ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 