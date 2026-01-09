// src/components/Sidebar.jsx
import { useGarage } from "@/contexts/GarageContext";
import { useFilters } from "@/contexts/FilterContext";

export default function Sidebar() {
  const { garage } = useGarage();
  const { filters, updateFilter } = useFilters();

  return (
    <aside className="w-full md:w-64 flex-shrink-0 border rounded-lg p-4 space-y-6 bg-white shadow-sm">
      <h2 className="font-semibold text-lg">My Garage</h2>

      {/* Garage Vehicles */}
      {garage.length === 0 ? (
        <p className="text-sm text-gray-500">No vehicles registered.</p>
      ) : (
        <ul className="space-y-2">
          {garage.map((v) => (
            <li key={v.id} className="border rounded p-2">
              <p className="font-medium">
                {v.make} {v.model}
              </p>
              <p className="text-xs text-gray-500">
                {v.type}
                {v.yearRange.from &&
                  ` · ${v.yearRange.from}-${v.yearRange.to || "present"}`}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* Filters */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm">Filters</h3>
        <select
          value={filters.category}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          <option value="Lights">Lights</option>
          <option value="Rims">Rims</option>
          <option value="Tires">Tires</option>
          <option value="Brake System">Brake System</option>
          <option value="Suspension">Suspension</option>
          <option value="Controls">Controls</option>
          <option value="Electronics">Electronics</option>
          <option value="Exterior Accessories">Exterior Accessories</option>
          <option value="Interior Accessories">Interior Accessories</option>
          <option value="Protective Gear">Protective Gear</option>
          <option value="Performance Parts">Performance Parts</option>
          <option value="Body & Frame">Body & Frame</option>
          <option value="Storage">Storage</option>
          <option value="Universal Accessories">Universal Accessories</option>
        </select>

        <select
          value={filters.vehicleType}
          onChange={(e) => updateFilter("vehicleType", e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="">All Vehicle Types</option>
          <option value="Motorcycle">Motorcycle</option>
          <option value="Car">Car</option>
          <option value="Universal">Universal</option>
        </select>
      </div>
      {/* Vehicle Compatibility Filter */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Vehicle Compatibility</h3>

        <button
          onClick={() =>
            updateFilter("vehicle", {
              year: 2022,
              make: "Ford",
              model: "F-150",
              trim: "Raptor / XLT / Lariat",
              engine: "3.5L V6",
            })
          }
          className="w-full border rounded px-3 py-2 text-sm text-left hover:bg-gray-50"
        >
          <p className="font-medium">2022 Ford F-150</p>
          <p className="text-xs text-gray-500">
            Raptor / XLT / Lariat · 3.5L V6
          </p>
        </button>

        {filters.vehicle?.make && (
          <button
            onClick={() => updateFilter("vehicle", {})}
            className="text-xs text-red-500 underline"
          >
            Clear vehicle filter
          </button>
        )}
      </div>
    </aside>
  );
}
