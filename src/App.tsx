import React, { useState } from 'react';
import { RentalProvider, useRental } from './context/RentalContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { BooqableSidebar, BooqableTab } from './components/BooqableSidebar';
import { BooqableHeader } from './components/BooqableHeader';
import { AlertBanner } from './components/AlertBanner';
import { ToolCatalog } from './components/ToolCatalog';
import { OrderManager } from './components/OrderManager';
import { CalendarView } from './components/CalendarView';
import { StockReceiptView } from './components/StockReceiptView';
import { ClientsView } from './components/ClientsView';
import { SellersView } from './components/SellersView';
import { DashboardStats } from './components/DashboardStats';
import { RepairsView } from './components/RepairsView';
import { DailyAuditView } from './components/DailyAuditView';
import { UnifiedOrderView } from './components/UnifiedOrderView';
import { BarcodeModal } from './components/BarcodeModal';
import { SettingsModal } from './components/SettingsModal';

import { NewOrderModal } from './components/NewOrderModal';
import { AddToolModal } from './components/AddToolModal';
import { ReminderModal } from './components/ReminderModal';
import { ReturnOrderModal } from './components/ReturnOrderModal';
import { ExtendOrderModal } from './components/ExtendOrderModal';
import { ReceiptPrintModal } from './components/ReceiptPrintModal';

import { Tool, RentalOrder, Client } from './types';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<BooqableTab>('catalog');
  const [orderInitialFilter, setOrderInitialFilter] = useState<'all' | 'today' | 'overdue' | 'active' | 'returned'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Layout state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [preSelectedTool, setPreSelectedTool] = useState<Tool | null>(null);
  const [preSelectedClient, setPreSelectedClient] = useState<Client | null>(null);
  const [repairPreSelectedTool, setRepairPreSelectedTool] = useState<Tool | null>(null);

  const [isAddToolOpen, setIsAddToolOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderTargetOrder, setReminderTargetOrder] = useState<RentalOrder | null>(null);

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnTargetOrder, setReturnTargetOrder] = useState<RentalOrder | null>(null);

  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [extendTargetOrder, setExtendTargetOrder] = useState<RentalOrder | null>(null);

  const [isReceiptPrintOpen, setIsReceiptPrintOpen] = useState(false);
  const [printTargetOrder, setPrintTargetOrder] = useState<RentalOrder | null>(null);

  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preSelectedSellerId, setPreSelectedSellerId] = useState<string | null>(null);

  // Quick Action Handlers
  const handleRentTool = (tool: Tool) => {
    setPreSelectedTool(tool);
    setPreSelectedClient(null);
    setPreSelectedSellerId(null);
    setIsNewOrderOpen(true);
  };

  const handleOpenPrixodForTool = (tool?: Tool) => {
    setPreSelectedTool(tool || null);
    setActiveTab('prixod');
  };

  const handleSendToolToRepair = (tool: Tool) => {
    setRepairPreSelectedTool(tool);
    setActiveTab('repairs');
  };

  const handleNewOrderForClient = (client: Client) => {
    setPreSelectedTool(null);
    setPreSelectedClient(client);
    setPreSelectedSellerId(null);
    setIsNewOrderOpen(true);
  };

  const handleNewOrderForSeller = (sellerId: string) => {
    setPreSelectedTool(null);
    setPreSelectedClient(null);
    setPreSelectedSellerId(sellerId);
    setIsNewOrderOpen(true);
  };

  const handleOpenReminders = (order?: RentalOrder) => {
    setReminderTargetOrder(order || null);
    setIsReminderOpen(true);
  };

  const handleOpenReturnOrder = (order: RentalOrder) => {
    setReturnTargetOrder(order);
    setIsReturnModalOpen(true);
  };

  const handleOpenExtendOrder = (order: RentalOrder) => {
    setExtendTargetOrder(order);
    setIsExtendModalOpen(true);
  };

  const handlePrintReceipt = (order: RentalOrder) => {
    setPrintTargetOrder(order);
    setIsReceiptPrintOpen(true);
  };

  const handleBannerFilter = (filter: 'today' | 'overdue') => {
    setOrderInitialFilter(filter);
    setActiveTab('orders');
  };

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-row selection:bg-blue-600 selection:text-white font-sans text-slate-800">
      
      {/* Booqable Main Left Sidebar */}
      <BooqableSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewOrder={() => {
          setPreSelectedTool(null);
          setIsNewOrderOpen(true);
        }}
        onOpenReminders={() => handleOpenReminders()}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        onOpenBarcodeModal={() => setIsBarcodeOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Viewport (offset by sidebar width on desktop) */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          isSidebarCollapsed ? 'lg:pl-[70px]' : 'lg:pl-60 sm:lg:pl-64'
        }`}
      >
        
        {/* Top Header Bar */}
        <BooqableHeader
          activeTab={activeTab}
          onNavigateToTab={setActiveTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onOpenNewOrder={() => {
            setPreSelectedTool(null);
            setPreSelectedClient(null);
            setIsNewOrderOpen(true);
          }}
          onRentTool={handleRentTool}
          onNewOrderForClient={handleNewOrderForClient}
          onOpenAddTool={() => setIsAddToolOpen(true)}
          onOpenReminders={() => handleOpenReminders()}
        />

        {/* Persistent Automatic Alerts Banner */}
        <div className="px-4 sm:px-6 pt-3">
          <AlertBanner
            onOpenReminders={() => handleOpenReminders()}
            onFilterOrders={handleBannerFilter}
          />
        </div>

        {/* View Content Area */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full">
          {activeTab === 'catalog' && (
            <ToolCatalog
              onRentTool={handleRentTool}
              onOpenAddTool={() => setIsAddToolOpen(true)}
              onOpenPrixodForTool={handleOpenPrixodForTool}
              onSendToRepair={handleSendToolToRepair}
              externalSearchTerm={searchTerm}
            />
          )}

          {activeTab === 'orders' && (
            <OrderManager
              onOpenNewOrder={() => {
                setPreSelectedTool(null);
                setPreSelectedClient(null);
                setIsNewOrderOpen(true);
              }}
              onOpenReturnOrder={handleOpenReturnOrder}
              onOpenExtendOrder={handleOpenExtendOrder}
              onOpenReminderModal={handleOpenReminders}
              onPrintReceipt={handlePrintReceipt}
              initialFilter={orderInitialFilter}
              externalSearchTerm={searchTerm}
            />
          )}

          {activeTab === 'daily-audit' && (
            <DailyAuditView
              onPrintReceipt={handlePrintReceipt}
              onOpenNewOrder={() => {
                setPreSelectedTool(null);
                setPreSelectedSellerId(null);
                setPreSelectedClient(null);
                setIsNewOrderOpen(true);
              }}
              onNavigateToTab={(tab) => setActiveTab(tab as BooqableTab)}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              onOpenNewOrder={() => {
                setPreSelectedTool(null);
                setPreSelectedClient(null);
                setIsNewOrderOpen(true);
              }}
              onOpenReturnOrder={handleOpenReturnOrder}
            />
          )}

          {activeTab === 'prixod' && (
            <StockReceiptView
              onOpenAddTool={() => setIsAddToolOpen(true)}
              preSelectedTool={preSelectedTool}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsView 
              onNewOrderForClient={handleNewOrderForClient}
              onPrintReceipt={handlePrintReceipt}
              externalSearchTerm={searchTerm}
            />
          )}

          {activeTab === 'sellers' && (
            <SellersView onNewOrderForSeller={handleNewOrderForSeller} />
          )}

          {activeTab === 'repairs' && (
            <RepairsView
              preSelectedTool={repairPreSelectedTool}
              onClearPreSelected={() => setRepairPreSelectedTool(null)}
            />
          )}

          {activeTab === 'logistics' && (
            <UnifiedOrderView
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {activeTab === 'stats' && (
            <DashboardStats />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-3.5 px-6 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 tracking-tight">ARENDA <span className="text-blue-600">INSTRUMENT</span></span>
              <span className="text-slate-300">•</span>
              <span>Asbob-uskunalar ijarasi va ombor nazorati tizimi</span>
            </p>
            <p className="text-slate-400">
              Avtomatik qaytarish eslatmalari faol • Barcha operatsiyalar himoyalangan
            </p>
          </div>
        </footer>

      </div>

      {/* Global Modals */}
      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => {
          setIsNewOrderOpen(false);
          setPreSelectedTool(null);
          setPreSelectedClient(null);
          setPreSelectedSellerId(null);
        }}
        preSelectedTool={preSelectedTool || undefined}
        preSelectedSellerId={preSelectedSellerId}
        preSelectedClient={preSelectedClient}
        onOrderCreated={(order) => {
          setPrintTargetOrder(order);
          setIsReceiptPrintOpen(true);
        }}
      />

      <AddToolModal
        isOpen={isAddToolOpen}
        onClose={() => setIsAddToolOpen(false)}
      />

      {reminderTargetOrder && (
        <ReminderModal
          isOpen={isReminderOpen}
          onClose={() => setIsReminderOpen(false)}
          order={reminderTargetOrder}
        />
      )}

      {returnTargetOrder && (
        <ReturnOrderModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          order={returnTargetOrder}
        />
      )}

      {extendTargetOrder && (
        <ExtendOrderModal
          isOpen={isExtendModalOpen}
          onClose={() => setIsExtendModalOpen(false)}
          order={extendTargetOrder}
        />
      )}

      {printTargetOrder && (
        <ReceiptPrintModal
          isOpen={isReceiptPrintOpen}
          onClose={() => setIsReceiptPrintOpen(false)}
          order={printTargetOrder}
        />
      )}

      <BarcodeModal
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
        onRentTool={handleRentTool}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RentalProvider>
        <AppContent />
      </RentalProvider>
    </AuthProvider>
  );
}
