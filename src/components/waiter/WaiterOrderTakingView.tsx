import React, { useState } from "react";
import { useOrder } from "../../context/OrderContext";

interface DishItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isDark?: boolean;
}

const WAITER_DISHES: DishItem[] = [
  // ПОПУЛЯРНЫЕ
  { id: "d1", name: "Круассан", price: 400, category: "ПОПУЛЯРНЫЕ" },
  { id: "d2", name: "Красный бархат", price: 1200, category: "ПОПУЛЯРНЫЕ" },
  { id: "d3", name: "Американо", price: 500, category: "ПОПУЛЯРНЫЕ" },
  { id: "d4", name: "Cake", price: 1550, category: "ПОПУЛЯРНЫЕ" },
  { id: "d5", name: "Хот дог", price: 700, category: "ПОПУЛЯРНЫЕ" },
  { id: "d6", name: "Латте", price: 900, category: "ПОПУЛЯРНЫЕ" },
  { id: "d7", name: "Сырне", price: 350, category: "ПОПУЛЯРНЫЕ" },
  { id: "d8", name: "Jack Daniel's 50ml", price: 1800, category: "ПОПУЛЯРНЫЕ" },
  { id: "d9", name: "Coca-Cola 0.25", price: 600, category: "ПОПУЛЯРНЫЕ" },
  { id: "d10", name: "Круассан с шоколадом", price: 600, category: "ПОПУЛЯРНЫЕ" },
  { id: "d11", name: "Чай Марокканский", price: 1800, category: "ПОПУЛЯРНЫЕ" },
  { id: "d12", name: "Медовый торт", price: 900, category: "ПОПУЛЯРНЫЕ" },
  { id: "d13", name: "Коктейль Б52", price: 1800, category: "ПОПУЛЯРНЫЕ" },
  { id: "d14", name: "Бургер Сохо", price: 1300, category: "ПОПУЛЯРНЫЕ" },
  { id: "d15", name: "Тибон стейк", price: 5000, category: "ПОПУЛЯРНЫЕ", isDark: true },
  { id: "d16", name: "McClelland's 50ml", price: 2300, category: "ПОПУЛЯРНЫЕ" },
  { id: "d17", name: "Коктейль Ананасный Джо", price: 2000, category: "ПОПУЛЯРНЫЕ" },
  { id: "d18", name: "Nemiroff Lex 50ml", price: 1600, category: "ПОПУЛЯРНЫЕ" },
  { id: "d19", name: "Heineken 0.33", price: 1500, category: "ПОПУЛЯРНЫЕ" },
  { id: "d20", name: "Мороженое ванильное", price: 350, category: "ПОПУЛЯРНЫЕ" },
  { id: "d21", name: "Аля Саша", price: 1800, category: "ПОПУЛЯРНЫЕ" },
  { id: "d22", name: "Chang 0.32", price: 1500, category: "ПОПУЛЯРНЫЕ" },
  { id: "d23", name: "Гамбургер с Black Angus", price: 1800, category: "ПОПУЛЯРНЫЕ" },
  { id: "d24", name: "Castello di Ama Chianti Classico 750ml", price: 20000, category: "ПОПУЛЯРНЫЕ" },
  { id: "d25", name: "Red Bull 0.25", price: 1500, category: "ПОПУЛЯРНЫЕ" },
  { id: "d26", name: "Pago 0.2", price: 700, category: "ПОПУЛЯРНЫЕ" },
  { id: "d27", name: "Пюре карт", price: 300, category: "ПОПУЛЯРНЫЕ" },
  { id: "d28", name: "Turan 0.2", price: 500, category: "ПОПУЛЯРНЫЕ" },
  { id: "d29", name: "123", price: 900, category: "ПОПУЛЯРНЫЕ" },
  { id: "d30", name: "Куриная грудка гриль", price: 3500, category: "ПОПУЛЯРНЫЕ", isDark: true },
  { id: "d31", name: "Estrella Damm Draft", price: 1600, category: "ПОПУЛЯРНЫЕ" },
  { id: "d32", name: "Fanta 0.25", price: 600, category: "ПОПУЛЯРНЫЕ" },
  { id: "d33", name: "Спагетти Болоньезе", price: 2500, category: "ПОПУЛЯРНЫЕ", isDark: true },
  { id: "d34", name: "Estrella damm 0.33", price: 1500, category: "ПОПУЛЯРНЫЕ" },
  { id: "d35", name: "Pago 0.7", price: 1200, category: "ПОПУЛЯРНЫЕ" },
  { id: "d36", name: "Мороженое шоколадное", price: 500, category: "ПОПУЛЯРНЫЕ" },
  { id: "d37", name: "Суп Чучвара", price: 1500, category: "ПОПУЛЯРНЫЕ", isDark: true },
  { id: "d38", name: "Булочка классическая", price: 0, category: "ПОПУЛЯРНЫЕ" },
  { id: "d39", name: "Булочка угольная", price: 0, category: "ПОПУЛЯРНЫЕ" },
  { id: "d40", name: "Borjomi 0.33", price: 900, category: "ПОПУЛЯРНЫЕ" },
  { id: "d41", name: "Гамбургер с кониной", price: 1800, category: "ПОПУЛЯРНЫЕ" },
  { id: "d42", name: "Heineken Draft", price: 1600, category: "ПОПУЛЯРНЫЕ" },
  { id: "d43", name: "Гамбургер с местной телятиной", price: 1500, category: "ПОПУЛЯРНЫЕ" },
  { id: "d44", name: "Соус BBQ домашний", price: 0, category: "ПОПУЛЯРНЫЕ" },
  { id: "d45", name: "Бургер база", price: 0, category: "ПОПУЛЯРНЫЕ" },
  { id: "d46", name: "Булочка картофельная", price: 0, category: "ПОПУЛЯРНЫЕ" },
  { id: "d47", name: "Булочка вишневая", price: 0, category: "ПОПУЛЯРНЫЕ" },
  { id: "d48", name: "Окрошка", price: 1500, category: "ПОПУЛЯРНЫЕ", isDark: true },
  { id: "d49", name: "Рис кефирный", price: 300, category: "ПОПУЛЯРНЫЕ" },
  { id: "d50", name: "Мороженое клубничное", price: 500, category: "ПОПУЛЯРНЫЕ" },

  // СЛАДКОЕ
  { id: "s1", name: "Красный бархат", price: 1200, category: "СЛАДКОЕ" },
  { id: "s2", name: "Медовый торт", price: 900, category: "СЛАДКОЕ" },
  { id: "s3", name: "Сертификат 5000", price: 5000, category: "СЛАДКОЕ" },

  // a Ресторан
  { id: "r1", name: "Тибон стейк", price: 5000, category: "a Ресторан", isDark: true },
  { id: "r2", name: "Куриная грудка гриль", price: 3500, category: "a Ресторан", isDark: true },
  { id: "r3", name: "Спагетти Болоньезе", price: 2500, category: "a Ресторан", isDark: true },
  { id: "r4", name: "Суп Чучвара", price: 1500, category: "a Ресторан", isDark: true },

  // b Фаст Фуд
  { id: "f1", name: "Хот дог", price: 700, category: "b Фаст Фуд" },
  { id: "f2", name: "Бургер Сохо", price: 1300, category: "b Фаст Фуд" },
  { id: "f3", name: "Гамбургер с Black Angus", price: 1800, category: "b Фаст Фуд" },

  // c Кофейня
  { id: "k1", name: "Американо", price: 500, category: "c Кофейня" },
  { id: "k2", name: "Латте", price: 900, category: "c Кофейня" },
  { id: "k3", name: "Чай Марокканский", price: 1800, category: "c Кофейня" },

  // Бар
  { id: "b1", name: "Coca-Cola 0.25", price: 600, category: "Бар" },
  { id: "b2", name: "Jack Daniel's 50ml", price: 1800, category: "Бар" },
  { id: "b3", name: "Red Bull 0.25", price: 1500, category: "Бар" }
];

interface WaiterOrderTakingViewProps {
  tableNumber: string | number;
  hallName: string;
  guestsCount: number;
  initialItems?: Array<{ id: string; name: string; price: number; quantity: number; subNote?: string }>;
  onSaveOrder: (savedData: {
    tableNumber: string | number;
    guestsCount: number;
    items: Array<{ id: string; name: string; price: number; quantity: number; subNote?: string }>;
    total: number;
  }) => void;
  onCancel: () => void;
}

export const WaiterOrderTakingView: React.FC<WaiterOrderTakingViewProps> = ({
  tableNumber,
  hallName,
  guestsCount,
  initialItems,
  onSaveOrder,
  onCancel
}) => {
  const { waiter, printPrecheckBill } = useOrder();

  const [activeCategory, setActiveCategory] = useState<string>("ПОПУЛЯРНЫЕ");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Cart State for current order
  const [cartItems, setCartItems] = useState<Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    subNote?: string;
  }>>(initialItems && initialItems.length > 0 ? initialItems : [
    { id: "d12", name: "Медовый торт", price: 900, quantity: 2, subNote: "На вынос" }
  ]);

  const categories = ["a Ресторан", "b Фаст Фуд", "c Кофейня", "Бар", "ПОПУЛЯРНЫЕ", "СЛАДКОЕ"];

  // Filtered dishes
  const filteredDishes = WAITER_DISHES.filter((dish) => {
    if (searchQuery.trim()) {
      return dish.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return dish.category === activeCategory;
  });

  const handleAddDish = (dish: DishItem) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === dish.id);
      if (existing) {
        return prev.map(item =>
          item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: dish.id, name: dish.name, price: dish.price, quantity: 1 }];
    });
  };

  const handleSaveOrder = () => {
    if (cartItems.length === 0) {
      alert("Таомлар танланмаган!");
      return;
    }

    const isBar = (name: string) => {
      const n = name.toLowerCase();
      return n.includes("американо") || n.includes("латте") || n.includes("чай") || n.includes("кола") || n.includes("cola") || n.includes("pepsi") || n.includes("fanta") || n.includes("sprite") || n.includes("red bull") || n.includes("pago") || n.includes("turan") || n.includes("коктейль") || n.includes("jack") || n.includes("nemiroff") || n.includes("mcclelland") || n.includes("heineken") || n.includes("chang") || n.includes("schweppes") || n.includes("borjomi") || n.includes("водка") || n.includes("пиво");
    };

    const barList = cartItems.filter(i => isBar(i.name));
    const kitchenList = cartItems.filter(i => !isBar(i.name));

    let msg = "";
    if (barList.length > 0 && kitchenList.length > 0) {
      msg = `✅ Буюртма сақланди!\n\n🍹 Бар учун (${barList.length} та ичимлик) -> БАР МОНИТОРИГА ва ЧЕКИГА юборилди!\n\n🍳 Ошхона учун (${kitchenList.length} та таом) -> ОШХОНА МОНИТОРИГА ва ЧЕКИГА юборилди!`;
    } else if (barList.length > 0) {
      msg = `✅ Буюртма сақланди!\n\n🍹 Бар учун (${barList.length} та ичимлик) -> БАР МОНИТОРИГА ва ЧЕКИГА юборилди!`;
    } else {
      msg = `✅ Буюртма сақланди!\n\n🍳 Ошхона учун (${kitchenList.length} та таом) -> ОШХОНА МОНИТОРИГА ва ЧЕКИГА юборилди!`;
    }

    alert(msg);
    onSaveOrder({
      tableNumber,
      guestsCount,
      items: cartItems,
      total
    });
  };

  const handlePrintPrecheck = () => {
    alert("📄 Тўловдан олдинги ПРЕЧЕК чоп этилмоқда...");
    printPrecheckBill();
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const serviceCharge = Math.round(subtotal * 0.1);
  const total = subtotal + serviceCharge;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#d0d4da] text-black select-none font-sans overflow-hidden">
      {/* ========================================================================= */}
      {/* TOP BAR: SEARCH AND CATEGORY NAVIGATION TABS                             */}
      {/* ========================================================================= */}
      <div className="h-12 px-2 bg-gradient-to-b from-[#bec3cb] via-[#d0d4da] to-[#bec3cb] border-b border-[#9ba1aa] flex items-center justify-between gap-2 shrink-0">
        {/* Left: Search input */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-400 rounded-lg px-2.5 py-1 w-52 shadow-inner">
          <span className="text-gray-500 font-bold text-xs">🔍</span>
          <input
            type="text"
            placeholder="Поиск"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold bg-transparent outline-none text-gray-800"
          />
        </div>

        {/* Scroll Category Left Button */}
        <button
          onClick={() => {
            const idx = categories.indexOf(activeCategory);
            if (idx > 0) setActiveCategory(categories[idx - 1]);
          }}
          className="w-8 h-8 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] to-[#b8bec7] font-black text-xs flex items-center justify-center cursor-pointer shadow-sm hover:from-white"
        >
          ❮
        </button>

        {/* Category Tabs */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setSearchQuery("");
                }}
                className={`px-4 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-b from-[#f2f4f6] via-[#e2e5e9] to-[#ccd1d8] border-[#8f96a0] text-black shadow-inner ring-1 ring-gray-400"
                    : "bg-gradient-to-b from-[#e3e6eb] to-[#c2c6cd] border-gray-400 text-gray-700 hover:bg-white"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Scroll Category Right Button */}
        <button
          onClick={() => {
            const idx = categories.indexOf(activeCategory);
            if (idx < categories.length - 1) setActiveCategory(categories[idx + 1]);
          }}
          className="w-8 h-8 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] to-[#b8bec7] font-black text-xs flex items-center justify-center cursor-pointer shadow-sm hover:from-white"
        >
          ❯
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MAIN WORK AREA: LEFT SIDEBAR CART + RIGHT DISHES GRID                      */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden p-2 gap-2">
        {/* LEFT COLUMN: ORDER INFO CARD & BILL ITEMS LIST */}
        <div className="w-[280px] sm:w-[320px] flex flex-col bg-[#c2c6cd] border border-[#9ea4ad] rounded-xl overflow-hidden shadow-inner shrink-0">
          {/* Top Info Box */}
          <div className="bg-[#f0f2f5] border-b border-gray-400 p-2 text-[11px] space-y-0.5 shadow-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">Официант:</span>
              <span className="font-bold text-gray-900">{waiter?.name || "Ибрагим"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">Стол:</span>
              <span className="font-bold text-gray-900">Вынос, {hallName} #{tableNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">Клиент:</span>
              <span className="text-gray-800 font-semibold">—</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">Гостей:</span>
              <span className="font-bold text-gray-900">{guestsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">Описание:</span>
              <span className="text-gray-800 font-semibold">—</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">Smart карта:</span>
              <span className="text-gray-800 font-semibold">—</span>
            </div>

            <div className="pt-1.5 mt-1 border-t border-gray-300 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-gray-600 font-bold">Подитог:</span>
                <span className="font-bold text-gray-900">{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-bold">Обслуж 10%:</span>
                <span className="text-gray-900 font-bold">{serviceCharge.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-bold">Скидка 0%:</span>
                <span className="text-gray-800">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-bold">Накоп. 0%:</span>
                <span className="text-gray-800">0</span>
              </div>
            </div>

            {/* Big Total */}
            <div className="pt-1.5 mt-1 border-t border-gray-400 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-gray-700">Итого:</span>
              <span className="text-xl font-black text-[#0d2e59]">{total.toLocaleString()} so'm</span>
            </div>
          </div>

          {/* Cart Header: Новый счет */}
          <div className="bg-gradient-to-r from-[#e86f68] to-[#d9534f] text-white px-3 py-1 text-xs font-bold flex items-center justify-between">
            <span>Новый счет</span>
            <div className="flex items-center gap-1">
              <button className="w-5 h-5 rounded bg-white/20 hover:bg-white/40 text-white font-bold flex items-center justify-center text-[10px]">▲</button>
              <button className="w-5 h-5 rounded bg-white/20 hover:bg-white/40 text-white font-bold flex items-center justify-center text-[10px]">▼</button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 bg-[#e8ebf0] p-2 overflow-y-auto divide-y divide-gray-300">
            {cartItems.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                Таомлар танланмаган
              </div>
            ) : (
              cartItems.map((item, idx) => (
                <div key={idx} className="py-1.5 text-xs flex flex-col space-y-0.5">
                  <div className="flex items-center justify-between font-bold text-gray-900">
                    <span className="truncate max-w-[170px]">{idx + 1} {item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">{item.quantity}</span>
                      <span>{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                  {item.subNote && (
                    <div className="text-[10px] text-red-600 font-semibold pl-3">
                      • {item.subNote}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Left Footer Buttons: Закрыть & Сохранить */}
          <div className="p-2 bg-[#c2c6cd] border-t border-gray-400 grid grid-cols-2 gap-2 shrink-0">
            <button
              onClick={onCancel}
              className="py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-sm cursor-pointer"
            >
              Закрыть
            </button>
            <button
              onClick={handleSaveOrder}
              className="py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-sm cursor-pointer"
            >
              Сохранить
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: DISHES GRID (MATCHING IMAGE 2 & 3 EXACTLY) */}
        <div className="flex-1 flex flex-col bg-[#e3e6eb] border border-[#9ea4ad] rounded-xl overflow-hidden shadow-inner">
          {/* Top Bar above grid */}
          <div className="h-8 px-3 bg-gradient-to-b from-[#d5d8de] to-[#bec3cb] border-b border-[#a8afb8] flex items-center justify-between text-xs font-bold text-gray-800 shrink-0">
            <span className="uppercase tracking-wider">{activeCategory}</span>
            <button className="px-3 py-1 rounded bg-[#d0d4da] border border-gray-400 text-[11px] font-bold text-gray-700 hover:bg-white cursor-pointer shadow-xs">
              Стоп-лист
            </button>
          </div>

          {/* Dishes Grid */}
          <div className="flex-1 p-2.5 overflow-y-auto bg-[#e8ebf0]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
              {filteredDishes.map((dish) => (
                <button
                  key={dish.id}
                  onClick={() => handleAddDish(dish)}
                  className={`h-16 rounded-lg p-2 flex flex-col justify-between text-left transition-all cursor-pointer shadow-sm relative border active:scale-95 ${
                    dish.isDark
                      ? "bg-[#252a2f] border-gray-900 text-white hover:bg-[#32383f]"
                      : "bg-gradient-to-b from-[#7ec855] via-[#5da835] to-[#478f24] border-[#38731b] text-white hover:from-[#8bd761] hover:to-[#509c2a]"
                  }`}
                >
                  <span className="text-[11px] font-bold leading-tight line-clamp-2 drop-shadow-xs">
                    {dish.name}
                  </span>
                  <span className="text-[10px] font-black self-end tracking-wider drop-shadow-xs">
                    {dish.price.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM FOOTER BAR                                                         */}
      {/* ========================================================================= */}
      <div className="h-14 px-4 bg-gradient-to-b from-[#d5d9de] via-[#bec4cc] to-[#a8afb8] border-t-2 border-[#828892] flex items-center justify-between shadow-md shrink-0">
        {/* Left Button: Основное меню */}
        <button
          onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-sm active:translate-y-0.5 cursor-pointer"
        >
          Основное меню
        </button>

        {/* Right Buttons: Пречек, Функции, Назад, Выход */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintPrecheck}
            className="px-5 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-sm active:translate-y-0.5 cursor-pointer"
          >
            Пречек (Счет)
          </button>
          <button
            onClick={() => alert("Қўшимча функциялар: Чек бўлиш, Столни кўчириш")}
            className="px-5 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-sm active:translate-y-0.5 cursor-pointer"
          >
            Функции
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-sm active:translate-y-0.5 cursor-pointer"
          >
            Назад
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-sm active:translate-y-0.5 cursor-pointer"
          >
            Выход
          </button>
        </div>
      </div>
    </div>
  );
};
