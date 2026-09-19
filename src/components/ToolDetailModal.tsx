import React, { useState } from 'react';
import { 
  X, 
  Tag, 
  Hash, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  ArrowDownToLine, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Phone, 
  User, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle,
  Package,
  History,
  Info
} from 'lucide-react';
import { Tool, RentalOrder, StockReceipt, RepairRecord } from '../types';
import { useRental } from '../context/RentalContext';
import { formatMoney, formatDate } from '../utils/formatters';
import { calculateDepositPrice } from '../utils/toolHelpers';
import { AsyncToolImage } from './AsyncToolImage';

interface ToolDetailModalProps {
  tool: Tool | null;
  isOpen: boolean;
  onClose: () => void;
  onRent: (tool: Tool) => void;
  onPrixod: (tool: Tool) => void;
  onSendToRepair: (tool: Tool) => void;
  onEdit: (tool: Tool) => void;
}

export const ToolDetailModal: React.FC<ToolDetailModalProps> = ({
  tool,
  isOpen,
  onClose,
  onRent,
  onPrixod,
  onSendToRepair,
  onEdit
}) => {
  const { orders, receipts, repairs, deleteTool } = useRental();
  const [activeTab, setActiveTab] = useState<'info' | 'active_rentals' | 'prixod_history' | 'repair_history'>('info');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !tool) return null;

  // Active orders containing this tool
  const activeRentals = orders.filter(order => 
    order.status !== 'returned' && 
    order.items.some(item => item.toolId === tool.id)
  );

  // Stock receipts containing this tool
  const toolReceipts = receipts.filter(r => 
    r.items.some(item => item.toolId === tool.id)
  );

  // Repair records for this tool
  const toolRepairs = repairs.filter(r => r.toolId === tool.id);

  const isAvailable = tool.availableStock > 0;
  const inRepair = (tool.repairStock || 0) > 0;

  const handleDelete = () => {
    if (activeRentals.length > 0) {
      alert('Diqqat! Ushbu mahsulot hozirda mijozlar qo‘lida ijarada. Avval buyurtmani qaytarib oling!');
      return;
    }
    deleteTool(tool.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {tool.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
                <span>Artikul: <b className="text-slate-700">{tool.article}</b></span>
                <span>•</span>
                <span>Kod: <b className="text-blue-600">{tool.code}</b></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(tool)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition"
              title="Tahrirlash"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-6 px-6 border-b border-slate-100 bg-white shrink-0 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 font-bold relative transition whitespace-nowrap ${
              activeTab === 'info' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Umumiy ma’lumot & Zaxira
            {activeTab === 'info' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('active_rentals')}
            className={`py-3 font-bold relative transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'active_rentals' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Hozirgi Ijaradagilar</span>
            {activeRentals.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700">
                {activeRentals.length}
              </span>
            )}
            {activeTab === 'active_rentals' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('prixod_history')}
            className={`py-3 font-bold relative transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'prixod_history' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Prixod (Kirim) tarixi</span>
            {toolReceipts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700">
                {toolReceipts.length}
              </span>
            )}
            {activeTab === 'prixod_history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('repair_history')}
            className={`py-3 font-bold relative transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'repair_history' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Ta’mirlash tarixi</span>
            {toolRepairs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-700">
                {toolRepairs.length}
              </span>
            )}
            {activeTab === 'repair_history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: INFO & STOCK */}
          {activeTab === 'info' && (
            <div className="space-y-5">
              
              {/* Top Banner: Image & Core Details */}
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="w-full sm:w-52 h-44 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0 relative group">
                  <AsyncToolImage
                    toolName={tool.name}
                    originalUrl={tool.imageUrl}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white">
                    {tool.category}
                  </span>
                </div>

                <div className="flex-1 space-y-3 min-w-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Brend / Ishlab chiqaruvchi</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{tool.brand || 'Noma’lum'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Model</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono">{tool.model || 'Standart'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Holati</span>
                      <p className="text-xs font-bold text-emerald-600 mt-0.5">Yaxshi (A)</p>
                    </div>
                  </div>

                  {/* Pricing Cards */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between text-blue-600 text-xs font-bold mb-1">
                        <span>KUNLIK IJARA NARXI</span>
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-lg font-black text-blue-700">
                        {formatMoney(tool.dailyPrice)}
                      </p>
                    </div>

                    <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-1">
                        <span>GAROV SUMMASI</span>
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-lg font-black text-emerald-800">
                        {formatMoney(tool.depositPrice > 0 ? tool.depositPrice : calculateDepositPrice(0, tool.dailyPrice))}
                      </p>
                    </div>
                  </div>

                  {tool.description && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700 block mb-0.5">Qo‘shimcha tavsif:</span>
                      {tool.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Status Bar */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Ombordagi Zaxira Taqsimoti
                  </h4>
                  <span className="text-xs font-bold text-slate-900">
                    Jami: {tool.totalStock} dona
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex shadow-inner">
                  <div 
                    className="bg-emerald-500 h-full transition-all" 
                    style={{ width: `${tool.totalStock > 0 ? (tool.availableStock / tool.totalStock) * 100 : 0}%` }}
                    title={`Mavjud: ${tool.availableStock} ta`}
                  />
                  <div 
                    className="bg-blue-600 h-full transition-all" 
                    style={{ width: `${tool.totalStock > 0 ? (tool.rentedStock / tool.totalStock) * 100 : 0}%` }}
                    title={`Ijarada: ${tool.rentedStock} ta`}
                  />
                  <div 
                    className="bg-amber-500 h-full transition-all" 
                    style={{ width: `${tool.totalStock > 0 ? ((tool.repairStock || 0) / tool.totalStock) * 100 : 0}%` }}
                    title={`Ta’mirda: ${tool.repairStock || 0} ta`}
                  />
                </div>

                {/* Badges */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                    <span className="text-[11px] font-semibold text-emerald-700 block">Bo‘sh / Mavjud</span>
                    <b className="text-base text-emerald-900 font-mono">{tool.availableStock} ta</b>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl">
                    <span className="text-[11px] font-semibold text-blue-700 block">Mijozlar qo‘lida</span>
                    <b className="text-base text-blue-900 font-mono">{tool.rentedStock} ta</b>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                    <span className="text-[11px] font-semibold text-amber-700 block">Ta’mirda</span>
                    <b className="text-base text-amber-900 font-mono">{tool.repairStock || 0} ta</b>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ACTIVE RENTALS */}
          {activeTab === 'active_rentals' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Hozirda ijarada bo‘lgan buyurtmalar:</span>
                <span className="text-blue-600 font-mono font-bold">{activeRentals.length} ta buyurtma</span>
              </div>

              {activeRentals.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  Ushbu uskuna hozirda hech qaysi mijozda ijarada emas. Barcha qismi omborda bo‘sh turibdi.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                  {activeRentals.map(order => {
                    const item = order.items.find(i => i.toolId === tool.id);
                    return (
                      <div key={order.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-600">{order.orderNumber}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                              {item?.quantity || 1} ta olingan
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-800 font-semibold">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{order.client.fullName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{order.client.phone}</span>
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-600 justify-end">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Qaytish: <b>{formatDate(order.expectedReturnDate)}</b></span>
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {order.status === 'overdue' ? 'Muddati o‘tgan' : 'Ijarada'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRIXOD (KIRIM) HISTORY */}
          {activeTab === 'prixod_history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Omborga qabul qilingan kirimlar tarixi:</span>
                <button
                  onClick={() => {
                    onClose();
                    onPrixod(tool);
                  }}
                  className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>+ Yangi prixod qilish</span>
                </button>
              </div>

              {toolReceipts.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  Ushbu asbob bo‘yicha hozircha prixod qilingan hujjatlar mavjud emas (yoki boshlang‘ich zaxira sifatida kiritilgan).
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                  {toolReceipts.map(receipt => {
                    const item = receipt.items.find(i => i.toolId === tool.id);
                    return (
                      <div key={receipt.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-4 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{receipt.receiptNumber}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500 font-medium">{formatDate(receipt.date)}</span>
                          </div>
                          <p className="text-slate-700 font-semibold mt-0.5">
                            Ta’minotchi: <b className="text-slate-900">{receipt.supplierName}</b>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-extrabold text-xs">
                            +{item?.quantity || 1} dona qabul qilindi
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-1">
                            Tan narxi: <b>{formatMoney(item?.costPrice || 0)}</b>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REPAIR HISTORY */}
          {activeTab === 'repair_history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Ta’mirlash va profilaktika tarixi:</span>
                {tool.availableStock > 0 && (
                  <button
                    onClick={() => {
                      onClose();
                      onSendToRepair(tool);
                    }}
                    className="text-amber-600 hover:underline font-bold flex items-center gap-1"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>+ Ta’mirga yuborish</span>
                  </button>
                )}
              </div>

              {toolRepairs.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  Ushbu asbob hali hech qachon nosozlik tufayli ta’mirga yuborilmagan. Soz holatda.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                  {toolRepairs.map(rep => (
                    <div key={rep.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            rep.status === 'in_repair' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {rep.status === 'in_repair' ? 'Ta’mirlanmoqda' : 'Tuzatilgan'}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">{formatDate(rep.sentDate)}</span>
                        </div>
                        <p className="text-slate-800 font-medium">
                          Nosozlik: <b className="text-slate-900">{rep.defectDescription}</b>
                        </p>
                        {rep.masterName && (
                          <p className="text-slate-500 text-[11px]">Usta / Servis: {rep.masterName}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-slate-700 font-mono font-bold block">
                          {formatMoney(rep.actualCost || rep.estimatedCost || 0)}
                        </span>
                        <span className="text-[10px] text-slate-400">sarf-xarajat</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>O‘chirish</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-bold">O‘chirilsinmi?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                >
                  Ha, o‘chirish
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300"
                >
                  Bekor
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onPrixod(tool);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
              <span>Prixod qilish</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onSendToRepair(tool);
              }}
              disabled={tool.availableStock <= 0}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                tool.availableStock > 0 
                  ? 'border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Ta’mirga</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onRent(tool);
              }}
              disabled={!isAvailable}
              className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition ${
                isAvailable
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>+ Ijaraga berish</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
