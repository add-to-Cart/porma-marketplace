import { createContext, useContext, useState } from "react";

const FilterContext = createContext();

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within FilterProvider");
  }
  return context;
};

// Fuzzy search implementation
export const fuzzyMatch = (text, query) => {
  if (!text || !query) return 0;

  text = text.toLowerCase();
  query = query.toLowerCase();

  // Exact match scores highest (100 points)
  if (text === query) return 100;
  if (text.includes(query)) return 90;

  // Calculate character-by-character match score
  let score = 0;
  let queryIndex = 0;
  let consecutiveMatches = 0;

  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (text[i] === query[queryIndex]) {
      // Bonus for consecutive matches
      consecutiveMatches++;
      score += 10 + consecutiveMatches * 2;
      queryIndex++;
    } else {
      consecutiveMatches = 0;
    }
  }

  // Penalty if not all query characters were found
  if (queryIndex < query.length) {
    score *= queryIndex / query.length;
  }

  // Bonus for matching at word boundaries
  const words = text.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(query)) {
      score += 20;
      break;
    }
  }

  return Math.min(100, score);
};

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    categories: "",
    vehicleType: "",
    isBundle: false,
    isSeasonal: false,
    vehicle: {
      make: "",
      model: "",
    },
    priceRange: [0, 100000],
    sortBy: "newest", // newest, trending, price-asc, price-desc, relevance, rating, popular
    minRating: 0,
  });

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
      vehicle: {
        make: "",
        model: "",
      },
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      categories: "",
      vehicleType: "",
      isBundle: false,
      isSeasonal: false,
      vehicle: {
        make: "",
        model: "",
      },
      priceRange: [0, 100000],
      sortBy: "newest",
      minRating: 0,
    });
  };

  // Apply filters to products array (client-side filtering and sorting)
  const applyFilters = (products, searchQuery = "") => {
    let filtered = [...products];

    // Search query with fuzzy matching
    if (searchQuery && searchQuery.trim().length > 0) {
      filtered = filtered
        .map((product) => {
          const searchableText = [
            product.name,
            product.description,
            product.categories?.join(", "),
            product.storeName,
            ...(product.vehicleCompatibility?.makes || []),
            ...(product.vehicleCompatibility?.models || []),
            ...(product.searchTags || []),
          ].join(" ");

          const relevanceScore = fuzzyMatch(searchableText, searchQuery);

          return {
            ...product,
            _relevanceScore: relevanceScore,
          };
        })
        .filter((product) => product._relevanceScore > 30); // Threshold for relevance
    }

    // Category filter
    if (filters.categories) {
      filtered = filtered.filter((p) =>
        p.categories?.includes(filters.categories),
      );
    }

    // Vehicle type filter
    if (filters.vehicleType) {
      filtered = filtered.filter(
        (p) => p.vehicleCompatibility?.type === filters.vehicleType,
      );
    }

    // Bundle filter
    if (filters.isBundle) {
      filtered = filtered.filter((p) => p.isBundle === true);
    }

    // Seasonal filter
    if (filters.isSeasonal) {
      filtered = filtered.filter((p) => p.isSeasonal === true);
    }

    // Vehicle make filter
    if (filters.vehicle.make) {
      filtered = filtered.filter((p) =>
        p.vehicleCompatibility?.makes?.includes(filters.vehicle.make),
      );
    }

    // Vehicle model filter
    if (filters.vehicle.model) {
      filtered = filtered.filter((p) =>
        p.vehicleCompatibility?.models?.includes(filters.vehicle.model),
      );
    }

    // Price range filter
    filtered = filtered.filter((p) => {
      const price = p.price || p.basePrice || 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(
        (p) => (p.ratingAverage || 0) >= filters.minRating,
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "newest": {
          const timeA = a.createdAt?._seconds || a.createdAt?.seconds || 0;
          const timeB = b.createdAt?._seconds || b.createdAt?.seconds || 0;
          return timeB - timeA;
        }

        case "trending": {
          const scoreA = (a.soldCount || 0) * 10 + (a.viewCount || 0);
          const scoreB = (b.soldCount || 0) * 10 + (b.viewCount || 0);
          return scoreB - scoreA;
        }

        case "price-asc":
          return (a.price || a.basePrice || 0) - (b.price || b.basePrice || 0);

        case "price-desc":
          return (b.price || b.basePrice || 0) - (a.price || a.basePrice || 0);

        case "relevance":
          // Sort by relevance score if search is active
          return (b._relevanceScore || 0) - (a._relevanceScore || 0);

        case "rating":
          return (b.ratingAverage || 0) - (a.ratingAverage || 0);

        case "popular":
          return (b.soldCount || 0) - (a.soldCount || 0);

        default:
          return 0;
      }
    });

    return filtered;
  };

  const value = {
    filters,
    updateFilter,
    updateVehicleFilter,
    clearVehicleFilter,
    clearAllFilters,
    applyFilters,
  };

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
};
