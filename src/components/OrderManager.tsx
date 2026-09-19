import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Phone, 
  Send, 
  Printer, 
  ArrowRightLeft, 
  CalendarPlus, 
  Trash2, 
  User, 
  ShieldAlert, 
  FileText,
  DollarSign,
  Tag,
  Gift,
  Download
} from 'lucide-react';
import { RentalOrder, OrderStatus } from '../types';
import { useRental } from '../context/RentalContext';
import { 
  formatMoney, 
  formatDate, 
  getOverdueDays, 
  isDueToday, 
  getTodayDateString, 
  getYesterdayDateString 
} from '../utils/formatters';
import { generateOrderPDF } from '../utils/pdfGenerator';
import { AsyncToolImage } from './AsyncToolImage';

interface OrderManagerProps {
  onOpenNewOrder: () => void;
  onOpenReturnOrder: (order: RentalOrder) => void;
  onOpenExtendOrder: (order: RentalOrder) => void;
  onOpenReminderModal: (order?: RentalOrder) => void;
  onPrintReceipt: (order: RentalOrder) => void;
  initialFilter?: 'all' | 'today' | 'overdue' | 'active' | 'returned';
  externalSearchTerm?: string;
}

export const OrderManager: React.FC<OrderManagerProps> = ({
  onOpenNewOrder,
  onOpenReturnOrder,
  onOpenExtendOrder,
  onOpenReminderModal,
  onPrintReceipt,
  initialFilter = 'all',
  externalSearchTerm = ''
}) => {
  const { orders, dueTodayOrders, overdueOrders, deleteOrder, sellers } = useRental();
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'overdue' | 'active' | 'returned'>(initialFilter);
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);

  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  const filteredOrders = orders.filter(order => {
    // Search filter
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client.phone.includes(searchTerm) ||
      order.client.passport.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => item.toolName.toLowerCase().includes(searchTerm.toLowerCase()));

    // Date filter (matches start date, return date, or created date)
    const matchesDate = !dateFilter || 
      order.startDate === dateFilter || 
      order.expectedReturnDate === dateFilter || 
      order.actualReturnDate === dateFilter;

    // Tab filter
    let matchesTab = true;
    if (activeTab === 'today') {
      matchesTab = order.status !== 'returned' && isDueToday(order.expectedReturnDate);
    } else if (activeTab === 'overdue') {
      matchesTab = order.status === 'overdue' || (order.status !== 'returned' && getOverdueDays(order.expectedReturnDate) > 0);
    } else if (activeTab === 'active') {
      matchesTab = order.status === 'active' && !isDueToday(order.expectedReturnDate);
    } else if (activeTab === 'returned') {
      matchesTab = order.status === 'returned';
    }

    return matchesSearch && matchesDate && matchesTab;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-stone-900 tracking-tight">
              Mijozlar buyurtmalari & Ijara jurnali
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
              {orders.length} ta buyurtma
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Kim qaysi asbobni nechta olgan, qachon qaytarishi, garov va to‘lov summasi
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              import('../utils/exportExcel').then(({ exportOrdersToExcel }) => exportOrdersToExcel(orders, sellers || []));
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
          >
            <Download className="w-4 h-4 stroke-[2]" />
            <span className="hidden sm:inline">Excelga yuklash</span>
          </button>
          
          <button
            id="btn-create-order-page"
            onClick={onOpenNewOrder}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Yangi buyurtma ochish</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl font-bold transition shrink-0 ${
              activeTab === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Barchasi ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('today')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition shrink-0 ${
              activeTab === 'today'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
            }`}
          >
            <span>🔔 Bugun qaytishi kerak</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-600 text-white">
              {dueTodayOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('overdue')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition shrink-0 ${
              activeTab === 'overdue'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-100 text-red-900 hover:bg-red-200'
            }`}
          >
            <span>⚠️ Kechikkanlar</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-700 text-white">
              {overdueOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-2 rounded-xl font-bold transition shrink-0 ${
              activeTab === 'active'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            🟢 Faol ijaralar ({orders.filter(o => o.status === 'active' && !isDueToday(o.expectedReturnDate)).length})
          </button>

          <button
            onClick={() => setActiveTab('returned')}
            className={`px-3.5 py-2 rounded-xl font-bold transition shrink-0 ${
              activeTab === 'returned'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            ✅ Qaytarilganlar ({orders.filter(o => o.status === 'returned').length})
          </button>
        </div>

        {/* Search Input & Date Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <div className="relative md:col-span-8">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="orders-search-input"
              type="text"
              placeholder="Mijoz ismi, telefon raqami (+998...), pasporti yoki buyurtma raqami bo‘yicha qidirish..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white text-stone-900 transition"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Specific Date Filter */}
          <div className="md:col-span-4 flex items-center gap-1.5 bg-stone-50 p-1 rounded-xl border border-stone-200 text-xs">
            <Calendar className="w-4 h-4 text-stone-400 ml-2 shrink-0" />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden flex-1"
            />
            {dateFilter ? (
              <button
                onClick={() => setDateFilter('')}
                className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded"
                title="Sana filtrini tozalash"
              >
                Tozalash
              </button>
            ) : (
              <div className="flex items-center gap-1 pr-1">
                <button
                  onClick={() => setDateFilter(todayStr)}
                  className="px-2 py-1 text-[10px] font-bold bg-white text-stone-700 hover:bg-stone-200 rounded border border-stone-200"
                >
                  Bugun
                </button>
                <button
                  onClick={() => setDateFilter(yesterdayStr)}
                  className="px-2 py-1 text-[10px] font-bold bg-white text-stone-700 hover:bg-stone-200 rounded border border-stone-200"
                >
                  Kecha
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-stone-200">
            <FileText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-stone-700">Hech qanday buyurtma topilmadi</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
              Ushbu filtr bo‘yicha buyurtmalar mavjud emas yoki qidiruv natijasi yo‘q.
            </p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isDue = isDueToday(order.expectedReturnDate) && order.status !== 'returned';
            const overdueDays = getOverdueDays(order.expectedReturnDate);
            const isOverdue = overdueDays > 0 && order.status !== 'returned';
            const isReturned = order.status === 'returned';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-xs hover:shadow-md ${
                  isOverdue
                    ? 'border-red-300 ring-1 ring-red-200'
                    : isDue
                    ? 'border-amber-300 ring-1 ring-amber-200'
                    : 'border-stone-200'
                }`}
              >
                {/* Order Top Bar */}
                <div className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${
                  isOverdue
                    ? 'bg-red-50/70 border-red-100 text-red-950'
                    : isDue
                    ? 'bg-amber-50/70 border-amber-100 text-amber-950'
                    : isReturned
                    ? 'bg-stone-50 border-stone-100 text-stone-600'
                    : 'bg-stone-50 border-stone-100 text-stone-900'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-900 shadow-2xs">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs text-stone-500">
                      Olingan: <b>{formatDate(order.startDate)}</b>
                    </span>
                  </div>

                  {/* Dynamic Status Pill */}
                  <div className="flex items-center gap-2">
                    {isOverdue && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-red-600 text-white animate-pulse shadow-xs">
                        <AlertCircle className="w-3.5 h-3.5" />
                        MUDDATI O‘TGAN ({overdueDays} KUN KECHIKDI)
                      </span>
                    )}

                    {isDue && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-stone-950 shadow-xs">
                        <Clock className="w-3.5 h-3.5" />
                        BUGUN QAYTISHI SHART!
                      </span>
                    )}

                    {!isOverdue && !isDue && !isReturned && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <Clock className="w-3.5 h-3.5" />
                        Qaytarish: {formatDate(order.expectedReturnDate)} ({order.totalDays} kun)
                      </span>
                    )}

                    {isReturned && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-stone-200 text-stone-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Topshirilgan ({formatDate(order.actualReturnDate || order.expectedReturnDate)})
                      </span>
                    )}

                    {order.discountAmount && order.discountAmount > 0 && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                        <Gift className="w-3.5 h-3.5 text-amber-700" />
                        -{formatMoney(order.discountAmount)} chegirma ({order.discountPercent}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Card Content */}
                <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* Client Info (Left) */}
                  <div className="lg:col-span-4 space-y-3 border-b lg:border-b-0 lg:border-r border-stone-100 pb-4 lg:pb-0 lg:pr-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 font-bold border border-blue-200">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-stone-900 leading-tight">
                          {order.client.fullName}
                        </h4>
                        <a 
                          href={`tel:${order.client.phone.replace(/\s+/g, '')}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3" />
                          {order.client.phone}
                        </a>
                      </div>
                    </div>

                    {order.sellerId && (
                      <div className="mt-3 text-xs flex items-center gap-1.5 text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-200">
                        <span className="font-bold text-stone-700">Sotuvchi:</span>
                        {sellers?.find(s => s.id === order.sellerId)?.fullName || 'Noma\'lum'}
                      </div>
                    )}

                    <div className="text-xs space-y-1 bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-stone-600 mt-3">
                      <p>
                        <span className="text-stone-400">Pasport / ID:</span>{' '}
                        <b className="text-stone-800 font-mono">{order.client.passport || 'Kiritilmagan'}</b>
                      </p>
                      {order.client.address && (
                        <p className="line-clamp-1">
                          <span className="text-stone-400">Manzil:</span> {order.client.address}
                        </p>
                      )}
                      <p>
                        <span className="text-stone-400">Garov turi:</span>{' '}
                        <b className="text-stone-800">
                          {order.depositType === 'passport' && '🪪 Pasport'}
                          {order.depositType === 'cash' && '💵 Naqd pul'}
                          {order.depositType === 'driver_license' && '🚗 Guvohnoma'}
                          {order.depositType === 'other' && '📦 Boshqa'}
                        </b>{' '}
                        ({order.depositNote})
                      </p>
                    </div>

                    {order.notes && (
                      <p className="text-[11px] text-stone-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                        Izoh: {order.notes}
                      </p>
                    )}
                  </div>

                  {/* Items list (Center) */}
                  <div className="lg:col-span-5 space-y-2 border-b lg:border-b-0 lg:border-r border-stone-100 pb-4 lg:pb-0 lg:pr-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Olingan Asboblar ({order.items.reduce((a, b) => a + b.quantity, 0)} dona)
                    </span>

                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100">
                          <div className="flex items-center gap-2.5">
                              <AsyncToolImage
                                toolName={item.toolName}
                                originalUrl={item.imageUrl}
                                className="w-9 h-9 rounded-lg object-cover bg-stone-200 shrink-0 border border-stone-200"
                              />
                            <div>
                              <p className="text-xs font-bold text-stone-900 leading-tight">
                                {item.toolName}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mt-0.5 font-mono">
                                <span className="text-amber-700 font-semibold">{item.article}</span>
                                <span>•</span>
                                <span>{item.code}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-xs">
                              {item.quantity} dona
                            </span>
                            <span className="block text-[10px] text-stone-500 mt-0.5">
                              {formatMoney(item.dailyPrice)}/kun
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Timeline Box */}
                    <div className="p-2.5 bg-stone-100/70 rounded-xl flex items-center justify-between text-xs text-stone-700">
                      <div>
                        <span className="text-[10px] text-stone-400 block">Boshlandi</span>
                        <b>{formatDate(order.startDate)}</b>
                      </div>
                      <div className="text-center font-bold px-2 py-0.5 bg-white rounded border border-stone-200 text-stone-900 text-[11px]">
                        {order.totalDays} kunlik ijara
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 block">Qaytarish sanasi</span>
                        <b className={isOverdue ? 'text-red-700 font-black' : isDue ? 'text-amber-700 font-black' : ''}>
                          {formatDate(order.expectedReturnDate)}
                        </b>
                      </div>
                    </div>
                  </div>

                  {/* Financials & Actions (Right) */}
                  <div className="lg:col-span-3 flex flex-col justify-between space-y-3">
                    
                    {/* Amounts */}
                    <div className="space-y-1.5 bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs">
                      {order.discountAmount && order.discountAmount > 0 ? (
                        <>
                          <div className="flex justify-between text-stone-500 text-[11px]">
                            <span>Asl summa:</span>
                            <span className="line-through">{formatMoney(order.subtotalAmount || (order.totalRentAmount + order.discountAmount))}</span>
                          </div>
                          <div className="flex justify-between text-amber-700 font-semibold text-[11px]">
                            <span>Chegirma ({order.discountPercent ? `${order.discountPercent}%` : ''}):</span>
                            <span>-{formatMoney(order.discountAmount)}</span>
                          </div>
                          <div className="flex justify-between text-stone-700 pt-0.5 border-t border-stone-100">
                            <span>Jami ijara:</span>
                            <b className="text-stone-900 font-bold">{formatMoney(order.totalRentAmount)}</b>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-stone-600">
                          <span>Jami ijara:</span>
                          <b className="text-stone-900 font-bold">{formatMoney(order.totalRentAmount)}</b>
                        </div>
                      )}
                      <div className="flex justify-between text-emerald-700">
                        <span>To‘landi:</span>
                        <b>{formatMoney(order.paidAmount)}</b>
                      </div>
                      <div className="flex justify-between text-stone-900 pt-1 border-t border-stone-200">
                        <span className="font-semibold">Qoldiq:</span>
                        <b className={`font-black ${order.remainingAmount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {formatMoney(order.remainingAmount)}
                        </b>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-stone-500 pt-1 border-t border-stone-100">
                        <span>To‘lov turi:</span>
                        <span className="font-bold text-stone-800 px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
                          {order.paymentMethod === 'card' ? '💳 Karta' : order.paymentMethod === 'transfer' ? '🏦 O‘tkazma' : '💵 Naqd'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-1.5 pt-1">
                      
                      {/* Return action */}
                      {!isReturned && (
                        <button
                          onClick={() => onOpenReturnOrder(order)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-xs"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Qaytarib Olish</span>
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-1.5">
                        
                        {/* Extend button */}
                        {!isReturned && (
                          <button
                            onClick={() => onOpenExtendOrder(order)}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                            title="Muddatni uzaytirish"
                          >
                            <CalendarPlus className="w-3.5 h-3.5 text-stone-500" />
                            <span>Uzaytirish</span>
                          </button>
                        )}

                        {/* Remind button */}
                        {!isReturned && (
                          <button
                            onClick={() => onOpenReminderModal(order)}
                            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition ${
                              isOverdue || isDue 
                                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950' 
                                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                            }`}
                            title="SMS yoki Telegram orqali eslatish"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Eslatish</span>
                          </button>
                        )}

                        {/* Print Receipt */}
                        <button
                          onClick={() => onPrintReceipt(order)}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                          title="Chek va shartnomani ko'rish / chop etish"
                        >
                          <Printer className="w-3.5 h-3.5 text-stone-500" />
                          <span>Chek</span>
                        </button>

                        {/* Direct PDF Download */}
                        <button
                          onClick={() => generateOrderPDF(order)}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition"
                          title="Shartnomani PDF qilib yuklab olish"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-700" />
                          <span>PDF</span>
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
