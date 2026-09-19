import React from 'react';
import { 
  X, 
  User, 
  Phone, 
  Send, 
  Briefcase, 
  Calendar, 
  Percent, 
  TrendingUp, 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Edit3, 
  DollarSign, 
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Seller, RentalOrder } from '../types';
import { useRental } from '../context/RentalContext';
import { formatMoney, formatDate } from '../utils/formatters';

interface SellerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: Seller | null;
  onEdit: (seller: Seller) => void;
  onNewOrder: (sellerId: string) => void;
}

export const SellerDetailModal: React.FC<SellerDetailModalProps> = ({
  isOpen,
  onClose,
  seller,
  onEdit,
  onNewOrder
}) => {
  const { orders } = useRental();

  if (!isOpen || !seller) return null;

  // Filter orders by this seller
  const sellerOrders = orders.filter(o => o.sellerId === seller.id);
  const totalOrdersCount = sellerOrders.length;
  const activeOrdersCount = sellerOrders.filter(o => o.status === 'active' || o.status === 'overdue').length;
  const returnedOrdersCount = sellerOrders.filter(o => o.status === 'returned').length;

  // Total money handled by this seller
  const totalRevenue = sellerOrders.reduce((sum, o) => sum + (Number(o.totalRentAmount) || 0), 0);
  const totalPaid = sellerOrders.reduce((sum, o) => sum + (Number(o.paidAmount) || 0), 0);
  const commissionPercent = seller.commissionRate || 3;
  const estimatedBonus = Math.round((totalRevenue * commissionPercent) / 100);

  // Role badge colors & labels
  const getRoleConfig = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Bosh Administrator', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'manager':
        return { label: 'Katta Menejer', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'technician':
        return { label: 'Texnik Usta', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'seller':
      default:
        return { label: 'Kassir-Sotuvchi', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  };

  const roleConfig = getRoleConfig(seller.role);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/30">
              {seller.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black tracking-tight">{seller.fullName}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleConfig.bg}`}>
                  {seller.roleTitle || roleConfig.label}
                </span>
                {seller.active ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Faol xodim
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Nofaol
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span>ID: {seller.id}</span>
                <span>•</span>
                <span>Ro'yxatdan o'tgan: {formatDate(seller.createdAt)}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Quick Info & Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Jami buyurtmalar
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{totalOrdersCount}</span>
                <span className="text-xs text-slate-400">ta</span>
              </div>
              <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">
                {activeOrdersCount} aktiv ijara
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Ijara aylanmasi
              </span>
              <div className="text-lg font-black text-slate-900 truncate">
                {formatMoney(totalRevenue)}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
                Naqd/karta tushumi
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                KPI Bonusi ({commissionPercent}%)
              </span>
              <div className="text-lg font-black text-indigo-600 truncate">
                {formatMoney(estimatedBonus)}
              </div>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                Aylanmadan rag'bat
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Qaytarilganlar
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-600">{returnedOrdersCount}</span>
                <span className="text-xs text-slate-400">ta</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                Muvaqqat yopilgan
              </span>
            </div>
          </div>

          {/* Contact Details & Notes Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Xodim Ma'lumotlari va Aloqa
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 block text-[11px] mb-1 font-medium">Telefon raqami</span>
                {seller.phone ? (
                  <a 
                    href={`tel:${seller.phone.replace(/\s+/g, '')}`} 
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1.5 text-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {seller.phone}
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Kiritilmagan</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 block text-[11px] mb-1 font-medium">Telegram</span>
                {seller.telegram ? (
                  <a 
                    href={`https://t.me/${seller.telegram.replace('@', '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="font-bold text-sky-600 hover:underline flex items-center gap-1.5 text-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {seller.telegram}
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Kiritilmagan</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 block text-[11px] mb-1 font-medium">Lavozim / Funksiya</span>
                <span className="font-bold text-slate-800 text-sm block">
                  {seller.roleTitle || roleConfig.label}
                </span>
              </div>
            </div>

            {seller.notes && (
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2">
                <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Izoh va qo'shimcha eslatma:</span>
                  <p className="mt-0.5">{seller.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Orders Processed by this Seller */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                  Xodim rasmiylashtirgan buyurtmalar ({sellerOrders.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Ushbu sotuvchi orqali berilgan asboblar va shartnomalar
                </p>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onNewOrder(seller.id);
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yangi buyurtma ochish</span>
              </button>
            </div>

            {sellerOrders.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-slate-700 text-sm">Hozircha buyurtmalar yo'q</h5>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Ushbu xodim hisobiga yangi ijara shartnomasini biriktirish uchun yuqoridagi tugmani bosing.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onNewOrder(seller.id);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-100 transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  + Buyurtma biriktirish
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Buyurtma #</th>
                      <th className="px-4 py-3">Mijoz</th>
                      <th className="px-4 py-3">Asboblar</th>
                      <th className="px-4 py-3">Muddat</th>
                      <th className="px-4 py-3">Summa</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sellerOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-mono font-bold text-blue-600">
                          {order.orderNumber}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{order.client.fullName}</span>
                          <span className="text-[11px] text-slate-400">{order.client.phone}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-800">
                            {order.items.map(i => `${i.toolName} (${i.quantity}x)`).join(', ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-800 block">{order.startDate} dan</span>
                          <span className="text-[11px] text-slate-500">{order.expectedReturnDate} gacha</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">
                            {formatMoney(order.totalRentAmount)}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-medium">
                            To'langan: {formatMoney(order.paidAmount)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {order.status === 'returned' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              Qaytarilgan
                            </span>
                          )}
                          {order.status === 'active' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                              Ijarada
                            </span>
                          )}
                          {order.status === 'overdue' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 animate-pulse">
                              Kechikkan
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onEdit(seller);
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Edit3 className="w-4 h-4" />
            <span>Tahrirlash</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onNewOrder(seller.id);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi Buyurtma Biriktirish</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
            >
              Yopish
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
