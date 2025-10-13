import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Summary() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Get booking data from navigation state
  const bookingData = location.state;
  
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
    
    if (!bookingData) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate, bookingData]);

  if (!bookingData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50">
        <div className="max-w-md p-8 text-center bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-800">Booking Not Found</h2>
          <p className="mb-4 text-gray-600">No booking information available.</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-4 py-2 font-semibold text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { booking, selected, passengers, schedule } = bookingData;
  const unitFare = schedule?.price || 1000;
  const quantity = selected?.length || 0;
  const handling = Math.round(unitFare * quantity * 0.10);
  const total = unitFare * quantity + handling;

  const proceedToPayment = () => {
    // Prepare booking data for payment page
    const paymentData = {
      bookingId: booking.bookingId,
      busId: schedule?.bus?._id,
      scheduleId: schedule?._id,
      passengerName: passengers?.[0]?.name || user?.username || '',
      email: passengers?.[0]?.email || user?.email || '',
      phone: passengers?.[0]?.phone || '',
      selectedSeats: selected,
      totalAmount: total,
      route: `${schedule?.from} → ${schedule?.to}`,
      departureTime: `${new Date(schedule?.date).toDateString()} at ${schedule?.departureTime}`,
      // Include all relevant booking details
      schedule: schedule,
      passengers: passengers,
      unitFare: unitFare,
      quantity: quantity,
      handling: handling
    };

    // Navigate to payment page with booking data
    navigate('/payment', { 
      state: { 
        bookingData: paymentData 
      } 
    });
  };

  const editBooking = () => {
    navigate(`/booking/${scheduleId}`);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={editBooking} 
            className="px-4 py-2 font-semibold text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600"
          >
            ← Back to Seat Selection
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-8 bg-white rounded-lg shadow-md">
            <h1 className="mb-6 text-2xl font-bold text-gray-800">Review & Confirm Booking</h1>
          
          {/* Schedule Information */}
          <section className="mb-6">
            <h2 className="mb-3 text-xl font-semibold">Journey Details</h2>
            <div className="p-4 space-y-2 rounded-lg bg-gray-50">
              <div><strong>Route:</strong> {schedule?.from} → {schedule?.to}</div>
              <div><strong>Date:</strong> {new Date(schedule?.date).toDateString()}</div>
              <div><strong>Departure:</strong> {schedule?.departureTime}</div>
              <div><strong>Arrival:</strong> {schedule?.arrivalTime}</div>
              <div><strong>Bus:</strong> {schedule?.bus?.busNo} ({schedule?.bus?.model}, {schedule?.bus?.type})</div>
              <div><strong>Driver:</strong> {schedule?.driver?.name}</div>
            </div>
          </section>

          {/* Selected Seats */}
          <section className="mb-6">
            <h2 className="mb-3 text-xl font-semibold">Selected Seats</h2>
            <div className="p-4 rounded-lg bg-blue-50">
              <div className="font-mono text-lg">
                Seat No: {selected?.join(', ')}
              </div>
            </div>
          </section>

          {/* Passengers */}
          <section className="mb-6">
            <h2 className="mb-3 text-xl font-semibold">Passenger Information</h2>
            <div className="space-y-3">
              {passengers?.map((passenger, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="mb-2 font-semibold">Passenger {index + 1}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Name:</strong> {passenger.name}</div>
                    <div><strong>NIC/ID:</strong> {passenger.nic}</div>
                    <div><strong>Phone:</strong> {passenger.phone}</div>
                    <div><strong>Email:</strong> {passenger.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pricing Breakdown */}
          <section className="mb-6">
            <h2 className="mb-3 text-xl font-semibold">Pricing Breakdown</h2>
            <div className="p-4 space-y-2 rounded-lg bg-gray-50">
              <div className="flex justify-between">
                <span>Unit fare (per seat)</span>
                <span>LKR {unitFare.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Number of seats</span>
                <span>{quantity}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>LKR {(unitFare * quantity).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Service charge (10%)</span>
                <span>LKR {handling.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 text-lg font-bold border-t border-gray-300">
                <span>Total Amount</span>
                <span>LKR {total.toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* Hold Information */}
          {booking?.expiresAt && (
            <section className="mb-6">
              <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                <h3 className="mb-2 font-semibold text-yellow-800">⏰ Seat Hold Information</h3>
                <p className="text-sm text-yellow-700">
                  Your seats are held until {new Date(booking.expiresAt).toLocaleTimeString()}. 
                  Please confirm your booking before this time to secure your seats.
                </p>
              </div>
            </section>
          )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={proceedToPayment}
                disabled={loading}
                className="flex-1 px-6 py-3 font-semibold text-white transition-colors bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : `Proceed to Payment - LKR ${total.toLocaleString()}`}
              </button>
              
              <button
                onClick={editBooking}
                disabled={loading}
                className="px-6 py-3 font-semibold text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600 disabled:bg-gray-400"
              >
                Edit Booking
              </button>
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-lg ${
                message.includes('Error') 
                  ? 'bg-red-50 text-red-600 border border-red-200' 
                  : 'bg-green-50 text-green-600 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            <div className="mt-6 space-y-1 text-xs text-gray-500">
              <p>* Payment processing will be handled by the payment gateway.</p>
              <p>* You will receive booking confirmation and ticket details via email.</p>
              <p>* Please arrive at the departure point at least 15 minutes before scheduled departure.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}