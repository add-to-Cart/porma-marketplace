// hooks/useStockCheck.js
import { useState } from "react";
import api from "@/api/api";

export const useStockCheck = () => {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  const checkStock = async (productId, quantity) => {
    try {
      setChecking(true);
      setError(null);

      const res = await api.get(`/products/${productId}/stock`);
      const { stock } = res.data;

      if (stock < quantity) {
        setError(`Only ${stock} item(s) available. You requested ${quantity}.`);
        return { available: false, availableStock: stock };
      }

      return { available: true, availableStock: stock };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to check stock";
      setError(message);
      return { available: false, availableStock: 0 };
    } finally {
      setChecking(false);
    }
  };

  const checkMultipleProducts = async (items) => {
    try {
      setChecking(true);
      setError(null);

      const res = await api.post("/products/check-stock", { items });

      if (!res.data.allAvailable) {
        const insufficientItems = res.data.insufficientItems
          .map(
            (item) =>
              `${item.productName}: ${item.available} available, ${item.requested} requested`,
          )
          .join("; ");

        setError(`Insufficient stock: ${insufficientItems}`);
        return {
          allAvailable: false,
          insufficientItems: res.data.insufficientItems,
        };
      }

      return { allAvailable: true, insufficientItems: [] };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to check stock";
      setError(message);
      return { allAvailable: false, insufficientItems: [] };
    } finally {
      setChecking(false);
    }
  };

  return { checkStock, checkMultipleProducts, checking, error, setError };
};

// ============================================
// StockBadge Component for Product Cards
// ============================================

import { AlertCircle } from "lucide-react";

export const StockBadge = ({
  stock,
  isLowStock = false,
  isOutOfStock = false,
}) => {
  if (isOutOfStock) {
    return (
      <div className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1">
        <AlertCircle size={12} />
        Out of Stock
      </div>
    );
  }

  if (isLowStock) {
    return (
      <div className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
        Only {stock} left
      </div>
    );
  }

  return (
    <div className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
      In Stock ({stock})
    </div>
  );
};

// ============================================
// Stock Check Overlay for ProductDetails
// ============================================

export const StockCheckOverlay = ({
  quantity,
  availableStock,
  onQuantityChange,
}) => {
  if (quantity > availableStock) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-red-700 font-semibold mb-2">
          ⚠️ Quantity exceeds available stock
        </p>
        <p className="text-sm text-red-600 mb-3">
          Only {availableStock} item(s) available
        </p>
        <button
          onClick={() => onQuantityChange(availableStock)}
          className="text-sm bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Adjust to {availableStock}
        </button>
      </div>
    );
  }

  if (availableStock < 5) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-amber-700 font-semibold">
          ⏰ Low stock alert - Only {availableStock} item(s) remaining
        </p>
      </div>
    );
  }

  return null;
};
