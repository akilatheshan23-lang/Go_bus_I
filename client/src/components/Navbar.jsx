import React, { useState, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Book", path: "/booking" },
  { name: "History", path: "/history" },
  { name: "My Bookings", path: "/my-bookings" },
  { name: "Admin", path: "/admin" },
]

const Navbar = () => {
  const location = useLocation();
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  function handleClickOutside(e) {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setOpen(false);
    }
  }
  // Attach event listener
  React.useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <nav className="bg-blue-900 border-b border-blue-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z" />
              <circle cx="6.5" cy="16.5" r="1.5" />
              <circle cx="17.5" cy="16.5" r="1.5" />
            </svg>
          </div>
          <span className="font-bold text-2xl text-white">GoBus</span>
        </div>

        <ul className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <li key={link.name}>
              <Link
                to={link.path}
                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                  location.pathname === link.path
                    ? "bg-blue-700 text-white shadow"
                    : "text-blue-200 hover:text-white hover:bg-blue-600"
                }`}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Profile or Auth Buttons */}
        <div className="flex items-center gap-3 relative">
          {loading ? (
            <span className="text-blue-200 px-4 py-2">Loading...</span>
          ) : user ? (
            <>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-800 transition-colors"
                onClick={() => setOpen((o) => !o)}
              >
                <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
                  {user.name ? user.name[0].toUpperCase() : user.username[0].toUpperCase()}
                </span>
                <span>{user.name || user.username}</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {open && (
                <div ref={dropdownRef} className="absolute right-0 top-12 bg-white rounded-lg shadow-lg py-2 w-48 z-10">
                  <div className="px-4 py-2 text-blue-900 font-semibold border-b">{user.name || user.username}</div>
                  <div className="px-4 py-2 text-sm text-blue-700">Role: {user.role}</div>
                  <Link to="/my-bookings" className="block px-4 py-2 text-blue-700 hover:bg-blue-50">My Bookings</Link>
                  {user.role === "admin" && (
                    <Link to="/admin" className="block px-4 py-2 text-blue-700 hover:bg-blue-50">Admin Panel</Link>
                  )}
                  <button
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-blue-50"
                    onClick={logout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="text-blue-200 hover:text-white font-medium transition-colors px-4 py-2 rounded-lg hover:bg-blue-600">
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-blue-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar
