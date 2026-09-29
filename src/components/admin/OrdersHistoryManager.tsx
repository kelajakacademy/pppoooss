import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/utils";
import { 
  Receipt, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  DollarSign, 
  Printer, 
  Eye, 
  X, 
  RefreshCw, 
  Filter, 
  User, 
  Layers,
  QrCode
} from "lucide-react";

interface OrdersHistoryManagerProps {
  cafeId?: string;
}

export const OrdersHistoryManager: React.FC<OrdersHistoryManagerProps> = ({ cafeId = "default" }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = statusFilter === "all" 
        ? "/api/admin/orders?limit=150" 
        : `/api/admin/orders?status=${statusFilter}&limit=150`;
      const res = await fetch(url, {
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [cafeId, statusFilter]);

  const filteredOrders = orders.filter((o) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const tableMatch = String(o.tableNumber || "").toLowerCase().includes(q);
      const waiterMatch = String(o.waiterName || "").toLowerCase().includes(q);
      const idMatch = String(o.id || "").toLowerCase().includes(q);
      return tableMatch || waiterMatch || idMatch;
    }
    return true;
  });

  const totalSales = filteredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0E1013] p-6 lg:p-8 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Буюртмалар ва Чеклар тарихи
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Кассадаги барча ёпилган ва фаол чеклар, таомлар таркиби ва тўлов усуллари
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl bg-[#181A1F] hover:bg-[#20242B] text-gray-300 hover:text-white border border-gray-800 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Янгилаш"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-amber-400" : ""} />
            <span className="hidden sm:inline">Янгилаш</span>
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#141619] border border-gray-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold">Кўрсатилган чеклар</span>
            <div className="text-xl font-black text-white mt-1 font-mono">{filteredOrders.length} та</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Receipt size={20} />
          </div>
        </div>

        <div className="bg-[#141619] border border-gray-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold">Жами сумма</span>
            <div className="text-xl font-black text-emerald-400 mt-1 font-mono">
              {formatCurrency(totalSales)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-[#141619] border border-gray-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold">Ўртача чек</span>
            <div className="text-xl font-black text-amber-400 mt-1 font-mono">
              {filteredOrders.length > 0 ? formatCurrency(Math.round(totalSales / filteredOrders.length)) : "0 сўм"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Calendar size={20} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Стол рақами ёки официант исми бўйича..."
            className="w-full bg-[#141619] border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === "all"
                ? "bg-[#F39C12] text-black"
                : "bg-[#141619] text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            Барчаси
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === "completed"
                ? "bg-emerald-500 text-white"
                : "bg-[#141619] text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            Ёпилган чеклар
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === "active"
                ? "bg-blue-500 text-white"
                : "bg-[#141619] text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            Фаол буюртмалар
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#141619] border border-gray-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800/80 bg-white/[0.02] text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Чек ID</th>
                <th className="py-3.5 px-4">Стол</th>
                <th className="py-3.5 px-4">Официант</th>
                <th className="py-3.5 px-4">Вақти</th>
                <th className="py-3.5 px-4">Тўлов тури</th>
                <th className="py-3.5 px-4 text-right">Умумий сумма</th>
                <th className="py-3.5 px-4 text-center">Ҳолати</th>
                <th className="py-3.5 px-4 text-right">Чекни кўриш</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <Receipt size={28} className="mx-auto mb-2 opacity-40" />
                    <span>Чеклар топилмади</span>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isCompleted = ord.status === "completed";
                  return (
                    <tr key={ord.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-400">
                        #{ord.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        Стол {ord.tableNumber}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        {ord.waiterName || "Официант"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">
                        {ord.timestamp ? new Date(ord.timestamp).toLocaleString("uz-UZ", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-300">
                          {ord.paymentMethod === "card" ? "💳 Карта" : ord.paymentMethod === "mixed" ? "🔄 Аралаш" : "💵 Нақд"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(ord.total)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 size={10} />
                            <span>Ёпилган</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            <Clock size={10} />
                            <span>Фаол</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                          title="Чек тафсилотлари"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Receipt Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181A1F] border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <div>
                <h3 className="text-base font-black text-white">Чек маълумотлари</h3>
                <p className="text-xs text-gray-400 font-mono">#{selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Receipt Content Card */}
            <div className="bg-[#121417] border border-gray-800 rounded-2xl p-4 mb-4 text-xs font-mono space-y-3">
              <div className="flex items-center justify-between text-gray-400 pb-2 border-b border-gray-800">
                <span>Стол: <strong className="text-white">#{selectedOrder.tableNumber}</strong></span>
                <span>Официант: <strong className="text-white">{selectedOrder.waiterName || "—"}</strong></span>
              </div>

              {/* Items */}
              <div className="space-y-1.5 py-1">
                {(() => {
                  try {
                    const items = JSON.parse(selectedOrder.items || "[]");
                    return items.map((it: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-gray-300">
                          {it.name} <span className="text-amber-400">x{it.quantity}</span>
                        </span>
                        <span className="text-white font-bold">
                          {formatCurrency((it.price || 0) * (it.quantity || 1))}
                        </span>
                      </div>
                    ));
                  } catch {
                    return <div className="text-gray-500">Таомлар рўйхати юкланмади</div>;
                  }
                })()}
              </div>

              <div className="pt-2 border-t border-gray-800 space-y-1">
                <div className="flex items-center justify-between text-gray-400 text-[11px]">
                  <span>Оралиқ жами:</span>
                  <span>{formatCurrency(selectedOrder.subtotal || selectedOrder.total)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-400 text-[11px]">
                  <span>Сервис / Солиқ:</span>
                  <span>{formatCurrency(selectedOrder.tax || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-emerald-400 pt-1 border-t border-gray-800/80">
                  <span>ЖАМИ:</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-gray-500 flex items-center justify-between">
                <span>Тўлов тури: {selectedOrder.paymentMethod === "card" ? "💳 Банк картаси" : "💵 Нақд пул"}</span>
                <span>{selectedOrder.timestamp ? new Date(selectedOrder.timestamp).toLocaleTimeString() : ""}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors"
              >
                Ёпиш
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
