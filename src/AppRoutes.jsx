import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/layout/MainLayout";
import MarketPlace from "@/pages/Marketplace";
import ProductUpdatePage from "@/pages/ProductUpdatePage";
import CompatiblePartsPage from "@/pages/CompatiblePartsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<MarketPlace />} />
        <Route path="/products/update/:id" element={<ProductUpdatePage />} />
        <Route path="/compatible-parts" element={<CompatiblePartsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
