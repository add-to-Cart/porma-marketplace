import { BrowserRouter } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { Toaster } from "react-hot-toast";
import AppRoutes from "./AppRoutes";

export default function App() {
  return (
    <ProductProvider>
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" />
        </BrowserRouter>
      </CartProvider>
    </ProductProvider>
  );
}
