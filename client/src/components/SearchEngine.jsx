import { useState, useEffect } from "react";
import { searchProducts } from "@/api/products";
import { Search, Loader2 } from "lucide-react"; // Optional icons

export default function SearchEngine() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // DEBOUNCE LOGIC: Wait for the user to stop typing
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        try {
          const data = await searchProducts(query);
          setResults(data);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 400); // 400ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="max-w-2xl mx-auto p-4 relative">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search for parts (e.g. Ninja 400 Foot Pegs)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-4 pl-12 rounded-full border-2 border-gray-200 focus:border-blue-500 outline-none transition-all shadow-sm"
        />
        <Search className="absolute left-4 top-4 text-gray-400" size={24} />
        {loading && (
          <Loader2
            className="absolute right-4 top-4 animate-spin text-blue-500"
            size={24}
          />
        )}
      </div>

      {/* Results Dropdown */}
      {results.length > 0 && (
        <div className="absolute w-full mt-2 bg-white border rounded-xl shadow-xl z-50 overflow-hidden">
          {results.map((product) => (
            <div
              key={product.id}
              className="p-4 hover:bg-gray-50 border-b last:border-none cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <img
                  src={product.imageUrl}
                  alt=""
                  className="w-12 h-12 object-cover rounded"
                />
                <div>
                  <h4 className="font-bold text-gray-800">{product.name}</h4>
                  <p className="text-xs text-gray-500">
                    Fits: {product.vehicleCompatibility.makes.join(", ")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600">₱{product.price}</p>
                {/* Optional: Show relevance score during development */}
                <span className="text-[10px] bg-gray-100 px-2 py-1 rounded">
                  Match: {product.searchScore}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
