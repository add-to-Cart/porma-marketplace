import { useEffect, useState } from "react";
import { getProductsBySeller } from "@/api/products";
import { Package, ArrowUpRight, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function SellerProducts({ onSelect }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyProducts = async () => {
      if (!user?.uid) return;

      try {
        const data = await getProductsBySeller(user.uid);
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyProducts();
  }, [user?.uid]);

  return (
    <div className="border-2 border-zinc-900 bg-zinc-50 min-h-[600px] overflow-hidden">
      <div className="bg-zinc-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-amber-500" />
          <h2 className="text-[10px] font-black uppercase tracking-widest">
            Your Products
          </h2>
        </div>
        <span className="bg-amber-500 text-zinc-900 px-2 py-0.5 text-[10px] font-black rounded-full">
          {products.length}
        </span>
      </div>

      <div className="divide-y divide-zinc-200 max-h-[75vh] overflow-y-auto">
        {loading ? (
          <div className="p-10 text-center animate-pulse text-[10px] font-black uppercase text-zinc-400">
            Querying DB...
          </div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center text-[10px] font-black uppercase text-zinc-400">
            Inventory Empty
          </div>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="p-4 bg-white hover:bg-zinc-100 transition-colors group cursor-pointer relative"
              onClick={() => onSelect && onSelect(p)}
            >
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-zinc-100 border border-zinc-200 shrink-0">
                  <img
                    src={p.imageUrl}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[11px] font-black uppercase truncate text-zinc-900">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-mono font-bold text-amber-600">
                      ₱{p.price.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-black uppercase text-zinc-400">
                      QTY: {p.stock}
                    </span>
                  </div>
                </div>
                <button className="text-zinc-300 hover:text-zinc-900">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
