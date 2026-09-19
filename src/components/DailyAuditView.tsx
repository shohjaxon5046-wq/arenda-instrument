import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  ClipboardList, 
  ArrowDownToLine, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  RefreshCw, 
  Layers, 
  FileText, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Building,
  CreditCard,
  Banknote,
  Wrench,
  User
} from 'lucide-react';
import { useRental } from '../context/RentalContext';
import { AsyncToolImage } from './AsyncToolImage';
import { Tool, RentalOrder, StockReceipt } from '../types';
import { 
  formatMoney, 
  formatDate, 
  formatDateWithWeekday, 
  getTodayDateString, 
  shiftDate, 
  getYesterdayDateString 
} from '../utils/formatters';

interface DailyAuditViewProps {
  onPrintReceipt?: (order: RentalOrder) => void;
  onOpenNewOrder?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

type TabMode = 'overview' | 'ostatka' | 'zakazlar' | 'prixodlar';

export const DailyAuditView: React.FC<DailyAuditViewProps> = ({
  onPrintReceipt,
  onOpenNewOrder,
  onNavigateToTab
}) => {
  const { tools, orders, receipts, repairs, clients, sellers } = useRental();

  // Selected date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [activeTab, setActiveTab] = useState<TabMode>('overview');

  // Search & Filters for tabs
  const [toolSearch, setToolSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyMovedTools, setOnlyMovedTools] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [receiptSearch, setReceiptSearch] = useState('');

  // Quick Date Helpers
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();
  const twoDaysAgoStr = shiftDate(todayStr, -2);
  const threeDaysAgoStr = shiftDate(todayStr, -3);

  const isSelectedToday = selectedDate === todayStr;
  const isSelectedYesterday = selectedDate === yesterdayStr;

  // Handle stepping prev / next day
  const handlePrevDay = () => {
    setSelectedDate(prev => shiftDate(prev, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => shiftDate(prev, 1));
  };

  /* =========================================================================
   * 1. ZAKAZLAR (ORDERS ON THE SELECTED DAY)
   * ========================================================================= */
  // Orders created/started on this date
  const ordersStarted = useMemo(() => {
    return orders.filter(o => o.startDate === selectedDate);
  }, [orders, selectedDate]);

  // Orders returned on this date
  const ordersReturned = useMemo(() => {
    return orders.filter(o => 
      o.actualReturnDate === selectedDate || 
      (o.status === 'returned' && o.expectedReturnDate === selectedDate)
    );
  }, [orders, selectedDate]);

  // Orders active during this date (rented out on this specific day)
  const ordersActiveOnDate = useMemo(() => {
    return orders.filter(o => {
      const startsBeforeOrOn = o.startDate <= selectedDate;
      const endsAfterOrOn = !o.actualReturnDate ? true : o.actualReturnDate >= selectedDate;
      return startsBeforeOrOn && endsAfterOrOn;
    });
  }, [orders, selectedDate]);

  // Total cash & financial flow on this date
  const dayFinancials = useMemo(() => {
    // Initial payments collected on start date
    const paidOnStart = ordersStarted.reduce((sum, o) => sum + (Number(o.paidAmount) || 0), 0);
    // Total rental value created today
    const totalOrderValue = ordersStarted.reduce((sum, o) => sum + (Number(o.totalRentAmount) || 0), 0);
    // Discounts given today
    const discountsGiven = ordersStarted.reduce((sum, o) => sum + (Number(o.discountAmount) || 0), 0);

    // Payment methods breakdown for today's started orders
    let cash = 0;
    let card = 0;
    let transfer = 0;

    ordersStarted.forEach(o => {
      const amt = Number(o.paidAmount) || 0;
      if (o.paymentMethod === 'card') card += amt;
      else if (o.paymentMethod === 'transfer') transfer += amt;
      else cash += amt;
    });

    return {
      paidOnStart,
      totalOrderValue,
      discountsGiven,
      cash,
      card,
      transfer
    };
  }, [ordersStarted]);

  /* =========================================================================
   * 2. PRIXODLAR (STOCK RECEIPTS ON THE SELECTED DAY)
   * ========================================================================= */
  const receiptsOnDate = useMemo(() => {
    return receipts.filter(r => 
      r.date === selectedDate || 
      (r.createdAt && r.createdAt.startsWith(selectedDate))
    );
  }, [receipts, selectedDate]);

  const receiptsSummary = useMemo(() => {
    let totalItems = 0;
    let totalCost = 0;
    receiptsOnDate.forEach(r => {
      totalCost += Number(r.totalCost) || 0;
      r.items.forEach(item => {
        totalItems += Number(item.quantity) || 0;
      });
    });
    return {
      count: receiptsOnDate.length,
      totalItems,
      totalCost
    };
  }, [receiptsOnDate]);

  /* =========================================================================
   * 3. TAVAR OSTATKASI (STOCK INVENTORY ON THE SELECTED DAY)
   * ========================================================================= */
  const toolDailyStats = useMemo(() => {
    // Rented quantities map on selected date
    const rentedOnDateMap: Record<string, number> = {};
    ordersActiveOnDate.forEach(o => {
      o.items.forEach(item => {
        rentedOnDateMap[item.toolId] = (rentedOnDateMap[item.toolId] || 0) + (Number(item.quantity) || 1);
      });
    });

    // In repair quantities map on selected date
    const repairOnDateMap: Record<string, number> = {};
    repairs.forEach(rep => {
      const startsBefore = rep.sentDate <= selectedDate;
      const endsAfter = !rep.completedDate ? true : rep.completedDate >= selectedDate;
      if (startsBefore && endsAfter) {
        repairOnDateMap[rep.toolId] = (repairOnDateMap[rep.toolId] || 0) + (Number(rep.quantity) || 1);
      }
    });

    // Prixod (arrivals) on selected date
    const prixodOnDateMap: Record<string, number> = {};
    receiptsOnDate.forEach(r => {
      r.items.forEach(item => {
        prixodOnDateMap[item.toolId] = (prixodOnDateMap[item.toolId] || 0) + (Number(item.quantity) || 0);
      });
    });

    // Orders started on selected date (outgoing)
    const rentedOutTodayMap: Record<string, number> = {};
    ordersStarted.forEach(o => {
      o.items.forEach(item => {
        rentedOutTodayMap[item.toolId] = (rentedOutTodayMap[item.toolId] || 0) + (Number(item.quantity) || 1);
      });
    });

    // Orders returned on selected date (incoming back)
    const returnedTodayMap: Record<string, number> = {};
    ordersReturned.forEach(o => {
      o.items.forEach(item => {
        returnedTodayMap[item.toolId] = (returnedTodayMap[item.toolId] || 0) + (Number(item.quantity) || 1);
      });
    });

    // Build stats for each tool
    return tools.map(tool => {
      const rentedCount = rentedOnDateMap[tool.id] || 0;
      const repairCount = repairOnDateMap[tool.id] || 0;
      const prixodCount = prixodOnDateMap[tool.id] || 0;
      const rentedOutCount = rentedOutTodayMap[tool.id] || 0;
      const returnedCount = returnedTodayMap[tool.id] || 0;

      // Available stock in warehouse on selected date
      // TotalStock minus rented and in-repair
      const totalUnits = tool.totalStock || 0;
      const availableCount = Math.max(0, totalUnits - rentedCount - repairCount);

      const hasMovement = prixodCount > 0 || rentedOutCount > 0 || returnedCount > 0;

      return {
        tool,
        totalUnits,
        rentedCount,
        repairCount,
        availableCount,
        prixodCount,
        rentedOutCount,
        returnedCount,
        hasMovement,
        stockValue: availableCount * tool.dailyPrice
      };
    });
  }, [tools, ordersActiveOnDate, repairs, receiptsOnDate, ordersStarted, ordersReturned, selectedDate]);

  // Overall Inventory Aggregates for the day
  const inventoryDayTotals = useMemo(() => {
    let totalStock = 0;
    let totalAvailable = 0;
    let totalRented = 0;
    let totalRepair = 0;
    let totalAvailableValue = 0;

    toolDailyStats.forEach(stat => {
      totalStock += stat.totalUnits;
      totalAvailable += stat.availableCount;
      totalRented += stat.rentedCount;
      totalRepair += stat.repairCount;
      totalAvailableValue += stat.stockValue;
    });

    return {
      totalStock,
      totalAvailable,
      totalRented,
      totalRepair,
      totalAvailableValue
    };
  }, [toolDailyStats]);

  // Filtered tools in Ostatka tab
  const filteredToolsStats = useMemo(() => {
    return toolDailyStats.filter(item => {
      const matchesSearch = !toolSearch.trim() || 
        item.tool.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
        item.tool.article.toLowerCase().includes(toolSearch.toLowerCase()) ||
        item.tool.code.toLowerCase().includes(toolSearch.toLowerCase());

      const matchesCat = categoryFilter === 'all' || item.tool.category === categoryFilter;
      const matchesMovement = !onlyMovedTools || item.hasMovement;

      return matchesSearch && matchesCat && matchesMovement;
    });
  }, [toolDailyStats, toolSearch, categoryFilter, onlyMovedTools]);

  // Filtered orders in Zakazlar tab
  const filteredOrders = useMemo(() => {
    return ordersStarted.filter(o => {
      if (!orderSearch.trim()) return true;
      const query = orderSearch.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(query) ||
        o.client.fullName.toLowerCase().includes(query) ||
        o.client.phone.includes(query) ||
        o.items.some(i => i.toolName.toLowerCase().includes(query))
      );
    });
  }, [ordersStarted, orderSearch]);

  // Filtered receipts in Prixodlar tab
  const filteredReceipts = useMemo(() => {
    return receiptsOnDate.filter(r => {
      if (!receiptSearch.trim()) return true;
      const query = receiptSearch.toLowerCase();
      return (
        r.receiptNumber.toLowerCase().includes(query) ||
        r.supplierName.toLowerCase().includes(query) ||
        r.items.some(i => i.toolName.toLowerCase().includes(query) || i.article.toLowerCase().includes(query))
      );
    });
  }, [receiptsOnDate, receiptSearch]);

  // Export Daily Audit to CSV
  const handleExportCSV = () => {
    const headers = [
      'Artikul',
      'Kod',
      'Tovar Nomi',
      'Kategoriya',
      'Jami Soni',
      'Omborda Qoldiq',
      'Ijarada (Arendada)',
      'Ta\'mirda',
      'Shu kun Kirim',
      'Shu kun Berildi',
      'Shu kun Qaytdi',
      'Kunlik Narxi (so\'m)'
    ];

    const rows = toolDailyStats.map(stat => [
      `"${stat.tool.article}"`,
      `"${stat.tool.code}"`,
      `"${stat.tool.name}"`,
      `"${stat.tool.category}"`,
      stat.totalUnits,
      stat.availableCount,
      stat.rentedCount,
      stat.repairCount,
      stat.prixodCount,
      stat.rentedOutCount,
      stat.returnedCount,
      stat.tool.dailyPrice
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      `KUNLIK HISOBOT VA OMBOR QOLDIG‘I (${selectedDate})\n` +
      `Sana: ${formatDateWithWeekday(selectedDate)}\n` +
      `Kassa tushumi: ${dayFinancials.paidOnStart} so'm; Yangi buyurtmalar: ${ordersStarted.length} ta; Kirimlar: ${receiptsOnDate.length} ta\n\n` +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kunlik_qoldiq_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Daily Audit Sheet
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Date Picker Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <CalendarDays className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Kunlik hisobot & Ombor qoldig‘i
                </h1>
                {isSelectedToday ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Bugungi kun
                  </span>
                ) : isSelectedYesterday ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Kechagi kun (1 kun oldin)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    O'tgan kun arxivi
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tanlangan sanadagi ombor qoldiqlari, rasmiylashtirilgan buyurtmalar va tovar kirimlari
              </p>
            </div>
          </div>

          {/* Action buttons (Print & Excel) */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
              title="Kunlik varaqani chop etish"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Chop etish</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 transition"
              title="Excel (CSV) formatida yuklab olish"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Excelga eksport</span>
            </button>

            {onOpenNewOrder && (
              <button
                onClick={onOpenNewOrder}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition active:scale-98"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                <span>+ Yangi buyurtma</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Date Filter Navigation */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Prev / Next & Native Date input */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={handlePrevDay}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition shadow-2xs"
              title="1 kun oldinga o‘tish"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Oldingi kun</span>
            </button>

            <div className="flex items-center gap-2 px-2">
              <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <button
              onClick={handleNextDay}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition shadow-2xs"
              title="1 kun keyinga o‘tish"
            >
              <span className="hidden sm:inline">Keyingi kun</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                isSelectedToday 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bugun
            </button>

            <button
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                isSelectedYesterday 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Kecha (-1 kun)
            </button>

            <button
              onClick={() => setSelectedDate(twoDaysAgoStr)}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                selectedDate === twoDaysAgoStr 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              2 kun oldin
            </button>

            <button
              onClick={() => setSelectedDate(threeDaysAgoStr)}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                selectedDate === threeDaysAgoStr 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              3 kun oldin
            </button>
          </div>

        </div>

        {/* Selected date display text */}
        <div className="mt-3 text-xs font-semibold text-slate-700 flex items-center gap-2">
          <span className="text-slate-400">Tanlangan sana ko‘rsatkichi:</span>
          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            {formatDateWithWeekday(selectedDate)}
          </span>
        </div>

      </div>

      {/* Primary KPI Summary Cards for the Selected Day */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Tovar Ostatkasi (Mavjud bo'sh) */}
        <div 
          onClick={() => setActiveTab('ostatka')}
          className={`bg-white p-4 sm:p-5 rounded-2xl border transition cursor-pointer shadow-xs hover:border-blue-400 ${
            activeTab === 'ostatka' ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ombor qoldig‘i</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">
              {inventoryDayTotals.totalAvailable}
            </span>
            <span className="text-xs text-slate-400">/ {inventoryDayTotals.totalStock} dona</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Ijarada: <strong className="text-blue-600">{inventoryDayTotals.totalRented}</strong></span>
            <span>Remontda: <strong className="text-amber-600">{inventoryDayTotals.totalRepair}</strong></span>
          </div>
        </div>

        {/* Shu kundagi Zakazlar */}
        <div 
          onClick={() => setActiveTab('zakazlar')}
          className={`bg-white p-4 sm:p-5 rounded-2xl border transition cursor-pointer shadow-xs hover:border-blue-400 ${
            activeTab === 'zakazlar' ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Shu kungi buyurtmalar</span>
            <ClipboardList className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {ordersStarted.length}
            </span>
            <span className="text-xs text-slate-400">ta yangi shartnoma</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Qaytarildi: <strong className="text-emerald-600">{ordersReturned.length} ta</strong></span>
            <span>Aktiv ijarada: <strong className="text-blue-600">{ordersActiveOnDate.length} ta</strong></span>
          </div>
        </div>

        {/* Shu kundagi Prixodlar */}
        <div 
          onClick={() => setActiveTab('prixodlar')}
          className={`bg-white p-4 sm:p-5 rounded-2xl border transition cursor-pointer shadow-xs hover:border-blue-400 ${
            activeTab === 'prixodlar' ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Shu kungi kirimlar</span>
            <ArrowDownToLine className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600">
              {receiptsSummary.totalItems}
            </span>
            <span className="text-xs text-slate-400">dona keldi</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 truncate">
            <span>Partiyalar: <strong>{receiptsSummary.count} ta</strong></span>
            <span className="text-indigo-600 font-bold">{formatMoney(receiptsSummary.totalCost)}</span>
          </div>
        </div>

        {/* Shu kundagi Kassa tushumi */}
        <div 
          onClick={() => setActiveTab('zakazlar')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-blue-400 transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Shu Kungi Kassa Tushumi</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 truncate">
            {formatMoney(dayFinancials.paidOnStart)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500 truncate">
            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
              Naqd: {formatMoney(dayFinancials.cash)}
            </span>
            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">
              Karta: {formatMoney(dayFinancials.card)}
            </span>
          </div>
        </div>

      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Umumiy Svodka</span>
        </button>

        <button
          onClick={() => setActiveTab('ostatka')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'ostatka'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Ombor qoldig‘i</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'ostatka' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {tools.length} xil
          </span>
        </button>

        <button
          onClick={() => setActiveTab('zakazlar')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'zakazlar'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Buyurtmalar ({ordersStarted.length})</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'zakazlar' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {ordersStarted.length} ta
          </span>
        </button>

        <button
          onClick={() => setActiveTab('prixodlar')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'prixodlar'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>Kirimlar ({receiptsOnDate.length})</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'prixodlar' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {receiptsOnDate.length} ta
          </span>
        </button>
      </div>

      {/* =====================================================================
       * TAB CONTENT 1: OVERVIEW (UMUMIY SVODKA)
       * ===================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Day Summary Alert Card */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-blue-300 font-bold uppercase tracking-wider">
                  {formatDateWithWeekday(selectedDate)} holatiga ko'ra
                </span>
                <h3 className="text-xl sm:text-2xl font-black mt-1">
                  Kunlik Operatsion Ko'rsatkichlar Svodkasi
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Ushbu kunda jami <strong>{ordersStarted.length} ta</strong> zakaz rasmiylashtirildi, 
                  <strong> {receiptsSummary.totalItems} dona</strong> yangi tovar prixod qilindi. 
                  Kun oxiriga omborda <strong>{inventoryDayTotals.totalAvailable} dona</strong> tovar erkin ostatkada mavjud.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('ostatka')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition"
                >
                  Ostatkani ko‘rish →
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar inside Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Kassa tushumi</span>
                <span className="text-lg font-black text-emerald-400">{formatMoney(dayFinancials.paidOnStart)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Ijara aylanmasi</span>
                <span className="text-lg font-black text-white">{formatMoney(dayFinancials.totalOrderValue)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Ombordagi Ostatka</span>
                <span className="text-lg font-black text-blue-400">{inventoryDayTotals.totalAvailable} dona</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Prixod xarajati</span>
                <span className="text-lg font-black text-indigo-400">{formatMoney(receiptsSummary.totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Side by side: Recent Orders and Prixods for that day */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Day's Orders */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-sm text-slate-900">
                    Shu kundagi Zakazlar ({ordersStarted.length} ta)
                  </h4>
                </div>
                <button
                  onClick={() => setActiveTab('zakazlar')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                >
                  Barchasini ko'rish →
                </button>
              </div>

              {ordersStarted.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                  <ClipboardList className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Ushbu kunda birorta ham yangi zakaz bo'lmagan</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Boshqa sanani tanlab ko'ring yoki yangi zakaz oching</p>
                </div>
              ) : (
                <div className="space-y-2.5 flex-1">
                  {ordersStarted.slice(0, 5).map(order => (
                    <div key={order.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-blue-600">{order.orderNumber}</span>
                          <span className="font-bold text-slate-800">{order.client.fullName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {order.items.map(i => `${i.toolName} (${i.quantity}x)`).join(', ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">{formatMoney(order.paidAmount)}</span>
                        <span className="text-[10px] text-slate-400">
                          {order.paymentMethod === 'card' ? 'Karta' : order.paymentMethod === 'transfer' ? 'Perevod' : 'Naqd'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Day's Stock Receipts (Prixod) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ArrowDownToLine className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-900">
                    Shu kundagi Prixodlar ({receiptsOnDate.length} ta)
                  </h4>
                </div>
                <button
                  onClick={() => setActiveTab('prixodlar')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold"
                >
                  Barchasini ko'rish →
                </button>
              </div>

              {receiptsOnDate.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                  <ArrowDownToLine className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Ushbu kunda tovar kirimi (prixod) amalga oshirilmagan</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Prixod bo'limidan tovarlar qabul qilish mumkin</p>
                </div>
              ) : (
                <div className="space-y-2.5 flex-1">
                  {receiptsOnDate.slice(0, 5).map(receipt => (
                    <div key={receipt.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-indigo-600">{receipt.receiptNumber}</span>
                          <span className="font-bold text-slate-800">{receipt.supplierName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {receipt.items.map(i => `${i.toolName} (${i.quantity} dona)`).join(', ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">{formatMoney(receipt.totalCost)}</span>
                        <span className="text-[10px] text-emerald-600 font-medium">Kirim qilingan</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Ostatka Preview Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {formatDate(selectedDate)} kunidagi Tovar Ostatkasi (Qoldiqlar ro‘yxati)
                </h4>
                <p className="text-xs text-slate-500">
                  Jami {tools.length} ta asbob-uskuna modeli bo'yicha to'liq ombor qoldig'i
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('ostatka')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <span>Tovar Ostatkasini Ko‘rish</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* =====================================================================
       * TAB CONTENT 2: TAVAR OSTATKASI (STOCK BALANCE ON SELECTED DAY)
       * ===================================================================== */}
      {activeTab === 'ostatka' && (
        <div className="space-y-4">
          
          {/* Filters Bar for Ostatka */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={toolSearch}
                onChange={e => setToolSearch(e.target.value)}
                placeholder="Artikul yoki tovar nomi qidirish..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden text-slate-900"
              />
            </div>

            {/* Category Filter & Checkbox */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
              >
                <option value="all">Barcha kategoriyalar</option>
                <option value="Elektroinstrument">Elektroinstrument</option>
                <option value="Benzinli & Generator">Benzinli & Generator</option>
                <option value="Payvandlash & Metall">Payvandlash & Metall</option>
                <option value="Beton & Qurilish">Beton & Qurilish</option>
                <option value="Bog‘ & Tozalash">Bog‘ & Tozalash</option>
                <option value="Narvon & Havoza">Narvon & Havoza</option>
                <option value="O‘lchov & Lazer">O‘lchov & Lazer</option>
              </select>

              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={onlyMovedTools}
                  onChange={e => setOnlyMovedTools(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Faqat shu kuni harakatlanganlar</span>
              </label>
            </div>

          </div>

          {/* Ostatka Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-4 py-3.5">Artikul / Kod</th>
                    <th className="px-4 py-3.5">Tovar Nomi & Toifasi</th>
                    <th className="px-3 py-3.5 text-center bg-indigo-50/50 text-indigo-900" title="Shu kunda kelgan prixod">
                      Shu kun Prixod
                    </th>
                    <th className="px-3 py-3.5 text-center bg-blue-50/50 text-blue-900" title="Shu kunda ijaraga berilgan">
                      Shu kun Berildi
                    </th>
                    <th className="px-3 py-3.5 text-center bg-emerald-50/50 text-emerald-900" title="Shu kunda qaytib tushgan">
                      Shu kun Qaytdi
                    </th>
                    <th className="px-3 py-3.5 text-center text-blue-700 font-black">
                      Ijarada
                    </th>
                    <th className="px-3 py-3.5 text-center text-amber-700 font-bold">
                      Ta'mirda
                    </th>
                    <th className="px-4 py-3.5 text-center bg-emerald-50 text-emerald-900 font-black text-xs">
                      Omborda Qoldiq (Ostatka)
                    </th>
                    <th className="px-3 py-3.5 text-center">Jami soni</th>
                    <th className="px-4 py-3.5 text-right">Kunlik Narxi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredToolsStats.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700">Qidiruv bo'yicha tovarlar topilmadi</p>
                      </td>
                    </tr>
                  ) : (
                    filteredToolsStats.map(({ 
                      tool, 
                      totalUnits, 
                      rentedCount, 
                      repairCount, 
                      availableCount, 
                      prixodCount, 
                      rentedOutCount, 
                      returnedCount 
                    }) => (
                      <tr key={tool.id} className="hover:bg-slate-50/80 transition">
                        
                        {/* Artikul & Code */}
                        <td className="px-4 py-3">
                          <span className="font-black text-blue-700 block font-mono">{tool.article}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{tool.code}</span>
                        </td>

                        {/* Name & Category */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <AsyncToolImage 
                              toolName={tool.name} 
                              originalUrl={tool.imageUrl} 
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" 
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{tool.name}</span>
                              <span className="text-[10px] text-slate-500">{tool.category}</span>
                            </div>
                          </div>
                        </td>

                        {/* Movements on this day */}
                        <td className="px-3 py-3 text-center bg-indigo-50/30">
                          {prixodCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800">
                              +{prixodCount}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-center bg-blue-50/30">
                          {rentedOutCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                              -{rentedOutCount}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-center bg-emerald-50/30">
                          {returnedCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                              +{returnedCount}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Rented on this day */}
                        <td className="px-3 py-3 text-center">
                          {rentedCount > 0 ? (
                            <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                              {rentedCount} dona
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        {/* In repair on this day */}
                        <td className="px-3 py-3 text-center">
                          {repairCount > 0 ? (
                            <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                              {repairCount} dona
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        {/* AVAILABLE OSTATKA ON THIS DAY */}
                        <td className="px-4 py-3 text-center bg-emerald-50/50">
                          <span className={`inline-flex items-center gap-1 font-black text-sm px-2.5 py-1 rounded-lg ${
                            availableCount > 0 
                              ? 'bg-emerald-600 text-white shadow-xs' 
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            {availableCount > 0 && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {availableCount} dona
                          </span>
                        </td>

                        {/* Total Units */}
                        <td className="px-3 py-3 text-center font-bold text-slate-700">
                          {totalUnits}
                        </td>

                        {/* Daily Rental Price */}
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatMoney(tool.dailyPrice)}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom summary bar of the table */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
              <span className="font-medium">
                Jami ko'rsatilgan tovarlar: <strong>{filteredToolsStats.length} ta</strong>
              </span>
              <div className="flex items-center gap-4 font-bold">
                <span>Ombordagi qoldiq: <strong className="text-emerald-700">{inventoryDayTotals.totalAvailable} dona</strong></span>
                <span>Ijarada: <strong className="text-blue-700">{inventoryDayTotals.totalRented} dona</strong></span>
                <span>Jami park: <strong className="text-slate-900">{inventoryDayTotals.totalStock} dona</strong></span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* =====================================================================
       * TAB CONTENT 3: ZAKAZLAR (ORDERS ON SELECTED DAY)
       * ===================================================================== */}
      {activeTab === 'zakazlar' && (
        <div className="space-y-4">
          
          {/* Header & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {formatDate(selectedDate)} sanasida rasmiylashtirilgan zakazlar
              </h3>
              <p className="text-xs text-slate-500">
                Shu kunda boshlangan yangi arenda shartnomalari ro‘yxati
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                placeholder="Mijoz ismi, telefon yoki zakaz raqami..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden text-slate-900"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-4 py-3.5">Zakaz №</th>
                    <th className="px-4 py-3.5">Mijoz (F.I.Sh & Tel)</th>
                    <th className="px-4 py-3.5">Olingan Asboblar</th>
                    <th className="px-4 py-3.5">Muddat</th>
                    <th className="px-4 py-3.5">Kassa Tushumi</th>
                    <th className="px-4 py-3.5">To‘lov Turi</th>
                    <th className="px-4 py-3.5">Sotuvchi</th>
                    <th className="px-4 py-3.5">Holati</th>
                    <th className="px-4 py-3.5 text-right">Chek</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700">
                          {selectedDate === todayStr 
                            ? "Bugun hali yangi zakaz ochilmagan" 
                            : `${formatDate(selectedDate)} sanasida birorta ham zakaz ochilmagan`}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Boshqa sanani tanlab ko'ring yoki yangi zakaz oching</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => {
                      const seller = sellers.find(s => s.id === order.sellerId);
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition">
                          
                          {/* Order Number */}
                          <td className="px-4 py-3 font-black text-blue-600 font-mono">
                            {order.orderNumber}
                          </td>

                          {/* Client */}
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 block">{order.client.fullName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{order.client.phone}</span>
                          </td>

                          {/* Items */}
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="text-slate-800 font-medium text-[11px]">
                                  • {item.toolName} <span className="text-blue-600 font-bold font-mono">({item.quantity}x)</span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Period */}
                          <td className="px-4 py-3">
                            <span className="text-slate-800 block">{formatDate(order.startDate)}</span>
                            <span className="text-[10px] text-slate-400 block">→ {formatDate(order.expectedReturnDate)} ({order.totalDays} kun)</span>
                          </td>

                          {/* Paid Amount */}
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {formatMoney(order.paidAmount)}
                            {order.remainingAmount > 0 && (
                              <span className="text-[10px] text-rose-600 block">
                                Qarz: {formatMoney(order.remainingAmount)}
                              </span>
                            )}
                          </td>

                          {/* Payment method */}
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {order.paymentMethod === 'card' ? 'Karta' : order.paymentMethod === 'transfer' ? 'Perevod' : 'Naqd'}
                            </span>
                          </td>

                          {/* Seller */}
                          <td className="px-4 py-3">
                            <span className="text-slate-700 font-medium block">{seller ? seller.fullName : 'Kassir'}</span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            {order.status === 'returned' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Qaytarilgan
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Faol ijara
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3 text-right">
                            {onPrintReceipt && (
                              <button
                                onClick={() => onPrintReceipt(order)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition"
                                title="Chekni chop etish"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            )}
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom summary bar */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
              <span>Shu kunda ochilgan zakazlar: <strong>{filteredOrders.length} ta</strong></span>
              <span>Jami kassa tushumi: <strong className="text-emerald-600 font-black">{formatMoney(dayFinancials.paidOnStart)}</strong></span>
            </div>
          </div>

        </div>
      )}

      {/* =====================================================================
       * TAB CONTENT 4: PRIXODLAR (STOCK RECEIPTS ON SELECTED DAY)
       * ===================================================================== */}
      {activeTab === 'prixodlar' && (
        <div className="space-y-4">
          
          {/* Header & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {formatDate(selectedDate)} sanasidagi Prixodlar (Tovar kirimlari)
              </h3>
              <p className="text-xs text-slate-500">
                Shu kunda omborga qabul qilingan yangi uskunalar partiyasi
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={receiptSearch}
                onChange={e => setReceiptSearch(e.target.value)}
                placeholder="Ta'minotchi yoki tovar nomi..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden text-slate-900"
              />
            </div>
          </div>

          {/* Receipts Cards / Table */}
          {filteredReceipts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
              <ArrowDownToLine className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-800">
                {formatDate(selectedDate)} sanasida tovar prixodi kiritilmagan
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Ushbu kunda omborga yangi tovar qabul qilinmagan yoki sana boshqa kunga to'g'ri kelgan.
              </p>
              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('prixod')}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Prixod bo‘limiga o‘tish</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReceipts.map(receipt => (
                <div key={receipt.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 font-mono">
                        {receipt.receiptNumber}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          {receipt.supplierName}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Sana: {formatDate(receipt.date)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Jami kirim summasi</span>
                      <span className="text-base font-black text-slate-900">{formatMoney(receipt.totalCost)}</span>
                    </div>
                  </div>

                  {/* Items in receipt */}
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="text-[10px] uppercase font-bold text-slate-400">
                        <tr>
                          <th className="py-1.5">Tovar Nomi & Artikul</th>
                          <th className="py-1.5 text-center">Qabul qilingan soni</th>
                          <th className="py-1.5 text-right">Olingan tannarxi</th>
                          <th className="py-1.5 text-right">Kunlik arenda narxi</th>
                          <th className="py-1.5 text-right">Jami summa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {receipt.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2">
                              <span className="font-bold text-slate-800 block">{item.toolName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{item.article}</span>
                            </td>
                            <td className="py-2 text-center font-black text-indigo-600">
                              {item.quantity} dona
                            </td>
                            <td className="py-2 text-right font-mono">
                              {formatMoney(item.costPrice)}
                            </td>
                            <td className="py-2 text-right font-mono text-emerald-600 font-bold">
                              {formatMoney(item.dailyRentalPrice)}
                            </td>
                            <td className="py-2 text-right font-mono font-bold text-slate-900">
                              {formatMoney(item.costPrice * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {receipt.notes && (
                    <p className="mt-3 text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                      Izoh: {receipt.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
