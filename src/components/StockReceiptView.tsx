import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  Calendar, 
  Search, 
  SlidersHorizontal,
  Filter, 
  Settings, 
  Star, 
  MoreVertical, 
  MoreHorizontal,
  Sparkles, 
  Pencil, 
  FileSpreadsheet, 
  FileDown, 
  Printer, 
  X, 
  Check, 
  ChevronDown,
  ArrowDownToLine,
  CheckSquare,
  Square,
  Hash,
  Send,
  User,
  Store,
  Tag,
  DollarSign,
  Trash2
} from 'lucide-react';
import { Tool, StockReceipt, StockReceiptItem } from '../types';
import { useRental } from '../context/RentalContext';
import { formatMoney, formatDate, getTodayDateString, getYesterdayDateString } from '../utils/formatters';
import { calculateDepositPrice } from '../utils/toolHelpers';
import { generateStockReceiptsReportPDF, generateSingleStockReceiptPDF } from '../utils/pdfGenerator';
import { AiReceiptExtractorModal, ExtractedReceiptItem } from './AiReceiptExtractorModal';
import { ReceiptDetailModal } from './ReceiptDetailModal';

export interface ImportRow {
  id: string;
  name: string;
  quantity: number;
  originalCostPrice: number;
  currency: 'UZS' | 'USD';
  costPrice: number;
  lifespan: number;
  complementaryParts: number;
  replacementValue: number;
  depositAmount: number;
  dailyRentalPrice: number;
  matchedToolId?: string;
}

interface StockReceiptViewProps {
  onOpenAddTool: () => void;
  preSelectedTool?: Tool | null;
}

export const StockReceiptView: React.FC<StockReceiptViewProps> = ({
  onOpenAddTool,
  preSelectedTool
}) => {
  const { tools, receipts, addStockReceipt, deleteStockReceipt, clearAllStockReceipts } = useRental();

  // Clean receipts state - no mock purchases by default
  const [localReceipts, setLocalReceipts] = useState<StockReceipt[]>(() => {
    try {
      localStorage.removeItem('arenda_erp_receipts_v1'); // Clear any previously injected mock data
    } catch {}
    return [];
  });

  const allReceipts = useMemo(() => {
    // Put context receipts (if any added via app) on top, then local receipts without duplicate IDs
    const contextIds = new Set(receipts.map(r => r.id));
    const merged = [
      ...receipts.map(r => ({
        ...r,
        receiptNumber: r.receiptNumber.startsWith('#') ? r.receiptNumber : `# ${r.receiptNumber}`,
        status: r.status || 'Qabul qilindi',
        currency: r.currency || 'UZS',
        responsiblePerson: r.responsiblePerson || "G'iyosiddin To'xtayev (OPERATSION BO'LIM)",
        creatorPerson: r.creatorPerson || "Muhammadjon Xudoyberganov (OPERATSION BO'LIM)",
        warehouse: r.warehouse || "KO'CHA",
        priceListType: r.priceListType || 'KELISH NARXI'
      })),
      ...localReceipts.filter(r => !contextIds.has(r.id))
    ];
    return merged;
  }, [receipts, localReceipts]);

  // UI States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'manual'|'excel'>('manual');
  const [exchangeRate, setExchangeRate] = useState<number>(12800);
  const [isFavorite, setIsFavorite] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Filter States (Image 1 Filter Bar)
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [responsibleFilter, setResponsibleFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<Set<string>>(new Set());

  // Detail Modal State (Image 2)
  const [activeDetailReceipt, setActiveDetailReceipt] = useState<StockReceipt | null>(null);

  // AI Scanner Modal State
  const [showAiReceiptModal, setShowAiReceiptModal] = useState<boolean>(false);

  // Form input states
  const [receiptNumberInput, setReceiptNumberInput] = useState('');
  const [supplierName, setSupplierName] = useState('(№ 233) ELYOR (ABDULAZIZ)');
  const [receiptDate, setReceiptDate] = useState('2026-yil 17-sentabr');
  const [receiptWarehouse, setReceiptWarehouse] = useState("KO'CHA");
  const [receiptResponsible, setReceiptResponsible] = useState("G'iyosiddin To'xtayev (OPERATSION BO'LIM)");
  const [receiptCreator, setReceiptCreator] = useState("Muhammadjon Xudoyberganov (OPERATSION BO'LIM)");
  const [receiptNotes, setReceiptNotes] = useState('');

  // Manual Item input
  const [selectedToolId, setSelectedToolId] = useState<string>(
    preSelectedTool ? preSelectedTool.id : (tools[0]?.id || '')
  );
  const [customItemName, setCustomItemName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [itemUnit, setItemUnit] = useState<string>('dona');
  const [manualCurrency, setManualCurrency] = useState<'UZS'|'USD'>('USD');
  const [costPrice, setCostPrice] = useState<number>(455.91);
  const [dailyRentalPrice, setDailyRentalPrice] = useState<number>(0);

  // Excel state
  const [excelRows, setExcelRows] = useState<ImportRow[]>([]);
  const [excelError, setExcelError] = useState('');
  const [globalCurrency, setGlobalCurrency] = useState<'UZS' | 'USD'>('USD');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notification, setNotification] = useState('');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Status Change handler
  const handleUpdateStatus = (receiptId: string, newStatus: string) => {
    setLocalReceipts(prev => {
      const updated = prev.map(r => r.id === receiptId ? { ...r, status: newStatus } : r);
      try {
        localStorage.setItem('arenda_erp_receipts_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showNotification(`Hujjat holati "${newStatus}" ga o‘zgartirildi`);
  };

  // AI Apply handler
  const handleApplyAiReceipt = (item: ExtractedReceiptItem) => {
    if (item.yetkazib_beruvchi) {
      setSupplierName(item.yetkazib_beruvchi);
    }
    if (item.raqam) {
      setReceiptNumberInput(item.raqam.startsWith('#') ? item.raqam : `# ${item.raqam}`);
    }
    if (item.sana) {
      setReceiptDate(item.sana);
    }
    if (item.masuliyatli) {
      setReceiptResponsible(item.masuliyatli);
    }
    if (item.yaratilgan) {
      setReceiptCreator(item.yaratilgan);
    }
    setReceiptNotes(`AI orqali yuklandi: ${item.summa} | Holat: ${item.holat}`);
    setIsFormOpen(true);
    setFormMode('manual');
    showNotification(`AI orqali ajratilgan hujjat (${item.raqam}) ma'lumotlari kiritildi.`);
  };

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    return allReceipts.filter(r => {
      const matchesSearch = !searchQuery.trim() || 
        r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.responsiblePerson && r.responsiblePerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.creatorPerson && r.creatorPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.items.some(i => i.toolName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDate = !dateFilter || r.date.includes(dateFilter) || (r.createdAt && r.createdAt.startsWith(dateFilter));

      const matchesResponsible = responsibleFilter === 'all' || 
        (r.responsiblePerson && r.responsiblePerson.includes(responsibleFilter));

      const matchesWarehouse = warehouseFilter === 'all' || 
        (r.warehouse && r.warehouse.toUpperCase() === warehouseFilter.toUpperCase());

      return matchesSearch && matchesDate && matchesResponsible && matchesWarehouse;
    });
  }, [allReceipts, searchQuery, dateFilter, responsibleFilter, warehouseFilter]);

  // Grand totals matching summary row
  const totals = useMemo(() => {
    let sumUZS = 0;
    let sumUSD = 0;
    filteredReceipts.forEach(r => {
      if (r.currency === 'USD') {
        sumUSD += r.totalCost;
      } else {
        sumUZS += r.totalCost;
      }
    });

    return { totalUZS: sumUZS, totalUSD: sumUSD };
  }, [filteredReceipts]);

  // Select all handler
  const handleToggleSelectAll = () => {
    if (selectedReceiptIds.size === filteredReceipts.length) {
      setSelectedReceiptIds(new Set());
    } else {
      setSelectedReceiptIds(new Set(filteredReceipts.map(r => r.id)));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedReceiptIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Save new receipt handler
  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();

    const nextNumber = receiptNumberInput.trim() || `# ${5595 + allReceipts.length}`;
    const cleanNumber = nextNumber.startsWith('#') ? nextNumber : `# ${nextNumber}`;

    if (formMode === 'manual') {
      const tool = tools.find(t => t.id === selectedToolId);
      const itemName = customItemName.trim() || tool?.name || 'Yangi qabul qilingan mahsulot';
      const unitCost = Number(costPrice) || 1000;
      const totalAmount = unitCost * (Number(quantity) || 1);

      const newReceipt: StockReceipt = {
        id: `rcpt-${Date.now()}`,
        receiptNumber: cleanNumber,
        date: receiptDate || '2026-yil 17-sentabr',
        supplierName: supplierName.trim() || '(№ 233) ELYOR (ABDULAZIZ)',
        totalCost: totalAmount,
        currency: manualCurrency,
        status: 'Qabul qilindi',
        responsiblePerson: receiptResponsible,
        creatorPerson: receiptCreator,
        warehouse: receiptWarehouse,
        priceListType: 'KELISH NARXI',
        notes: receiptNotes,
        createdAt: new Date().toISOString(),
        items: [
          {
            toolId: tool?.id || `tool-${Date.now()}`,
            toolName: itemName,
            article: tool?.article || 'ART-NEW',
            code: tool?.code || 'CODE-NEW',
            quantity: Number(quantity) || 1,
            costPrice: unitCost,
            dailyRentalPrice: Number(dailyRentalPrice) || 0,
            unit: itemUnit,
            totalPrice: totalAmount
          }
        ]
      };

      setLocalReceipts(prev => {
        const updated = [newReceipt, ...prev];
        try {
          localStorage.setItem('arenda_erp_receipts_v1', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Also register to RentalContext
      addStockReceipt({
        receiptNumber: cleanNumber,
        date: getTodayDateString(),
        supplierName: newReceipt.supplierName,
        items: newReceipt.items,
        totalCost: totalAmount,
        notes: receiptNotes
      });

      showNotification(`Xarid ${cleanNumber} muvaffaqiyatli saqlandi!`);
      setIsFormOpen(false);
      setReceiptNumberInput('');
      setReceiptNotes('');
    }
  };

  return (
    <div className="space-y-4 font-sans text-stone-900 animate-fadeIn">

      {/* Top Header matching Image 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Xaridlar
          </h1>
        </div>

        {/* Right header action buttons */}
        <div className="flex items-center gap-2">
          {/* Favorite Star Toggle */}
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2 rounded-lg border transition cursor-pointer active:scale-95 ${
              isFavorite 
                ? 'border-amber-300 bg-amber-50 text-amber-500' 
                : 'border-stone-200 text-stone-400 hover:text-stone-600 bg-white'
            }`}
            title="Sevimlilarga qo'shish"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          {/* AI Scanner Button */}
          <button
            type="button"
            onClick={() => setShowAiReceiptModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-2xs transition active:scale-95 cursor-pointer"
            title="AI Chek & Hujjat Skaner"
          >
            <Sparkles className="w-4 h-4 text-stone-950 animate-pulse" />
            <span className="hidden sm:inline">AI Skaner</span>
          </button>

          {/* Primary + Xarid Button matching Image 1 */}
          <button
            type="button"
            onClick={() => {
              setFormMode('manual');
              setIsFormOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#1877F2] hover:bg-blue-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Xarid</span>
          </button>

          {/* More Options Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-stone-200 rounded-xl shadow-lg p-1 z-30 text-xs font-medium space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    generateStockReceiptsReportPDF(filteredReceipts, { date: dateFilter });
                    setShowMoreMenu(false);
                    showNotification('PDF hisoboti shakllantirildi');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center gap-2 text-stone-700"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>PDF Hisobot</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const exportData = filteredReceipts.map(r => ({
                        'Raqam': r.receiptNumber,
                        'Sana': r.date,
                        'Yetkazib beruvchi': r.supplierName,
                        'Summa': r.totalCost,
                        'Valyuta': r.currency || 'UZS',
                        'Holat': r.status || 'Qabul qilindi',
                        'Mas\'uliyatli': r.responsiblePerson || '',
                        'Yaratilgan': r.creatorPerson || ''
                      }));
                      const ws = XLSX.utils.json_to_sheet(exportData);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Xaridlar');
                      XLSX.writeFile(wb, 'Xaridlar_Royxati.xlsx');
                      setShowMoreMenu(false);
                      showNotification('Excel fayli yuklab olindi');
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center gap-2 text-stone-700"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excelga eksport</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDateFilter('');
                    setResponsibleFilter('all');
                    setWarehouseFilter('all');
                    setShowMoreMenu(false);
                    showNotification('Filtrlar tozalandi');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Filtrni tozalash</span>
                </button>
                <div className="my-1 border-t border-stone-100" />
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Haqiqatan ham barcha xaridlarni o'chirmoqchimisiz?")) {
                      setLocalReceipts([]);
                      clearAllStockReceipts();
                      setSelectedReceiptIds(new Set());
                      try {
                        localStorage.removeItem('arenda_erp_receipts_v1');
                        localStorage.removeItem('arenda_receipts_v2');
                      } catch {}
                      setShowMoreMenu(false);
                      showNotification("Barcha xaridlar o'chirildi");
                    }
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Barcha xaridlarni o'chirish</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Row matching Image 1 */}
      <div className="flex flex-wrap items-center gap-2.5 bg-white p-3 rounded-xl border border-stone-200 shadow-2xs text-xs">
        
        {/* Search Input with Tune Slider icon on right */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Qidiruv"
            className="w-full pl-9 pr-8 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <button 
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-600"
            title="Qidiruv sozlamalari"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sotib olingan sana picker */}
        <div className="relative min-w-[170px]">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-300 rounded-lg text-stone-700">
            <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <input
              type="text"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              placeholder="Sotib olingan sana"
              className="w-full bg-transparent border-none text-xs focus:outline-hidden placeholder-stone-400"
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Mas'uliyatli Filter Dropdown */}
        <div className="relative min-w-[150px]">
          <select
            value={responsibleFilter}
            onChange={e => setResponsibleFilter(e.target.value)}
            className="w-full appearance-none px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 pr-8 cursor-pointer"
          >
            <option value="all">Mas'uliyatli</option>
            <option value="G'iyosiddin">G'iyosiddin To'xtayev</option>
            <option value="Botir">Botir Imomdjanov</option>
            <option value="Abbos">Abbos Ishoqov</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Ombor Filter Dropdown */}
        <div className="relative min-w-[130px]">
          <select
            value={warehouseFilter}
            onChange={e => setWarehouseFilter(e.target.value)}
            className="w-full appearance-none px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 pr-8 cursor-pointer"
          >
            <option value="all">Ombor</option>
            <option value="KO'CHA">KO'CHA</option>
            <option value="ASOSIY OMBOR">ASOSIY OMBOR</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Funnel Icon Button matching Image 1 */}
        <button
          type="button"
          onClick={() => {
            if (dateFilter || responsibleFilter !== 'all' || warehouseFilter !== 'all' || searchQuery) {
              setDateFilter('');
              setResponsibleFilter('all');
              setWarehouseFilter('all');
              setSearchQuery('');
            } else {
              setDateFilter('17-sentabr');
            }
          }}
          className="p-2 rounded-lg border border-blue-500 hover:bg-blue-50 text-blue-600 transition cursor-pointer"
          title="Filtr"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Main Table matching Image 1 */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-xs font-semibold text-stone-600 bg-white select-none">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedReceiptIds.size > 0 && selectedReceiptIds.size === filteredReceipts.length}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 w-28">Raqam</th>
                <th className="py-3 px-4 w-44">
                  <span className="flex items-center gap-1 cursor-pointer hover:text-stone-900">
                    <span>Sana</span>
                    <span className="text-stone-400">↑</span>
                  </span>
                </th>
                <th className="py-3 px-4">Yetkazib beruvchi</th>
                <th className="py-3 px-4 text-right w-44">Summa</th>
                <th className="py-3 px-4 w-36 text-center">Holat</th>
                <th className="py-3 px-4">Mas'uliyatli</th>
                <th className="py-3 px-4">Yaratilgan</th>
                <th className="py-3 px-3 w-10 text-center">
                  <Settings className="w-4 h-4 text-stone-400 hover:text-stone-600 cursor-pointer inline-block" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-800">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-stone-400">
                    <div className="max-w-xs mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-3 text-blue-500 shadow-2xs">
                        <ArrowDownToLine className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-sm text-stone-800">Hozircha xaridlar mavjud emas</p>
                      <p className="text-xs text-stone-500 mt-1">Yangi xarid qo'shish uchun yuqoridagi ko'k "+ Xarid" tugmasini bosing</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReceipts.map(receipt => {
                  const isChecked = selectedReceiptIds.has(receipt.id);
                  const isUSD = receipt.currency === 'USD';
                  const formattedSum = isUSD 
                    ? `${receipt.totalCost.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} AQSh dollari` 
                    : `${receipt.totalCost.toLocaleString('ru-RU')} so'm`;

                  return (
                    <tr 
                      key={receipt.id} 
                      className={`hover:bg-blue-50/30 transition ${isChecked ? 'bg-blue-50/50' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectRow(receipt.id)}
                          className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Raqam with Blue square # badge */}
                      <td className="py-3 px-4">
                        <div 
                          onClick={() => setActiveDetailReceipt(receipt)}
                          className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0 border border-blue-200">
                            #
                          </span>
                          <span>{receipt.receiptNumber.replace(/^#\s*/, '')}</span>
                        </div>
                      </td>

                      {/* Sana */}
                      <td className="py-3 px-4 text-stone-600">
                        {receipt.date}
                      </td>

                      {/* Yetkazib beruvchi (Blue bold link) */}
                      <td className="py-3 px-4">
                        <span 
                          onClick={() => setActiveDetailReceipt(receipt)}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {receipt.supplierName}
                        </span>
                      </td>

                      {/* Summa with currency label */}
                      <td className="py-3 px-4 text-right font-medium text-stone-900">
                        <span>{formattedSum}</span>
                      </td>

                      {/* Holat with Green pill and Pencil icon matching Image 1 */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const nextStatus = receipt.status === 'Qabul qilindi' ? 'To\'langan' : 'Qabul qilindi';
                            handleUpdateStatus(receipt.id, nextStatus);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#37B24D] hover:bg-emerald-600 text-white font-bold text-[11px] shadow-2xs transition active:scale-95 cursor-pointer"
                          title="Holatni o'zgartirish"
                        >
                          <span>{receipt.status || 'Qabul qilindi'}</span>
                          <Pencil className="w-3 h-3 text-white/90" />
                        </button>
                      </td>

                      {/* Mas'uliyatli */}
                      <td className="py-3 px-4 text-stone-700">
                        {receipt.responsiblePerson || "G'iyosiddin To'xtayev (OPERATSION BO'LIM)"}
                      </td>

                      {/* Yaratilgan */}
                      <td className="py-3 px-4 text-stone-700">
                        {receipt.creatorPerson || "Muhammadjon Xudoyberganov (OPERATSION BO'LIM)"}
                      </td>

                      {/* Row Action Menu */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveDetailReceipt(receipt)}
                          className="text-stone-400 hover:text-stone-700 p-1 rounded hover:bg-stone-100 transition cursor-pointer"
                          title="Batafsil ko'rish"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Summary Footer Row matching Image 1 grey totals block */}
            <tfoot>
              <tr className="bg-stone-100 border-t-2 border-stone-200 text-xs">
                <td className="py-2.5 px-3"></td>
                <td className="py-2.5 px-4"></td>
                <td className="py-2.5 px-4"></td>
                <td className="py-2.5 px-4"></td>
                <td className="py-2.5 px-4 text-right">
                  <div className="font-black text-stone-900 leading-tight">
                    <div>{totals.totalUZS.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} <span className="text-[10px] text-stone-500 font-bold">UZS</span></div>
                    <div className="text-stone-800">{totals.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} <span className="text-[10px] text-stone-500 font-bold">AQSh dollari</span></div>
                  </div>
                </td>
                <td className="py-2.5 px-4"></td>
                <td className="py-2.5 px-4"></td>
                <td className="py-2.5 px-4"></td>
                <td className="py-2.5 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination bar matching Image 1 */}
        <div className="px-5 py-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600 bg-white">
          <div className="font-semibold text-stone-700">
            Jami: <span className="font-bold text-stone-900">{filteredReceipts.length}</span>
          </div>

          <div className="flex items-center gap-1">
            <button className="px-2 py-1 rounded text-stone-300 font-bold cursor-not-allowed">
              «
            </button>
            <button className="px-2 py-1 rounded text-stone-300 font-bold cursor-not-allowed">
              &lt;
            </button>
            <button className="w-7 h-7 rounded bg-blue-600 text-white font-bold flex items-center justify-center">
              1
            </button>
            <button className="px-2 py-1 rounded text-stone-300 font-bold cursor-not-allowed">
              &gt;
            </button>
            <button className="px-2 py-1 rounded text-stone-300 font-bold cursor-not-allowed">
              »
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <select className="border border-stone-300 rounded px-2 py-1 bg-white text-stone-700 text-xs focus:outline-hidden cursor-pointer">
              <option value="100">100 / sahifa</option>
              <option value="50">50 / sahifa</option>
              <option value="20">20 / sahifa</option>
            </select>
          </div>
        </div>
      </div>

      {/* New Xarid Creation Modal / Drawer */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900">
                    Yangi Xarid Rasmiylashtirish
                  </h3>
                  <p className="text-xs text-stone-500">Omborga yangi tovar kirimini qo'shish</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveReceipt} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Raqam */}
                <div>
                  <label className="block text-stone-600 font-bold mb-1">
                    Hujjat Raqami
                  </label>
                  <input
                    type="text"
                    value={receiptNumberInput}
                    onChange={e => setReceiptNumberInput(e.target.value)}
                    placeholder={`# ${5595 + allReceipts.length}`}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-bold focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Sana */}
                <div>
                  <label className="block text-stone-600 font-bold mb-1">
                    Sana
                  </label>
                  <input
                    type="text"
                    value={receiptDate}
                    onChange={e => setReceiptDate(e.target.value)}
                    placeholder="2026-yil 17-sentabr"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Yetkazib beruvchi */}
                <div className="sm:col-span-2">
                  <label className="block text-stone-600 font-bold mb-1">
                    Yetkazib beruvchi
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={e => setSupplierName(e.target.value)}
                    placeholder="Masalan: (№ 233) ELYOR (ABDULAZIZ)"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    required
                  />
                </div>

                {/* Ombor */}
                <div>
                  <label className="block text-stone-600 font-bold mb-1">
                    Ombor
                  </label>
                  <select
                    value={receiptWarehouse}
                    onChange={e => setReceiptWarehouse(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-bold focus:ring-1 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="KO'CHA">KO'CHA</option>
                    <option value="ASOSIY OMBOR">ASOSIY OMBOR</option>
                  </select>
                </div>

                {/* Mas'uliyatli */}
                <div>
                  <label className="block text-stone-600 font-bold mb-1">
                    Mas'uliyatli xodim
                  </label>
                  <input
                    type="text"
                    value={receiptResponsible}
                    onChange={e => setReceiptResponsible(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Tovar ma'lumotlari */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <h4 className="font-bold text-xs text-stone-800 flex items-center justify-between">
                  <span>Qabul qilinayotgan mahsulot</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setManualCurrency('USD')}
                      className={`px-2 py-0.5 rounded font-bold text-[11px] ${manualCurrency === 'USD' ? 'bg-blue-600 text-white' : 'bg-stone-200 text-stone-600'}`}
                    >
                      USD ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualCurrency('UZS')}
                      className={`px-2 py-0.5 rounded font-bold text-[11px] ${manualCurrency === 'UZS' ? 'bg-blue-600 text-white' : 'bg-stone-200 text-stone-600'}`}
                    >
                      UZS (so'm)
                    </button>
                  </div>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-stone-500 text-[11px] font-semibold mb-1">Mahsulot nomi</label>
                    <input
                      type="text"
                      value={customItemName}
                      onChange={e => setCustomItemName(e.target.value)}
                      placeholder='Masalan: PROFIL "TOSHKENT" J (0,45) (60×24)'
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-stone-900 text-xs font-semibold focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-stone-500 text-[11px] font-semibold mb-1">O'lchov birligi</label>
                    <input
                      type="text"
                      value={itemUnit}
                      onChange={e => setItemUnit(e.target.value)}
                      placeholder="yugurish metri / dona"
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-stone-900 text-xs focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-500 text-[11px] font-semibold mb-1">Miqdori</label>
                    <input
                      type="number"
                      step="any"
                      value={quantity}
                      onChange={e => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-stone-900 text-xs font-bold focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-stone-500 text-[11px] font-semibold mb-1">
                      Birlik Narxi ({manualCurrency})
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={costPrice}
                      onChange={e => setCostPrice(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-stone-900 text-xs font-bold focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-stone-500 text-[11px] font-semibold mb-1">Jami Summa</label>
                    <div className="px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-lg text-stone-900 text-xs font-black">
                      {(costPrice * quantity).toLocaleString()} {manualCurrency}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-stone-600 font-bold mb-1">
                  Izoh yoki chek ma'lumotlari
                </label>
                <input
                  type="text"
                  value={receiptNotes}
                  onChange={e => setReceiptNotes(e.target.value)}
                  placeholder="Qo'shimcha tafsilotlar..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1877F2] hover:bg-blue-700 text-white font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  Xaridni Saqlash
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Xarid Detail Modal (Image 2) */}
      <ReceiptDetailModal
        receipt={activeDetailReceipt}
        isOpen={!!activeDetailReceipt}
        onClose={() => setActiveDetailReceipt(null)}
        onStatusChange={handleUpdateStatus}
      />

      {/* AI Receipt & Document Scanner Modal */}
      <AiReceiptExtractorModal
        isOpen={showAiReceiptModal}
        onClose={() => setShowAiReceiptModal(false)}
        onApplyToReceipt={handleApplyAiReceipt}
      />

    </div>
  );
};
