import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
//import dotenv from "../../";
import { 
  Elements, 
  CardNumberElement, 
  CardExpiryElement, 
  CardCvcElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';

// Initialize Stripe with publishable key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_51RdZwpBQulx4sQOGzIjuw12uBFTMu2UjZ3RxWZD16E243CdQituxMKZb4r9jgbahen8CIhGy8JmM8GS5m05LgTFC000xIT1ppi");

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const PaymentFormContent = ({ orderDetails, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Payment system not loaded. Please refresh and try again.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const cardNumberElement = elements.getElement(CardNumberElement);

    try {
      // Create payment method with Stripe
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: {
          name: orderDetails.passengerName,
          email: orderDetails.email,
          phone: orderDetails.phone,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      // Process payment on your backend
      const response = await fetch('http://localhost:5001/api/payments/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          cardholderName: orderDetails.passengerName,
          passengerName: orderDetails.passengerName,
          email: orderDetails.email,
          phone: orderDetails.phone,
          amount: orderDetails.finalAmount,
          paymentMethodId: paymentMethod.id,
          paymentMethod: 'card',
          existingBookingId: orderDetails.bookingId, // Pass booking ID to confirm booking
          // Additional booking information for persistent storage
          bookingInfo: {
            busId: orderDetails.busId,
            scheduleId: orderDetails.scheduleId,
            selectedSeats: orderDetails.selectedSeats || [],
            departureTime: orderDetails.departureTime,
            route: (() => {
              if (orderDetails.route && typeof orderDetails.route === 'string') {
                const routeParts = orderDetails.route.split(' → ');
                return {
                  from: routeParts[0] || 'Unknown',
                  to: routeParts[1] || 'Unknown'
                };
              }
              return {
                from: 'Unknown',
                to: 'Unknown'
              };
            })(),
            promoCode: orderDetails.promoCode
          }
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess(result);
        // Navigate to receipt page
        navigate(`/receipt/${result.payment.id}`);
      } else {
        setErrorMessage(result.message || 'Payment failed. Please try again.');
        if (onError) onError(result);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage('Payment processing failed. Please try again.');
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 card">
      <div className="mb-6">
        <h3 className="mb-4 text-xl font-bold">Payment Details</h3>
        
        <div className="mb-4">
          <label className="block mb-2 text-sm font-semibold">Card Number</label>
          <div className="p-3 bg-white border rounded-lg">
            <CardNumberElement options={cardElementOptions} />
          </div>
        </div>

        <div className="mb-4 row">
          <div className="col-6">
            <label className="block mb-2 text-sm font-semibold">Expiry Date</label>
            <div className="p-3 bg-white border rounded-lg">
              <CardExpiryElement options={cardElementOptions} />
            </div>
          </div>
          <div className="col-6">
            <label className="block mb-2 text-sm font-semibold">CVC</label>
            <div className="p-3 bg-white border rounded-lg">
              <CardCvcElement options={cardElementOptions} />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-semibold">Cardholder Name</label>
          <input 
            type="text"
            value={orderDetails.passengerName || ''}
            disabled
            className="w-full p-3 text-gray-600 bg-gray-100 border rounded-lg"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-semibold">Email</label>
          <input 
            type="email"
            value={orderDetails.email || ''}
            disabled
            className="w-full p-3 text-gray-600 bg-gray-100 border rounded-lg"
          />
        </div>

        <div className="pt-4 mb-4 border-t">
          <div className="mb-2 row">
            <div className="col-6">
              <span>Subtotal:</span>
            </div>
            <div className="text-right col-6">
              <span>LKR {orderDetails.originalAmount?.toFixed(2) || orderDetails.finalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          {orderDetails.discountAmount && orderDetails.discountAmount > 0 && (
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

      <button
        type="submit"
        disabled={!stripe || isLoading}
        className={`btn w-full text-white font-semibold py-3 px-6 rounded-lg transition-colors ${
          isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Processing...' : `Place Order (LKR ${orderDetails.finalAmount.toFixed(2)})`}
      </button>
      
      {errorMessage && (
        <div className="p-3 mt-4 text-center text-red-600 border border-red-200 rounded-lg bg-red-50">
          {errorMessage}
        </div>
      )}
    </form>
  );
};

const PaymentForm = ({ orderDetails, onSuccess, onError }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent 
        orderDetails={orderDetails} 
        onSuccess={onSuccess} 
        onError={onError} 
      />
    </Elements>
  );
};

export default PaymentForm;