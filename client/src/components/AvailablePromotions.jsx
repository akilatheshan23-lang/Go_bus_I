import React, { useState, useEffect } from 'react';

const AvailablePromotions = ({ isOpen, onClose, onSelectPromotion }) => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchPromotions();
        }
    }, [isOpen]);

    const fetchPromotions = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch('http://localhost:5001/api/promotions/public');
            if (response.ok) {
                const data = await response.json();
                setPromotions(data || []);
            } else {
                setError('Failed to fetch promotions');
            }
        } catch (error) {
            console.error('Error fetching promotions:', error);
            setError('Unable to load promotions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPromotion = (promotionCode) => {
        onSelectPromotion(promotionCode);
        onClose();
    };

    const formatDiscountValue = (promotion) => {
        if (promotion.discountType === 'percentage') {
            return `${promotion.discountValue}% OFF`;
        } else {
            return `LKR ${promotion.discountValue} OFF`;
        }
    };

    const formatExpiryDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Available Promotions</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-gray-600">Loading promotions...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <div className="text-red-500 mb-2">⚠️</div>
                            <p className="text-red-600">{error}</p>
                            <button
                                onClick={fetchPromotions}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : promotions.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-gray-400 mb-2 text-4xl">🎫</div>
                            <p className="text-gray-600">No promotions available at the moment.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {promotions.map((promotion) => (
                                <div
                                    key={promotion._id}
                                    className="border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                                                                        onClick={() => handleSelectPromotion(promotion.promoCode)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                    {promotion.promoCode}
                                                </span>
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">
                                                    {formatDiscountValue(promotion)}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                                {promotion.promoCode} - Special Offer
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-2">
                                                {promotion.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                {promotion.validUntil && (
                                                    <span>Expires: {formatExpiryDate(promotion.validUntil)}</span>
                                                )}
                                                {promotion.usageLimit && (
                                                    <span>Usage Limit: {promotion.usageLimit}</span>
                                                )}
                                                {promotion.usageCount !== undefined && (
                                                    <span>Used: {promotion.usageCount} times</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                                                Select
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Additional Info */}
                                    {(promotion.minimumAmount || promotion.maxDiscountAmount) && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                {promotion.minimumAmount && (
                                                    <span>Min Order: LKR {promotion.minimumAmount}</span>
                                                )}
                                                {promotion.maxDiscountAmount && (
                                                    <span>Max Discount: LKR {promotion.maxDiscountAmount}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t bg-gray-50">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AvailablePromotions;