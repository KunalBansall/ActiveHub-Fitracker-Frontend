import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { Toaster } from "react-hot-toast";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import PrivateRoute from "./components/PrivateRoute";
import { CartProvider } from "./context/CartContext";
import { AdProvider } from "./context/AdContext";
import TopOverlayAdContainer from "./components/TopOverlayAdContainer";
import TopFullScreenAdContainer from "./components/TopFullScreenAdContainer";
import "./index.css";
import LoadingSpinner from './components/LoadingSpinner';

const queryClient = new QueryClient();

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Members = lazy(() => import("./pages/Members"));
const AddMember = lazy(() => import("./pages/AddMember"));
const MemberDetails = lazy(() => import("./pages/MemberDetails"));
const Attendance = lazy(() => import("./pages/Attendance"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const MemberLoginPage = lazy(() => import("./pages/MemberLogin"));
const SetPassword = lazy(() => import("./pages/MemberSetPassword"));
const OwnerLogs = lazy(() => import("./components/OwnerLogs"));
const AdManager = lazy(() => import("./pages/AdManager"));
const Announcements = lazy(() => import("./pages/Announcements"));

// Shop-related pages
const Shop = lazy(() => import("./pages/Shop"));
const AddEditProduct = lazy(() => import("./pages/AddEditProduct"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const MemberShop = lazy(() => import("./pages/MemberShop"));
const MemberProductDetail = lazy(() => import("./pages/MemberProductDetail"));
const MemberOrders = lazy(() => import("./pages/MemberOrders"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));

// Add to lazy imports at the top
const CloudinaryTest = lazy(() => import("./components/CloudinaryTest"));

// Check if the current user is the owner
const isOwner = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'owner' || user.email === import.meta.env.VITE_OWNER_EMAIL;
  } catch (error) {
    return false;
  }
};

// Owner-only route protection
const OwnerRoute: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  if (!isOwner()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Minimal layout for member-specific routes
const MemberLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <AdProvider role="member">
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <TopFullScreenAdContainer />
          <TopOverlayAdContainer />
          {children}
        </div>
      </CartProvider>
    </AdProvider>
  );
};

// Admin layout with sidebar and header
const AdminLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <AdProvider role="admin">
      <div className="flex flex-col h-screen bg-gray-100">
        <TopFullScreenAdContainer />
        <TopOverlayAdContainer />
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto p-4">{children}</main>
        </div>
      </div>
    </AdProvider>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <LoadingSpinner size="xl" />
          </div>
        }
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/reset-password/:id/:token"
            element={<ResetPassword />}
          />
          <Route path="/cloudinary-test" element={<CloudinaryTest />} />

          {/* Member-specific routes */}
          <Route path="/memberlogin" element={<MemberLoginPage />} />
          <Route path="/set-password/:id/:token" element={<SetPassword />} />
          <Route
            path="/member/:id"
            element={
              <MemberLayout>
                <MemberProfile />
              </MemberLayout>
            }
          />
          <Route
            path="/member-shop"
            element={
              <MemberLayout>
                <MemberShop />
              </MemberLayout>
            }
          />
          <Route
            path="/member-shop/product/:id"
            element={
              <MemberLayout>
                <MemberProductDetail />
              </MemberLayout>
            }
          />
          <Route
            path="/member-orders"
            element={
              <MemberLayout>
                <MemberOrders />
              </MemberLayout>
            }
          />

          {/* Admin-specific routes (protected by PrivateRoute) */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/members" element={<Members />} />
                    <Route path="/members/add" element={<AddMember />} />
                    <Route path="/members/:id" element={<MemberDetails />} />
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/owner-logs" element={<OwnerLogs />} />
                    <Route path="/announcements" element={<Announcements />} />
                    {/* Owner-only route */}
                    <Route 
                      path="/ads" 
                      element={
                        <OwnerRoute>
                          <AdManager />
                        </OwnerRoute>
                      } 
                    />
                    
                    {/* Shop Routes */}
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/shop/add-product" element={<AddEditProduct />} />
                    <Route path="/shop/products/:id" element={<ProductDetail />} />
                    <Route path="/shop/products/:id/edit" element={<AddEditProduct />} />
                    <Route path="/orders" element={<AdminOrders />} />
                  </Routes>
                </AdminLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Suspense>
    </QueryClientProvider>
  );
}
