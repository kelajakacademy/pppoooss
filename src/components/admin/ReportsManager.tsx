import React, { useState, useEffect } from "react";
import { Order } from "../../types";
import { formatCurrency } from "../../lib/utils";
import { useOrder } from "../../context/OrderContext";
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Banknote, 
  Download, 
  Printer, 
  Calendar, 
  Users, 
  Search, 
  Clock, 
  FileSpreadsheet, 
  FileText, 
  RotateCw, 
  UtensilsCrossed,
  ShoppingBag
} from "lucide-react";

export const ReportsManager: React.FC<{ cafeId?: string }> = ({ cafeId = "default" }) => {
  const { printDailyReport, printCustomerBill } = useOrder();
  const [datePreset, setDatePreset] = useState<"today" | "yesterday" | "week" | "month" | "custom">("today");
  
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [waiterFilter, setWaiterFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Apply presets
  const applyPreset = (preset: "today" | "yesterday" | "week" | "month" | "custom") => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split("T")[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === "week") {
      const w = new Date();
      w.setDate(w.getDate() - 7);
      setStartDate(w.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "month") {
      const m = new Date();
      m.setDate(1); // 1st of current month
      setStartDate(m.toISOString().split("T")[0]);
      setEndDate(todayStr);
    }
  };

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let url = `/api/admin/reports?startDate=${startDate}&endDate=${endDate}`;
      if (waiterFilter !== "all") {
        url += `&waiter=${encodeURIComponent(waiterFilter)}`;
      }
      const res = await fetch(url, {
        headers: { "x-cafe-id": cafeId }
      });
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, waiterFilter, cafeId]);

  // CSV Export for Excel
  const handleExportCSV = () => {
    if (!reportData || !reportData.orders || reportData.orders.length === 0) {
      alert("Yuklab olish uchun hisobot ma'lumotlari mavjud emas!");
      return;
    }

    const headers = [
      "Buyurtma ID",
      "Sana",
      "Vaqt",
      "Stol",
      "Ofitsiant",
      "Holati",
      "To'lov Turi",
      "Taomlar Ro'yxati",
      "Oraliq Summa (so'm)",
      "Xizmat/Soliq (so'm)",
      "Jami Summa (so'm)"
    ];

    const rows = reportData.orders.map((o: Order) => {
      const dateObj = new Date(o.timestamp);
      const itemsFormatted = o.items.map(it => `${it.name} (${it.quantity}x)`).join("; ");
      
      return [
        `#${o.id}`,
        dateObj.toLocaleDateString(),
        dateObj.toLocaleTimeString(),
        `Stol ${o.tableNumber}`,
        `"${o.waiterName || "Noma'lum"}"`,
        o.status,
        o.paymentMethod || "Naqd",
        `"${itemsFormatted.replace(/"/g, '""')}"`,
        o.subtotal || Math.round(o.total / 1.1),
        o.tax || Math.round(o.total - o.total / 1.1),
        o.total
      ].join(",");
    });

    // Add summary row at bottom
    rows.push("");
    rows.push(`"JAMI TUSHUM:","","","","","","","","","","${reportData.totalRevenue || 0}"`);
    rows.push(`"NAQD PUL (CASH):","","","","","","","","","","${reportData.cashSales || 0}"`);
    rows.push(`"KARTA (CARD):","","","","","","","","","","${reportData.cardSales || 0}"`);
    rows.push(`"BUYURTMALAR SONI:","","","","","","","","","","${reportData.totalOrdersCount || 0}"`);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BarPOS_Otchyot_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintZReport = () => {
    if (!reportData) return;
    printDailyReport({
      date: `${startDate} - ${endDate}`,
      totalSales: reportData.totalRevenue || 0,
      totalOrdersCount: reportData.totalOrdersCount || 0,
      cashSales: reportData.cashSales || 0,
      cardSales: reportData.cardSales || 0,
      mixedSales: reportData.mixedSales || 0,
      waiters: reportData.waiterStats || [],
      topProducts: reportData.topProducts || []
    });
  };

  const orders: Order[] = reportData?.orders || [];
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.tableNumber.toLowerCase().includes(q) ||
      (o.waiterName || "").toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#121417] p-6 lg:p-8 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Отчёты и Продажи</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Bulutli Tahlil
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Dunyoning istalgan joyidan kirib ko'rish va Excel fayl shaklida yuklab olish imkoniyati
          </p>
        </div>

        {/* Action Buttons: Export to Excel and Print */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
            title="Excel (CSV) yuklab olish"
          >
            <Download size={16} />
            <span>Excel (CSV) yuklab olish</span>
          </button>

          <button
            onClick={handlePrintZReport}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-gray-800 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Printer size={15} />
            <span>Z-Hisobot chop etish</span>
          </button>

          <button
            onClick={fetchReports}
            className="p-2.5 rounded-xl bg-[#1E2227] border border-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Yangilash"
          >
            <RotateCw size={17} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Date Filter Presets and Range Selector */}
      <div className="bg-[#181A1F] p-3.5 rounded-2xl border border-gray-800 mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Preset Tabs */}
        <div className="flex bg-[#121417] p-1 rounded-xl border border-gray-800 text-xs font-bold">
          <button
            onClick={() => applyPreset("today")}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              datePreset === "today" ? "bg-white text-black shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            Bugun
          </button>
          <button
            onClick={() => applyPreset("yesterday")}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              datePreset === "yesterday" ? "bg-white text-black shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            Kecha
          </button>
          <button
            onClick={() => applyPreset("week")}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              datePreset === "week" ? "bg-white text-black shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            Oxirgi 7 kun
          </button>
          <button
            onClick={() => applyPreset("month")}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              datePreset === "month" ? "bg-white text-black shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            Bu oy
          </button>
        </div>

        {/* Custom Date Pickers */}
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-gray-500" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setDatePreset("custom");
              setStartDate(e.target.value);
            }}
            className="bg-[#121417] border border-gray-800 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
          />
          <span className="text-gray-500 text-xs">—</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setDatePreset("custom");
              setEndDate(e.target.value);
            }}
            className="bg-[#121417] border border-gray-800 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Waiter Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold hidden sm:inline">Официант:</span>
          <select
            value={waiterFilter}
            onChange={(e) => setWaiterFilter(e.target.value)}
            className="bg-[#121417] border border-gray-800 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">Barcha ofitsiantlar</option>
            {reportData?.waiterStats?.map((w: any) => (
              <option key={w.waiterName} value={w.waiterName}>
                {w.waiterName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#181A1F] p-4 rounded-2xl border border-gray-800 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Jami Tushum</p>
            <p className="text-xl lg:text-2xl font-black text-emerald-400 mt-1">
              {formatCurrency(reportData?.totalRevenue || 0)}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {reportData?.totalOrdersCount || 0} ta yakunlangan hisob
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-[#181A1F] p-4 rounded-2xl border border-gray-800 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Naqd Pul (Cash)</p>
            <p className="text-xl lg:text-2xl font-black text-white mt-1">
              {formatCurrency(reportData?.cashSales || 0)}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {reportData?.totalRevenue > 0 ? `${Math.round(((reportData?.cashSales || 0) / reportData.totalRevenue) * 100)}% ulush` : "0%"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center">
            <Banknote size={24} />
          </div>
        </div>

        <div className="bg-[#181A1F] p-4 rounded-2xl border border-gray-800 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Karta (Card)</p>
            <p className="text-xl lg:text-2xl font-black text-white mt-1">
              {formatCurrency(reportData?.cardSales || 0)}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {reportData?.totalRevenue > 0 ? `${Math.round(((reportData?.cardSales || 0) / reportData.totalRevenue) * 100)}% ulush` : "0%"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="bg-[#181A1F] p-4 rounded-2xl border border-gray-800 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">O'rtacha Chek</p>
            <p className="text-xl lg:text-2xl font-black text-amber-400 mt-1">
              {formatCurrency(reportData?.averageCheck || 0)}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">Har bir buyurtmaga to'g'ri keluvchi</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Two columns: Waiters Performance and Top Selling Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Waiters breakdown */}
        <div className="bg-[#181A1F] rounded-2xl border border-gray-800 p-5 shadow-lg flex flex-col">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Users size={16} className="text-[#F39C12]" />
            <span>Официантлар бўйича сотув кўрсаткичлари</span>
          </h3>

          <div className="flex-1 overflow-y-auto max-h-56 space-y-2 custom-scrollbar">
            {!reportData?.waiterStats || reportData.waiterStats.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">Ma'lumot yo'q</p>
            ) : (
              reportData.waiterStats.map((w: any, idx: number) => {
                const percent = reportData.totalRevenue > 0 
                  ? Math.round((w.totalRevenue / reportData.totalRevenue) * 100) 
                  : 0;
                return (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#121417] border border-gray-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-white">{w.waiterName}</p>
                        <p className="text-[10px] text-gray-500">{w.orderCount} ta buyurtma ({percent}%)</p>
                      </div>
                    </div>
                    <span className="font-black text-xs text-emerald-400">
                      {formatCurrency(w.totalRevenue)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top selling dishes */}
        <div className="bg-[#181A1F] rounded-2xl border border-gray-800 p-5 shadow-lg flex flex-col">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <UtensilsCrossed size={16} className="text-emerald-400" />
            <span>Энг кўп сотилган таомлар (Топ блюда)</span>
          </h3>

          <div className="flex-1 overflow-y-auto max-h-56 space-y-2 custom-scrollbar">
            {!reportData?.topProducts || reportData.topProducts.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">Ma'lumot yo'q</p>
            ) : (
              reportData.topProducts.slice(0, 6).map((p: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#121417] border border-gray-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">{p.name}</p>
                      <p className="text-[10px] text-gray-500">{p.quantity} dona sotilgan</p>
                    </div>
                  </div>
                  <span className="font-black text-xs text-white">
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Orders Journal / Archive */}
      <div className="bg-[#181A1F] rounded-2xl border border-gray-800 p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText size={16} className="text-blue-400" />
            <span>Журнал заказов ({filteredOrders.length} та ҳисоб)</span>
          </h3>

          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Qidiruv: stol, ofitsiant..."
              className="w-full bg-[#121417] border border-gray-800 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Orders list */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-bold">ID / Stol</th>
                <th className="pb-3 font-bold">Ofitsiant</th>
                <th className="pb-3 font-bold">Sana va Vaqt</th>
                <th className="pb-3 font-bold">Buyurtma</th>
                <th className="pb-3 font-bold">To'lov</th>
                <th className="pb-3 font-bold text-right">Summa</th>
                <th className="pb-3 font-bold text-right">Harakat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-gray-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Buyurtmalar topilmadi
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-bold text-white">
                      <span>#{o.tableNumber}</span>
                      <span className="text-[10px] text-gray-500 ml-1.5 font-mono">({o.id.slice(-5)})</span>
                    </td>
                    <td className="py-3 text-gray-300">
                      {o.waiterName || "Noma'lum"}
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(o.timestamp).toLocaleDateString()} {new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 max-w-xs truncate text-gray-400" title={o.items.map(i => `${i.name} (${i.quantity})`).join(", ")}>
                      {o.items.map(i => `${i.name} (${i.quantity})`).join(", ")}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        o.paymentMethod === 'cash' ? "bg-green-500/10 text-green-400" :
                        o.paymentMethod === 'card' ? "bg-blue-500/10 text-blue-400" :
                        "bg-purple-500/10 text-purple-400"
                      }`}>
                        {o.paymentMethod || "Naqd"}
                      </span>
                    </td>
                    <td className="py-3 font-black text-emerald-400 text-right">
                      {formatCurrency(o.total)}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => printCustomerBill(o)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                        title="Chekni chop etish"
                      >
                        <Printer size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
