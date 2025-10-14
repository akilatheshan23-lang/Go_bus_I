import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import SeatMap from '../components/SeatMap.jsx';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Booking() {
  const { scheduleId } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [seats, setSeats] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [passengers, setPassengers] = useState(
    new Array(5).fill(0).map(() => ({
      name: '',
      nic: '',
      phone: '',
      email: ''
    }))
  );
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState('');
  const [schedule, setSchedule] = useState(null);
  const [showBusModal, setShowBusModal] = useState(false);
  const [busModalSchedule, setBusModalSchedule] = useState(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    // Only redirect when viewing a specific schedule (trying to book)
    if (scheduleId && !authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [scheduleId, isAuthenticated, authLoading, navigate]);

  // Fetch schedule details and seats
  useEffect(() => {
    // If scheduleId provided, fetch that schedule and seats
    if (scheduleId && isAuthenticated) {
      fetchScheduleAndSeats();
    }
  }, [scheduleId, isAuthenticated]);

  // If no scheduleId, load schedules list to display
  useEffect(() => {
    if (!scheduleId) {
      (async () => {
        try {
          setLoading(true);
          const res = await axios.get(`${API}/api/public/schedules`);
          setSchedules(res.data || []);
          setSeats([]); // clear seats
          setSchedule(null);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [scheduleId]);

  const fetchScheduleAndSeats = async () => {
    try {
      setLoading(true);
      
      // Fetch schedule details
      const scheduleResponse = await axios.get(`${API}/api/public/schedules`);
      const scheduleData = scheduleResponse.data.find(s => s._id === scheduleId);
      if (scheduleData) {
        setSchedule(scheduleData);
      }
      
      // Fetch seat layout
      const seatsResponse = await axios.get(`${API}/api/booking/schedules/${scheduleId}/seats`, {
        withCredentials: true
      });
      setSeats(seatsResponse.data.seats || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Error loading seat information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seatId) => {
    if (!selected.includes(seatId) && selected.length >= 5) {
      setMessage('You can select up to 5 seats only.');
      return;
    }
    setSelected(prev => 
      prev.includes(seatId) 
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    );
    setMessage(''); // Clear any previous messages
  };

  const setField = (index, key, value) => {
    setPassengers(prev => 
      prev.map((p, idx) => 
        idx === index ? { ...p, [key]: value } : p
      )
    );
  };

  const validate = () => {
  const seatCount = selected.length;
  const errs = new Array(seatCount).fill(0).map(() => ({}));
  let isValid = true;

  const phoneRegex = /^\d{10}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (let i = 0; i < seatCount; i++) {
    const passenger = passengers[i];

    // Required field check
    ['name', 'nic', 'phone', 'email'].forEach(field => {
      if (!passenger[field]) {
        errs[i][field] = 'Required';
        isValid = false;
      }
    });

    // Phone validation
    if (passenger.phone && !phoneRegex.test(passenger.phone)) {
      errs[i].phone = 'Phone must be 10 digits';
      isValid = false;
    }

    // Email validation
    if (passenger.email && !emailRegex.test(passenger.email)) {
      errs[i].email = 'Invalid email address';
      isValid = false;
    }
  }

  setErrors(errs);
  if (!isValid) {
    setMessage(
      'Please correct the highlighted passenger details (phone must be 10 digits; email must be valid).'
    );
  }

  return isValid;
};


  const proceed = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      setMessage('');
      
      const activePassengers = passengers.slice(0, selected.length).map((p, i) => ({
        ...p,
        index: i + 1
      }));

      let response;
      if (!booking) {
        // Create new booking
        response = await axios.post(`${API}/api/booking/bookings`, {
          scheduleId,
          seatIds: selected,
          passengers: activePassengers
        }, { withCredentials: true });
      } else {
        // Update existing booking
        response = await axios.patch(`${API}/api/booking/bookings/${booking.bookingId}`, {
          scheduleId,
          seatIds: selected,
          passengers: activePassengers
        }, { withCredentials: true });
      }

      setBooking(prev => ({ ...prev, ...response.data }));
      setMessage('Seats held successfully! You have 5 minutes to complete your booking.');
      
      // Navigate to summary page with booking data
      navigate(`/booking/${scheduleId}/summary`, { 
        state: { 
          booking: response.data, 
          selected, 
          passengers: activePassengers,
          schedule 
        } 
      });
      
    } catch (error) {
      console.error('Booking error:', error);
      setMessage(error.response?.data?.error || 'Error creating booking. Please try again.');
      // Refresh seats to show current status
      await fetchScheduleAndSeats();
    } finally {
      setLoading(false);
    }
  };

  const handleViewBus = (sched) => {
    // Pass bus info to BusDetails page
    navigate('/bus-details', { state: { bus: sched.bus } });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }
  if (!isAuthenticated && scheduleId) {
    return null; // Will redirect to login via effect when scheduleId is present
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {!scheduleId && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-4">Available Schedules</h1>
            {loading ? (
              <div className="py-8 text-center text-gray-600">Loading schedules...</div>
            ) : (
              <div className="grid gap-4">
                {schedules.length === 0 ? (
                  <div className="p-6 bg-white rounded shadow text-gray-600">No schedules available.</div>
                ) : (
                  schedules.map(s => (
                    <div key={s._id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-blue-600">{s.from} → {s.to}</div>
                        <div className="text-sm text-gray-600">{new Date(s.date).toDateString()} • Dep: {s.departureTime}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleViewBus(s)}
                          className="px-3 py-2 bg-gray-200 text-blue-700 rounded-lg hover:bg-blue-100"
                        >
                          View Bus
                        </button>
                        <div className="text-green-600 font-semibold">LKR {s.price}</div>
                        <button onClick={() => navigate(`/booking/${s._id}`)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Book</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
        <div className="mb-6">
          <button 
            onClick={() => navigate('/')} 
            className="px-4 py-2 font-semibold text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600"
          >
            ← Back to Schedules
          </button>
        </div>

        {schedule && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
            <h1 className="mb-4 text-2xl font-bold text-gray-800">Book Your Seats</h1>
            <div className="space-y-2 text-gray-600">
              <div><span className="font-semibold text-blue-600">{schedule.from}</span> → <span className="font-semibold text-blue-600">{schedule.to}</span></div>
              <div>Date: {new Date(schedule.date).toDateString()}</div>
              <div>Departure: <span className="font-semibold text-gray-800">{schedule.departureTime}</span> | Arrival: <span className="font-semibold text-gray-800">{schedule.arrivalTime}</span></div>
              <div>Bus: <span className="font-semibold text-gray-800">{schedule.bus?.busNo}</span> ({schedule.bus?.model}, {schedule.bus?.type})</div>
              <div>Price: <span className="font-semibold text-green-600">LKR {schedule.price}</span> per seat</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Seat Selection */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Select Your Seats (max 5)</h2>
              <div className="text-sm text-gray-600">
                Selected: {selected.length}/5
              </div>
            </div>

            <div className="mb-6">
              {loading ? (
                <div className="py-8 text-center">
                  <div className="text-gray-600">Loading seats...</div>
                </div>
              ) : (
                <SeatMap 
                  seats={seats} 
                  selected={selected} 
                  onToggle={toggleSeat} 
                />
              )}
            </div>

            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={proceed} 
                disabled={loading || selected.length === 0} 
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  loading || selected.length === 0 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {loading ? 'Processing...' : 'Continue (Hold 5 min)'}
              </button>
              {selected.length > 0 && (
                <div className="text-sm text-gray-600">
                  Total: <span className="font-semibold text-green-600">LKR {(schedule?.price || 0) * selected.length}</span>
                </div>
              )}
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('Error') || message.includes('Please') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}
          </section>

          {/* Passenger Details */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-gray-800">
              Passenger Details {selected.length > 0 && `(${selected.length} passenger${selected.length > 1 ? 's' : ''})`}
            </h2>
            
            {Array(Math.max(1, selected.length)).fill(0).map((_, i) => (
              <div key={i} className="p-4 mb-4 bg-white rounded-lg shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-600">Passenger {i + 1}</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    className={`px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors[i]?.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Full Name"
                    value={passengers[i]?.name || ''}
                    onChange={e => setField(i, 'name', e.target.value)}
                    disabled={i >= selected.length}
                  />
                  
                  <input
                    className={`px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors[i]?.nic ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="NIC/ID Number"
                    value={passengers[i]?.nic || ''}
                    onChange={e => setField(i, 'nic', e.target.value)}
                    disabled={i >= selected.length}
                  />
                  
                  <input
                    className={`px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors[i]?.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Phone Number"
                    value={passengers[i]?.phone || ''}
                    onChange={e => setField(i, 'phone', e.target.value)}
                    disabled={i >= selected.length}
                  />
                  
                  <input
                    className={`px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors[i]?.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Email Address"
                    type="email"
                    value={passengers[i]?.email || ''}
                    onChange={e => setField(i, 'email', e.target.value)}
                    disabled={i >= selected.length}
                  />
                </div>
              </div>
            ))}
          </section>
        </div>

        {schedule && (
          <button
            className="px-4 py-2 mt-4 text-white bg-blue-600 rounded hover:bg-blue-700"
            onClick={handleViewBus}
          >
            View Bus
          </button>
        )}

        {/* Bus modal removed. Navigation to BusDetails page instead. */}
      </div>
    </div>
  );
}