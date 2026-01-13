import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/layout/MainLayout";
import MarketPlace from "@/pages/Marketplace";
import ProductUpdate from "@/pages/ProductUpdate";
import CompatibleParts from "@/pages/CompatibleParts";
import CreateProduct from "@/pages/CreateProduct";
import ProductDetails from "@/pages/ProductDetails";
import TrendingProduct from "@/pages/TrendingProduct";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<MarketPlace />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/products/update/:id" element={<ProductUpdate />} />
        <Route path="/compatible-parts" element={<CompatibleParts />} />
        <Route path="/create-product" element={<CreateProduct />} />
        <Route path="/trending" element={<TrendingProduct />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
