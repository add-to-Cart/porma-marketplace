// src/contexts/GarageContext.js
import { createContext, useContext, useState } from "react";

const GarageContext = createContext();

export const GarageProvider = ({ children }) => {
  const [garage, setGarage] = useState([]);

  const addVehicle = (vehicle) => {
    setGarage((prev) => [...prev, vehicle]);
  };

  const removeVehicle = (id) => {
    setGarage((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <GarageContext.Provider value={{ garage, addVehicle, removeVehicle }}>
      {children}
    </GarageContext.Provider>
  );
};

export const useGarage = () => useContext(GarageContext);
