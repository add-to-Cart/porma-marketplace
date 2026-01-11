import { useEffect, useState } from "react";
import { useFilters } from "@/contexts/FilterContext";

export default function CompatiblePartsPage() {
  const { filters } = useFilters();
  const vehicle = filters.vehicle;

  const [loading, setLoading] = useState(true);

  if (!vehicle?.make) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Select a vehicle from the sidebar to see compatible parts.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Compatible Parts</h1>

      <div className="rounded-lg border p-4 space-y-1">
        <div>
          <strong>Year:</strong> {vehicle.year}
        </div>
        <div>
          <strong>Make:</strong> {vehicle.make}
        </div>
        <div>
          <strong>Model:</strong> {vehicle.model}
        </div>
        <div>
          <strong>Trim:</strong> {vehicle.trim}
        </div>
        <div>
          <strong>Engine:</strong> {vehicle.engine}
        </div>
      </div>
    </div>
  );
}
