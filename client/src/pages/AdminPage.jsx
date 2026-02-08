import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getSalesAnalytics,
  getSellersWithProducts,
  getAllUsers,
  updateUserStatus,
  getSellerApplications,
  approveSellerApplication,
  rejectSellerApplication,
} from "@/api/admin";
import {
  CheckCircle,
  Store,
  BarChart3,
  Users,
  PhilippinePesoIcon,
  Lock,
  Unlock,
  AlertCircle,
  Search,
  Settings,
  MoreVertical,
  TrendingUp,
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("analytics");
  const [applications, setApplications] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const [expandedSellerId, setExpandedSellerId] = useState(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState({
    totalSellers: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalOrderValue: 0,
    completedOrders: 0,
    totalItemsSold: 0,
    totalRevenue: 0,
    topSellers: [],
    topProducts: [],
  });

  // run once when user info becomes available
  useEffect(() => {
    const isAdmin =
      !!user &&
      (user.isAdmin || (user.role && user.role.toLowerCase() === "admin"));
    if (isAdmin) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // re-fetch when admin switches tabs (keeps sellers/users lists up-to-date)
  useEffect(() => {
    if (!user) return;
    const isAdmin =
      user.isAdmin || (user.role && user.role.toLowerCase() === "admin");
    if (!isAdmin) return;

    if (["sellers", "users", "applications", "analytics"].includes(activeTab)) {
      fetchAllData();
    }
  }, [activeTab, user]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      // Fetch applications
      const appResponse = await getSellerApplications();
      if (appResponse.success) setApplications(appResponse.applications || []);

      // Fetch new sales analytics
      try {
        const analyticsData = await getSalesAnalytics();
        setAnalytics((prev) => ({
          ...prev,
          totalOrders: analyticsData.totals?.totalOrders || 0,
          completedOrders: analyticsData.totals?.completedOrders || 0,
          totalOrderValue: analyticsData.totals?.totalOrderValue || 0,
          totalItemsSold: analyticsData.totals?.totalItemsSold || 0,
          totalRevenue: analyticsData.totals?.completedOrderValue || 0,
          topSellers: analyticsData.topEarningSellers || [],
          topProducts: analyticsData.topProducts || [],
          totalSellers: analyticsData.totals?.totalSellers || 0,
          totalUsers: analyticsData.totals?.totalUsers || 0,
        }));
      } catch (err) {
        console.error("Error fetching analytics:", err);
      }

      // Fetch sellers with products
      try {
        const sellersData = await getSellersWithProducts();
        if (Array.isArray(sellersData)) {
          setSellers(sellersData);
        }
      } catch (err) {
        console.error("Error fetching sellers:", err);
      }

      // Fetch users
      try {
        const usersData = await getAllUsers();
        if (Array.isArray(usersData)) {
          setUsers(usersData);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    } catch (error) {
      toast.error("System error: Unable to sync dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // New user management handlers
  const handleDeactivateUser = async (userId, reason = "Account violation") => {
    try {
      await updateUserStatus(userId, "deactivate", reason);
      toast.success("User account deactivated");
      fetchAllData();
    } catch (error) {
      toast.error("Failed to deactivate user: " + error.message);
    }
  };

  const handleRestrictUser = async (
    userId,
    reason = "Account under review",
  ) => {
    try {
      await updateUserStatus(userId, "restrict", reason);
      toast.success("User account restricted");
      fetchAllData();
    } catch (error) {
      toast.error("Failed to restrict user: " + error.message);
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await updateUserStatus(userId, "activate", "");
      toast.success("User account activated");
      fetchAllData();
    } catch (error) {
      toast.error("Failed to activate user: " + error.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const filteredSellers = sellers.filter(
    (s) =>
      s.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased">
      {/* Top Corporate Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <div className="bg-blue-600 p-1.5 rounded-md">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <span>
                Marketplace <span className="text-blue-600">Admin</span>
              </span>
            </div>
            <div className="h-6 w-[1px] bg-slate-200 ml-2" />
            <div className="flex gap-1">
              {[
                { id: "analytics", label: "Overview", icon: BarChart3 },
                { id: "sellers", label: "Vendors", icon: Store },
                { id: "users", label: "Accounts", icon: Users },
                { id: "applications", label: "Approvals", icon: CheckCircle },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-900">
                {user.displayName}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                {user.role}
              </p>
            </div>

            <button
              onClick={async () => {
                if (window.confirm("Are you sure you want to sign out?")) {
                  await signOut();
                  navigate("/admin-login", { replace: true });
                }
              }}
              className="ml-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 transition-colors"
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-8 py-8">
        {/* OVERVIEW SECTION */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[
                {
                  label: "Total Revenue",
                  val: `₱${analytics.totalRevenue.toLocaleString()}`,
                  icon: PhilippinePesoIcon,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Total Orders",
                  val: analytics.totalOrders,
                  icon: TrendingUp,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "Active Sellers",
                  val: analytics.totalSellers,
                  icon: Store,
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                },
                {
                  label: "Total Users",
                  val: analytics.totalUsers || users.length,
                  icon: Users,
                  color: "text-indigo-600",
                  bg: "bg-indigo-50",
                },
                {
                  label: "Items Sold",
                  val: analytics.totalItemsSold,
                  icon: AlertCircle,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
              ].map((kpi, i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {kpi.label}
                    </span>
                    <div className={`${kpi.bg} p-2 rounded-lg`}>
                      <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{kpi.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Top Products</h3>
                  <button
                    onClick={() => {
                      const allProducts = analytics.topProducts || [];
                      if (allProducts.length > 5) {
                        toast.info(
                          `Showing ${allProducts.length} total products sorted by revenue`,
                        );
                      }
                    }}
                    className="text-blue-600 text-xs font-semibold hover:underline"
                  >
                    View All ({(analytics.topProducts || []).length})
                  </button>
                </div>
                <div className="p-0">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 font-bold">
                      <tr>
                        <th className="px-6 py-3">Product</th>
                        <th className="px-6 py-3">Sold</th>
                        <th className="px-6 py-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analytics.topProducts?.slice(0, 5).map((p, i) => (
                        <tr
                          key={i}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-sm text-slate-900">
                              {p.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              Price: ₱{p.price?.toLocaleString()}
                            </p>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-700">
                            {p.soldCount} units
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                            ₱{p.revenue?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-6">
                  Top Earning Sellers
                </h3>
                <div className="space-y-4">
                  {analytics.topSellers?.slice(0, 5).map((seller, i) => (
                    <div
                      key={i}
                      className="pb-4 border-b border-slate-100 last:border-b-0"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {seller.storeName}
                      </p>
                      <p className="text-xs text-slate-500 mb-1">
                        {seller.soldCount} items sold
                      </p>
                      <p className="text-sm font-bold text-emerald-600">
                        ₱{seller.revenue?.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DATA TABLE TEMPLATE (Used for Sellers/Users) */}
        {(activeTab === "sellers" || activeTab === "users") && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 capitalize">
                  {activeTab} Management
                </h2>
                <p className="text-sm text-slate-500">
                  Manage and monitor platform {activeTab} data.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Identity</th>
                    <th className="px-6 py-4">Role / Type</th>
                    {activeTab === "sellers" && (
                      <th className="px-6 py-4">Sales</th>
                    )}
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeTab === "sellers"
                    ? filteredSellers
                    : filteredUsers
                  ).map((item) => (
                    <React.Fragment key={item.uid || item.id}>
                      <tr className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                              {(item.storeName || item.displayName)?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {item.storeName || item.displayName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {item.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-600 px-2 py-1 bg-slate-100 rounded border border-slate-200 capitalize">
                            {item.role || "Vendor"}
                          </span>
                        </td>
                        {activeTab === "sellers" && (
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">
                                <PhilippinePesoIcon className="w-4 h-4 inline mb-0.5" />
                                {(item.totalRevenue || 0).toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {item.totalSoldCount || 0} items •{" "}
                                {item.totalProducts || 0} products
                              </p>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                activeTab === "users"
                                  ? item.status === "active"
                                    ? "bg-emerald-500"
                                    : "bg-red-500"
                                  : item.status === "active"
                                    ? "bg-emerald-500"
                                    : "bg-red-500"
                              }`}
                            />
                            <span
                              className={`text-xs font-bold ${
                                activeTab === "users"
                                  ? item.status === "active"
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                  : item.status === "active"
                                    ? "text-emerald-600"
                                    : "text-red-600"
                              }`}
                            >
                              {(
                                activeTab === "users"
                                  ? item.status === "active"
                                  : item.status === "active"
                              )
                                ? "ACTIVE"
                                : "INACTIVE"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {activeTab === "users" && (
                              <>
                                {item.status === "active" ? (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleRestrictUser(
                                          item.uid,
                                          "Account restricted by admin",
                                        )
                                      }
                                      className="p-2 hover:bg-yellow-50 border border-transparent hover:border-yellow-200 rounded-lg transition-all"
                                      title="Restrict Account"
                                    >
                                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeactivateUser(
                                          item.uid,
                                          "Account deactivated by admin",
                                        )
                                      }
                                      className="p-2 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-all"
                                      title="Deactivate Account"
                                    >
                                      <Lock className="w-4 h-4 text-red-600" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleActivateUser(item.uid)}
                                    className="p-2 hover:bg-green-50 border border-transparent hover:border-green-200 rounded-lg transition-all"
                                    title="Activate Account"
                                  >
                                    <Unlock className="w-4 h-4 text-green-600" />
                                  </button>
                                )}
                              </>
                            )}
                            {activeTab === "sellers" && (
                              <button
                                onClick={() =>
                                  setExpandedSellerId(
                                    expandedSellerId === item.id
                                      ? null
                                      : item.id,
                                  )
                                }
                                className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
                              >
                                <MoreVertical className="w-4 h-4 text-slate-400" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {activeTab === "sellers" &&
                        expandedSellerId === item.id && (
                          <tr className="bg-slate-50 border-b-2 border-blue-200">
                            <td colSpan="5" className="px-6 py-6">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-bold text-slate-800 text-sm">
                                    Products ({item.totalProducts || 0})
                                  </h4>
                                  <span className="text-xs text-slate-500">
                                    Total Revenue: ₱
                                    {(item.totalRevenue || 0).toLocaleString()}
                                  </span>
                                </div>
                                {item.products && item.products.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                      <thead className="bg-white border-b border-slate-200">
                                        <tr>
                                          <th className="px-4 py-2 text-xs font-semibold text-slate-600">
                                            Product Name
                                          </th>
                                          <th className="px-4 py-2 text-xs font-semibold text-slate-600">
                                            Price
                                          </th>
                                          <th className="px-4 py-2 text-xs font-semibold text-slate-600">
                                            Stock
                                          </th>
                                          <th className="px-4 py-2 text-xs font-semibold text-slate-600">
                                            Sold
                                          </th>
                                          <th className="px-4 py-2 text-xs font-semibold text-slate-600">
                                            Revenue
                                          </th>
                                          <th className="px-4 py-2 text-xs font-semibold text-slate-600">
                                            Rating
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {item.products.map((product, idx) => (
                                          <tr
                                            key={idx}
                                            className="hover:bg-white"
                                          >
                                            <td className="px-4 py-2">
                                              <div className="flex items-center gap-2">
                                                {product.imageUrl && (
                                                  <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-6 h-6 rounded object-cover"
                                                  />
                                                )}
                                                <span className="text-slate-700">
                                                  {product.name}
                                                </span>
                                              </div>
                                            </td>
                                            <td className="px-4 py-2 text-slate-700">
                                              ₱{product.price?.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2 text-slate-700">
                                              {product.stock}
                                            </td>
                                            <td className="px-4 py-2 font-semibold text-emerald-600">
                                              {product.soldCount}
                                            </td>
                                            <td className="px-4 py-2 font-semibold text-slate-700">
                                              ₱
                                              {(
                                                product.totalRevenue || 0
                                              ).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2 text-slate-600">
                                              {product.ratingAverage
                                                ? `${product.ratingAverage.toFixed(1)}⭐`
                                                : "No ratings"}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-500 text-center py-4">
                                    No products found
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SELLER APPLICATIONS SECTION */}
        {activeTab === "applications" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">
                  Seller Applications
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {applications.length} pending application
                  {applications.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-slate-500">Loading applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-500">No pending applications</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <div
                      key={app.uid}
                      className="p-6 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200 flex-shrink-0">
                            {app.displayName?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm">
                              {app.displayName || app.username}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {app.email}
                            </p>
                            <div className="mt-3 space-y-2">
                              <div className="text-sm">
                                <p className="text-xs font-semibold text-slate-600 uppercase">
                                  Store Name
                                </p>
                                <p className="text-slate-900 font-medium">
                                  {app.sellerApplication?.storeName}
                                </p>
                              </div>
                              <div className="text-sm">
                                <p className="text-xs font-semibold text-slate-600 uppercase">
                                  Description
                                </p>
                                <p className="text-slate-600 text-sm">
                                  {app.sellerApplication?.storeDescription}
                                </p>
                              </div>
                              {app.sellerApplication?.paymentDetails && (
                                <div className="text-sm">
                                  <p className="text-xs font-semibold text-slate-600 uppercase">
                                    Payment Details
                                  </p>
                                  <p className="text-slate-600 text-sm">
                                    {
                                      app.sellerApplication.paymentDetails
                                        .bankName
                                    }{" "}
                                    •{" "}
                                    {
                                      app.sellerApplication.paymentDetails
                                        .accountName
                                    }
                                  </p>
                                </div>
                              )}
                              {app.contact && (
                                <div className="text-sm">
                                  <p className="text-xs font-semibold text-slate-600 uppercase">
                                    Contact
                                  </p>
                                  <p className="text-slate-900">
                                    {app.contact}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={async () => {
                              if (
                                window.confirm(
                                  `Approve seller application from ${app.displayName}?`,
                                )
                              ) {
                                try {
                                  const result = await approveSellerApplication(
                                    app.uid,
                                  );
                                  if (result.success) {
                                    toast.success("Application approved!");
                                    setApplications(
                                      applications.filter(
                                        (a) => a.uid !== app.uid,
                                      ),
                                    );
                                  } else {
                                    toast.error(
                                      result.message || "Failed to approve",
                                    );
                                  }
                                } catch (error) {
                                  toast.error("Error approving application");
                                  console.error(error);
                                }
                              }
                            }}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              const reason = prompt(
                                `Rejection reason for ${app.displayName}:`,
                              );
                              if (reason !== null) {
                                try {
                                  const result = await rejectSellerApplication(
                                    app.uid,
                                    reason,
                                  );
                                  if (result.success) {
                                    toast.success("Application rejected!");
                                    setApplications(
                                      applications.filter(
                                        (a) => a.uid !== app.uid,
                                      ),
                                    );
                                  } else {
                                    toast.error(
                                      result.message || "Failed to reject",
                                    );
                                  }
                                } catch (error) {
                                  toast.error("Error rejecting application");
                                  console.error(error);
                                }
                              }
                            }}
                            className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
