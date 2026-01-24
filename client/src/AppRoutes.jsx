import { Routes, Route, Navigate } from "react-router-dom";
import MarketPlaceLayout from "@/layout/MarketplaceLayout";
import SellerLayout from "@/layout/SellerLayout";
import ProtectedSellerRoute from "@/components/ProtectedSellerRoute";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminPage from "@/pages/AdminPage";
import AdminLogin from "@/pages/AdminLogin";

import MarketPlace from "@/pages/Marketplace";
import ProductUpdate from "@/pages/ProductUpdate";
import CompatibleParts from "@/pages/CompatibleParts";
import InventoryPage from "@/pages/InventoryPage";
import ProductDetails from "@/pages/ProductDetails";
import TrendingProduct from "@/pages/TrendingProduct";
import DealsPage from "@/pages/DealsPage";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import SellerDashboard from "@/pages/SellerDashboard";
import SellerOrdersPage from "@/pages/SellerOrdersPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import OrdersPage from "@/pages/OrdersPage";
import SellerAccount from "@/pages/SellerAccount";
import SellerApplication from "@/pages/SellerApplication";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Admin Route - Protected */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminPage />
          </ProtectedAdminRoute>
        }
      />

      {/* Marketplace Layout */}
      <Route element={<MarketPlaceLayout />}>
        <Route path="/" element={<MarketPlace />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/products/update/:id" element={<ProductUpdate />} />
        <Route path="/compatible-parts" element={<CompatibleParts />} />

        <Route path="/trending" element={<TrendingProduct />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/apply-seller" element={<SellerApplication />} />
      </Route>

      {/* Seller Layout - Protected Routes */}
      <Route
        element={
          <ProtectedSellerRoute>
            <SellerLayout />
          </ProtectedSellerRoute>
        }
      >
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/product" element={<InventoryPage />} />
        <Route path="/seller/orders" element={<SellerOrdersPage />} />
        <Route path="/seller/analytics" element={<AnalyticsPage />} />
        <Route path="/seller/account" element={<SellerAccount />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
