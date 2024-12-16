import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { Toaster } from "react-hot-toast";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import PrivateRoute from "./components/PrivateRoute";
import "./index.css";

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

// Minimal layout for member-specific routes
const MemberLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return <div>{children}</div>;
};

// Admin layout with sidebar and header
const AdminLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster position="top-right" />
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
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
                    </Routes>
                  </AdminLayout>
                </PrivateRoute>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
}
