import SellerProducts from "@/components/SellerProducts";
import ProductForm from "@/components/ProductForm";
import BundleManagement from "@/components/BundleManagement";
import SearchBar from "@/components/SearchBar";
import { useState } from "react";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("products");
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div className="mx-auto w-full min-h-screen px-4 py-4 lg:py-8 font-sans text-zinc-900">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b-4 border-zinc-900 pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">
            SELLER <span className="text-amber-600">INVENTORY MANAGEMENT</span>
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 tracking-[0.4em] uppercase mt-2">
            Global Registry & Stock Synchronization System
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="mb-6">
        <div className="flex border-b border-zinc-200">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === "products"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Product Creation
          </button>
          <button
            onClick={() => setActiveTab("bundles")}
            className={`px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === "bundles"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Bundle Management
          </button>
        </div>
      </div>

      {activeTab === "products" && (
        <>
          {/* SEARCH BAR */}
          <div className="mb-6">
            <SearchBar placeholder="Search inventory..." />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* LEFT: ACTIVE INVENTORY LIST (1/3 Width) */}
            <div className="lg:col-span-4 sticky top-24">
              <SellerProducts onSelect={(p) => setSelectedProduct(p)} />
            </div>

            {/* RIGHT: MASTER REGISTRY FORM (2/3 Width) */}
            <div className="lg:col-span-8">
              <ProductForm selectedProduct={selectedProduct} />
            </div>
          </div>
        </>
      )}

      {activeTab === "bundles" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT: ACTIVE INVENTORY LIST (1/3 Width) */}
          <div className="lg:col-span-4 sticky top-24">
            <SellerProducts />
          </div>

          {/* RIGHT: BUNDLE MANAGEMENT (2/3 Width) */}
          <div className="lg:col-span-8">
            <BundleManagement />
          </div>
        </div>
      )}
    </div>
  );
}
