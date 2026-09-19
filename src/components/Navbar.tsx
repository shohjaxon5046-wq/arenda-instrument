import React from 'react';
import { 
  Wrench, 
  Layers, 
  ClipboardList, 
  ArrowDownToLine, 
  Users, 
  BarChart3, 
  Bell, 
  Volume2, 
  VolumeX, 
  Plus, 
  AlertTriangle,
  LogOut,
  ShieldCheck,
  UserCheck,
  UserSquare
} from 'lucide-react';
import { useRental } from '../context/RentalContext';
import { useAuth } from '../context/AuthContext';

export type ActiveTab = 'catalog' | 'orders' | 'prixod' | 'clients' | 'sellers' | 'repairs' | 'stats';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewOrder: () => void;
  onOpenPrixod: () => void;
  onOpenReminders: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewOrder,
  onOpenPrixod,
  onOpenReminders,
}) => {
  const { 
    dueTodayOrders, 
    overdueOrders, 
    soundEnabled, 
    setSoundEnabled, 
    triggerSound,
    tools,
    repairs
  } = useRental();

  const { currentUser, logout } = useAuth();

  const totalAlerts = dueTodayOrders.length + overdueOrders.length;
  const inRepairCount = repairs.filter(r => r.status === 'in_repair').length;

  return (
    <header className="bg-white text-slate-800 border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('catalog')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-inner">
              <Wrench className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-blue-700 uppercase">
                  Instrument Arenda
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                Uskunalar ijarasi va prixod
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="nav-tab-catalog"
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-200/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Katalog</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'catalog' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-600'
              }`}>
                {tools.length}
              </span>
            </button>

            <button
              id="nav-tab-orders"
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold relative transition-all ${
                activeTab === 'orders'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-200/50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Zakazlar</span>
              {totalAlerts > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-red-500 text-white animate-pulse shadow-sm">
                  {totalAlerts}
                </span>
              )}
            </button>

            <button
              id="nav-tab-prixod"
              onClick={() => setActiveTab('prixod')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'prixod'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-200/50'
              }`}
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Prixod (Kirim)</span>
            </button>

            <button
              id="nav-tab-clients"
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'clients'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-200/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Mijozlar</span>
            </button>

            <button
              id="nav-tab-sellers"
              onClick={() => setActiveTab('sellers')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sellers'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-200/50'
              }`}
            >
              <UserSquare className="w-4 h-4" />
              <span className="hidden xl:inline">Sotuvchilar</span>
            </button>

            <button
              id="nav-tab-repairs"
              onClick={() => setActiveTab('repairs')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'repairs'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-200/50'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Ta’mirlash</span>
              {inRepairCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-amber-400 text-slate-900 shadow-sm">
                  {inRepairCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-stats"
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'stats'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-200/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Kassa & Statistika</span>
            </button>
          </nav>

          {/* Quick Actions & Notification Bell */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Sound Toggle */}
            <button
              id="btn-sound-toggle"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) triggerSound();
              }}
              title={soundEnabled ? "Ovozli eslatma yoqilgan" : "Ovoz o'chirilgan"}
              className={`p-2 rounded-lg border transition-colors ${
                soundEnabled 
                  ? 'bg-slate-100 text-amber-500 border-amber-200 hover:bg-slate-200' 
                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Automatic Reminder Bell Button */}
            <button
              id="btn-reminders-modal"
              onClick={onOpenReminders}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                totalAlerts > 0
                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Avtomatik Eslatmalar markazi"
            >
              <Bell className={`w-4 h-4 ${totalAlerts > 0 ? 'text-red-500 animate-bounce' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Eslatmalar</span>
              {totalAlerts > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500 text-white shadow-sm">
                  {totalAlerts}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">0</span>
              )}
            </button>

            {/* Quick Action: Prixod */}
            <button
              id="btn-quick-prixod"
              onClick={onOpenPrixod}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
            >
              <ArrowDownToLine className="w-4 h-4 text-emerald-500" />
              <span>+ Prixod</span>
            </button>

            {/* Quick Action: New Order */}
            <button
              id="btn-quick-new-order"
              onClick={onOpenNewOrder}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Yangi Zakaz</span>
            </button>

            {/* Admin Profile & Logout */}
            <div className="hidden sm:flex items-center pl-2 ml-1 border-l border-slate-200 gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-700 leading-none flex items-center gap-1">
                    <span>{currentUser?.fullName || 'Shoxjaxon'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Bosh Admin</span>
                </div>
              </div>

              <button
                id="btn-admin-logout"
                onClick={() => {
                  if (confirm('Tizimdan chiqishni xohlaysizmi?')) {
                    logout();
                  }
                }}
                title="Tizimdan chiqish (Logout)"
                className="p-2 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-200 text-xs overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-md font-medium shrink-0 ${
              activeTab === 'catalog' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Katalog ({tools.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium shrink-0 ${
              activeTab === 'orders' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Zakazlar
            {totalAlerts > 0 && (
              <span className="px-1 text-[10px] rounded-full bg-red-500 text-white font-bold">
                {totalAlerts}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('prixod')}
            className={`px-3 py-1.5 rounded-md font-medium shrink-0 ${
              activeTab === 'prixod' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Prixod
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-3 py-1.5 rounded-md font-medium shrink-0 ${
              activeTab === 'clients' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Mijozlar
          </button>
          <button
            onClick={() => setActiveTab('sellers')}
            className={`px-3 py-1.5 rounded-md font-medium shrink-0 ${
              activeTab === 'sellers' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Sotuvchilar
          </button>
          <button
            onClick={() => setActiveTab('repairs')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium shrink-0 ${
              activeTab === 'repairs' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Ta’mir
            {inRepairCount > 0 && (
              <span className="px-1 text-[10px] rounded-full bg-amber-400 text-slate-900 font-bold shadow-sm">
                {inRepairCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded-md font-medium shrink-0 ${
              activeTab === 'stats' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Kassa
          </button>

          {/* Mobile logout */}
          <button
            onClick={() => {
              if (confirm('Tizimdan chiqishni xohlaysizmi?')) {
                logout();
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium shrink-0 bg-slate-50 text-red-500 border border-slate-200 ml-auto hover:bg-red-50"
            title="Chiqish"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Chiqish</span>
          </button>
        </div>


      </div>
    </header>
  );
};
