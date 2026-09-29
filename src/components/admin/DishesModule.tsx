import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/utils";
import { 
  Info, 
  Plus, 
  Trash2, 
  Edit, 
  Printer, 
  Download, 
  X, 
  Check, 
  Layers, 
  Package, 
  ShoppingBag, 
  Utensils, 
  Search,
  ChevronRight,
  ChevronDown,
  Database,
  Building2,
  FolderTree,
  Tag,
  Coffee,
  Sparkles,
  Sliders,
  Link as LinkIcon,
  ArrowRight,
  ArrowLeft,
  FileText,
  Calculator
} from "lucide-react";

export type DishesSubTab = 
  | "stocks"             // Склады
  | "departments"        // Отделы
  | "categories"         // Категории
  | "ingredient_groups"  // Группы ингредиентов
  | "ingredients"        // Ингредиенты
  | "semi_finished"      // Полуфабрикаты
  | "dishes"             // Блюда
  | "linked_dishes"      // Связанные блюда
  | "modifiers";         // Модификаторы

interface StockItem {
  id: string;
  name: string;
  cafeId?: string;
  createdAt?: string;
}

interface DepartmentItem {
  id: string;
  name: string;
  stockId?: string;
  printerType?: string;
  servicePercent?: number;
}

interface CategoryItem {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  deptId?: string;
  deptName?: string;
  stockId?: string;
  stockName?: string;
  btnColor?: string;
  textColor?: string;
  fontSize?: number;
  parentId?: string;
  dishesCount?: number;
}

interface RecipeIngredient {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  costPrice: number;
  supplierPrice?: number;
}

interface DishItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  categoryId?: string;
  stock?: number;
  costPrice?: number;
  profit?: number;
  markup?: number;
  btnColor?: string;
  textColor?: string;
  fontSize?: number;
  timeMinutes?: number;
  article1C?: string;
  isVisible?: boolean | number;
  isPiece?: boolean | number;
  isNoPercent?: boolean | number;
  isCommon?: boolean | number;
  recipe?: string | RecipeIngredient[];
  deptId?: string;
  stockId?: string;
  description?: string;
  mxikCode?: string;
  packageCode?: string;
}

interface ModifierItem {
  id: string;
  name: string;
  price: number;
  category?: string;
}

interface IngredientGroupItem {
  id: string;
  name: string;
}

interface IngredientItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minLimit: number;
  costPrice: number;
  supplier?: string;
}

interface SemiFinishedItem {
  id: string;
  name: string;
  unit: string;
  costPrice: number;
  stockId?: string;
  recipe?: string;
}

interface DishesModuleProps {
  initialSubTab?: DishesSubTab;
  cafeId?: string;
}

export const DishesModule: React.FC<DishesModuleProps> = ({ 
  initialSubTab = "categories", 
  cafeId = "default" 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<DishesSubTab>(initialSubTab);

  // Core Data
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [dishes, setDishes] = useState<DishItem[]>([]);
  const [ingredientGroups, setIngredientGroups] = useState<IngredientGroupItem[]>([]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [semiFinished, setSemiFinished] = useState<SemiFinishedItem[]>([]);
  const [modifiers, setModifiers] = useState<ModifierItem[]>([]);

  // Selection states for toolbar actions
  const [selectedStockIds, setSelectedStockIds] = useState<string[]>([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);

  // Toast / alerts
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ================= MODALS & FORM STATES =================
  // 1. Stocks Modal
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [newStockName, setNewStockName] = useState("");
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);

  // 2. Departments Modal
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptStockId, setNewDeptStockId] = useState("");
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);

  // 3. Category & Subcategory Modal (Screenshots 1, 2, 3)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [catName, setCatName] = useState("");
  const [catParentId, setCatParentId] = useState("");
  const [catDeptId, setCatDeptId] = useState("");
  const [catStockId, setCatStockId] = useState("");
  const [catBtnColor, setCatBtnColor] = useState("#000000");
  const [catTextColor, setCatTextColor] = useState("#419aff");
  const [catFontSize, setCatFontSize] = useState(16);

  // Subcategory form in same modal (Screenshot 3)
  const [subcatName, setSubcatName] = useState("");
  const [subcatBtnColor, setSubcatBtnColor] = useState("#000000");
  const [subcatTextColor, setSubcatTextColor] = useState("#419aff");
  const [subcatFontSize, setSubcatFontSize] = useState(16);

  // Expanded category sub-tables (Screenshot 2)
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({
    "cat-wines": true
  });

  // 4. Dishes Search & Filter States (Screenshots 4 & 5)
  const [dishSearchQuery, setDishSearchQuery] = useState("");
  const [dishFilterStock, setDishFilterStock] = useState("");
  const [dishFilterDept, setDishFilterDept] = useState("");
  const [dishFilterCat, setDishFilterCat] = useState("");
  const [dishesPerPage, setDishesPerPage] = useState(100);

  // Expanded dish calculation details (Screenshot 7)
  const [expandedDishCalcIds, setExpandedDishCalcIds] = useState<Record<string, boolean>>({});

  // 5. Dish Recipe / Calculation Creator Modal (Screenshot 6)
  const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<DishItem | null>(null);
  const [dishFormName, setDishFormName] = useState("");
  const [dishFormCatId, setDishFormCatId] = useState("");
  const [dishFormPrice, setDishFormPrice] = useState("");
  const [dishFormArticle1C, setDishFormArticle1C] = useState("");
  const [dishFormBtnColor, setDishFormBtnColor] = useState("#fff71f");
  const [dishFormTextColor, setDishFormTextColor] = useState("#000000");
  const [dishFormFontSize, setDishFormFontSize] = useState(16);
  const [dishFormTimeMinutes, setDishFormTimeMinutes] = useState(10);
  const [dishFormIsVisible, setDishFormIsVisible] = useState(true);
  const [dishFormIsPiece, setDishFormIsPiece] = useState(true);
  const [dishFormIsNoPercent, setDishFormIsNoPercent] = useState(false);
  const [dishFormIsCommon, setDishFormIsCommon] = useState(false);

  // Recipe ingredients builder
  const [recipeSelectedTab, setRecipeSelectedTab] = useState<"ingredients" | "semi_finished" | "import">("ingredients");
  const [recipeSearchQuery, setRecipeSearchQuery] = useState("");
  const [recipeFilterGroup, setRecipeFilterGroup] = useState("");
  const [recipeFilterStock, setRecipeFilterStock] = useState("");
  const [availableSelectedIngIds, setAvailableSelectedIngIds] = useState<string[]>([]);
  const [selectedRecipeItems, setSelectedRecipeItems] = useState<RecipeIngredient[]>([]);

  // Show Toast
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchData = async () => {
    try {
      const headers = { "x-cafe-id": cafeId };

      // Fetch all core catalog elements in parallel
      const [
        resStocks, 
        resDepts, 
        resCats, 
        resDishes, 
        resIngGroups, 
        resIngs, 
        resSemi, 
        resMods
      ] = await Promise.all([
        fetch("/api/stocks", { headers }),
        fetch("/api/departments", { headers }),
        fetch("/api/categories", { headers }),
        fetch("/api/products", { headers }),
        fetch("/api/ingredient-groups", { headers }),
        fetch("/api/inventory", { headers }),
        fetch("/api/semi-finished", { headers }),
        fetch("/api/modifiers", { headers }),
      ]);

      const [
        dataStocks, 
        dataDepts, 
        dataCats, 
        dataDishes, 
        dataIngGroups, 
        dataIngs, 
        dataSemi, 
        dataMods
      ] = await Promise.all([
        resStocks.json(),
        resDepts.json(),
        resCats.json(),
        resDishes.json(),
        resIngGroups.json(),
        resIngs.json(),
        resSemi.json(),
        resMods.json(),
      ]);

      if (Array.isArray(dataStocks)) setStocks(dataStocks);
      if (Array.isArray(dataDepts)) setDepartments(dataDepts);
      if (Array.isArray(dataCats)) setCategories(dataCats);
      if (Array.isArray(dataDishes)) setDishes(dataDishes);
      if (Array.isArray(dataIngGroups)) setIngredientGroups(dataIngGroups);
      if (Array.isArray(dataIngs)) setIngredients(dataIngs);
      if (Array.isArray(dataSemi)) setSemiFinished(dataSemi);
      if (Array.isArray(dataMods)) setModifiers(dataMods);
    } catch (err) {
      console.error("Failed to load Dishes module data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cafeId]);

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  // Helpers
  const getStockName = (stockId?: string) => {
    if (!stockId) return "—";
    const found = stocks.find(s => s.id === stockId);
    return found ? found.name : stockId;
  };

  const getDeptName = (deptId?: string) => {
    if (!deptId) return "—";
    const found = departments.find(d => d.id === deptId);
    return found ? found.name : deptId;
  };

  // ================= STOCKS OPERATIONS =================
  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockName.trim()) return;

    try {
      const url = editingStock ? `/api/stocks/${editingStock.id}` : "/api/stocks";
      const method = editingStock ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
        body: JSON.stringify({ name: newStockName.trim() })
      });
      if (res.ok) {
        showToast(editingStock ? "Склад успешно обновлен!" : "Склад успешно создан!");
        setIsAddStockOpen(false);
        setEditingStock(null);
        setNewStockName("");
        fetchData();
      }
    } catch (err) {
      showToast("Ошибка при сохранении склада", "error");
    }
  };

  const handleDeleteSelectedStocks = async () => {
    if (selectedStockIds.length === 0) return;
    if (!confirm(`Удалить выбранные склады (${selectedStockIds.length} шт.)?`)) return;

    try {
      for (const id of selectedStockIds) {
        await fetch(`/api/stocks/${id}`, { method: "DELETE", headers: { "x-cafe-id": cafeId } });
      }
      showToast("Выбранные склады удалены");
      setSelectedStockIds([]);
      fetchData();
    } catch (err) {
      showToast("Ошибка при удалении", "error");
    }
  };

  // ================= DEPARTMENTS OPERATIONS =================
  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    try {
      const url = editingDept ? `/api/departments/${editingDept.id}` : "/api/departments";
      const method = editingDept ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
        body: JSON.stringify({ 
          name: newDeptName.trim(),
          stockId: newDeptStockId || null
        })
      });
      if (res.ok) {
        showToast(editingDept ? "Отдел успешно обновлен!" : "Отдел успешно создан!");
        setIsAddDeptOpen(false);
        setEditingDept(null);
        setNewDeptName("");
        setNewDeptStockId("");
        fetchData();
      }
    } catch (err) {
      showToast("Ошибка при сохранении отдела", "error");
    }
  };

  const handleDeleteSelectedDepts = async () => {
    if (selectedDeptIds.length === 0) return;
    if (!confirm(`Удалить выбранные отделы (${selectedDeptIds.length} шт.)?`)) return;

    try {
      for (const id of selectedDeptIds) {
        await fetch(`/api/departments/${id}`, { method: "DELETE", headers: { "x-cafe-id": cafeId } });
      }
      showToast("Выбранные отделы удалены");
      setSelectedDeptIds([]);
      fetchData();
    } catch (err) {
      showToast("Ошибка при удалении", "error");
    }
  };

  // ================= CATEGORIES OPERATIONS (Screenshots 1, 2, 3) =================
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const selectedDept = departments.find(d => d.id === catDeptId);
      const selectedStock = stocks.find(s => s.id === catStockId);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
        body: JSON.stringify({
          name: catName.trim(),
          parentId: catParentId || null,
          deptId: catDeptId || null,
          deptName: selectedDept ? selectedDept.name : null,
          stockId: catStockId || null,
          stockName: selectedStock ? selectedStock.name : null,
          btnColor: catBtnColor,
          textColor: catTextColor,
          fontSize: Number(catFontSize) || 16
        })
      });
      if (res.ok) {
        showToast(editingCategory ? "Категория обновлена!" : "Категория создана!");
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
        fetchData();
      }
    } catch (err) {
      showToast("Ошибка при сохранении категории", "error");
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcatName.trim() || !catParentId) {
      alert("Выберите родительскую категорию и введите наименование подкатегории!");
      return;
    }

    try {
      const parent = categories.find(c => c.id === catParentId);
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
        body: JSON.stringify({
          name: subcatName.trim(),
          parentId: catParentId,
          deptId: parent?.deptId || null,
          deptName: parent?.deptName || null,
          stockId: parent?.stockId || null,
          stockName: parent?.stockName || null,
          btnColor: subcatBtnColor,
          textColor: subcatTextColor,
          fontSize: Number(subcatFontSize) || 16
        })
      });
      if (res.ok) {
        showToast("Подкатегория успешно создана!");
        setSubcatName("");
        setIsCategoryModalOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast("Ошибка при создании подкатегории", "error");
    }
  };

  const handleDeleteSelectedCategories = async () => {
    if (selectedCategoryIds.length === 0) return;
    if (!confirm(`Удалить выбранные категории (${selectedCategoryIds.length} шт.)?`)) return;

    try {
      for (const id of selectedCategoryIds) {
        await fetch(`/api/categories/${id}`, { method: "DELETE", headers: { "x-cafe-id": cafeId } });
      }
      showToast("Категории удалены");
      setSelectedCategoryIds([]);
      fetchData();
    } catch (err) {
      showToast("Ошибка при удалении", "error");
    }
  };

  // ================= DISHES RECIPE & CALCULATION OPERATIONS (Screenshots 4, 5, 6, 7) =================
  const handleAddIngredientToRecipe = (ing: IngredientItem) => {
    if (selectedRecipeItems.some(i => i.id === ing.id)) return;
    setSelectedRecipeItems(prev => [
      ...prev,
      {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        quantity: 1,
        costPrice: ing.costPrice,
        supplierPrice: ing.costPrice
      }
    ]);
  };

  const handleRemoveIngredientFromRecipe = (id: string) => {
    setSelectedRecipeItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateRecipeQuantity = (id: string, qty: number) => {
    setSelectedRecipeItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  // Calculate total cost of recipe
  const recipeTotalCost = selectedRecipeItems.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
  const dishPriceNum = Number(dishFormPrice) || 0;
  const calculatedProfit = dishPriceNum - recipeTotalCost;
  const calculatedMarkup = recipeTotalCost > 0 ? (dishPriceNum / recipeTotalCost).toFixed(2) : "1.00";

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishFormName.trim() || !dishFormPrice) return;

    try {
      const url = editingDish ? `/api/products/${editingDish.id}` : "/api/products";
      const method = editingDish ? "PUT" : "POST";

      const selectedCat = categories.find(c => c.id === dishFormCatId);

      const payload = {
        name: dishFormName.trim(),
        price: Number(dishFormPrice),
        categoryId: dishFormCatId || null,
        category: selectedCat ? selectedCat.name : "Блюда",
        costPrice: recipeTotalCost,
        profit: calculatedProfit,
        markup: Number(calculatedMarkup),
        article1C: dishFormArticle1C.trim() || null,
        btnColor: dishFormBtnColor,
        textColor: dishFormTextColor,
        fontSize: Number(dishFormFontSize) || 16,
        timeMinutes: Number(dishFormTimeMinutes) || 10,
        isVisible: dishFormIsVisible ? 1 : 0,
        isPiece: dishFormIsPiece ? 1 : 0,
        isNoPercent: dishFormIsNoPercent ? 1 : 0,
        isCommon: dishFormIsCommon ? 1 : 0,
        recipe: selectedRecipeItems,
        deptId: selectedCat?.deptId || null,
        stockId: selectedCat?.stockId || null
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(editingDish ? "Блюдо успешно обновлено!" : "Блюдо успешно создано!");
        setIsAddDishModalOpen(false);
        setEditingDish(null);
        setSelectedRecipeItems([]);
        fetchData();
      }
    } catch (err) {
      showToast("Ошибка при сохранении блюда", "error");
    }
  };

  const handleDeleteSelectedDishes = async () => {
    if (selectedDishIds.length === 0) return;
    if (!confirm(`Удалить выбранные блюда (${selectedDishIds.length} шт.)?`)) return;

    try {
      for (const id of selectedDishIds) {
        await fetch(`/api/products/${id}`, { method: "DELETE", headers: { "x-cafe-id": cafeId } });
      }
      showToast("Выбранные блюда удалены");
      setSelectedDishIds([]);
      fetchData();
    } catch (err) {
      showToast("Ошибка при удалении", "error");
    }
  };

  // Filtered dishes
  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = !dishSearchQuery || dish.name.toLowerCase().includes(dishSearchQuery.toLowerCase());
    const matchesStock = !dishFilterStock || dish.stockId === dishFilterStock;
    const matchesDept = !dishFilterDept || dish.deptId === dishFilterDept;
    const matchesCat = !dishFilterCat || dish.categoryId === dishFilterCat || dish.category === dishFilterCat;
    return matchesSearch && matchesStock && matchesDept && matchesCat;
  });

  // Category Tree: Group parent categories and their subcategories
  const parentCategories = categories.filter(c => !c.parentId);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parentId === parentId);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#ECEEF1] overflow-hidden text-gray-800 font-sans">
      {/* 1. TOP SUB-NAV BAR (Tabs for the 9 submodules) */}
      <div className="bg-[#58606E] text-white px-4 py-1.5 flex items-center justify-between shadow-sm shrink-0 border-b border-[#434954]">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar text-xs font-semibold">
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
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === tab.id
                  ? "bg-[#ECEEF1] text-[#2B303A] font-bold shadow-sm"
                  : "text-gray-200 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. DYNAMIC SUBMODULE VIEW */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* Toast Alert */}
        {message && (
          <div className={`mb-3 px-4 py-2 rounded text-xs font-bold flex items-center gap-2 shadow-sm ${
            message.type === "success" 
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800" 
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            <Check size={14} />
            <span>{message.text}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: СКЛАДЫ (STOCKS)                                                   */}
        {/* ========================================================================= */}
        {activeSubTab === "stocks" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingStock(null);
                  setNewStockName("");
                  setIsAddStockOpen(true);
                }}
                className="px-4 py-2 rounded bg-[#70B328] hover:bg-[#609B20] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>ДОБАВИТЬ</span>
              </button>

              <button
                onClick={() => {
                  if (selectedStockIds.length !== 1) return;
                  const item = stocks.find(s => s.id === selectedStockIds[0]);
                  if (item) {
                    setEditingStock(item);
                    setNewStockName(item.name);
                    setIsAddStockOpen(true);
                  }
                }}
                disabled={selectedStockIds.length !== 1}
                className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wide transition-all shadow-xs ${
                  selectedStockIds.length === 1
                    ? "bg-[#CCD1D9] text-gray-800 hover:bg-[#BAC0CB] cursor-pointer"
                    : "bg-[#E5E8EB] text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                РЕДАКТИРОВАТЬ
              </button>

              <button
                onClick={handleDeleteSelectedStocks}
                disabled={selectedStockIds.length === 0}
                className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wide transition-all shadow-xs ${
                  selectedStockIds.length > 0
                    ? "bg-[#FF6F61] text-white hover:bg-[#E85B4D] cursor-pointer"
                    : "bg-[#E5E8EB] text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                УДАЛИТЬ ВЫБРАННЫЕ
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded bg-[#00A3E0] hover:bg-[#008BBF] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all cursor-pointer"
              >
                ПЕЧАТЬ
              </button>

              <button
                onClick={() => {
                  const csv = "No,Наименование\n" + stocks.map((s, idx) => `${idx + 1},"${s.name}"`).join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `stocks_${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                }}
                className="px-4 py-2 rounded bg-[#00A3E0] hover:bg-[#008BBF] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all cursor-pointer"
              >
                ЭКСПОРТ
              </button>
            </div>

            {/* Stocks Table */}
            <div className="bg-white border border-[#D9DDE2] rounded shadow-sm overflow-hidden">
              <div className="bg-gradient-to-b from-[#6A7280] to-[#58606E] text-white px-4 py-2 text-sm font-bold tracking-wide flex items-center gap-1.5">
                <span>Склады</span>
                <span className="text-gray-300 cursor-help" title="Список складов">
                  <Info size={14} />
                </span>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#ECEEF1] text-gray-700 font-bold border-b border-[#D9DDE2]">
                    <th className="py-2.5 px-3 w-10 text-center border-r border-[#D9DDE2]">
                      <input
                        type="checkbox"
                        checked={stocks.length > 0 && selectedStockIds.length === stocks.length}
                        onChange={(e) => setSelectedStockIds(e.target.checked ? stocks.map(s => s.id) : [])}
                        className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3 w-14 text-center border-r border-[#D9DDE2]">№</th>
                    <th className="py-2.5 px-4 font-bold">Наименование</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock, idx) => {
                    const isSelected = selectedStockIds.includes(stock.id);
                    return (
                      <tr
                        key={stock.id}
                        onClick={() => setSelectedStockIds(prev => prev.includes(stock.id) ? prev.filter(i => i !== stock.id) : [...prev, stock.id])}
                        className={`border-b border-[#E9ECF0] transition-colors cursor-pointer ${
                          isSelected ? "bg-[#D6EAF8] text-[#1B4F72] font-semibold" : idx % 2 === 1 ? "bg-[#F9FAFB] hover:bg-[#F2F4F7]" : "bg-white hover:bg-[#F2F4F7]"
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2]" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => setSelectedStockIds(prev => prev.includes(stock.id) ? prev.filter(i => i !== stock.id) : [...prev, stock.id])}
                            className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2] font-semibold text-gray-700">{idx + 1}</td>
                        <td className="py-2.5 px-4 text-gray-900 font-medium">{stock.name}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: ОТДЕЛЫ (DEPARTMENTS)                                              */}
        {/* ========================================================================= */}
        {activeSubTab === "departments" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingDept(null);
                  setNewDeptName("");
                  setNewDeptStockId("");
                  setIsAddDeptOpen(true);
                }}
                className="px-4 py-2 rounded bg-[#70B328] hover:bg-[#609B20] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>ДОБАВИТЬ</span>
              </button>

              <button
                onClick={() => {
                  if (selectedDeptIds.length !== 1) return;
                  const item = departments.find(d => d.id === selectedDeptIds[0]);
                  if (item) {
                    setEditingDept(item);
                    setNewDeptName(item.name);
                    setNewDeptStockId(item.stockId || "");
                    setIsAddDeptOpen(true);
                  }
                }}
                disabled={selectedDeptIds.length !== 1}
                className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wide transition-all shadow-xs ${
                  selectedDeptIds.length === 1
                    ? "bg-[#CCD1D9] text-gray-800 hover:bg-[#BAC0CB] cursor-pointer"
                    : "bg-[#E5E8EB] text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                РЕДАКТИРОВАТЬ
              </button>

              <button
                onClick={handleDeleteSelectedDepts}
                disabled={selectedDeptIds.length === 0}
                className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wide transition-all shadow-xs ${
                  selectedDeptIds.length > 0
                    ? "bg-[#FF6F61] text-white hover:bg-[#E85B4D] cursor-pointer"
                    : "bg-[#E5E8EB] text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                УДАЛИТЬ ВЫБРАННЫЕ
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded bg-[#00A3E0] hover:bg-[#008BBF] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all cursor-pointer"
              >
                ПЕЧАТЬ
              </button>

              <button
                onClick={() => {
                  const csv = "No,Отдел,Склад\n" + departments.map((d, idx) => `${idx + 1},"${d.name}","${getStockName(d.stockId)}"`).join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `departments_${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                }}
                className="px-4 py-2 rounded bg-[#00A3E0] hover:bg-[#008BBF] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all cursor-pointer"
              >
                ЭКСПОРТ
              </button>
            </div>

            {/* Departments Table */}
            <div className="bg-white border border-[#D9DDE2] rounded shadow-sm overflow-hidden">
              <div className="bg-gradient-to-b from-[#6A7280] to-[#58606E] text-white px-4 py-2 text-sm font-bold tracking-wide flex items-center gap-1.5">
                <span>Отделы</span>
                <span className="text-gray-300 cursor-help" title="Список торговых отделов">
                  <Info size={14} />
                </span>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#ECEEF1] text-gray-700 font-bold border-b border-[#D9DDE2]">
                    <th className="py-2.5 px-3 w-10 text-center border-r border-[#D9DDE2]">
                      <input
                        type="checkbox"
                        checked={departments.length > 0 && selectedDeptIds.length === departments.length}
                        onChange={(e) => setSelectedDeptIds(e.target.checked ? departments.map(d => d.id) : [])}
                        className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3 w-14 text-center border-r border-[#D9DDE2]">№</th>
                    <th className="py-2.5 px-4 font-bold border-r border-[#D9DDE2]">Отдел</th>
                    <th className="py-2.5 px-4 font-bold">Склад</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept, idx) => {
                    const isSelected = selectedDeptIds.includes(dept.id);
                    return (
                      <tr
                        key={dept.id}
                        onClick={() => setSelectedDeptIds(prev => prev.includes(dept.id) ? prev.filter(i => i !== dept.id) : [...prev, dept.id])}
                        className={`border-b border-[#E9ECF0] transition-colors cursor-pointer ${
                          isSelected ? "bg-[#D6EAF8] text-[#1B4F72] font-semibold" : idx % 2 === 1 ? "bg-[#F9FAFB] hover:bg-[#F2F4F7]" : "bg-white hover:bg-[#F2F4F7]"
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2]" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => setSelectedDeptIds(prev => prev.includes(dept.id) ? prev.filter(i => i !== dept.id) : [...prev, dept.id])}
                            className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2] font-semibold text-gray-700">{idx + 1}</td>
                        <td className="py-2.5 px-4 text-gray-900 font-medium border-r border-[#D9DDE2]">{dept.name}</td>
                        <td className="py-2.5 px-4 text-gray-700">{getStockName(dept.stockId)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: КАТЕГОРИИ (CATEGORIES) - SCREENSHOTS 1, 2, 3 EXACT REPLICATION     */}
        {/* ========================================================================= */}
        {activeSubTab === "categories" && (
          <div className="space-y-3">
            {/* Top Action Buttons (Screenshot 1 & 2) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCatName("");
                  setCatParentId("");
                  setCatDeptId(departments[0]?.id || "");
                  setCatStockId(stocks[0]?.id || "");
                  setCatBtnColor("#000000");
                  setCatTextColor("#419aff");
                  setCatFontSize(16);
                  setIsCategoryModalOpen(true);
                }}
                className="px-4 py-2 rounded bg-[#70B328] hover:bg-[#609B20] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>ДОБАВИТЬ</span>
              </button>

              <button
                onClick={() => {
                  if (selectedCategoryIds.length !== 1) return;
                  const item = categories.find(c => c.id === selectedCategoryIds[0]);
                  if (item) {
                    setEditingCategory(item);
                    setCatName(item.name);
                    setCatParentId(item.parentId || "");
                    setCatDeptId(item.deptId || "");
                    setCatStockId(item.stockId || "");
                    setCatBtnColor(item.btnColor || "#000000");
                    setCatTextColor(item.textColor || "#419aff");
                    setCatFontSize(item.fontSize || 16);
                    setIsCategoryModalOpen(true);
                  }
                }}
                disabled={selectedCategoryIds.length !== 1}
                className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wide transition-all shadow-xs ${
                  selectedCategoryIds.length === 1
                    ? "bg-[#CCD1D9] text-gray-800 hover:bg-[#BAC0CB] cursor-pointer"
                    : "bg-[#E5E8EB] text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                РЕДАКТИРОВАТЬ
              </button>

              <button
                onClick={handleDeleteSelectedCategories}
                disabled={selectedCategoryIds.length === 0}
                className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wide transition-all shadow-xs ${
                  selectedCategoryIds.length > 0
                    ? "bg-[#FF6F61] text-white hover:bg-[#E85B4D] cursor-pointer"
                    : "bg-[#E5E8EB] text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                УДАЛИТЬ ВЫБРАННЫЕ
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded bg-[#00A3E0] hover:bg-[#008BBF] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all cursor-pointer"
              >
                ПЕЧАТЬ
              </button>

              <button
                onClick={() => {
                  const csv = "No,Наименование,Отдел,Склад,Цвет кнопки,Цвет текста,Размер шрифта\n" + 
                    categories.map((c, idx) => `${idx + 1},"${c.name}","${c.deptName || ''}","${c.stockName || ''}","${c.btnColor || ''}","${c.textColor || ''}",${c.fontSize || 16}`).join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `categories_${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                }}
                className="px-4 py-2 rounded bg-[#00A3E0] hover:bg-[#008BBF] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all cursor-pointer"
              >
                ЭКСПОРТ
              </button>
            </div>

            {/* Categories Table (Screenshots 1 & 2) */}
            <div className="bg-white border border-[#D9DDE2] rounded shadow-sm overflow-hidden">
              <div className="bg-gradient-to-b from-[#6A7280] to-[#58606E] text-white px-4 py-2 text-sm font-bold tracking-wide flex items-center gap-1.5">
                <span>Категории</span>
                <span className="text-gray-300 cursor-help" title="Список категорий и подкатегорий меню">
                  <Info size={14} />
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#ECEEF1] text-gray-700 font-bold border-b border-[#D9DDE2]">
                      <th className="py-2.5 px-3 w-10 text-center border-r border-[#D9DDE2]">
                        <input
                          type="checkbox"
                          checked={categories.length > 0 && selectedCategoryIds.length === categories.length}
                          onChange={(e) => setSelectedCategoryIds(e.target.checked ? categories.map(c => c.id) : [])}
                          className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3 w-12 text-center border-r border-[#D9DDE2]">№</th>
                      <th className="py-2.5 px-4 font-bold border-r border-[#D9DDE2]">Наименование</th>
                      <th className="py-2.5 px-4 font-bold border-r border-[#D9DDE2]">Отдел</th>
                      <th className="py-2.5 px-4 font-bold border-r border-[#D9DDE2]">Склад</th>
                      <th className="py-2.5 px-4 font-bold text-center border-r border-[#D9DDE2]">Цвет кнопки</th>
                      <th className="py-2.5 px-4 font-bold text-center border-r border-[#D9DDE2]">Цвет текста</th>
                      <th className="py-2.5 px-4 font-bold text-center border-r border-[#D9DDE2]">Размер шрифта</th>
                      <th className="py-2.5 px-4 font-bold text-center">Блюда</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parentCategories.map((parent, pIdx) => {
                      const isSelected = selectedCategoryIds.includes(parent.id);
                      const subcats = getSubcategories(parent.id);
                      const isExpanded = expandedCategoryIds[parent.id] ?? subcats.length > 0;

                      return (
                        <React.Fragment key={parent.id}>
                          {/* Parent Category Row */}
                          <tr
                            onClick={() => setSelectedCategoryIds(prev => prev.includes(parent.id) ? prev.filter(i => i !== parent.id) : [...prev, parent.id])}
                            className={`border-b border-[#E9ECF0] transition-colors cursor-pointer ${
                              isSelected ? "bg-[#D6EAF8] text-[#1B4F72] font-semibold" : pIdx % 2 === 1 ? "bg-[#F9FAFB] hover:bg-[#F2F4F7]" : "bg-white hover:bg-[#F2F4F7]"
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2]" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => setSelectedCategoryIds(prev => prev.includes(parent.id) ? prev.filter(i => i !== parent.id) : [...prev, parent.id])}
                                className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2] font-semibold text-gray-700">{pIdx + 1}</td>
                            <td className="py-2.5 px-4 text-gray-900 font-bold border-r border-[#D9DDE2]">
                              <div className="flex items-center gap-1.5">
                                {subcats.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedCategoryIds(prev => ({ ...prev, [parent.id]: !isExpanded }));
                                    }}
                                    className="text-gray-500 hover:text-gray-800"
                                  >
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </button>
                                )}
                                <span>{parent.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-gray-700 border-r border-[#D9DDE2]">{parent.deptName || getDeptName(parent.deptId)}</td>
                            <td className="py-2.5 px-4 text-gray-700 border-r border-[#D9DDE2]">{parent.stockName || getStockName(parent.stockId)}</td>
                            <td className="py-2.5 px-4 text-center border-r border-[#D9DDE2]">
                              <div className="inline-block w-12 h-5 rounded shadow-2xs border border-gray-300" style={{ backgroundColor: parent.btnColor || "#000000" }} />
                            </td>
                            <td className="py-2.5 px-4 text-center border-r border-[#D9DDE2]">
                              <div className="inline-block w-12 h-5 rounded shadow-2xs border border-gray-300" style={{ backgroundColor: parent.textColor || "#419aff" }} />
                            </td>
                            <td className="py-2.5 px-4 text-center border-r border-[#D9DDE2] font-mono">{parent.fontSize || 16}</td>
                            <td className="py-2.5 px-4 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDishFilterCat(parent.id);
                                  setActiveSubTab("dishes");
                                }}
                                className="text-[#00A3E0] hover:underline font-bold cursor-pointer"
                              >
                                Блюда
                              </button>
                            </td>
                          </tr>

                          {/* Nested Subcategories Tree (Screenshot 1 & 2) */}
                          {isExpanded && subcats.length > 0 && (
                            <tr className="bg-gray-50/70 border-b border-[#D9DDE2]">
                              <td colSpan={9} className="p-0">
                                <div className="pl-12 pr-4 py-2">
                                  <table className="w-full text-left border border-gray-300 bg-white rounded shadow-2xs text-xs">
                                    <thead>
                                      <tr className="bg-[#ECEEF1] text-gray-700 font-bold border-b border-gray-300">
                                        <th className="py-2 px-2.5 w-8 text-center border-r border-gray-300">
                                          <input
                                            type="checkbox"
                                            checked={subcats.every(s => selectedCategoryIds.includes(s.id))}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedCategoryIds(prev => [...new Set([...prev, ...subcats.map(s => s.id)])]);
                                              } else {
                                                setSelectedCategoryIds(prev => prev.filter(id => !subcats.some(s => s.id === id)));
                                              }
                                            }}
                                            className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                                          />
                                        </th>
                                        <th className="py-2 px-2.5 w-10 text-center border-r border-gray-300">№</th>
                                        <th className="py-2 px-3 font-bold border-r border-gray-300">Наименование</th>
                                        <th className="py-2 px-3 font-bold border-r border-gray-300">Отдел</th>
                                        <th className="py-2 px-3 font-bold border-r border-gray-300">Склад</th>
                                        <th className="py-2 px-3 font-bold text-center border-r border-gray-300">Цвет кнопки</th>
                                        <th className="py-2 px-3 font-bold text-center border-r border-gray-300">Цвет текста</th>
                                        <th className="py-2 px-3 font-bold text-center border-r border-gray-300">Размер шрифта</th>
                                        <th className="py-2 px-3 font-bold text-center">Блюда</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {subcats.map((sub, sIdx) => {
                                        const isSubSelected = selectedCategoryIds.includes(sub.id);
                                        return (
                                          <tr
                                            key={sub.id}
                                            onClick={() => setSelectedCategoryIds(prev => prev.includes(sub.id) ? prev.filter(i => i !== sub.id) : [...prev, sub.id])}
                                            className={`border-b border-gray-200 transition-colors cursor-pointer ${
                                              isSubSelected ? "bg-[#D6EAF8] text-[#1B4F72] font-semibold" : "hover:bg-gray-50"
                                            }`}
                                          >
                                            <td className="py-2 px-2.5 text-center border-r border-gray-300" onClick={e => e.stopPropagation()}>
                                              <input
                                                type="checkbox"
                                                checked={isSubSelected}
                                                onChange={() => setSelectedCategoryIds(prev => prev.includes(sub.id) ? prev.filter(i => i !== sub.id) : [...prev, sub.id])}
                                                className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                                              />
                                            </td>
                                            <td className="py-2 px-2.5 text-center border-r border-gray-300 font-semibold text-gray-600">{sIdx + 1}</td>
                                            <td className="py-2 px-3 text-gray-800 font-medium border-r border-gray-300">{sub.name}</td>
                                            <td className="py-2 px-3 text-gray-600 border-r border-gray-300">{sub.deptName || parent.deptName || "Бар"}</td>
                                            <td className="py-2 px-3 text-gray-600 border-r border-gray-300">{sub.stockName || parent.stockName || "Склад Бар"}</td>
                                            <td className="py-2 px-3 text-center border-r border-gray-300">
                                              <div className="inline-block w-10 h-4 rounded shadow-2xs border border-gray-300" style={{ backgroundColor: sub.btnColor || "#000000" }} />
                                            </td>
                                            <td className="py-2 px-3 text-center border-r border-gray-300">
                                              <div className="inline-block w-10 h-4 rounded shadow-2xs border border-gray-300" style={{ backgroundColor: sub.textColor || "#419aff" }} />
                                            </td>
                                            <td className="py-2 px-3 text-center border-r border-gray-300 font-mono">{sub.fontSize || 16}</td>
                                            <td className="py-2 px-3 text-center">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setDishFilterCat(sub.id);
                                                  setActiveSubTab("dishes");
                                                }}
                                                className="text-[#00A3E0] hover:underline font-bold cursor-pointer"
                                              >
                                                Блюда
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: БЛЮДА (DISHES CATALOG & CALCULATION) - SCREENSHOTS 4, 5, 6, 7      */}
        {/* ========================================================================= */}
        {activeSubTab === "dishes" && (
          <div className="space-y-3">
            {/* Top Search & Filter Bar (Screenshot 4 & 5) */}
            <div className="bg-white border border-[#D9DDE2] rounded p-3 space-y-3 shadow-sm">
              <div className="text-xs font-bold text-gray-700">Поиск по фильтру</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <select
                  value={dishFilterStock}
                  onChange={(e) => setDishFilterStock(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                >
                  <option value="">Все склады</option>
                  {stocks.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <select
                  value={dishFilterDept}
                  onChange={(e) => setDishFilterDept(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                >
                  <option value="">Все отделы</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>

                <select
                  value={dishFilterCat}
                  onChange={(e) => setDishFilterCat(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                >
                  <option value="">Все категории</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <input
                  type="text"
                  value={dishSearchQuery}
                  onChange={(e) => setDishSearchQuery(e.target.value)}
                  placeholder="Введите текст для поиска..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchData()}
                  className="px-4 py-1.5 bg-[#70B328] hover:bg-[#609B20] text-white text-xs font-bold rounded shadow-xs uppercase tracking-wider cursor-pointer"
                >
                  НАЧАТЬ ПОИСК
                </button>
                <button
                  onClick={() => {
                    setDishSearchQuery("");
                    setDishFilterStock("");
                    setDishFilterDept("");
                    setDishFilterCat("");
                  }}
                  className="px-4 py-1.5 bg-[#00A3E0] hover:bg-[#008BBF] text-white text-xs font-bold rounded shadow-xs uppercase tracking-wider cursor-pointer"
                >
                  ОЧИСТИТЬ
                </button>
              </div>
            </div>

            {/* Action Bar (Screenshot 4 & 5) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => {
                  setEditingDish(null);
                  setDishFormName("");
                  setDishFormCatId(categories[0]?.id || "");
                  setDishFormPrice("");
                  setDishFormArticle1C("");
                  setDishFormBtnColor("#fff71f");
                  setDishFormTextColor("#000000");
                  setDishFormFontSize(16);
                  setDishFormTimeMinutes(10);
                  setSelectedRecipeItems([]);
                  setIsAddDishModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded bg-[#70B328] hover:bg-[#609B20] text-white font-bold text-xs uppercase tracking-wide shadow-xs cursor-pointer"
              >
                ДОБАВИТЬ
              </button>

              <button
                onClick={() => {
                  if (selectedDishIds.length !== 1) return;
                  const item = dishes.find(d => d.id === selectedDishIds[0]);
                  if (item) {
                    setEditingDish(item);
                    setDishFormName(item.name);
                    setDishFormCatId(item.categoryId || "");
                    setDishFormPrice(String(item.price));
                    setDishFormArticle1C(item.article1C || "");
                    setDishFormBtnColor(item.btnColor || "#fff71f");
                    setDishFormTextColor(item.textColor || "#000000");
                    setDishFormFontSize(item.fontSize || 16);
                    setDishFormTimeMinutes(item.timeMinutes || 10);
                    setSelectedRecipeItems(typeof item.recipe === "string" ? JSON.parse(item.recipe || "[]") : (item.recipe || []));
                    setIsAddDishModalOpen(true);
                  }
                }}
                disabled={selectedDishIds.length !== 1}
                className={`px-3.5 py-1.5 rounded font-bold text-xs uppercase tracking-wide transition-all shadow-xs ${
                  selectedDishIds.length === 1
                    ? "bg-[#CCD1D9] text-gray-800 hover:bg-[#BAC0CB] cursor-pointer"
                    : "bg-[#E5E8EB] text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                РЕДАКТИРОВАТЬ
              </button>

              <button
                onClick={handleDeleteSelectedDishes}
                disabled={selectedDishIds.length === 0}
                className={`px-3.5 py-1.5 rounded font-bold text-xs uppercase tracking-wide transition-all shadow-xs ${
                  selectedDishIds.length > 0
                    ? "bg-[#FF6F61] text-white hover:bg-[#E85B4D] cursor-pointer"
                    : "bg-[#E5E8EB] text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                УДАЛИТЬ ВЫБРАННЫЕ
              </button>

              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded bg-[#00A3E0] hover:bg-[#008BBF] text-white font-bold text-xs uppercase tracking-wide shadow-xs cursor-pointer"
              >
                ПЕЧАТЬ
              </button>

              <button
                onClick={() => {
                  const csv = "No,Наименование,Цена,Себестоимость,Прибыль,Наценка,Категория\n" + 
                    filteredDishes.map((d, idx) => `${idx + 1},"${d.name}",${d.price},${d.costPrice || 0},${d.profit || 0},${d.markup || 1},"${d.category || ''}"`).join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `dishes_${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                }}
                className="px-3 py-1.5 rounded bg-[#00A3E0] hover:bg-[#008BBF] text-white font-bold text-xs uppercase tracking-wide shadow-xs cursor-pointer"
              >
                ЭКСПОРТ
              </button>
            </div>

            {/* Dishes Table (Screenshots 4, 5, 7) */}
            <div className="bg-white border border-[#D9DDE2] rounded shadow-sm overflow-hidden">
              <div className="bg-gradient-to-b from-[#6A7280] to-[#58606E] text-white px-4 py-2 flex items-center justify-between">
                <div className="text-sm font-bold tracking-wide flex items-center gap-1.5">
                  <span>Блюда</span>
                  <span className="text-gray-300 cursor-help" title="Каталог блюд, калькуляции и цены">
                    <Info size={14} />
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>Показывать на странице:</span>
                  <select
                    value={dishesPerPage}
                    onChange={(e) => setDishesPerPage(Number(e.target.value))}
                    className="bg-white text-gray-800 px-2 py-0.5 rounded text-xs font-bold border border-gray-300"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#ECEEF1] text-gray-700 font-bold border-b border-[#D9DDE2]">
                      <th className="py-2.5 px-3 w-8 text-center border-r border-[#D9DDE2]">
                        <input
                          type="checkbox"
                          checked={filteredDishes.length > 0 && selectedDishIds.length === filteredDishes.length}
                          onChange={(e) => setSelectedDishIds(e.target.checked ? filteredDishes.map(d => d.id) : [])}
                          className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3 w-10 text-center border-r border-[#D9DDE2]">№</th>
                      <th className="py-2.5 px-4 font-bold border-r border-[#D9DDE2]">Наименование ⇅</th>
                      <th className="py-2.5 px-3 font-bold text-right border-r border-[#D9DDE2]">Цена ⇅</th>
                      <th className="py-2.5 px-3 font-bold text-right border-r border-[#D9DDE2]">Себестоимость ⇅</th>
                      <th className="py-2.5 px-3 font-bold text-right border-r border-[#D9DDE2]">Прибыль ⇅</th>
                      <th className="py-2.5 px-3 font-bold text-center border-r border-[#D9DDE2]">Наценка ⇅</th>
                      <th className="py-2.5 px-4 font-bold border-r border-[#D9DDE2]">Категория ⇅</th>
                      <th className="py-2.5 px-3 font-bold text-center border-r border-[#D9DDE2]">Цвет кнопки</th>
                      <th className="py-2.5 px-3 font-bold text-center border-r border-[#D9DDE2]">Цвет текста</th>
                      <th className="py-2.5 px-3 font-bold text-center border-r border-[#D9DDE2]">Размер шрифта</th>
                      <th className="py-2.5 px-3 font-bold text-center border-r border-[#D9DDE2]">Калькуляция</th>
                      <th className="py-2.5 px-3 font-bold text-center">История</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDishes.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="py-8 text-center text-gray-400">
                          Блюда не найдены
                        </td>
                      </tr>
                    ) : (
                      filteredDishes.slice(0, dishesPerPage).map((dish, idx) => {
                        const isSelected = selectedDishIds.includes(dish.id);
                        const isDetailsOpen = expandedDishCalcIds[dish.id];
                        const recipeItems: RecipeIngredient[] = typeof dish.recipe === "string" 
                          ? JSON.parse(dish.recipe || "[]") 
                          : (dish.recipe || []);

                        return (
                          <React.Fragment key={dish.id}>
                            <tr
                              onClick={() => setSelectedDishIds(prev => prev.includes(dish.id) ? prev.filter(i => i !== dish.id) : [...prev, dish.id])}
                              className={`border-b border-[#E9ECF0] transition-colors cursor-pointer ${
                                isSelected ? "bg-[#D6EAF8] text-[#1B4F72] font-semibold" : idx % 2 === 1 ? "bg-[#F9FAFB] hover:bg-[#F2F4F7]" : "bg-white hover:bg-[#F2F4F7]"
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2]" onClick={e => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => setSelectedDishIds(prev => prev.includes(dish.id) ? prev.filter(i => i !== dish.id) : [...prev, dish.id])}
                                  className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2] font-semibold text-gray-700">{idx + 1}</td>
                              <td className="py-2.5 px-4 text-gray-900 font-bold border-r border-[#D9DDE2]">{dish.name}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 border-r border-[#D9DDE2]">
                                {formatCurrency(dish.price)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-gray-600 border-r border-[#D9DDE2]">
                                {formatCurrency(dish.costPrice || 0)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 border-r border-[#D9DDE2]">
                                {formatCurrency(dish.profit || (dish.price - (dish.costPrice || 0)))}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono border-r border-[#D9DDE2]">
                                {dish.markup || (dish.costPrice ? (dish.price / dish.costPrice).toFixed(2) : "1.00")}
                              </td>
                              <td className="py-2.5 px-4 text-gray-800 border-r border-[#D9DDE2]">{dish.category || "—"}</td>
                              <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2]">
                                <div className="inline-block w-10 h-4 rounded border border-gray-300 shadow-2xs" style={{ backgroundColor: dish.btnColor || "#fff71f" }} />
                              </td>
                              <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2]">
                                <div className="inline-block w-10 h-4 rounded border border-gray-300 shadow-2xs" style={{ backgroundColor: dish.textColor || "#000000" }} />
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono border-r border-[#D9DDE2]">{dish.fontSize || 16}</td>
                              <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedDishCalcIds(prev => ({ ...prev, [dish.id]: !isDetailsOpen }));
                                  }}
                                  className="text-[#00A3E0] hover:underline font-bold cursor-pointer"
                                >
                                  Детали
                                </button>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="text-[#00A3E0] hover:underline cursor-pointer">История (1)</span>
                              </td>
                            </tr>

                            {/* Expanded Recipe Calculation Subtable (Screenshot 7) */}
                            {isDetailsOpen && (
                              <tr className="bg-gray-50 border-b border-gray-300">
                                <td colSpan={13} className="p-4">
                                  <div className="max-w-2xl bg-white border border-gray-300 rounded shadow-xs p-3">
                                    <div className="font-bold text-gray-800 mb-2 flex items-center justify-between">
                                      <span>Калькуляция: {dish.name}</span>
                                      <span className="text-[11px] text-gray-500 font-normal">
                                        Цены указаны на: {new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}
                                      </span>
                                    </div>
                                    <table className="w-full text-left border border-gray-200 text-xs">
                                      <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                                        <tr>
                                          <th className="py-1.5 px-2 w-8 text-center border-r border-gray-200">№</th>
                                          <th className="py-1.5 px-3 border-r border-gray-200">Ингредиент</th>
                                          <th className="py-1.5 px-2 text-center border-r border-gray-200">Ед. изм.</th>
                                          <th className="py-1.5 px-2 text-center border-r border-gray-200">Кол-во</th>
                                          <th className="py-1.5 px-3 text-right">Цена по накладной</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {recipeItems.length === 0 ? (
                                          <tr>
                                            <td colSpan={5} className="py-4 text-center text-gray-400">
                                              Ингредиенты не добавлены в калькуляцию
                                            </td>
                                          </tr>
                                        ) : (
                                          recipeItems.map((ing, rIdx) => (
                                            <tr key={rIdx} className="border-b border-gray-100">
                                              <td className="py-1.5 px-2 text-center border-r border-gray-200">{rIdx + 1}</td>
                                              <td className="py-1.5 px-3 font-medium text-gray-800 border-r border-gray-200">{ing.name}</td>
                                              <td className="py-1.5 px-2 text-center border-r border-gray-200">{ing.unit}</td>
                                              <td className="py-1.5 px-2 text-center font-mono border-r border-gray-200">{ing.quantity}</td>
                                              <td className="py-1.5 px-3 text-right font-mono font-bold text-gray-900">
                                                {formatCurrency(ing.costPrice * ing.quantity)}
                                              </td>
                                            </tr>
                                          ))
                                        )}
                                      </tbody>
                                      <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                                        <tr>
                                          <td colSpan={4} className="py-1.5 px-3 text-right">Итого себестоимость:</td>
                                          <td className="py-1.5 px-3 text-right text-rose-700 font-mono">
                                            {formatCurrency(dish.costPrice || 0)}
                                          </td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Other 5 Subtabs (Ингредиенты, Группы, Полуфабрикаты, Модификаторы, Связанные блюда) */}
        {activeSubTab === "ingredient_groups" && (
          <div className="bg-white border border-[#D9DDE2] rounded p-4 space-y-3">
            <h3 className="font-bold text-sm text-gray-800">Группы ингредиентов</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {ingredientGroups.map((g, i) => (
                <div key={g.id} className="p-3 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
                  <span className="font-bold text-xs">{i + 1}. {g.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === "ingredients" && (
          <div className="bg-white border border-[#D9DDE2] rounded p-4 space-y-3">
            <h3 className="font-bold text-sm text-gray-800">Ингредиенты и остатки</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#ECEEF1] font-bold">
                <tr>
                  <th className="p-2">№</th>
                  <th className="p-2">Наименование</th>
                  <th className="p-2">Категория</th>
                  <th className="p-2 text-center">Ед. изм.</th>
                  <th className="p-2 text-right">Количество</th>
                  <th className="p-2 text-right">Цена закупки</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ingredients.map((ing, i) => (
                  <tr key={ing.id} className="hover:bg-gray-50">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2 font-bold">{ing.name}</td>
                    <td className="p-2 text-gray-500">{ing.category}</td>
                    <td className="p-2 text-center">{ing.unit}</td>
                    <td className="p-2 text-right font-mono">{ing.quantity}</td>
                    <td className="p-2 text-right font-mono font-bold">{formatCurrency(ing.costPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === "semi_finished" && (
          <div className="bg-white border border-[#D9DDE2] rounded p-4 space-y-3">
            <h3 className="font-bold text-sm text-gray-800">Полуфабрикаты</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {semiFinished.map((s, i) => (
                <div key={s.id} className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between">
                  <span className="font-bold">{s.name} ({s.unit})</span>
                  <span className="font-mono font-bold text-rose-700">{formatCurrency(s.costPrice)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === "modifiers" && (
          <div className="bg-white border border-[#D9DDE2] rounded p-4 space-y-3">
            <h3 className="font-bold text-sm text-gray-800">Модификаторы блюд</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              {modifiers.map((m) => (
                <div key={m.id} className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between">
                  <div>
                    <div className="font-bold">{m.name}</div>
                    <div className="text-[10px] text-gray-400">{m.category}</div>
                  </div>
                  <div className="font-bold text-emerald-700">{formatCurrency(m.price)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === "linked_dishes" && (
          <div className="bg-white border border-[#D9DDE2] rounded p-4 text-xs space-y-2">
            <h3 className="font-bold text-sm text-gray-800">Связанные блюда (Сеты и комбо)</h3>
            <p className="text-gray-500">Комбо-наборы и специальные связанные позиции</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. CATEGORY & SUBCATEGORY MODAL (SCREENSHOT 3 EXACT REPLICATION)          */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl border border-gray-300 overflow-hidden">
            {/* Header with Red Close Button */}
            <div className="bg-[#ECEEF1] border-b border-[#CCD1D9] px-5 py-2.5 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">
                {editingCategory ? "Редактирование категории" : "Добавление категории"}
              </span>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                <X size={18} />
              </button>
            </div>

            {/* Side-by-Side Dual Forms matching Screenshot 3 */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Редактирование категории */}
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Параметры категории</h4>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Наименование <span className="text-red-500">*</span> ℹ️
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Например: Белые вина"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#70B328]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Родительская Категория ℹ️
                  </label>
                  <select
                    value={catParentId}
                    onChange={(e) => setCatParentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-[#70B328]"
                  >
                    <option value="">Без родительской категории (Основная)</option>
                    {parentCategories.map(c => (
                      <option key={c.id} value={c.id}>- {c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Цвет кнопки * ℹ️</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={catBtnColor}
                        onChange={(e) => setCatBtnColor(e.target.value)}
                        className="w-8 h-8 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={catBtnColor}
                        onChange={(e) => setCatBtnColor(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Цвет текста * ℹ️</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={catTextColor}
                        onChange={(e) => setCatTextColor(e.target.value)}
                        className="w-8 h-8 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={catTextColor}
                        onChange={(e) => setCatTextColor(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Размер шрифта * ℹ️</label>
                  <input
                    type="number"
                    value={catFontSize}
                    onChange={(e) => setCatFontSize(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#70B328] hover:bg-[#609B20] text-white text-xs font-bold rounded shadow-xs uppercase tracking-wider cursor-pointer"
                  >
                    СОХРАНИТЬ
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-5 py-2 bg-[#FF6F61] hover:bg-[#E85B4D] text-white text-xs font-bold rounded shadow-xs uppercase tracking-wider cursor-pointer"
                  >
                    ОТМЕНА
                  </button>
                </div>
              </form>

              {/* Right Column: Добавление подкатегории (Screenshot 3) */}
              <form onSubmit={handleCreateSubcategory} className="space-y-4 border-l border-gray-200 pl-8">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Добавление подкатегории ℹ️</h4>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Наименование <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subcatName}
                    onChange={(e) => setSubcatName(e.target.value)}
                    placeholder="Например: Игристое вино"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#70B328]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Цвет кнопки *</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={subcatBtnColor}
                        onChange={(e) => setSubcatBtnColor(e.target.value)}
                        className="w-8 h-8 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={subcatBtnColor}
                        onChange={(e) => setSubcatBtnColor(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Цвет текста *</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={subcatTextColor}
                        onChange={(e) => setSubcatTextColor(e.target.value)}
                        className="w-8 h-8 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={subcatTextColor}
                        onChange={(e) => setSubcatTextColor(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Размер шрифта *</label>
                  <input
                    type="number"
                    value={subcatFontSize}
                    onChange={(e) => setSubcatFontSize(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#70B328] hover:bg-[#609B20] text-white text-xs font-bold rounded shadow-xs uppercase tracking-wider cursor-pointer"
                  >
                    СОЗДАТЬ
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DISH RECIPE & CALCULATION BUILDER MODAL (SCREENSHOT 6 EXACT)           */}
      {/* ========================================================================= */}
      {isAddDishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl border border-gray-300 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-[#ECEEF1] border-b border-[#CCD1D9] px-5 py-2.5 flex items-center justify-between shrink-0">
              <span className="text-sm font-bold text-gray-800">
                {editingDish ? "Редактирование блюда" : "Добавления нового блюда"}
              </span>
              <button
                onClick={() => setIsAddDishModalOpen(false)}
                className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {/* Top Form Fields Row 1 (Screenshot 6) */}
              <div className="grid grid-cols-2 md:grid-cols-8 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Наименование: <span className="text-red-500">*</span> ℹ️
                  </label>
                  <input
                    type="text"
                    required
                    value={dishFormName}
                    onChange={(e) => setDishFormName(e.target.value)}
                    placeholder="Например: Beef Steak"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#70B328]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Категория: <span className="text-red-500">*</span> ℹ️
                  </label>
                  <select
                    required
                    value={dishFormCatId}
                    onChange={(e) => setDishFormCatId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-[#70B328]"
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Цена за ед. изм. <span className="text-red-500">*</span> ℹ️
                  </label>
                  <input
                    type="number"
                    required
                    value={dishFormPrice}
                    onChange={(e) => setDishFormPrice(e.target.value)}
                    placeholder="1500"
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:border-[#70B328]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Артикул для 1С: ℹ️</label>
                  <input
                    type="text"
                    value={dishFormArticle1C}
                    onChange={(e) => setDishFormArticle1C(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Цвет кнопки * ℹ️</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={dishFormBtnColor}
                      onChange={(e) => setDishFormBtnColor(e.target.value)}
                      className="w-6 h-6 rounded border cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={dishFormBtnColor}
                      onChange={(e) => setDishFormBtnColor(e.target.value)}
                      className="w-full px-1 py-1 text-[10px] font-mono border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Время (мин.) ℹ️</label>
                  <input
                    type="number"
                    value={dishFormTimeMinutes}
                    onChange={(e) => setDishFormTimeMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Checkboxes Row (Screenshot 6) */}
              <div className="flex items-center gap-6 text-xs text-gray-700 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishFormIsVisible}
                    onChange={(e) => setDishFormIsVisible(e.target.checked)}
                    className="rounded text-[#70B328]"
                  />
                  <span>Видимое: ℹ️</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishFormIsPiece}
                    onChange={(e) => setDishFormIsPiece(e.target.checked)}
                    className="rounded text-[#70B328]"
                  />
                  <span>Штучное: ℹ️</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishFormIsNoPercent}
                    onChange={(e) => setDishFormIsNoPercent(e.target.checked)}
                    className="rounded text-[#70B328]"
                  />
                  <span>Без %: ℹ️</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishFormIsCommon}
                    onChange={(e) => setDishFormIsCommon(e.target.checked)}
                    className="rounded text-[#70B328]"
                  />
                  <span>Общее ℹ️</span>
                </label>
              </div>

              {/* 3-Column Recipe Calculator Grid (Screenshot 6) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
                {/* Column 1: Available Ingredients list (5 cols) */}
                <div className="md:col-span-5 bg-white border border-gray-300 rounded p-2.5 space-y-2 flex flex-col h-[350px]">
                  <div className="flex items-center gap-1 border-b border-gray-200 pb-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setRecipeSelectedTab("ingredients")}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                        recipeSelectedTab === "ingredients" ? "bg-[#ECEEF1] text-gray-900 border border-gray-300" : "text-gray-500"
                      }`}
                    >
                      Ингредиенты
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipeSelectedTab("semi_finished")}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                        recipeSelectedTab === "semi_finished" ? "bg-[#ECEEF1] text-gray-900 border border-gray-300" : "text-gray-500"
                      }`}
                    >
                      Полуфабрикаты
                    </button>
                  </div>

                  <input
                    type="text"
                    value={recipeSearchQuery}
                    onChange={(e) => setRecipeSearchQuery(e.target.value)}
                    placeholder="Введите текст для поиска..."
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={recipeFilterGroup}
                      onChange={(e) => setRecipeFilterGroup(e.target.value)}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded bg-white"
                    >
                      <option value="">Выберите группу</option>
                      {ingredientGroups.map(g => (
                        <option key={g.id} value={g.name}>{g.name}</option>
                      ))}
                    </select>

                    <select
                      value={recipeFilterStock}
                      onChange={(e) => setRecipeFilterStock(e.target.value)}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded bg-white"
                    >
                      <option value="">Выберите склад</option>
                      {stocks.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Available Items Table */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar border border-gray-200 rounded">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0">
                        <tr>
                          <th className="p-1.5 w-6 text-center"></th>
                          <th className="p-1.5">Наименование</th>
                          <th className="p-1.5 text-center">Ед. изм</th>
                          <th className="p-1.5">Группа</th>
                          <th className="p-1.5 text-right">Цена</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {ingredients
                          .filter(i => !recipeSearchQuery || i.name.toLowerCase().includes(recipeSearchQuery.toLowerCase()))
                          .map(ing => (
                            <tr
                              key={ing.id}
                              onClick={() => handleAddIngredientToRecipe(ing)}
                              className="hover:bg-gray-50 cursor-pointer"
                            >
                              <td className="p-1.5 text-center">
                                <Plus size={12} className="text-[#70B328]" />
                              </td>
                              <td className="p-1.5 font-medium text-gray-800">{ing.name}</td>
                              <td className="p-1.5 text-center text-gray-500">{ing.unit}</td>
                              <td className="p-1.5 text-gray-500 truncate max-w-[80px]">{ing.category}</td>
                              <td className="p-1.5 text-right font-mono font-bold text-gray-900">{formatCurrency(ing.costPrice)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Column 2: Selected Ingredients in recipe (4 cols) */}
                <div className="md:col-span-4 bg-white border border-gray-300 rounded p-2.5 flex flex-col h-[350px]">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <span className="text-xs font-bold text-gray-700">Выбранные ингредиенты ℹ️</span>
                    <button
                      type="button"
                      className="px-2.5 py-1 bg-[#00A3E0] text-white text-[11px] font-bold rounded cursor-pointer"
                    >
                      РАССЧИТАТЬ
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar border border-gray-200 rounded mt-2">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0">
                        <tr>
                          <th className="p-1.5 w-6 text-center">№</th>
                          <th className="p-1.5">Наименование</th>
                          <th className="p-1.5 text-center">Ед. изм</th>
                          <th className="p-1.5 text-center w-16">Кол-во</th>
                          <th className="p-1.5 w-6"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedRecipeItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-400">
                              Нажмите на ингредиент слева, чтобы добавить в калькуляцию
                            </td>
                          </tr>
                        ) : (
                          selectedRecipeItems.map((item, idx) => (
                            <tr key={item.id}>
                              <td className="p-1.5 text-center text-gray-500">{idx + 1}</td>
                              <td className="p-1.5 font-medium text-gray-900 truncate max-w-[100px]">{item.name}</td>
                              <td className="p-1.5 text-center text-gray-500">{item.unit}</td>
                              <td className="p-1.5 text-center">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.001"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateRecipeQuantity(item.id, Number(e.target.value))}
                                  className="w-14 px-1 py-0.5 text-center font-mono border border-gray-300 rounded"
                                />
                              </td>
                              <td className="p-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveIngredientFromRecipe(item.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X size={12} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Column 3: Расчет себестоимости блюда (3 cols) */}
                <div className="md:col-span-3 bg-[#F8F9FB] border border-gray-300 rounded p-3 flex flex-col justify-between h-[350px]">
                  <div>
                    <h5 className="text-xs font-bold text-gray-800 border-b border-gray-300 pb-1.5">
                      Расчет себестоимости блюда ℹ️
                    </h5>

                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Цена продажи:</span>
                        <span className="font-bold font-mono text-gray-900">{formatCurrency(dishPriceNum)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Себестоимость:</span>
                        <span className="font-bold font-mono text-rose-700">{formatCurrency(recipeTotalCost)}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-1.5">
                        <span className="text-gray-700 font-bold">Прибыль:</span>
                        <span className="font-bold font-mono text-emerald-700">{formatCurrency(calculatedProfit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Наценка:</span>
                        <span className="font-bold font-mono text-blue-700">{calculatedMarkup}x</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                    💡 При изменении закупочных цен в накладных себестоимость блюда пересчитывается автоматически.
                  </div>
                </div>
              </div>

              {/* Bottom Actions (Screenshot 6) */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded bg-[#70B328] hover:bg-[#609B20] text-white font-bold text-xs uppercase tracking-wide shadow-sm cursor-pointer"
                  >
                    {editingDish ? "СОХРАНИТЬ" : "СОЗДАТЬ"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddDishModalOpen(false)}
                    className="px-6 py-2 rounded bg-[#FF6F61] hover:bg-[#E85B4D] text-white font-bold text-xs uppercase tracking-wide shadow-sm cursor-pointer"
                  >
                    ОТМЕНА
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
