import { useAuth } from "@/contexts/AuthContext";

export default function ProductCard({ product, onClick }) {
  const { user } = useAuth();

  // Check if current user is the seller of this product
  const isOwnProduct = user && product.sellerId === user.id;

  // Extract compatibility data for cleaner code
  const vc = product.vehicleCompatibility;

  // Helper to format the display string for compatibility
  const getCompatibilityText = () => {
    if (!vc) return "Universal Fit";
    if (vc.isUniversalFit) return "Universal Accessories";

    const makes = vc.makes?.join(", ") || "";
    const models = vc.models?.join(", ") || "";
    const years = vc.yearRange ? `${vc.yearRange.from}-${vc.yearRange.to}` : "";

    return `${makes} ${models} (${years})`.trim();
  };
  return (
    <div
      className="group bg-white rounded-2xl border border-gray-200 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 flex flex-col h-full cursor-pointer"
      onClick={() => onClick?.(product)}
    >
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />

        {/* Fitment Badge (The "Essential" Info) */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <span
            className={`px-2 py-1 rounded-md text-[9px] font-bold shadow-sm uppercase backdrop-blur-md ${
              vc?.type === "Motorcycle"
                ? "bg-orange-500/90 text-white"
                : "bg-blue-600/90 text-white"
            }`}
          >
            {vc?.type || "Universal"}
          </span>
          {product.isBundle && (
            <span className="px-2 py-1 rounded-md text-[9px] font-bold shadow-sm uppercase backdrop-blur-md bg-green-500/90 text-white">
              Bundle
            </span>
          )}
          {product.isSeasonal && (
            <span className="px-2 py-1 rounded-md text-[9px] font-bold shadow-sm uppercase backdrop-blur-md bg-purple-500/90 text-white">
              Seasonal
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h2 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1 group-hover:text-blue-600 transition h-10">
          {product.name}
        </h2>

        {/* Compatibility Info Section */}
        <div className="flex items-start gap-1.5 mb-3">
          <svg
            className="w-3 h-3 text-gray-400 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-[11px] text-gray-500 leading-tight line-clamp-2">
            {getCompatibilityText()}
          </p>
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {product.isBundle && product.compareAtPrice && (
                <span className="text-sm font-medium text-gray-500 line-through">
                  ₱{product.compareAtPrice?.toLocaleString()}
                </span>
              )}
              <span className="text-lg font-black text-gray-900">
                ₱{product.price?.toLocaleString()}
              </span>
              {product.isBundle && product.compareAtPrice && (
                <span className="text-[10px] font-bold text-green-600">
                  Save ₱
                  {(product.compareAtPrice - product.price)?.toLocaleString()}
                </span>
              )}
            </div>
            {product.soldCount > 0 && (
              <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                {product.soldCount} sold
              </span>
            )}
          </div>

          {/* Store Info */}
          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-50">
            <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
              <span className="text-[8px] font-bold text-blue-600 uppercase">
                {product.storeName?.charAt(0)}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 font-semibold truncate">
              {product.storeName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
