import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GarageProvider } from "@/contexts/GarageContext";
import { FilterProvider } from "@/contexts/FilterContext";
import { SearchProvider } from "@/contexts/SearchContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SearchProvider>
      <FilterProvider>
        <GarageProvider>
          <App />
        </GarageProvider>
      </FilterProvider>
    </SearchProvider>
  </StrictMode>
);
