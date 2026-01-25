import { useFilters } from "@/contexts/FilterContext";

export default function Sidebar() {
  const {
    filters,
    updateFilter,
    updateVehicleFilter,
    clearVehicleFilter,
    clearAllFilters,
  } = useFilters();

  // Updated to match ProductForm.jsx VEHICLE_DATA
  const VEHICLE_DATA = {
    Motorcycle: {
      Yamaha: [
        "NMAX 155 Tech Max",
        "Aerox 155 SP",
        "Mio Fazzio",
        "Sniper 155",
        "YZF-R15",
        "XMAX",
        "Mio Sporty",
      ],
      Honda: [
        "Click 125i",
        "Click 160",
        "ADV 160",
        "PCX 160",
        "Airblade 160",
        "Winner X",
        "XRM 125",
        "CBR150R",
        "Honda Wave 100",
        "BeAT",
      ],
      Kawasaki: [
        "Ninja 500",
        "Ninja ZX-25R",
        "Ninja 400",
        "Z400",
        "Dominar 400",
        "Rouser NS200",
      ],
      Suzuki: ["Burgman Street", "Raider R150 Fi", "Gixxer 150"],
    },
    Car: {
      Toyota: ["Fortuner", "Hilux", "Vios", "Innova", "Raize", "Wigo"],
      Mitsubishi: ["Montero Sport", "Strada", "Xpander", "Mirage G4"],
      Ford: ["Everest", "Ranger", "Territory"],
    },
  };

  // Updated to match ProductForm.jsx CATEGORIES
  const CATEGORIES = [
    "Braking Systems",
    "Drivetrain & Transmission",
    "Engine & Performance",
    "Exhaust Systems",
    "Suspension & Steering",
    "Wheels & Tires",
    "Body & Fairings",
    "Lighting & Electrical",
    "Maintenance & Care",
    "Tools & Garage",
    "Rider Gear & Apparel",
    "Accessories & Luggage",
  ];

  // Derive available makes based on the selected vehicle type
  const selectedType = filters.vehicleType || "Motorcycle";
  const availableMakes = Object.keys(VEHICLE_DATA[selectedType] || {});
  const availableModels =
    VEHICLE_DATA[selectedType]?.[filters.vehicle.make] || [];

  return (
    <aside className="w-full md:w-64 flex-shrink-0 border rounded-2xl p-5 space-y-6 bg-white shadow-sm h-fit sticky top-24">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-gray-800">Filters</h2>
        <button
          onClick={clearAllFilters}
          className="text-xs text-blue-600 hover:underline font-semibold"
        >
          Reset All
        </button>
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase">
          Sort By
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilter("sortBy", e.target.value)}
          className="w-full bg-gray-50 border-gray-200 rounded-xl px-3 py-2.5 text-sm"
        >
          <option value="newest">Newest First</option>
          <option value="trending">Trending</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase">
          Category
        </label>
        <select
          value={filters.category}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="w-full bg-gray-50 border-gray-200 rounded-xl px-3 py-2.5 text-sm"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Vehicle Type */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase">
          Vehicle Type
        </label>
        <select
          value={filters.vehicleType}
          onChange={(e) => {
            updateFilter("vehicleType", e.target.value);
            clearVehicleFilter(); // Reset make/model when type changes
          }}
          className="w-full bg-gray-50 border-gray-200 rounded-xl px-3 py-2.5 text-sm"
        >
          <option value="">Select Type</option>
          {Object.keys(VEHICLE_DATA).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Special Offers */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-gray-400 uppercase">
          Special Offers
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.isSeasonal}
              onChange={(e) => updateFilter("isSeasonal", e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Seasonal Items</span>
          </label>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Vehicle Specifics */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-gray-800">Compatibility</h3>
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Brand / Make</label>
          <select
            disabled={!filters.vehicleType}
            value={filters.vehicle.make}
            onChange={(e) => {
              updateVehicleFilter("make", e.target.value);
              updateVehicleFilter("model", "");
            }}
            className="w-full bg-gray-50 border-gray-200 rounded-xl px-3 py-2.5 text-sm disabled:opacity-50"
          >
            <option value="">Select Make</option>
            {availableMakes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-500">Model</label>
          <select
            value={filters.vehicle.model}
            disabled={!filters.vehicle.make}
            onChange={(e) => updateVehicleFilter("model", e.target.value)}
            className="w-full bg-gray-50 border-gray-200 rounded-xl px-3 py-2.5 text-sm disabled:opacity-50"
          >
            <option value="">Select Model</option>
            {availableModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {(filters.vehicle.make || filters.vehicle.model) && (
          <button
            onClick={clearVehicleFilter}
            className="w-full text-xs text-blue-600 hover:underline font-semibold"
          >
            Clear Vehicle Filters
          </button>
        )}
      </div>
    </aside>
  );
}
