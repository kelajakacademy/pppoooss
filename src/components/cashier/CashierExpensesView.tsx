import React, { useState } from "react";
import { useOrder } from "../../context/OrderContext";

interface ExpenseGroup {
  id: string;
  name: string;
}

interface CashOperation {
  id: string;
  groupId: string;
  groupName: string;
  type: "expense" | "income";
  cashRegister: string;
  date: string;
  description: string;
  cashAmount: number;
  bankAccountAmount: number;
  bankCardAmount: number;
  totalAmount: number;
  author: string;
  createdAt: string;
}

interface CashierExpensesViewProps {
  onBack: () => void;
  onExit: () => void;
}

export const CashierExpensesView: React.FC<CashierExpensesViewProps> = ({ onBack, onExit }) => {
  const { waiter, receiptConfig, linkedCafe } = useOrder();

  // Initial groups matching screenshot 1
  const [groups, setGroups] = useState<ExpenseGroup[]>([
    { id: "g1", name: "Группа 1" },
    { id: "g2", name: "Закуп" },
    { id: "g3", name: "Зарплата" },
    { id: "g4", name: "Инвестиции" },
    { id: "g5", name: "Инкассация" },
    { id: "g6", name: "Расходный материал" }
  ]);

  const [selectedGroupId, setSelectedGroupId] = useState<string>("g2");
  const [searchQuery, setSearchQuery] = useState("");

  // Form states matching screenshot 1
  const [cashRegister] = useState("Касса по умолчанию");
  const [currentDate] = useState(() => {
    const d = new Date();
    const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  });

  const [description, setDescription] = useState("");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [bankAccountAmount, setBankAccountAmount] = useState<string>("");
  const [bankCardAmount, setBankCardAmount] = useState<string>("");

  // Recent operations list
  const [operations, setOperations] = useState<CashOperation[]>([
    {
      id: "op-1",
      groupId: "g2",
      groupName: "Закуп",
      type: "expense",
      cashRegister: "Касса по умолчанию",
      date: "22 Декабрь 2018",
      description: "Go'sht va sabzavotlar haridi",
      cashAmount: 350000,
      bankAccountAmount: 0,
      bankCardAmount: 0,
      totalAmount: 350000,
      author: waiter?.name || "Аида",
      createdAt: "10:30"
    },
    {
      id: "op-2",
      groupId: "g3",
      groupName: "Зарплата",
      type: "expense",
      cashRegister: "Касса по умолчанию",
      date: "22 Декабрь 2018",
      description: "Avans ofitsiant",
      cashAmount: 200000,
      bankAccountAmount: 0,
      bankCardAmount: 0,
      totalAmount: 200000,
      author: waiter?.name || "Аида",
      createdAt: "14:15"
    }
  ]);

  // Modals for "Добавить группу", "Редактировать", "Перевод на кассу"
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [editGroupName, setEditGroupName] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDesc, setTransferDesc] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || groups[0];

  const totalCalculated = 
    (Number(cashAmount) || 0) + 
    (Number(bankAccountAmount) || 0) + 
    (Number(bankCardAmount) || 0);

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateOperation = (type: "expense" | "income") => {
    if (totalCalculated <= 0) {
      showToast("Iltimos, summani kiriting (Наличные, Банковский счет yoki Карта)!");
      return;
    }

    const newOp: CashOperation = {
      id: "op-" + Date.now(),
      groupId: selectedGroup.id,
      groupName: selectedGroup.name,
      type,
      cashRegister,
      date: currentDate,
      description: description || (type === "expense" ? "Chiqim amaliyoti" : "Kirim amaliyoti"),
      cashAmount: Number(cashAmount) || 0,
      bankAccountAmount: Number(bankAccountAmount) || 0,
      bankCardAmount: Number(bankCardAmount) || 0,
      totalAmount: totalCalculated,
      author: waiter?.name || "Аида",
      createdAt: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    };

    setOperations(prev => [newOp, ...prev]);
    setDescription("");
    setCashAmount("");
    setBankAccountAmount("");
    setBankCardAmount("");
    showToast(type === "expense" ? "Расход муваффақиятли сақланди!" : "Приход муваффақиятли сақланди!");
  };

  const handleAddGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newG: ExpenseGroup = {
      id: "g-" + Date.now(),
      name: newGroupName.trim()
    };
    setGroups(prev => [...prev, newG]);
    setSelectedGroupId(newG.id);
    setNewGroupName("");
    setShowAddGroupModal(false);
    showToast("Янги гуруҳ қўшилди!");
  };

  const handleEditGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGroupName.trim() || !selectedGroupId) return;
    setGroups(prev => prev.map(g => g.id === selectedGroupId ? { ...g, name: editGroupName.trim() } : g));
    setShowEditGroupModal(false);
    showToast("Гуруҳ номи янгиланди!");
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || Number(transferAmount) <= 0) return;
    const newOp: CashOperation = {
      id: "op-" + Date.now(),
      groupId: "g5",
      groupName: "Инкассация / Перевод",
      type: "income",
      cashRegister: "Касса по умолчанию",
      date: currentDate,
      description: `Кассага ўтказма: ${transferDesc || "Инкассация"}`,
      cashAmount: Number(transferAmount),
      bankAccountAmount: 0,
      bankCardAmount: 0,
      totalAmount: Number(transferAmount),
      author: waiter?.name || "Аида",
      createdAt: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    };
    setOperations(prev => [newOp, ...prev]);
    setShowTransferModal(false);
    setTransferAmount("");
    setTransferDesc("");
    showToast("Кассага ўтказма амалга оширилди!");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#d0d4da] select-none font-sans text-black relative">
      {/* Toast popup */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#25292e] text-white px-5 py-2.5 rounded-xl border border-white/20 shadow-2xl text-xs font-bold animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* TOP HEADER / SEARCH BAR */}
      <div className="h-10 px-4 bg-gradient-to-r from-[#bec3cb] via-[#d0d4da] to-[#bec3cb] border-b border-[#9ba1aa] flex items-center justify-between text-xs">
        <div className="font-bold text-[#2d3748] tracking-wider uppercase text-[11px]">
          ГРУППА
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-bold text-[11px]">Поиск</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 sm:w-64 bg-white/90 border border-gray-400 rounded px-2 py-0.5 text-xs text-black outline-none focus:border-blue-500 shadow-inner"
            placeholder=""
          />
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORK AREA (MATCHING IMAGE 1) */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* LEFT COLUMN: GROUPS LIST */}
        <div className="w-1/3 min-w-[240px] max-w-[340px] flex flex-col bg-[#c2c6cd] rounded-xl border border-[#9ea4ad] overflow-hidden shadow-inner">
          {/* Table Header */}
          <div className="h-8 px-4 bg-gradient-to-b from-[#a4c0e4] via-[#8bb1dc] to-[#719fd2] border-b border-[#5e8bbb] flex items-center shadow-sm">
            <span className="text-xs font-bold text-[#1a2f4c] uppercase tracking-wider">
              НАЗВАНИЕ
            </span>
          </div>

          {/* Group Buttons List */}
          <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
            {filteredGroups.map((group) => {
              const isSelected = selectedGroupId === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`w-full py-2.5 px-4 rounded-lg text-left text-xs font-bold transition-all border shadow-sm cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-b from-[#b8d4f7] via-[#9ec6f5] to-[#7db0ef] border-[#4a8cd4] text-[#0d2e59] shadow-inner"
                      : "bg-gradient-to-b from-[#f3f4f6] via-[#e2e5e9] to-[#ccd1d8] hover:from-white hover:to-[#dce0e6] text-[#2c3238] border-[#a2a8b2]"
                  }`}
                >
                  {group.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: FORM & RECENT TRANSACTIONS */}
        <div className="flex-1 flex flex-col bg-[#e3e6eb] rounded-xl border border-[#9ea4ad] p-5 justify-between shadow-inner overflow-y-auto">
          {/* Form Fields Section */}
          <div className="max-w-xl mx-auto w-full space-y-2.5 text-xs">
            {/* 1. Касса */}
            <div className="grid grid-cols-12 items-center gap-3">
              <label className="col-span-4 text-right font-bold text-gray-700">
                Касса
              </label>
              <div className="col-span-8">
                <input
                  type="text"
                  readOnly
                  value={cashRegister}
                  className="w-full bg-[#f1f3f5] border border-gray-400 rounded px-3 py-1.5 text-xs text-gray-800 font-semibold shadow-inner outline-none cursor-default"
                />
              </div>
            </div>

            {/* 2. Дата */}
            <div className="grid grid-cols-12 items-center gap-3">
              <label className="col-span-4 text-right font-bold text-gray-700">
                Дата
              </label>
              <div className="col-span-8">
                <input
                  type="text"
                  readOnly
                  value={currentDate}
                  className="w-full bg-[#f1f3f5] border border-gray-400 rounded px-3 py-1.5 text-xs text-gray-800 font-semibold shadow-inner outline-none cursor-default"
                />
              </div>
            </div>

            {/* 3. Группа */}
            <div className="grid grid-cols-12 items-center gap-3">
              <label className="col-span-4 text-right font-bold text-gray-700">
                Группа
              </label>
              <div className="col-span-8">
                <input
                  type="text"
                  readOnly
                  value={selectedGroup.name}
                  className="w-full bg-[#f1f3f5] border border-gray-400 rounded px-3 py-1.5 text-xs text-gray-900 font-bold shadow-inner outline-none"
                />
              </div>
            </div>

            {/* 4. Описание */}
            <div className="grid grid-cols-12 items-center gap-3">
              <label className="col-span-4 text-right font-bold text-gray-700">
                Описание
              </label>
              <div className="col-span-8">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Изоҳ киритинг..."
                  className="w-full bg-white border border-gray-400 rounded px-3 py-1.5 text-xs text-black shadow-inner outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* 5. Наличные */}
            <div className="grid grid-cols-12 items-center gap-3">
              <label className="col-span-4 text-right font-bold text-gray-700">
                Наличные
              </label>
              <div className="col-span-8">
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white border border-gray-400 rounded px-3 py-1.5 text-xs text-right font-bold text-black shadow-inner outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* 6. Банковский счет */}
            <div className="grid grid-cols-12 items-center gap-3">
              <label className="col-span-4 text-right font-bold text-gray-700">
                Банковский счет
              </label>
              <div className="col-span-8">
                <input
                  type="number"
                  value={bankAccountAmount}
                  onChange={(e) => setBankAccountAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white border border-gray-400 rounded px-3 py-1.5 text-xs text-right font-bold text-black shadow-inner outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* 7. Банковская карта */}
            <div className="grid grid-cols-12 items-center gap-3">
              <label className="col-span-4 text-right font-bold text-gray-700">
                Банковская карта
              </label>
              <div className="col-span-8">
                <input
                  type="number"
                  value={bankCardAmount}
                  onChange={(e) => setBankCardAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white border border-gray-400 rounded px-3 py-1.5 text-xs text-right font-bold text-black shadow-inner outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Total Display */}
            <div className="grid grid-cols-12 items-center gap-3 pt-1">
              <div className="col-span-4 text-right font-black text-gray-700">
                Итого:
              </div>
              <div className="col-span-8 text-right font-black text-base text-[#1a2f4c]">
                {totalCalculated.toLocaleString()} so'm
              </div>
            </div>

            {/* Action Buttons: - Расход and + Приход */}
            <div className="flex items-center justify-center gap-6 pt-3">
              <button
                onClick={() => handleCreateOperation("expense")}
                className="w-36 py-2.5 rounded-lg border border-[#8a919c] bg-gradient-to-b from-[#f8f9fa] via-[#e2e5e9] to-[#caced4] hover:from-white hover:to-[#dce0e6] text-[#2c3238] font-black text-xs shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer text-center"
              >
                - Расход
              </button>
              <button
                onClick={() => handleCreateOperation("income")}
                className="w-36 py-2.5 rounded-lg border border-[#8a919c] bg-gradient-to-b from-[#f8f9fa] via-[#e2e5e9] to-[#caced4] hover:from-white hover:to-[#dce0e6] text-[#2c3238] font-black text-xs shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer text-center"
              >
                + Приход
              </button>
            </div>
          </div>

          {/* Bottom Recent Operations Table */}
          <div className="mt-4 pt-3 border-t border-gray-400/60">
            <div className="text-[11px] font-bold text-gray-700 mb-1.5 uppercase">
              Последние операции:
            </div>
            <div className="h-28 bg-[#f5f6f8] border border-gray-400 rounded-lg p-2 overflow-y-auto divide-y divide-gray-200">
              {operations.length === 0 ? (
                <div className="text-center text-gray-400 text-xs py-6">
                  Операциялар мавжуд эмас
                </div>
              ) : (
                operations.map((op) => (
                  <div key={op.id} className="py-1.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        op.type === "expense" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}>
                        {op.type === "expense" ? "Расход" : "Приход"}
                      </span>
                      <span className="font-bold text-gray-800">{op.groupName}</span>
                      <span className="text-gray-500 text-[11px]">({op.description})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">
                        {op.totalAmount.toLocaleString()} so'm
                      </span>
                      <span className="text-gray-400 text-[10px] font-mono">{op.createdAt}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER BAR (MATCHING IMAGE 1) */}
      <div className="h-14 px-4 bg-gradient-to-b from-[#d5d9de] via-[#bec4cc] to-[#a8afb8] border-t-2 border-[#828892] flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditGroupName(selectedGroup.name);
              setShowEditGroupModal(true);
            }}
            className="px-4 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-bold text-xs shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer"
          >
            Редактировать
          </button>
          <button
            onClick={() => {
              setNewGroupName("");
              setShowAddGroupModal(true);
            }}
            className="px-4 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-bold text-xs shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer"
          >
            Добавить группу
          </button>
        </div>

        {/* Center Button: Перевод на кассу */}
        <div>
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-6 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-bold text-xs shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer"
          >
            Перевод на кассу
          </button>
        </div>

        {/* Right Buttons: Назад and Выход */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-5 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-bold text-xs shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer"
          >
            Назад
          </button>
          <button
            onClick={onExit}
            className="px-5 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-bold text-xs shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer"
          >
            Выход
          </button>
        </div>
      </div>

      {/* ADD GROUP MODAL */}
      {showAddGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddGroupSubmit} className="bg-[#e4e7ec] border-2 border-gray-400 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-black text-sm text-gray-800 uppercase">Янги гуруҳ қўшиш</h3>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Гуруҳ номи:</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Масалан: Маркетинг, Хўжалик"
                className="w-full bg-white border border-gray-400 rounded px-3 py-2 text-xs text-black outline-none focus:border-blue-500"
                required
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddGroupModal(false)}
                className="flex-1 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold text-xs cursor-pointer"
              >
                Бекор қилиш
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-xs cursor-pointer"
              >
                Қўшиш
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT GROUP MODAL */}
      {showEditGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleEditGroupSubmit} className="bg-[#e4e7ec] border-2 border-gray-400 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-black text-sm text-gray-800 uppercase">Гуруҳ номини ўзгартириш</h3>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Гуруҳ номи:</label>
              <input
                type="text"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                className="w-full bg-white border border-gray-400 rounded px-3 py-2 text-xs text-black outline-none focus:border-blue-500"
                required
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditGroupModal(false)}
                className="flex-1 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold text-xs cursor-pointer"
              >
                Бекор қилиш
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-xs cursor-pointer"
              >
                Сақлаш
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TRANSFER TO CASH MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleTransferSubmit} className="bg-[#e4e7ec] border-2 border-gray-400 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-black text-sm text-gray-800 uppercase">Перевод на кассу (Инкассация)</h3>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Сумма (сўм):</label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-white border border-gray-400 rounded px-3 py-2 text-xs font-bold text-black outline-none focus:border-blue-500"
                required
                min="1"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Изоҳ:</label>
              <input
                type="text"
                value={transferDesc}
                onChange={(e) => setTransferDesc(e.target.value)}
                placeholder="Кассага тўлдириш"
                className="w-full bg-white border border-gray-400 rounded px-3 py-2 text-xs text-black outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="flex-1 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold text-xs cursor-pointer"
              >
                Бекор қилиш
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-black text-xs cursor-pointer"
              >
                Ўтказиш
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
