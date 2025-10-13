// Payment service for handling API calls
const API_URL = 'http://localhost:5001/api/payments';

export const processManualPayment = async (paymentData) => {
    const response = await fetch(`${API_URL}/process-payment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment processing failed');
    }

    return response.json();
};

export const getPaymentById = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch payment');
    }

    return response.json();
};

export const getAllPayments = async (page = 1, limit = 10, status = '') => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status })
    });

    const response = await fetch(`${API_URL}?${params}`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch payments');
    }

    return response.json();
};

export const deletePayment = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete payment');
    }

    return response.json();
};

export const updatePaymentStatus = async (id, status) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update payment status');
    }

    return response.json();
};

export const getUserPaymentHistory = async (passengerName) => {
    const response = await fetch(`${API_URL}/history/${encodeURIComponent(passengerName)}`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch payment history');
    }

    return response.json();
};

export const processRefund = async (paymentId, refundData) => {
    const response = await fetch(`${API_URL}/refund/${paymentId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(refundData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process refund');
    }

    return response.json();
};

// Promotion service functions
const PROMOTION_API_URL = 'http://localhost:5001/api/promotions';

export const getPublicPromotions = async () => {
    const response = await fetch(`${PROMOTION_API_URL}/public`, {
        method: 'GET',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch promotions');
    }

    return response.json();
};

export const applyPromotionCode = async (promoCode, amount) => {
    const response = await fetch(`${PROMOTION_API_URL}/apply`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ promoCode, amount }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to apply promotion code');
    }

    return response.json();
};

export const getAllPromotions = async (page = 1, limit = 10, isActive = '') => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(isActive !== '' && { isActive })
    });

    const response = await fetch(`${PROMOTION_API_URL}?${params}`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch promotions');
    }

    return response.json();
};

export const createPromotion = async (promotionData) => {
    const response = await fetch(PROMOTION_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(promotionData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create promotion');
    }

    return response.json();
};

export const updatePromotion = async (id, promotionData) => {
    const response = await fetch(`${PROMOTION_API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(promotionData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update promotion');
    }

    return response.json();
};

export const deletePromotion = async (id) => {
    const response = await fetch(`${PROMOTION_API_URL}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete promotion');
    }

    return response.json();
};

export const togglePromotionStatus = async (id) => {
    const response = await fetch(`${PROMOTION_API_URL}/${id}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to toggle promotion status');
    }

    return response.json();
};