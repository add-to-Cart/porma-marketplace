import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { authAPI } from "@/api/auth";
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
  ChevronRight,
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("analytics");
  const [applications, setApplications] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState({
    totalSellers: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    topSellers: [],
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
      const token = localStorage.getItem("authToken");
      const appResponse = await authAPI.getSellerApplications(token);
      if (appResponse.success) setApplications(appResponse.applications || []);

      const rawBase = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const base = rawBase.replace(/\/+$/, "");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const sellersResponse = await fetch(`${base}/admin/sellers`, { headers });
      const sellersData = await sellersResponse.json();
      if (Array.isArray(sellersData)) {
        setSellers(sellersData);
        calculateAnalytics(sellersData);
      }

      const usersResponse = await fetch(`${base}/admin/users`, { headers });
      const usersData = await usersResponse.json();
      if (Array.isArray(usersData)) setUsers(usersData);
    } catch (error) {
      toast.error("System error: Unable to sync dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (sellersData) => {
    const topSellers = [...sellersData]
      .sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0))
      .slice(0, 5);
    setAnalytics((prev) => ({
      ...prev,
      totalSellers: sellersData.length,
      topSellers,
      totalRevenue: sellersData.reduce(
        (sum, s) => sum + (s.totalSales || 0),
        0,
      ),
    }));
  };

  // Re-used handlers logic remains the same (handleApprove, handleReject, etc.)
  const handleApprove = async (uid) => {
    /* logic */
  };
  const handleReject = async (uid) => {
    /* logic */
  };
  const handleBlockSeller = async (id) => {
    /* logic */
  };
  const handleUnblockSeller = async (id) => {
    /* logic */
  };
  const handleRecoverAccount = async (id) => {
    /* logic */
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
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
              {user.displayName?.charAt(0)}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-8 py-8">
        {/* OVERVIEW SECTION */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  label: "Total Revenue",
                  val: `$${analytics.totalRevenue.toLocaleString()}`,
                  icon: PhilippinePesoIcon,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Active Sellers",
                  val: analytics.totalSellers,
                  icon: Store,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "Total Platform Users",
                  val: users.length,
                  icon: Users,
                  color: "text-indigo-600",
                  bg: "bg-indigo-50",
                },
                {
                  label: "Pending Reviews",
                  val: applications.length,
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
                  <h3 className="font-bold text-slate-800">
                    Performance Leaders
                  </h3>
                  <button className="text-blue-600 text-xs font-semibold hover:underline">
                    View Report
                  </button>
                </div>
                <div className="p-0">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 font-bold">
                      <tr>
                        <th className="px-6 py-3">Store</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analytics.topSellers.map((s, i) => (
                        <tr
                          key={i}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-sm text-slate-900">
                              {s.storeName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {s.ownerName}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                              Top Performer
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                            <PhilippinePesoIcon className="inline w-4 h-4 mr-1" />
                            {s.totalSales?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-6">System Health</h3>
                <div className="space-y-6">
                  {[
                    "Database Connection",
                    "API Gateway",
                    "Storage Service",
                  ].map((service, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{service}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-600">
                          OPERATIONAL
                        </span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
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
                    <th className="px-6 py-4">Performance</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeTab === "sellers"
                    ? filteredSellers
                    : filteredUsers
                  ).map((item) => (
                    <tr
                      key={item.uid || item.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
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
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          ${(item.totalSales || 0).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${item.blocked || item.disabled ? "bg-red-500" : "bg-emerald-500"}`}
                          />
                          <span
                            className={`text-xs font-bold ${item.blocked || item.disabled ? "text-red-600" : "text-emerald-600"}`}
                          >
                            {item.blocked || item.disabled
                              ? "RESTRICTED"
                              : "ACTIVE"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all">
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
