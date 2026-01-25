// SellerInventoryDashboard.jsx
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Package, TrendingDown, RefreshCw } from "lucide-react";
import api from "@/api/api";
import toast from "react-hot-toast";

export default function SellerInventoryDashboard() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("low-stock"); // low-stock, out-of-stock, name

  useEffect(() => {
    if (user?.uid) {
      fetchInventory();
    }
  }, [user?.uid]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/seller/${user.uid}/inventory`);
      setInventory(res.data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const getSortedProducts = () => {
    if (!inventory) return [];

    const products = [...inventory.products];

    switch (sortBy) {
      case "low-stock":
        return products.sort((a, b) => a.availableStock - b.availableStock);
      case "out-of-stock":
        return products.filter((p) => p.isOutOfStock);
      case "name":
        return products.sort((a, b) =>
          a.productName.localeCompare(b.productName),
        );
      default:
        return products;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-500">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Failed to load inventory</p>
      </div>
    );
  }

  const sortedProducts = getSortedProducts();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <button
            onClick={fetchInventory}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Products */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">
                  Total Products
                </p>
                <p className="text-3xl font-black text-gray-900">
                  {inventory.totalProducts}
                </p>
              </div>
              <Package className="text-blue-600 opacity-20" size={40} />
            </div>
          </div>

          {/* Out of Stock */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">
                  Out of Stock
                </p>
                <p className="text-3xl font-black text-red-600">
                  {inventory.outOfStockCount}
                </p>
              </div>
              <AlertCircle className="text-red-600 opacity-20" size={40} />
            </div>
          </div>

          {/* Low Stock */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">
                  Low Stock (&lt; 5 items)
                </p>
                <p className="text-3xl font-black text-amber-600">
                  {inventory.lowStockCount}
                </p>
              </div>
              <TrendingDown className="text-amber-600 opacity-20" size={40} />
            </div>
          </div>
        </div>

        {/* Alerts */}
        {inventory.outOfStockCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 mt-0.5" size={20} />
              <div>
                <h3 className="font-bold text-red-900">
                  {inventory.outOfStockCount} Product(s) Out of Stock
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  These items need to be restocked to continue selling
                </p>
              </div>
            </div>
          </div>
        )}

        {inventory.lowStockCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-amber-600 mt-0.5" size={20} />
              <div>
                <h3 className="font-bold text-amber-900">
                  {inventory.lowStockCount} Product(s) Low on Stock
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  Consider restocking these items soon to avoid stockouts
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="low-stock">Sort by Low Stock</option>
            <option value="out-of-stock">Out of Stock Only</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Reserved
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                sortedProducts.map((product) => (
                  <tr key={product.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {product.productName}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.category}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">
                        {product.availableStock}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.reservedStock}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.soldCount}
                    </td>
                    <td className="px-6 py-4">
                      {product.isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                          <AlertCircle size={12} />
                          Out
                        </span>
                      ) : product.isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                          <AlertCircle size={12} />
                          Low
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      ₱{product.price?.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
