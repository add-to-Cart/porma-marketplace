import { createContext, useContext, useState } from "react";

const FilterContext = createContext();

const INITIAL_FILTERS = {
  category: "",
  vehicleType: "",
  vehicle: {
    year: "",
    make: "",
    model: "",
    trim: "",
    engine: "",
  },
};

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateVehicleFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      vehicle: {
        ...prev.vehicle,
        [key]: value,
      },
    }));
  };

  const clearVehicleFilter = () => {
    setFilters((prev) => ({
      ...prev,
      vehicle: INITIAL_FILTERS.vehicle,
    }));
  };

  return (
    <FilterContext.Provider
      value={{
        filters,
        updateFilter,
        updateVehicleFilter,
        clearVehicleFilter,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => useContext(FilterContext);
