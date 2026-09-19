import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  ClipboardList, 
  Users, 
  ArrowDownToLine, 
  Wrench, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Banknote, 
  CreditCard, 
  Building, 
  Plus, 
  Phone, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useRental } from '../context/RentalContext';
import { formatMoney, formatDate } from '../utils/formatters';
import { RentalOrder } from '../types';

interface DashboardOverviewProps {
  onNavigate: (tab: any) => void;
  onOpenNewOrder: () => void;
  onOpenPrixod: () => void;
  onOpenReturnOrder: (order: RentalOrder) => void;
  onOpenReminders: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  onOpenNewOrder,
  onOpenPrixod,
  onOpenReturnOrder,
  onOpenReminders
}) => {
  const { tools, orders, receipts, clients, repairs, dueTodayOrders, overdueOrders } = useRental();

  // Financial calculations
  const totalEarned = orders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalDebt = orders.reduce((sum, o) => sum + (o.remainingAmount || 0), 0);
  const totalRepairCost = repairs.reduce((sum, r) => sum + (r.actualCost || 0), 0);
  const netProfit = totalEarned - totalRepairCost;

  // Stock calculations
  const totalTools = tools.reduce((sum, t) => sum + t.totalStock, 0);
  const rentedTools = tools.reduce((sum, t) => sum + t.rentedStock, 0);
  const inRepairTools = repairs.filter(r => r.status === 'in_repair').reduce((sum, r) => sum + r.quantity, 0);
  const availableTools = tools.reduce((sum, t) => sum + t.availableStock, 0);

  // Active orders
  const activeOrders = orders.filter(o => o.status === 'active' || o.status === 'overdue');

  // Payment breakdown
  const cashTotal = orders.filter(o => !o.paymentMethod || o.paymentMethod === 'cash').reduce((sum, o) => sum + o.paidAmount, 0);
  const cardTotal = orders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.paidAmount, 0);
  const transferTotal = orders.filter(o => o.paymentMethod === 'transfer').reduce((sum, o) => sum + o.paidAmount, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-950 text-white p-6 rounded-2xl shadow-sm border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            ARBOSS JOMIY • Boshqaruv Tizimi
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Xush kelibsiz, Asboblar Ijarasi va Ombor Nazorati
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm mt-1">
            Barcha amaliyotlar, ijaradagi asboblar, to‘lovlar va ta’mir holati bir joyda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Ijara Ochish</span>
          </button>
          <button
            onClick={onOpenPrixod}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-700/80 hover:bg-stone-600 text-stone-100 font-semibold text-xs border border-stone-600 transition"
          >
            <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
            <span>+ Prixod</span>
          </button>
        </div>
      </div>

      {/* Critical Alerts Strip (if any) */}
      {(overdueOrders.length > 0 || dueTodayOrders.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overdueOrders.length > 0 && (
            <div 
              onClick={() => onNavigate('orders')}
              className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-red-100/80 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black animate-pulse">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-950">
                    {overdueOrders.length} ta muddatidan kechikkan ijara!
                  </h4>
                  <p className="text-xs text-red-700">
                    Mijozlar bilan bog‘lanib, qaytarish yoki uzaytirish kerak
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-red-600" />
            </div>
          )}

          {dueTodayOrders.length > 0 && (
            <div 
              onClick={() => onNavigate('orders')}
              className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-amber-100/80 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    {dueTodayOrders.length} ta ijara bugun qaytishi kerak
                  </h4>
                  <p className="text-xs text-amber-800">
                    Bugun qabul qilinishi kutilayotgan uskunalar
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-700" />
            </div>
          )}
        </div>
      )}

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Kassa Tushumi */}
        <div 
          onClick={() => onNavigate('stats')}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Jami Tushum (Kassa)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-stone-900 tracking-tight">
              {formatMoney(totalEarned)}
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
              <span>{orders.length} ta zakaz</span>
              <span>•</span>
              <span className="text-emerald-600 font-bold">Sof: {formatMoney(netProfit)}</span>
            </div>
          </div>
        </div>

        {/* Ijaradagi Asboblar */}
        <div 
          onClick={() => onNavigate('orders')}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-amber-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Amaldagi Ijaralar</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-105 transition">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-stone-900 tracking-tight">
              {rentedTools} <span className="text-sm font-normal text-stone-500">dona asbob</span>
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
              <span className="text-amber-700 font-bold">{activeOrders.length} ta faol shartnoma</span>
              {overdueOrders.length > 0 && (
                <span className="text-red-600 font-bold">({overdueOrders.length} kechikkan)</span>
              )}
            </div>
          </div>
        </div>

        {/* Ombor Qoldig'i */}
        <div 
          onClick={() => onNavigate('catalog')}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Ombordagi Bo‘sh Qoldiq</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center group-hover:scale-105 transition">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-stone-900 tracking-tight">
              {availableTools} <span className="text-sm font-normal text-stone-500">/ {totalTools} dona</span>
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
              <span>{tools.length} xil uskuna</span>
              <span>•</span>
              <span className="text-blue-700 font-medium">{Math.round(totalTools > 0 ? (availableTools / totalTools) * 100 : 0)}% bo‘sh</span>
            </div>
          </div>
        </div>

        {/* Ta'mirlash & Servis */}
        <div 
          onClick={() => onNavigate('repairs')}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-red-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Ta’mirdagi Asboblar</span>
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center group-hover:scale-105 transition">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-stone-900 tracking-tight">
              {inRepairTools} <span className="text-sm font-normal text-stone-500">dona</span>
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
              <span className="text-red-700 font-semibold">{repairs.filter(r => r.status === 'in_repair').length} ta nosozlik</span>
              <span>•</span>
              <span className="text-stone-500">Xarajat: {formatMoney(totalRepairCost)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Payment methods & Quick stock bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Methods Pill Widget */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" />
              To‘lov Turlari Bo‘yicha Tushum
            </h3>
            <span className="text-xs text-stone-500">ibox Kassa</span>
          </div>

          <div className="space-y-3">
            {/* Cash */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-950">Naqd Pul:</span>
              </div>
              <span className="text-sm font-black text-emerald-950">{formatMoney(cashTotal)}</span>
            </div>

            {/* Card */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-bold text-blue-950">Plastik Karta:</span>
              </div>
              <span className="text-sm font-black text-blue-950">{formatMoney(cardTotal)}</span>
            </div>

            {/* Transfer */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/70 border border-purple-100">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-bold text-purple-950">Perevod / Click:</span>
              </div>
              <span className="text-sm font-black text-purple-950">{formatMoney(transferTotal)}</span>
            </div>
          </div>
        </div>

        {/* Stock Breakdown Status */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Ombor Uskunalar Balansi
            </h3>
            <span className="text-xs font-bold text-stone-600">Jami: {totalTools} ta</span>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-emerald-700">Mavjud (Bo‘sh):</span>
                <b>{availableTools} ta ({totalTools > 0 ? Math.round((availableTools / totalTools) * 100) : 0}%)</b>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalTools > 0 ? (availableTools / totalTools) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-amber-700">Ijarada (Mijozlarda):</span>
                <b>{rentedTools} ta ({totalTools > 0 ? Math.round((rentedTools / totalTools) * 100) : 0}%)</b>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalTools > 0 ? (rentedTools / totalTools) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-red-700">Ta’mirda (Servisda):</span>
                <b>{inRepairTools} ta ({totalTools > 0 ? Math.round((inRepairTools / totalTools) * 100) : 0}%)</b>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full" style={{ width: `${totalTools > 0 ? (inRepairTools / totalTools) * 100 : 0}%` }}></div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('prixod')}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Omborga yangi tovar kiritish (Prixod)</span>
            </button>
          </div>
        </div>

        {/* Quick Short-cuts Card */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-sm text-stone-900">Tezkor Amallar</h3>
            <span className="text-xs text-stone-400">ibox Menu</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenNewOrder}
              className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-left transition"
            >
              <Plus className="w-5 h-5 text-emerald-600 mb-1" />
              <div className="font-bold text-xs">Yangi Ijara</div>
              <div className="text-[10px] text-emerald-700">Mijozga asbob berish</div>
            </button>

            <button
              onClick={onOpenPrixod}
              className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-left transition"
            >
              <ArrowDownToLine className="w-5 h-5 text-blue-600 mb-1" />
              <div className="font-bold text-xs">Prixod (Kirim)</div>
              <div className="text-[10px] text-blue-700">Qoldiq ko‘paytirish</div>
            </button>

            <button
              onClick={() => onNavigate('clients')}
              className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-left transition"
            >
              <Users className="w-5 h-5 text-purple-600 mb-1" />
              <div className="font-bold text-xs">Mijozlar</div>
              <div className="text-[10px] text-purple-700">Baza & Qarzlar</div>
            </button>

            <button
              onClick={() => onNavigate('repairs')}
              className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-left transition"
            >
              <Wrench className="w-5 h-5 text-amber-600 mb-1" />
              <div className="font-bold text-xs">Ta’mirlash</div>
              <div className="text-[10px] text-amber-700">Servis & Ustalar</div>
            </button>
          </div>

          <button
            onClick={onOpenReminders}
            className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Avtomatik Eslatmalar & SMS matnlari</span>
          </button>
        </div>

      </div>

      {/* Today's Due / Overdue Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-stone-900">
              Bugun va Yaqin Kunlarda Qaytarilishi Kerak Bo‘lgan Ijaralar
            </h3>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Barcha buyurtmalarni ko‘rish ({orders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeOrders.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs">
            Hozirda faol ijaralar mavjud emas. Barcha uskunalar omborda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-100 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4">Buyurtma</th>
                  <th className="py-2.5 px-4">Mijoz</th>
                  <th className="py-2.5 px-4">Telefon</th>
                  <th className="py-2.5 px-4">Asboblar</th>
                  <th className="py-2.5 px-4">Qaytarish sanasi</th>
                  <th className="py-2.5 px-4">Qoldiq Qarz</th>
                  <th className="py-2.5 px-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {activeOrders.slice(0, 5).map((order) => {
                  const isOverdue = order.status === 'overdue';
                  return (
                    <tr key={order.id} className="hover:bg-stone-50 transition">
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-800">
                        {order.client.fullName}
                      </td>
                      <td className="py-3 px-4 text-stone-600">
                        <a href={`tel:${order.client.phone}`} className="hover:text-emerald-600 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{order.client.phone}</span>
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span className="line-clamp-1 font-medium text-stone-800">
                          {order.items.map(i => `${i.toolName} (${i.quantity}x)`).join(', ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                          isOverdue 
                            ? 'bg-red-100 text-red-800 border border-red-200' 
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {formatDate(order.expectedReturnDate)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {order.remainingAmount > 0 ? (
                          <span className="text-red-600">{formatMoney(order.remainingAmount)}</span>
                        ) : (
                          <span className="text-emerald-600">To‘langan</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onOpenReturnOrder(order)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition"
                        >
                          Qabul qilish
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
