import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Phone, 
  CreditCard, 
  MapPin, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Wrench, 
  DollarSign, 
  Search, 
  ShieldCheck, 
  ArrowUpRight, 
  Check, 
  Printer, 
  Tag, 
  Layers, 
  TrendingUp, 
  AlertTriangle,
  History,
  UserCheck,
  Building,
  FileText
} from 'lucide-react';
import { Client, RentalOrder, RepairRecord, PaymentMethod, Tool } from '../types';
import { useRental } from '../context/RentalContext';
import { formatMoney, formatDate, getOverdueDays } from '../utils/formatters';

interface ClientActivityTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onNewOrderForClient: (client: Client) => void;
  onPrintReceipt?: (order: RentalOrder) => void;
}

type TimelineFilter = 'all' | 'rentals' | 'payments' | 'repairs';

interface TimelineEvent {
  id: string;
  type: 'rental_started' | 'rental_returned' | 'repair_claim' | 'debt_payment';
  date: string;
  timestamp: number;
  order?: RentalOrder;
  repair?: RepairRecord;
  title: string;
  subtitle?: string;
  statusBadge: {
    label: string;
    color: string;
  };
  amount?: number;
}

export const ClientActivityTimelineModal: React.FC<ClientActivityTimelineModalProps> = ({
  isOpen,
  onClose,
  client,
  onNewOrderForClient,
  onPrintReceipt
}) => {
  const { 
    orders, 
    repairs, 
    tools, 
    toggleRepairClaimSettled, 
    settleOrderDebt,
    sendToRepair 
  } = useRental();

  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Settle Debt Modal State
  const [debtModalOrder, setDebtModalOrder] = useState<RentalOrder | null>(null);
  const [debtPayAmount, setDebtPayAmount] = useState<number>(0);
  const [debtPayMethod, setDebtPayMethod] = useState<PaymentMethod>('cash');
  const [debtPayNote, setDebtPayNote] = useState('');

  // Add Repair Claim Modal State
  const [isAddClaimOpen, setIsAddClaimOpen] = useState(false);
  const [claimToolId, setClaimToolId] = useState('');
  const [claimQuantity, setClaimQuantity] = useState(1);
  const [claimDescription, setClaimDescription] = useState('');
  const [claimMasterName, setClaimMasterName] = useState('');
  const [claimCost, setClaimCost] = useState<number>(0);
  const [claimChargedAmount, setClaimChargedAmount] = useState<number>(0);
  const [claimSettledNow, setClaimSettledNow] = useState(false);
  const [claimOrderId, setClaimOrderId] = useState('');
  const [claimError, setClaimError] = useState('');

  if (!isOpen || !client) return null;

  // 1. Client Orders
  const clientPhoneClean = client.phone.replace(/\s+/g, '');
  const clientOrders = orders.filter(
    o => (client.id && o.client.id === client.id) ||
         o.client.phone.replace(/\s+/g, '') === clientPhoneClean ||
         (client.passport && o.client.passport.toUpperCase() === client.passport.toUpperCase())
  );

  // 2. Client Repair Claims
  const clientOrderIds = new Set(clientOrders.map(o => o.id));
  const clientOrderNumbers = new Set(clientOrders.map(o => o.orderNumber));

  const clientRepairs = repairs.filter(
    r => (client.id && r.clientId === client.id) ||
         (r.clientName && r.clientName.toLowerCase().trim() === client.fullName.toLowerCase().trim()) ||
         (r.orderId && clientOrderIds.has(r.orderId)) ||
         (r.orderNumber && clientOrderNumbers.has(r.orderNumber))
  );

  // 3. Financial Metrics & Totals
  const totalRentalsCount = clientOrders.length;
  const activeRentals = clientOrders.filter(o => o.status !== 'returned');
  const returnedRentals = clientOrders.filter(o => o.status === 'returned');
  const overdueRentals = clientOrders.filter(o => o.status === 'overdue');

  const totalInvoiced = clientOrders.reduce((sum, o) => sum + (o.totalRentAmount || 0), 0);
  const totalPaid = clientOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  const totalRemainingDebt = clientOrders.reduce((sum, o) => sum + (o.remainingAmount || 0), 0);

  // Repair Claims Totals
  const totalClaimsCount = clientRepairs.length;
  const totalClaimsAmount = clientRepairs.reduce((sum, r) => sum + (r.claimAmount || r.actualCost || r.estimatedCost || 0), 0);
  const unsettledClaims = clientRepairs.filter(r => !r.claimSettled);
  const unsettledClaimsAmount = unsettledClaims.reduce((sum, r) => sum + (r.claimAmount || r.actualCost || r.estimatedCost || 0), 0);

  // Trust Status
  const hasDebt = totalRemainingDebt > 0;
  const hasUnsettledClaims = unsettledClaims.length > 0;
  const hasOverdue = overdueRentals.length > 0;

  // Build unified chronological timeline events
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Order Creation / Active Events
    clientOrders.forEach(order => {
      const isOverdue = order.status === 'overdue';
      const isReturned = order.status === 'returned';

      events.push({
        id: `order-start-${order.id}`,
        type: 'rental_started',
        date: order.startDate,
        timestamp: new Date(order.startDate).getTime(),
        order,
        title: `Ijara berildi - Zakaz ${order.orderNumber}`,
        subtitle: `${order.items.length} turdagi asbob • ${order.totalDays} kunga`,
        statusBadge: isReturned
          ? { label: 'Qaytarilgan', color: 'bg-stone-100 text-stone-700 border-stone-200' }
          : isOverdue
          ? { label: 'Muddati o‘tgan (Kechikkan)', color: 'bg-red-100 text-red-800 border-red-200' }
          : { label: 'Hozir ijarada', color: 'bg-amber-100 text-amber-900 border-amber-300' },
        amount: order.totalRentAmount
      });

      // Order Return Event (if returned)
      if (order.status === 'returned' && order.actualReturnDate) {
        events.push({
          id: `order-return-${order.id}`,
          type: 'rental_returned',
          date: order.actualReturnDate,
          timestamp: new Date(order.actualReturnDate).getTime() + 1000, // slightly after start
          order,
          title: `Asboblar qaytarib olindi - Zakaz ${order.orderNumber}`,
          subtitle: order.penaltyAmount 
            ? `Kechikish jarimasi bilan qabul qilindi: +${formatMoney(order.penaltyAmount)}` 
            : 'Asboblar omborga to‘liq qabul qilindi',
          statusBadge: { label: 'Yopilgan', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
          amount: order.totalRentAmount + (order.penaltyAmount || 0)
        });
      }

      // Debt Payment Event (if partial or full settlement occurred)
      if (order.paidAmount > 0) {
        events.push({
          id: `order-pay-${order.id}`,
          type: 'debt_payment',
          date: order.actualReturnDate || order.startDate,
          timestamp: new Date(order.startDate).getTime() + 500,
          order,
          title: `To‘lov amalga oshirildi - ${order.orderNumber}`,
          subtitle: `To‘langan: ${formatMoney(order.paidAmount)} (${order.paymentMethod === 'card' ? 'Karta' : order.paymentMethod === 'transfer' ? 'Perevod' : 'Naqd'}) • Qoldiq: ${formatMoney(order.remainingAmount)}`,
          statusBadge: order.remainingAmount === 0 
            ? { label: 'To‘liq to‘langan', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
            : { label: `Qarz: ${formatMoney(order.remainingAmount)}`, color: 'bg-red-100 text-red-800 border-red-200' },
          amount: order.paidAmount
        });
      }
    });

    // Repair Claim Events
    clientRepairs.forEach(repair => {
      const claimVal = repair.claimAmount || repair.actualCost || repair.estimatedCost || 0;
      events.push({
        id: `repair-${repair.id}`,
        type: 'repair_claim',
        date: repair.sentDate,
        timestamp: new Date(repair.sentDate).getTime() + 2000,
        repair,
        title: `Ta‘mir/Nuqson da‘vosi - ${repair.toolName}`,
        subtitle: `Artikul: ${repair.toolArticle} • Nosozlik: "${repair.defectDescription}"`,
        statusBadge: repair.claimSettled
          ? { label: 'Da‘vo to‘langan (Qoplangan)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
          : { label: 'Qoplanmagan da‘vo', color: 'bg-rose-100 text-rose-800 border-rose-300' },
        amount: claimVal
      });
    });

    // Sort descending by date / timestamp
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }, [clientOrders, clientRepairs]);

  // Filtered Events
  const filteredEvents = timelineEvents.filter(ev => {
    if (activeFilter === 'rentals' && ev.type !== 'rental_started' && ev.type !== 'rental_returned') return false;
    if (activeFilter === 'payments' && ev.type !== 'debt_payment') return false;
    if (activeFilter === 'repairs' && ev.type !== 'repair_claim') return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = ev.title.toLowerCase().includes(term);
      const matchSub = ev.subtitle ? ev.subtitle.toLowerCase().includes(term) : false;
      const matchOrderNum = ev.order ? ev.order.orderNumber.toLowerCase().includes(term) : false;
      const matchTools = ev.order ? ev.order.items.some(i => i.toolName.toLowerCase().includes(term) || i.article.toLowerCase().includes(term)) : false;
      const matchRepairTool = ev.repair ? ev.repair.toolName.toLowerCase().includes(term) || ev.repair.toolArticle.toLowerCase().includes(term) : false;
      if (!matchTitle && !matchSub && !matchOrderNum && !matchTools && !matchRepairTool) return false;
    }

    return true;
  });

  // Handle Debt Settlement Submission
  const handleConfirmDebtPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtModalOrder) return;
    settleOrderDebt(debtModalOrder.id, Number(debtPayAmount) || 0, debtPayMethod, debtPayNote.trim());
    setDebtModalOrder(null);
  };

  // Open Debt Settle Modal
  const handleOpenSettleDebt = (order: RentalOrder) => {
    setDebtModalOrder(order);
    setDebtPayAmount(order.remainingAmount);
    setDebtPayMethod('cash');
    setDebtPayNote('Kassaga qabul qilindi');
  };

  // Open Add Repair Claim Modal
  const handleOpenAddClaim = () => {
    setClaimError('');
    // preselect first tool from client's orders or first tool in catalog
    const rentedToolIds = clientOrders.flatMap(o => o.items.map(i => i.toolId));
    const firstToolId = rentedToolIds[0] || (tools[0] ? tools[0].id : '');
    setClaimToolId(firstToolId);
    setClaimQuantity(1);
    setClaimDescription('');
    setClaimMasterName('Servis usta');
    setClaimCost(100000);
    setClaimChargedAmount(100000);
    setClaimSettledNow(false);
    setClaimOrderId(clientOrders[0]?.id || '');
    setIsAddClaimOpen(true);
  };

  // Handle Add Repair Claim Submission
  const handleConfirmAddClaim = (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError('');

    if (!claimToolId) {
      setClaimError('Iltimos, shikastlangan asbobni tanlang');
      return;
    }

    if (!claimDescription.trim()) {
      setClaimError('Nosozlik yoki shikastlanish tavsifini yozing');
      return;
    }

    const selectedTool = tools.find(t => t.id === claimToolId);
    const relatedOrder = clientOrders.find(o => o.id === claimOrderId);

    sendToRepair({
      toolId: claimToolId,
      quantity: Math.max(1, claimQuantity),
      defectDescription: claimDescription.trim(),
      masterName: claimMasterName.trim() || undefined,
      estimatedCost: Number(claimCost) || 0,
      clientId: client.id,
      clientName: client.fullName,
      orderId: relatedOrder?.id,
      orderNumber: relatedOrder?.orderNumber,
      claimAmount: Number(claimChargedAmount) || 0,
      claimSettled: claimSettledNow,
      claimType: 'damage'
    });

    setIsAddClaimOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-stone-50 rounded-3xl max-w-5xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* TOP BAR / CLIENT PROFILE HEADER */}
        <div className="bg-stone-900 text-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              {client.fullName.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-black text-lg sm:text-xl text-white tracking-tight">
                  {client.fullName}
                </h2>
                {hasDebt ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    Qarzdor: {formatMoney(totalRemainingDebt)}
                  </span>
                ) : hasUnsettledClaims ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-amber-400" />
                    {unsettledClaims.length} ta ochiq ta‘mir da‘vosi
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Hisob-kitoblar toza (A‘lo)
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-300">
                <a
                  href={`tel:${clientPhoneClean}`}
                  className="hover:text-amber-400 font-semibold flex items-center gap-1 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{client.phone}</span>
                </a>

                {client.passport && (
                  <span className="flex items-center gap-1 font-mono text-stone-300">
                    <CreditCard className="w-3.5 h-3.5 text-stone-400" />
                    <span>Pasport: {client.passport}</span>
                  </span>
                )}

                {client.address && (
                  <span className="flex items-center gap-1 text-stone-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px] sm:max-w-[300px]">{client.address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons & Close */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              onClick={() => {
                onClose();
                onNewOrderForClient(client);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Yangi Ijara</span>
            </button>

            <button
              onClick={handleOpenAddClaim}
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-rose-300 font-bold text-xs flex items-center gap-1.5 border border-stone-700 transition"
              title="Shikastlanish yoki nuqson da'vosi qayd etish"
            >
              <Wrench className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">+ Ta‘mir da‘vosi</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition"
              title="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AT-A-GLANCE METRICS CARDS */}
        <div className="p-4 sm:p-6 bg-white border-b border-stone-200 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            
            {/* 1. Rentals Summary */}
            <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Ijara Tarixi
                </span>
                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  {totalRentalsCount}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-stone-900">{totalRentalsCount}</span>
                <span className="text-xs font-semibold text-stone-500">ta buyurtma</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-stone-200/60 text-[11px]">
                <span className="text-amber-800 font-bold">{activeRentals.length} ta faol</span>
                <span className="text-stone-300">•</span>
                <span className="text-stone-600 font-medium">{returnedRentals.length} ta qaytgan</span>
                {overdueRentals.length > 0 && (
                  <>
                    <span className="text-stone-300">•</span>
                    <span className="text-rose-600 font-bold">{overdueRentals.length} ta kechikkan</span>
                  </>
                )}
              </div>
            </div>

            {/* 2. Financial & Payment Status */}
            <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  To‘lov Holati
                </span>
                {hasDebt ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                    Qarz bor
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3" /> To‘liq to‘langan
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-stone-500 font-semibold">Qoldiq qarz:</span>
                  <span className={`text-base font-black ${hasDebt ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {hasDebt ? formatMoney(totalRemainingDebt) : '0 so‘m'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500 mt-0.5">
                  <span>To‘langan: {formatMoney(totalPaid)}</span>
                  <span>Jami: {formatMoney(totalInvoiced)}</span>
                </div>
              </div>

              {hasDebt && clientOrders.find(o => o.remainingAmount > 0) && (
                <button
                  onClick={() => {
                    const debtOrder = clientOrders.find(o => o.remainingAmount > 0);
                    if (debtOrder) handleOpenSettleDebt(debtOrder);
                  }}
                  className="w-full py-1.5 px-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition"
                >
                  <CreditCard className="w-3 h-3" />
                  <span>Qarzni So‘ndirish</span>
                </button>
              )}
            </div>

            {/* 3. Repair & Damage Claims */}
            <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Ta‘mir & Nuqsonlar
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  hasUnsettledClaims 
                    ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                    : totalClaimsCount > 0 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-stone-100 text-stone-600'
                }`}>
                  {totalClaimsCount} ta holat
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-stone-500 font-semibold">Zarar da‘vosi:</span>
                  <span className="text-base font-black text-stone-900">
                    {formatMoney(totalClaimsAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500 mt-0.5">
                  <span>
                    {hasUnsettledClaims 
                      ? `Qoplanmagan: ${formatMoney(unsettledClaimsAmount)}` 
                      : totalClaimsCount > 0 
                      ? 'Barcha da‘volar to‘langan' 
                      : 'Nuqsonlar qayd etilmagan'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-[11px]">
                <span className="text-stone-500">Da‘volar holati:</span>
                <span className={hasUnsettledClaims ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {hasUnsettledClaims ? `${unsettledClaims.length} ta ochiq` : '0 ta qarz'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* TIMELINE CONTROLS & FILTER BAR */}
        <div className="px-4 sm:px-6 py-3 bg-white border-b border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Barchasi ({timelineEvents.length})</span>
            </button>

            <button
              onClick={() => setActiveFilter('rentals')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'rentals'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ijaralar ({clientOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveFilter('payments')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'payments'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>To‘lovlar & Qarz</span>
            </button>

            <button
              onClick={() => setActiveFilter('repairs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'repairs'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Ta‘mir da‘volari ({clientRepairs.length})</span>
            </button>
          </div>

          {/* Search inside Timeline */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Xronologiyadan qidirish..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-100 border border-stone-200 rounded-xl text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* TIMELINE FEED (SCROLLABLE) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-50/70 space-y-6">
          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-10 text-center space-y-3 max-w-md mx-auto my-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <History className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-stone-900">
                {searchTerm ? 'Qidiruv bo‘yicha hech qanday voqea topilmadi' : 'Faoliyat tarixi mavjud emas'}
              </h3>
              <p className="text-xs text-stone-500">
                {searchTerm 
                  ? 'Kiritilgan kalit so‘zni o‘zgartirib ko‘ring yoki filtrlarni tozalang' 
                  : 'Ushbu mijozga birinchi asbobni ijaraga berish orqali xronologiyani boshlang'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => {
                    onClose();
                    onNewOrderForClient(client);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Birinchi Ijarani Ochish</span>
                </button>
              )}
            </div>
          ) : (
            <div className="relative border-l-2 border-stone-200 ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-6">
              {filteredEvents.map(event => {
                const isRentalStart = event.type === 'rental_started';
                const isRentalReturn = event.type === 'rental_returned';
                const isRepair = event.type === 'repair_claim';
                const isPayment = event.type === 'debt_payment';

                return (
                  <div key={event.id} className="relative group">
                    
                    {/* Milestone Icon Node */}
                    <div className={`absolute -left-[27px] sm:-left-[35px] top-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${
                      isRentalStart 
                        ? 'bg-amber-500 text-stone-950' 
                        : isRentalReturn 
                        ? 'bg-emerald-600 text-white' 
                        : isRepair 
                        ? 'bg-rose-600 text-white' 
                        : 'bg-teal-600 text-white'
                    }`}>
                      {isRentalStart && <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                      {isRentalReturn && <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                      {isRepair && <Wrench className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                      {isPayment && <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                    </div>

                    {/* Timeline Event Card */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition space-y-3">
                      
                      {/* Event Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-stone-900">
                            {event.title}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${event.statusBadge.color}`}>
                            {event.statusBadge.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-stone-400 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                      </div>

                      {/* Event Subtitle / Description */}
                      {event.subtitle && (
                        <p className="text-xs text-stone-600">
                          {event.subtitle}
                        </p>
                      )}

                      {/* Specific Details based on Event Type */}
                      {/* A. Rental Order Started Details */}
                      {isRentalStart && event.order && (
                        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-100 text-xs space-y-2.5">
                          <div className="space-y-1.5">
                            <span className="font-bold text-[10px] uppercase text-stone-500 tracking-wider">
                              Berilgan asboblar:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {event.order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-stone-200/80">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-1 rounded">
                                      {item.article}
                                    </span>
                                    <span className="font-bold text-stone-800 truncate max-w-[150px]">
                                      {item.toolName}
                                    </span>
                                  </div>
                                  <span className="font-bold text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded text-[11px]">
                                    {item.quantity} dona
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-200/80 text-[11px]">
                            <div>
                              <span className="text-stone-400 block">Ijara muddati:</span>
                              <b className="text-stone-900">{formatDate(event.order.startDate)} - {formatDate(event.order.expectedReturnDate)}</b>
                            </div>
                            <div>
                              <span className="text-stone-400 block">Jami summa:</span>
                              <b className="text-stone-900">{formatMoney(event.order.totalRentAmount)}</b>
                            </div>
                            <div>
                              <span className="text-stone-400 block">Oldindan to‘langan:</span>
                              <b className="text-emerald-700">{formatMoney(event.order.paidAmount)}</b>
                            </div>
                            <div>
                              <span className="text-stone-400 block">Garov hujjati:</span>
                              <b className="text-stone-900 truncate block">{event.order.depositNote}</b>
                            </div>
                          </div>

                          {/* Quick Actions for Order */}
                          <div className="flex items-center justify-between pt-2 border-t border-stone-200/80">
                            {event.order.remainingAmount > 0 ? (
                              <div className="flex items-center gap-2">
                                <span className="text-rose-600 font-bold text-xs">
                                  Qoldiq to‘lov: {formatMoney(event.order.remainingAmount)}
                                </span>
                                <button
                                  onClick={() => handleOpenSettleDebt(event.order!)}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-xs"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Qarzni qabul qilish</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> To‘liq to‘langan
                              </span>
                            )}

                            {onPrintReceipt && (
                              <button
                                onClick={() => onPrintReceipt(event.order!)}
                                className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Chek</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* B. Rental Order Return Details */}
                      {isRentalReturn && event.order && (
                        <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100 text-xs space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-stone-600">
                              Qaytarilgan sana: <b>{formatDate(event.order.actualReturnDate || event.date)}</b>
                            </span>
                            {event.order.penaltyAmount ? (
                              <span className="text-red-700 font-bold">
                                Jarima undirildi: {formatMoney(event.order.penaltyAmount)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold">
                                O‘z vaqtida topshirildi
                              </span>
                            )}
                          </div>

                          {event.order.notes && (
                            <p className="text-[11px] text-stone-600 italic bg-white/70 p-2 rounded-lg border border-emerald-100">
                              Izoh: {event.order.notes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* C. Repair Claim Details */}
                      {isRepair && event.repair && (
                        <div className="bg-rose-50/40 rounded-xl p-3.5 border border-rose-100 text-xs space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <span className="text-stone-400 block text-[11px]">Asbob & Artikul:</span>
                              <b className="text-stone-900">{event.repair.toolName} ({event.repair.toolArticle})</b>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[11px]">Sarflangan / Kutilgan xarajat:</span>
                              <b className="text-stone-900">{formatMoney(event.repair.actualCost || event.repair.estimatedCost || 0)}</b>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[11px]">Mijozga yuklatilgan da‘vo:</span>
                              <b className="text-rose-700">{formatMoney(event.repair.claimAmount || 0)}</b>
                            </div>
                          </div>

                          <div className="bg-white p-2.5 rounded-lg border border-rose-100 text-[11px] space-y-1">
                            <span className="text-rose-900 font-bold block">Nuqson tavsifi:</span>
                            <p className="text-stone-700">{event.repair.defectDescription}</p>
                            {event.repair.masterName && (
                              <span className="text-stone-400 block pt-1">
                                Mas‘ul usta: <b className="text-stone-700">{event.repair.masterName}</b>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-semibold text-stone-600">Da‘vo to‘lovi:</span>
                              {event.repair.claimSettled ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  To‘langan (Qoplangan)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                  To‘lanmagan
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => toggleRepairClaimSettled(event.repair!.id)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                event.repair.claimSettled
                                  ? 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>
                                {event.repair.claimSettled ? 'To‘lanmagan deb qaytarish' : 'Mijoz to‘ladi deb belgilash'}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* D. Debt Payment Details */}
                      {isPayment && event.order && (
                        <div className="bg-teal-50/50 rounded-xl p-3.5 border border-teal-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="font-bold text-teal-950 block">
                              Ijara to‘lovi qabul qilindi: {formatMoney(event.amount || 0)}
                            </span>
                            <span className="text-stone-500 text-[11px]">
                              Buyurtma: {event.order.orderNumber} • To‘lov turi: {event.order.paymentMethod === 'card' ? 'Karta' : event.order.paymentMethod === 'transfer' ? 'Perevod' : 'Naqd'}
                            </span>
                          </div>

                          {event.order.remainingAmount > 0 && (
                            <button
                              onClick={() => handleOpenSettleDebt(event.order!)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold self-start sm:self-auto transition flex items-center gap-1 shadow-xs"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Qoldiq {formatMoney(event.order.remainingAmount)} ni to‘lash</span>
                            </button>
                          )}
                        </div>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL: Settle Order Debt */}
        {debtModalOrder && (
          <div className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">
                      Qarz To‘lovini Qabul Qilish
                    </h3>
                    <p className="text-xs text-stone-500">
                      Zakaz {debtModalOrder.orderNumber} - {client.fullName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDebtModalOrder(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmDebtPayment} className="space-y-3 text-xs">
                <div>
                  <span className="text-stone-500 block mb-1">Mavjud qoldiq qarz:</span>
                  <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl font-black text-rose-700 text-sm">
                    {formatMoney(debtModalOrder.remainingAmount)}
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Kiritilayotgan to‘lov summasi (so‘m) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={debtModalOrder.remainingAmount}
                    step="5000"
                    required
                    value={debtPayAmount}
                    onChange={e => setDebtPayAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    To‘lov usuli *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDebtPayMethod('cash')}
                      className={`py-2 rounded-xl border text-xs font-bold transition ${
                        debtPayMethod === 'cash'
                          ? 'bg-stone-900 text-amber-400 border-stone-900'
                          : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      💵 Naqd
                    </button>
                    <button
                      type="button"
                      onClick={() => setDebtPayMethod('card')}
                      className={`py-2 rounded-xl border text-xs font-bold transition ${
                        debtPayMethod === 'card'
                          ? 'bg-stone-900 text-amber-400 border-stone-900'
                          : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      💳 Karta
                    </button>
                    <button
                      type="button"
                      onClick={() => setDebtPayMethod('transfer')}
                      className={`py-2 rounded-xl border text-xs font-bold transition ${
                        debtPayMethod === 'transfer'
                          ? 'bg-stone-900 text-amber-400 border-stone-900'
                          : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      🏦 Perevod
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Izoh / Kassa kvitansiyasi
                  </label>
                  <input
                    type="text"
                    value={debtPayNote}
                    onChange={e => setDebtPayNote(e.target.value)}
                    placeholder="Masalan: Mijoz qoldiq qarzini to'liq to'ladi"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setDebtModalOrder(null)}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-sm"
                  >
                    To‘lovni Saqlash
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Add Repair / Damage Claim */}
        {isAddClaimOpen && (
          <div className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">
                      Mijozga Ta‘mir / Shikastlanish Da‘vosi Qayd Etish
                    </h3>
                    <p className="text-xs text-stone-500">
                      Mijoz: {client.fullName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddClaimOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {claimError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
                  {claimError}
                </div>
              )}

              <form onSubmit={handleConfirmAddClaim} className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Shikastlangan Asbobni tanlang *
                  </label>
                  <select
                    value={claimToolId}
                    onChange={e => setClaimToolId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  >
                    <option value="">-- Asbobni tanlang --</option>
                    {tools.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.article})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">
                      Zararlangan soni (dona) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={claimQuantity}
                      onChange={e => setClaimQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">
                      Tegishli zakaz (ixtiyoriy)
                    </label>
                    <select
                      value={claimOrderId}
                      onChange={e => setClaimOrderId(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900"
                    >
                      <option value="">-- Zakazsiz / Umumiy --</option>
                      {clientOrders.map(o => (
                        <option key={o.id} value={o.id}>
                          Zakaz {o.orderNumber} ({formatDate(o.startDate)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Nuqson va nosozlik tavsifi *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={claimDescription}
                    onChange={e => setClaimDescription(e.target.value)}
                    placeholder="Masalan: Asbob tushirib yuborilgan, reduktor korpusi singan va patron qimirlamayapti"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">
                      Kutilgan ta‘mir xarajati (so‘m)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={claimCost}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setClaimCost(val);
                        if (claimChargedAmount === 0 || claimChargedAmount === claimCost) {
                          setClaimChargedAmount(val);
                        }
                      }}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">
                      Mijozdan undiriladigan da‘vo (so‘m) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={claimChargedAmount}
                      onChange={e => setClaimChargedAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-rose-50 border border-rose-300 rounded-xl font-black text-rose-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Mas‘ul usta yoki servis ustaxonasi
                  </label>
                  <input
                    type="text"
                    value={claimMasterName}
                    onChange={e => setClaimMasterName(e.target.value)}
                    placeholder="Masalan: Otabek Usta - Bosh Servis"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900"
                  />
                </div>

                {/* Claim Settled Checkbox */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <label className="flex items-center gap-2 cursor-pointer text-stone-800 font-bold">
                    <input
                      type="checkbox"
                      checked={claimSettledNow}
                      onChange={e => setClaimSettledNow(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>Mijoz ushbu zararni joyida to‘ladi (Da‘vo qoplandi)</span>
                  </label>
                  <p className="text-[11px] text-stone-500 pl-6 mt-0.5">
                    Agar belgilanmasa, ushbu summa mijoz hisobida ochiq ta‘mir da‘vosi sifatida ko‘rinadi.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsAddClaimOpen(false)}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold shadow-sm"
                  >
                    Da‘voni Qayd Etish
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
