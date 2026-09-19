import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Tag, 
  Hash, 
  Layers, 
  CheckCircle2, 
  Clock, 
  ArrowDownToLine, 
  LayoutGrid, 
  List, 
  SlidersHorizontal,
  DollarSign,
  ShieldCheck,
  Zap,
  Info,
  Wrench,
  ChevronDown,
  Upload,
  Download,
  Filter,
  ExternalLink,
  Sparkles,
  Check,
  RotateCcw,
  X,
  ArrowUpDown,
  Building2,
  PackageCheck,
  Eye
} from 'lucide-react';
import { Tool, ToolCategory } from '../types';
import { useRental } from '../context/RentalContext';
import { formatMoney } from '../utils/formatters';
import { calculateDepositPrice } from '../utils/toolHelpers';
import { AsyncToolImage } from './AsyncToolImage';
import { ToolDetailModal } from './ToolDetailModal';
import { EditToolModal } from './EditToolModal';

interface ToolCatalogProps {
  onRentTool: (tool: Tool) => void;
  onOpenAddTool: () => void;
  onOpenPrixodForTool: (tool?: Tool) => void;
  onSendToRepair?: (tool: Tool) => void;
  externalSearchTerm?: string;
}

const CATEGORIES: ('Barchasi' | ToolCategory)[] = [
  'Barchasi',
  'Elektroinstrument',
  'Benzinli & Generator',
  'Payvandlash & Metall',
  'Beton & Qurilish',
  'Bog‘ & Tozalash',
  'Narvon & Havoza',
  'O‘lchov & Lazer'
];

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'stock_desc' | 'name_asc' | 'name_desc';

export const ToolCatalog: React.FC<ToolCatalogProps> = ({
  onRentTool,
  onOpenAddTool,
  onOpenPrixodForTool,
  onSendToRepair,
  externalSearchTerm = ''
}) => {
  const { tools } = useRental();
  
  // Modals state
  const [selectedToolForDetail, setSelectedToolForDetail] = useState<Tool | null>(null);
  const [selectedToolForEdit, setSelectedToolForEdit] = useState<Tool | null>(null);

  // Filter States (Modern e-commerce standard)
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Barchasi' | ToolCategory>('Barchasi');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'rented' | 'repair' | 'out_of_stock'>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  // Combined search term
  const searchTerm = externalSearchTerm || internalSearchTerm;

  // Extract all unique brands dynamically
  const uniqueBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    tools.forEach(t => {
      if (t.brand && t.brand.trim()) {
        brandsSet.add(t.brand.trim());
      }
    });
    return Array.from(brandsSet).sort();
  }, [tools]);

  // Check if any filter is active
  const isFilterActive = 
    searchTerm.trim() !== '' || 
    selectedCategory !== 'Barchasi' || 
    availabilityFilter !== 'all' || 
    selectedBrand !== 'all' || 
    minPrice !== '' || 
    maxPrice !== '' || 
    sortBy !== 'default';

  // Reset all filters
  const resetFilters = () => {
    setInternalSearchTerm('');
    setSelectedCategory('Barchasi');
    setAvailabilityFilter('all');
    setSelectedBrand('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('default');
  };

  // Filter & Sort Logic
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      // 1. Search Query
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || (
        tool.name.toLowerCase().includes(q) ||
        tool.article.toLowerCase().includes(q) ||
        tool.code.toLowerCase().includes(q) ||
        (tool.brand && tool.brand.toLowerCase().includes(q)) ||
        (tool.model && tool.model.toLowerCase().includes(q))
      );

      // 2. Category
      const matchesCategory = selectedCategory === 'Barchasi' || tool.category === selectedCategory;

      // 3. Availability / Stock
      let matchesStock = true;
      if (availabilityFilter === 'available') {
        matchesStock = tool.availableStock > 0;
      } else if (availabilityFilter === 'rented') {
        matchesStock = tool.rentedStock > 0;
      } else if (availabilityFilter === 'repair') {
        matchesStock = (tool.repairStock || 0) > 0;
      } else if (availabilityFilter === 'out_of_stock') {
        matchesStock = tool.availableStock === 0;
      }

      // 4. Brand
      const matchesBrand = selectedBrand === 'all' || (tool.brand && tool.brand.toLowerCase() === selectedBrand.toLowerCase());

      // 5. Price Range
      const minP = minPrice ? parseFloat(minPrice) : null;
      const maxP = maxPrice ? parseFloat(maxPrice) : null;
      let matchesPrice = true;
      if (minP !== null && !isNaN(minP)) {
        matchesPrice = matchesPrice && tool.dailyPrice >= minP;
      }
      if (maxP !== null && !isNaN(maxP)) {
        matchesPrice = matchesPrice && tool.dailyPrice <= maxP;
      }

      return matchesSearch && matchesCategory && matchesStock && matchesBrand && matchesPrice;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.dailyPrice - b.dailyPrice;
      if (sortBy === 'price_desc') return b.dailyPrice - a.dailyPrice;
      if (sortBy === 'stock_desc') return b.availableStock - a.availableStock;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      return 0; // default order
    });
  }, [tools, searchTerm, selectedCategory, availabilityFilter, selectedBrand, minPrice, maxPrice, sortBy]);

  // Overall counters
  const totalToolsCount = tools.reduce((acc, t) => acc + t.totalStock, 0);
  const totalAvailable = tools.reduce((acc, t) => acc + t.availableStock, 0);
  const totalRented = tools.reduce((acc, t) => acc + t.rentedStock, 0);
  const totalInRepair = tools.reduce((acc, t) => acc + (t.repairStock || 0), 0);

  const handleExportExcel = () => {
    import('../utils/exportExcel').then(({ exportToolsToExcel }) => exportToolsToExcel(filteredTools));
  };

  return (
    <div className="space-y-4">
      
      {/* Top Bar: Title, Stats summary, and Main Add Button */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Tovarlar & Mahsulotlar
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {tools.length} xil mahsulot ({totalToolsCount} dona)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Barcha asbob-uskunalar katalogi. Kartochkani ko‘rish uchun mahsulot ustiga bosing.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onOpenPrixodForTool()}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
            title="Omborga mahsulot qabul qilish (Prixod bo‘limiga o‘tish)"
          >
            <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
            <span>Prixod (Kirim)</span>
          </button>

          <button
            onClick={onOpenAddTool}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yangi tovar qo‘shish</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Filter Panel + Right Tools List */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        
        {/* LEFT FILTER PANEL (Zamonaviy filtrlar) */}
        <div className="w-full lg:w-64 xl:w-72 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4 shrink-0">
          
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="font-extrabold text-slate-800 text-xs tracking-wide uppercase">
                Filtrlar
              </span>
            </div>
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Tozalash</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Tezkor qidiruv
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nom, artikul, kod yoki brend..."
                value={internalSearchTerm}
                onChange={e => setInternalSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              {internalSearchTerm && (
                <button
                  onClick={() => setInternalSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter 1: Zaxira / Mavjudlik holati */}
          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            <label className="text-xs font-bold text-slate-700 block">
              Zaxira holati (Status)
            </label>
            <div className="grid grid-cols-1 gap-1">
              {[
                { id: 'all', label: 'Barchasi', count: totalToolsCount, color: 'text-slate-700' },
                { id: 'available', label: 'Bo‘sh / Mavjud', count: totalAvailable, color: 'text-emerald-700' },
                { id: 'rented', label: 'Ijarada (Band)', count: totalRented, color: 'text-blue-700' },
                { id: 'repair', label: 'Ta’mirlashda', count: totalInRepair, color: 'text-amber-700' },
                { id: 'out_of_stock', label: 'Qolmagan (0 ta)', count: tools.filter(t => t.availableStock === 0).length, color: 'text-rose-700' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setAvailabilityFilter(st.id as any)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                    availabilityFilter === st.id
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className={st.color}>{st.label}</span>
                  <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-600">
                    {st.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter 2: Kategoriya */}
          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            <label className="text-xs font-bold text-slate-700 block">
              Kategoriya
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Filter 3: Brend bo'yicha */}
          {uniqueBrands.length > 0 && (
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <label className="text-xs font-bold text-slate-700 block">
                Brend / Ishlab chiqaruvchi
              </label>
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Barcha brendlar ({uniqueBrands.length})</option>
                {uniqueBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filter 4: Narx diapazoni (Kunlik ijara so'mda) */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <label className="text-xs font-bold text-slate-700 block">
              Kunlik Ijara Narxi (so‘m)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min so‘m"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max so‘m"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Quick Price Buttons */}
            <div className="grid grid-cols-3 gap-1 pt-1">
              <button
                onClick={() => { setMinPrice(''); setMaxPrice('100000'); }}
                className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg truncate"
              >
                &lt; 100k
              </button>
              <button
                onClick={() => { setMinPrice('100000'); setMaxPrice('250000'); }}
                className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg truncate"
              >
                100k - 250k
              </button>
              <button
                onClick={() => { setMinPrice('250000'); setMaxPrice(''); }}
                className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg truncate"
              >
                &gt; 250k
              </button>
            </div>
          </div>

          {/* Export button */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleExportExcel}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Excelga eksport ({filteredTools.length})</span>
            </button>
          </div>

        </div>

        {/* RIGHT CONTENT: Toolbar & Tools List */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          
          {/* Controls Bar: Sort, View Switcher, and Counter */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">
                Natijalar: <b className="text-slate-900">{filteredTools.length} ta</b>
              </span>
              {isFilterActive && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                  Filtrlangan
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Sort by dropdown */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Saralash:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="default">Standart (Ommabop)</option>
                  <option value="price_asc">Narx: Arzondan qimmatga ↑</option>
                  <option value="price_desc">Narx: Qimmatdan arzonga ↓</option>
                  <option value="stock_desc">Zaxira: Ko‘pdan kamga ↓</option>
                  <option value="name_asc">Nom: A dan Z gacha</option>
                  <option value="name_desc">Nom: Z dan A gacha</option>
                </select>
              </div>

              {/* View Switcher: Grid / Table */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition ${
                    viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="Kartochka ko‘rinishi"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition ${
                    viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="Jadval ko‘rinishi"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tools Grid or Table */}
          {filteredTools.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Mos mahsulotlar topilmadi
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Belgilangan filtrlar yoki qidiruv so‘rovi bo‘yicha hech qanday tovar mavjud emas. Filtrlarni tozalab ko‘ring yoki yangi tovar qo‘shing.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Filtrlarni tozalash</span>
                  </button>
                  <button
                    onClick={onOpenAddTool}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yangi tovar qo‘shish</span>
                  </button>
                </div>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW (Kartochkalar - bosganda detal ochiladi!) */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTools.map(tool => {
                const isAvailable = tool.availableStock > 0;
                return (
                  <div
                    key={tool.id}
                    onClick={() => setSelectedToolForDetail(tool)}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 transition flex flex-col group cursor-pointer"
                  >
                    {/* Image Box */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      <AsyncToolImage
                        toolName={tool.name}
                        originalUrl={tool.imageUrl}
                        className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                      />

                      {/* Artikul & Kod */}
                      <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/85 text-white font-mono shadow-xs">
                          {tool.article}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white font-mono shadow-xs">
                          {tool.code}
                        </span>
                      </div>

                      {/* Stock Badge */}
                      <div className="absolute top-2.5 right-2.5">
                        {isAvailable ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-xs">
                            {tool.availableStock} ta bo‘sh
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-xs">
                            Band
                          </span>
                        )}
                      </div>

                      {/* Category Pill */}
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/95 text-slate-800 shadow-2xs backdrop-blur-xs">
                          {tool.category}
                        </span>
                      </div>

                      {/* Hover Overlay Hint */}
                      <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-xl bg-white/95 text-slate-900 font-bold text-xs shadow-md flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Kartochkani ko‘rish</span>
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-blue-600 transition">
                          {tool.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          {tool.brand ? `${tool.brand} • ` : ''}{tool.model || 'Standart model'}
                        </p>
                      </div>

                      {/* Stock Visualizer */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1.5">
                        <div className="flex justify-between text-slate-600">
                          <span>Jami: <b>{tool.totalStock} ta</b></span>
                          <span className="text-blue-600 font-semibold">Ijarada: <b>{tool.rentedStock} ta</b></span>
                          <span className="text-emerald-600 font-semibold">Bo‘sh: <b>{tool.availableStock} ta</b></span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden flex">
                          <div 
                            className="bg-blue-600 h-full" 
                            style={{ width: `${tool.totalStock > 0 ? (tool.rentedStock / tool.totalStock) * 100 : 0}%` }}
                          />
                          <div 
                            className="bg-emerald-500 h-full" 
                            style={{ width: `${tool.totalStock > 0 ? (tool.availableStock / tool.totalStock) * 100 : 0}%` }}
                          />
                          <div 
                            className="bg-amber-500 h-full" 
                            style={{ width: `${tool.totalStock > 0 ? ((tool.repairStock || 0) / tool.totalStock) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Kunlik Ijara</span>
                          <span className="text-sm font-extrabold text-blue-600">
                            {formatMoney(tool.dailyPrice)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Garov</span>
                          <span className="text-xs font-bold text-slate-700">
                            {formatMoney(tool.depositPrice > 0 ? tool.depositPrice : calculateDepositPrice(0, tool.dailyPrice))}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenPrixodForTool(tool)}
                          className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                          title="Omborga qo‘shimcha kirim qilish"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Prixod</span>
                        </button>

                        <button
                          onClick={() => onRentTool(tool)}
                          disabled={!isAvailable}
                          className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                            isAvailable
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{isAvailable ? 'Ijaraga berish' : 'Band'}</span>
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW (Jadval - qatorga bosganda detal ochiladi!) */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Mahsulot</th>
                      <th className="py-3 px-3">Artikul / Kod</th>
                      <th className="py-3 px-3">Kategoriya</th>
                      <th className="py-3 px-3">Brend</th>
                      <th className="py-3 px-3">Kunlik Narx</th>
                      <th className="py-3 px-3">Garov</th>
                      <th className="py-3 px-3 text-center">Jami</th>
                      <th className="py-3 px-3 text-center">Ijarada</th>
                      <th className="py-3 px-3 text-center">Bo‘sh</th>
                      <th className="py-3 px-4 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTools.map(tool => {
                      const isAvailable = tool.availableStock > 0;
                      return (
                        <tr 
                          key={tool.id} 
                          onClick={() => setSelectedToolForDetail(tool)}
                          className="hover:bg-blue-50/40 transition cursor-pointer group"
                        >
                          <td className="py-3 px-4 flex items-center gap-3">
                            <AsyncToolImage
                              toolName={tool.name}
                              originalUrl={tool.imageUrl}
                              className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200 group-hover:scale-105 transition"
                            />
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-blue-600 transition">{tool.name}</p>
                              <span className="text-[11px] text-slate-400 font-mono">{tool.model || 'Standart'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <span className="block font-bold text-slate-800">{tool.article}</span>
                            <span className="text-[10px] text-blue-600 font-bold">{tool.code}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{tool.category}</td>
                          <td className="py-3 px-3 font-semibold text-slate-700">{tool.brand || '—'}</td>
                          <td className="py-3 px-3 font-extrabold text-blue-600">{formatMoney(tool.dailyPrice)}</td>
                          <td className="py-3 px-3 font-medium text-slate-700">{formatMoney(tool.depositPrice > 0 ? tool.depositPrice : calculateDepositPrice(0, tool.dailyPrice))}</td>
                          <td className="py-3 px-3 text-center font-bold text-slate-900">{tool.totalStock}</td>
                          <td className="py-3 px-3 text-center font-bold text-blue-600">{tool.rentedStock}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                              isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {tool.availableStock}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onOpenPrixodForTool(tool)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition"
                                title="Prixod qilish"
                              >
                                <ArrowDownToLine className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onRentTool(tool)}
                                disabled={!isAvailable}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                                  isAvailable
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                Ijara
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

        </div>

      </div>

      {/* TOOL DETAIL MODAL (Ustiga bosganda ochiladigan to'liq kartochka!) */}
      <ToolDetailModal
        tool={selectedToolForDetail}
        isOpen={!!selectedToolForDetail}
        onClose={() => setSelectedToolForDetail(null)}
        onRent={(tool) => onRentTool(tool)}
        onPrixod={(tool) => onOpenPrixodForTool(tool)}
        onSendToRepair={(tool) => onSendToRepair && onSendToRepair(tool)}
        onEdit={(tool) => {
          setSelectedToolForDetail(null);
          setSelectedToolForEdit(tool);
        }}
      />

      {/* EDIT TOOL MODAL */}
      <EditToolModal
        tool={selectedToolForEdit}
        isOpen={!!selectedToolForEdit}
        onClose={() => setSelectedToolForEdit(null)}
      />

    </div>
  );
};
