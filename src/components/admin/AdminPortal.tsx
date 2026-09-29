import React, { useState, useEffect, useRef } from "react";
import { AdminUser } from "../../types";
import { BarPosDashboard } from "./BarPosDashboard";
import { DishesModule, DishesSubTab } from "./DishesModule";
import { CrmModule } from "./CrmModule";
import { MenuManager } from "./MenuManager";
import { EmployeesManager } from "./EmployeesManager";
import { TablesManager } from "./TablesManager";
import { InventoryManager } from "./InventoryManager";
import { InvoicesModule } from "./InvoicesModule";
import { OrdersHistoryManager } from "./OrdersHistoryManager";
import { ReportsManager } from "./ReportsManager";
import { SoliqView } from "../SoliqView";
import { useOrder } from "../../context/OrderContext";
import { 
  User, 
  LogOut, 
  Monitor, 
  ExternalLink, 
  Check, 
  Copy, 
  Info, 
  Send, 
  MessageCircle, 
  Tv, 
  Upload, 
  X,
  Server,
  Globe,
  HelpCircle,
  CreditCard,
  Users
} from "lucide-react";

interface AdminPortalProps {
  admin: AdminUser;
  onLogout: () => void;
  onGoToPos: () => void;
}

type BarPosTab = 
  | "main"        // Главная
  | "dishes"      // Блюда
  | "invoices"    // Накладные
  | "clients"     // Клиенты (CRM / Лояльность / Гости)
  | "staff"       // Персонал (Официанты / Кадры)
  | "reports"     // Отчеты
  | "cash"        // Касса
  | "mobile_menu" // Мобильное меню (Столы & Меню)
  | "marketing"   // Маркетинг (Telegram бот)
  | "settings"    // Настройки
  | "billing"     // Биллинг (KVM Сервер & Домен)
  | "partners";   // Партнерам (ОФД Солиқ)

export const AdminPortal: React.FC<AdminPortalProps> = ({ admin, onLogout, onGoToPos }) => {
  const [activeTab, setActiveTab] = useState<BarPosTab>("main");
  const { receiptConfig, updateReceiptConfig } = useOrder();
  
  // Settings local state
  const [restName, setRestName] = useState(receiptConfig.restaurantName || "BarPOS Lounge & Restaurant");
  const [restAddress, setRestAddress] = useState(receiptConfig.address || "Toshkent shahri, Amir Temur ko'chasi 15");
  const [restPhone, setRestPhone] = useState(receiptConfig.phone || "+998 71 200 00 00");
  const [footerMsg, setFooterMsg] = useState(receiptConfig.footerMessage || "Tashrifingiz uchun rahmat!");
  const [logoUrl, setLogoUrl] = useState(receiptConfig.logoUrl || "");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("11:56");

  // Dishes submodule state & dropdown
  const [dishesSubTab, setDishesSubTab] = useState<DishesSubTab>("stocks");
  const [isDishesDropdownOpen, setIsDishesDropdownOpen] = useState(false);
  const dishesDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Profile Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [adminFullName, setAdminFullName] = useState(admin.fullName || "Xakimjon Xayitov");
  const [adminPhone, setAdminPhone] = useState(admin.phone || "+998339939900");
  const [newPassword, setNewPassword] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  // Telegram bot state
  const [telegramConfig, setTelegramConfig] = useState<{ configured: boolean; botUsername: string; botTitle: string }>({
    configured: false,
    botUsername: "",
    botTitle: ""
  });
  const [newBotToken, setNewBotToken] = useState("");
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [botMessage, setBotMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const now = new Date();
    setLastSyncTime(now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
  }, []);

  const fetchTelegramConfig = async () => {
    try {
      const res = await fetch("/api/telegram/config");
      const data = await res.json();
      if (data) {
        setTelegramConfig({
          configured: Boolean(data.configured),
          botUsername: data.botUsername || "",
          botTitle: data.botTitle || ""
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTelegramConfig();
  }, [activeTab]);

  useEffect(() => {
    const fetchCafeReceiptConfig = async () => {
      try {
        const activeCafeId = admin.cafeId || "default";
        const res = await fetch("/api/settings/receipt_config", {
          headers: { "x-cafe-id": activeCafeId }
        });
        const data = await res.json();
        if (data) {
          if (data.restaurantName) setRestName(data.restaurantName);
          if (data.address) setRestAddress(data.address);
          if (data.phone) setRestPhone(data.phone);
          if (data.footerMessage) setFooterMsg(data.footerMessage);
          if (data.logoUrl) setLogoUrl(data.logoUrl);
        } else if (admin.companyName) {
          setRestName(admin.companyName);
        }
      } catch (e) {
        console.error("Failed to fetch cafe receipt config", e);
      }
    };
    fetchCafeReceiptConfig();
  }, [admin.cafeId]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateReceiptConfig({
      restaurantName: restName,
      address: restAddress,
      phone: restPhone,
      footerMessage: footerMsg,
      logoUrl: logoUrl
    } as any, admin.cafeId);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: admin.username,
          fullName: adminFullName,
          phone: adminPhone,
          newPassword: newPassword || undefined
        })
      });
      if (res.ok) {
        setProfileSaved(true);
        setTimeout(() => {
          setProfileSaved(false);
          setIsProfileModalOpen(false);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTelegramBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotToken.trim()) return;
    setIsSavingToken(true);
    setBotMessage(null);

    try {
      const res = await fetch("/api/telegram/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: newBotToken.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBotMessage({ type: "success", text: `Telegram bot (@${data.botUsername}) muvaffaqiyatli ulandi!` });
        setTelegramConfig({
          configured: true,
          botUsername: data.botUsername,
          botTitle: data.botTitle || ""
        });
        setNewBotToken("");
      } else {
        setBotMessage({ type: "error", text: data.message || "Bot tokeni xato. @BotFather bergan tokenni to'g'ri kiriting." });
      }
    } catch (err: any) {
      setBotMessage({ type: "error", text: "Serverga ulanishda xatolik yuz berdi" });
    } finally {
      setIsSavingToken(false);
    }
  };

  const copyDomainToClipboard = () => {
    navigator.clipboard.writeText("app.barpos.org");
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  // The BarPOS main navigation tabs
  const tabs: { id: BarPosTab; label: string }[] = [
    { id: "main", label: "Главная" },
    { id: "dishes", label: "Блюда" },
    { id: "invoices", label: "Накладные" },
    { id: "clients", label: "Клиенты" },
    { id: "staff", label: "Персонал" },
    { id: "reports", label: "Отчеты" },
    { id: "cash", label: "Касса" },
    { id: "mobile_menu", label: "Мобильное меню" },
    { id: "marketing", label: "Маркетинг" },
    { id: "settings", label: "Настройки" },
    { id: "billing", label: "Биллинг" },
    { id: "partners", label: "Партнерам" },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-[#ECEEF1] text-[#333] overflow-hidden font-sans select-none">
      {/* 1. TOP HEADER (Dark Bar: Logo, Restaurant name, Sync status, Profile, Language, Logout) */}
      <header className="bg-[#2B303A] text-white px-6 py-2.5 flex items-center justify-between shrink-0 border-b border-black/30">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setActiveTab("main")}
            className="text-2xl font-black tracking-wider text-white cursor-pointer hover:opacity-90 flex items-center gap-1.5"
          >
            <span>BarPOS</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Cloud
            </span>
          </div>

          {/* Center Info: Restaurant Name & Sync Status */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            <span className="text-gray-400">
              Ресторан: <strong className="text-white underline cursor-pointer hover:text-amber-300">{restName}</strong>
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-[#64D878] flex items-center gap-1.5">
              <span>Последняя синхронизация: меньше 1 минуты назад в {lastSyncTime}</span>
              <span className="text-gray-400 cursor-help" title="Данные автоматически синхронизируются с POS">
                <Info size={13} />
              </span>
            </span>
          </div>
        </div>

        {/* Right Actions: Profile, Language, POS launcher, Logout */}
        <div className="flex items-center gap-4 text-xs text-gray-300">
          <button
            onClick={onGoToPos}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded bg-[#E74C3C] hover:bg-[#C0392B] text-white font-bold transition-all shadow-sm"
          >
            <Monitor size={13} />
            <span>POS Касса</span>
          </button>

          <a
            href="/kitchen"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-white font-bold transition-all"
          >
            <Tv size={13} />
            <span>Кухня ТВ</span>
          </a>

          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          >
            <User size={14} className="text-gray-400" />
            <span className="underline">Профиль</span>
          </button>

          <div className="flex items-center gap-1 text-gray-400">
            <span>Язык:</span>
            <span className="text-white font-bold underline cursor-pointer hover:text-amber-300">Русский</span>
          </div>

          <button
            onClick={onLogout}
            className="text-gray-300 hover:text-red-400 underline font-semibold transition-colors"
          >
            Выйти
          </button>
        </div>
      </header>

      {/* 2. HORIZONTAL NAVIGATION TABS (Dark grey gradient bar matching screenshot) */}
      <nav className="bg-gradient-to-b from-[#4A505C] to-[#3E434D] border-b border-[#30353D] px-4 flex items-center shrink-0">
        <div className="flex items-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            if (tab.id === "dishes") {
              return (
                <div
                  key={tab.id}
                  className="relative"
                  onMouseEnter={() => {
                    if (dishesDropdownTimeoutRef.current) clearTimeout(dishesDropdownTimeoutRef.current);
                    setIsDishesDropdownOpen(true);
                  }}
                  onMouseLeave={() => {
                    dishesDropdownTimeoutRef.current = setTimeout(() => {
                      setIsDishesDropdownOpen(false);
                    }, 200);
                  }}
                >
                  <button
                    onClick={() => {
                      setActiveTab("dishes");
                      setIsDishesDropdownOpen(!isDishesDropdownOpen);
                    }}
                    className={`px-5 py-2.5 text-xs font-bold whitespace-nowrap transition-all border-r border-[#383D47] flex items-center gap-1 cursor-pointer ${
                      isActive
                        ? "bg-[#ECEEF1] text-[#2B303A] shadow-inner font-black"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>

                  {/* EXACT DROPDOWN MENU MATCHING SCREENSHOT 1 */}
                  {isDishesDropdownOpen && (
                    <div 
                      className="absolute top-full left-0 z-50 bg-[#6A7280] text-white shadow-2xl rounded-b min-w-[190px] py-1 border border-[#58606E] animate-in fade-in slide-in-from-top-1 duration-100 font-sans"
                    >
                      {[
                        { id: "stocks" as DishesSubTab, label: "Склады" },
                        { id: "departments" as DishesSubTab, label: "Отделы" },
                        { id: "categories" as DishesSubTab, label: "Категории" },
                        { id: "ingredient_groups" as DishesSubTab, label: "Группы ингредиентов" },
                        { id: "ingredients" as DishesSubTab, label: "Ингредиенты" },
                        { id: "semi_finished" as DishesSubTab, label: "Полуфабрикаты" },
                        { id: "dishes" as DishesSubTab, label: "Блюда" },
                        { id: "linked_dishes" as DishesSubTab, label: "Связанные блюда" },
                        { id: "modifiers" as DishesSubTab, label: "Модификаторы" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab("dishes");
                            setDishesSubTab(item.id);
                            setIsDishesDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-[#58606E] transition-colors flex items-center justify-between cursor-pointer ${
                            activeTab === "dishes" && dishesSubTab === item.id 
                              ? "bg-[#58606E] font-bold text-amber-300" 
                              : "text-gray-100"
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsDishesDropdownOpen(false);
                }}
                className={`px-5 py-2.5 text-xs font-bold whitespace-nowrap transition-all border-r border-[#383D47] cursor-pointer ${
                  isActive
                    ? "bg-[#ECEEF1] text-[#2B303A] shadow-inner font-black"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. DYNAMIC CONTENT VIEWS */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* TAB 1: ГЛАВНАЯ (BarPOS Cloud Dashboard) */}
        {activeTab === "main" && (
          <BarPosDashboard 
            cafeId={admin.cafeId} 
            restaurantName={restName} 
            onNavigateTab={(tab: any) => setActiveTab(tab)} 
          />
        )}

        {/* TAB 2: БЛЮДА (Complete Dishes & Stocks Module matching screenshots) */}
        {activeTab === "dishes" && (
          <DishesModule 
            key={dishesSubTab} 
            initialSubTab={dishesSubTab} 
            cafeId={admin.cafeId} 
          />
        )}

        {/* TAB 3: НАКЛАДНЫЕ (Full Jowi Invoices & Warehouse Receipts matching screenshots) */}
        {activeTab === "invoices" && <InvoicesModule cafeId={admin.cafeId} />}

        {/* TAB 4: КЛИЕНТЫ (Full BarPOS CRM, Loyalty, Debts, Deposits, RFM) */}
        {activeTab === "clients" && <CrmModule cafeId={admin.cafeId} />}

        {/* TAB 4.1: ПЕРСОНАЛ (Employees & Staff Management) */}
        {activeTab === "staff" && <EmployeesManager cafeId={admin.cafeId} />}

        {/* TAB 5: ОТЧЕТЫ (Financial Reports) */}
        {activeTab === "reports" && <ReportsManager cafeId={admin.cafeId} />}

        {/* TAB 6: КАССА (Orders History & Live Cashier) */}
        {activeTab === "cash" && <OrdersHistoryManager cafeId={admin.cafeId} />}

        {/* TAB 7: МОБИЛЬНОЕ МЕНЮ (Tables Map & QR Menu) */}
        {activeTab === "mobile_menu" && <TablesManager cafeId={admin.cafeId} />}

        {/* TAB 8: МАРКЕТИНГ (Telegram Bot & Promos) */}
        {activeTab === "marketing" && (
          <div className="flex-1 bg-[#ECEEF1] p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white border border-[#D9DDE2] rounded shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#0088cc] flex items-center justify-center text-white shadow-md">
                      <Send size={20} className="translate-x-0.5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <span>Telegram Bot Маркетинг & Уведомления</span>
                        {telegramConfig.configured ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                            ✓ Активен
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                            Не подключен
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-gray-500">
                        Оповещения о заказах, закрытии кассы и OTP подтверждение в Telegram
                      </p>
                    </div>
                  </div>
                </div>

                {telegramConfig.configured && telegramConfig.botUsername && (
                  <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <MessageCircle size={16} className="text-[#0088cc]" />
                      <div>
                        <span className="text-xs text-gray-600">Подключенный бот: </span>
                        <span className="text-xs font-bold text-gray-900">@{telegramConfig.botUsername}</span>
                      </div>
                    </div>
                    <a
                      href={`https://t.me/${telegramConfig.botUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Открыть в Telegram</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}

                {botMessage && (
                  <div className={`p-3 rounded text-xs font-bold ${
                    botMessage.type === "success" 
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800" 
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}>
                    {botMessage.text}
                  </div>
                )}

                <form onSubmit={handleSaveTelegramBot} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {telegramConfig.configured ? "Обновить токен бота" : "Введите токен бота Telegram"}
                    </label>
                    <input
                      type="text"
                      value={newBotToken}
                      onChange={(e) => setNewBotToken(e.target.value)}
                      placeholder="Например: 7123456789:AAHk98Xzy..."
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-[#0088cc]"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Как получить токен: в Telegram напишите <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-[#0088cc] underline font-bold">@BotFather</a> команду /newbot и вставьте сюда полученный API токен.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingToken || !newBotToken.trim()}
                    className="px-5 py-2 rounded bg-[#0088cc] hover:bg-[#0077b5] disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    {isSavingToken ? "Проверка..." : "Сохранить и подключить"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: НАСТРОЙКИ (Restaurant & Receipt Settings) */}
        {activeTab === "settings" && (
          <div className="flex-1 bg-[#ECEEF1] p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white border border-[#D9DDE2] rounded shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <h2 className="text-base font-bold text-gray-900">
                    Настройки ресторана & Шаблон чека
                  </h2>
                </div>

                {savedSuccess && (
                  <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <Check size={16} />
                    <span>Настройки успешно сохранены!</span>
                  </div>
                )}

                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Название заведения
                    </label>
                    <input
                      type="text"
                      value={restName}
                      onChange={(e) => setRestName(e.target.value)}
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded px-3.5 py-2 text-xs focus:outline-none focus:border-[#4B5363]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Адрес
                      </label>
                      <input
                        type="text"
                        value={restAddress}
                        onChange={(e) => setRestAddress(e.target.value)}
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded px-3.5 py-2 text-xs focus:outline-none focus:border-[#4B5363]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Номер телефона
                      </label>
                      <input
                        type="text"
                        value={restPhone}
                        onChange={(e) => setRestPhone(e.target.value)}
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded px-3.5 py-2 text-xs focus:outline-none focus:border-[#4B5363]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Текст внизу чека (Footer Message)
                    </label>
                    <input
                      type="text"
                      value={footerMsg}
                      onChange={(e) => setFooterMsg(e.target.value)}
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded px-3.5 py-2 text-xs focus:outline-none focus:border-[#4B5363]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Логотип ресторана
                    </label>
                    {logoUrl && (
                      <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded flex items-center justify-between">
                        <img src={logoUrl} alt="Logo" className="h-10 max-w-[120px] object-contain" />
                        <button
                          type="button"
                          onClick={() => setLogoUrl("")}
                          className="text-xs text-red-600 hover:text-red-700 font-bold"
                        >
                          Удалить
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-xs font-bold text-gray-700 flex items-center gap-2">
                        <Upload size={14} />
                        <span>Загрузить фото</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setLogoUrl(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="или URL ссылка на картинку"
                        className="flex-1 bg-white border border-gray-300 text-gray-900 rounded px-3.5 py-2 text-xs focus:outline-none focus:border-[#4B5363]"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded bg-[#4A505C] hover:bg-[#3E434D] text-white font-bold text-xs shadow-sm transition-all"
                    >
                      Сохранить настройки
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: БИЛЛИНГ (KVM Server & Domain Guide) */}
        {activeTab === "billing" && (
          <div className="flex-1 bg-[#ECEEF1] p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white border border-[#D9DDE2] rounded shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                    <Server size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Биллинг & KVM Сервер (Домен app.barpos.org)
                    </h2>
                    <p className="text-xs text-gray-500">
                      Облачный сервер и синхронизация веб-портала
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500">Основной домен веб-портала:</span>
                    <div className="text-base font-bold text-blue-700 font-mono mt-0.5">
                      https://app.barpos.org
                    </div>
                  </div>
                  <button
                    onClick={copyDomainToClipboard}
                    className="px-3.5 py-2 rounded bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    {copiedDomain ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedDomain ? "Скопировано!" : "Скопировать"}</span>
                  </button>
                </div>

                <div className="text-xs text-gray-600 space-y-2 pt-2">
                  <p>✓ <strong>Статус сервера:</strong> Работает бесперебойно (24/7)</p>
                  <p>✓ <strong>Синхронизация с кассой:</strong> Режим реального времени (WebSockets & REST API)</p>
                  <p>✓ Все изменения меню, категорий, цен и сотрудников сразу отображаются на кассе.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: ПАРТНЕРАМ (Soliq OFD Fiscal Integration) */}
        {activeTab === "partners" && <SoliqView />}
      </main>

      {/* Admin Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded shadow-2xl w-full max-w-md p-6 text-[#333]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h3 className="text-base font-bold text-gray-900">Профиль администратора</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            {profileSaved && (
              <div className="mb-3 p-2 rounded bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                ✓ Профиль успешно обновлен!
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ф.И.О</label>
                <input
                  type="text"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#4B5363]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Номер телефона</label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#4B5363]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Новый пароль (если меняете)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#4B5363]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
                >
                  Закрыть
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#4A505C] hover:bg-[#3E434D] text-white font-bold text-xs"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
