import React, { useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  ClipboardList, 
  Users, 
  Package, 
  UserSquare, 
  ArrowDownToLine, 
  Wrench, 
  QrCode, 
  Settings, 
  LogOut, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Rocket, 
  Bell, 
  Volume2, 
  VolumeX,
  Layers,
  Sparkles,
  CalendarCheck2,
  Truck
} from 'lucide-react';
import { useRental } from '../context/RentalContext';
import { useAuth } from '../context/AuthContext';

export type BooqableTab = 
  | 'catalog' 
  | 'orders' 
  | 'daily-audit'
  | 'calendar' 
  | 'clients' 
  | 'sellers' 
  | 'prixod' 
  | 'repairs' 
  | 'stats'
  | 'logistics';

interface BooqableSidebarProps {
  activeTab: BooqableTab;
  setActiveTab: (tab: BooqableTab) => void;
  onOpenNewOrder: () => void;
  onOpenReminders: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onOpenBarcodeModal: () => void;
  onOpenSettingsModal: () => void;
  onToggleAssistant?: () => void;
}

export const BooqableSidebar: React.FC<BooqableSidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewOrder,
  onOpenReminders,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onOpenBarcodeModal,
  onOpenSettingsModal
}) => {
  const { 
    dueTodayOrders, 
    overdueOrders, 
    repairs, 
    soundEnabled, 
    setSoundEnabled,
    triggerSound
  } = useRental();
  const { currentUser, logout } = useAuth();

  const totalAlerts = dueTodayOrders.length + overdueOrders.length;
  const inRepairCount = repairs.filter(r => r.status === 'in_repair').length;

  const handleNavClick = (tab: BooqableTab) => {
    setActiveTab(tab);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const navItems = [
    {
      id: 'stats',
      label: 'Boshqaruv paneli',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'calendar',
      label: 'Taqvim',
      icon: Calendar,
      badge: null
    },
    {
      id: 'orders',
      label: 'Buyurtmalar',
      icon: ClipboardList,
      badge: totalAlerts > 0 ? totalAlerts : null,
      badgeColor: 'bg-red-500 text-white'
    },
    {
      id: 'daily-audit',
      label: 'Ombor qoldig‘i',
      icon: CalendarCheck2,
      badge: null
    },
    {
      id: 'clients',
      label: 'Mijozlar',
      icon: Users,
      badge: null
    },
    {
      id: 'catalog',
      label: 'Asbob-uskunalar',
      icon: Package,
      badge: null
    },
    {
      id: 'sellers',
      label: 'Sotuvchilar',
      icon: UserSquare,
      badge: null
    },
    {
      id: 'prixod',
      label: 'Xaridlar',
      icon: ArrowDownToLine,
      badge: null
    },
    {
      id: 'logistics',
      label: 'Yagona Buyurtma Paneli',
      icon: Truck,
      badge: 'ALL-IN-ONE',
      badgeColor: 'bg-blue-600 text-white font-black'
    },
    {
      id: 'repairs',
      label: 'Ta’mirlash',
      icon: Wrench,
      badge: inRepairCount > 0 ? inRepairCount : null,
      badgeColor: 'bg-amber-500 text-white'
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-200 flex flex-col transition-all duration-200 select-none ${
          isCollapsed ? 'w-[70px]' : 'w-60 sm:w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        
        {/* Brand Header */}
        <div className="h-14 border-b border-slate-100 px-3.5 flex items-center justify-between shrink-0">
          <div 
            onClick={() => handleNavClick('catalog')} 
            className="flex items-center gap-2.5 cursor-pointer overflow-hidden group"
            title="ARENDA INSTRUMENT"
          >
            {/* Custom Arenda Instrument Geometric Tool Logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20 ring-1 ring-blue-400/30 group-hover:scale-105 transition">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                {/* Hexagonal Technical Tool Badge */}
                <path d="M18 3L32 10.5V25.5L18 33L4 25.5V10.5L18 3Z" stroke="#93C5FD" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(255,255,255,0.06)"/>
                {/* Stylized 'A' + Industrial Caliper / Wrench Geometry */}
                <path d="M13 25L18 10.5L23 25" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 20.5H21" stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round"/>
                {/* Precision Center Pin */}
                <circle cx="18" cy="7" r="1.5" fill="#FBBF24" />
              </svg>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0 leading-none">
                <div className="flex items-center gap-1">
                  <span className="font-black text-sm text-slate-900 tracking-tight">ARENDA</span>
                  <span className="px-1 py-0.2 rounded text-[8px] font-black bg-blue-50 text-blue-700 border border-blue-200">PRO</span>
                </div>
                <span className="font-black text-[10px] text-blue-600 tracking-[0.15em] uppercase mt-1">
                  INSTRUMENT
                </span>
              </div>
            )}
          </div>

          {/* Collapse toggle button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title={isCollapsed ? "Kengaytirish" : "Yig'ish"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="p-3 shrink-0">
          <button
            onClick={onOpenNewOrder}
            className={`w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs shadow-blue-500/20 transition-all active:scale-98 flex items-center justify-center gap-2 ${
              isCollapsed ? 'px-0' : 'px-3'
            }`}
            title="Yangi buyurtma yaratish"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            {!isCollapsed && <span>Yangi buyurtma</span>}
          </button>
        </div>

        {/* Setup Progress notification (as in screenshot) */}
        {!isCollapsed && (
          <div className="mx-3 mb-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <Rocket className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                Sozlashni davom ettirish
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                <span>9/11 yakunlandi</span>
                <span className="text-blue-600 font-bold">82%</span>
              </div>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-1 overflow-hidden">
                <div className="bg-blue-600 h-1 rounded-full w-[82%]" />
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-1 no-scrollbar">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as BooqableTab)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}

                {!isCollapsed && item.badge !== null && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                    {item.badge}
                  </span>
                )}

                {isCollapsed && item.badge !== null && (
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Utility Tools & User Profile */}
        <div className="border-t border-slate-100 p-2 space-y-1 shrink-0 bg-slate-50/50">
          
          {/* Barcode scanner */}
          <button
            onClick={onOpenBarcodeModal}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Shtrix-kodni skanerlash"
          >
            <QrCode className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCollapsed && <span className="flex-1 text-left truncate">Shtrix-kod skaneri</span>}
          </button>

          {/* Reminders Bell */}
          <button
            onClick={onOpenReminders}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
              totalAlerts > 0 ? 'text-red-600 bg-red-50/70 font-semibold' : 'text-slate-600 hover:bg-slate-100'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="Eslatmalar"
          >
            <Bell className={`w-4 h-4 shrink-0 ${totalAlerts > 0 ? 'text-red-500 animate-bounce' : 'text-slate-500'}`} />
            {!isCollapsed && (
              <div className="flex items-center justify-between flex-1">
                <span>Eslatmalar</span>
                {totalAlerts > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold bg-red-500 text-white rounded-full">
                    {totalAlerts}
                  </span>
                )}
              </div>
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) triggerSound();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title={soundEnabled ? "Ovozli bildirishnoma yoqilgan" : "Ovoz o'chirilgan"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            {!isCollapsed && (
              <span className="text-left flex-1">
                {soundEnabled ? 'Ovoz: Yoqilgan' : 'Ovoz: O‘chiq'}
              </span>
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettingsModal}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Sozlamalar"
          >
            <Settings className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCollapsed && <span className="flex-1 text-left">Sozlamalar</span>}
          </button>

          {/* User Profile Footer (as seen in screenshot: orange circle with "S", "shohjaxon nuriddinov") */}
          <div className="pt-2 border-t border-slate-200/60 mt-1">
            <div className={`flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition ${
              isCollapsed ? 'justify-center p-1' : ''
            }`}>
              {/* Orange circle with 'S' matching the screenshot! */}
              <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                S
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {currentUser?.fullName || 'shohjaxon nuriddinov'}
                  </p>
                  <p className="text-[10px] text-slate-400">Admin</p>
                </div>
              )}

              {!isCollapsed && (
                <button
                  onClick={() => {
                    if (confirm('Tizimdan chiqishni xohlaysizmi?')) {
                      logout();
                    }
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Chiqish"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        </div>

      </aside>
    </>
  );
};
