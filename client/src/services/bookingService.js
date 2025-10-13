// Booking service for handling API calls
const API_URL = 'http://localhost:5001/api/booking';

// Get all bookings (admin only)
export const getAllBookings = async (page = 1, limit = 10, status = '') => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status })
    });

    const response = await fetch(`${API_URL}/admin/all?${params}`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch bookings');
    }

    return response.json();
};

// Get booking by booking ID
export const getBookingById = async (bookingId) => {
    const response = await fetch(`${API_URL}/${bookingId}`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch booking');
    }

    return response.json();
};

// Get bookings by passenger email
export const getBookingsByEmail = async (email) => {
    const response = await fetch(`${API_URL}/passenger/${encodeURIComponent(email)}`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch passenger bookings');
    }

    return response.json();
};

// Get user's own bookings
export const getMyBookings = async () => {
    const response = await fetch(`${API_URL}/my-bookings`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch user bookings');
    }

    return response.json();
};

// Create new booking
export const createBooking = async (bookingData) => {
    const response = await fetch(`${API_URL}/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create booking');
    }

    return response.json();
};

// Update booking status
export const updateBookingStatus = async (bookingId, status, notes = '') => {
    const response = await fetch(`${API_URL}/${bookingId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status, notes }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update booking status');
    }

    return response.json();
};

// Cancel booking
export const cancelBooking = async (bookingId, reason = '') => {
    const response = await fetch(`${API_URL}/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel booking');
    }

    return response.json();
};

// Delete booking (admin only)
export const deleteBooking = async (bookingId) => {
    const response = await fetch(`${API_URL}/${bookingId}`, {
        method: 'DELETE',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete booking');
    }

    return response.json();
};

// Update passenger details
export const updatePassengerDetails = async (bookingId, passengerDetails) => {
    const response = await fetch(`${API_URL}/${bookingId}/passenger`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(passengerDetails),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update passenger details');
    }

    return response.json();
};

export default {
    getAllBookings,
    getBookingById,
    getBookingsByEmail,
    getMyBookings,
    createBooking,
    updateBookingStatus,
    cancelBooking,
    deleteBooking,
    updatePassengerDetails
};