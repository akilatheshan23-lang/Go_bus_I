import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  getAllPayments,
  deletePayment,
  updatePaymentStatus,
  getUserPaymentHistory,
  processRefund
} from '../services/paymentService.js';

const ManagePayments = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Refund modal state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || user?.role !== 'admin') {
        navigate('/admin/login');
        return;
      }
      loadPayments();
    }
  }, [user, isAuthenticated, loading, navigate, currentPage, statusFilter]);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const response = await getAllPayments(currentPage, 10, statusFilter);
      setPayments(response.payments || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      setMessage('Failed to load payments: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updatePaymentStatus(id, newStatus);
      setMessage('Payment status updated successfully!');
      loadPayments();
    } catch (error) {
      setMessage('Error updating payment status: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      try {
        await deletePayment(id);
        setMessage('Payment deleted successfully!');
        loadPayments();
      } catch (error) {
        setMessage('Error deleting payment: ' + error.message);
      }
    }
  };

  const handleRefundClick = (payment) => {
    setSelectedPayment(payment);
    setRefundAmount(payment.amount.toString());
    setRefundReason('');
    setShowRefundModal(true);
  };

  const handleRefundCancel = () => {
    setShowRefundModal(false);
    setSelectedPayment(null);
    setRefundAmount('');
    setRefundReason('');
  };

  const handleRefundSubmit = async () => {
    if (!refundAmount || !refundReason.trim()) {
      setMessage('Error: Please provide refund amount and reason');
      return;
    }

    const refundAmountNum = parseFloat(refundAmount);
    if (refundAmountNum <= 0 || refundAmountNum > selectedPayment.amount) {
      setMessage('Error: Invalid refund amount');
      return;
    }

    try {
      setProcessingRefund(true);
      await processRefund(selectedPayment._id, {
        refundAmount: refundAmountNum,
        refundReason: refundReason.trim()
      });
      setMessage('Refund processed successfully!');
      setShowRefundModal(false);
      loadPayments();
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setProcessingRefund(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredPayments = payments.filter(payment => 
    payment.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">Manage Payments</h1>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600"
            >
              ← Back to Admin Panel
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block mb-2 text-sm font-semibold">Search Payments</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, booking ID, or transaction ID"
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
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
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

        {/* Payments List */}
        <div className="overflow-hidden bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">All Payments ({filteredPayments.length})</h2>
          </div>
          
          {filteredPayments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {payments.length === 0 ? 'No payments found.' : 'No payments match your search criteria.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Booking ID</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Passenger</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                    <th className="py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase px-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-blue-600">{payment.bookingId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{payment.passengerName}</div>
                          <div className="text-sm text-gray-500">{payment.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className="font-semibold text-gray-900">
                            LKR {payment.amount.toFixed(2)}
                          </span>
                          {payment.status === 'refunded' && payment.refundAmount && (
                            <div className="mt-1 text-xs text-red-600">
                              Refunded: LKR {payment.refundAmount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                          payment.status === 'refunded' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {formatDate(payment.createdAt)}
                      </td>
                      
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <div className="flex gap-2">
                          <select
                            value={payment.status}
                            onChange={(e) => handleStatusUpdate(payment._id, e.target.value)}
                            className="px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                          {payment.status === 'completed' && (
                            <button
                              onClick={() => handleRefundClick(payment)}
                              className="p-2 text-sm font-semibold text-orange-600 rounded hover:text-orange-700 bg-orange-500/20"
                            >
                              Refund
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(payment._id)}
                            className="px-2 py-1 text-red-500 rounded font-smemibold text-s hover:text-red-700 bg-red-500/20"
                          >
                            Delete
                          </button>
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

        {/* Refund Modal */}
        {showRefundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
              <div className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Process Refund
                </h3>
                
                {selectedPayment && (
                  <div className="p-4 mb-4 rounded-lg bg-gray-50">
                    <h4 className="mb-2 text-sm font-semibold text-gray-700">Payment Details</h4>
                    <p className="text-sm text-gray-600">Booking ID: {selectedPayment.bookingId}</p>
                    <p className="text-sm text-gray-600">Passenger: {selectedPayment.passengerName}</p>
                    <p className="text-sm text-gray-600">Original Amount: LKR {selectedPayment.amount.toFixed(2)}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      Refund Amount (LKR)
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      min="0"
                      max={selectedPayment?.amount || 0}
                      step="0.01"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      Refund Reason
                    </label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      rows="3"
                      placeholder="Enter the reason for this refund..."
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex mt-6 space-x-3">
                  <button
                    onClick={handleRefundCancel}
                    disabled={processingRefund}
                    className="flex-1 px-4 py-2 font-semibold text-gray-700 transition-colors bg-gray-300 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRefundSubmit}
                    disabled={processingRefund || !refundAmount || !refundReason.trim()}
                    className="flex-1 px-4 py-2 font-semibold text-white transition-colors bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    {processingRefund ? 'Processing...' : 'Process Refund'}
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

export default ManagePayments;