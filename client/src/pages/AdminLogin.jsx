import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

function checkStrength(pw){
  const rules = [/.{8,}/, /[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/];
  const score = rules.reduce((s, r)=> s + (r.test(pw)?1:0), 0);
  return { score, ok: score===5 };
}

export default function AdminLogin(){
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect admin to admin panel if already logged in as admin
  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      navigate("/admin");
    }
  }, [isAuthenticated, user, navigate]);

  async function submit(e){
    e.preventDefault();
    setSubmitting(true);
    setMsg("");

    try{
      const result = await login(username, password);
      if (result.success) {
        // Check if the logged-in user is an admin
        // We'll get the updated user info from the context
        setMsg("Logged in successfully!");
        // Navigation will be handled by useEffect when user state updates
      } else {
        setMsg(result.error);
      }
    } catch(e) { 
      setMsg("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Check if user is logged in but not admin
  if (isAuthenticated && user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Access Required</h2>
          <p className="text-gray-600 mb-4">You are logged in as a regular user. Admin access is required to view this page.</p>
          <p className="text-gray-600">Please log out and log in with admin credentials.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Sign In</h2>
        <form onSubmit={submit} className="space-y-4">
          <input 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
            placeholder="Admin Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required
          />
          <input 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
            placeholder="Admin Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required
          />
          <button 
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors" 
            type="submit" 
            disabled={submitting}
          >
            {submitting ? "Signing In..." : "Sign In as Admin"}
          </button>
        </form>
        {msg && (
          <div className={`mt-4 p-3 rounded ${
            msg.includes('Error') || msg.includes('Please') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {msg}
          </div>
        )}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <strong className="text-blue-800">Default Admin Credentials:</strong><br/>
          Username: <code className="bg-blue-100 px-1 rounded">admin</code><br/>
          Password: <code className="bg-blue-100 px-1 rounded">Admin@123</code>
        </div>
      </div>
    </div>
  );
}
