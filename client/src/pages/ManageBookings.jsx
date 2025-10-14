import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
  deleteBooking
} from '../services/bookingService.js';

const ManageBookings = () => {

  // --- PDF Report Generation for Confirmed Bookings ---
  const loadJsPDF = async () => {
    if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
    return window.jspdf.jsPDF;
  };

  const downloadConfirmedReport = async () => {
    try {
      const jsPDF = await loadJsPDF();
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 40;
      let y = margin;

      const title = 'GoBus — Confirmed Bookings Report';
      doc.setFontSize(16);
      doc.text(title, margin, y);
      y += 20;

      const genOn = 'Generated: ' + new Date().toLocaleString();
      doc.setFontSize(10);
      doc.text(genOn, margin, y);
      y += 20;

      const confirmed = bookings.filter(b => b.status === 'confirmed');
      if (confirmed.length === 0) {
        doc.text('No confirmed bookings found for current filters.', margin, y);
        doc.save('confirmed_bookings_report.pdf');
        return;
      }

      doc.setFontSize(12);
      confirmed.forEach((b, idx) => {
        const block = [
          `#${idx + 1} — Booking ID: ${b.bookingId}`,
          (() => {
            const d = new Date(b.createdAt || b.bookingDate);
            const createdStr = isNaN(d.getTime()) ? 'Unknown' : d.toLocaleString();
            return `Created: ${createdStr}`;
          })(),
          `Passenger: ${b.passengerDetails?.name || ''} | ${b.passengerDetails?.email || ''} | ${b.passengerDetails?.phone || ''}`,
          `Seats: ${(b.selectedSeats || []).map(s => s.seatNumber || s).join(', ')}`,
          `Status: ${b.status}`
        ].join('\n');

        const lines = doc.splitTextToSize(block, 515);
        if (y + lines.length * 14 > 800) { // new page if near bottom
          doc.addPage();
          y = margin;
        }
        doc.text(lines, margin, y);
        y += (lines.length * 14) + 10;
      });

      const fileName = `confirmed_bookings_${new Date().toISOString().slice(0,10)}.pdf`;
      doc.save(fileName);
    } catch (e) {
      console.error('PDF generation failed', e);
      alert('Could not generate PDF. Please check your internet connection and try again.');
    }
  };
  // --- end PDF generation ---
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || user?.role !== 'admin') {
        navigate('/admin/login');
        return;
      }
      loadBookings();
    }
  }, [user, isAuthenticated, loading, navigate, currentPage, statusFilter]);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const response = await getAllBookings(currentPage, 10, statusFilter);
      setBookings(response.bookings || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      setMessage('Failed to load bookings: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateBookingStatus(id, newStatus);
      setMessage('Booking status updated successfully!');
      loadBookings();
    } catch (error) {
      setMessage('Error updating booking status: ' + error.message);
    }
  };

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      setMessage('Error: Please provide a cancellation reason');
      return;
    }

    try {
      setProcessingAction(true);
      await cancelBooking(selectedBooking._id, cancelReason.trim());
      setMessage('Booking cancelled successfully!');
      setShowCancelModal(false);
      loadBookings();
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking record? This action cannot be undone.')) {
      try {
        await deleteBooking(id);
        setMessage('Booking deleted successfully!');
        loadBookings();
      } catch (error) {
        setMessage('Error deleting booking: ' + error.message);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatSeats = (seats) => {
    return seats.join(', ');
  };

  const filteredBookings = bookings.filter(booking => 
    booking.passengerDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.passengerDetails.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="flex items-center justify-between">\n            <button onClick={downloadConfirmedReport} className="px-4 py-2 text-purple-600 border border-purple-400 rounded-lg hover:bg-purple-50">Download PDF</button>
            <h1 className="text-3xl font-bold text-gray-800">Manage Bookings</h1>
            <div className="text-sm text-gray-600">
              Total Bookings: {bookings.length}
            </div>
          </div>
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
                placeholder="Search by name, email, or booking ID"
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
                  setCurrentPage(1);
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

        {/* Bookings Table */}
        <div className="overflow-hidden bg-white rounded-lg shadow-md">
          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mb-2 text-4xl text-gray-400">📝</div>
              <p className="text-gray-600">No bookings found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Booking ID</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Passenger</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Route</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Seat No</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Booking Date</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-blue-600">{booking.bookingId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{booking.passengerDetails.name}</div>
                        <div className="text-sm text-gray-500">{booking.passengerDetails.email}</div>
                        {booking.passengerDetails.phone && (
                          <div className="text-xs text-gray-500">{booking.passengerDetails.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {booking.route?.from || 'N/A'} → {booking.route?.to || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {booking.departureTime || 'TBD'}
                        </div>
                      </td>
                      <td className="px-12 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatSeats(booking.selectedSeats)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          booking.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {formatDate(booking.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <div className="flex gap-2">
                          {(booking.status === 'pending') && (
                          <button
                              onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                              className="p-2 text-sm font-bold text-green-500 rounded bg-green-500/30 hover:text-green-700"
                            >
                              Confirm
                          </button>
                          )}
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <button
                              onClick={() => handleCancelClick(booking)}
                              className="p-2 text-sm font-bold text-red-500 rounded bg-red-500/30 hover:text-red-700"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Cancel Booking Modal */}
        {showCancelModal && (
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
                    <p className="text-sm text-gray-600">Passenger: {selectedBooking.passengerDetails.name}</p>
                    <p className="text-sm text-gray-600">Seats: {formatSeats(selectedBooking.selectedSeats)}</p>
                  </div>
                )}

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Cancellation Reason
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows="3"
                    placeholder="Enter the reason for cancellation..."
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex mt-6 space-x-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    disabled={processingAction}
                    className="flex-1 px-4 py-2 font-semibold text-gray-700 transition-colors bg-gray-300 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleCancelSubmit}
                    disabled={processingAction || !cancelReason.trim()}
                    className="flex-1 px-4 py-2 font-semibold text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {processingAction ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBookings;