import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getMyBookings, deleteBooking, updatePassengerDetails } from '../services/bookingService.js';

const BookingHistory = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      loadMyBookings();
    }
  }, [user, isAuthenticated, loading, navigate]);

  const loadMyBookings = async () => {
    try {
      setIsLoading(true);
      const response = await getMyBookings();
      setBookings(response.bookings || []);
    } catch (error) {
      setMessage('Failed to load your bookings: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if booking can be deleted (within 1 hour of booking)
  const canDeleteBooking = (booking) => {
    const bookingTime = new Date(booking.createdAt || booking.bookingDate);
    const now = new Date();
    const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds
    const timeDifference = now.getTime() - bookingTime.getTime();
    
    return timeDifference <= oneHourInMs && booking.status !== 'cancelled';
  };

  // Get time remaining for deletion
  const getTimeRemaining = (booking) => {
    const bookingTime = new Date(booking.createdAt || booking.bookingDate);
    const now = new Date();
    const oneHourInMs = 60 * 60 * 1000;
    const timeDifference = now.getTime() - bookingTime.getTime();
    const timeRemaining = oneHourInMs - timeDifference;
    
    if (timeRemaining <= 0) return null;
    
    const minutes = Math.floor(timeRemaining / (60 * 1000));
    const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  const handleDeleteClick = (booking) => {
    setSelectedBooking(booking);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBooking) return;

    try {
      setProcessingAction(true);
      await deleteBooking(selectedBooking._id);
      setMessage('Booking cancelled and removed successfully!');
      setShowDeleteModal(false);
      loadMyBookings();
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleEditClick = (booking) => {
    setSelectedBooking(booking);
    setEditFormData({
      name: booking.passengerDetails?.name || '',
      email: booking.passengerDetails?.email || '',
      phone: booking.passengerDetails?.phone || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editFormData.name.trim() || !editFormData.email.trim()) {
      setMessage('Error: Name and email are required');
      return;
    }

    try {
      setProcessingAction(true);
      await updatePassengerDetails(selectedBooking._id, editFormData);
      setMessage('Personal details updated successfully!');
      setShowEditModal(false);
      loadMyBookings();
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setProcessingAction(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatSeats = (seats) => {
    if (!seats || seats.length === 0) return 'No seats selected';
    return seats.join(', ');
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.passengerDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.route?.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.route?.to?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">My Booking History</h1>
            <div className="text-sm text-gray-600">
              Total Bookings: {bookings.length}
            </div>
          </div>
          <p className="mt-2 text-gray-600">
            View and manage your bus reservations. You can cancel bookings within 1 hour of booking.
          </p>
        </div>

        {/* Filters */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block mb-2 text-sm font-semibold">Search Bookings</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by booking ID, name, or route"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                }}
                className="px-6 py-3 font-semibold text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') || message.includes('Failed') 
              ? 'bg-red-50 text-red-600 border border-red-200' 
              : 'bg-green-50 text-green-600 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg shadow-md">
              <div className="mb-2 text-4xl text-gray-400">🎫</div>
              <p className="text-gray-600">No bookings found.</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 mt-4 font-semibold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Make a Booking
              </button>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking._id} className="p-6 bg-white rounded-lg shadow-md">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {/* Booking Information */}
                  <div className="md:col-span-2">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-blue-600">
                          {booking.bookingId}
                        </h3>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Booked: {formatDate(booking.createdAt || booking.bookingDate)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div>
                        <p className="font-semibold text-gray-700">Route</p>
                        <p className="text-gray-600">
                          {booking.route?.from || 'N/A'} → {booking.route?.to || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Departure</p>
                        <p className="text-gray-600">{booking.departureTime || 'TBD'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Seats</p>
                        <p className="text-gray-600">
                          {formatSeats(booking.selectedSeats)} ({booking.selectedSeats?.length || 0} seat(s))
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Total Amount</p>
                        <p className="font-semibold text-green-600">LKR {booking.totalAmount?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Passenger</p>
                        <p className="text-gray-600">{booking.passengerDetails?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{booking.passengerDetails?.email || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Cancellation Info */}
                    {booking.status === 'cancelled' && booking.cancellationReason && (
                      <div className="p-3 mt-4 rounded-lg bg-red-50">
                        <p className="text-sm font-semibold text-red-700">Cancellation Reason:</p>
                        <p className="text-sm text-red-600">{booking.cancellationReason}</p>
                        {booking.cancelledAt && (
                          <p className="text-xs text-red-500">
                            Cancelled on: {formatDate(booking.cancelledAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-3">
                    {/* Edit Personal Details */}
                    <button
                      onClick={() => handleEditClick(booking)}
                      className="px-4 py-2 text-sm font-semibold text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-100"
                    >
                      Edit Details
                    </button>

                    {/* Cancel/Delete Booking */}
                    {canDeleteBooking(booking) ? (
                      <div>
                        <button
                          onClick={() => handleDeleteClick(booking)}
                          className="w-full px-4 py-2 text-sm font-semibold text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
                        >
                          Cancel Booking
                        </button>
                        <p className="mt-1 text-xs text-red-500">
                          Time left: {getTimeRemaining(booking)}
                        </p>
                      </div>
                    ) : (
                      booking.status !== 'cancelled' && (
                        <div className="px-4 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg">
                          Cannot cancel
                          <p className="text-xs">1 hour limit exceeded</p>
                        </div>
                      )
                    )}

                    {/* View Receipt/Details */}
                    <button
                      onClick={() => navigate(`/booking/${booking.scheduleId}`)}
                      className="px-4 py-2 text-sm font-semibold text-gray-600 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Delete Booking Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
              <div className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Cancel Booking
                </h3>
                
                {selectedBooking && (
                  <div className="p-4 mb-4 rounded-lg bg-gray-50">
                    <h4 className="mb-2 text-sm font-semibold text-gray-700">Booking Details</h4>
                    <p className="text-sm text-gray-600">ID: {selectedBooking.bookingId}</p>
                    <p className="text-sm text-gray-600">Route: {selectedBooking.route?.from} → {selectedBooking.route?.to}</p>
                    <p className="text-sm text-gray-600">Amount: LKR {selectedBooking.totalAmount?.toFixed(2)}</p>
                  </div>
                )}

                <p className="mb-4 text-sm text-gray-600">
                  Are you sure you want to cancel this booking? This action cannot be undone.
                </p>

                <div className="flex mt-6 space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={processingAction}
                    className="flex-1 px-4 py-2 font-semibold text-gray-700 transition-colors bg-gray-300 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={processingAction}
                    className="flex-1 px-4 py-2 font-semibold text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {processingAction ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Personal Details Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
              <div className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Edit Personal Details
                </h3>
                
                <form onSubmit={handleEditSubmit}>
                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      disabled={processingAction}
                      className="flex-1 px-4 py-2 font-semibold text-gray-700 transition-colors bg-gray-300 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={processingAction || !editFormData.name.trim() || !editFormData.email.trim()}
                      className="flex-1 px-4 py-2 font-semibold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {processingAction ? 'Updating...' : 'Update Details'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;