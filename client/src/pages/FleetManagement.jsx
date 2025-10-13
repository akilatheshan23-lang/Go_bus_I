import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import axios from "axios";
const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function FleetManagement() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [msg, setMsg] = useState("");
  
  const [busForm, setBusForm] = useState({
    busNo: "",
    model: "Ashok Leyland",
    type: "normal",
    capacity: 54,
    depot: "",
    active: true,
    lastMaintenanceDate: "",
    insurance: {
      policyNumber: "",
      provider: "",
      expiryDate: ""
    }
  });

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/admin/login");
        return;
      }
      if (user?.role !== "admin") {
        navigate("/admin");
        return;
      }
      loadBuses();
    }
  }, [user, isAuthenticated, loading, navigate]);

  useEffect(() => {
    filterBuses();
  }, [buses, searchTerm, statusFilter, typeFilter]);

  async function loadBuses() {
    try {
      const response = await axios.get(`${API}/api/admin/buses`, { withCredentials: true });
      setBuses(response.data);
    } catch (error) {
      setMsg("Failed to load buses: " + (error.response?.data?.error || error.message));
    }
  }

  function filterBuses() {
    let filtered = [...buses];
    
    if (searchTerm) {
      filtered = filtered.filter(bus => 
        bus.busNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.depot.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(bus => 
        statusFilter === "active" ? bus.active : !bus.active
      );
    }
    
    if (typeFilter !== "all") {
      filtered = filtered.filter(bus => bus.type === typeFilter);
    }
    
    setFilteredBuses(filtered);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingBus) {
        await axios.put(`${API}/api/admin/buses/${editingBus._id}`, busForm, { withCredentials: true });
        setMsg("Bus updated successfully!");
        setEditingBus(null);
      } else {
        await axios.post(`${API}/api/admin/buses`, busForm, { withCredentials: true });
        setMsg("Bus added successfully!");
      }
      
      resetForm();
      loadBuses();
    } catch (error) {
      setMsg("Error: " + (error.response?.data?.error || error.message));
    }
  }

  function resetForm() {
    setBusForm({
      busNo: "",
      model: "Ashok Leyland",
      type: "normal", 
      capacity: 54,
      depot: "",
      active: true,
      lastMaintenanceDate: "",
      insurance: {
        policyNumber: "",
        provider: "",
        expiryDate: ""
      }
    });
    setShowAddForm(false);
    setEditingBus(null);
  }

  function handleEdit(bus) {
    setBusForm({
      busNo: bus.busNo || "",
      model: bus.model || "Ashok Leyland",
      type: bus.type || "normal",
      capacity: bus.capacity || 54,
      depot: bus.depot || "",
      active: bus.active !== undefined ? bus.active : true,
      lastMaintenanceDate: bus.lastMaintenanceDate ? bus.lastMaintenanceDate.split('T')[0] : "",
      insurance: {
        policyNumber: bus.insurance?.policyNumber || "",
        provider: bus.insurance?.provider || "",
        expiryDate: bus.insurance?.expiryDate ? bus.insurance.expiryDate.split('T')[0] : ""
      }
    });
    setEditingBus(bus);
    setShowAddForm(true);
  }

  async function handleDelete(busId) {
    if (window.confirm("Are you sure you want to delete this bus? This action cannot be undone.")) {
      try {
        await axios.delete(`${API}/api/admin/buses/${busId}`, { withCredentials: true });
        setMsg("Bus deleted successfully!");
        loadBuses();
      } catch (error) {
        setMsg("Error deleting bus: " + (error.response?.data?.error || error.message));
      }
    }
  }

  async function toggleBusStatus(busId, currentStatus) {
    try {
      await axios.patch(`${API}/api/admin/buses/${busId}/status`, 
        { active: !currentStatus }, 
        { withCredentials: true }
      );
      setMsg(`Bus ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      loadBuses();
    } catch (error) {
      setMsg("Error updating bus status: " + (error.response?.data?.error || error.message));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button 
              onClick={() => navigate("/admin")}
              className="flex items-center mb-2 text-blue-600 hover:text-blue-800"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-gray-900">Fleet Management</h1>
            <p className="text-gray-600">Manage your bus fleet, maintenance, and operations</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center px-6 py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {showAddForm ? "Cancel" : "Add New Bus"}
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <input
              type="text"
              placeholder="Search buses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="normal">Normal</option>
              <option value="luxury">Luxury</option>
            </select>
            <div className="flex items-center text-sm text-gray-600">
              Showing {filteredBuses.length} of {buses.length} buses
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              {editingBus ? "Edit Bus" : "Add New Bus"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Basic Information</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Bus Number *</label>
                    <input
                      type="text"
                      value={busForm.busNo}
                      onChange={(e) => setBusForm({...busForm, busNo: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Model</label>
                    <select
                      value={busForm.model}
                      onChange={(e) => setBusForm({...busForm, model: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Ashok Leyland">Ashok Leyland</option>
                      <option value="TATA">TATA</option>
                      <option value="Yutong">Yutong</option>
                      <option value="Coaster">Coaster</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={busForm.type}
                      onChange={(e) => setBusForm({...busForm, type: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="normal">Normal</option>
                      <option value="luxury">Luxury</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Capacity</label>
                    <input
                      type="number"
                      value={busForm.capacity}
                      onChange={(e) => setBusForm({...busForm, capacity: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Depot</label>
                    <input
                      type="text"
                      value={busForm.depot}
                      onChange={(e) => setBusForm({...busForm, depot: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      checked={busForm.active}
                      onChange={(e) => setBusForm({...busForm, active: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="active" className="text-sm font-medium text-gray-700">Active</label>
                  </div>
                </div>
              </div>

             

              {/* Maintenance */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Maintenance</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Last Maintenance Date</label>
                    <input
                      type="date"
                      value={busForm.lastMaintenanceDate}
                      onChange={(e) => setBusForm({...busForm, lastMaintenanceDate: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                 
                </div>
              </div>

              {/* Insurance */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Insurance</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Policy Number</label>
                    <input
                      type="text"
                      value={busForm.insurance.policyNumber}
                      onChange={(e) => setBusForm({
                        ...busForm, 
                        insurance: {...busForm.insurance, policyNumber: e.target.value}
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Insurance Provider</label>
                    <input
                      type="text"
                      value={busForm.insurance.provider}
                      onChange={(e) => setBusForm({
                        ...busForm, 
                        insurance: {...busForm.insurance, provider: e.target.value}
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Insurance Expiry Date</label>
                    <input
                      type="date"
                      value={busForm.insurance.expiryDate}
                      onChange={(e) => setBusForm({
                        ...busForm, 
                        insurance: {...busForm.insurance, expiryDate: e.target.value}
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  {editingBus ? "Update Bus" : "Add Bus"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bus List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Fleet Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Bus Details</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Specifications</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Maintenance</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBuses.map((bus) => (
                  <tr key={bus._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{bus.busNo}</div>
                        <div className="text-sm text-gray-500">{bus.model}</div>
                        <div className="text-sm text-gray-500">Depot: {bus.depot || 'Not specified'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Type: <span className="font-medium capitalize">{bus.type}</span></div>
                        <div>Capacity: <span className="font-medium">{bus.capacity}</span> seats</div>
                        {bus.plateNumber && <div>Plate: {bus.plateNumber}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {bus.lastMaintenanceDate && (
                          <div>Last: {new Date(bus.lastMaintenanceDate).toLocaleDateString()}</div>
                        )}
                        {bus.nextMaintenanceDate && (
                          <div className={
                            new Date(bus.nextMaintenanceDate) < new Date() 
                              ? "text-red-600 font-semibold" 
                              : "text-green-600"
                          }>
                            Next: {new Date(bus.nextMaintenanceDate).toLocaleDateString()}
                          </div>
                        )}
                        {!bus.lastMaintenanceDate && !bus.nextMaintenanceDate && (
                          <div className="text-gray-400">Not scheduled</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        bus.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {bus.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2 text-sm font-medium whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(bus)}
                        className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleBusStatus(bus._id, bus.active)}
                        className={`${
                          bus.active ? 'text-orange-600 hover:text-orange-800 bg-orange-600/30 p-2 rounded' : 'text-green-600 hover:text-green-800 bg-green-600/30 p-2 rounded'
                        }`}
                      >
                        {bus.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(bus._id)}
                        className="p-2 text-red-600 rounded bg-red-600/30 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredBuses.length === 0 && (
            <div className="py-12 text-center">
              <div className="text-gray-500">No buses found matching your criteria.</div>
            </div>
          )}
        </div>

        {/* Messages */}
        {msg && (
          <div className={`mt-6 p-4 rounded-lg ${
            msg.includes('Error') || msg.includes('Failed')
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