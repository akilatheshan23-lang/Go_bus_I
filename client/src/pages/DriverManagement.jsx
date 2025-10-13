import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import axios from "axios";
const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function DriverManagement() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [msg, setMsg] = useState("");
  
  const [driverForm, setDriverForm] = useState({
    name: "",
    phone: "",
    email: "",
    experienceYears: 0,
    licenseId: "",
    licenseType: "Heavy Vehicle",
    licenseExpiryDate: "",
    address: "",
    emergencyContact: {
      name: "",
      phone: ""
    },
    dateOfBirth: "",
    hireDate: "",
    active: true
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
      loadDrivers();
    }
  }, [user, isAuthenticated, loading, navigate]);

  useEffect(() => {
    filterDrivers();
  }, [drivers, searchTerm, statusFilter, experienceFilter]);

  async function loadDrivers() {
    try {
      const response = await axios.get(`${API}/api/admin/drivers`, { withCredentials: true });
      setDrivers(response.data);
    } catch (error) {
      setMsg("Failed to load drivers: " + (error.response?.data?.error || error.message));
    }
  }

  function filterDrivers() {
    let filtered = [...drivers];
    
    if (searchTerm) {
      filtered = filtered.filter(driver => 
        driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.phone.includes(searchTerm) ||
        driver.licenseId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(driver => 
        statusFilter === "active" ? driver.active : !driver.active
      );
    }
    
    if (experienceFilter !== "all") {
      const years = parseInt(experienceFilter);
      filtered = filtered.filter(driver => {
        if (experienceFilter === "0-2") return driver.experienceYears <= 2;
        if (experienceFilter === "3-5") return driver.experienceYears >= 3 && driver.experienceYears <= 5;
        if (experienceFilter === "6-10") return driver.experienceYears >= 6 && driver.experienceYears <= 10;
        if (experienceFilter === "10+") return driver.experienceYears > 10;
        return true;
      });
    }
    
    setFilteredDrivers(filtered);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingDriver) {
        await axios.put(`${API}/api/admin/drivers/${editingDriver._id}`, driverForm, { withCredentials: true });
        setMsg("Driver updated successfully!");
        setEditingDriver(null);
      } else {
        await axios.post(`${API}/api/admin/drivers`, driverForm, { withCredentials: true });
        setMsg("Driver added successfully!");
      }
      
      resetForm();
      loadDrivers();
    } catch (error) {
      setMsg("Error: " + (error.response?.data?.error || error.message));
    }
  }

  function resetForm() {
    setDriverForm({
      name: "",
      phone: "",
      email: "",
      experienceYears: 0,
      licenseId: "",
      licenseType: "Heavy Vehicle",
      licenseExpiryDate: "",
      address: "",
      emergencyContact: {
        name: "",
        phone: ""
      },
      dateOfBirth: "",
      hireDate: "",
      active: true
    });
    setShowAddForm(false);
    setEditingDriver(null);
  }

  function handleEdit(driver) {
    setDriverForm({
      name: driver.name || "",
      phone: driver.phone || "",
      email: driver.email || "",
      experienceYears: driver.experienceYears || 0,
      licenseId: driver.licenseId || "",
      licenseType: driver.licenseType || "Heavy Vehicle",
      licenseExpiryDate: driver.licenseExpiryDate ? driver.licenseExpiryDate.split('T')[0] : "",
      address: driver.address || "",
      emergencyContact: {
        name: driver.emergencyContact?.name || "",
        phone: driver.emergencyContact?.phone || ""
      },
      dateOfBirth: driver.dateOfBirth ? driver.dateOfBirth.split('T')[0] : "",
      hireDate: driver.hireDate ? driver.hireDate.split('T')[0] : "",
      active: driver.active !== undefined ? driver.active : true
    });
    setEditingDriver(driver);
    setShowAddForm(true);
  }

  async function handleDelete(driverId) {
    if (window.confirm("Are you sure you want to delete this driver? This action cannot be undone.")) {
      try {
        await axios.delete(`${API}/api/admin/drivers/${driverId}`, { withCredentials: true });
        setMsg("Driver deleted successfully!");
        loadDrivers();
      } catch (error) {
        setMsg("Error deleting driver: " + (error.response?.data?.error || error.message));
      }
    }
  }

  async function toggleDriverStatus(driverId, currentStatus) {
    try {
      await axios.patch(`${API}/api/admin/drivers/${driverId}/status`, 
        { active: !currentStatus }, 
        { withCredentials: true }
      );
      setMsg(`Driver ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      loadDrivers();
    } catch (error) {
      setMsg("Error updating driver status: " + (error.response?.data?.error || error.message));
    }
  }

  function isLicenseExpiring(expiryDate) {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow;
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
            <h1 className="text-4xl font-bold text-gray-900">Driver Management</h1>
            <p className="text-gray-600">Manage drivers, licenses, and certifications</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
          >
            {showAddForm ? "Cancel" : "Add New Driver"}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Total Drivers</div>
            <div className="text-3xl font-bold text-gray-900">{drivers.length}</div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Active Drivers</div>
            <div className="text-3xl font-bold text-green-600">{drivers.filter(d => d.active).length}</div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Licenses Expiring Soon</div>
            <div className="text-3xl font-bold text-orange-600">
              {drivers.filter(d => isLicenseExpiring(d.licenseExpiryDate)).length}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <select
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Experience</option>
              <option value="0-2">0-2 years</option>
              <option value="3-5">3-5 years</option>
              <option value="6-10">6-10 years</option>
              <option value="10+">10+ years</option>
            </select>
            <div className="flex items-center text-sm text-gray-600">
              Showing {filteredDrivers.length} of {drivers.length} drivers
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              {editingDriver ? "Edit Driver" : "Add New Driver"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Personal Information</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      value={driverForm.name}
                      onChange={(e) => setDriverForm({...driverForm, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Phone Number *</label>
                    <input
                      type="tel"
                      value={driverForm.phone}
                      onChange={(e) => setDriverForm({...driverForm, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={driverForm.email}
                      onChange={(e) => setDriverForm({...driverForm, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      value={driverForm.dateOfBirth}
                      onChange={(e) => setDriverForm({...driverForm, dateOfBirth: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Hire Date</label>
                    <input
                      type="date"
                      value={driverForm.hireDate}
                      onChange={(e) => setDriverForm({...driverForm, hireDate: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="driverActive"
                      checked={driverForm.active}
                      onChange={(e) => setDriverForm({...driverForm, active: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="driverActive" className="text-sm font-medium text-gray-700">Active</label>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={driverForm.address}
                    onChange={(e) => setDriverForm({...driverForm, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows="2"
                  />
                </div>
              </div>

              {/* License Information */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">License & Experience</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">License ID *</label>
                    <input
                      type="text"
                      value={driverForm.licenseId}
                      onChange={(e) => setDriverForm({...driverForm, licenseId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">License Type</label>
                    <select
                      value={driverForm.licenseType}
                      onChange={(e) => setDriverForm({...driverForm, licenseType: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="Heavy Vehicle">Heavy Vehicle</option>
                      <option value="Light Vehicle">Light Vehicle</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">License Expiry Date</label>
                    <input
                      type="date"
                      value={driverForm.licenseExpiryDate}
                      onChange={(e) => setDriverForm({...driverForm, licenseExpiryDate: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Experience (Years)</label>
                    <input
                      type="number"
                      value={driverForm.experienceYears}
                      onChange={(e) => setDriverForm({...driverForm, experienceYears: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>



              {/* Emergency Contact */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Emergency Contact</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Contact Name</label>
                    <input
                      type="text"
                      value={driverForm.emergencyContact.name}
                      onChange={(e) => setDriverForm({
                        ...driverForm, 
                        emergencyContact: {...driverForm.emergencyContact, name: e.target.value}
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Contact Phone</label>
                    <input
                      type="tel"
                      value={driverForm.emergencyContact.phone}
                      onChange={(e) => setDriverForm({
                        ...driverForm, 
                        emergencyContact: {...driverForm.emergencyContact, phone: e.target.value}
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  {editingDriver ? "Update Driver" : "Add Driver"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Driver List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Driver Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Driver Details</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">License</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Experience</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDrivers.map((driver) => (
                  <tr key={driver._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{driver.name}</div>
                        <div className="text-sm text-gray-500">{driver.phone}</div>
                        {driver.email && <div className="text-sm text-gray-500">{driver.email}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>ID: {driver.licenseId}</div>
                        <div>Type: {driver.licenseType || 'Heavy Vehicle'}</div>
                        {driver.licenseExpiryDate && (
                          <div className={
                            isLicenseExpiring(driver.licenseExpiryDate) 
                              ? "text-red-600 font-semibold" 
                              : "text-gray-600"
                          }>
                            Expires: {new Date(driver.licenseExpiryDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{driver.experienceYears} years</div>
                        {driver.hireDate && (
                          <div className="text-gray-500">
                            Hired: {new Date(driver.hireDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        driver.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {driver.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2 text-sm font-medium whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(driver)}
                        className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleDriverStatus(driver._id, driver.active)}
                        className={`${
                          driver.active ? 'text-orange-600 hover:text-orange-600 bg-orange-600/30 p-2 rounded' : 'text-green-600 hover:text-green-800 bg-green-600/30 p-2 rounded'
                        }`}
                      >
                        {driver.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(driver._id)}
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
          {filteredDrivers.length === 0 && (
            <div className="py-12 text-center">
              <div className="text-gray-500">No drivers found matching your criteria.</div>
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