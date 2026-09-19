import React, { useState, useMemo } from 'react';
import { 
  UserSquare, 
  UserPlus, 
  Search, 
  Filter, 
  Phone, 
  Send, 
  Briefcase, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Edit, 
  Trash2, 
  Eye, 
  Plus, 
  LayoutGrid, 
  Table as TableIcon, 
  FileSpreadsheet, 
  RotateCcw, 
  Award, 
  DollarSign, 
  Users,
  AlertCircle
} from 'lucide-react';
import { useRental } from '../context/RentalContext';
import { Seller, SellerRole } from '../types';
import { formatMoney, formatDate } from '../utils/formatters';
import { SellerDetailModal } from './SellerDetailModal';
import { EditSellerModal } from './EditSellerModal';

interface SellersViewProps {
  onNewOrderForSeller?: (sellerId: string) => void;
}

export const SellersView: React.FC<SellersViewProps> = ({ onNewOrderForSeller }) => {
  const { 
    sellers, 
    orders, 
    addSeller, 
    updateSeller, 
    deleteSeller, 
    resetSellersToDefaults 
  } = useRental();

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sellerToEdit, setSellerToEdit] = useState<Seller | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [sellerToView, setSellerToView] = useState<Seller | null>(null);

  // Calculate stats for each seller
  const sellerStatsMap = useMemo(() => {
    const stats: Record<string, { totalOrders: number; activeOrders: number; totalRevenue: number }> = {};
    
    (sellers || []).forEach(s => {
      stats[s.id] = { totalOrders: 0, activeOrders: 0, totalRevenue: 0 };
    });

    (orders || []).forEach(o => {
      if (o.sellerId && stats[o.sellerId]) {
        stats[o.sellerId].totalOrders += 1;
        stats[o.sellerId].totalRevenue += Number(o.totalRentAmount) || 0;
        if (o.status !== 'returned') {
          stats[o.sellerId].activeOrders += 1;
        }
      }
    });

    return stats;
  }, [sellers, orders]);

  // Overall statistics
  const totalSellers = sellers ? sellers.length : 0;
  const activeSellersCount = (sellers || []).filter(s => s.active).length;
  const totalHandledRevenue = (orders || []).reduce((sum, o) => sum + (Number(o.totalRentAmount) || 0), 0);

  // Top seller
  const topSeller = useMemo(() => {
    if (!sellers || sellers.length === 0) return null;
    let best = sellers[0];
    let maxOrders = -1;
    sellers.forEach(s => {
      const count = sellerStatsMap[s.id]?.totalOrders || 0;
      if (count > maxOrders) {
        maxOrders = count;
        best = s;
      }
    });
    return maxOrders > 0 ? best : null;
  }, [sellers, sellerStatsMap]);

  // Filtered sellers
  const filteredSellers = useMemo(() => {
    return (sellers || []).filter(s => {
      // Search
      const searchMatch = !searchTerm.trim() || 
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone && s.phone.includes(searchTerm)) ||
        (s.telegram && s.telegram.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.roleTitle && s.roleTitle.toLowerCase().includes(searchTerm.toLowerCase()));

      // Role
      const roleMatch = roleFilter === 'all' || s.role === roleFilter;

      // Status
      const statusMatch = statusFilter === 'all' || 
        (statusFilter === 'active' && s.active) || 
        (statusFilter === 'inactive' && !s.active);

      return searchMatch && roleMatch && statusMatch;
    });
  }, [sellers, searchTerm, roleFilter, statusFilter]);

  // Open add modal
  const handleOpenAdd = () => {
    setSellerToEdit(null);
    setIsEditModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (seller: Seller) => {
    setSellerToEdit(seller);
    setIsEditModalOpen(true);
  };

  // Open detail modal
  const handleOpenDetail = (seller: Seller) => {
    setSellerToView(seller);
    setIsDetailModalOpen(true);
  };

  // Save seller (new or edit)
  const handleSaveSeller = (data: {
    fullName: string;
    phone: string;
    role: SellerRole;
    roleTitle?: string;
    telegram?: string;
    commissionRate: number;
    notes?: string;
    active: boolean;
  }) => {
    if (sellerToEdit) {
      updateSeller({
        ...sellerToEdit,
        ...data
      });
    } else {
      addSeller({
        ...data,
      });
    }
  };

  // Toggle active status
  const handleToggleActive = (seller: Seller) => {
    updateSeller({
      ...seller,
      active: !seller.active
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!sellers || sellers.length === 0) return;
    const headers = ['ID', 'F.I.Sh', 'Telefon', 'Lavozim', 'Telegram', 'KPI (%)', 'Buyurtmalar soni', 'Jami aylanma (so\'m)', 'Holati'];
    const rows = sellers.map(s => {
      const stats = sellerStatsMap[s.id] || { totalOrders: 0, totalRevenue: 0 };
      return [
        s.id,
        `"${s.fullName}"`,
        `"${s.phone || ''}"`,
        `"${s.roleTitle || s.role || ''}"`,
        `"${s.telegram || ''}"`,
        s.commissionRate || 3,
        stats.totalOrders,
        stats.totalRevenue,
        s.active ? 'Faol' : 'Nofaol'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sotuvchilar_royxati_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for role pill styling
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Bosh Administrator</span>;
      case 'manager':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Katta Menejer</span>;
      case 'technician':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Texnik Usta</span>;
      case 'seller':
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Kassir-Sotuvchi</span>;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* Top Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <UserSquare className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Sotuvchilar va Xodimlar (CRM)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                {totalSellers} nafar
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ijara shartnomalarini rasmiylashtiruvchi va to‘lovlarni qabul qiluvchi xodimlar bazasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {(!sellers || sellers.length === 0) && (
            <button
              onClick={resetSellersToDefaults}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
              title="Standart tayyor xodimlarni yuklash"
            >
              <RotateCcw className="w-4 h-4 text-slate-600" />
              <span>Standart xodimlarni yuklash</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            disabled={!sellers || sellers.length === 0}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
            title="Excel formatida yuklab olish"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Excelga eksport</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition active:scale-98"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Yangi Xodim Qo‘shish</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Jami Xodimlar</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalSellers}</span>
            <span className="text-xs text-slate-400">nafar</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Ro'yxatga olingan jami
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Faol Ishlovchilar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{activeSellersCount}</span>
            <span className="text-xs text-slate-400">nafar faol</span>
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 block">
            Shartnoma tuza oladi
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Xodimlar Aylanmasi</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 truncate">
            {formatMoney(totalHandledRevenue)}
          </div>
          <span className="text-[11px] text-blue-600 mt-1 block">
            Jami ijara aylanmasi
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Oy Yetakchisi</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-black text-slate-900 truncate">
            {topSeller ? topSeller.fullName : 'Boshlanmadi'}
          </div>
          <span className="text-[11px] text-amber-600 font-medium mt-1 block truncate">
            {topSeller ? `${sellerStatsMap[topSeller.id]?.totalOrders || 0} ta ijara buyurtmasi` : 'Hozircha buyurtma yo‘q'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Ism, telefon yoki lavozim qidirish..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden text-slate-900"
          />
        </div>

        {/* Filters and View Switch */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
          >
            <option value="all">Barcha lavozimlar</option>
            <option value="admin">Administratorlar</option>
            <option value="manager">Menejerlar</option>
            <option value="seller">Kassir-Sotuvchilar</option>
            <option value="technician">Texnik Ustalar</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
          >
            <option value="all">Barcha holatlar</option>
            <option value="active">Faqat faollar</option>
            <option value="inactive">Faqat nofaollar</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Karta ko'rinishi"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Jadval ko'rinishi"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      {filteredSellers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <UserSquare className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-800">Xodimlar topilmadi</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
              ? "Qidiruv yoki filtr bo'yicha hech qanday xodim mos kelmadi. Filtrlarni tozalab ko'ring."
              : "Hozircha tizimda birorta ham sotuvchi yoki xodim mavjud emas. Quyidagi tugmalar orqali standart xodimlarni yuklashingiz yoki yangi xodim qo'shishingiz mumkin."}
          </p>

          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            <button
              onClick={resetSellersToDefaults}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Standart xodimlarni yuklash (4 ta)</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Yangi xodim kiritish</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSellers.map(seller => {
            const stats = sellerStatsMap[seller.id] || { totalOrders: 0, activeOrders: 0, totalRevenue: 0 };
            const commission = seller.commissionRate ?? 3;
            const estimatedBonus = Math.round((stats.totalRevenue * commission) / 100);

            return (
              <div 
                key={seller.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition duration-200 flex flex-col overflow-hidden"
              >
                {/* Card Top Strip */}
                <div className="p-5 flex-1 space-y-4">
                  
                  {/* Avatar & Main Info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                          {seller.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span 
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            seller.active ? 'bg-emerald-500' : 'bg-slate-300'
                          }`} 
                        />
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          {seller.fullName}
                        </h4>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          {getRoleBadge(seller.role)}
                          {seller.roleTitle && (
                            <span className="text-[10px] text-slate-500">
                              {seller.roleTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Active toggle button */}
                    <button
                      onClick={() => handleToggleActive(seller)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                        seller.active 
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title={seller.active ? "Nofaol qilish" : "Faollashtirish"}
                    >
                      {seller.active ? 'Faol' : 'Nofaol'}
                    </button>
                  </div>

                  {/* Contacts */}
                  <div className="space-y-1.5 text-xs">
                    {seller.phone && (
                      <a 
                        href={`tel:${seller.phone.replace(/\s+/g, '')}`}
                        className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium font-mono">{seller.phone}</span>
                      </a>
                    )}
                    {seller.telegram && (
                      <a 
                        href={`https://t.me/${seller.telegram.replace('@', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-slate-600 hover:text-sky-600 transition"
                      >
                        <Send className="w-3.5 h-3.5 text-sky-500" />
                        <span className="font-medium text-sky-600">{seller.telegram}</span>
                      </a>
                    )}
                  </div>

                  {/* Seller Performance Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Buyurtmalar</span>
                      <span className="text-sm font-black text-slate-800">{stats.totalOrders}</span>
                      <span className="text-[9px] text-blue-600 block">{stats.activeOrders} aktiv</span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Kassa tushumi</span>
                      <span className="text-xs font-black text-slate-800 truncate block">
                        {formatMoney(stats.totalRevenue)}
                      </span>
                      <span className="text-[9px] text-emerald-600 block">Jami summa</span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">KPI ({commission}%)</span>
                      <span className="text-xs font-black text-indigo-600 truncate block">
                        {formatMoney(estimatedBonus)}
                      </span>
                      <span className="text-[9px] text-slate-400 block">Bonus</span>
                    </div>
                  </div>

                  {seller.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50/70 p-2 rounded-lg line-clamp-2">
                      "{seller.notes}"
                    </p>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenDetail(seller)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 font-bold transition flex items-center gap-1 shadow-2xs"
                      title="Batafsil ko‘rish"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Batafsil</span>
                    </button>

                    {onNewOrderForSeller && (
                      <button
                        onClick={() => onNewOrderForSeller(seller.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 font-bold transition flex items-center gap-1"
                        title="Shu xodim nomidan buyurtma rasmiylashtirish"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Buyurtma</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(seller)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                      title="Tahrirlash"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Rostdan ham "${seller.fullName}" xodimini o‘chirmoqchimisiz?`)) {
                          deleteSeller(seller.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="O‘chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Xodim F.I.Sh</th>
                  <th className="px-4 py-3.5">Lavozim</th>
                  <th className="px-4 py-3.5">Aloqa</th>
                  <th className="px-4 py-3.5 text-center">Buyurtmalar</th>
                  <th className="px-4 py-3.5">Kassa tushumi</th>
                  <th className="px-4 py-3.5">KPI Bonusi</th>
                  <th className="px-4 py-3.5">Holati</th>
                  <th className="px-4 py-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSellers.map(seller => {
                  const stats = sellerStatsMap[seller.id] || { totalOrders: 0, activeOrders: 0, totalRevenue: 0 };
                  const commission = seller.commissionRate ?? 3;
                  const estimatedBonus = Math.round((stats.totalRevenue * commission) / 100);

                  return (
                    <tr key={seller.id} className="hover:bg-slate-50/80 transition">
                      {/* Name & Avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {seller.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{seller.fullName}</span>
                            <span className="text-[10px] text-slate-400">ID: {seller.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        {getRoleBadge(seller.role)}
                        {seller.roleTitle && (
                          <span className="text-[11px] text-slate-500 block mt-0.5">{seller.roleTitle}</span>
                        )}
                      </td>

                      {/* Phone & Telegram */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-slate-800 block">{seller.phone || '-'}</span>
                        {seller.telegram && (
                          <span className="text-[11px] text-sky-600 block">{seller.telegram}</span>
                        )}
                      </td>

                      {/* Orders */}
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-slate-900 block">{stats.totalOrders} ta</span>
                        <span className="text-[10px] text-blue-600">{stats.activeOrders} aktiv</span>
                      </td>

                      {/* Revenue */}
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {formatMoney(stats.totalRevenue)}
                      </td>

                      {/* Commission */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-indigo-600 block">{formatMoney(estimatedBonus)}</span>
                        <span className="text-[10px] text-slate-400">{commission}%</span>
                      </td>

                      {/* Active Status */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(seller)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            seller.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {seller.active ? 'Faol' : 'Nofaol'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(seller)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Batafsil ma’lumot"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {onNewOrderForSeller && (
                            <button
                              onClick={() => onNewOrderForSeller(seller.id)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                              title="Buyurtma biriktirish"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(seller)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
                            title="Tahrirlash"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Rostdan ham "${seller.fullName}" xodimini o‘chirmoqchimisiz?`)) {
                                deleteSeller(seller.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition"
                            title="O‘chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <SellerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        seller={sellerToView}
        onEdit={(seller) => {
          setIsDetailModalOpen(false);
          handleOpenEdit(seller);
        }}
        onNewOrder={(sellerId) => {
          setIsDetailModalOpen(false);
          if (onNewOrderForSeller) {
            onNewOrderForSeller(sellerId);
          }
        }}
      />

      <EditSellerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        sellerToEdit={sellerToEdit}
        onSave={handleSaveSeller}
      />

    </div>
  );
};
