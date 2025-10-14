import express from 'express';
import nodemailer from 'nodemailer';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import { requireAuth } from './_authMiddleware.js';
import { getTripStore, setSeatStatus, getAllTrips } from '../store.js';

const router = express.Router();

/* ================= EMAIL FUNCTION ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // 🔥 FIX self-signed certificate error
  },
});



const sendPaymentSuccessEmail = async (to, ticketData) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const { passengerName, from, toLocation, date, time, seat, busNo, amount, transactionId } = ticketData;

    const html = `
      <div style="font-family:Poppins,Arial,sans-serif;color:#333;line-height:1.6;">
        <h2 style="color:#007bff;">🚌 GoBus - Payment Successful</h2>
        <p>Dear <b>${passengerName}</b>,</p>
        <p>Your payment has been received and your booking confirmed. Below are your travel details:</p>
        <table style="border-collapse:collapse;margin-top:10px;">
          <tr><td><b>Route:</b></td><td>${from} → ${toLocation}</td></tr>
          <tr><td><b>Date:</b></td><td>${date}</td></tr>
          <tr><td><b>Time:</b></td><td>${time}</td></tr>
          <tr><td><b>Seat:</b></td><td>${seat}</td></tr>
          <tr><td><b>Bus Number:</b></td><td>${busNo}</td></tr>
          <tr><td><b>Amount Paid:</b></td><td>LKR ${amount}</td></tr>
          <tr><td><b>Transaction ID:</b></td><td>${transactionId}</td></tr>
        </table>
        <p style="margin-top:15px;">📱 Please present your e-ticket QR code when boarding.</p>
        <p>Thank you for choosing <b>GoBus</b>. Have a safe journey!</p>
        <hr/>
        <small>This is an automated email. Please do not reply.</small>
      </div>
    `;

    await transporter.sendMail({
      from: `"GoBus Lanka" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Payment Successful - GoBus Ticket Confirmation",
      html,
    });

    console.log(`📩 Email sent successfully to ${to}`);
  } catch (err) {
    console.error("❌ Failed to send confirmation email:", err.message);
  }
};

/* ================= EXISTING LOGIC (UNCHANGED) ================= */

// Generate unique booking ID
const generateBookingId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BUS-${timestamp}-${random}`.toUpperCase();
};

// Generate unique transaction ID
const generateTransactionId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 8);
  return `TXN-${timestamp}-${random}`.toUpperCase();
};

// Process manual payment
router.post('/process-payment', requireAuth, async (req, res) => {
  try {
    console.log('💳 Payment processing started');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));

    const { cardholderName, passengerName, email, phone, amount, paymentMethod = 'card', country = 'Sri Lanka', existingBookingId, bookingInfo } = req.body;

    if (!cardholderName || !passengerName || !email || !amount) {
      return res.status(400).json({ message: 'Missing required fields: cardholderName, passengerName, email, amount' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const bookingId = existingBookingId || generateBookingId();
    const transactionId = generateTransactionId();

    const payment = new Payment({
      bookingId,
      cardholderName: cardholderName.trim(),
      passengerName: passengerName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      amount: parseFloat(amount),
      transactionId,
      status: 'completed',
      paymentMethod,
      currency: 'LKR',
      country,
    });

    await payment.save();

    let bookingConfirmed = false;
    let persistentBookingData = null;

    try {
      if (existingBookingId) {
        let booking = null;
        let trip = null;
        let scheduleId = null;

        for (const [tripId, tripStore] of getAllTrips()) {
          if (tripStore.bookings.has(existingBookingId)) {
            booking = tripStore.bookings.get(existingBookingId);
            trip = tripStore;
            scheduleId = tripId;
            break;
          }
        }

        if (booking && booking.userId === req.user.id && booking.status === 'draft') {
          booking.seats.forEach(seatId => setSeatStatus(trip, seatId, 'booked'));
          booking.status = 'confirmed';
          booking.confirmedAt = new Date();

          if (booking.holdId && trip.holds.has(booking.holdId)) {
            trip.holds.delete(booking.holdId);
          }

          persistentBookingData = {
            bookingId: existingBookingId,
            userId: req.user.id,
            busId: 'BUS_' + scheduleId,
            scheduleId: scheduleId,
            route: {
              from: 'Unknown',
              to: 'Unknown',
            },
            selectedSeats: booking.seats,
            departureTime: 'TBD',
            departureDate: new Date(),
            passengers: booking.passengers || [],
          };

          bookingConfirmed = true;
          console.log(`In-memory booking ${existingBookingId} confirmed after payment`);
        }
      }

      let bookingData = persistentBookingData;

      if (!bookingData && bookingInfo) {
        console.log('📋 Received booking info:', JSON.stringify(bookingInfo, null, 2));
        let departureDate = null;
        if (bookingInfo.departureDate) {
          const d = new Date(bookingInfo.departureDate);
          if (!isNaN(d)) departureDate = d;
        }
        if (!departureDate && bookingInfo.departureTime) {
          try {
            const cleaned = bookingInfo.departureTime.replace(/\sat\s/i, ' ');
            const d = new Date(cleaned);
            if (!isNaN(d)) departureDate = d;
          } catch (e) {}
        }

        if (!departureDate) departureDate = new Date();

        let passengers = Array.isArray(bookingInfo.passengers) ? bookingInfo.passengers.slice() : [];
        if (passengers.length === 0) {
          passengers.push({
            name: passengerName || bookingInfo.passengerName || 'Passenger',
            email: (email || bookingInfo.email || '').toLowerCase(),
            phone: phone || bookingInfo.phone || '',
          });
        }

        bookingData = {
          bookingId,
          userId: req.user?.id || null,
          busId: bookingInfo.busId || 'DIRECT_PAYMENT',
          scheduleId: bookingInfo.scheduleId || 'UNKNOWN',
          route: {
            from: bookingInfo.route?.from || 'Unknown',
            to: bookingInfo.route?.to || 'Unknown',
          },
          selectedSeats: bookingInfo.selectedSeats || [],
          departureTime: bookingInfo.departureTime || 'TBD',
          departureDate,
          passengers,
        };
      }

      if (!bookingData) {
        bookingData = {
          bookingId,
          userId: req.user?.id || null,
          busId: 'DIRECT_PAYMENT',
          scheduleId: 'UNKNOWN',
          route: { from: 'Direct Payment', to: 'Unknown Destination' },
          selectedSeats: [],
          departureTime: 'TBD',
          departureDate: new Date(),
          passengers: [],
        };
      }

      const primaryPassenger = (Array.isArray(bookingData.passengers) && bookingData.passengers.length > 0)
        ? bookingData.passengers[0]
        : { name: passengerName, email, phone: phone || '' };

      const persistentBooking = new Booking({
        bookingId: bookingData.bookingId,
        userId: bookingData.userId,
        busId: bookingData.busId,
        scheduleId: bookingData.scheduleId,
        route: bookingData.route,
        passengerDetails: {
          name: primaryPassenger.name || passengerName,
          email: (primaryPassenger.email || email || '').toLowerCase(),
          phone: primaryPassenger.phone || phone || '',
        },
        selectedSeats: bookingData.selectedSeats,
        departureTime: bookingData.departureTime,
        departureDate: bookingData.departureDate,
        totalAmount: parseFloat(amount),
        paymentId: payment._id,
        status: 'pending',
        specialRequests: `Passengers: ${bookingData.passengers.length > 0 ? JSON.stringify(bookingData.passengers) : 'None specified'}`,
      });

      await persistentBooking.save();
      console.log(`Persistent booking created: ${bookingData.bookingId} for payment ${payment._id}`);

      /* ✅ SEND CONFIRMATION EMAIL HERE */
      const ticketData = {
        passengerName,
        from: bookingInfo?.route?.from || "Unknown",
        toLocation: bookingInfo?.route?.to || "Unknown",
        date: bookingInfo?.departureDate
          ? new Date(bookingInfo.departureDate).toLocaleDateString()
          : "N/A",
        time: bookingInfo?.departureTime || "N/A",
        seat: (bookingInfo?.selectedSeats || []).join(", ") || "N/A",
        busNo: bookingInfo?.busId || "N/A",
        amount,
        transactionId,
      };
      if (email) await sendPaymentSuccessEmail(email, ticketData);

    } catch (confirmError) {
      console.error('Booking creation error after payment:', confirmError);
    }

    res.status(201).json({
      message: 'Payment processed successfully',
      payment: {
        id: payment._id,
        bookingId: payment.bookingId,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: payment.status,
        passengerName: payment.passengerName,
        email: payment.email,
      },
      bookingConfirmed,
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate booking or transaction ID. Please try again.' });
    }
    res.status(500).json({ message: 'Payment processing failed', error: error.message });
  }
});




// Get payment by ID
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json(payment);
    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve payment', 
            error: error.message 
        });
    }
});

// Get all payments (admin only)
router.get('/', requireAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const query = {};
        
        if (status) {
            query.status = status;
        }

        const payments = await Payment.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Payment.countDocuments(query);

        res.json({
            payments,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve payments', 
            error: error.message 
        });
    }
});

// Update payment status
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status || !['pending', 'completed', 'failed', 'refunded'].includes(status)) {
            return res.status(400).json({ 
                message: 'Invalid status. Must be one of: pending, completed, failed, refunded' 
            });
        }

        const payment = await Payment.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true, runValidators: true }
        );

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json({
            message: 'Payment status updated successfully',
            payment
        });
    } catch (error) {
        console.error('Update payment error:', error);
        res.status(500).json({ 
            message: 'Failed to update payment', 
            error: error.message 
        });
    }
});

// Delete payment (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const payment = await Payment.findByIdAndDelete(req.params.id);
        
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json({ 
            message: 'Payment deleted successfully',
            deletedId: req.params.id
        });
    } catch (error) {
        console.error('Delete payment error:', error);
        res.status(500).json({ 
            message: 'Failed to delete payment', 
            error: error.message 
        });
    }
});

// Get user payment history
router.get('/history/:passengerName', requireAuth, async (req, res) => {
    try {
        const { passengerName } = req.params;
        
        const payments = await Payment.find({ 
            passengerName: new RegExp(passengerName, 'i') 
        }).sort({ createdAt: -1 });

        res.json(payments);
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve payment history', 
            error: error.message 
        });
    }
});

// Process refund
router.post('/refund/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { refundAmount, refundReason } = req.body;

        // Validate required fields
        if (!refundAmount || !refundReason) {
            return res.status(400).json({ 
                message: 'Refund amount and reason are required' 
            });
        }

        // Validate refund amount
        if (refundAmount <= 0) {
            return res.status(400).json({ 
                message: 'Refund amount must be greater than 0' 
            });
        }

        // Find the payment
        const payment = await Payment.findById(id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Check if payment is eligible for refund
        if (payment.status === 'refunded') {
            return res.status(400).json({ 
                message: 'Payment has already been refunded' 
            });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({ 
                message: 'Only completed payments can be refunded' 
            });
        }

        // Validate refund amount doesn't exceed original payment
        if (refundAmount > payment.amount) {
            return res.status(400).json({ 
                message: 'Refund amount cannot exceed original payment amount' 
            });
        }

        // Process the refund
        const updatedPayment = await Payment.findByIdAndUpdate(
            id,
            {
                status: 'refunded',
                refundAmount: parseFloat(refundAmount),
                refundDate: new Date(),
                refundReason: refundReason.trim(),
                refundedBy: req.user?.username || req.user?.email || 'Admin'
            },
            { new: true }
        );

        res.json({
            message: 'Refund processed successfully',
            payment: updatedPayment
        });
    } catch (error) {
        console.error('Process refund error:', error);
        res.status(500).json({ 
            message: 'Failed to process refund', 
            error: error.message 
        });
    }
});

// Add payment (alternative endpoint for compatibility)
router.post('/add', requireAuth, async (req, res) => {
    // Redirect to process-payment for consistency
    req.url = '/process-payment';
    return router.handle(req, res);
});

export default router;