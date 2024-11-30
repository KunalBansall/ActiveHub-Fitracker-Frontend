import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import AddMember from './pages/AddMember';
import MemberDetails from './pages/MemberDetails';
import Attendance from './pages/Attendance';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import PrivateRoute from './components/PrivateRoute';
import './index.css';
import React from 'react';



const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <div className="flex flex-col h-screen bg-gray-100">
                  <Header />
                  <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <main className="flex-1 overflow-auto p-4">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/members" element={<Members />} />
                        <Route path="/members/add" element={<AddMember />} />
                        <Route path="/members/:id" element={<MemberDetails />} />
                        <Route path="/attendance" element={<Attendance />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}