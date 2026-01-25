import { useFilters } from "@/contexts/FilterContext";

export default function Sidebar() {
  const {
    filters,
    updateFilter,
    updateVehicleFilter,
    clearVehicleFilter,
    clearAllFilters,
  } = useFilters();

  const makes = [
    "Ford",
    "Honda",
    "Kawasaki",
    "Mitsubishi",
    "Nissan",
    "Royal Enfield",
    "Suzuki",
    "Toyota",
    "Yamaha",
  ];

  const models = {
    Ford: ["Everest", "Ranger"],
    Honda: ["ADV 160", "Click 125i", "Click 160", "PCX 160"],
    Kawasaki: ["Dominar 400", "Ninja 400", "Z400"],
    Mitsubishi: ["Montero Sport", "Strada", "Xpander"],
    Nissan: ["Almera", "Navara", "Terra"],
    "Royal Enfield": ["Himalayan 450"],
    Suzuki: ["Burgman Street", "Raider R150 Fi"],
    Toyota: ["Fortuner", "Hilux", "Vios"],
    Yamaha: ["Aerox 155", "NMAX", "NMAX 155"],
  };

  const CATEGORIES = [
    "Accessories",
    "Body",
    "Body Parts",
    "Brakes",
    "Electronics",
    "Engine",
    "Interior",
    "Lighting",
    "Lights",
    "Maintenance",
    "Performance",
    "Protection",
    "Rims",
    "Storage",
    "Suspension",
    "Tools",
    "Transmission",
  ];

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
          <option value="popular">Most Popular</option>
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
          onChange={(e) => updateFilter("vehicleType", e.target.value)}
          className="w-full bg-gray-50 border-gray-200 rounded-xl px-3 py-2.5 text-sm"
        >
          <option value="">All Types</option>
          <option value="Motorcycle">Motorcycle</option>
          <option value="Car">Car</option>
        </select>
      </div>

      {/* Bundle/Seasonal Filters */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-gray-400 uppercase">
          Special Offers
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.isBundle}
              onChange={(e) => updateFilter("isBundle", e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Bundles/Kits</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.isSeasonal}
              onChange={(e) => updateFilter("isSeasonal", e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Seasonal Items</span>
          </label>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Vehicle Specifics */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-gray-800">
          Vehicle Compatibility
        </h3>
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Brand / Make</label>
          <select
            value={filters.vehicle.make}
            onChange={(e) => {
              updateVehicleFilter("make", e.target.value);
              updateVehicleFilter("model", ""); // Clear model if make changes
            }}
            className="w-full bg-gray-50 border-gray-200 rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="">Select Make</option>
            {makes.map((m) => (
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
            {filters.vehicle.make &&
              models[filters.vehicle.make]?.map((m) => (
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
