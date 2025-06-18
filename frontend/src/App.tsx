import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { Toaster } from "react-hot-toast";
import { BellIcon } from "@heroicons/react/24/outline";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import OwnerLayout from "./components/owner/Layout";
import PrivateRoute from "./components/PrivateRoute";
import { CartProvider } from "./context/CartContext";
import { AdProvider } from "./context/AdContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import SubscriptionBanner from "./components/SubscriptionBanner";
import TopOverlayAdContainer from "./components/TopOverlayAdContainer";
import TopFullScreenAdContainer from "./components/TopFullScreenAdContainer";
import "./index.css";
import LoadingSpinner from './components/LoadingSpinner';
import { useSubscription } from "./context/SubscriptionContext";
// import { AuthProvider } from './context/AuthContext';


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
const OwnerLogs = lazy(() => import("./components/owner/Logs"));
const AdManager = lazy(() => import("./pages/owner/AdManager"));
const WebhookLogsPage = lazy(() => import("./pages/owner/WebhookLogsPage"));
const WebhookViewerPage = lazy(() => import("./pages/owner/WebhookViewerPage"));
const WebhookAnalyticsDashboard = lazy(() => import("./pages/owner/WebhookAnalyticsDashboard"));
const OwnerAnalyticsPage = lazy(() => import("./pages/owner/AnalyticsPage"));
const OwnerDashboardPage = lazy(() => import("./pages/owner/DashboardPage"));
const OwnerGymsPage = lazy(() => import("./pages/owner/GymsPage"));
const OwnerActivityPage = lazy(() => import("./pages/owner/ActivityPage"));
const OwnerSubscriptionsPage = lazy(() => import("./pages/owner/SubscriptionsPage"));
const DeveloperAnnouncementsPage = lazy(() => import("./pages/owner/DeveloperAnnouncementsPage"));
const AdAnalyticsDashboard = lazy(() => import("./pages/owner/AdAnalyticsDashboard"));

const Announcements = lazy(() => import("./pages/Announcements"));
const Settings = lazy(() => import("./pages/Settings"));
const RevenueDashboard = lazy(() => import("./pages/RevenueDashboard"));
const Subscription = lazy(() => import("./pages/Subscription"));

// Shop-related pages
const Shop = lazy(() => import("./pages/Shop"));
const AddEditProduct = lazy(() => import("./pages/AddEditProduct"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const MemberShop = lazy(() => import("./pages/MemberShop"));
const MemberProductDetail = lazy(() => import("./pages/MemberProductDetail"));
const MemberOrders = lazy(() => import("./pages/MemberOrders"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));

// Check if the current user is the owner
const isOwner = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'owner' || user.email === import.meta.env.VITE_OWNER_EMAIL;
  } catch (error) {
    return false;
  }
};

// Owner-only route protection with Suspense for lazy loading
const OwnerRoute: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  if (!isOwner()) {
    return <Navigate to="/" replace />;
  }
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <LoadingSpinner size="xl" />
      </div>
    }>
      {children}
    </Suspense>
  );
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

// Subscription banner component with context
const AdminSubscriptionBanner = () => {
  const { subscriptionStatus, trialEndDate, graceEndDate, subscriptionEndDate } = useSubscription();
  
  return (
    <SubscriptionBanner 
      subscriptionStatus={subscriptionStatus}
      trialEndDate={trialEndDate || undefined}
      graceEndDate={graceEndDate || undefined}
      subscriptionEndDate={subscriptionEndDate || undefined}
    />
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
          <main className="flex-1 overflow-auto p-4">
            <AdminSubscriptionBanner />
            {children}
          </main>
        </div>
      </div>
    </AdProvider>
  );
};

const App: React.FC = () => {
  return (
    // <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <SubscriptionProvider>
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

              {/* Owner Dashboard Routes - Completely separate from admin routes */}
              <Route
                path="/owner-dashboard/*"
                element={
                  <OwnerRoute>
                    <Suspense fallback={
                      <div className="flex items-center justify-center min-h-screen bg-gray-100">
                        <LoadingSpinner size="xl" />
                      </div>
                    }>
                      <OwnerLayout>
                        <Routes>
                          <Route path="/" element={<OwnerDashboardPage />} />
                          <Route path="/gyms" element={<OwnerGymsPage />} />
                          <Route path="/subscriptions" element={<OwnerSubscriptionsPage />} />
                          <Route path="/webhooks" element={<WebhookViewerPage />} />
                          <Route path="/webhooks/analytics" element={<WebhookAnalyticsDashboard />} />
                          <Route path="/products" element={<div className="p-4 bg-white rounded-lg shadow">Products Management Page (Coming Soon)</div>} />
                          <Route path="/announcements" element={<DeveloperAnnouncementsPage />} />
                          <Route path="/reports" element={<div className="p-4 bg-white rounded-lg shadow">Reports Page (Coming Soon)</div>} />
                          <Route path="/settings" element={<div className="p-4 bg-white rounded-lg shadow">Owner Settings Page (Coming Soon)</div>} />
                          <Route path="/activity" element={<OwnerActivityPage />} />
                          <Route path="/ads" element={<AdManager />} />
                          <Route path="/ad-analytics" element={<AdAnalyticsDashboard />} />
                        </Routes>
                      </OwnerLayout>
                    </Suspense>
                  </OwnerRoute>
                }
              />
              
              <Route
                path="/owner-dashboard/analytics"
                element={
                  <OwnerRoute>
                    <Suspense fallback={
                      <div className="flex items-center justify-center min-h-screen bg-gray-100">
                        <LoadingSpinner size="xl" />
                      </div>
                    }>
                      <OwnerLayout>
                        <OwnerAnalyticsPage />
                      </OwnerLayout>
                    </Suspense>
                  </OwnerRoute>
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
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/revenue" element={<RevenueDashboard />} />
                        <Route path="/subscription" element={<Subscription />} />
                        <Route path="/shop" element={<Shop />} />
                        <Route path="/shop/add-product" element={<AddEditProduct />} />
                        <Route path="/shop/products/:id" element={<ProductDetail />} />
                        <Route path="/shop/products/:id/edit" element={<AddEditProduct />} />
                        <Route path="/orders" element={<AdminOrders />} />
                        {/* Owner-only route */}
                        <Route 
                          path="/ads" 
                          element={
                            <OwnerRoute>
                              <AdManager />
                              
                            </OwnerRoute>
                          } 
                        />
                        <Route 
                          path="/webhook" 
                          element={
                            <OwnerRoute>
                              <Suspense fallback={
                                <div className="flex items-center justify-center min-h-screen bg-gray-100">
                                  <LoadingSpinner size="xl" />
                                </div>
                              }>
                                <WebhookLogsPage />
                              </Suspense>
                            </OwnerRoute>
                          } 
                        />
                      </Routes>
                    </AdminLayout>
                  </PrivateRoute>
                }
              />
            </Routes>
          </Suspense>
        </SubscriptionProvider>
      </QueryClientProvider>
    // </AuthProvider>
  );
};

export default App;
