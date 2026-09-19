import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Layers, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  AlertCircle, 
  CheckCircle2,
  DollarSign, 
  ArrowDownToLine, 
  Download, 
  Upload, 
  RotateCcw,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Trash2,
  Lock,
  X,
  CreditCard,
  Banknote,
  Building,
  Wrench,
  Sparkles,
  Calendar,
  Activity,
  ArrowUpRight,
  PackageCheck,
  RefreshCw,
  PieChart as PieIcon,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { motion } from 'motion/react';
import { useRental } from '../context/RentalContext';
import { useAuth } from '../context/AuthContext';
import { formatMoney, formatDate } from '../utils/formatters';
import { ToolCategory } from '../types';
import { CountUp } from './CountUp';

export const DashboardStats: React.FC = () => {
  const { tools, orders, receipts, clients, repairs, resetToDefaults, clearAllData } = useRental();
  const { currentUser, logout, changePassword } = useAuth();

  // Active sub-tab inside Dashboard: 'analytics' | 'financials' | 'system'
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'financials' | 'system'>('analytics');
  
  // Timeframe for charts: '6m' | '12m' | 'all'
  const [trendRange, setTrendRange] = useState<'6m' | '12m'>('6m');

  // Password Modal State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // -------------------------------------------------------------
  // 1. CORE INVENTORY TURNOVER METRICS (REAL-TIME)
  // -------------------------------------------------------------
  const totalToolUnits = useMemo(() => tools.reduce((sum, t) => sum + (t.totalStock || 0), 0), [tools]);
  const rentedUnits = useMemo(() => tools.reduce((sum, t) => sum + (t.rentedStock || 0), 0), [tools]);
  const availableUnits = useMemo(() => tools.reduce((sum, t) => sum + (t.availableStock || 0), 0), [tools]);
  const inRepairUnits = useMemo(() => repairs.filter(r => r.status === 'in_repair').reduce((sum, r) => sum + (r.quantity || 0), 0), [repairs]);

  // Overall Inventory Turnover Ratio (%)
  const inventoryTurnoverRate = useMemo(() => {
    if (totalToolUnits <= 0) return 0;
    return Math.min(100, Math.round((rentedUnits / totalToolUnits) * 100));
  }, [rentedUnits, totalToolUnits]);

  // Category-based Inventory Turnover data for Recharts BarChart
  const categoryTurnoverData = useMemo(() => {
    const categoryMap: Record<string, { name: string; total: number; rented: number; available: number }> = {};
    
    // Initialize standard categories
    const categories: ToolCategory[] = [
      'Elektroinstrument',
      'Benzinli & Generator',
      'Payvandlash & Metall',
      'Beton & Qurilish',
      'Bog‘ & Tozalash',
      'Narvon & Havoza',
      'O‘lchov & Lazer'
    ];

    categories.forEach(cat => {
      categoryMap[cat] = { name: cat, total: 0, rented: 0, available: 0 };
    });

    tools.forEach(tool => {
      const cat = tool.category || 'Elektroinstrument';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, total: 0, rented: 0, available: 0 };
      }
      categoryMap[cat].total += tool.totalStock || 0;
      categoryMap[cat].rented += tool.rentedStock || 0;
      categoryMap[cat].available += tool.availableStock || 0;
    });

    return Object.values(categoryMap)
      .map(item => ({
        category: item.name.length > 14 ? item.name.slice(0, 12) + '…' : item.name,
        fullCategory: item.name,
        jami: item.total,
        ijarada: item.rented,
        mavjud: item.available,
        turnoverRate: item.total > 0 ? Math.round((item.rented / item.total) * 100) : 0
      }))
      .filter(item => item.jami > 0 || tools.length === 0);
  }, [tools]);

  // Top High-Turnover Equipment List
  const topTurnoverTools = useMemo(() => {
    return [...tools]
      .sort((a, b) => {
        const rateA = a.totalStock > 0 ? a.rentedStock / a.totalStock : 0;
        const rateB = b.totalStock > 0 ? b.rentedStock / b.totalStock : 0;
        return rateB - rateA || b.rentedStock - a.rentedStock;
      })
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        name: t.name,
        article: t.article,
        category: t.category,
        total: t.totalStock,
        rented: t.rentedStock,
        rate: t.totalStock > 0 ? Math.round((t.rentedStock / t.totalStock) * 100) : 0,
        dailyPrice: t.dailyPrice
      }));
  }, [tools]);

  // -------------------------------------------------------------
  // 2. TOTAL ACTIVE RENTALS & ORDER STATUS DISTRIBUTION
  // -------------------------------------------------------------
  const activeOrders = useMemo(() => orders.filter(o => o.status === 'active'), [orders]);
  const overdueOrders = useMemo(() => orders.filter(o => o.status === 'overdue'), [orders]);
  const returnedOrders = useMemo(() => orders.filter(o => o.status === 'returned'), [orders]);

  const activeRentalsCount = activeOrders.length;
  const overdueRentalsCount = overdueOrders.length;
  const returnedRentalsCount = returnedOrders.length;
  const totalOrdersCount = orders.length;

  // Active rental daily cashflow run-rate
  const activeDailyRunRate = useMemo(() => {
    return activeOrders.reduce((acc, order) => {
      const orderDaily = order.items.reduce((iAcc, item) => iAcc + (item.dailyPrice * item.quantity), 0);
      return acc + orderDaily;
    }, 0);
  }, [activeOrders]);

  // Average rental duration in days
  const averageRentalDays = useMemo(() => {
    if (orders.length === 0) return 0;
    const totalDays = orders.reduce((sum, o) => sum + (o.totalDays || 1), 0);
    return Math.round((totalDays / orders.length) * 10) / 10;
  }, [orders]);

  // Donut chart distribution data
  const orderStatusDistribution = useMemo(() => {
    if (totalOrdersCount === 0) {
      return [
        { name: 'Faol ijara', value: 1, count: 0, color: '#10b981' },
        { name: 'Kechikkan', value: 0, count: 0, color: '#ef4444' },
        { name: 'Qaytarilgan', value: 0, count: 0, color: '#94a3b8' },
      ];
    }
    return [
      { name: 'Faol ijara', value: activeRentalsCount, count: activeRentalsCount, color: '#10b981' },
      { name: 'Kechikkan', value: overdueRentalsCount, count: overdueRentalsCount, color: '#ef4444' },
      { name: 'Qaytarilgan', value: returnedRentalsCount, count: returnedRentalsCount, color: '#64748b' },
    ].filter(item => item.value > 0);
  }, [activeRentalsCount, overdueRentalsCount, returnedRentalsCount, totalOrdersCount]);

  // -------------------------------------------------------------
  // 3. MONTHLY REVENUE & PROFIT TRENDS (RECHARTS)
  // -------------------------------------------------------------
  const monthlyRevenueData = useMemo(() => {
    const monthNamesUz = [
      'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun',
      'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'
    ];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const monthSlotsCount = trendRange === '12m' ? 12 : 6;
    const slots: Array<{
      key: string;
      label: string;
      year: number;
      monthIndex: number;
      revenue: number;
      repairCost: number;
      profit: number;
      ordersCount: number;
      cash: number;
      card: number;
      transfer: number;
    }> = [];

    // Generate chronological slots ending at current month
    for (let i = monthSlotsCount - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      const label = `${monthNamesUz[m]} ${y !== currentYear ? "'" + String(y).slice(-2) : ''}`;
      
      slots.push({
        key,
        label,
        year: y,
        monthIndex: m,
        revenue: 0,
        repairCost: 0,
        profit: 0,
        ordersCount: 0,
        cash: 0,
        card: 0,
        transfer: 0
      });
    }

    // Populate revenue from orders
    orders.forEach(order => {
      const orderDateStr = order.startDate || order.createdAt;
      if (!orderDateStr) return;
      const orderDate = new Date(orderDateStr);
      if (isNaN(orderDate.getTime())) return;

      const orderKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      const targetSlot = slots.find(s => s.key === orderKey);
      if (targetSlot) {
        targetSlot.revenue += (order.paidAmount || 0);
        targetSlot.ordersCount += 1;

        if (!order.paymentMethod || order.paymentMethod === 'cash') {
          targetSlot.cash += (order.paidAmount || 0);
        } else if (order.paymentMethod === 'card') {
          targetSlot.card += (order.paidAmount || 0);
        } else if (order.paymentMethod === 'transfer') {
          targetSlot.transfer += (order.paidAmount || 0);
        }
      }
    });

    // Populate repair costs
    repairs.forEach(repair => {
      const repairDateStr = repair.sentDate || repair.createdAt;
      if (!repairDateStr) return;
      const repairDate = new Date(repairDateStr);
      if (isNaN(repairDate.getTime())) return;

      const repairKey = `${repairDate.getFullYear()}-${String(repairDate.getMonth() + 1).padStart(2, '0')}`;
      const targetSlot = slots.find(s => s.key === repairKey);
      if (targetSlot) {
        targetSlot.repairCost += (repair.actualCost || 0);
      }
    });

    // Calculate net operating profit
    return slots.map(slot => ({
      ...slot,
      profit: Math.max(0, slot.revenue - slot.repairCost)
    }));
  }, [orders, repairs, trendRange]);

  // Overall Totals
  const totalEarnedRevenue = useMemo(() => orders.reduce((sum, o) => sum + (o.paidAmount || 0), 0), [orders]);
  const totalPendingDebt = useMemo(() => orders.reduce((sum, o) => sum + (o.remainingAmount || 0), 0), [orders]);
  const totalDiscountsGiven = useMemo(() => orders.reduce((sum, o) => sum + (o.discountAmount || 0), 0), [orders]);
  const totalInventoryPurchaseCost = useMemo(() => receipts.reduce((sum, r) => sum + (r.totalCost || 0), 0), [receipts]);
  const totalRepairCost = useMemo(() => repairs.reduce((sum, r) => sum + (r.actualCost || 0), 0), [repairs]);
  const netOperatingProfit = totalEarnedRevenue - totalRepairCost;

  // Payment Breakdown
  const cashRevenue = useMemo(() => orders.filter(o => !o.paymentMethod || o.paymentMethod === 'cash').reduce((s, o) => s + (o.paidAmount || 0), 0), [orders]);
  const cardRevenue = useMemo(() => orders.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + (o.paidAmount || 0), 0), [orders]);
  const transferRevenue = useMemo(() => orders.filter(o => o.paymentMethod === 'transfer').reduce((s, o) => s + (o.paidAmount || 0), 0), [orders]);

  // -------------------------------------------------------------
  // DECISION-MAKING INSIGHTS ENGINE
  // -------------------------------------------------------------
  const strategicInsights = useMemo(() => {
    const insights: Array<{
      type: 'positive' | 'warning' | 'opportunity';
      title: string;
      description: string;
      actionText?: string;
    }> = [];

    // Turnover health
    if (inventoryTurnoverRate >= 65) {
      insights.push({
        type: 'positive',
        title: 'Yuqori Aylanma Tezligi (Talab Yuqori)',
        description: `Asboblaringizning ${inventoryTurnoverRate}% qismi ayni damda ijarada turibdi. Eng ko'p so'ralayotgan tovarlar bo'yicha zaxirani oshirish tavsiya etiladi.`,
        actionText: 'Kirim qilish (Prixod)'
      });
    } else if (inventoryTurnoverRate < 25 && totalToolUnits > 5) {
      insights.push({
        type: 'opportunity',
        title: 'Bo‘sh Turgan Zaxira Mavjud',
        description: `Asboblarning ${100 - inventoryTurnoverRate}% qismi omborda bo‘sh turibdi. Qisqa muddatli chegirmalar berish yoki aksiyalar orqali aylanmani tezlashtirish mumkin.`,
        actionText: 'Mijozlarga taklif yuborish'
      });
    }

    // Overdue debt check
    if (totalPendingDebt > 0) {
      insights.push({
        type: 'warning',
        title: `Kutilayotgan Qoldiq Qarz: ${formatMoney(totalPendingDebt)}`,
        description: `${overdueRentalsCount} ta kechikkan buyurtma mavjud. Qaytish muddati o'tgan mijozlar bilan bog'lanib, jarimalarni qayta hisoblash tavsiya etiladi.`,
        actionText: 'Eslatmalarni ko‘rish'
      });
    }

    // Repair cost ratio check
    const repairToRevenueRatio = totalEarnedRevenue > 0 ? (totalRepairCost / totalEarnedRevenue) * 100 : 0;
    if (repairToRevenueRatio > 15) {
      insights.push({
        type: 'warning',
        title: `Ta'mir Xarajatlari Yuqori (${Math.round(repairToRevenueRatio)}%)`,
        description: `Ta'mir xarajatlari tushumning ${Math.round(repairToRevenueRatio)}% ini tashkil qilmoqda. Tez buzilayotgan uskunalar sifatini tekshirish va profilaktika qilish lozim.`
      });
    } else {
      insights.push({
        type: 'positive',
        title: 'Barqaror Rentabellik Ko‘rsatkichi',
        description: `Sof operatsion balans ${formatMoney(netOperatingProfit)} ni tashkil etadi. Ta'mir xarajatlari me'yordan oshmagan.`
      });
    }

    return insights;
  }, [inventoryTurnoverRate, totalToolUnits, totalPendingDebt, overdueRentalsCount, totalEarnedRevenue, totalRepairCost, netOperatingProfit]);

  // Handle password submit
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassInput !== confirmPassInput) {
      setPassError('Yangi parollar bir-biriga mos kelmadi!');
      return;
    }

    const result = changePassword(currentPassInput, newPassInput);
    if (!result.success) {
      setPassError(result.error || 'Parolni o‘zgartirib bo‘lmadi');
      return;
    }

    setPassSuccess('Parol muvaffaqiyatli yangilandi!');
    setCurrentPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');

    setTimeout(() => {
      setIsChangePasswordOpen(false);
      setPassSuccess(null);
    }, 1800);
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const data = {
      tools,
      orders,
      receipts,
      clients,
      repairs,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instrument_arenda_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.tools) localStorage.setItem('arenda_tools_v1', JSON.stringify(json.tools));
        if (json.orders) localStorage.setItem('arenda_orders_v1', JSON.stringify(json.orders));
        if (json.receipts) localStorage.setItem('arenda_receipts_v1', JSON.stringify(json.receipts));
        if (json.clients) localStorage.setItem('arenda_clients_v1', JSON.stringify(json.clients));
        if (json.repairs) localStorage.setItem('arenda_repairs_v1', JSON.stringify(json.repairs));
        window.location.reload();
      } catch {
        alert('Faylni o‘qishda xatolik yuz berdi!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6" id="dashboard-stats-container">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER & NAVIGATION TABS */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Boshqaruv Paneli & Real-Vaqt Tahlillari
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Recharts asosida real-vaqt zaxira aylanmasi, faol buyurtmalar va oylik daromad dinamikasi
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            id="tab-btn-analytics"
            onClick={() => setActiveSubTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'analytics'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Grafik Tahlillar</span>
          </button>

          <button
            id="tab-btn-financials"
            onClick={() => setActiveSubTab('financials')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'financials'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Moliya & Kassa</span>
          </button>

          <button
            id="tab-btn-system"
            onClick={() => setActiveSubTab('system')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'system'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Xavfsizlik & Zaxira</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. REAL-TIME CORE KPI CARDS (Always visible) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Real-time Inventory Turnover Rate */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden group hover:border-blue-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Zaxira Aylanmasi (Turnover)
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                <CountUp value={inventoryTurnoverRate} suffix="%" duration={0.8} />
              </p>
              <span className="text-xs font-semibold text-slate-500">
                bandlik darajasi
              </span>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              inventoryTurnoverRate >= 60 
                ? 'bg-emerald-100 text-emerald-800' 
                : inventoryTurnoverRate >= 30 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-amber-100 text-amber-800'
            }`}>
              {inventoryTurnoverRate >= 60 ? 'Optimal' : inventoryTurnoverRate >= 30 ? 'O‘rtacha' : 'Past'}
            </span>
          </div>

          {/* Progress visual */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <motion.div 
              className="bg-blue-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, inventoryTurnoverRate))}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Ijarada: <b className="text-blue-700"><CountUp value={rentedUnits} suffix=" dona" duration={0.6} /></b></span>
            <span>Jami: <b className="text-slate-800"><CountUp value={totalToolUnits} suffix=" dona" duration={0.6} /></b></span>
          </div>
        </motion.div>

        {/* KPI 2: Total Active Rentals */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden group hover:border-emerald-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Faol Ijaralar
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                <CountUp value={activeRentalsCount} duration={0.8} />
              </p>
              <span className="text-xs font-semibold text-slate-500">
                ta shartnoma
              </span>
            </div>
            {overdueRentalsCount > 0 ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                <CountUp value={overdueRentalsCount} duration={0.6} /> ta kechikkan
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Barchasi o‘z vaqtida
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Kunlik tushum kuchi:</span>
            <span className="font-bold text-emerald-700">
              <CountUp value={activeDailyRunRate} formatter={formatMoney} prefix="+" suffix="/kun" duration={0.8} />
            </span>
          </div>
        </motion.div>

        {/* KPI 3: Monthly / Total Revenue */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden group hover:border-indigo-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Jami Kassa Tushumi
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              <CountUp value={totalEarnedRevenue} formatter={formatMoney} duration={0.9} />
            </p>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Real qabul qilingan to‘lovlar summasi
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] border-t border-slate-100 pt-2">
            <span className="text-slate-500">Sof foyda (operatsion):</span>
            <span className="font-bold text-slate-900">
              <CountUp value={netOperatingProfit} formatter={formatMoney} duration={0.9} />
            </span>
          </div>
        </motion.div>

        {/* KPI 4: Pending Return Debt & Average Duration */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden group hover:border-amber-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Qoldiq Qarz / Muddat
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div>
            <p className="text-2xl font-black text-amber-700 tracking-tight">
              <CountUp value={totalPendingDebt} formatter={formatMoney} duration={0.9} />
            </p>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Topshirish vaqtida to‘lanadigan qoldiq
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] border-t border-slate-100 pt-2">
            <span className="text-slate-500">O‘rtacha muddat:</span>
            <span className="font-bold text-slate-800">
              <CountUp value={averageRentalDays} decimals={1} suffix=" kun" duration={0.7} />
            </span>
          </div>
        </motion.div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BUSINESS DECISION-MAKING INSIGHTS BANNER */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 rounded-2xl p-5 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Biznes Qarorlari & Samaradorlik Ko‘rsatkichlari
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Real-vaqt ombor ma’lumotlari asosida shakllantirildi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {strategicInsights.map((insight, idx) => (
            <div 
              key={idx} 
              className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 flex flex-col justify-between space-y-2 hover:bg-white/8 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  {insight.type === 'positive' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  {insight.type === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  {insight.type === 'opportunity' && <ArrowUpRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  <span className="font-bold text-slate-100">{insight.title}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {insight.description}
                </p>
              </div>
              {insight.actionText && (
                <div className="pt-1 text-[10px] font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1">
                  <span>Tavsiya:</span>
                  <span className="underline">{insight.actionText}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. VISUAL RECHARTS SECTION (When 'analytics' subtab is active) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* Main Trend: Monthly Revenue Trends (AreaChart) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Oylik Daromad & Tushum Dinamikasi (Revenue Trends)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Barcha oylar kesimida qabul qilingan real to‘lovlar va operatsion foyda
                </p>
              </div>

              {/* Timeframe switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto text-xs">
                <button
                  onClick={() => setTrendRange('6m')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    trendRange === '6m' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  6 Oylik
                </button>
                <button
                  onClick={() => setTrendRange('12m')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    trendRange === '12m' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Yillik (12 oy)
                </button>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="label" 
                    tickLine={false} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${Math.round(val / 1000)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '12px', 
                      border: 'none', 
                      color: '#fff',
                      fontSize: '12px',
                      padding: '10px 14px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
                    }}
                    formatter={(value: any, name: string) => [
                      formatMoney(Number(value) || 0), 
                      name === 'revenue' ? 'Jami Tushum' : 'Sof Foyda'
                    ]}
                    labelFormatter={(label) => `Oy: ${label}`}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    height={36}
                    formatter={(val) => val === 'revenue' ? 'Kassa Tushumi' : 'Sof Operatsion Foyda'}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2563eb" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorProfit)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-500 block text-[11px]">Tanlangan davr tushumi:</span>
                <span className="font-bold text-slate-900">
                  <CountUp 
                    value={monthlyRevenueData.reduce((acc, cur) => acc + cur.revenue, 0)} 
                    formatter={formatMoney} 
                    duration={0.7} 
                  />
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-500 block text-[11px]">Jami buyurtmalar soni:</span>
                <span className="font-bold text-slate-900">
                  <CountUp 
                    value={monthlyRevenueData.reduce((acc, cur) => acc + cur.ordersCount, 0)} 
                    suffix=" ta" 
                    duration={0.6} 
                  />
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-500 block text-[11px]">O‘rtacha oylik kassa:</span>
                <span className="font-bold text-slate-900">
                  <CountUp 
                    value={Math.round(monthlyRevenueData.reduce((acc, cur) => acc + cur.revenue, 0) / (monthlyRevenueData.length || 1))} 
                    formatter={formatMoney} 
                    duration={0.7} 
                  />
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-500 block text-[11px]">Oylik ta’mir xarajati:</span>
                <span className="font-bold text-rose-700">
                  <CountUp 
                    value={monthlyRevenueData.reduce((acc, cur) => acc + cur.repairCost, 0)} 
                    formatter={formatMoney} 
                    duration={0.7} 
                  />
                </span>
              </div>
            </div>
          </div>

          {/* Dual Grid: Real-time Inventory Turnover by Category & Active Rentals Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 2: Inventory Turnover by Category (BarChart - 2 cols on lg) */}
            <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Kategoriyalar Kesimida Zaxira Aylanmasi (Real-Vaqt)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Ijaradagi vs Ombordagi
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Har bir kategoriya bo‘yicha band bo‘lgan va bo‘sh turgan uskunalar nisbati
                </p>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryTurnoverData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="category" 
                      tickLine={false} 
                      axisLine={{ stroke: '#e2e8f0' }}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderRadius: '12px', 
                        border: 'none', 
                        color: '#fff',
                        fontSize: '12px'
                      }}
                      formatter={(val: any, name: string) => [
                        `${val} dona`,
                        name === 'ijarada' ? 'Ijaradagi' : name === 'mavjud' ? 'Omborda mavjud' : 'Jami'
                      ]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullCategory || ''}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right"
                      formatter={(val) => val === 'ijarada' ? 'Ijarada (Aylanmada)' : 'Mavjud (Omborda)'}
                    />
                    <Bar dataKey="ijarada" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="mavjud" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                <span>💡 <b>Qaror qabul qilish:</b> Moviy ustun (ijarada) kulrangdan baland bo‘lgan kategoriyalar bo‘yicha talab eng yuqori hisoblanadi.</span>
              </div>
            </div>

            {/* Chart 3: Order Status & Active Rentals Donut (PieChart - 1 col on lg) */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-emerald-600" />
                    Buyurtmalar Holati
                  </h3>
                  <span className="text-xs text-slate-500">
                    Jami: {totalOrdersCount}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Faol, kechikkan va muvaffaqiyatli yakunlangan ijaralar ulushi
                </p>
              </div>

              <div className="h-52 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {orderStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderRadius: '10px', 
                        border: 'none', 
                        color: '#fff',
                        fontSize: '11px' 
                      }}
                      formatter={(value: any, name: string) => [`${value} ta buyurtma`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center metric */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black text-slate-900 leading-tight">
                    {activeRentalsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                    Faol Ijara
                  </span>
                </div>
              </div>

              {/* Status breakdown legend list */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Faol amaldagi ijaralar:</span>
                  </div>
                  <span className="font-bold text-slate-900">{activeRentalsCount} ta</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-slate-600">Kechikkan (Muddati o‘tgan):</span>
                  </div>
                  <span className="font-bold text-red-600">{overdueRentalsCount} ta</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    <span className="text-slate-600">Qaytarilgan & Yopilgan:</span>
                  </div>
                  <span className="font-bold text-slate-700">{returnedRentalsCount} ta</span>
                </div>
              </div>
            </div>

          </div>

          {/* Top High-Turnover Equipment Ranking Table */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Eng Yuqori Aylanmaga Ega Asboblar (Top Fast-Moving Tools)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Eng ko‘p ijaraga olingan va aylanma tezligi yuqori bo‘lgan uskunalar
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Top 5 pozitsiya
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Asbob Nomi</th>
                    <th className="py-2.5 px-3">Kategoriya</th>
                    <th className="py-2.5 px-3 text-center">Jami Zaxira</th>
                    <th className="py-2.5 px-3 text-center">Ijarada</th>
                    <th className="py-2.5 px-3">Aylanma Ko‘rsatkichi</th>
                    <th className="py-2.5 px-3 text-right">Kunlik Narx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topTurnoverTools.length > 0 ? (
                    topTurnoverTools.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.article}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {item.category}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                          {item.total} dona
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700">
                            {item.rented} dona
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full rounded-full" 
                                style={{ width: `${item.rate}%` }} 
                              />
                            </div>
                            <span className="font-bold text-slate-800">{item.rate}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatMoney(item.dailyPrice)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        Hozircha asboblar kiritilmagan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. FINANCIALS SUBTAB (Payment Breakdown & Repairs) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'financials' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Payment Methods Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  To‘lov Usullari Bo‘yicha Tushumlar
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Jami: <b>{formatMoney(totalEarnedRevenue)}</b>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Naqd Pul</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-emerald-950">
                    {formatMoney(cashRevenue)}
                  </p>
                  <span className="text-[10px] text-emerald-700 block">
                    {totalEarnedRevenue > 0 ? Math.round((cashRevenue / totalEarnedRevenue) * 100) : 0}% ulush
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-blue-800 font-bold">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Plastik Karta</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-blue-950">
                    {formatMoney(cardRevenue)}
                  </p>
                  <span className="text-[10px] text-blue-700 block">
                    {totalEarnedRevenue > 0 ? Math.round((cardRevenue / totalEarnedRevenue) * 100) : 0}% ulush
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-purple-800 font-bold">
                    <Building className="w-3.5 h-3.5" />
                    <span>O‘tkazma / Click</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-purple-950">
                    {formatMoney(transferRevenue)}
                  </p>
                  <span className="text-[10px] text-purple-700 block">
                    {totalEarnedRevenue > 0 ? Math.round((transferRevenue / totalEarnedRevenue) * 100) : 0}% ulush
                  </span>
                </div>
              </div>

              {/* Visual Payment distribution bar */}
              <div className="pt-2">
                <span className="text-[11px] text-slate-500 block mb-1.5">Mablag‘lar oqimi balansi:</span>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                  <div 
                    style={{ width: `${totalEarnedRevenue > 0 ? (cashRevenue / totalEarnedRevenue) * 100 : 33}%` }} 
                    className="bg-emerald-500 h-full"
                    title="Naqd pul"
                  />
                  <div 
                    style={{ width: `${totalEarnedRevenue > 0 ? (cardRevenue / totalEarnedRevenue) * 100 : 33}%` }} 
                    className="bg-blue-500 h-full"
                    title="Karta"
                  />
                  <div 
                    style={{ width: `${totalEarnedRevenue > 0 ? (transferRevenue / totalEarnedRevenue) * 100 : 34}%` }} 
                    className="bg-purple-500 h-full"
                    title="Perevod"
                  />
                </div>
              </div>
            </div>

            {/* Repair & Operating Net Profit */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  Ta’mirlash & Sof Operatsion Balans
                </h3>
                <span className="text-xs text-slate-500">
                  {repairs.length} ta ta’mir amaliyoti
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-600 font-medium block">Servisda (faol):</span>
                  <p className="text-base font-black text-slate-900">
                    {inRepairUnits} <span className="text-xs font-normal text-slate-500">dona</span>
                  </p>
                  <span className="text-[10px] text-amber-700 block font-semibold">
                    Ustalarga berilgan
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-red-50/70 border border-red-100 space-y-1">
                  <span className="text-xs text-red-800 font-bold block">Ta’mir Xarajati:</span>
                  <p className="text-sm sm:text-base font-black text-red-950">
                    {formatMoney(totalRepairCost)}
                  </p>
                  <span className="text-[10px] text-red-600 block">
                    Usta va ehtiyot qismlar
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                  <span className="text-xs text-emerald-800 font-bold block">Sof Tushum:</span>
                  <p className="text-sm sm:text-base font-black text-emerald-950">
                    {formatMoney(netOperatingProfit)}
                  </p>
                  <span className="text-[10px] text-emerald-700 block">
                    Tushum - Ta’mir
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span>🎁 Berilgan chegirmalar summasi: <b>{formatMoney(totalDiscountsGiven)}</b>. Prixod hujjatlari bo‘yicha asboblar sotib olishga sarflangan jami sarmoya: <b>{formatMoney(totalInventoryPurchaseCost)}</b>.</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. SYSTEM & BACKUP SUBTAB */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'system' && (
        <div className="space-y-6">
          
          {/* Administrator Profile Card */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 text-slate-950 flex items-center justify-center font-black shadow-lg">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white">
                      Administrator: {currentUser?.fullName || 'Shoxjaxon'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500 text-slate-950 uppercase tracking-wider">
                      Bosh Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tizimga to‘liq boshqaruv huquqiga ega asosiy administrator
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  Login: <b className="text-blue-400 font-mono">{currentUser?.username || 'shoxjaxon'}</b>
                </div>
                <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 font-bold text-xs transition cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                  <span>Parolni O‘zgartirish</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Tizimdan chiqishni xohlaysizmi?')) {
                      logout();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
                >
                  Chiqish
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-800/80">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                <span className="text-slate-400 text-[11px] block">Ruxsat darajasi:</span>
                <span className="font-bold text-emerald-400">Super Administrator (To‘liq)</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                <span className="text-slate-400 text-[11px] block">Asboblar & Zakazlar:</span>
                <span className="font-bold text-slate-200">Kirim, Tahrirlash, Yopish, Chek</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                <span className="text-slate-400 text-[11px] block">Moliya & Kassa:</span>
                <span className="font-bold text-blue-300">Barcha hisobotlar va zaxira</span>
              </div>
            </div>
          </div>

          {/* Backup & System Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Ma’lumotlar Xavfsizligi & Zaxira Nusxasi (Backup)
            </h3>
            <p className="text-xs text-slate-500">
              Ishxonadagi barcha tovarlar, narxlar, zakazlar va mijozlar brauzer xotirasida (localStorage) avtomatik saqlanadi. 
              Boshqa kompyuterga o‘tkazish yoki xavfsizlik uchun fayl ko‘rinishida yuklab olishingiz mumkin.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleExportBackup}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <span>Zaxirani Yuklab Olish (Export JSON)</span>
              </button>

              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer border border-slate-300">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Zaxiradan Tiklash (Import JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  if (confirm('DIQQAT! Haqiqatan ham barcha asboblar, zakazlar va mijozlarni butunlay o‘chirib, bazani 0 (toza) holatga keltirmoqchimisiz?')) {
                    clearAllData();
                    window.location.reload();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 font-bold text-xs transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bazani 0 Qilish (Tozalash)</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Barcha ma’lumotlar dastlabki namunaviy holatga qaytarilsinmi?')) {
                    resetToDefaults();
                    window.location.reload();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-semibold text-xs transition ml-auto cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Qayta tiklash</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. PASSWORD CHANGE MODAL */}
      {/* ------------------------------------------------------------- */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Administrator Parolini O‘zgartirish</h3>
                  <p className="text-[11px] text-slate-400">Yangi xavfsiz parol o‘rnating</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChangePasswordOpen(false);
                  setPassError(null);
                  setPassSuccess(null);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passError && (
              <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Hozirgi amaldagi parol
                </label>
                <input
                  type="password"
                  required
                  value={currentPassInput}
                  onChange={e => setCurrentPassInput(e.target.value)}
                  placeholder="Hozirgi parolingizni kiriting"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Yangi parol (kamida 5 ta belgi)
                </label>
                <input
                  type="password"
                  required
                  value={newPassInput}
                  onChange={e => setNewPassInput(e.target.value)}
                  placeholder="Yangi maxfiy parolni yozing"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Yangi parolni takrorlang
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassInput}
                  onChange={e => setConfirmPassInput(e.target.value)}
                  placeholder="Yangi parolni qayta kiriting"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black transition cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
