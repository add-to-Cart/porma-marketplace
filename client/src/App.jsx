import { BrowserRouter } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import AppRoutes from "./AppRoutes";

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </CartProvider>
  );
}
