import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GarageProvider } from "@/contexts/GarageContext";
import { FilterProvider } from "@/contexts/FilterContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FilterProvider>
      <GarageProvider>
        <App />
      </GarageProvider>
    </FilterProvider>
  </StrictMode>
);
