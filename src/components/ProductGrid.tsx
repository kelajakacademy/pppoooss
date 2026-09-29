import React, { useState, useEffect } from "react";
import { Search, Beef, Soup, CupSoda, Salad, UtensilsCrossed, Coffee, LayoutGrid, Zap, Fingerprint, IceCream, ArrowLeft } from "lucide-react";
import { useOrder } from "../context/OrderContext";
import { CATEGORIES } from "../constants";
import { Product } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatCurrency } from "../lib/utils";

const iconMap: Record<string, any> = {
  LayoutGrid, Beef, Soup, CupSoda, Salad, UtensilsCrossed, Coffee, Zap, Fingerprint, IceCream
};

export const ProductGrid = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { addToCart, waiter, resetCurrentTable } = useOrder();

  useEffect(() => {
    const activeCafeId = waiter?.cafeId || "default";
    fetch("/api/products", {
      headers: { "x-cafe-id": activeCafeId }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(err => console.error("Failed to fetch products:", err));
  }, [waiter?.cafeId]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#1A1D21] p-6 gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {waiter?.name}</h1>
          <p className="text-gray-400 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3 w-full max-w-lg">
          <button 
            onClick={resetCurrentTable}
            className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-[#25292E] border border-gray-700 text-gray-400 hover:text-white transition-all hover:bg-gray-800"
            title="Back to tables"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#25292E] border-none rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#E74C3C] transition-all"
            />
          </div>
        </div>
      </header>

      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = iconMap[cat.icon];
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                selectedCategory === cat.id
                  ? "bg-[#E74C3C] text-white border-[#E74C3C]"
                  : "bg-[#25292E] text-gray-400 border-gray-700 hover:text-white"
              )}
            >
              <div className="flex items-center gap-2">
                <Icon size={16} />
                {cat.name}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => addToCart(product)}
                className="bg-[#25292E] rounded-2xl p-4 flex flex-col gap-3 relative border border-gray-700 cursor-pointer group hover:border-[#E74C3C] transition-all"
              >
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-800">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                
                <div className={cn(
                  "absolute top-6 right-6 px-2 py-1 rounded text-[10px] border whitespace-nowrap",
                  product.stock <= 5 
                    ? "bg-[#1A1D21] text-[#E74C3C] border-[#E74C3C]" 
                    : "bg-[#1A1D21] text-gray-500 border-gray-700"
                )}>
                  {product.stock > 0 ? `${product.stock} items left` : 'Out of Stock'}
                </div>

                <div className={cn(product.stock === 0 && "opacity-50")}>
                  <h3 className="font-semibold text-gray-100 group-hover:text-[#E74C3C] transition-colors">{product.name}</h3>
                  <p className="text-[#E74C3C] font-bold mt-1">{formatCurrency(product.price)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
