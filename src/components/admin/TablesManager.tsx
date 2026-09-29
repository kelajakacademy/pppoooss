import React, { useState, useEffect } from "react";
import { Table } from "../../types";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  RefreshCw, 
  Users, 
  LayoutGrid, 
  Layers, 
  UserCheck, 
  Sparkles,
  AlertCircle
} from "lucide-react";

interface TablesManagerProps {
  cafeId?: string;
}

export const TablesManager: React.FC<TablesManagerProps> = ({ cafeId = "default" }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHall, setSelectedHall] = useState<string>("all");

  // Add/Edit Table Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [tableCapacity, setTableCapacity] = useState("4");
  const [tableHall, setTableHall] = useState("Asosiy zal");
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const halls = ["Asosiy zal", "Terassa / Yozgi", "VIP Xonalar", "Bar & Lounge"];

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tables", {
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        const data = await res.json();
        setTables(data);
      }
    } catch (e) {
      console.error("Fetch tables error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [cafeId]);

  const handleOpenAddModal = () => {
    setEditingTable(null);
    setTableNumber("");
    setTableCapacity("4");
    setTableHall("Asosiy zal");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tbl: Table) => {
    setEditingTable(tbl);
    setTableNumber(tbl.number);
    setTableCapacity(String(tbl.capacity || 4));
    setTableHall((tbl as any).hall || "Asosiy zal");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setModalError("Стол рақамини киритинг");
      return;
    }

    setIsSaving(true);
    setModalError("");

    try {
      if (editingTable) {
        // Update table
        const res = await fetch(`/api/tables/${editingTable.id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "x-cafe-id": cafeId
          },
          body: JSON.stringify({
            number: tableNumber.trim(),
            capacity: Number(tableCapacity) || 4,
            hall: tableHall
          })
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchTables();
        } else {
          setModalError("Сақлашда хатолик");
        }
      } else {
        // Create table
        const res = await fetch("/api/tables", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-cafe-id": cafeId
          },
          body: JSON.stringify({
            number: tableNumber.trim(),
            capacity: Number(tableCapacity) || 4,
            hall: tableHall
          })
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchTables();
        } else {
          setModalError("Қўшишда хатолик");
        }
      }
    } catch (err) {
      setModalError("Серверга уланишда хатолик");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm("Ушбу столни ўчиришни тасдиқлайсизми?")) return;
    try {
      const res = await fetch(`/api/tables/${id}`, {
        method: "DELETE",
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        fetchTables();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTables = tables.filter((t) => {
    if (selectedHall === "all") return true;
    const hallName = (t as any).hall || "Asosiy zal";
    return hallName === selectedHall;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0E1013] p-6 lg:p-8 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Заллар ва Столлар харитаси
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Ресторан заллари ва столларини созлаш, сиғими ва официантлар бириктируви
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTables}
            className="p-2.5 rounded-xl bg-[#181A1F] hover:bg-[#20242B] text-gray-300 hover:text-white border border-gray-800 text-xs font-bold transition-all"
            title="Янгилаш"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-amber-400" : ""} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-[#F39C12] hover:bg-[#E67E22] text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Янги стол қўшиш</span>
          </button>
        </div>
      </div>

      {/* Hall Tabs */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <button
          onClick={() => setSelectedHall("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors ${
            selectedHall === "all"
              ? "bg-white text-black shadow"
              : "bg-[#141619] text-gray-400 hover:text-white border border-gray-800"
          }`}
        >
          Барча заллар ({tables.length})
        </button>
        {halls.map((hall) => {
          const count = tables.filter((t) => ((t as any).hall || "Asosiy zal") === hall).length;
          return (
            <button
              key={hall}
              onClick={() => setSelectedHall(hall)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-2 ${
                selectedHall === hall
                  ? "bg-[#F39C12] text-black shadow"
                  : "bg-[#141619] text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              <span>{hall}</span>
              <span className="text-[10px] opacity-75 px-1.5 py-0.2 bg-black/20 rounded font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-500 text-xs">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-amber-400" />
          <span>Столлар юкланмоқда...</span>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="py-20 text-center text-gray-500 bg-[#141619] border border-gray-800 rounded-3xl p-8">
          <LayoutGrid size={36} className="mx-auto mb-3 opacity-40 text-gray-400" />
          <p className="text-sm font-bold text-gray-300">Ушбу бўлимда столлар топилмади</p>
          <p className="text-xs text-gray-500 mt-1">Янги стол қўшиш тугмасини босиб биринчи столни қўшинг</p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Стол қўшиш</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredTables.map((tbl) => {
            const isOccupied = tbl.status === "occupied";
            const hall = (tbl as any).hall || "Asosiy zal";

            return (
              <div
                key={tbl.id}
                className={`bg-[#141619] border rounded-3xl p-5 shadow-lg flex flex-col justify-between transition-all hover:translate-y-[-2px] ${
                  isOccupied
                    ? "border-amber-500/40 shadow-amber-500/5"
                    : "border-gray-800/80 hover:border-gray-700"
                }`}
              >
                <div>
                  {/* Top table info */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5">
                      {hall}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isOccupied 
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    }`}>
                      {isOccupied ? "Банд" : "Бўш"}
                    </span>
                  </div>

                  {/* Big table icon & number */}
                  <div className="flex items-center gap-3 my-2">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border ${
                      isOccupied
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-white/5 text-white border-white/10"
                    }`}>
                      {tbl.number}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white leading-tight">
                        Стол {tbl.number}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                        <Users size={12} />
                        <span>{tbl.capacity || 4} кишилик</span>
                      </div>
                    </div>
                  </div>

                  {/* Active waiter badge */}
                  {tbl.activeWaiterName && (
                    <div className="mt-3 p-2 rounded-xl bg-black/40 border border-gray-800 flex items-center gap-2 text-[11px] text-gray-300">
                      <UserCheck size={12} className="text-amber-400" />
                      <span>{tbl.activeWaiterName}</span>
                    </div>
                  )}
                </div>

                {/* Actions bottom */}
                <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(tbl)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="Таҳрирлаш"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteTable(tbl.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Ўчириш"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181A1F] border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <h3 className="text-base font-black text-white">
                {editingTable ? "Столни таҳрирлаш" : "Янги стол қўшиш"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-500 hover:text-white hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Стол рақами ёки номи
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Масалан: 1, 12, VIP-1"
                  required
                  className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Сиғими (Ўринлар сони)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(e.target.value)}
                  className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Қайси залга тегишли
                </label>
                <select
                  value={tableHall}
                  onChange={(e) => setTableHall(e.target.value)}
                  className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                >
                  {halls.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-colors"
                >
                  Бекор қилиш
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#F39C12] hover:bg-[#E67E22] text-black font-black text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
                >
                  {isSaving ? "Сақланмоқда..." : "Сақлаш"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
