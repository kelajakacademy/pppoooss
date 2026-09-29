import React, { useState, useEffect } from "react";
import { Employee } from "../../types";
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Phone, 
  Key, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Check, 
  X,
  RotateCw,
  AlertCircle
} from "lucide-react";

export const EmployeesManager: React.FC<{ cafeId?: string }> = ({ cafeId = "default" }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "fired" | "all">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("waiter");
  const [formPin, setFormPin] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "fired">("active");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/employees", {
        headers: { "x-cafe-id": cafeId }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [cafeId]);

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormName("");
    setFormPhone("+998 ");
    setFormRole("waiter");
    setFormPin("");
    setFormStatus("active");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormPhone(emp.phone || "");
    setFormRole(emp.role);
    setFormPin(emp.pin);
    setFormStatus(emp.status || "active");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPin.trim()) {
      setFormError("Xodim F.I.O va PIN kodi kiritilishi shart");
      return;
    }
    if (formPin.length < 4) {
      setFormError("PIN kod kamida 4 xonali bo'lishi kerak");
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      if (editingEmployee) {
        // Update
        const res = await fetch(`/api/admin/employees/${editingEmployee.id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "x-cafe-id": cafeId 
          },
          body: JSON.stringify({
            name: formName.trim(),
            phone: formPhone.trim(),
            role: formRole,
            pin: formPin.trim(),
            status: formStatus
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setIsModalOpen(false);
          fetchEmployees();
        } else {
          setFormError(data.message || "Tahrirlashda xatolik yuz berdi");
        }
      } else {
        // Create
        const res = await fetch("/api/admin/employees", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-cafe-id": cafeId 
          },
          body: JSON.stringify({
            name: formName.trim(),
            phone: formPhone.trim(),
            role: formRole,
            pin: formPin.trim(),
            status: formStatus
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setIsModalOpen(false);
          fetchEmployees();
        } else {
          setFormError(data.message || "Saqlashda xatolik yuz berdi");
        }
      }
    } catch (err: any) {
      setFormError("Server bilan aloqa uzildi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Haqiqatan ham "${name}" xodimini o'chirmoqchimisiz?`)) {
      try {
        const res = await fetch(`/api/admin/employees/${id}`, { 
          method: "DELETE",
          headers: { "x-cafe-id": cafeId }
        });
        if (res.ok) {
          fetchEmployees();
        }
      } catch (err) {
        console.error("Failed to delete employee:", err);
      }
    }
  };

  // Filtering
  const filteredEmployees = employees.filter((emp) => {
    // Status tab filter
    const status = emp.status || "active";
    if (activeTab === "active" && status !== "active") return false;
    if (activeTab === "fired" && status !== "fired") return false;

    // Role filter
    if (roleFilter !== "all" && emp.role !== roleFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = emp.name.toLowerCase().includes(q);
      const matchPhone = (emp.phone || "").toLowerCase().includes(q);
      const matchPin = emp.pin.includes(q);
      if (!matchName && !matchPhone && !matchPin) return false;
    }

    return true;
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "waiter": return "Официант (Ofitsiant)";
      case "admin": return "Администратор (Admin)";
      case "cashier": return "Кассир (Kassir)";
      case "chef": return "Шеф-повар (Oshpaz)";
      default: return role;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#121417] p-6 lg:p-8 overflow-y-auto custom-scrollbar">
      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Кадры
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Restoran xodimlari, ofitsiantlar va ularning tizimga kirish PIN-kodlarini boshqarish
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchEmployees}
          className="p-2.5 rounded-xl bg-[#1E2227] border border-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Yangilash"
        >
          <RotateCw size={18} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#181A1F] p-2.5 rounded-2xl border border-gray-800">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Tabs: Активно / Уволенные */}
          <div className="flex bg-[#121417] p-1 rounded-xl border border-gray-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                activeTab === "active" ? "bg-[#25292F] text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Активно ({employees.filter(e => (e.status || 'active') === 'active').length})
            </button>
            <button
              onClick={() => setActiveTab("fired")}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                activeTab === "fired" ? "bg-[#25292F] text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Уволенные ({employees.filter(e => e.status === 'fired').length})
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                activeTab === "all" ? "bg-[#25292F] text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Все ({employees.length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по ФИО, телефону, ПИН..."
              className="w-full bg-[#121417] border border-gray-800 text-white rounded-xl pl-10 pr-3.5 py-2 text-xs placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Role Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold hidden md:inline">Должность:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[#121417] border border-gray-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="all">Все должности</option>
              <option value="waiter">Официант</option>
              <option value="admin">Администратор</option>
              <option value="cashier">Кассир</option>
              <option value="chef">Шеф-повар</option>
            </select>
          </div>
        </div>

        {/* Add Employee Button */}
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#F39C12] hover:bg-[#E67E22] text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Добавить сотрудника</span>
        </button>
      </div>

      {/* Employees Content */}
      {filteredEmployees.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-base font-bold text-gray-300">Сотрудники не найдены</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Попробуйте изменить параметры поиска или добавьте нового сотрудника кнопкой выше
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const isFired = emp.status === "fired";
            const initials = emp.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

            return (
              <div
                key={emp.id}
                className={`bg-[#181A1F] rounded-2xl border p-5 transition-all flex flex-col justify-between relative group ${
                  isFired 
                    ? "border-gray-800/60 opacity-60" 
                    : "border-gray-800 hover:border-gray-700 hover:shadow-xl"
                }`}
              >
                <div>
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl font-black text-sm flex items-center justify-center border shadow-inner ${
                        emp.role === 'admin' 
                          ? "bg-purple-500/20 border-purple-500/30 text-purple-400" 
                          : emp.role === 'waiter' 
                          ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                          : "bg-blue-500/20 border-blue-500/30 text-blue-400"
                      }`}>
                        {initials || "X"}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                          <span>{emp.name}</span>
                          {emp.role === 'admin' && (
                            <span className="p-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px]" title="Admin">
                              <ShieldCheck size={12} />
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {getRoleLabel(emp.role)}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                      isFired 
                        ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {isFired ? "Уволен" : "Активно"}
                    </span>
                  </div>

                  {/* Info badges */}
                  <div className="space-y-2 py-3 border-t border-b border-gray-800/80 text-xs">
                    <div className="flex items-center justify-between text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} className="text-gray-500" />
                        Телефон:
                      </span>
                      <span className="font-mono text-gray-200">
                        {emp.phone || "Ko'rsatilmagan"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Key size={13} className="text-amber-500" />
                        POS PIN-kodi:
                      </span>
                      <span className="font-mono font-bold bg-[#121417] px-2 py-0.5 rounded text-amber-400 border border-gray-800">
                        {emp.pin}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions footer */}
                <div className="pt-4 mt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(emp)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-white/5 transition-colors"
                  >
                    <Edit3 size={13} />
                    <span>Редактировать</span>
                  </button>

                  <button
                    onClick={() => handleDelete(emp.id, emp.name)}
                    className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors border border-red-500/20"
                    title="O'chirish"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181A1F] border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-5">
              <div>
                <h3 className="text-lg font-black text-white">
                  {editingEmployee ? "Сотрудникни таҳрирлаш" : "Янги ходим қўшиш"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  POS tizimiga kirish va buyurtma olish uchun xodim ma'lumotlari
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Ф.И.О (Ism va Familiya) *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Masalan: Sardor Aliyev"
                  required
                  className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Телефон рақами
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">
                    Должность (Лавозими)
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="waiter">Официант</option>
                    <option value="admin">Администратор</option>
                    <option value="cashier">Кассир</option>
                    <option value="chef">Шеф-повар</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">
                    POS PIN-коди *
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Masalan: 1234"
                    required
                    className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Ҳолати (Статус)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus("active")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      formStatus === "active"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : "bg-[#121417] border-gray-800 text-gray-500 hover:text-white"
                    }`}
                  >
                    ✓ Активно
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus("fired")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      formStatus === "fired"
                        ? "bg-red-500/20 border-red-500 text-red-400"
                        : "bg-[#121417] border-gray-800 text-gray-500 hover:text-white"
                    }`}
                  >
                    Уволен
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold transition-colors"
                >
                  Бекор қилиш
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#F39C12] hover:bg-[#E67E22] text-black font-black text-xs transition-colors shadow-lg"
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
