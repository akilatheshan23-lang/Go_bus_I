import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in when component mounts
  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      const response = await axios.get(`${API}/api/auth/me`, { 
        withCredentials: true 
      });
      setUser(response.data.user);
    } catch (error) {
      // User is not logged in or token is invalid
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(username, password) {
    try {
      const response = await axios.post(`${API}/api/auth/login`, 
        { username, password }, 
        { withCredentials: true }
      );
      
      // After successful login, get user profile
      await checkAuthStatus();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }

  async function register(name, username, password) {
    try {
      await axios.post(`${API}/api/auth/register`, 
        { name, username, password }, 
        { withCredentials: true }
      );
      
      // After successful registration, get user profile
      await checkAuthStatus();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }

  async function logout() {
    try {
      await axios.post(`${API}/api/auth/logout`, {}, { 
        withCredentials: true 
      });
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.warn("Logout request failed:", error.message);
    } finally {
      setUser(null);
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}