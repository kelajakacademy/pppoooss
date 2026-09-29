import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/utils";
import { 
  Boxes, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Check, 
  X, 
  RefreshCw, 
  ArrowDownToLine, 
  Layers, 
  TrendingDown, 
  Truck,
  Filter
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minLimit: number;
  costPrice: number;
  supplier?: string;
  updatedAt?: string;
}

interface InventoryManagerProps {
  cafeId?: string;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ cafeId = "default" }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Add/Edit Item Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Go'sht va go'sht mahsulotlari");
  const [unit, setUnit] = useState("kg");
  const [quantity, setQuantity] = useState("0");
  const [minLimit, setMinLimit] = useState("5");
  const [costPrice, setCostPrice] = useState("0");
  const [supplier, setSupplier] = useState("");
  const [modalError, setModalError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Stock In Modal (Приход)
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [stockInItem, setStockInItem] = useState<InventoryItem | null>(null);
  const [addQuantity, setAddQuantity] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [stockInError, setStockInError] = useState("");
  const [isSavingStockIn, setIsSavingStockIn] = useState(false);

  const categories = [
    "Go'sht va go'sht mahsulotlari",
    "Don mahsulotlari",
    "Sut mahsulotlari",
    "Yog' va souslar",
    "Sabzavot va mevalar",
    "Ichimliklar & Bar",
    "Ziravorlar & Boshqa"
  ];

  const units = ["kg", "gramm", "litr", "dona", "quti", "porsiya"];

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory", {
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [cafeId]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName("");
    setCategory("Go'sht va go'sht mahsulotlari");
    setUnit("kg");
    setQuantity("10");
    setMinLimit("5");
    setCostPrice("50000");
    setSupplier("");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category || "Go'sht va go'sht mahsulotlari");
    setUnit(item.unit || "kg");
    setQuantity(String(item.quantity));
    setMinLimit(String(item.minLimit));
    setCostPrice(String(item.costPrice));
    setSupplier(item.supplier || "");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleOpenStockIn = (item: InventoryItem) => {
    setStockInItem(item);
    setAddQuantity("");
    setNewCostPrice(String(item.costPrice || ""));
    setNewSupplier(item.supplier || "");
    setStockInError("");
    setIsStockInModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError("Mahsulot nomini kiriting");
      return;
    }

    setIsSaving(true);
    setModalError("");

    try {
      if (editingItem) {
        const res = await fetch(`/api/inventory/${editingItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-cafe-id": cafeId
          },
          body: JSON.stringify({
            name: name.trim(),
            category,
            unit,
            quantity: Number(quantity) || 0,
            minLimit: Number(minLimit) || 5,
            costPrice: Number(costPrice) || 0,
            supplier: supplier.trim()
          })
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchInventory();
        } else {
          setModalError("Saqlashda xatolik");
        }
      } else {
        const res = await fetch("/api/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cafe-id": cafeId
          },
          body: JSON.stringify({
            name: name.trim(),
            category,
            unit,
            quantity: Number(quantity) || 0,
            minLimit: Number(minLimit) || 5,
            costPrice: Number(costPrice) || 0,
            supplier: supplier.trim()
          })
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchInventory();
        } else {
          setModalError("Qo'shishda xatolik");
        }
      }
    } catch (err) {
      setModalError("Serverga ulanishda xatolik");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInItem || !addQuantity || Number(addQuantity) <= 0) {
      setStockInError("To'g'ri miqdor kiriting");
      return;
    }

    setIsSavingStockIn(true);
    setStockInError("");

    try {
      const res = await fetch(`/api/inventory/${stockInItem.id}/stock-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cafe-id": cafeId
        },
        body: JSON.stringify({
          addQuantity: Number(addQuantity),
          costPrice: Number(newCostPrice) || undefined,
          supplier: newSupplier.trim() || undefined
        })
      });
      if (res.ok) {
        setIsStockInModalOpen(false);
        fetchInventory();
      } else {
        setStockInError("Kirimni saqlashda xatolik");
      }
    } catch (err) {
      setStockInError("Serverga ulanishda xatolik");
    } finally {
      setIsSavingStockIn(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Ushbu mahsulotni ombordan o'chirishni tasdiqlaysizmi?")) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        fetchInventory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredItems = items.filter((item) => {
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !(item.supplier || "").toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const lowStockCount = items.filter(i => i.quantity <= i.minLimit).length;
  const totalStockValue = items.reduce((sum, i) => sum + (i.quantity * i.costPrice), 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0E1013] p-6 lg:p-8 overflow-y-auto custom-scrollbar">
      {/* Top Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Омбор ва Қолдиқлар (Склад)
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Хом-ашё, ингредиентлар қолдиғи, кирим (приход) ва минимал чекловлар
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchInventory}
            className="p-2.5 rounded-xl bg-[#181A1F] hover:bg-[#20242B] text-gray-300 hover:text-white border border-gray-800 text-xs font-bold transition-all"
            title="Янгилаш"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-amber-400" : ""} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-[#F39C12] hover:bg-[#E67E22] text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Маҳсулот қўшиш</span>
          </button>
        </div>
      </div>

      {/* 3 Overview stat boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#141619] border border-gray-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold">Жами турдаги маҳсулотлар</span>
            <div className="text-xl font-black text-white mt-1">{items.length} та</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Boxes size={20} />
          </div>
        </div>

        <div className="bg-[#141619] border border-gray-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold">Омборнинг умумий қиймати</span>
            <div className="text-xl font-black text-emerald-400 mt-1 font-mono">
              {formatCurrency(totalStockValue)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Layers size={20} />
          </div>
        </div>

        <div className="bg-[#141619] border border-gray-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold">Кам қолган маҳсулотлар</span>
            <div className="text-xl font-black text-orange-400 mt-1">{lowStockCount} та</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Маҳсулот ёки етказиб берувчи номи..."
            className="w-full bg-[#141619] border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#141619] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Барча бўлимлар</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-[#141619] border border-gray-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800/80 bg-white/[0.02] text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Номи</th>
                <th className="py-3.5 px-4">Бўлими</th>
                <th className="py-3.5 px-4 text-center">Қолдиқ</th>
                <th className="py-3.5 px-4 text-right">Таннарх (1 бирлик)</th>
                <th className="py-3.5 px-4">Етказиб берувчи</th>
                <th className="py-3.5 px-4 text-center">Ҳолати</th>
                <th className="py-3.5 px-4 text-right">Амаллар</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <Boxes size={28} className="mx-auto mb-2 opacity-40" />
                    <span>Маҳсулотлар топилмади</span>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.quantity <= item.minLimit;
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-mono font-bold px-2.5 py-1 rounded-xl ${
                          isLow 
                            ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                            : "bg-white/5 text-white"
                        }`}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-bold">
                        {formatCurrency(item.costPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {item.supplier || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                            <AlertTriangle size={10} />
                            <span>Кам қолди</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Check size={10} />
                            <span>Етарли</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenStockIn(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[11px] border border-emerald-500/20 flex items-center gap-1 transition-colors"
                            title="Кирим қилиш"
                          >
                            <ArrowDownToLine size={13} />
                            <span>Кирим</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            title="Таҳрирлаш"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Ўчириш"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Inventory Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181A1F] border border-gray-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <h3 className="text-base font-black text-white">
                {editingItem ? "Маҳсулотни таҳрирлаш" : "Янги хом-ашё қўшиш"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Номи</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Масалан: Мол гўшти, Лазер гуруч, Пишлоқ..."
                  required
                  className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Бўлими</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Ўлчов бирлиги</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Қолдиқ миқдори</label>
                  <input
                    type="number"
                    step="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Минимал чеклов</label>
                  <input
                    type="number"
                    step="0.1"
                    value={minLimit}
                    onChange={(e) => setMinLimit(e.target.value)}
                    className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Таннархи (сўм)</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Етказиб берувчи (Фирма ёки шахс)</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Масалан: Agro Meat Тошкент, Оила танлови..."
                  className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 text-xs font-bold"
                >
                  Бекор қилиш
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#F39C12] hover:bg-[#E67E22] text-black font-black text-xs shadow-lg shadow-amber-500/20"
                >
                  {isSaving ? "Сақланмоқда..." : "Сақлаш"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock In (Приход) Modal */}
      {isStockInModalOpen && stockInItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181A1F] border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <div>
                <h3 className="text-base font-black text-white">Омборга кирим қилиш</h3>
                <p className="text-xs text-amber-400 font-bold mt-0.5">{stockInItem.name}</p>
              </div>
              <button onClick={() => setIsStockInModalOpen(false)} className="text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {stockInError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                {stockInError}
              </div>
            )}

            <form onSubmit={handleSaveStockIn} className="space-y-4">
              <div className="p-3 bg-black/40 border border-gray-800 rounded-xl flex items-center justify-between text-xs">
                <span className="text-gray-400">Ҳозирги қолдиқ:</span>
                <span className="font-bold text-white font-mono">{stockInItem.quantity} {stockInItem.unit}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Кирим қилинаётган миқдор ({stockInItem.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(e.target.value)}
                  placeholder={`Масалан: 20 ${stockInItem.unit}`}
                  required
                  autoFocus
                  className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Янги келиш нархи (1 {stockInItem.unit} учун)
                </label>
                <input
                  type="number"
                  value={newCostPrice}
                  onChange={(e) => setNewCostPrice(e.target.value)}
                  className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Етказиб берувчи фирма
                </label>
                <input
                  type="text"
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsStockInModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 text-xs font-bold"
                >
                  Бекор қилиш
                </button>
                <button
                  type="submit"
                  disabled={isSavingStockIn}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-lg shadow-emerald-500/20"
                >
                  {isSavingStockIn ? "Кирим қилинмоқда..." : "Киримни тасдиқлаш"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
