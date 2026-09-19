import React, { useState } from 'react';
import { X, Printer, Wrench, ShieldCheck, Check, Download, FileText } from 'lucide-react';
import { RentalOrder } from '../types';
import { formatMoney, formatDate } from '../utils/formatters';
import { generateOrderPDF } from '../utils/pdfGenerator';

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RentalOrder | null;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      setDownloadingPdf(true);
      generateOrderPDF(order);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setTimeout(() => setDownloadingPdf(false), 800);
    }
  };

  const paymentMethodText = 
    order.paymentMethod === 'card' 
      ? '💳 Karta (Click/Payme)' 
      : order.paymentMethod === 'transfer' 
      ? '🏦 Perevod / Hisob raqam' 
      : '💵 Naqd pul';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Screen-only modal header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">Ijara Cheki & Shartnoma Varaqasi</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-xs border border-stone-700 shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingPdf ? 'Yuklanmoqda...' : 'PDF Yuklab Olish'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>Chop etish</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-8 overflow-y-auto print:p-0 space-y-6 text-stone-900 font-sans text-xs bg-white">
          
          {/* Company & Order Header */}
          <div className="border-b-2 border-stone-900 pb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-stone-900 text-amber-400 rounded-lg flex items-center justify-center font-black">
                  <Wrench className="w-4 h-4" />
                </div>
                <h1 className="text-base font-black uppercase tracking-tight">
                  Instrument Arenda
                </h1>
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Qurilish va ta’mirlash asbob-uskunalari ijarasi
              </p>
              <p className="text-[11px] text-stone-500">
                Tel: +998 90 123-45-67 | Manzil: Ustaxona binosi
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-stone-100 border border-stone-300 font-mono font-black text-sm rounded">
                {order.orderNumber}
              </span>
              <p className="text-[11px] text-stone-500 mt-1">
                Sana: <b>{formatDate(order.startDate)}</b>
              </p>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-sm font-black uppercase tracking-wider">
              Asboblarni Ijaraga Berish Dalolatnomasi va Kvitansiyasi
            </h2>
          </div>

          {/* Client Details */}
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-stone-500 text-[10px] uppercase font-bold block">Ijarachi (Mijoz):</span>
              <b className="text-stone-900 text-sm">{order.client.fullName}</b>
              <p className="text-stone-600 mt-0.5">Tel: {order.client.phone}</p>
              {order.client.address && <p className="text-stone-500">Manzil: {order.client.address}</p>}
            </div>

            <div>
              <span className="text-stone-500 text-[10px] uppercase font-bold block">Shaxsini tasdiqlovchi hujjat & Garov:</span>
              <p className="text-stone-800">Pasport/ID: <b>{order.client.passport || 'Kiritilmagan'}</b></p>
              <p className="text-stone-800">
                Qoldirilgan garov: <b className="text-amber-800">{order.depositNote}</b>
              </p>
              <p className="text-stone-800 mt-0.5">
                To‘lov usuli: <b className="text-stone-900">{paymentMethodText}</b>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-left border-collapse border border-stone-300 text-xs">
              <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-300">
                <tr>
                  <th className="p-2 border border-stone-300">№</th>
                  <th className="p-2 border border-stone-300">Asbob nomi</th>
                  <th className="p-2 border border-stone-300">Artikul / Kod</th>
                  <th className="p-2 border border-stone-300 text-center">Soni</th>
                  <th className="p-2 border border-stone-300 text-right">Kunlik narx</th>
                  <th className="p-2 border border-stone-300 text-center">Kunlar</th>
                  <th className="p-2 border border-stone-300 text-right">Summa</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-stone-200">
                    <td className="p-2 border border-stone-300 text-center">{idx + 1}</td>
                    <td className="p-2 border border-stone-300 font-bold">{item.toolName}</td>
                    <td className="p-2 border border-stone-300 font-mono text-[10px]">{item.article} / {item.code}</td>
                    <td className="p-2 border border-stone-300 text-center font-bold">{item.quantity} dona</td>
                    <td className="p-2 border border-stone-300 text-right">{formatMoney(item.dailyPrice)}</td>
                    <td className="p-2 border border-stone-300 text-center">{order.totalDays} kun</td>
                    <td className="p-2 border border-stone-300 text-right font-bold">
                      {formatMoney(item.dailyPrice * item.quantity * order.totalDays)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="flex justify-between items-start">
            <div className="space-y-1 text-stone-600 max-w-xs">
              <p>Olingan sana: <b>{formatDate(order.startDate)}</b></p>
              <p>Qaytarish muddati: <b className="text-stone-900 underline">{formatDate(order.expectedReturnDate)}</b></p>
              {order.notes && <p className="italic text-[11px]">Izoh: {order.notes}</p>}
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 min-w-[240px] space-y-1 text-right text-xs">
              {order.discountAmount && order.discountAmount > 0 ? (
                <>
                  <div className="flex justify-between text-stone-600">
                    <span>Asl ijara summasi:</span>
                    <span>{formatMoney(order.subtotalAmount || (order.totalRentAmount + order.discountAmount))}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Skidka ({order.discountPercent ? `${order.discountPercent}%` : 'chegirma'}):</span>
                    <span>-{formatMoney(order.discountAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-200">
                    <span>Yakuniy to‘lov:</span>
                    <b>{formatMoney(order.totalRentAmount)}</b>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span>Jami summa:</span>
                  <b>{formatMoney(order.totalRentAmount)}</b>
                </div>
              )}
              <div className="flex justify-between text-emerald-800">
                <span>Oldindan to‘landi:</span>
                <b>{formatMoney(order.paidAmount)}</b>
              </div>
              <div className="flex justify-between text-stone-900 pt-1 border-t border-stone-300 font-bold">
                <span>Qoldiq to‘lov:</span>
                <b className="text-sm">{formatMoney(order.remainingAmount)}</b>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="border border-stone-200 p-3 rounded-xl text-[10px] text-stone-600 space-y-1 bg-stone-50">
            <p className="font-bold text-stone-800 uppercase">Shartnoma shartlari:</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Mijoz uskunani soz, toza va to‘liq komplektda o‘z vaqtida qaytarish majburiyatini oladi.</li>
              <li>Asbobga yetkazilgan mexanik shikast yoki buzilish holatlarida ta’mirlash xarajatlari mijoz tomonidan qoplanadi.</li>
              <li>Qaytarish muddati o‘tgan har bir kun uchun belgilangan kunlik ijara narxi qo‘shib hisoblanadi.</li>
            </ol>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-stone-300 text-xs">
            <div>
              <p className="font-bold text-stone-800">Ijaraga beruvchi (Mas‘ul shaxs):</p>
              <div className="mt-8 border-b border-stone-400 w-48"></div>
              <span className="text-[10px] text-stone-400">Imzo & M.O‘.</span>
            </div>

            <div>
              <p className="font-bold text-stone-800">Ijarachi (Mijoz):</p>
              <div className="mt-8 border-b border-stone-400 w-48"></div>
              <span className="text-[10px] text-stone-400">
                {order.client.fullName} (Imzo)
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
