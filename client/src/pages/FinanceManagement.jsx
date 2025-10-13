import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import axios from "axios";
const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function FinanceManagement() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    dailyRevenue: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    averageBookingValue: 0,
    topRoutes: [],
    recentTransactions: [],
    monthlyTrends: []
  });
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/admin/login");
        return;
      }
      if (user?.role !== "admin") {
        navigate("/admin");
        return;
      }
      loadFinancialData();
    }
  }, [user, isAuthenticated, loading, navigate, dateRange]);

  useEffect(() => {
    filterPayments();
  }, [payments, paymentFilter, searchTerm]);

  async function loadFinancialData() {
    try {
      const [paymentsRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/api/admin/payments`, { withCredentials: true }),
        axios.get(`${API}/api/admin/bookings`, { withCredentials: true })
      ]);
      
      const paymentsData = paymentsRes.data || [];
      const bookingsData = bookingsRes.data || [];
      
      setPayments(paymentsData);
      setBookings(bookingsData);
      
      calculateFinancialMetrics(paymentsData, bookingsData);
    } catch (error) {
      setMsg("Failed to load financial data: " + (error.response?.data?.error || error.message));
    }
  }

  function calculateFinancialMetrics(paymentsData, bookingsData) {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Filter data by date range
    const filteredBookings = bookingsData.filter(booking => {
      const bookingDate = new Date(booking.createdAt);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
    
    const filteredPayments = paymentsData.filter(payment => {
      const paymentDate = new Date(payment.createdAt);
      return paymentDate >= startDate && paymentDate <= endDate;
    });
    
    // Calculate metrics
    const totalRevenue = filteredBookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    
    const monthlyBookings = bookingsData.filter(booking => {
      const bookingDate = new Date(booking.createdAt);
      return bookingDate >= thisMonth && booking.status === 'confirmed';
    });
    
    const monthlyRevenue = monthlyBookings
      .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    
    const dailyBookings = bookingsData.filter(booking => {
      const bookingDate = new Date(booking.createdAt);
      const todayStr = today.toDateString();
      return bookingDate.toDateString() === todayStr && booking.status === 'confirmed';
    });
    
    const dailyRevenue = dailyBookings
      .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    
    // Booking statistics
    const totalBookings = filteredBookings.length;
    const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed').length;
    const pendingBookings = filteredBookings.filter(b => b.status === 'pending').length;
    const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled').length;
    
    const averageBookingValue = confirmedBookings > 0 
      ? totalRevenue / confirmedBookings 
      : 0;
    
    // Top routes by revenue
    const routeRevenue = {};
    filteredBookings.forEach(booking => {
      if (booking.status === 'confirmed' && booking.schedule) {
        const route = `${booking.schedule.from} → ${booking.schedule.to}`;
        routeRevenue[route] = (routeRevenue[route] || 0) + (booking.totalAmount || 0);
      }
    });
    
    const topRoutes = Object.entries(routeRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([route, revenue]) => ({ route, revenue }));
    
    // Recent transactions (last 10)
    const recentTransactions = filteredPayments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
    
    // Monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      
      const monthBookings = bookingsData.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= monthDate && bookingDate < nextMonth && booking.status === 'confirmed';
      });
      
      const monthRevenue = monthBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
      
      monthlyTrends.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        bookings: monthBookings.length
      });
    }
    
    setFinancialData({
      totalRevenue,
      monthlyRevenue,
      dailyRevenue,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      averageBookingValue,
      topRoutes,
      recentTransactions,
      monthlyTrends
    });
  }

  function filterPayments() {
    let filtered = [...payments];
    
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (paymentFilter !== "all") {
      filtered = filtered.filter(payment => payment.status === paymentFilter);
    }
    
    setFilteredPayments(filtered);
  }

  async function exportFinancialReport() {
    try {
      setMsg("Generating financial report...");
      
      // Create CSV data
      const csvHeaders = ["Date", "Booking ID", "Route", "Amount", "Status", "Payment Method"];
      const csvRows = bookings
        .filter(b => {
          const bookingDate = new Date(b.createdAt);
          const startDate = new Date(dateRange.startDate);
          const endDate = new Date(dateRange.endDate);
          return bookingDate >= startDate && bookingDate <= endDate;
        })
        .map(booking => [
          new Date(booking.createdAt).toLocaleDateString(),
          booking._id,
          booking.schedule ? `${booking.schedule.from} → ${booking.schedule.to}` : 'N/A',
          booking.totalAmount || 0,
          booking.status,
          booking.paymentMethod || 'N/A'
        ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `financial-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMsg("Financial report exported successfully!");
    } catch (error) {
      setMsg("Error exporting report: " + error.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button 
              onClick={() => navigate("/admin")}
              className="flex items-center mb-2 text-blue-600 hover:text-blue-800"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-gray-900">Finance Management</h1>
            <p className="text-gray-600">Financial overview, revenue tracking, and payment management</p>
          </div>
          <button
            onClick={exportFinancialReport}
            className="px-6 py-3 text-white transition-colors bg-yellow-600 rounded-lg hover:bg-yellow-700"
          >
            Export Report
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div className="mt-6 text-sm text-gray-600">
              Showing data from {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white border-l-4 border-green-500 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">LKR {financialData.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="text-3xl text-green-500">💰</div>
            </div>
          </div>
          
          <div className="p-6 bg-white border-l-4 border-blue-500 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900">LKR {financialData.monthlyRevenue.toLocaleString()}</p>
              </div>
              <div className="text-3xl text-blue-500">📊</div>
            </div>
          </div>
          
          <div className="p-6 bg-white border-l-4 border-purple-500 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-gray-600">Daily Revenue</p>
                <p className="text-3xl font-bold text-gray-900">LKR {financialData.dailyRevenue.toLocaleString()}</p>
              </div>
              <div className="text-3xl text-purple-500">💵</div>
            </div>
          </div>
          
          <div className="p-6 bg-white border-l-4 border-orange-500 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-gray-600">Avg Booking Value</p>
                <p className="text-3xl font-bold text-gray-900">LKR {financialData.averageBookingValue.toLocaleString()}</p>
              </div>
              <div className="text-3xl text-orange-500">🎯</div>
            </div>
          </div>
        </div>

        {/* Booking Statistics */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-4">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Total Bookings</div>
            <div className="text-2xl font-bold text-gray-900">{financialData.totalBookings}</div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Confirmed</div>
            <div className="text-2xl font-bold text-green-600">{financialData.confirmedBookings}</div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{financialData.pendingBookings}</div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Cancelled</div>
            <div className="text-2xl font-bold text-red-600">{financialData.cancelledBookings}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
          {/* Monthly Trends */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Revenue Trends (Last 6 Months)</h3>
            <div className="space-y-3">
              {financialData.monthlyTrends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">{trend.month}</div>
                    <div className="text-sm text-gray-600">{trend.bookings} bookings</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">LKR {trend.revenue.toLocaleString()}</div>
                    <div className="w-24 h-2 mt-1 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-yellow-500 rounded-full" 
                        style={{ 
                          width: `${Math.max(10, (trend.revenue / Math.max(...financialData.monthlyTrends.map(t => t.revenue))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Routes */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Top Revenue Routes</h3>
            <div className="space-y-3">
              {financialData.topRoutes.map((route, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-6 h-6 mr-3 text-sm font-bold text-white bg-yellow-500 rounded-full">
                      {index + 1}
                    </div>
                    <div className="font-medium text-gray-900">{route.route}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">LKR {route.revenue.toLocaleString()}</div>
                    <div className="w-20 h-2 mt-1 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-green-500 rounded-full" 
                        style={{ 
                          width: `${Math.max(10, (route.revenue / Math.max(...financialData.topRoutes.map(r => r.revenue))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              {financialData.topRoutes.length === 0 && (
                <div className="py-8 text-center text-gray-500">No route data available for selected period</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mb-6 bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Recent Transactions</h3>
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="all">All Payments</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Transaction</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.slice(0, 20).map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.transactionId || payment._id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Booking: {payment.bookingId || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(payment.createdAt || payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-semibold text-gray-900">
                        LKR {(payment.amount || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {payment.paymentMethod || 'Cash'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.status === 'completed' || payment.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPayments.length === 0 && (
            <div className="py-12 text-center">
              <div className="text-gray-500">No transactions found matching your criteria.</div>
            </div>
          )}
        </div>

        {/* Messages */}
        {msg && (
          <div className={`mt-6 p-4 rounded-lg ${
            msg.includes('Error') || msg.includes('Failed')
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}