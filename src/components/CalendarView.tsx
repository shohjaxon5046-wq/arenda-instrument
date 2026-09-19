import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Phone, 
  Wrench,
  AlertCircle,
  CheckCircle,
  Plus
} from 'lucide-react';
import { useRental } from '../context/RentalContext';
import { RentalOrder } from '../types';
import { formatMoney, formatDate } from '../utils/formatters';

interface CalendarViewProps {
  onOpenNewOrder: () => void;
  onOpenReturnOrder: (order: RentalOrder) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onOpenNewOrder,
  onOpenReturnOrder
}) => {
  const { orders } = useRental();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayOrder, setSelectedDayOrder] = useState<RentalOrder | null>(null);

  // Helper date calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // Starting day index (0 = Monday in Uzbekistan)
  // standard getDay(): 0 is Sunday, 1 is Monday...
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const monthNames = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktyabr', 'Noyabr', 'Dekabr'
  ];

  const weekDayNames = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Map orders to date strings YYYY-MM-DD
  const formatYMD = (d: number) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <CalendarIcon className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {monthNames[month]} {year}
              </h2>
              {isCurrentMonth && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Hozirgi oy
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Ijara muddatlari, qaytarish vaqtlari va band qilingan uskunalar jadvali
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
              title="Oldingi oy"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded-lg transition"
            >
              Bugun
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
              title="Keyingi oy"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi buyurtma</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Week days row */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
          {weekDayNames.map((d, i) => (
            <div key={d} className={i >= 5 ? 'text-blue-600' : ''}>
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[500px]">
          {/* Empty cells before start day */}
          {Array.from({ length: startDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="bg-slate-50/40 p-2 min-h-[90px]" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const ymd = formatYMD(dayNum);
            const isToday = isCurrentMonth && today.getDate() === dayNum;

            // Find orders returning or active on this date
            const returningOrders = orders.filter(o => o.expectedReturnDate === ymd && o.status !== 'returned');
            const startingOrders = orders.filter(o => o.startDate === ymd);
            const returnedOrders = orders.filter(o => o.actualReturnDate === ymd || (o.expectedReturnDate === ymd && o.status === 'returned'));

            return (
              <div 
                key={`day-${dayNum}`}
                className={`p-1.5 sm:p-2 min-h-[100px] flex flex-col justify-between transition hover:bg-blue-50/30 ${
                  isToday ? 'bg-blue-50/50 ring-1 ring-inset ring-blue-300' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-blue-600 text-white' : 'text-slate-700'
                  }`}>
                    {dayNum}
                  </span>

                  {(returningOrders.length > 0 || startingOrders.length > 0) && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      {returningOrders.length + startingOrders.length} ta
                    </span>
                  )}
                </div>

                {/* Day events badges */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px] no-scrollbar">
                  {returningOrders.map(order => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedDayOrder(order)}
                      className="p-1 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 cursor-pointer hover:bg-amber-100 transition truncate flex items-center gap-1"
                      title={`${order.client.fullName} - ${order.items.map(i => i.toolName).join(', ')}`}
                    >
                      <Clock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                      <span className="truncate">Qaytadi: {order.client.fullName}</span>
                    </div>
                  ))}

                  {startingOrders.map(order => (
                    <div
                      key={`start-${order.id}`}
                      onClick={() => setSelectedDayOrder(order)}
                      className="p-1 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 cursor-pointer hover:bg-blue-100 transition truncate flex items-center gap-1"
                      title={`Berilgan: ${order.client.fullName}`}
                    >
                      <Wrench className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                      <span className="truncate">Berildi: {order.client.fullName}</span>
                    </div>
                  ))}

                  {returnedOrders.map(order => (
                    <div
                      key={`ret-${order.id}`}
                      onClick={() => setSelectedDayOrder(order)}
                      className="p-1 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition truncate flex items-center gap-1 opacity-80"
                    >
                      <CheckCircle className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Topshirildi</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Order Quick Preview Drawer / Modal */}
      {selectedDayOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Zakaz #{selectedDayOrder.orderNumber}
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {selectedDayOrder.client.fullName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="w-3.5 h-3.5" /> Telefon:
                </span>
                <a href={`tel:${selectedDayOrder.client.phone}`} className="font-mono font-bold text-blue-600">
                  {selectedDayOrder.client.phone}
                </a>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-700 block">Band qilingan uskunalar:</span>
                {selectedDayOrder.items.map(item => (
                  <div key={item.toolId} className="flex justify-between items-center text-slate-800 font-medium">
                    <span>• {item.toolName} ({item.quantity} ta)</span>
                    <span className="font-mono">{formatMoney(item.dailyPrice)}/kun</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block">Berilgan sana:</span>
                  <span className="font-bold text-slate-700">{formatDate(selectedDayOrder.startDate)}</span>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                  <span className="text-amber-800 block">Qaytarish sanasi:</span>
                  <span className="font-bold text-amber-950">{formatDate(selectedDayOrder.expectedReturnDate)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Jami ijara:</span>
                <span className="font-bold text-slate-900 text-sm">{formatMoney(selectedDayOrder.totalRentAmount)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {selectedDayOrder.status !== 'returned' && (
                <button
                  onClick={() => {
                    const order = selectedDayOrder;
                    setSelectedDayOrder(null);
                    onOpenReturnOrder(order);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Qabul qilish (Qaytarish)
                </button>
              )}
              <button
                onClick={() => setSelectedDayOrder(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
