import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
} from "../services/paymentService.js";

const ManagePromotion = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);

  const [formData, setFormData] = useState({
    promoCode: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    validUntil: "",
    usageLimit: "",
    minimumAmount: "",
    applicableRoutes: [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || user?.role !== "admin") {
        navigate("/admin/login");
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
      setMessage("Failed to load promotions: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      promoCode: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      validUntil: "",
      usageLimit: "",
      minimumAmount: "",
      applicableRoutes: [],
    });
    setErrors({});
    setShowAddForm(false);
    setEditingPromotion(null);
  };

  // ✅ Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.promoCode.trim())
      newErrors.promoCode = "Promo code is required.";
    if (!formData.description.trim())
      newErrors.description = "Description is required.";

    if (!formData.discountValue) {
      newErrors.discountValue = "Discount value is required.";
    } else if (
      formData.discountType === "percentage" &&
      (formData.discountValue <= 0 || formData.discountValue > 100)
    ) {
      newErrors.discountValue = "Percentage must be between 1 and 100.";
    } else if (
      formData.discountType === "fixed" &&
      formData.discountValue <= 0
    ) {
      newErrors.discountValue = "Fixed discount must be greater than 0.";
    }

    if (!formData.validUntil) {
      newErrors.validUntil = "Valid until date is required.";
    } else {
      const today = new Date();
      const validDate = new Date(formData.validUntil);
      if (validDate < today) {
        newErrors.validUntil = "Expiry date cannot be in the past.";
      }
    }

    // ✅ Added UsageLimit + MinimumAmount validation
    if (formData.usageLimit && formData.usageLimit < 1) {
      newErrors.usageLimit = "Usage limit must be at least 1.";
    }

    if (formData.minimumAmount && formData.minimumAmount < 0) {
      newErrors.minimumAmount = "Minimum amount cannot be negative.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) {
      setMessage("Please correct the highlighted errors.");
      return;
    }

    try {
      const promotionData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        usageLimit: formData.usageLimit
          ? parseInt(formData.usageLimit)
          : null,
        minimumAmount: formData.minimumAmount
          ? parseFloat(formData.minimumAmount)
          : 0,
        validUntil: new Date(formData.validUntil).toISOString(),
      };

      if (editingPromotion) {
        await updatePromotion(editingPromotion._id, promotionData);
        setMessage("Promotion updated successfully!");
      } else {
        await createPromotion(promotionData);
        setMessage("Promotion created successfully!");
      }

      resetForm();
      loadPromotions();
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  };

  const handleEdit = (promotion) => {
    setFormData({
      promoCode: promotion.promoCode,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue.toString(),
      validUntil: new Date(promotion.validUntil)
        .toISOString()
        .split("T")[0],
      usageLimit: promotion.usageLimit ? promotion.usageLimit.toString() : "",
      minimumAmount: promotion.minimumAmount
        ? promotion.minimumAmount.toString()
        : "",
      applicableRoutes: promotion.applicableRoutes || [],
    });
    setEditingPromotion(promotion);
    setErrors({});
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this promotion?")) {
      try {
        await deletePromotion(id);
        setMessage("Promotion deleted successfully!");
        loadPromotions();
      } catch (error) {
        setMessage("Error deleting promotion: " + error.message);
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await togglePromotionStatus(id);
      setMessage("Promotion status updated successfully!");
      loadPromotions();
    } catch (error) {
      setMessage("Error updating status: " + error.message);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString();

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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            Manage Promotions
          </h1>
          <button
            onClick={() => navigate("/admin")}
            className="px-4 py-2 text-white bg-gray-500 rounded-lg hover:bg-gray-600"
          >
            ← Back to Admin Panel
          </button>
        </div>

        {/* Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(!showAddForm);
            }}
            className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {showAddForm ? "Cancel" : "Add New Promotion"}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("Error") ||
              message.includes("Failed") ||
              message.includes("Please")
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-green-50 text-green-600 border border-green-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-xl font-semibold">
              {editingPromotion ? "Edit Promotion" : "Add New Promotion"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Promo Code + Discount Type */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-semibold">
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    value={formData.promoCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        promoCode: e.target.value.toUpperCase(),
                      })
                    }
                    className={`w-full p-3 border rounded-lg focus:ring-2 ${
                      errors.promoCode
                        ? "border-red-500 ring-red-200"
                        : "focus:ring-blue-500"
                    }`}
                    placeholder="e.g., SAVE20"
                  />
                  {errors.promoCode && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.promoCode}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>

              {/* Discount Value + Valid Until */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-semibold">
                    Discount Value * (
                    {formData.discountType === "percentage" ? "%" : "LKR"})
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({ ...formData, discountValue: e.target.value })
                    }
                    className={`w-full p-3 border rounded-lg focus:ring-2 ${
                      errors.discountValue
                        ? "border-red-500 ring-red-200"
                        : "focus:ring-blue-500"
                    }`}
                    placeholder={
                      formData.discountType === "percentage" ? "20" : "500"
                    }
                  />
                  {errors.discountValue && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.discountValue}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) =>
                      setFormData({ ...formData, validUntil: e.target.value })
                    }
                    className={`w-full p-3 border rounded-lg focus:ring-2 ${
                      errors.validUntil
                        ? "border-red-500 ring-red-200"
                        : "focus:ring-blue-500"
                    }`}
                  />
                  {errors.validUntil && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.validUntil}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block mb-2 text-sm font-semibold">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={`w-full p-3 border rounded-lg focus:ring-2 ${
                    errors.description
                      ? "border-red-500 ring-red-200"
                      : "focus:ring-blue-500"
                  }`}
                  rows="3"
                  placeholder="e.g., Get 20% off on all bus bookings"
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* ✅ Usage Limit + Minimum Amount */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-semibold">
                    Usage Limit (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, usageLimit: e.target.value })
                    }
                    className={`w-full p-3 border rounded-lg focus:ring-2 ${
                      errors.usageLimit
                        ? "border-red-500 ring-red-200"
                        : "focus:ring-blue-500"
                    }`}
                    placeholder="e.g., 100 (leave empty for unlimited)"
                  />
                  {errors.usageLimit && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.usageLimit}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold">
                    Minimum Amount (LKR)
                  </label>
                  <input
                    type="number"
                    value={formData.minimumAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimumAmount: e.target.value,
                      })
                    }
                    className={`w-full p-3 border rounded-lg focus:ring-2 ${
                      errors.minimumAmount
                        ? "border-red-500 ring-red-200"
                        : "focus:ring-blue-500"
                    }`}
                    placeholder="0"
                  />
                  {errors.minimumAmount && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.minimumAmount}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 font-semibold text-white bg-gray-500 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  {editingPromotion ? "Update Promotion" : "Create Promotion"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Promotions Table */}
        <div className="overflow-hidden bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">
              All Promotions ({promotions.length})
            </h2>
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
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Code
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Valid Until
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {promotions.map((promotion) => (
                    <tr key={promotion._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-blue-600">
                        {promotion.promoCode}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-gray-900">
                        {promotion.description}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {promotion.discountType === "percentage"
                          ? `${promotion.discountValue}%`
                          : `LKR ${promotion.discountValue}`}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {formatDate(promotion.validUntil)}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {promotion.usageCount || 0} /{" "}
                        {promotion.usageLimit || "∞"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            promotion.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {promotion.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2 text-sm">
                        <button
                          onClick={() => handleEdit(promotion)}
                          className="font-semibold text-blue-600 underline hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(promotion._id)}
                          className={`font-semibold ${
                            promotion.isActive
                              ? "text-orange-600 hover:text-orange-800 bg-orange-600/30 p-2 rounded"
                              : "text-green-600 hover:text-green-800 bg-green-600/30 p-2 rounded"
                          }`}
                        >
                          {promotion.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(promotion._id)}
                          className="p-2 font-semibold text-red-600 bg-red-600/30 rounded hover:text-red-800"
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
