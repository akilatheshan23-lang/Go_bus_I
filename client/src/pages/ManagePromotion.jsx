import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus
} from '../services/paymentService.js';

const ManagePromotion = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  
  // Form state for creating/editing promotions
  const [formData, setFormData] = useState({
    promoCode: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    validUntil: '',
    usageLimit: '',
    minimumAmount: '',
    applicableRoutes: []
  });

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || user?.role !== 'admin') {
        navigate('/admin/login');
        return;
      }
      loadPromotions();
    }
  }, [user, isAuthenticated, loading, navigate]);

  const loadPromotions = async () => {
    try {
      setIsLoading(true);
      const response = await getAllPromotions();
      setPromotions(response.promotions || []);
    } catch (error) {
      setMessage('Failed to load promotions: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      promoCode: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      validUntil: '',
      usageLimit: '',
      minimumAmount: '',
      applicableRoutes: []
    });
    setShowAddForm(false);
    setEditingPromotion(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      // Prepare data for submission
      const promotionData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        minimumAmount: formData.minimumAmount ? parseFloat(formData.minimumAmount) : 0,
        validUntil: new Date(formData.validUntil).toISOString()
      };

      if (editingPromotion) {
        await updatePromotion(editingPromotion._id, promotionData);
        setMessage('Promotion updated successfully!');
      } else {
        await createPromotion(promotionData);
        setMessage('Promotion created successfully!');
      }

      resetForm();
      loadPromotions();
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const handleEdit = (promotion) => {
    setFormData({
      promoCode: promotion.promoCode,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue.toString(),
      validUntil: new Date(promotion.validUntil).toISOString().split('T')[0],
      usageLimit: promotion.usageLimit ? promotion.usageLimit.toString() : '',
      minimumAmount: promotion.minimumAmount ? promotion.minimumAmount.toString() : '',
      applicableRoutes: promotion.applicableRoutes || []
    });
    setEditingPromotion(promotion);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        await deletePromotion(id);
        setMessage('Promotion deleted successfully!');
        loadPromotions();
      } catch (error) {
        setMessage('Error deleting promotion: ' + error.message);
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await togglePromotionStatus(id);
      setMessage('Promotion status updated successfully!');
      loadPromotions();
    } catch (error) {
      setMessage('Error updating status: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

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
            <h1 className="text-3xl font-bold text-gray-800">Manage Promotions</h1>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600"
            >
              ← Back to Admin Panel
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6">
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(!showAddForm);
            }}
            className="px-6 py-3 font-semibold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {showAddForm ? 'Cancel' : 'Add New Promotion'}
          </button>
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

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-xl font-semibold">
              {editingPromotion ? 'Edit Promotion' : 'Add New Promotion'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-semibold">Promo Code *</label>
                  <input
                    type="text"
                    value={formData.promoCode}
                    onChange={(e) => setFormData({...formData, promoCode: e.target.value.toUpperCase()})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., SAVE20"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold">Discount Type *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-semibold">
                    Discount Value * ({formData.discountType === 'percentage' ? '%' : 'LKR'})
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={formData.discountType === 'percentage' ? '20' : '500'}
                    min="0"
                    max={formData.discountType === 'percentage' ? '100' : undefined}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold">Valid Until *</label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="e.g., Get 20% off on all bus bookings"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-semibold">Usage Limit (Optional)</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 100 (leave empty for unlimited)"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold">Minimum Amount (LKR)</label>
                  <input
                    type="number"
                    value={formData.minimumAmount}
                    onChange={(e) => setFormData({...formData, minimumAmount: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 font-semibold text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 font-semibold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Promotions List */}
        <div className="overflow-hidden bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">All Promotions ({promotions.length})</h2>
          </div>
          
          {promotions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No promotions found. Create your first promotion to get started!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Discount</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Valid Until</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Usage</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {promotions.map((promotion) => (
                    <tr key={promotion._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-blue-600">{promotion.promoCode}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs text-sm text-gray-900 truncate" title={promotion.description}>
                          {promotion.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {promotion.discountType === 'percentage' 
                            ? `${promotion.discountValue}%` 
                            : `LKR ${promotion.discountValue}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {formatDate(promotion.validUntil)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {promotion.usageCount || 0} / {promotion.usageLimit || '∞'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          promotion.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {promotion.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2 text-sm font-medium whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(promotion)}
                          className="font-semibold text-blue-600 underline cursor-pointer hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(promotion._id)}
                          className={`font-semibold ${
                            promotion.isActive 
                              ? 'text-orange-600 hover:text-orange-800 bg-orange-600/30 p-2 rounded' 
                              : 'text-green-600 hover:text-green-800 bg-green-600/30 p-2 rounded'
                          }`}
                        >
                          {promotion.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(promotion._id)}
                          className="p-2 font-semibold text-red-600 rounded bg-red-600/30 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePromotion;