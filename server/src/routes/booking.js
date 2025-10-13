import express from "express";
import { nanoid } from "nanoid";
import { seatTemplate56 } from "../seatTemplate.js";
import { getTripStore, getSeatStatus, setSeatStatus, getAllTrips } from "../store.js";
import { requireAuth } from "./_authMiddleware.js";
import Booking from "../models/Booking.js";
import mongoose from 'mongoose';
import Payment from "../models/Payment.js";
import Schedule from "../models/Schedule.js";

const router = express.Router();
const TEMPLATE = seatTemplate56();

// Helper to get booking owner id as string
const getBookingOwnerId = (booking) => {
  if (!booking) return null;
  const uid = booking.userId;
  if (!uid) return null;
  // If populated user object
  if (typeof uid === 'object' && uid._id) return uid._id.toString();
  // If mongoose ObjectId or string
  if (typeof uid === 'object' && typeof uid.toString === 'function') return uid.toString();
  return String(uid);
};

// Helper to find a booking by Mongo _id or by bookingId string
const getBookingByFlexibleId = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return Booking.findById(id).populate('paymentId').populate('userId', 'username email');
  }
  return Booking.findOne({ bookingId: id }).populate('paymentId').populate('userId', 'username email');
};

// Helper to delete by flexible id
const deleteBookingByFlexibleId = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return Booking.findByIdAndDelete(id);
  }
  return Booking.findOneAndDelete({ bookingId: id });
};

// Create seat snapshot for a trip
const createSeatSnapshot = (trip) => {
  return TEMPLATE.map(seat => ({
    id: seat.id,
    label: seat.label,
    row: seat.row,
    col: seat.col,
    isWindow: seat.isWindow,
    status: getSeatStatus(trip, seat.id)
  }));
};

// Get seat layout for a schedule/trip
router.get("/schedules/:scheduleId/seats", async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const trip = getTripStore(scheduleId);
    
    // Get persistent bookings for this schedule to sync seat status
    const persistentBookings = await Booking.find({ 
      scheduleId: scheduleId,
      status: { $in: ['confirmed', 'pending'] } // Only confirmed and pending bookings reserve seats
    });

    // Sync persistent bookings to in-memory store
    for (const booking of persistentBookings) {
      if (booking.selectedSeats && booking.selectedSeats.length > 0) {
        booking.selectedSeats.forEach(seatId => {
          // Only mark as booked if not already held by someone else
          const currentStatus = getSeatStatus(trip, seatId);
          if (currentStatus === 'available') {
            setSeatStatus(trip, seatId, 'booked');
          }
        });
      }
    }

    const seats = createSeatSnapshot(trip);
    
    res.json({
      scheduleId,
      seats
    });
  } catch (error) {
    console.error('Get seats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new booking (requires authentication)
router.post("/bookings", requireAuth, async (req, res) => {
  try {
    const { scheduleId, seatIds = [], passengers = [] } = req.body || {};
    
    if (!scheduleId) {
      return res.status(400).json({ error: "Schedule ID is required" });
    }
    
    if (!seatIds.length) {
      return res.status(400).json({ error: "At least one seat must be selected" });
    }
    
    if (seatIds.length > 5) {
      return res.status(400).json({ error: "Maximum 5 seats allowed per booking" });
    }
    
    const trip = getTripStore(scheduleId);
    
    // Check if all selected seats are available
    for (const seatId of seatIds) {
      const status = getSeatStatus(trip, seatId);
      if (status !== 'available') {
        return res.status(409).json({ 
          error: `Seat ${seatId} is ${status}. Please select different seats.` 
        });
      }
    }
    
    // Create booking and hold
    const holdId = nanoid();
    const bookingId = nanoid();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes hold
    
    // Mark seats as held
    seatIds.forEach(seatId => setSeatStatus(trip, seatId, 'held'));
    
    // Store hold information
    trip.holds.set(holdId, {
      seats: seatIds,
      expiresAt,
      bookingId,
      userId: req.user.id
    });
    
    // Store booking information
    trip.bookings.set(bookingId, {
      seats: seatIds,
      passengers,
      status: 'draft',
      holdId,
      userId: req.user.id,
      scheduleId,
      createdAt: new Date()
    });
    
    res.json({
      bookingId,
      holdId,
      scheduleId,
      seatIds,
      expiresAt,
      message: "Seats held for 5 minutes. Please complete your booking."
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a booking (modify seats or passengers)
router.patch("/bookings/:bookingId", requireAuth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { scheduleId, seatIds = [], passengers } = req.body || {};
    
    if (!scheduleId) {
      return res.status(400).json({ error: "Schedule ID is required" });
    }
    
    const trip = getTripStore(scheduleId);
    const booking = trip.bookings.get(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Verify ownership
    if (getBookingOwnerId(booking) !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized access to booking" });
    }
    
    // Release currently held seats
    booking.seats.forEach(seatId => {
      if (getSeatStatus(trip, seatId) === 'held') {
        setSeatStatus(trip, seatId, 'available');
      }
    });
    
    // Check if new seats are available
    for (const seatId of seatIds) {
      const status = getSeatStatus(trip, seatId);
      if (status !== 'available') {
        return res.status(409).json({ 
          error: `Seat ${seatId} is ${status}. Please select different seats.` 
        });
      }
    }
    
    // Hold new seats
    seatIds.forEach(seatId => setSeatStatus(trip, seatId, 'held'));
    
    // Update hold information
    const hold = trip.holds.get(booking.holdId);
    if (hold) {
      hold.seats = seatIds;
      hold.expiresAt = Date.now() + 5 * 60 * 1000; // Extend hold by 5 minutes
    }
    
    // Update booking
    booking.seats = seatIds;
    if (passengers) {
      booking.passengers = passengers;
    }
    booking.updatedAt = new Date();
    
    res.json({
      bookingId,
      seatIds,
      expiresAt: hold?.expiresAt,
      message: "Booking updated successfully"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm booking (convert from draft to confirmed)
router.post("/bookings/:bookingId/confirm", requireAuth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Find booking across all trips (since we don't know the schedule ID)
    let booking = null;
    let trip = null;
    let scheduleId = null;
    
    for (const [tripId, tripStore] of getAllTrips()) {
      if (tripStore.bookings.has(bookingId)) {
        booking = tripStore.bookings.get(bookingId);
        trip = tripStore;
        scheduleId = tripId;
        break;
      }
    }
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Verify ownership
    if (getBookingOwnerId(booking) !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized access to booking" });
    }
    
    if (booking.status !== 'draft') {
      return res.status(400).json({ error: "Booking is already confirmed" });
    }
    
    // Convert held seats to booked
    booking.seats.forEach(seatId => setSeatStatus(trip, seatId, 'booked'));
    
    // Update booking status
    booking.status = 'confirmed';
    booking.confirmedAt = new Date();
    
    // Remove the hold since booking is confirmed
    if (booking.holdId && trip.holds.has(booking.holdId)) {
      trip.holds.delete(booking.holdId);
    }
    
    res.json({
      bookingId,
      status: 'confirmed',
      message: "Booking confirmed successfully",
      booking: {
        id: bookingId,
        scheduleId,
        seats: booking.seats,
        passengers: booking.passengers,
        status: booking.status,
        confirmedAt: booking.confirmedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's bookings
router.get("/my-bookings", requireAuth, async (req, res) => {
  try {
    // Get persistent bookings from MongoDB for the authenticated user
    const persistentBookings = await Booking.find({ 
      userId: req.user.id 
    }).populate('paymentId').sort({ createdAt: -1 });
    
    // Also get in-memory bookings for backward compatibility
    const inMemoryBookings = [];
    for (const [tripId, trip] of getAllTrips()) {
      for (const [bookingId, booking] of trip.bookings) {
  if (getBookingOwnerId(booking) === req.user.id) {
          inMemoryBookings.push({
            _id: bookingId,
            bookingId: bookingId,
            scheduleId: tripId,
            selectedSeats: booking.seats,
            passengers: booking.passengers,
            status: booking.status,
            createdAt: booking.createdAt,
            confirmedAt: booking.confirmedAt,
            passengerDetails: {
              name: booking.passengers?.[0]?.name || 'Unknown',
              email: booking.passengers?.[0]?.email || 'Unknown',
              phone: booking.passengers?.[0]?.phone || ''
            },
            route: {
              from: 'Unknown',
              to: 'Unknown'
            },
            departureTime: 'TBD',
            totalAmount: 0,
            isInMemory: true
          });
        }
      }
    }
    
    // Combine both types of bookings
    const allBookings = [...persistentBookings, ...inMemoryBookings];
    
    res.json({ 
      bookings: allBookings,
      total: allBookings.length 
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch bookings',
      error: error.message 
    });
  }
});

// Get booking by flexible id (supports bookingId or Mongo _id) - used by client receipt
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await getBookingByFlexibleId(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Convert to plain object if it's a Mongoose document
    let bookingObj = (typeof booking.toObject === 'function') ? booking.toObject() : booking;

    // Add seatNumbers alias for client convenience
    bookingObj.seatNumbers = bookingObj.selectedSeats || [];

    // Try to enrich with schedule and bus details if scheduleId exists
    if (bookingObj.scheduleId) {
      try {
        const schedule = await Schedule.findById(bookingObj.scheduleId).populate('bus').lean();
        if (schedule) {
          bookingObj.schedule = {
            from: schedule.from,
            to: schedule.to,
            date: schedule.date,
            departureTime: schedule.departureTime,
            bus: schedule.bus ? { busNo: schedule.bus.busNo, model: schedule.bus.model } : null,
            price: schedule.price
          };
        }
      } catch (e) {
        // Ignore schedule lookup errors and continue
        console.error('Schedule lookup error for booking enrichment:', e.message || e);
      }
    }

    // If schedule not found or booking doesn't have scheduleId, fallback to booking's own route/departure fields
    if (!bookingObj.schedule) {
      bookingObj.schedule = {
        from: bookingObj.route?.from || 'Unknown',
        to: bookingObj.route?.to || 'Unknown',
        date: bookingObj.departureDate || null,
        departureTime: bookingObj.departureTime || null,
        bus: (bookingObj.busId ? { busNo: bookingObj.busId } : null),
      };
    }

    res.json(bookingObj);
  } catch (error) {
    console.error('Get booking (flexible) error:', error);
    res.status(500).json({ message: 'Failed to retrieve booking', error: error.message });
  }
});

// ============= NEW PERSISTENT BOOKING ROUTES =============

// Generate unique booking ID
const generatePersistentBookingId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `BKG-${timestamp}-${random}`.toUpperCase();
};

// Create new persistent booking (usually called after successful payment)
router.post("/persistent/create", requireAuth, async (req, res) => {
    try {
        const {
            busId,
            scheduleId,
            route,
            passengerDetails,
            selectedSeats,
            departureTime,
            departureDate,
            totalAmount,
            paymentId,
            specialRequests
        } = req.body;

        // Validate required fields
        if (!busId || !scheduleId || !route || !passengerDetails || !selectedSeats || 
            !departureTime || !departureDate || !totalAmount || !paymentId) {
            return res.status(400).json({
                message: 'Missing required fields for booking creation'
            });
        }

        // Validate passenger details
        if (!passengerDetails.name || !passengerDetails.email) {
            return res.status(400).json({
                message: 'Passenger name and email are required'
            });
        }

        // Check if seats array is valid
        if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
            return res.status(400).json({
                message: 'At least one seat must be selected'
            });
        }

        // Verify payment exists
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                message: 'Associated payment not found'
            });
        }

        // Generate unique booking ID
        const bookingId = generatePersistentBookingId();

        // Create booking
        const booking = new Booking({
            bookingId,
            userId: req.user?.id || null,
            busId,
            scheduleId,
            route,
            passengerDetails: {
                name: passengerDetails.name.trim(),
                email: passengerDetails.email.trim().toLowerCase(),
                phone: passengerDetails.phone?.trim() || ''
            },
            selectedSeats,
            departureTime,
            departureDate: new Date(departureDate),
            totalAmount: parseFloat(totalAmount),
            paymentId,
            specialRequests: specialRequests?.trim() || ''
        });

        await booking.save();

        res.status(201).json({
            message: 'Booking created successfully',
            booking
        });
    } catch (error) {
        console.error('Create persistent booking error:', error);
        res.status(500).json({
            message: 'Failed to create booking',
            error: error.message
        });
    }
});

// Get all bookings (admin only)
router.get("/admin/all", requireAuth, async (req, res) => {
    try {
        // Check admin permission
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};
        if (status && status !== '') {
            query.status = status;
        }

        // Get bookings with pagination
        const bookings = await Booking.find(query)
            .populate('paymentId', 'transactionId amount status')
            .populate('userId', 'username email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const totalBookings = await Booking.countDocuments(query);
        const totalPages = Math.ceil(totalBookings / limit);

        res.json({
            bookings,
            currentPage: page,
            totalPages,
            totalBookings,
            hasMore: page < totalPages
        });
    } catch (error) {
        console.error('Get all bookings error:', error);
        res.status(500).json({
            message: 'Failed to retrieve bookings',
            error: error.message
        });
    }
});

// Get booking by ID
router.get("/persistent/:bookingId", async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findByBookingId(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json(booking);
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            message: 'Failed to retrieve booking',
            error: error.message
        });
    }
});

// Get bookings by passenger email
router.get("/passenger/:email", async (req, res) => {
    try {
        const { email } = req.params;

        const bookings = await Booking.findByPassengerEmail(email);
        
        res.json({
            bookings,
            count: bookings.length
        });
    } catch (error) {
        console.error('Get passenger bookings error:', error);
        res.status(500).json({
            message: 'Failed to retrieve passenger bookings',
            error: error.message
        });
    }
});

// Get user's own persistent bookings
router.get("/user/persistent-bookings", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const bookings = await Booking.find({ userId })
            .populate('paymentId', 'transactionId amount status')
            .sort({ createdAt: -1 });

        res.json({
            bookings,
            count: bookings.length
        });
    } catch (error) {
        console.error('Get user persistent bookings error:', error);
        res.status(500).json({
            message: 'Failed to retrieve user bookings',
            error: error.message
        });
    }
});

// Update booking status
router.put("/persistent/:id/status", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

  const booking = await getBookingByFlexibleId(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check permissions (admin or booking owner)
  if (req.user?.role !== 'admin' && getBookingOwnerId(booking) !== req.user?.id) {
      console.warn('Authorization failed (persistent status update) - ownerId:', getBookingOwnerId(booking), 'req.user:', req.user);
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

        // Update booking
        booking.status = status;
        if (notes) {
            booking.notes = notes.trim();
        }

        await booking.save();

        res.json({
            message: 'Booking status updated successfully',
            booking
        });
    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({
            message: 'Failed to update booking status',
            error: error.message
        });
    }
});

// Cancel booking
router.post("/persistent/:id/cancel", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

  const booking = await getBookingByFlexibleId(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check permissions (admin or booking owner)
  if (req.user?.role !== 'admin' && getBookingOwnerId(booking) !== req.user?.id) {
      console.warn('Authorization failed (persistent cancel) - ownerId:', getBookingOwnerId(booking), 'req.user:', req.user);
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

        // Check if booking can be cancelled
        if (!booking.canBeCancelled()) {
            return res.status(400).json({
                message: 'Booking cannot be cancelled. Either it is too close to departure time or already cancelled/completed.'
            });
        }

        // Cancel booking
        const cancelledBy = req.user?.username || req.user?.email || 'System';
        await booking.cancelBooking(reason || 'Cancelled by user', cancelledBy);

        res.json({
            message: 'Booking cancelled successfully',
            booking
        });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            message: 'Failed to cancel booking',
            error: error.message
        });
    }
});

// Delete booking (admin only)
router.delete("/persistent/:id", requireAuth, async (req, res) => {
    try {
        // Check admin permission
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { id } = req.params;

  const booking = await deleteBookingByFlexibleId(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json({
            message: 'Booking deleted successfully',
            deletedBookingId: booking.bookingId
        });
    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({
            message: 'Failed to delete booking',
            error: error.message
        });
    }
});

// Update booking status (matches frontend service expectations)
router.put("/:id/status", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

  const booking = await getBookingByFlexibleId(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check permissions (admin only for status updates)
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        // Update booking
        booking.status = status;
        if (notes) {
            booking.notes = notes.trim();
        }

        await booking.save();

        res.json({
            message: 'Booking status updated successfully',
            booking
        });
    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({
            message: 'Failed to update booking status',
            error: error.message
        });
    }
});

// Cancel booking (matches frontend service expectations)
router.post("/:id/cancel", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

  const booking = await getBookingByFlexibleId(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check permissions (admin only for cancellations)
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        // Update booking to cancelled status
        booking.status = 'cancelled';
        booking.cancellationReason = reason?.trim() || 'Cancelled by admin';
        booking.cancelledAt = new Date();
        booking.cancelledBy = req.user?.username || 'Admin';

        await booking.save();

        // Release seats in in-memory store
        if (booking.selectedSeats && booking.scheduleId) {
            const trip = getTripStore(booking.scheduleId);
            booking.selectedSeats.forEach(seatId => {
                setSeatStatus(trip, seatId, 'available');
            });
        }

        res.json({
            message: 'Booking cancelled successfully',
            booking
        });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            message: 'Failed to cancel booking',
            error: error.message
        });
    }
});

// Update passenger details
router.put("/:id/passenger", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone } = req.body;

        // Validate required fields
        if (!name?.trim() || !email?.trim()) {
            return res.status(400).json({ 
                message: 'Name and email are required' 
            });
        }

  const booking = await getBookingByFlexibleId(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

    // Check permissions (admin or booking owner)
  if (req.user?.role !== 'admin' && getBookingOwnerId(booking) !== req.user?.id) {
      console.warn('Authorization failed (update passenger) - ownerId:', getBookingOwnerId(booking), 'req.user:', req.user);
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

        // Update passenger details
        booking.passengerDetails.name = name.trim();
        booking.passengerDetails.email = email.trim().toLowerCase();
        if (phone !== undefined) {
            booking.passengerDetails.phone = phone.trim();
        }

        await booking.save();

        res.json({
            message: 'Passenger details updated successfully',
            booking
        });
    } catch (error) {
        console.error('Update passenger details error:', error);
        res.status(500).json({
            message: 'Failed to update passenger details',
            error: error.message
        });
    }
});

// Delete booking (matches frontend service expectations)
router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

  const booking = await getBookingByFlexibleId(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check permissions
        if (req.user?.role === 'admin') {
            // Admin can delete any booking
  } else if (getBookingOwnerId(booking) === req.user?.id) {
            // User can delete their own booking within 1 hour
            const bookingTime = new Date(booking.createdAt || booking.updatedAt);
            const now = new Date();
            const oneHourInMs = 60 * 60 * 1000;
            const timeDifference = now.getTime() - bookingTime.getTime();
            
            if (timeDifference > oneHourInMs) {
                return res.status(403).json({ 
                    message: 'Bookings can only be cancelled within 1 hour of booking' 
                });
            }
            
            if (booking.status === 'cancelled') {
                return res.status(400).json({ 
                    message: 'Booking is already cancelled' 
                });
            }
        } else {
            return res.status(403).json({ message: 'Not authorized to delete this booking' });
        }

        // For users, delete the booking completely from database
        if (req.user?.role !== 'admin') {
            // Release seats in in-memory store before deleting
            if (booking.selectedSeats && booking.scheduleId) {
                const trip = getTripStore(booking.scheduleId);
                booking.selectedSeats.forEach(seatId => {
                    setSeatStatus(trip, seatId, 'available');
                });
            }

            // Delete the booking completely
            await deleteBookingByFlexibleId(id);

            res.json({
                message: 'Booking cancelled and removed successfully',
                deletedBookingId: booking.bookingId
            });
        } else {
            // Release seats in in-memory store before deleting
            if (booking.selectedSeats && booking.scheduleId) {
                const trip = getTripStore(booking.scheduleId);
                booking.selectedSeats.forEach(seatId => {
                    setSeatStatus(trip, seatId, 'available');
                });
            }

            // Admin can actually delete the record
            await deleteBookingByFlexibleId(id);
            res.json({
                message: 'Booking deleted successfully',
                deletedBookingId: booking.bookingId
            });
        }
    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({
            message: 'Failed to delete booking',
            error: error.message
        });
    }
});

export default router;