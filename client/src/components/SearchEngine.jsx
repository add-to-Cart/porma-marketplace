import { useSearch } from "@/contexts/SearchContext";
import { searchProducts } from "@/api/products";
import { useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";

export default function SearchEngine() {
  const {
    searchQuery,
    setSearchQuery,
    setSearchResults,
    isSearching,
    setIsSearching,
  } = useSearch();
  const { filters } = useFilters();

  useEffect(() => {
    // If query is too short, clear results immediately and don't fetch
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchProducts({
          query: searchQuery,
          categories: filters.categories,
          vehicleType: filters.vehicleType,
          make: filters.vehicle.make,
          model: filters.vehicle.model,
        });
        setSearchResults(data);
      } catch (error) {
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, filters, setSearchResults, setIsSearching]);

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative group">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
          size={18}
        />
        <input
          type="text"
          placeholder="Search for parts (e.g. Ninja 400)..."
          value={searchQuery} // Controlled by Context
          onChange={(e) => setSearchQuery(e.target.value)} // Updates Context
          className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-10 pr-12 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
        />
        {isSearching && (
          <Loader2
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500"
            size={18}
          />
        )}
      </div>
    </div>
  );
}
