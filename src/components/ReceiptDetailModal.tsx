import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  X, 
  Send, 
  FileSpreadsheet, 
  Printer, 
  RotateCcw, 
  MoreVertical, 
  User, 
  Store, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Filter,
  CheckCircle2,
  Copy,
  Download
} from 'lucide-react';
import { StockReceipt } from '../types';
import { formatMoney, formatDate } from '../utils/formatters';
import { generateSingleStockReceiptPDF } from '../utils/pdfGenerator';

interface ReceiptDetailModalProps {
  receipt: StockReceipt | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  receipt,
  isOpen,
  onClose,
  onStatusChange
}) => {
  const [activeTab, setActiveTab] = useState<'tovarlar' | 'tolovlar' | 'hujjatlar'>('tovarlar');
  const [showMoreInfo, setShowMoreInfo] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string>('');

  if (!isOpen || !receipt) return null;

  // Format timestamp e.g. "2026-yil 17-sentabr, soat 18:22 (Kecha)"
  const displayDate = receipt.date || '2026-yil 17-sentabr';
  const cleanReceiptNumber = receipt.receiptNumber.replace(/^#\s*/, '');

  const handleExportExcel = () => {
    try {
      const data = receipt.items.map((item, index) => ({
        '№': index + 1,
        'Mahsulot': item.toolName,
        'Artikul': item.article || '',
        'Miqdori': item.quantity,
        'Birlik': item.unit || 'dona',
        'Narxi': item.costPrice,
        'Jami summa': (item.quantity * item.costPrice)
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Xarid_${cleanReceiptNumber}`);
      XLSX.writeFile(wb, `Xarid_${cleanReceiptNumber}.xlsx`);
    } catch (err) {
      console.error('Excel export error:', err);
    }
  };

  const handlePrintPDF = () => {
    try {
      generateSingleStockReceiptPDF(receipt);
    } catch (err) {
      console.error('PDF print error:', err);
    }
  };

  const handleShareTelegram = () => {
    const text = `📦 Xarid #${cleanReceiptNumber}\n📅 Sana: ${displayDate}\n🏢 Yetkazib beruvchi: ${receipt.supplierName}\n💰 Summa: ${receipt.totalCost.toLocaleString()} ${receipt.currency || 'so\'m'}\n📦 Tovarlar soni: ${receipt.items.length}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedNotification('Telegram matni nusxalandi!');
      setTimeout(() => setCopiedNotification(''), 3000);
    }
    const url = `https://t.me/share/url?url=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const supplierBalanceText = receipt.supplierBalance || 
    'Qoldiq: -197,184,090 UZS (Biz qarzdormiz) , +2,175.39 AQSh dollari (Biz qarzdormiz) (Biz ... kerak) +7 643.23 AQSh dollari (Biz qarzdormiz)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Bar matching Image 2 */}
        <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-1.5">
              <span>Xarid:</span>
              <span className="text-stone-900 font-extrabold">{cleanReceiptNumber}</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5 font-medium">
              {displayDate}, soat 18:22 (Kecha)
            </p>
          </div>

          {/* Action buttons matching Image 2 */}
          <div className="flex items-center gap-2">
            {/* Telegram Button */}
            <button
              type="button"
              onClick={handleShareTelegram}
              title="Telegram orqali ulashish"
              className="w-8 h-8 rounded-lg bg-[#2AABEE] hover:bg-[#229ED9] text-white flex items-center justify-center transition shadow-2xs active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4 translate-x-[-0.5px] translate-y-[-0.5px]" />
            </button>

            {/* Excel Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              title="Excel formatida yuklab olish"
              className="w-8 h-8 rounded-lg bg-[#107C41] hover:bg-[#0D6535] text-white flex items-center justify-center transition shadow-2xs active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            {/* Muhr / Print Button */}
            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-stone-700" />
              <span>Muhr</span>
            </button>

            {/* Qaytarish yarating */}
            <button
              type="button"
              onClick={() => {
                if (onStatusChange) {
                  onStatusChange(receipt.id, 'Qaytarildi');
                }
                setCopiedNotification('Qaytarish hujjati shakllantirildi');
                setTimeout(() => setCopiedNotification(''), 3000);
              }}
              className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <span>Qaytarish yarating</span>
            </button>

            {/* More Options */}
            <button
              type="button"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {copiedNotification && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{copiedNotification}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Supplier & Warehouse Details Card */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              
              {/* Yetkazib beruvchi */}
              <div className="md:col-span-8 space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs text-stone-500 font-medium">Yetkazib beruvchi</span>
                  <a 
                    href="#supplier" 
                    className="text-xs font-bold text-blue-600 hover:underline hover:text-blue-800 ml-1"
                  >
                    {receipt.supplierName || '(№ 233) ELYOR (ABDULAZIZ)'}
                  </a>
                </div>

                {/* Balance tags */}
                <div className="pl-6 text-[11px] leading-relaxed flex flex-wrap gap-x-2 gap-y-1 font-medium">
                  <span className="text-stone-800 font-bold">Qoldiq:</span>
                  <span className="text-red-600 font-bold">-197,184,090 UZS <span className="text-stone-500 font-normal">(Biz qarzdormiz)</span></span>
                  <span className="text-stone-400">,</span>
                  <span className="text-emerald-600 font-bold">+2,175.39 AQSh dollari <span className="text-stone-500 font-normal">(Biz qarzdormiz)</span></span>
                  <span className="text-emerald-600 font-bold">+7 643.23 AQSh dollari <span className="text-stone-500 font-normal">(Biz qarzdormiz)</span></span>
                </div>
              </div>

              {/* Batafsil ma'lumot toggle */}
              <div className="md:col-span-4 flex md:justify-end">
                <button
                  type="button"
                  onClick={() => setShowMoreInfo(!showMoreInfo)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Batafsil ma'lumot</span>
                  {showMoreInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Ombor and Narxlar ro'yxati */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
              <div className="flex items-center gap-2 text-xs">
                <Store className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-stone-500 font-medium">Ombor</span>
                <span className="font-bold text-stone-900 uppercase ml-2 tracking-wide">
                  {receipt.warehouse || "KO'CHA"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Tag className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-stone-500 font-medium">Narxlar ro'yxati</span>
                <span className="font-bold text-stone-900 uppercase ml-2 tracking-wide">
                  {receipt.priceListType || 'KELISH NARXI'}
                </span>
              </div>
            </div>

            {/* Expandable More Info */}
            {showMoreInfo && (
              <div className="pt-3 border-t border-stone-100 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50/70 p-3 rounded-lg animate-fadeIn">
                <div>
                  <span className="text-stone-500">Mas'uliyatli xodim:</span>
                  <p className="font-bold text-stone-800">{receipt.responsiblePerson || "G'iyosiddin To'xtayev (OPERATSION BO'LIM)"}</p>
                </div>
                <div>
                  <span className="text-stone-500">Hujjatni yaratgan:</span>
                  <p className="font-bold text-stone-800">{receipt.creatorPerson || "Muhammadjon Xudoyberganov (OPERATSION BO'LIM)"}</p>
                </div>
                {receipt.notes && (
                  <div className="sm:col-span-2">
                    <span className="text-stone-500">Izoh va qaydlar:</span>
                    <p className="font-medium text-stone-700 bg-white p-2 rounded border border-stone-200 mt-0.5">{receipt.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabs: Tovarlar matching Image 2 */}
          <div>
            <div className="flex items-center border-b border-stone-200 gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('tovarlar')}
                className={`pb-2.5 text-xs font-bold transition cursor-pointer ${
                  activeTab === 'tovarlar'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Tovarlar ({receipt.items.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tolovlar')}
                className={`pb-2.5 text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'tolovlar'
                    ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
                    : 'text-stone-400 hover:text-stone-700'
                }`}
              >
                To'lovlar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('hujjatlar')}
                className={`pb-2.5 text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'hujjatlar'
                    ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
                    : 'text-stone-400 hover:text-stone-700'
                }`}
              >
                Bog'liq operatsiyalar
              </button>
            </div>

            {/* Tovarlar Table matching Image 2 bright blue header */}
            <div className="mt-4 rounded-lg overflow-hidden border border-stone-200 shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#2B7FFF] text-white text-xs font-bold">
                      <th className="py-2.5 px-3 w-12 text-center border-r border-blue-400/40">#</th>
                      <th className="py-2.5 px-4 border-r border-blue-400/40">
                        <div className="flex items-center justify-between">
                          <span>Mahsulot</span>
                          <Filter className="w-3 h-3 text-white/80" />
                        </div>
                      </th>
                      <th className="py-2.5 px-4 border-r border-blue-400/40 w-36">Miqdori</th>
                      <th className="py-2.5 px-4 border-r border-blue-400/40 w-36">Narxi (so'm)</th>
                      <th className="py-2.5 px-4 text-right w-36">Miqdori (so'm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-xs">
                    {receipt.items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-stone-400">
                          Hujjatda tovarlar mavjud emas
                        </td>
                      </tr>
                    ) : (
                      receipt.items.map((item, idx) => {
                        const lineTotal = (item.totalPrice || (item.quantity * item.costPrice));
                        const unitLabel = item.unit || 'yugurish metri';
                        return (
                          <tr key={idx} className="hover:bg-blue-50/40 transition">
                            <td className="py-3 px-3 text-center text-stone-500 font-medium border-r border-stone-200">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4 border-r border-stone-200 font-bold text-blue-600 hover:text-blue-800 cursor-pointer">
                              {item.toolName}
                            </td>
                            <td className="py-3 px-4 border-r border-stone-200 text-stone-800">
                              {item.quantity.toLocaleString()} {unitLabel}
                            </td>
                            <td className="py-3 px-4 border-r border-stone-200 text-stone-800 font-medium">
                              {item.costPrice.toLocaleString()} / {unitLabel}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-stone-900">
                              {lineTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Summary Footer matching Image 2 */}
              <div className="bg-white border-t border-stone-200 px-6 py-4 flex items-center justify-end gap-6">
                <span className="text-sm font-bold text-stone-900">Jami:</span>
                <span className="text-base font-black text-stone-900 font-mono tracking-tight">
                  {receipt.totalCost ? receipt.totalCost.toLocaleString() : '42 500'} {receipt.currency || 'USD'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
