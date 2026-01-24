import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getSellerOrders } from "@/api/orders";
import { getProductsBySeller } from "@/api/products";
import {
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  Eye,
  Star,
  Users,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

export default function SellerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    avgRating: 0,
    totalViews: 0,
    totalCustomers: 0,
    thisMonthSales: 0,
  });

  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (orders.length > 0) {
      calculateSalesData();
    }
    if (products.length > 0) {
      calculateTopProducts();
    }
  }, [orders, products]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch orders and products in parallel
      const [ordersData, productsData] = await Promise.all([
        getSellerOrders(user.uid),
        getProductsBySeller(user.uid),
      ]);

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);

      // Calculate statistics
      calculateStats(ordersData, productsData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData, productsData) => {
    // Calculate total sales from completed orders
    const completedOrders = ordersData.filter((o) => o.status === "completed");
    const totalSales = completedOrders.reduce(
      (sum, order) => sum + (order.total || 0),
      0,
    );

    // Calculate pending orders (awaiting payment verification)
    const pendingOrders = ordersData.filter(
      (o) =>
        o.paymentStatus === "pending_verification" || o.status === "pending",
    ).length;

    // Calculate this month's sales
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthOrders = completedOrders.filter((order) => {
      const orderDate =
        order.completedAt?.toDate?.() ||
        new Date(order.completedAt || order.createdAt);
      return orderDate >= thisMonthStart;
    });
    const thisMonthSales = thisMonthOrders.reduce(
      (sum, order) => sum + (order.total || 0),
      0,
    );

    // Get unique customers
    const uniqueCustomers = new Set(ordersData.map((o) => o.buyerId)).size;

    // Calculate total views and average rating from products
    const totalViews = productsData.reduce(
      (sum, p) => sum + (p.viewCount || 0),
      0,
    );
    const productsWithRatings = productsData.filter((p) => p.ratingsCount > 0);
    const avgRating =
      productsWithRatings.length > 0
        ? productsWithRatings.reduce(
            (sum, p) => sum + (p.ratingAverage || 0),
            0,
          ) / productsWithRatings.length
        : 0;

    setStats({
      totalSales,
      totalOrders: ordersData.length,
      totalProducts: productsData.length,
      pendingOrders,
      avgRating: Math.round(avgRating * 10) / 10,
      totalViews,
      totalCustomers: uniqueCustomers,
      thisMonthSales,
    });
  };

  const calculateSalesData = () => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const now = new Date();
    const last5Months = [];

    for (let i = 4; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthOrders = orders.filter((order) => {
        if (order.status !== "completed") return false;
        const orderDate =
          order.completedAt?.toDate?.() ||
          new Date(order.completedAt || order.createdAt);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });

      const monthSales = monthOrders.reduce(
        (sum, order) => sum + (order.total || 0),
        0,
      );

      last5Months.push({
        month: monthNames[date.getMonth()],
        sales: monthSales,
      });
    }

    setSalesData(last5Months);
  };

  const calculateTopProducts = () => {
    // Sort products by soldCount and take top 3
    const sorted = [...products]
      .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      .slice(0, 3)
      .map((product) => ({
        name: product.name,
        sold: product.soldCount || 0,
        revenue:
          (product.soldCount || 0) * (product.basePrice || product.price || 0),
      }));

    setTopProducts(sorted);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <p className="text-gray-500 animate-pulse">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's your store performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Sales */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <DollarSign size={24} />
              </div>
              <TrendingUp size={20} className="opacity-80" />
            </div>
            <p className="text-blue-100 text-sm font-semibold mb-1">
              Total Sales
            </p>
            <p className="text-3xl font-black">
              ₱{stats.totalSales.toLocaleString()}
            </p>
            <p className="text-blue-100 text-xs mt-2">From completed orders</p>
          </div>

          {/* Total Orders */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <ShoppingCart size={24} />
              </div>
              <div className="px-2 py-1 bg-white/20 rounded-full text-xs font-bold">
                {stats.pendingOrders} pending
              </div>
            </div>
            <p className="text-green-100 text-sm font-semibold mb-1">
              Total Orders
            </p>
            <p className="text-3xl font-black">{stats.totalOrders}</p>
            <p className="text-green-100 text-xs mt-2">All time</p>
          </div>

          {/* Total Products */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Package size={24} />
              </div>
            </div>
            <p className="text-purple-100 text-sm font-semibold mb-1">
              Active Products
            </p>
            <p className="text-3xl font-black">{stats.totalProducts}</p>
            <p className="text-purple-100 text-xs mt-2">In your catalog</p>
          </div>

          {/* Average Rating */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Star size={24} />
              </div>
            </div>
            <p className="text-amber-100 text-sm font-semibold mb-1">
              Average Rating
            </p>
            <p className="text-3xl font-black">{stats.avgRating}/5.0</p>
            <p className="text-amber-100 text-xs mt-2">
              Based on customer reviews
            </p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Eye size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalViews.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Users size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalCustomers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Calendar size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₱{stats.thisMonthSales.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              Sales Trend (Last 5 Months)
            </h2>
            <div className="space-y-4">
              {salesData.length > 0 ? (
                salesData.map((item, index) => {
                  const maxSales = Math.max(
                    ...salesData.map((d) => d.sales),
                    1,
                  );
                  const percentage = (item.sales / maxSales) * 100;

                  return (
                    <div key={index} className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-gray-700 w-12">
                        {item.month}
                      </span>
                      <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-end pr-3"
                          style={{ width: `${percentage}%` }}
                        >
                          {item.sales > 0 && (
                            <span className="text-xs font-bold text-white">
                              ₱{item.sales.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-10">
                  No sales data available
                </p>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              Top Selling Products
            </h2>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-black text-lg">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.sold} units sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-green-600">
                        ₱{product.revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-10">
                  No product data available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => (window.location.href = "/seller/product")}
              className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-lg transition-all border border-white/20 text-left"
            >
              <Package size={20} className="mb-2" />
              <p className="font-bold text-sm">Add Product</p>
              <p className="text-xs text-gray-300">List new item</p>
            </button>
            <button
              onClick={() => (window.location.href = "/seller/orders")}
              className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-lg transition-all border border-white/20 text-left"
            >
              <ShoppingCart size={20} className="mb-2" />
              <p className="font-bold text-sm">View Orders</p>
              <p className="text-xs text-gray-300">
                {stats.pendingOrders} pending
              </p>
            </button>
            <button
              onClick={() => (window.location.href = "/seller/analytics")}
              className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-lg transition-all border border-white/20 text-left"
            >
              <TrendingUp size={20} className="mb-2" />
              <p className="font-bold text-sm">Analytics</p>
              <p className="text-xs text-gray-300">View details</p>
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-lg transition-all border border-white/20 text-left">
              <Star size={20} className="mb-2" />
              <p className="font-bold text-sm">Reviews</p>
              <p className="text-xs text-gray-300">Manage feedback</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
