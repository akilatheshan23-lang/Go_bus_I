import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AdminNavbar(){
  const { user, logout } = useAuth();

  return (
    <nav className="bg-blue-800 text-white py-3 shadow">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="font-bold text-xl">GoBus Admin</div>
          <Link to="/admin/buses" className="text-blue-100 hover:text-white">Buses</Link>
          <Link to="/admin/drivers" className="text-blue-100 hover:text-white">Drivers</Link>
          <Link to="/admin/schedules" className="text-blue-100 hover:text-white">Schedules</Link>
          <Link to="/admin/promotions" className="text-blue-100 hover:text-white">Promotions</Link>
          <Link to="/admin/payments" className="text-blue-100 hover:text-white">Payments</Link>
          <Link to="/admin/bookings" className="text-blue-100 hover:text-white">Bookings</Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">{user?.name || user?.username}</div>
          <button onClick={logout} className="bg-red-600 px-3 py-1 rounded">Logout</button>
        </div>
      </div>
    </nav>
  );
}
