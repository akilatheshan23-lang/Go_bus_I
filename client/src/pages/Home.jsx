import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import axios from "axios";
const API = import.meta.env.VITE_API_URL || "http://localhost:5001";
export default function Home(){
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(()=>{ (async()=>{
    try{
      const [s,b,d] = await Promise.all([
        axios.get(`${API}/api/public/schedules`),
        axios.get(`${API}/api/public/buses`),
        axios.get(`${API}/api/public/drivers`),
      ]);
      setSchedules(s.data); setBuses(b.data); setDrivers(d.data);
    }catch(e){ setError(e.message); } finally{ setLoading(false); }
  })(); },[]);
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-2xl font-bold text-gray-800">Available Schedules</h2>
          {loading && <div className="py-8 text-center text-gray-600">Loading…</div>}
          {error && <div className="px-4 py-3 mb-4 text-red-700 border border-red-200 rounded bg-red-50">Error: {error}</div>}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {schedules.map(it => (
              <div key={it._id} className="p-4 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-lg font-semibold text-gray-800">
                    <span className="text-blue-600">{it.from}</span> → <span className="text-blue-600">{it.to}</span>
                  </div>
                  <div className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">
                    {new Date(it.date).toDateString()}
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>Departure: <span className="font-semibold text-gray-800">{it.departureTime}</span> | Arrival: <span className="font-semibold text-gray-800">{it.arrivalTime}</span></div>
                  <div>Close: <span className="font-semibold text-gray-800">{it.bookingCloseTime}</span> | Price: <span className="font-semibold text-green-600">LKR {it.price}</span></div>
                  <div>Bus: <span className="font-semibold text-gray-800">{it.bus?.busNo}</span> ({it.bus?.model}, {it.bus?.type})</div>
                  <div>Driver: <span className="font-semibold text-gray-800">{it.driver?.name}</span> ({it.driver?.experienceYears} yrs)</div>
                </div>
                <div className="mt-4">
                  <button 
                    className="w-full px-4 py-2 font-semibold text-white transition-colors bg-blue-500 rounded hover:bg-blue-600"
                    onClick={() => {
                      if (isAuthenticated) {
                        navigate(`/booking/${it._id}`);
                      } else {
                        navigate('/login');
                      }
                    }}
                  >
                    Book Seat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="mb-4 text-xl font-bold text-gray-800">Active Buses</h3>
            <ul className="space-y-2">
              {buses.map(b => (
                <li key={b._id} className="pb-2 text-sm text-gray-600 border-b border-gray-100">
                  {b.busNo} • {b.model} • {b.type} • {b.capacity} • {b.depot}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="mb-4 text-xl font-bold text-gray-800">Drivers</h3>
            <ul className="space-y-2">
              {drivers.map(d => (
                <li key={d._id} className="pb-2 text-sm text-gray-600 border-b border-gray-100">
                  {d.name} — {d.phone} — {d.experienceYears} yrs — {d.licenseId}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
