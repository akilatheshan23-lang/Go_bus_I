import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode'; // ✅ ADD: QR code library
const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

// =======================
// E-Ticket Component
// =======================
const ETicket = ({ booking, payment }) => {
    const [qrCode, setQrCode] = useState('');

    useEffect(() => {
        const qrData = booking?._id || payment?._id || '';
        if (qrData) {
            // ✅ Generate QR Code as Base64 Image
            QRCode.toDataURL(qrData)
                .then(url => setQrCode(url))
                .catch(err => console.error('QR generation error:', err));
        }
    }, [booking, payment]);

    return (
        <div className="overflow-hidden bg-white border border-gray-200 rounded-xl shadow-lg">
            <div className="flex">
                {/* Left Side - Ticket Details */}
                <div className="flex-1 p-6 border-r border-dashed border-gray-300">
                    <div className="flex items-center mb-6">
                        <div className="text-3xl text-blue-600 mr-3">🚌</div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">E-Ticket</h2>
                            <p className="text-sm text-gray-600">GoBus - Safe Journey</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <div className="w-8 text-gray-600">👤</div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {booking?.passengerDetails?.name || payment?.passengerName}
                                </p>
                                <p className="text-sm text-gray-500">Passenger</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center">
                            <div className="w-8 text-gray-600">🛣️</div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {booking?.schedule?.from} → {booking?.schedule?.to}
                                </p>
                                <p className="text-sm text-gray-500">Route</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center">
                            <div className="w-8 text-gray-600">📅</div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {booking?.schedule?.date
                                        ? new Date(booking.schedule.date).toLocaleDateString()
                                        : 'N/A'}
                                </p>
                                <p className="text-sm text-gray-500">Travel Date</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center">
                            <div className="w-8 text-gray-600">🕐</div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {booking?.schedule?.departureTime || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-500">Departure Time</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center">
                            <div className="w-8 text-gray-600">💺</div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    Seat {booking?.seatNumbers?.join(', ') || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-500">Seat Number(s)</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center">
                            <div className="w-8 text-gray-600">🚌</div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {booking?.schedule?.bus?.busNo || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-500">Bus Number</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Right Side - QR Code */}
                <div className="w-48 p-6 bg-gradient-to-b from-gray-50 to-gray-100 text-center">
                    <h3 className="font-semibold text-gray-700 mb-4">Boarding Pass</h3>

                    <div className="bg-white p-3 rounded-lg shadow-sm mb-3 inline-block">
                        {qrCode ? (
                            <img
                                src={qrCode}
                                alt="QR Code"
                                className="w-24 h-24 rounded border"
                            />
                        ) : (
                            <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                QR Code
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-gray-500 font-mono break-all">
                        {booking?._id || payment?._id}
                    </div>
                    <div className="mt-4 text-xs text-gray-400">
                        Show this at boarding
                    </div>
                </div>
            </div>
        </div>
    );
};

// =======================
// Success Animation Component
// =======================
const SuccessAnimation = ({ show }) => {
    if (!show) return null;
    
    return (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
            <div className="animate-pulse">
                <div className="text-8xl text-green-500">✅</div>
            </div>
        </div>
    );
};

// =======================
// Main Receipt Page
// =======================
const ReceiptPage = () => {
    const { id: paymentId } = useParams();
    const navigate = useNavigate();
    const [payment, setPayment] = useState(null);
    const [booking, setBooking] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAnimation, setShowAnimation] = useState(true);
    const [error, setError] = useState("");

    const handlePrint = () => {
        window.print();
    };
    
    useEffect(() => {
        const timer = setTimeout(() => setShowAnimation(false), 3000);
        
        const fetchData = async () => {
            try {
                const paymentResponse = await fetch(`${API}/api/payments/${paymentId}`, {
                    credentials: 'include'
                });
                
                if (paymentResponse.ok) {
                    const paymentData = await paymentResponse.json();
                    setPayment(paymentData);
                    
                    if (paymentData.bookingId) {
                        const bookingResponse = await fetch(`${API}/api/booking/${paymentData.bookingId}`, {
                            credentials: 'include'
                        });
                        
                        if (bookingResponse.ok) {
                            const bookingData = await bookingResponse.json();
                            setBooking(bookingData);
                        }
                    }
                } else {
                    setError('Failed to fetch receipt data');
                }
            } catch (error) {
                setError('Failed to load receipt data: ' + error.message);
            } finally {
                setIsLoading(false);
            }
        };
        
        if (paymentId) {
            fetchData();
        }
        
        return () => clearTimeout(timer);
    }, [paymentId]);
    
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="text-lg text-gray-600">Loading receipt...</div>
                </div>
            </div>
        );
    }
    
    if (error || !payment) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-6xl text-red-500 mb-4">❌</div>
                    <div className="text-lg text-gray-700 mb-4">{error || 'Receipt not found'}</div>
                    <button 
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <SuccessAnimation show={showAnimation} />
            
            <div className="max-w-4xl mx-auto px-4">
                {/* Success Header */}
                <div className="text-center mb-8">
                    <div className="text-6xl text-green-500 mb-4">🎉</div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                    <p className="text-gray-600">
                        Your booking is confirmed. Have a safe journey!
                    </p>
                </div>
                
                {/* E-Ticket */}
                <div className="mb-8">
                    <ETicket booking={booking} payment={payment} />
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                    <button 
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Back to Home
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                        <span className="mr-2">🖨️</span>
                        Print Ticket
                    </button>
                    {booking && (
                        <button 
                            onClick={() => navigate('/bookings')}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            My Bookings
                        </button>
                    )}
                </div>
                
                {/* Payment Details */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Transaction ID:</span>
                            <span className="font-mono text-sm">{payment.transactionId || payment._id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Amount Paid:</span>
                            <span className="font-semibold text-green-600">LKR {payment.amount?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Payment Status:</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                {payment.status || 'Completed'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Payment Date:</span>
                            <span>{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                {/* Footer Note */}
                <div className="text-center mt-8 text-sm text-gray-500">
                    <p>📍 Please arrive at the departure point 15 minutes early</p>
                    <p>📱 Keep this e-ticket handy during your journey</p>
                </div>
            </div>
        </div>
    );
};

export default ReceiptPage;
