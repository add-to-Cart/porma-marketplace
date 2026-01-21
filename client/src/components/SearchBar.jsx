import { Search } from "lucide-react";

export default function SearchBar({
  placeholder = "Search...",
  onSearch,
  className = "",
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
      />
      <input
        type="text"
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        className="bg-white border border-zinc-200 py-2 pl-10 pr-4 text-sm w-full focus:ring-2 focus:ring-amber-500 outline-none rounded-md"
      />
    </div>
  );
}
