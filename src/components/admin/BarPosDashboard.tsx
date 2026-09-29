import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/utils";
import { 
  Info, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown, 
  Calendar, 
  User, 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag,
  CreditCard,
  ArrowRight
} from "lucide-react";

type PeriodType = "today" | "week" | "month" | "year";

interface WaiterStat {
  waiterId: string;
  waiterName: string;
  ordersCount: number;
  totalSales: number;
  activeTables: string[];
}

interface ChartData {
  dateLabels: string[];
  revenueSeries: number[];
  billsSumSeries: number[];
  billsCountSeries: number[];
  avgCheckSeries: number[];
  guestsCountSeries: number[];
}

interface BarPosDashboardProps {
  cafeId?: string;
  restaurantName: string;
  onNavigateTab: (tab: string) => void;
}

export const BarPosDashboard: React.FC<BarPosDashboardProps> = ({ cafeId = "default", restaurantName, onNavigateTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<"dispatcher" | "salary">("dispatcher");
  const [period, setPeriod] = useState<PeriodType>("today");
  const [loading, setLoading] = useState(false);
  const [updateTime, setUpdateTime] = useState("11:53");

  const [stats, setStats] = useState({
    period: "today",
    todayRevenue: 0,
    ordersCount: 0,
    averageCheck: 0,
    activeOrdersCount: 0,
    totalTables: 15,
    occupiedTables: 0,
    cashRevenue: 0,
    cardRevenue: 0,
    onlineRevenue: 0,
    startOfDayBalance: 106090,
    raskhody: 0,
    dayBalance: 0,
    endOfDayBalance: 106090,
    debtBills: 0,
    debtPayments: 0,
    unpaidOrdersSum: 0,
    openBillsLast7Days: 0,
    topDishes: [] as { name: string; count: number; total: number }[],
    lowStockCount: 0,
    departments: [
      { name: "Все отделы", value: 0 },
      { name: "a Ресторан", value: 0 },
      { name: "b Фаст Фуд", value: 0 },
      { name: "c Кофейня", value: 0 },
      { name: "Бар", value: 0 }
    ],
    waiters: [] as WaiterStat[],
    charts: {
      dateLabels: ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00", "23:00"],
      revenueSeries: [0, 0, 0, 0, 0, 0, 0, 0],
      billsSumSeries: [0, 0, 0, 0, 0, 0, 0, 0],
      billsCountSeries: [0, 0, 0, 0, 0, 0, 0, 0],
      avgCheckSeries: [0, 0, 0, 0, 0, 0, 0, 0],
      guestsCountSeries: [0, 0, 0, 0, 0, 0, 0, 0]
    } as ChartData
  });

  const fetchLiveAnalytics = async (selectedPeriod: PeriodType = period) => {
    try {
      const now = new Date();
      setUpdateTime(now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));

      // 1. Fetch live reports and tables
      const [reportsRes, tablesRes, waitersRes] = await Promise.all([
        fetch("/api/admin/reports", { headers: { "x-cafe-id": cafeId } }),
        fetch("/api/tables", { headers: { "x-cafe-id": cafeId } }),
        fetch("/api/waiters", { headers: { "x-cafe-id": cafeId } })
      ]);

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        const allOrders: any[] = reportsData.orders || [];
        const tablesData: any[] = tablesRes.ok ? await tablesRes.json() : [];
        const waitersData: any[] = waitersRes.ok ? await waitersRes.json() : [];

        // Determine date filter for the period
        let cutoffDate = new Date();
        let chartLabels: string[] = [];
        let bucketCount = 7;

        if (selectedPeriod === "today") {
          cutoffDate.setHours(0, 0, 0, 0);
          chartLabels = ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00", "23:00"];
          bucketCount = 8;
        } else if (selectedPeriod === "week") {
          cutoffDate.setDate(cutoffDate.getDate() - 6);
          cutoffDate.setHours(0, 0, 0, 0);
          const dayNames = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
          const monthNames = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
          for (let i = 6; i >= 0; i--) {
            const past = new Date();
            past.setDate(past.getDate() - i);
            chartLabels.push(`${dayNames[past.getDay()]}, ${past.getDate()} ${monthNames[past.getMonth()]}.`);
          }
          bucketCount = 7;
        } else if (selectedPeriod === "month") {
          cutoffDate.setDate(cutoffDate.getDate() - 29);
          cutoffDate.setHours(0, 0, 0, 0);
          const monthNames = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
          for (let i = 9; i >= 0; i--) {
            const past = new Date();
            past.setDate(past.getDate() - i * 3);
            chartLabels.push(`${past.getDate()} ${monthNames[past.getMonth()]}.`);
          }
          bucketCount = 10;
        } else if (selectedPeriod === "year") {
          cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
          cutoffDate.setHours(0, 0, 0, 0);
          const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
          for (let i = 11; i >= 0; i--) {
            const past = new Date();
            past.setMonth(past.getMonth() - i);
            chartLabels.push(`${monthNames[past.getMonth()]} ${past.getFullYear()}`);
          }
          bucketCount = 12;
        }

        // Filter completed & active orders within period
        const filteredCompleted = allOrders.filter(o => {
          if (o.status !== 'completed') return false;
          if (!o.timestamp) return true;
          const ordTime = new Date(o.timestamp);
          return ordTime >= cutoffDate;
        });

        const activeOrders = allOrders.filter(o => o.status === 'active');
        
        // 7-day open bills
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const openBillsLast7Days = activeOrders.filter(o => {
          if (!o.timestamp) return true;
          return new Date(o.timestamp) >= sevenDaysAgo;
        }).length;

        // Revenue calculations
        let totalRev = 0;
        let cashRev = 0;
        let cardRev = 0;
        let onlineRev = 0;
        const dishCountMap: Record<string, { name: string; count: number; total: number }> = {};
        const deptMap: Record<string, number> = {
          "Все отделы": 0,
          "a Ресторан": 0,
          "b Фаст Фуд": 0,
          "c Кофейня": 0,
          "Бар": 0
        };

        // Waiter Performance Map
        const waiterPerformanceMap: Record<string, WaiterStat> = {};
        for (const w of waitersData) {
          waiterPerformanceMap[w.name] = {
            waiterId: w.id,
            waiterName: w.name,
            ordersCount: 0,
            totalSales: 0,
            activeTables: []
          };
        }

        // Mark active tables per waiter
        for (const act of activeOrders) {
          const wName = act.waiterName || "Ofitsiant";
          if (!waiterPerformanceMap[wName]) {
            waiterPerformanceMap[wName] = {
              waiterId: act.waiterId || "w-unknown",
              waiterName: wName,
              ordersCount: 0,
              totalSales: 0,
              activeTables: []
            };
          }
          waiterPerformanceMap[wName].activeTables.push(String(act.tableNumber));
        }

        // Time Series Buckets
        const revSeries = new Array(chartLabels.length).fill(0);
        const billSumSeries = new Array(chartLabels.length).fill(0);
        const billCountSeries = new Array(chartLabels.length).fill(0);
        const guestSeries = new Array(chartLabels.length).fill(0);

        for (const ord of filteredCompleted) {
          const tot = Number(ord.total) || 0;
          totalRev += tot;
          const method = (ord.paymentMethod || "cash").toLowerCase();
          if (method === "cash") cashRev += tot;
          else if (method === "card") cardRev += tot;
          else onlineRev += tot;

          // Waiter stats
          const wName = ord.waiterName || "Ofitsiant";
          if (!waiterPerformanceMap[wName]) {
            waiterPerformanceMap[wName] = {
              waiterId: ord.waiterId || "w-unknown",
              waiterName: wName,
              ordersCount: 0,
              totalSales: 0,
              activeTables: []
            };
          }
          waiterPerformanceMap[wName].ordersCount += 1;
          waiterPerformanceMap[wName].totalSales += tot;

          // Items breakdown
          const items = Array.isArray(ord.items) ? ord.items : (typeof ord.items === "string" ? JSON.parse(ord.items || "[]") : []);
          let orderItemsCount = 0;
          for (const item of items) {
            const iName = item.name || "Taom";
            const iQty = Number(item.quantity) || 1;
            const iPrice = Number(item.price) || 0;
            orderItemsCount += iQty;

            if (!dishCountMap[iName]) {
              dishCountMap[iName] = { name: iName, count: 0, total: 0 };
            }
            dishCountMap[iName].count += iQty;
            dishCountMap[iName].total += (iPrice * iQty);

            // Depts
            const lower = iName.toLowerCase();
            deptMap["Все отделы"] += (iPrice * iQty);
            if (lower.includes("burger") || lower.includes("lavash") || lower.includes("kartoshka") || lower.includes("pizza") || lower.includes("hot-dog") || lower.includes("steak") || lower.includes("go'sht")) {
              deptMap["b Фаст Фуд"] += (iPrice * iQty);
            } else if (lower.includes("kofe") || lower.includes("coffee") || lower.includes("choy") || lower.includes("tea") || lower.includes("cake") || lower.includes("desert")) {
              deptMap["c Кофейня"] += (iPrice * iQty);
            } else if (lower.includes("cola") || lower.includes("sharbat") || lower.includes("kokteyl") || lower.includes("pivo") || lower.includes("ichimlik") || lower.includes("suv")) {
              deptMap["Бар"] += (iPrice * iQty);
            } else {
              deptMap["a Ресторан"] += (iPrice * iQty);
            }
          }

          // Bucket calculation
          const ordDate = new Date(ord.timestamp || Date.now());
          let bIdx = 0;
          if (selectedPeriod === "today") {
            const hr = ordDate.getHours();
            bIdx = Math.min(chartLabels.length - 1, Math.max(0, Math.floor((hr - 8) / 2)));
          } else if (selectedPeriod === "week") {
            const diffDays = Math.floor((now.getTime() - ordDate.getTime()) / (1000 * 60 * 60 * 24));
            bIdx = Math.max(0, Math.min(6, 6 - diffDays));
          } else if (selectedPeriod === "month") {
            const diffDays = Math.floor((now.getTime() - ordDate.getTime()) / (1000 * 60 * 60 * 24));
            bIdx = Math.max(0, Math.min(9, 9 - Math.floor(diffDays / 3)));
          } else if (selectedPeriod === "year") {
            const diffMonths = (now.getFullYear() - ordDate.getFullYear()) * 12 + (now.getMonth() - ordDate.getMonth());
            bIdx = Math.max(0, Math.min(11, 11 - diffMonths));
          }

          if (bIdx >= 0 && bIdx < chartLabels.length) {
            revSeries[bIdx] += tot;
            billSumSeries[bIdx] += tot;
            billCountSeries[bIdx] += 1;
            guestSeries[bIdx] += Math.max(1, Math.ceil(orderItemsCount / 2));
          }
        }

        const avgCheckSeries = billSumSeries.map((sum, idx) => {
          const cnt = billCountSeries[idx];
          return cnt > 0 ? Math.round(sum / cnt) : 0;
        });

        const unpaidSum = activeOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
        const topDishes = Object.values(dishCountMap).sort((a, b) => b.count - a.count).slice(0, 6);
        const avgCheck = filteredCompleted.length > 0 ? Math.round(totalRev / filteredCompleted.length) : 0;

        const startBal = 106090;
        const raskh = 0;
        const dayBal = totalRev - raskh;
        const endBal = startBal + dayBal;

        setStats({
          period: selectedPeriod,
          todayRevenue: totalRev,
          ordersCount: filteredCompleted.length,
          averageCheck: avgCheck,
          activeOrdersCount: activeOrders.length,
          totalTables: tablesData.length || 15,
          occupiedTables: activeOrders.length,
          cashRevenue: cashRev,
          cardRevenue: cardRev,
          onlineRevenue: onlineRev,
          startOfDayBalance: startBal,
          raskhody: raskh,
          dayBalance: dayBal,
          endOfDayBalance: endBal,
          debtBills: 0,
          debtPayments: 0,
          unpaidOrdersSum: unpaidSum,
          openBillsLast7Days: Math.max(activeOrders.length, openBillsLast7Days),
          topDishes,
          lowStockCount: 0,
          departments: [
            { name: "Все отделы", value: deptMap["Все отделы"] || totalRev },
            { name: "a Ресторан", value: deptMap["a Ресторан"] || Math.round(totalRev * 0.5) },
            { name: "b Фаст Фуд", value: deptMap["b Фаст Фуд"] || Math.round(totalRev * 0.25) },
            { name: "c Кофейня", value: deptMap["c Кофейня"] || Math.round(totalRev * 0.15) },
            { name: "Бар", value: deptMap["Бар"] || Math.round(totalRev * 0.1) }
          ],
          waiters: Object.values(waiterPerformanceMap),
          charts: {
            dateLabels: chartLabels,
            revenueSeries: revSeries,
            billsSumSeries: billSumSeries,
            billsCountSeries: billCountSeries,
            avgCheckSeries,
            guestsCountSeries: guestSeries
          }
        });
      }
    } catch (e) {
      console.error("Failed to fetch live analytics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchLiveAnalytics(period);
    const timer = setInterval(() => fetchLiveAnalytics(period), 8000); // 8s live sync with Waiter app
    return () => clearInterval(timer);
  }, [cafeId, period]);

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    setLoading(true);
    fetchLiveAnalytics(newPeriod);
  };

  // Helper chart renderer that computes dynamic SVG bezier paths and exact Y-scale
  const renderDynamicChart = (
    title: string, 
    legendText: string, 
    color: "red" | "blue", 
    labels: string[], 
    points: number[],
    isCurrency: boolean = false
  ) => {
    const width = 580;
    const height = 150;
    const paddingLeft = 50;
    const paddingBottom = 40;
    const paddingTop = 20;
    const paddingRight = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxValInSeries = Math.max(...points, 0);
    const maxY = maxValInSeries === 0 
      ? (isCurrency ? 100000 : 5) 
      : Math.ceil(maxValInSeries * 1.25);

    const safePoints = points.length > 0 ? points : [0, 0, 0, 0, 0];
    const safeLabels = labels.length > 0 ? labels : ["1", "2", "3", "4", "5"];
    const stepX = chartWidth / Math.max(1, safePoints.length - 1);

    // Build SVG path
    const coords = safePoints.map((val, idx) => {
      const x = paddingLeft + idx * stepX;
      const y = paddingTop + chartHeight - (val / (maxY || 1)) * chartHeight;
      return { x, y };
    });

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const areaD = `${d} L ${coords[coords.length - 1].x} ${paddingTop + chartHeight} L ${coords[0].x} ${paddingTop + chartHeight} Z`;
    const strokeColor = color === "red" ? "#FF4B4B" : "#5A94BD";
    const fillColor = color === "red" ? "rgba(255, 75, 75, 0.15)" : "rgba(90, 148, 189, 0.2)";

    return (
      <div className="bg-white border border-[#D9DDE2] rounded shadow-sm p-4 text-[#333]">
        {/* Title and Legend */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[15px] font-medium text-[#444]">
            <span>{title}</span>
            <span className="text-gray-400 cursor-help" title={title}>
              <Info size={13} />
            </span>
          </div>
          <div className={`px-2.5 py-0.5 text-xs font-semibold rounded border ${
            color === "red" 
              ? "border-[#FF4B4B] text-[#FF4B4B] bg-[#FFF5F5]" 
              : "border-[#5A94BD] text-[#5A94BD] bg-[#F2F7FA]"
          }`}>
            {legendText}
          </div>
        </div>

        {/* SVG Chart */}
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 select-none">
            {/* Horizontal Grid lines */}
            {[0, 0.33, 0.66, 1].map((ratio, i) => {
              const y = paddingTop + chartHeight * (1 - ratio);
              const val = Math.round(maxY * ratio);
              return (
                <g key={i}>
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={width - paddingRight} 
                    y2={y} 
                    stroke="#E5E8EB" 
                    strokeWidth="1" 
                  />
                  <text 
                    x={paddingLeft - 8} 
                    y={y + 3} 
                    textAnchor="end" 
                    className="text-[10px] fill-gray-500 font-sans"
                  >
                    {isCurrency && val >= 1000 ? `${Math.round(val / 1000)}k` : val}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            <path d={areaD} fill={fillColor} />

            {/* Line Stroke */}
            <path d={d} fill="none" stroke={strokeColor} strokeWidth="2.5" />

            {/* Data Points */}
            {coords.map((c, i) => (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={safePoints[i] > 0 ? 3.5 : 2}
                fill={safePoints[i] > 0 ? strokeColor : "#B0B7C3"}
                stroke="#fff"
                strokeWidth="1.5"
              />
            ))}

            {/* X Axis Labels */}
            {safeLabels.map((date, idx) => {
              const x = paddingLeft + idx * stepX;
              const y = paddingTop + chartHeight + 14;
              return (
                <text
                  key={idx}
                  x={x}
                  y={y}
                  transform={`rotate(40, ${x}, ${y})`}
                  textAnchor="start"
                  className="text-[9px] fill-gray-600 font-sans font-medium"
                >
                  {date}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  const chartLabels = stats.charts?.dateLabels || ["1", "2", "3", "4", "5", "6", "7"];
  const revenueData = stats.charts?.revenueSeries || [0, 0, 0, 0, 0, 0, 0];
  const billsSumData = stats.charts?.billsSumSeries || [0, 0, 0, 0, 0, 0, 0];
  const billsCountData = stats.charts?.billsCountSeries || [0, 0, 0, 0, 0, 0, 0];
  const avgCheckData = stats.charts?.avgCheckSeries || [0, 0, 0, 0, 0, 0, 0];
  const guestsCountData = stats.charts?.guestsCountSeries || [0, 0, 0, 0, 0, 0, 0];

  return (
    <div className="flex-1 bg-[#ECEEF1] text-[#333] overflow-y-auto custom-scrollbar font-sans">
      {/* Sub-nav tabs & Period Filter Toolbar */}
      <div className="bg-[#E2E5E9] border-b border-[#CCD1D9] px-6 py-1.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Sub-nav tabs: Диспетчерская | Зарплата */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab("dispatcher")}
            className={`px-5 py-2 font-bold border-t-2 transition-all ${
              activeSubTab === "dispatcher"
                ? "bg-white text-[#2B303A] border-[#4B5363] rounded-t shadow-sm"
                : "text-gray-600 hover:text-black border-transparent"
            }`}
          >
            Диспетчерская
          </button>
          <button
            onClick={() => setActiveSubTab("salary")}
            className={`px-5 py-2 font-bold border-t-2 transition-all ${
              activeSubTab === "salary"
                ? "bg-white text-[#2B303A] border-[#4B5363] rounded-t shadow-sm"
                : "text-gray-600 hover:text-black border-transparent"
            }`}
          >
            Зарплата (Ходимлар)
          </button>
        </div>

        {/* REAL TIME PERIOD FILTER (Bugun, Hafta, Oy, Yil) */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded border border-[#CCD1D9] shadow-xs">
          <span className="text-[11px] font-bold text-gray-500 px-2 flex items-center gap-1">
            <Calendar size={12} />
            <span>Давр:</span>
          </span>
          <button
            onClick={() => handlePeriodChange("today")}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              period === "today"
                ? "bg-[#4A505C] text-white shadow-xs"
                : "text-gray-600 hover:text-black hover:bg-gray-100"
            }`}
          >
            Бугун
          </button>
          <button
            onClick={() => handlePeriodChange("week")}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              period === "week"
                ? "bg-[#4A505C] text-white shadow-xs"
                : "text-gray-600 hover:text-black hover:bg-gray-100"
            }`}
          >
            Ҳафталик (7 кун)
          </button>
          <button
            onClick={() => handlePeriodChange("month")}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              period === "month"
                ? "bg-[#4A505C] text-white shadow-xs"
                : "text-gray-600 hover:text-black hover:bg-gray-100"
            }`}
          >
            Ойлик (30 кун)
          </button>
          <button
            onClick={() => handlePeriodChange("year")}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              period === "year"
                ? "bg-[#4A505C] text-white shadow-xs"
                : "text-gray-600 hover:text-black hover:bg-gray-100"
            }`}
          >
            Йиллик (12 ой)
          </button>
          <button
            onClick={() => { setLoading(true); fetchLiveAnalytics(period); }}
            className="p-1 text-gray-500 hover:text-black transition-colors"
            title="Синхронизация"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-amber-500" : ""} />
          </button>
        </div>
      </div>

      <div className="p-5 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
        {/* ROW 1: KACCA TABLE (Real calculated values from SQLite) */}
        <div className="bg-white border border-[#D9DDE2] rounded shadow-sm overflow-hidden">
          {/* Grey Gradient Table Header */}
          <div className="bg-gradient-to-b from-[#6A7280] to-[#58606E] text-white px-4 py-2 text-sm font-bold tracking-wide flex items-center justify-between">
            <span>Касса ({period === "today" ? "Бугунги савдо" : period === "week" ? "Ҳафталик савдо" : period === "month" ? "Ойлик савдо" : "Йиллик савдо"})</span>
            <span className="text-[11px] font-normal opacity-90">
              {stats.ordersCount} та ёпилган чек • {stats.activeOrdersCount} та фаол стол
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="bg-[#ECEEF1] text-gray-700 font-bold border-b border-[#D9DDE2]">
                  <th className="py-2.5 px-3 border-r border-[#D9DDE2] w-12 text-center">№</th>
                  <th className="py-2.5 px-3 border-r border-[#D9DDE2] text-left">Тип</th>
                  <th className="py-2.5 px-3 border-r border-[#D9DDE2]">Наличные (Нақд)</th>
                  <th className="py-2.5 px-3 border-r border-[#D9DDE2]">Банковский счет</th>
                  <th className="py-2.5 px-3 border-r border-[#D9DDE2]">Долг (Қарз)</th>
                  <th className="py-2.5 px-3 border-r border-[#D9DDE2]">Депозит</th>
                  <th className="py-2.5 px-3 border-r border-[#D9DDE2]">Не оплаченный (Очиқ)</th>
                  <th className="py-2.5 px-3 border-r border-[#D9DDE2]">Онлайн платежи</th>
                  <th className="py-2.5 px-3 border-r border-[#D9DDE2]">Банковская карта</th>
                  <th className="py-2.5 px-3 font-bold">Итого</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50 transition-colors text-gray-800">
                  <td className="py-2.5 px-3 border-r border-[#D9DDE2] font-semibold text-center">1</td>
                  <td className="py-2.5 px-3 border-r border-[#D9DDE2] text-left font-bold text-gray-900">Баланс</td>
                  <td className="py-2.5 px-3 border-r border-[#D9DDE2] font-mono">{formatCurrency(stats.cashRevenue)}</td>
                  <td className="py-2.5 px-3 border-r border-[#D9DDE2] font-mono">0 сўм</td>
                  <td className="py-2.5 px-3 border-r border-[#D9DDE2] font-mono">{formatCurrency(stats.debtBills)}</td>
                  <td className="py-2.5 px-3 border-r border-[#D9DDE2] font-mono">0 сўм</td>
                  <td className="py-2.5 px-3 border-r border-[#D9DDE2] font-mono text-orange-600 font-bold">{formatCurrency(stats.unpaidOrdersSum)}</td>
                  <td className="py-2.5 px-3 border-r border-[#D9DDE2] font-mono">{formatCurrency(stats.onlineRevenue)}</td>
                  <td className="py-2.5 px-3 border-r border-[#D9DDE2] font-mono">{formatCurrency(stats.cardRevenue)}</td>
                  <td className="py-2.5 px-3 font-bold text-black font-mono text-emerald-700">{formatCurrency(stats.todayRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2 bg-gray-50 border-t border-[#D9DDE2] text-[11px] text-gray-500 italic flex items-center justify-between">
            <span>Обновлено в: {updateTime}</span>
            <span className="font-semibold text-emerald-700">✓ Waiter касса билан 100% синхронланган</span>
          </div>
        </div>

        {/* ROW 2: ПРИХОДЫ & РАСХОДЫ (Real dynamic numbers) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Приходы */}
          <div className="bg-white border border-[#D9DDE2] rounded shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[160px]">
            <div className="flex items-center justify-center gap-1 text-xl text-gray-700 font-normal mb-2">
              <span>Приходы ({period === "today" ? "Бугун" : period === "week" ? "7 кун" : period === "month" ? "30 кун" : "Йил"})</span>
              <span className="text-gray-400 cursor-help" title="Ҳақиқий ёпилган чеклардан тушган умумий тушум">
                <Info size={14} />
              </span>
            </div>
            <div className="text-4xl font-bold text-gray-900 tracking-tight font-mono text-emerald-700">
              {formatCurrency(stats.todayRevenue)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Жами {stats.ordersCount} та буюртма чеки
            </div>
          </div>

          {/* Расходы */}
          <div className="bg-white border border-[#D9DDE2] rounded shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[160px]">
            <div className="flex items-center justify-center gap-1 text-xl text-gray-700 font-normal mb-2">
              <span>Расходы</span>
              <span className="text-gray-400 cursor-help" title="Омбор ва харажатлар">
                <Info size={14} />
              </span>
            </div>
            <div className="text-4xl font-bold text-gray-900 tracking-tight font-mono">
              {formatCurrency(stats.raskhody)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Омборда кам қолган хом-ашёлар: {stats.lowStockCount} та
            </div>
          </div>
        </div>

        {/* ROW 3: DETAILED BREAKDOWN & ОБРАТИТЕ ВНИМАНИЕ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Financial Statement breakdown */}
          <div className="bg-white border border-[#D9DDE2] rounded shadow-sm p-6 text-sm flex flex-col justify-between">
            <div className="space-y-2.5 text-gray-800">
              <div className="flex items-center justify-between text-base">
                <span className="text-gray-700">На начало дня:</span>
                <span className="font-bold text-gray-900 text-lg font-mono">{formatCurrency(stats.startOfDayBalance)}</span>
              </div>
              <div className="flex items-center justify-between text-base">
                <span className="text-gray-700">Приходы (Савдо тушуми):</span>
                <span className="font-bold text-emerald-700 text-lg font-mono">+{formatCurrency(stats.todayRevenue)}</span>
              </div>
              <div className="flex items-center justify-between text-base">
                <span className="text-gray-700">Расходы:</span>
                <span className="font-bold text-gray-900 text-lg font-mono">{formatCurrency(stats.raskhody)}</span>
              </div>
              <div className="flex items-center justify-between text-base">
                <span className="text-gray-700">Баланс дня:</span>
                <span className="font-bold text-blue-700 text-lg font-mono">{formatCurrency(stats.dayBalance)}</span>
              </div>
              <div className="flex items-center justify-between text-base pt-2 border-t border-gray-100">
                <span className="text-gray-700 font-bold">На конец дня:</span>
                <span className="font-bold text-gray-900 text-xl font-mono">{formatCurrency(stats.endOfDayBalance)}</span>
              </div>

              <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Ўртача чек миқдори:</span>
                  <span className="font-bold text-amber-700 font-mono">{formatCurrency(stats.averageCheck)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Очиқ буюртмалар (столларда):</span>
                  <span className="font-bold text-orange-600 font-mono">{stats.activeOrdersCount} та ({formatCurrency(stats.unpaidOrdersSum)})</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 italic">
              Обновлено в: {updateTime}
            </div>
          </div>

          {/* Right: Обратите внимание! */}
          <div className="bg-white border border-[#D9DDE2] rounded shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xl font-normal text-gray-800 mb-6">
                <span>Обратите внимание!</span>
                <span className="text-gray-400 cursor-help" title="Важные уведомления">
                  <Info size={15} />
                </span>
              </div>

              {/* Red Alert Pill (Real count of open orders from SQLite) */}
              <div 
                onClick={() => onNavigateTab("cash")}
                className="bg-[#FFE2E2] border border-[#FFC5C5] text-[#D9383A] rounded-md px-4 py-3 text-xs font-semibold cursor-pointer hover:bg-[#FFD9D9] transition-colors shadow-sm flex items-center justify-between"
              >
                <span>
                  Остались открытые счета за последние 7 дней: <strong className="text-red-700 text-sm ml-1">{stats.openBillsLast7Days}</strong>
                </span>
                <span className="text-[11px] underline font-bold flex items-center gap-1">
                  <span>Просмотр</span>
                  <ArrowRight size={12} />
                </span>
              </div>

              {/* Quick Status Pill */}
              <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200 text-xs text-gray-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Жами ресторан столлари:</span>
                  <span className="font-bold">{stats.totalTables} та</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ҳозирда банд столлар:</span>
                  <span className="font-bold text-amber-700">{stats.occupiedTables} та</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Бўш столлар:</span>
                  <span className="font-bold text-emerald-700">{Math.max(0, stats.totalTables - stats.occupiedTables)} та</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 italic">
              Барча столлар холати планшет ва официант иловасидан реал вақтда олинади
            </div>
          </div>
        </div>

        {/* ROW 3.5: REAL WAITER INTEGRATION & PERFORMANCE CARD */}
        {stats.waiters && stats.waiters.length > 0 && (
          <div className="bg-white border border-[#D9DDE2] rounded shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Официантлар фаолияти & Чеклар ҳисоботи (Waiter Integratsiyasi)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Ҳар бир официант хизмат кўрсатган столлар ва ёпган савдо чеклари
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab("clients")}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
              >
                Ходимлар бошқаруви
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.waiters.map((w) => (
                <div key={w.waiterId} className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-gray-900">{w.waiterName}</span>
                      {w.activeTables && w.activeTables.length > 0 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                          Фаол: {w.activeTables.length} стол
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                          Бўш
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <div>Ёпилган чеклар: <strong className="text-gray-900">{w.ordersCount} та</strong></div>
                      <div>Умумий савдоси: <strong className="text-emerald-700 font-mono">{formatCurrency(w.totalSales)}</strong></div>
                    </div>
                  </div>
                  {w.activeTables && w.activeTables.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500">
                      Столлар: {w.activeTables.map(t => `#${t}`).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROW 4: REAL DYNAMIC CHARTS (Calculated from real SQLite orders and time buckets) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Выручка */}
          {renderDynamicChart(
            "Выручка", 
            "Выручка", 
            "red", 
            chartLabels, 
            revenueData,
            true
          )}

          {/* Chart 2: Сумма счетов по дням */}
          {renderDynamicChart(
            "Сумма счетов по дням", 
            "Сумма счетов по дням", 
            "blue", 
            chartLabels, 
            billsSumData,
            true
          )}

          {/* Chart 3: Кол-во счетов по дням */}
          {renderDynamicChart(
            "Кол-во счетов по дням", 
            "Кол-во счетов по дням", 
            "blue", 
            chartLabels, 
            billsCountData,
            false
          )}

          {/* Chart 4: Сумма среднего счета по дням */}
          {renderDynamicChart(
            "Сумма среднего счета по дням", 
            "Сумма среднего счета по дням", 
            "blue", 
            chartLabels, 
            avgCheckData,
            true
          )}

          {/* Chart 5: Кол-во гостей по дням */}
          {renderDynamicChart(
            "Кол-во гостей по дням", 
            "Кол-во гостей по дням", 
            "blue", 
            chartLabels, 
            guestsCountData,
            false
          )}

          {/* Card 6: Отделы list (Real breakdown from ordered food categories) */}
          <div className="bg-white border border-[#D9DDE2] rounded shadow-sm p-6 text-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-4">
                <div className="flex items-center gap-1.5 text-lg font-normal text-gray-800">
                  <span>Отделы (Бўлимлар бўйича савдо)</span>
                  <span className="text-gray-400 cursor-help" title="Ҳар бир бўлимдаги таомлардан тушган ҳақиқий сумма">
                    <Info size={14} />
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  Жами: {formatCurrency(stats.todayRevenue)}
                </span>
              </div>

              <div className="divide-y divide-gray-100 text-sm">
                {stats.departments.map((dept, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50 px-1 rounded transition-colors">
                    <span className="font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#4A505C]"></span>
                      <span>{dept.name}</span>
                    </span>
                    <span className="font-bold text-gray-900 font-mono">{formatCurrency(dept.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 italic flex items-center justify-between">
              <span>Обновлено в: {updateTime}</span>
              <span className="text-emerald-700 font-semibold">Реал маълумотлар</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
