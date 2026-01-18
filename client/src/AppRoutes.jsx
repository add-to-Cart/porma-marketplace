import { Routes, Route, Navigate } from "react-router-dom";
import MarketPlaceLayout from "@/layout/MarketplaceLayout";
import SellerLayout from "@/layout/SellerLayout";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ProfilePage from "@/pages/ProfilePage";

import MarketPlace from "@/pages/Marketplace";
import ProductUpdate from "@/pages/ProductUpdate";
import CompatibleParts from "@/pages/CompatibleParts";
import InventoryPage from "@/pages/InventoryPage";
import ProductDetails from "@/pages/ProductDetails";
import TrendingProduct from "@/pages/TrendingProduct";
import DealsPage from "@/pages/DealsPage";
import Cart from "@/pages/Cart";
import SellerDashboard from "@/pages/SellerDashboard";
import AnalyticsPage from "@/pages/AnalyticsPage";
import OrdersPage from "@/pages/OrdersPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Marketplace Layout */}
      <Route element={<MarketPlaceLayout />}>
        <Route path="/" element={<MarketPlace />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/products/update/:id" element={<ProductUpdate />} />
        <Route path="/compatible-parts" element={<CompatibleParts />} />

        <Route path="/trending" element={<TrendingProduct />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Seller Layout */}
      <Route element={<SellerLayout />}>
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/product" element={<InventoryPage />} />
        <Route path="/seller/analytics" element={<AnalyticsPage />} />
        <Route path="/seller/orders" element={<OrdersPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
