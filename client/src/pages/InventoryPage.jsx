import SellerProducts from "@/components/SellerProducts";
import ProductForm from "@/components/ProductForm";

export default function InventoryPage() {
  return (
    <div className="max-w-[1600px] mx-auto min-h-screen px-4 py-4 lg:py-8 font-sans text-zinc-900">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b-4 border-zinc-900 pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">
            INVENTORY <span className="text-amber-600">COMMAND CENTER</span>
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 tracking-[0.4em] uppercase mt-2">
            Global Registry & Stock Synchronization System
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            Registry Status
          </p>
          <p className="text-sm font-mono font-bold text-emerald-600 tracking-tighter flex items-center justify-end gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            LIVE_DATABASE_LINK
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* LEFT: ACTIVE INVENTORY LIST (1/3 Width) */}
        <div className="lg:col-span-4 sticky top-24">
          <SellerProducts />
        </div>

        {/* RIGHT: MASTER REGISTRY FORM (2/3 Width) */}
        <div className="lg:col-span-8">
          <ProductForm />
        </div>
      </div>
    </div>
  );
}
