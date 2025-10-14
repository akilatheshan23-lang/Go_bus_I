import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import axios from "axios";
import { generateSchedulePDF } from "../utils/pdfUtils.js";


const API = import.meta.env.VITE_API_URL || "http://localhost:5002";


export default function ScheduleManagement() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [routeFilter, setRouteFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [msg, setMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  
  const [scheduleForm, setScheduleForm] = useState({
    from: "",
    to: "",
    date: "",
    departureTime: "",
    arrivalTime: "",
    bookingCloseTime: "",
    price: 1200,
    bus: "",
    active: true,
    recurringDays: [],
    endRecurringDate: "",
    notes: ""
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const popularRoutes = [
    { from: 'Colombo', to: 'Kandy' },
    { from: 'Colombo', to: 'Galle' },
    { from: 'Kandy', to: 'Nuwara Eliya' },
    { from: 'Colombo', to: 'Jaffna' },
    { from: 'Kandy', to: 'Colombo' },
    { from: 'Galle', to: 'Colombo' }
  ];

  // Validation helper functions
  const validateLocationField = (value) => {
    const letterOnlyRegex = /^[A-Za-z\s]*$/;
    return letterOnlyRegex.test(value);
  };

  const handleLocationChange = (field, value) => {
    if (validateLocationField(value)) {
      const newForm = {...scheduleForm, [field]: value};
      setScheduleForm(newForm);
      
      // Check if both fields have values and are the same
      if (newForm.from && newForm.to && 
          newForm.from.toLowerCase().trim() === newForm.to.toLowerCase().trim()) {
        setFieldErrors({...fieldErrors, [field]: "From and To locations cannot be the same"});
      } else {
        setFieldErrors({...fieldErrors, [field]: ""});
      }
    }
  };

  

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
      loadData();
    }
  }, [user, isAuthenticated, loading, navigate]);

  useEffect(() => {
    filterSchedules();
  }, [schedules, searchTerm, routeFilter, dateFilter, statusFilter]);

  async function loadData() {
    try {
      const [schedulesRes, busesRes] = await Promise.all([
        axios.get(`${API}/api/admin/schedules`, { withCredentials: true }),
        axios.get(`${API}/api/admin/buses`, { withCredentials: true }),
      ]);
      setSchedules(schedulesRes.data);
      setBuses(busesRes.data.filter(b => b.active));
    } catch (error) {
      setMsg("Failed to load data: " + (error.response?.data?.error || error.message));
    }
  }

  useEffect(() => {
    if (scheduleForm.departureTime) {
      const [hours, minutes] = scheduleForm.departureTime.split(':').map(Number);
      let totalMinutes = hours * 60 + minutes - 30;
      
      if (totalMinutes < 0) {
        totalMinutes += 24 * 60;
      }
      
      const closeHours = Math.floor(totalMinutes / 60) % 24;
      const closeMinutes = totalMinutes % 60;
      const bookingCloseTime = String(closeHours).padStart(2, '0') + ':' + String(closeMinutes).padStart(2, '0');
      
      setScheduleForm(prev => ({
        ...prev,
        bookingCloseTime
      }));

      // VALIDATION: ensure bookingCloseTime is before departureTime and not in the past for today's date
      const timeToMinutes = (t) => {
        if (!t) return null;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };

      const depMinutes = timeToMinutes(scheduleForm.departureTime);
      const closeMinutesVal = timeToMinutes(bookingCloseTime);

      // default clear
      let bookingCloseError = "";
      let departureError = "";

      if (closeMinutesVal === null || depMinutes === null) {
        bookingCloseError = "";
      } else {
        // check that booking close is strictly before departure
        if (closeMinutesVal >= depMinutes) {
          bookingCloseError = "Booking close time must be before departure time.";
        } else {
          // if schedule date is today, ensure booking close hasn't already passed
          const todayStr = new Date().toISOString().split('T')[0];
          if (scheduleForm.date === todayStr) {
            const now = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            if (closeMinutesVal <= nowMinutes) {
              bookingCloseError = "Booking close time is already in the past for the selected date.";
            }
          }
        }
      }

      // If date is today, ensure departure is in the future
      const todayStr = new Date().toISOString().split('T')[0];
      if (scheduleForm.date === todayStr && depMinutes !== null) {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        if (depMinutes <= nowMinutes) {
          departureError = "Departure time must be in the future for the selected date.";
        }
      }

      setFieldErrors(prev => ({ 
        ...prev, 
        bookingCloseTime: bookingCloseError,
        departureTime: departureError
      }));
    }
  }, [scheduleForm.departureTime, scheduleForm.date]);

  function filterSchedules() {
    let filtered = [...schedules];
    
    if (searchTerm) {
      filtered = filtered.filter(schedule => 
        schedule.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.bus?.busNo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (routeFilter !== "all") {
      const [from, to] = routeFilter.split('-');
      filtered = filtered.filter(schedule => 
        schedule.from === from && schedule.to === to
      );
    }
    
    if (dateFilter) {
      filtered = filtered.filter(schedule => 
        schedule.date && schedule.date.split('T')[0] === dateFilter
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(schedule => 
        statusFilter === "active" ? schedule.active : !schedule.active
      );
    }
    
    setFilteredSchedules(filtered);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validate From and To fields contain only letters and spaces
    const letterOnlyRegex = /^[A-Za-z\s]+$/;
    if (!letterOnlyRegex.test(scheduleForm.from)) {
      setMsg("Error: From location must contain only letters and spaces.");
      return;
    }
    if (!letterOnlyRegex.test(scheduleForm.to)) {
      setMsg("Error: To location must contain only letters and spaces.");
      return;
    }
    
    // Validate From and To are not the same
    if (scheduleForm.from.toLowerCase().trim() === scheduleForm.to.toLowerCase().trim()) {
      setMsg("Error: From and To locations cannot be the same.");
      return;
    }
    
    // Validate date is not in the past
    const selectedDate = new Date(scheduleForm.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    if (selectedDate < today) {
      setMsg("Error: Schedule date cannot be in the past. Please select today or a future date.");
      return;
    }

    // Prevent departure time in the past when date is today
    const toMinutes = (t) => {
      if (!t) return null;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const todayStr = new Date().toISOString().split('T')[0];
    if (scheduleForm.date === todayStr && scheduleForm.departureTime) {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const depMin = toMinutes(scheduleForm.departureTime);
      if (depMin === null || depMin <= nowMin) {
        setMsg("Error: Departure time must be in the future for today.");
        setFieldErrors(prev => ({ ...prev, departureTime: "Departure time must be in the future." }));
        return;
      }
    }
    
    // Validate arrival after departure
    const dep = scheduleForm.departureTime;
    const arr = scheduleForm.arrivalTime;
    if (dep && arr) {
      // Compare as HH:mm
      const [depH, depM] = dep.split(":").map(Number);
      const [arrH, arrM] = arr.split(":").map(Number);
      const depMinutes = depH * 60 + depM;
      const arrMinutes = arrH * 60 + arrM;
      if (arrMinutes <= depMinutes) {
        setMsg("Error: Arrival time must be after departure time.");
        return;
      }
    }
    
    // Validate booking close time (must be before departure, and not past if date is today)
    if (scheduleForm.bookingCloseTime && scheduleForm.departureTime) {
      const toMinutesLocal = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const closeMin = toMinutesLocal(scheduleForm.bookingCloseTime);
      const depMin = toMinutesLocal(scheduleForm.departureTime);

      if (closeMin >= depMin) {
        setMsg("Error: Booking close time must be before departure time.");
        setFieldErrors(prev => ({ ...prev, bookingCloseTime: "Booking close time must be before departure time." }));
        return;
      }

      const todayStrLocal = new Date().toISOString().split('T')[0];
      if (scheduleForm.date === todayStrLocal) {
        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        if (closeMin <= nowMin) {
          setMsg("Error: Booking close time is already in the past for the selected date.");
          setFieldErrors(prev => ({ ...prev, bookingCloseTime: "Booking close time is already in the past." }));
          return;
        }
      }
    }
    
    // Validate end recurring date is not in the past (if provided)
    if (scheduleForm.endRecurringDate) {
      const endDate = new Date(scheduleForm.endRecurringDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      if (endDate < tomorrow) {
        setMsg("Error: End recurring date must be tomorrow or later.");
        return;
      }
    }
    try {
      if (editingSchedule) {
        await axios.put(`${API}/api/admin/schedules/${editingSchedule._id}`, scheduleForm, { withCredentials: true });
        setMsg("Schedule updated successfully!");
        setEditingSchedule(null);
      } else {
        await axios.post(`${API}/api/admin/schedules`, scheduleForm, { withCredentials: true });
        setMsg("Schedule added successfully!");
      }
      
      resetForm();
      loadData();
    } catch (error) {
      setMsg("Error: " + (error.response?.data?.error || error.message));
    }
  }

  function resetForm() {
    setScheduleForm({
      from: "",
      to: "",
      date: "",
      departureTime: "",
      arrivalTime: "",
      bookingCloseTime: "",
      price: 1200,
      bus: "",
      active: true,
      recurringDays: [],
      endRecurringDate: "",
      notes: ""
    });
    setFieldErrors({});
    setShowAddForm(false);
    setEditingSchedule(null);
  }

  function handleEdit(schedule) {
    setScheduleForm({
      from: schedule.from || "",
      to: schedule.to || "",
      date: schedule.date ? schedule.date.split('T')[0] : "",
      departureTime: schedule.departureTime || "",
      arrivalTime: schedule.arrivalTime || "",
      bookingCloseTime: schedule.bookingCloseTime || "",
      price: schedule.price || 1200,
      bus: schedule.bus?._id || schedule.bus || "",
      active: schedule.active !== undefined ? schedule.active : true,
      recurringDays: schedule.recurringDays || [],
      endRecurringDate: schedule.endRecurringDate ? schedule.endRecurringDate.split('T')[0] : "",
      notes: schedule.notes || ""
    });
    setEditingSchedule(schedule);
    setShowAddForm(true);
  }

  async function handleDelete(scheduleId) {
    if (window.confirm("Are you sure you want to delete this schedule? This action cannot be undone.")) {
      try {
        await axios.delete(`${API}/api/admin/schedules/${scheduleId}`, { withCredentials: true });
        setMsg("Schedule deleted successfully!");
        loadData();
      } catch (error) {
        setMsg("Error deleting schedule: " + (error.response?.data?.error || error.message));
      }
    }
  }

  async function toggleScheduleStatus(scheduleId, currentStatus) {
    try {
      await axios.patch(`${API}/api/admin/schedules/${scheduleId}/status`, 
        { active: !currentStatus }, 
        { withCredentials: true }
      );
      setMsg(`Schedule ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      loadData();
    } catch (error) {
      setMsg("Error updating schedule status: " + (error.response?.data?.error || error.message));
    }
  }

  function fillQuickRoute(from, to) {
    setScheduleForm({
      ...scheduleForm,
      from,
      to
    });
  }

  function handleRecurringDayToggle(day) {
    const current = scheduleForm.recurringDays || [];
    const updated = current.includes(day) 
      ? current.filter(d => d !== day)
      : [...current, day];
    setScheduleForm({...scheduleForm, recurringDays: updated});
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  const uniqueRoutes = [...new Set(schedules.map(s => `${s.from}-${s.to}`))];
  const todaySchedules = schedules.filter(s => {
    if (!s.date) return false;
    return s.date.split('T')[0] === new Date().toISOString().split('T')[0];
  });

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
            <h1 className="text-4xl font-bold text-gray-900">Schedule Management</h1>
            <p className="text-gray-600">Create and manage bus schedules and routes</p>
          </div>
          <div className="flex gap-3">
         <button
               onClick={() => generateSchedulePDF(filteredSchedules)}
             className="px-6 py-3 text-purple-600 transition-colors bg-white border border-purple-600 rounded-lg hover:bg-purple-50"
          >
         📄 Download PDF
          </button>
                      
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-6 py-3 text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              {showAddForm ? "Cancel" : "Add New Schedule"}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-4">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Total Schedules</div>
            <div className="text-3xl font-bold text-gray-900">{schedules.length}</div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Active Routes</div>
            <div className="text-3xl font-bold text-purple-600">{uniqueRoutes.length}</div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Today's Schedules</div>
            <div className="text-3xl font-bold text-blue-600">{todaySchedules.length}</div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Available Buses</div>
            <div className="text-3xl font-bold text-green-600">{buses.length}</div>
          </div>
        </div>

        {/* Quick Route Buttons */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Popular Routes</h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
            {popularRoutes.map((route, index) => (
              <button
                key={index}
                onClick={() => fillQuickRoute(route.from, route.to)}
                className="px-3 py-2 text-sm text-purple-700 transition-colors bg-purple-100 rounded-lg hover:bg-purple-200"
              >
                {route.from} → {route.to}
              </button>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <input
              type="text"
              placeholder="Search schedules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Routes</option>
              {uniqueRoutes.map(route => (
                <option key={route} value={route}>
                  {route.replace('-', ' → ')}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <div className="flex items-center text-sm text-gray-600">
              Showing {filteredSchedules.length} of {schedules.length} schedules
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              {editingSchedule ? "Edit Schedule" : "Add New Schedule"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Route Information */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Route Information</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">From *</label>
                    <input
                      type="text"
                      value={scheduleForm.from}
                      onChange={(e) => handleLocationChange('from', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        fieldErrors.from ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                      placeholder="Starting city"
                    />
                    {fieldErrors.from && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.from}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">To *</label>
                    <input
                      type="text"
                      value={scheduleForm.to}
                      onChange={(e) => handleLocationChange('to', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        fieldErrors.to ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                      placeholder="Destination city"
                    />
                    {fieldErrors.to && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.to}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Schedule Details */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Schedule Details</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Date *</label>
                    <input
                      type="date"
                      value={scheduleForm.date}
                      onChange={(e) => setScheduleForm({...scheduleForm, date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Departure Time *</label>
                    <input
                      type="time"
                      value={scheduleForm.departureTime}
                      onChange={(e) => setScheduleForm({...scheduleForm, departureTime: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Arrival Time *</label>
                    <input
                      type="time"
                      value={scheduleForm.arrivalTime}
                      onChange={(e) => setScheduleForm({...scheduleForm, arrivalTime: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Booking Close Time</label>
                    <input
                      type="time"
                      value={scheduleForm.bookingCloseTime}
                      onChange={(e) => setScheduleForm({...scheduleForm, bookingCloseTime: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Resources and Pricing */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Resources & Pricing</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Bus *</label>
                    <select
                      value={scheduleForm.bus}
                      onChange={(e) => setScheduleForm({...scheduleForm, bus: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a bus</option>
                      {buses.map(bus => (
                        <option key={bus._id} value={bus._id}>
                          {bus.busNo} - {bus.model} ({bus.capacity} seats)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Price (LKR) *</label>
                    <input
                      type="number"
                      value={scheduleForm.price}
                      onChange={(e) => setScheduleForm({...scheduleForm, price: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Recurring Schedule */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Recurring Schedule (Optional)</h3>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Recurring Days</label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map(day => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={scheduleForm.recurringDays?.includes(day) || false}
                          onChange={() => handleRecurringDayToggle(day)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">End Recurring Date</label>
                  <input
                    type="date"
                    value={scheduleForm.endRecurringDate}
                    onChange={(e) => setScheduleForm({...scheduleForm, endRecurringDate: e.target.value})}
                    min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg md:w-64 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="scheduleActive"
                    checked={scheduleForm.active}
                    onChange={(e) => setScheduleForm({...scheduleForm, active: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="scheduleActive" className="text-sm font-medium text-gray-700">Active Schedule</label>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                    placeholder="Additional notes about the schedule..."
                  />
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
                  className="px-6 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  {editingSchedule ? "Update Schedule" : "Add Schedule"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Schedule List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Schedule Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Route & Date</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Bus</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSchedules.map((schedule) => (
                  <tr key={schedule._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {schedule.from} → {schedule.to}
                        </div>
                        <div className="text-sm text-gray-500">
                          {schedule.date ? new Date(schedule.date).toLocaleDateString() : 'No date set'}
                        </div>
                        {schedule.recurringDays && schedule.recurringDays.length > 0 && (
                          <div className="text-xs text-blue-600">
                            Recurring: {schedule.recurringDays.join(', ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Departure: <span className="font-medium">{schedule.departureTime}</span></div>
                        <div>Arrival: <span className="font-medium">{schedule.arrivalTime}</span></div>
                        {schedule.bookingCloseTime && (
                          <div className="text-gray-500">Close: {schedule.bookingCloseTime}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Bus: <span className="font-medium">{schedule.bus?.busNo || 'Not assigned'}</span></div>
                        {schedule.bus?.capacity && (
                          <div className="text-gray-500">{schedule.bus.capacity} seats</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-semibold text-gray-900">
                        LKR {schedule.price?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        schedule.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {schedule.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2 text-sm font-medium whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(schedule)}
                        className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleScheduleStatus(schedule._id, schedule.active)}
                        className={`${
                          schedule.active ? 'text-orange-600 hover:text-orange-800 bg-orange-600/30 rounded p-2' : 'text-green-600 hover:text-green-800 bg-green-600/30 rounded p-2'
                        }`}
                      >
                        {schedule.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(schedule._id)}
                        className="p-2 text-red-600 rounded hover:text-red-800 bg-red-600/30"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredSchedules.length === 0 && (
            <div className="py-12 text-center">
              <div className="text-gray-500">No schedules found matching your criteria.</div>
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