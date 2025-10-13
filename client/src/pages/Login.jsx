import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

function checkStrength(pw){
  const rules = [/.{8,}/, /[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/];
  const score = rules.reduce((s, r)=> s + (r.test(pw)?1:0), 0);
  return { score, ok: score===5 };
}

export default function Login(){
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const strength = useMemo(()=>checkStrength(password), [password]);

  // Redirect to home if user is already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  async function submit(e){
    e.preventDefault();
    setSubmitting(true);
    setMsg("");

    try{
      if(mode==="login"){
        const result = await login(username, password);
        if (result.success) {
          setMsg("Logged in successfully!");
          // Navigation will be handled by useEffect when isAuthenticated changes
        } else {
          setMsg(result.error);
        }
      } else {
        if(!strength.ok){ 
          setMsg("Use a strong password (8+, upper, lower, number, symbol)."); 
          setSubmitting(false);
          return; 
        }
        const result = await register(name, username, password);
        if (result.success) {
          setMsg("Account created & logged in!");
          // Navigation will be handled by useEffect when isAuthenticated changes
        } else {
          setMsg(result.error);
        }
      }
    } catch(e) { 
      setMsg("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Sign In</h2>
          <div className="flex gap-2">
            <button 
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                mode === "login" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button 
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                mode === "create" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
              onClick={() => setMode("create")}
            >
              Create Account
            </button>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "create" && (
            <input 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
              placeholder="Full Name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          )}
          <input 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
            placeholder="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
          />
          <input 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
            placeholder="Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
          {mode === "create" && (
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              Strength: {strength.score}/5 — need 8+ chars with upper, lower, number, symbol.
            </div>
          )}
          <button 
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors" 
            type="submit" 
            disabled={submitting}
          >
            {submitting ? "Please wait..." : (mode === "login" ? "Sign In" : "Create Account")}
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
      </div>
    </div>
  );
}
