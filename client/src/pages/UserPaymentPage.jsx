import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PaymentForm from '../components/PaymentForm';
import AvailablePromotions from '../components/AvailablePromotions';
import { useAuth } from '../contexts/AuthContext';

const UserPaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // Get booking data from navigation state
    const bookingData = location.state?.bookingData;
    
    const [orderDetails, setOrderDetails] = useState({
        passengerName: '',
        email: '',
        phone: '',
        originalAmount: 0,
        discountAmount: 0,
        finalAmount: 0,
        promoCode: ''
    });
    const [promoCode, setPromoCode] = useState('');
    const [promoError, setPromoError] = useState('');
    const [applyingPromo, setApplyingPromo] = useState(false);
    const [showPromotionsModal, setShowPromotionsModal] = useState(false);

    useEffect(() => {
        // Redirect if no booking data
        if (!bookingData) {
            navigate('/');
            return;
        }

        // Set initial order details from booking data
        setOrderDetails({
            passengerName: bookingData.passengerName || user?.username || '',
            email: bookingData.email || user?.email || '',
            phone: bookingData.phone || '',
            originalAmount: bookingData.totalAmount || 0,
            discountAmount: 0,
            finalAmount: bookingData.totalAmount || 0,
            promoCode: '',
            // Additional booking details
            busId: bookingData.busId,
            scheduleId: bookingData.scheduleId,
            selectedSeats: bookingData.selectedSeats,
            departureTime: bookingData.departureTime,
            route: bookingData.route
        });
    }, [bookingData, user, navigate]);

    const handleApplyPromo = async () => {
        await handleApplyPromoCode();
    };

    const handleRemovePromo = () => {
        setOrderDetails(prev => ({
            ...prev,
            discountAmount: 0,
            finalAmount: prev.originalAmount,
            promoCode: ''
        }));
        setPromoCode('');
        setPromoError('');
    };

    const handlePaymentSuccess = (paymentResult) => {
        console.log('Payment successful:', paymentResult);
        // Navigation to receipt page is handled in PaymentForm component
    };

    const handlePaymentError = (error) => {
        console.error('Payment failed:', error);
        // Error handling is done in PaymentForm component
    };

    const handleShowPromotions = () => {
        setShowPromotionsModal(true);
    };

    const handleClosePromotions = () => {
        setShowPromotionsModal(false);
    };

    const handleSelectPromotion = (promotionCode) => {
        setPromoCode(promotionCode);
        setPromoError('');
        // Auto-apply the selected promo code
        setTimeout(() => {
            // Trigger the apply promo function
            handleApplyPromoCode(promotionCode);
        }, 100);
    };

    const handleApplyPromoCode = async (code) => {
        const codeToApply = code || promoCode.trim();
        if (!codeToApply) {
            setPromoError('Please enter a promo code');
            return;
        }

        setApplyingPromo(true);
        setPromoError('');

        try {
            const response = await fetch('http://localhost:5001/api/promotions/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    promoCode: codeToApply,
                    amount: orderDetails.originalAmount
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setOrderDetails(prev => ({
                    ...prev,
                    discountAmount: result.discountAmount,
                    finalAmount: result.finalAmount,
                    promoCode: result.promotion.code
                }));
                setPromoError('');
            } else {
                setPromoError(result.message || 'Invalid promo code');
            }
        } catch (error) {
            console.error('Promo code error:', error);
            setPromoError('Failed to apply promo code. Please try again.');
        } finally {
            setApplyingPromo(false);
        }
    };

    if (!bookingData) {
        return (
            <div className="container p-6 mx-auto text-center">
                <h1 className="mb-4 text-2xl font-bold">No Booking Data Found</h1>
                <p className="mb-4">Please complete your booking first.</p>
                <button 
                    onClick={() => navigate('/')}
                    className="px-6 py-2 text-white bg-blue-600 rounded-lg btn hover:bg-blue-700"
                >
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <div className="container p-6 mx-auto">
            <div className="max-w-4xl mx-auto">
                <h1 className="mb-8 text-3xl font-bold text-center">Secure Checkout</h1>
                
                <div className="row">
                    {/* Left Side - Order Summary */}
                    <div className="col-5">
                        <div className="p-6 mb-6 card">
                            <h3 className="mb-4 text-xl font-bold">Booking Summary</h3>
                            
                            <div className="pb-4 mb-4 border-b">
                                <div className="mb-2">
                                    <span className="font-semibold">Route:</span>
                                    <span className="ml-2">{orderDetails.route}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="font-semibold">Departure:</span>
                                    <span className="ml-2">{orderDetails.departureTime}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="font-semibold">Seats:</span>
                                    <span className="ml-2">{orderDetails.selectedSeats?.join(', ')}</span>
                                </div>
                                <div>
                                    <span className="font-semibold">Passenger:</span>
                                    <span className="ml-2">{orderDetails.passengerName}</span>
                                </div>
                            </div>

                            {/* Promo Code Section */}
                            <div className="mb-4">
                                <div className="flex gap-2">
                                    <label className="block mb-2 text-lg font-semibold">Promo Code</label>
                                </div>
                                
                                {orderDetails.promoCode ? (
                                    <div className="row">
                                        <div className="col-8">
                                            <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                                                <span className="font-semibold text-green-600">
                                                    {orderDetails.promoCode} Applied
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <button
                                                onClick={handleRemovePromo}
                                                className="w-full py-2 text-red-600 bg-red-100 rounded-lg btn hover:bg-red-200"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="row">
                                        <div className="col-8">
                                            <input
                                                type="text"
                                                value={promoCode}
                                                onChange={(e) => setPromoCode(e.target.value)}
                                                placeholder="Enter promo code"
                                                className="w-full p-3 border rounded-lg"
                                                disabled={applyingPromo}
                                            />
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <span 
                                                onClick={handleShowPromotions}
                                                className="p-2 text-blue-500 underline cursor-pointer hover:text-blue-600"
                                            >
                                                Check availability
                                            </span>
                                        </div>
                                        
                                        <div className="col-4">
                                            <button
                                                onClick={handleApplyPromo}
                                                disabled={applyingPromo || !promoCode.trim()}
                                                className="w-full py-3 text-white bg-blue-600 rounded-lg btn hover:bg-blue-700 disabled:bg-gray-400"
                                            >
                                                {applyingPromo ? 'Applying...' : 'Apply'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {promoError && (
                                    <div className="mt-2 text-sm text-red-600">{promoError}</div>
                                )}
                            </div>

                            {/* Price Breakdown */}
                            <div className="pt-4 border-t">
                                <div className="mb-2 row">
                                    <div className="col-6">
                                        <span>Subtotal:</span>
                                    </div>
                                    <div className="text-right col-6">
                                        <span>LKR {orderDetails.originalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                                
                                {orderDetails.discountAmount > 0 && (
                                    <div className="mb-2 text-green-600 row">
                                        <div className="col-6">
                                            <span>Discount:</span>
                                        </div>
                                        <div className="text-right col-6">
                                            <span>-LKR {orderDetails.discountAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="pt-2 border-t row">
                                    <div className="col-6">
                                        <span className="text-lg font-bold">Total:</span>
                                    </div>
                                    <div className="text-right col-6">
                                        <span className="text-lg font-bold">LKR {orderDetails.finalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Payment Form */}
                    <div className="col-7">
                        <PaymentForm
                            orderDetails={orderDetails}
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                        />
                    </div>
                </div>
            </div>

            {/* Available Promotions Modal */}
            <AvailablePromotions
                isOpen={showPromotionsModal}
                onClose={handleClosePromotions}
                onSelectPromotion={handleSelectPromotion}
            />
        </div>
    );
};

export default UserPaymentPage;