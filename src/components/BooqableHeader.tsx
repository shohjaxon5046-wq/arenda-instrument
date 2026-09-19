import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Menu, 
  Search, 
  Plus, 
  Package, 
  ClipboardList, 
  Calendar, 
  CalendarCheck2,
  Users, 
  UserSquare, 
  ArrowDownToLine, 
  Wrench, 
  BarChart3,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Truck,
  ArrowRight,
  User,
  Hash,
  CornerDownLeft,
  X
} from 'lucide-react';
import { BooqableTab } from './BooqableSidebar';
import { useRental } from '../context/RentalContext';
import { Tool, Client } from '../types';
import { formatMoney } from '../utils/formatters';

interface BooqableHeaderProps {
  activeTab: BooqableTab;
  onNavigateToTab?: (tab: BooqableTab) => void;
  onOpenMobileMenu: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onOpenNewOrder: () => void;
  onOpenAddTool: () => void;
  onOpenReminders: () => void;
  onRentTool?: (tool: Tool) => void;
  onNewOrderForClient?: (client: Client) => void;
  onToggleAssistant?: () => void;
  isAssistantOpen?: boolean;
}

// Text matching component that cleanly highlights search terms
interface HighlightMatchProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

const HighlightMatch: React.FC<HighlightMatchProps> = ({
  text,
  query,
  className = '',
  highlightClassName = 'bg-amber-100 text-amber-900 font-bold px-0.5 rounded-xs'
}) => {
  if (!text || !query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const rawWords = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (rawWords.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Escape special regex characters
  const escapedPattern = rawWords
    .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  const regex = new RegExp(`(${escapedPattern})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const isMatch = rawWords.includes(part.toLowerCase());
        return isMatch ? (
          <mark key={i} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        );
      })}
    </span>
  );
};

export const BooqableHeader: React.FC<BooqableHeaderProps> = ({
  activeTab,
  onNavigateToTab,
  onOpenMobileMenu,
  searchTerm,
  setSearchTerm,
  onOpenNewOrder,
  onOpenAddTool,
  onOpenReminders,
  onRentTool,
  onNewOrderForClient
}) => {
  const { dueTodayOrders, overdueOrders, tools, clients, orders } = useRental();
  const totalAlerts = dueTodayOrders.length + overdueOrders.length;

  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter tools and clients based on the search query
  const query = searchTerm.trim().toLowerCase();
  const queryWords = useMemo(() => query.split(/\s+/).filter(Boolean), [query]);

  const matchingTools = useMemo(() => {
    if (!query) return [];
    return tools
      .filter(tool => {
        const name = (tool.name || '').toLowerCase();
        const brand = (tool.brand || '').toLowerCase();
        const article = (tool.article || '').toLowerCase();
        const category = (tool.category || '').toLowerCase();
        return queryWords.every(word =>
          name.includes(word) || brand.includes(word) || article.includes(word) || category.includes(word)
        );
      })
      .slice(0, 5);
  }, [tools, query, queryWords]);

  const matchingClients = useMemo(() => {
    if (!query) return [];
    return clients
      .filter(client => {
        const name = (client.fullName || '').toLowerCase();
        const phone = (client.phone || '').replace(/\s+/g, '');
        const passport = (client.passport || '').toLowerCase();
        const address = (client.address || '').toLowerCase();
        return queryWords.every(word => {
          const cleanWord = word.replace(/\s+/g, '');
          return name.includes(word) || phone.includes(cleanWord) || passport.includes(word) || address.includes(word);
        });
      })
      .slice(0, 5);
  }, [clients, query, queryWords]);

  // Combined flat list of suggestions for keyboard navigation
  type SuggestionItem = 
    | { type: 'tool'; data: Tool }
    | { type: 'client'; data: Client };

  const suggestions = useMemo<SuggestionItem[]>(() => {
    return [
      ...matchingTools.map(t => ({ type: 'tool' as const, data: t })),
      ...matchingClients.map(c => ({ type: 'client' as const, data: c }))
    ];
  }, [matchingTools, matchingClients]);

  // Reset selected index whenever the search term changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchTerm]);

  const isDropdownOpen = isFocused && query.length > 0;

  const handleSelectTool = (tool: Tool) => {
    setSearchTerm(tool.name);
    setIsFocused(false);
    onNavigateToTab?.('catalog');
  };

  const handleSelectClient = (client: Client) => {
    setSearchTerm(client.fullName);
    setIsFocused(false);
    onNavigateToTab?.('clients');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length === 0) return;
      setSelectedIndex(prev => (prev + 1 >= suggestions.length ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length === 0) return;
      setSelectedIndex(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        const item = suggestions[selectedIndex];
        if (item.type === 'tool') {
          handleSelectTool(item.data);
        } else {
          handleSelectClient(item.data);
        }
      } else {
        // Submit search on current page & close dropdown
        setIsFocused(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const getPageInfo = () => {
    switch (activeTab) {
      case 'catalog':
        return { title: 'Asbob-uskunalar', icon: Package };
      case 'orders':
        return { title: 'Buyurtmalar', icon: ClipboardList };
      case 'daily-audit':
        return { title: 'Ombor qoldig‘i', icon: CalendarCheck2 };
      case 'calendar':
        return { title: 'Taqvim', icon: Calendar };
      case 'clients':
        return { title: 'Mijozlar', icon: Users };
      case 'sellers':
        return { title: 'Sotuvchilar (Xodimlar)', icon: UserSquare };
      case 'prixod':
        return { title: 'Xaridlar (Kirim)', icon: ArrowDownToLine };
      case 'repairs':
        return { title: 'Ta’mirlash va Servis', icon: Wrench };
      case 'logistics':
        return { title: 'Yagona Buyurtma Paneli (Arenda, Logistika, Gruzchik & Musor)', icon: Truck };
      case 'stats':
        return { title: 'Boshqaruv paneli va Statistika', icon: BarChart3 };
      default:
        return { title: 'Boshqaruv', icon: Package };
    }
  };

  const { title, icon: Icon } = getPageInfo();

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
      
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          title="Menyu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/80">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Middle: Universal Search Bar with Auto-Complete Dropdown */}
      <div 
        ref={searchContainerRef}
        className="flex-1 max-w-xs sm:max-w-md lg:max-w-lg mx-3 sm:mx-4 relative"
      >
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Qidiruv (uskuna, mijoz, kod, pasport)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 placeholder:text-slate-400 transition shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setIsFocused(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-0.5"
              title="Tozalash"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Auto-complete Dropdown */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 sm:min-w-[460px] lg:min-w-[500px] mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden text-left animate-in fade-in-0 zoom-in-95 duration-100">
            
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
              
              {/* Tool Suggestions Section */}
              {matchingTools.length > 0 && (
                <div>
                  <div className="px-3.5 py-2 bg-slate-50/90 flex items-center justify-between border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <Package className="w-3.5 h-3.5" />
                      <span>Asbob-uskunalar</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 font-mono">
                      {matchingTools.length} ta natija
                    </span>
                  </div>

                  <div className="divide-y divide-slate-50">
                    {matchingTools.map((tool, idx) => {
                      const isSelected = selectedIndex === idx;
                      const availableStock = Math.max(0, tool.totalStock - (tool.rentedStock || 0) - (tool.inRepairStock || 0));

                      return (
                        <div
                          key={tool.id}
                          onClick={() => handleSelectTool(tool)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors group ${
                            isSelected ? 'bg-blue-50/90' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                              {tool.imageUrl ? (
                                <img
                                  src={tool.imageUrl}
                                  alt={tool.name}
                                  className="w-full h-full object-cover rounded-lg"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Package className="w-4 h-4" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                <HighlightMatch text={tool.name} query={searchTerm} />
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                {tool.brand && (
                                  <span className="font-medium text-slate-700">
                                    <HighlightMatch text={tool.brand} query={searchTerm} />
                                  </span>
                                )}
                                {tool.brand && <span className="text-slate-300">•</span>}
                                <span className="font-mono text-slate-500">
                                  <HighlightMatch text={tool.article} query={searchTerm} />
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-900">
                                {formatMoney(tool.dailyPrice)}<span className="text-[10px] text-slate-400 font-normal">/kun</span>
                              </p>
                              <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                                availableStock > 0 
                                  ? 'bg-emerald-50 text-emerald-700' 
                                  : 'bg-amber-50 text-amber-700'
                              }`}>
                                {availableStock > 0 ? `${availableStock} ta bo'sh` : 'Band'}
                              </span>
                            </div>

                            {onRentTool && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsFocused(false);
                                  onRentTool(tool);
                                }}
                                className="opacity-0 group-hover:opacity-100 sm:flex items-center gap-1 px-2 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-2xs"
                                title="Tezkor ijaraga rasmiylashtirish"
                              >
                                <span>Ijaraga</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Client Suggestions Section */}
              {matchingClients.length > 0 && (
                <div>
                  <div className="px-3.5 py-2 bg-slate-50/90 flex items-center justify-between border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5 text-indigo-600">
                      <Users className="w-3.5 h-3.5" />
                      <span>Mijozlar</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 font-mono">
                      {matchingClients.length} ta natija
                    </span>
                  </div>

                  <div className="divide-y divide-slate-50">
                    {matchingClients.map((client, cIdx) => {
                      const overallIndex = matchingTools.length + cIdx;
                      const isSelected = selectedIndex === overallIndex;
                      const clientOrderCount = orders.filter(
                        o => o.client.phone.replace(/\s+/g, '') === client.phone.replace(/\s+/g, '') ||
                             (client.passport && o.client.passport === client.passport)
                      ).length;

                      return (
                        <div
                          key={client.id}
                          onClick={() => handleSelectClient(client)}
                          onMouseEnter={() => setSelectedIndex(overallIndex)}
                          className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors group ${
                            isSelected ? 'bg-indigo-50/90' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-700 font-bold text-xs">
                              {client.fullName ? client.fullName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                <HighlightMatch text={client.fullName} query={searchTerm} />
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span className="font-mono text-slate-600">
                                  <HighlightMatch text={client.phone} query={searchTerm} />
                                </span>
                                {client.passport && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="font-mono text-slate-400">
                                      <HighlightMatch text={client.passport} query={searchTerm} />
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {clientOrderCount > 0 ? `${clientOrderCount} ta ijara` : 'Yangi mijoz'}
                            </span>

                            {onNewOrderForClient && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsFocused(false);
                                  onNewOrderForClient(client);
                                }}
                                className="opacity-0 group-hover:opacity-100 sm:flex items-center gap-1 px-2 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition shadow-2xs"
                                title="Ushbu mijozga yangi shartnoma ochish"
                              >
                                <span>Buyurtma</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state when no matches found */}
              {matchingTools.length === 0 && matchingClients.length === 0 && (
                <div className="p-6 text-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                    <Search className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    "{searchTerm}" bo‘yicha asbob yoki mijoz topilmadi
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Nomini, brendini, artikul yoki pasport raqamini tekshirib ko‘ring.
                  </p>
                </div>
              )}

            </div>

            {/* Footer with keyboard shortcuts */}
            <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded-xs bg-white border border-slate-200 text-slate-600 font-mono shadow-2xs">↑</kbd>
                  <kbd className="px-1 py-0.5 rounded-xs bg-white border border-slate-200 text-slate-600 font-mono shadow-2xs">↓</kbd>
                  <span>Tanlash</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded-xs bg-white border border-slate-200 text-slate-600 font-mono shadow-2xs">↵</kbd>
                  <span>O‘tish</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded-xs bg-white border border-slate-200 text-slate-600 font-mono shadow-2xs">Esc</kbd>
                  <span>Yopish</span>
                </span>
              </div>

              {activeTab !== 'catalog' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsFocused(false);
                    onNavigateToTab?.('catalog');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Katalogda ko‘rish →
                </button>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Right: Quick alerts, action button and assistant toggle */}
      <div className="flex items-center gap-2 shrink-0">
        
        {/* Reminders Button */}
        <button
          onClick={onOpenReminders}
          className={`relative p-2 rounded-lg border transition ${
            totalAlerts > 0
              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
          title={totalAlerts > 0 ? `${totalAlerts} ta eslatma bor` : "Eslatmalar yo'q"}
        >
          <Bell className={`w-4 h-4 ${totalAlerts > 0 ? 'text-red-500 animate-bounce' : 'text-slate-500'}`} />
          {totalAlerts > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-white font-bold text-[9px] shadow-xs">
              {totalAlerts}
            </span>
          )}
        </button>

        {/* Action Button: context aware */}
        {activeTab === 'catalog' ? (
          <button
            onClick={onOpenAddTool}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yangi mahsulot</span>
          </button>
        ) : (
          <button
            onClick={onOpenNewOrder}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yangi buyurtma</span>
          </button>
        )}

      </div>

    </header>
  );
};

