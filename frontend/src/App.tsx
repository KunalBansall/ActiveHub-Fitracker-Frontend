import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { Toaster } from "react-hot-toast";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import AddMember from "./pages/AddMember";
import MemberDetails from "./pages/MemberDetails";
import Attendance from "./pages/Attendance";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import SetPassword from "./pages/MemberSetPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import MemberProfile from "./pages/MemberProfile";
import MemberLoginPage from "./pages/MemberLogin";
import PrivateRoute from "./components/PrivateRoute";
import OwnerLogs from "./components/OwnerLogs";
import "./index.css";

const queryClient = new QueryClient();

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
      </Router>
    </QueryClientProvider>
  );
}
