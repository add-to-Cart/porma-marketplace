import React, { useState, useEffect } from "react";
import {
  getSalesAnalytics,
  getSellersWithProducts,
  updateUserStatus,
  verifyDataConsistency,
  syncAllSellerMetrics,
} from "@/api/admin";

/**
 * Example Admin Dashboard Component
 * Shows how to use the new admin features
 */

export const AdminDashboardExample = () => {
  const [analytics, setAnalytics] = useState(null);
  const [sellers, setSellers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch sales analytics
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getSalesAnalytics();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sellers with products
  const fetchSellers = async () => {
    try {
      setLoading(true);
      const data = await getSellersWithProducts();
      setSellers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Deactivate a user
  const handleDeactivateUser = async (userId, reason) => {
    try {
      await updateUserStatus(userId, "deactivate", reason);
      alert("User deactivated successfully");
      // Refresh data if needed
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Restrict a user
  const handleRestrictUser = async (userId, reason) => {
    try {
      await updateUserStatus(userId, "restrict", reason);
      alert("User restricted successfully");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Activate a user
  const handleActivateUser = async (userId) => {
    try {
      await updateUserStatus(userId, "activate");
      alert("User activated successfully");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Verify data consistency
  const handleVerifyConsistency = async () => {
    try {
      setLoading(true);
      const report = await verifyDataConsistency();
      console.log("Data Consistency Report:", report);
      if (report.isConsistent) {
        alert("✅ All data is consistent!");
      } else {
        alert(
          `⚠️ Found ${report.inconsistencies.length} inconsistencies:\n${report.inconsistencies
            .map((i) => i.message)
            .join("\n")}`,
        );
      }
      setError(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Sync all seller metrics
  const handleSyncAllMetrics = async () => {
    try {
      setLoading(true);
      const result = await syncAllSellerMetrics();
      alert(`✅ Synced ${result.syncedSellers} sellers successfully!`);
      // Refresh analytics
      await fetchAnalytics();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchSellers();
  }, []);

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {error && <div className="error-alert">{error}</div>}

      {/* Action Buttons */}
      <div className="admin-actions">
        <button onClick={handleVerifyConsistency} disabled={loading}>
          Verify Data Consistency
        </button>
        <button onClick={handleSyncAllMetrics} disabled={loading}>
          Sync All Seller Metrics
        </button>
      </div>

      {/* Sales Analytics Section */}
      {analytics && (
        <section className="analytics-section">
          <h2>Sales Analytics</h2>
          <div className="metrics-grid">
            <MetricCard
              title="Total Orders"
              value={analytics.totals.totalOrders}
            />
            <MetricCard
              title="Completed Orders"
              value={analytics.totals.completedOrders}
            />
            <MetricCard
              title="Total Order Value"
              value={`₱${analytics.totals.totalOrderValue.toLocaleString()}`}
            />
            <MetricCard
              title="Items Sold"
              value={analytics.totals.totalItemsSold}
            />
          </div>

          {/* Top Products */}
          <div className="top-products">
            <h3>Top Performing Products</h3>
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Sold Count</th>
                  <th>Price</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.soldCount}</td>
                    <td>₱{product.price.toLocaleString()}</td>
                    <td>₱{product.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Earning Sellers */}
          <div className="top-sellers">
            <h3>Top Earning Sellers</h3>
            <table>
              <thead>
                <tr>
                  <th>Store Name</th>
                  <th>Items Sold</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topEarningSellers.map((seller) => (
                  <tr key={seller.sellerId}>
                    <td>{seller.storeName}</td>
                    <td>{seller.soldCount}</td>
                    <td>₱{seller.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Sellers with Products Section */}
      {sellers && (
        <section className="sellers-section">
          <h2>Sellers & Products</h2>
          {sellers.map((seller) => (
            <SellerCard key={seller.id} seller={seller} />
          ))}
        </section>
      )}

      {loading && <div className="loader">Loading...</div>}
    </div>
  );
};

/**
 * Metric Card Component
 */
const MetricCard = ({ title, value }) => (
  <div className="metric-card">
    <h4>{title}</h4>
    <p className="metric-value">{value}</p>
  </div>
);

/**
 * Seller Card Component - Shows seller with products
 */
const SellerCard = ({ seller }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="seller-card">
      <div className="seller-header" onClick={() => setExpanded(!expanded)}>
        <div>
          <h3>{seller.storeName}</h3>
          <p className="seller-owner">{seller.ownerName}</p>
        </div>
        <div className="seller-stats">
          <span className="stat">📦 {seller.totalProducts} products</span>
          <span className="stat">📊 {seller.totalSoldCount} sold</span>
          <span className="stat">
            💰 ₱{seller.totalRevenue.toLocaleString()}
          </span>
          <span className="stat">⭐ {seller.averageRating.toFixed(1)}</span>
        </div>
      </div>

      {expanded && (
        <div className="seller-details">
          <h4>Products</h4>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {seller.products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>₱{product.price.toLocaleString()}</td>
                  <td>{product.stock}</td>
                  <td>{product.soldCount}</td>
                  <td>₱{product.totalRevenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardExample;

/**
 * USER MANAGEMENT COMPONENT EXAMPLE
 */

export const UserManagementComponent = ({ userId }) => {
  const [userStatus, setUserStatus] = useState("active");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUserAction = async (action) => {
    if ((action === "deactivate" || action === "restrict") && !reason) {
      alert("Please provide a reason");
      return;
    }

    try {
      setLoading(true);
      await updateUserStatus(userId, action, reason);
      setUserStatus(action === "activate" ? "active" : action);
      setReason("");
      setShowReasonInput(false);
      alert(`✅ User ${action}d successfully`);
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-management">
      <h3>User Account Management</h3>

      <div className="user-status">
        <p>
          Current Status: <strong>{userStatus}</strong>
        </p>
      </div>

      <div className="action-buttons">
        {userStatus !== "deactivated" && (
          <button
            onClick={() => setShowReasonInput(!showReasonInput)}
            className="btn-danger"
          >
            Deactivate Account
          </button>
        )}

        {userStatus !== "restricted" && userStatus !== "deactivated" && (
          <button
            onClick={() => setShowReasonInput(!showReasonInput)}
            className="btn-warning"
          >
            Restrict Account
          </button>
        )}

        {userStatus !== "active" && (
          <button
            onClick={() => handleUserAction("activate")}
            className="btn-success"
            disabled={loading}
          >
            Activate Account
          </button>
        )}
      </div>

      {showReasonInput && (
        <div className="reason-input">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a reason for this action..."
            rows="3"
          />
          <button
            onClick={() =>
              handleUserAction(
                userStatus === "active" ? "deactivate" : "restrict",
              )
            }
            disabled={loading}
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
};
