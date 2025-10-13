import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import Home from "./pages/Home.jsx";
import HomepagePage from "./pages/Homepage.jsx";
import BusDetails from "./pages/BusDetails.jsx";
import Login from "./pages/Login.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import ManagePromotion from "./pages/ManagePromotion.jsx";
import ManagePayments from "./pages/ManagePayments.jsx";
import ManageBookings from "./pages/ManageBookings.jsx";
import BookingHistory from "./pages/BookingHistory.jsx";
import BusManagement from "./pages/BusManagement.jsx";
import DriverManagement from "./pages/DriverManagement.jsx";
import ScheduleManagement from "./pages/ScheduleManagement.jsx";
import Booking from "./pages/Booking.jsx";
import Summary from "./pages/Summary.jsx";
import UserPaymentPage from "./pages/UserPaymentPage.jsx";
import ReceiptPage from "./pages/ReceiptPage.jsx";
import "./index.css";
import RootLayout from "./layouts/RootLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";

function Layout({ children }) {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="font-bold text-xl text-gray-800">GoBus</div>
            
            <nav className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </Link>
              {loading ? (
                <span className="text-gray-600 text-sm">Loading...</span>
              ) : user ? (
                <>
                  {user.role !== "admin" && (
                    <Link 
                      to="/my-bookings" 
                      className="text-green-600 hover:text-green-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      My Bookings
                    </Link>
                  )}
                  <span className="text-gray-600 text-sm">Welcome, {user.name || user.username}</span>
                  {user.role === "admin" && (
                    <Link 
                      to="/admin" 
                      className="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button 
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/admin/login" 
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Admin
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="bg-gray-800 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          © {new Date().getFullYear()} GoBus
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootLayout><HomepagePage /></RootLayout>} />
          <Route path="/login" element={<RootLayout><Login /></RootLayout>} />
          <Route path="/my-bookings" element={<RootLayout><BookingHistory /></RootLayout>} />
          <Route path="/booking/:scheduleId" element={<RootLayout><Booking /></RootLayout>} />
          <Route path="/bus-details" element={<RootLayout><BusDetails /></RootLayout>} />
          <Route path="/booking/:scheduleId/summary" element={<RootLayout><Summary /></RootLayout>} />
          <Route path="/payment" element={<RootLayout><UserPaymentPage /></RootLayout>} />
          <Route path="/receipt/:id" element={<RootLayout><ReceiptPage /></RootLayout>} />
          <Route path="/booking" element={<RootLayout><Booking /></RootLayout>} />

          <Route path="/admin/login" element={<RootLayout><AdminLogin /></RootLayout>} />
          <Route path="/admin" element={<AdminLayout><AdminPanel /></AdminLayout>} />
          <Route path="/admin/buses" element={<AdminLayout><BusManagement /></AdminLayout>} />
          <Route path="/admin/drivers" element={<AdminLayout><DriverManagement /></AdminLayout>} />
          <Route path="/admin/schedules" element={<AdminLayout><ScheduleManagement /></AdminLayout>} />
          <Route path="/admin/promotions" element={<AdminLayout><ManagePromotion /></AdminLayout>} />
          <Route path="/admin/payments" element={<AdminLayout><ManagePayments /></AdminLayout>} />
          <Route path="/admin/bookings" element={<AdminLayout><ManageBookings /></AdminLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
createRoot(document.getElementById("root")).render(<App />);
