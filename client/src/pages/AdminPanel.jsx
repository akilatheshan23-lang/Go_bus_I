import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import axios from "axios";
const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function AdminPanel(){
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [newAdmin, setNewAdmin] = useState({ name:"", username:"", password:"" });

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/admin/login");
        return;
      }
      if (user?.role !== "admin") {
        setMsg("Access denied. Admin privileges required.");
        setTimeout(() => navigate("/admin/login"), 2000);
        return;
      }
    }
  }, [user, isAuthenticated, loading, navigate]);

  if(!user) return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="p-8 text-center bg-white rounded-lg shadow-md">
        <div className="text-lg text-gray-600">Checking session…</div>
        {msg && <div className="px-4 py-3 mt-4 text-red-700 rounded bg-red-50">{msg}</div>}
      </div>
    </div>
  );
  if(user.role!=="admin") return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="p-8 text-center bg-white rounded-lg shadow-md">
        <div className="text-lg text-red-600">Admin only</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your bus reservation system from here</p>
        </div>

        {/* Management Sections Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Bus Management */}
          <div 
            onClick={() => navigate('/admin/buses')}
            className="p-6 transition-all duration-300 bg-white border shadow-lg cursor-pointer rounded-xl hover:shadow-xl hover:border-blue-200 group"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 transition-colors bg-blue-100 rounded-lg group-hover:bg-blue-200">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2a2 2 0 00-2-2H8z" />
                </svg>
              </div>
              <h3 className="ml-3 text-xl font-semibold text-gray-800">Bus Management</h3>
            </div>
            <p className="mb-4 text-gray-600">Manage buses, models, capacity and depot information</p>
            <div className="flex items-center font-medium text-blue-600">
              <span>Manage Buses</span>
              <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Driver Management */}
          <div 
            onClick={() => navigate('/admin/drivers')}
            className="p-6 transition-all duration-300 bg-white border shadow-lg cursor-pointer rounded-xl hover:shadow-xl hover:border-green-200 group"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 transition-colors bg-green-100 rounded-lg group-hover:bg-green-200">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="ml-3 text-xl font-semibold text-gray-800">Driver Management</h3>
            </div>
            <p className="mb-4 text-gray-600">Manage driver profiles, licenses and experience records</p>
            <div className="flex items-center font-medium text-green-600">
              <span>Manage Drivers</span>
              <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Schedule Management */}
          <div 
            onClick={() => navigate('/admin/schedules')}
            className="p-6 transition-all duration-300 bg-white border shadow-lg cursor-pointer rounded-xl hover:shadow-xl hover:border-purple-200 group"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 transition-colors bg-purple-100 rounded-lg group-hover:bg-purple-200">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="ml-3 text-xl font-semibold text-gray-800">Schedule Management</h3>
            </div>
            <p className="mb-4 text-gray-600">Create and manage bus schedules, routes and timings</p>
            <div className="flex items-center font-medium text-purple-600">
              <span>Manage Schedules</span>
              <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Promotion Management */}
          <div 
            onClick={() => navigate('/admin/promotions')}
            className="p-6 transition-all duration-300 bg-white border shadow-lg cursor-pointer rounded-xl hover:shadow-xl hover:border-orange-200 group"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 transition-colors bg-orange-100 rounded-lg group-hover:bg-orange-200">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="ml-3 text-xl font-semibold text-gray-800">Promotion Management</h3>
            </div>
            <p className="mb-4 text-gray-600">Create and manage discount codes and promotional offers</p>
            <div className="flex items-center font-medium text-orange-600">
              <span>Manage Promotions</span>
              <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Payment Management */}
          <div 
            onClick={() => navigate('/admin/payments')}
            className="p-6 transition-all duration-300 bg-white border shadow-lg cursor-pointer rounded-xl hover:shadow-xl hover:border-yellow-200 group"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 transition-colors bg-yellow-100 rounded-lg group-hover:bg-yellow-200">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="ml-3 text-xl font-semibold text-gray-800">Payment Management</h3>
            </div>
            <p className="mb-4 text-gray-600">Monitor payment transactions and refund processing</p>
            <div className="flex items-center font-medium text-yellow-600">
              <span>Manage Payments</span>
              <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Booking Management */}
          <div 
            onClick={() => navigate('/admin/bookings')}
            className="p-6 transition-all duration-300 bg-white border shadow-lg cursor-pointer rounded-xl hover:shadow-xl hover:border-red-200 group"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 transition-colors bg-red-100 rounded-lg group-hover:bg-red-200">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="ml-3 text-xl font-semibold text-gray-800">Booking Management</h3>
            </div>
            <p className="mb-4 text-gray-600">View and manage customer bookings and reservations</p>
            <div className="flex items-center font-medium text-red-600">
              <span>Manage Bookings</span>
              <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Admin Creation Section */}
        <div className="p-8 bg-white shadow-lg rounded-xl">
          <h3 className="mb-6 text-2xl font-semibold text-gray-800">Create New Admin</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <input 
              className="px-4 py-3 transition-all border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Full Name" 
              value={newAdmin.name} 
              onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} 
            />
            <input 
              className="px-4 py-3 transition-all border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Username" 
              value={newAdmin.username} 
              onChange={e => setNewAdmin({...newAdmin, username: e.target.value})} 
            />
            <input 
              className="px-4 py-3 transition-all border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Password (strong)" 
              type="password" 
              value={newAdmin.password} 
              onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} 
            />
            <button 
              className="px-4 py-3 font-semibold text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600"
              onClick={async() => {
                try{ 
                  await axios.post(`${API}/api/admin/create-admin`, newAdmin, { withCredentials: true }); 
                  setMsg("Admin created successfully"); 
                  setNewAdmin({ name: "", username: "", password: "" });
                }
                catch(e){ 
                  setMsg("Error: " + (e.response?.data?.error || e.message)); 
                }
              }}
            >
              Create Admin
            </button>
          </div>

          {msg && (
            <div className={`p-4 rounded mt-6 ${
              msg.includes('Error') || msg.includes('Access denied') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
