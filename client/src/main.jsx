import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GarageProvider } from "@/contexts/GarageContext";
import { FilterProvider } from "@/contexts/FilterContext";
import { SearchProvider } from "@/contexts/SearchContext.jsx";
import { CartProvider } from "@/contexts/CartContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SearchProvider>
      <FilterProvider>
        <GarageProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </GarageProvider>
      </FilterProvider>
    </SearchProvider>
  </StrictMode>,
);
