import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getSellerOrders } from "@/api/orders";
import { getProductsBySeller } from "@/api/products";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Eye,
  Star,
  Users,
  Calendar,
  LucidePhilippinePeso,
  Award,
  Flame,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function SellerDashboard() {
  const { user, isSellerRestricted } = useAuth();
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
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [leadingStores, setLeadingStores] = useState([]);

  // Use ref to prevent infinite loops
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (user && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData();
    }
  }, [user]);

  // Separate effect for calculations - only runs when data changes
  useEffect(() => {
    if (orders.length > 0 && !loading) {
      calculateSalesData();
    }
  }, [orders, loading]);

  useEffect(() => {
    if (products.length > 0 && !loading) {
      calculateTopProducts();
    }
  }, [products, loading]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [ordersData, productsData, trendingData, storesData] =
        await Promise.all([
          getSellerOrders(user.uid),
          getProductsBySeller(user.uid),
          // Fetch trending products for this seller
          import("@/api/products").then((m) =>
            m.getTrendingProductsBySeller(user.uid, 10),
          ),
          // Fetch leading stores (all sellers)
          fetchLeadingStores(),
        ]);

      const sanitizedOrders = Array.isArray(ordersData) ? ordersData : [];
      const sanitizedProducts = Array.isArray(productsData) ? productsData : [];

      setOrders(sanitizedOrders);
      setProducts(sanitizedProducts);
      setTrendingProducts(Array.isArray(trendingData) ? trendingData : []);
      setLeadingStores(Array.isArray(storesData) ? storesData : []);

      // Calculate statistics
      calculateStats(sanitizedOrders, sanitizedProducts);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadingStores = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "http://localhost:3000/analytics/leading-stores",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        return data.stores || [];
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch leading stores:", err);
      return [];
    }
  };

  const calculateStats = (ordersData, productsData) => {
    let totalSales = 0;
    let totalOrders = ordersData.length;
    let pendingOrders = 0;
    let thisMonthSales = 0;
    const uniqueCustomers = new Set();

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    ordersData.forEach((order) => {
      // Count unique customers
      if (order.buyerId) {
        uniqueCustomers.add(order.buyerId);
      }

      // Calculate this seller's portion of the order
      let sellerOrderTotal = 0;
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item.sellerId === user.uid) {
            const itemTotal = (item.price || 0) * (item.quantity || 0);
            sellerOrderTotal += itemTotal;
          }
        });
      }

      // Add to total sales if completed or verified
      if (order.status === "completed" || order.paymentStatus === "verified") {
        totalSales += sellerOrderTotal;

        // Check if this month
        const orderDate =
          order.completedAt?.toDate?.() ||
          order.paymentVerifiedAt?.toDate?.() ||
          new Date(order.completedAt || order.createdAt);

        if (orderDate >= thisMonthStart) {
          thisMonthSales += sellerOrderTotal;
        }
      }

      // Count pending orders
      if (
        order.paymentStatus === "pending_verification" ||
        order.status === "pending" ||
        order.status === "payment_submitted"
      ) {
        pendingOrders++;
      }
    });

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
      totalOrders,
      totalProducts: productsData.length,
      pendingOrders,
      avgRating: Math.round(avgRating * 10) / 10,
      totalViews,
      totalCustomers: uniqueCustomers.size,
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

      let monthSales = 0;

      orders.forEach((order) => {
        // Only count completed or verified orders
        if (
          order.status !== "completed" &&
          order.paymentStatus !== "verified"
        ) {
          return;
        }

        const orderDate =
          order.completedAt?.toDate?.() ||
          order.paymentVerifiedAt?.toDate?.() ||
          new Date(order.completedAt || order.createdAt);

        if (orderDate >= monthStart && orderDate <= monthEnd) {
          // Calculate seller's portion
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item) => {
              if (item.sellerId === user.uid) {
                monthSales += (item.price || 0) * (item.quantity || 0);
              }
            });
          }
        }
      });

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
        revenue: (product.soldCount || 0) * (product.price || 0),
      }));

    setTopProducts(sorted);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Restriction Warning */}
        {isSellerRestricted && isSellerRestricted(user) && (
          <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-600" size={24} />
              <div>
                <h3 className="font-bold text-amber-900">Account Restricted</h3>
                <p className="text-sm text-amber-800">
                  Your account has limited access. Some features may be
                  unavailable. Please contact support for assistance.
                </p>
              </div>
            </div>
          </div>
        )}

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
                <LucidePhilippinePeso size={24} />
              </div>
              <TrendingUp size={20} className="opacity-80" />
            </div>
            <p className="text-blue-100 text-sm font-semibold mb-1">
              Total Sales
            </p>
            <p className="text-3xl font-black">
              ₱{stats.totalSales.toLocaleString()}
            </p>
            <p className="text-blue-100 text-xs mt-2">From verified orders</p>
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

        {/* Trending Products Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Flame className="text-orange-500" size={24} />
            <h2 className="text-lg font-bold text-gray-900">
              Your Trending Products
            </h2>
          </div>
          {trendingProducts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No trending products yet. Keep selling to see your trending items!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingProducts.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white font-black text-lg">
                        #{idx + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {p.name || p.productName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Sold: {p.soldCount || 0} units
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <TrendingUp size={14} className="text-orange-600" />
                        <p className="text-xs text-orange-600 font-semibold">
                          Score:{" "}
                          {p.trendingData?.score?.toFixed
                            ? p.trendingData.score.toFixed(1)
                            : p.trendingData?.score || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leading Stores Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Award className="text-blue-600" size={24} />
            <h2 className="text-lg font-bold text-gray-900">Leading Stores</h2>
            <span className="text-sm text-gray-500">
              (Top performers on the platform)
            </span>
          </div>
          {leadingStores.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Loading store rankings...
            </p>
          ) : (
            <div className="space-y-3">
              {leadingStores.slice(0, 5).map((store, idx) => {
                const isCurrentStore = store.sellerId === user.uid;
                return (
                  <div
                    key={store.sellerId}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isCurrentStore
                        ? "bg-blue-50 border-blue-500"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                            idx === 0
                              ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
                              : idx === 1
                                ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
                                : idx === 2
                                  ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                                  : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {store.storeName}
                            {isCurrentStore && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-600">
                            {store.totalProducts || 0} products •{" "}
                            {(store.avgRating || 0).toFixed(1)}⭐
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-green-600">
                          ₱{(store.totalSales || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {store.totalOrders || 0} orders
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                          style={{ width: `${Math.max(percentage, 5)}%` }}
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
          </div>
        </div>
      </div>
    </div>
  );
}
