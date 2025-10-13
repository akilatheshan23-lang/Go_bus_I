import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import UserPaymentPage from '../pages/UserPaymentPage';
import { AuthProvider } from '../contexts/AuthContext';

const TestPaymentPage = () => {
    // Mock booking data to test the payment page
    const mockBookingData = {
        passengerName: 'John Doe',
        email: 'john@example.com',
        phone: '+94701234567',
        totalAmount: 1500,
        busId: '507f1f77bcf86cd799439011',
        scheduleId: '507f1f77bcf86cd799439012',
        selectedSeats: ['A1', 'A2'],
        departureTime: '08:00 AM',
        route: 'Colombo → Kandy'
    };

    // Mock navigate function for testing
    const mockNavigate = (path) => {
        console.log('Navigate to:', path);
    };

    // Mock location state
    const mockLocation = {
        state: {
            bookingData: mockBookingData
        }
    };

    return (
        <AuthProvider>
            <BrowserRouter>
                <div style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    zIndex: 9999, 
                    background: 'white' 
                }}>
                    <div style={{ padding: '20px' }}>
                        <h1>Testing Payment Page with Promotions</h1>
                        <p>This is a test page to verify the promotion browsing feature works correctly.</p>
                        <hr style={{ margin: '20px 0' }} />
                    </div>
                    {/* Override the hooks with test data */}
                    <UserPaymentPage />
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default TestPaymentPage;