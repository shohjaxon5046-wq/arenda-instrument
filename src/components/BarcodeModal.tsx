import React, { useState } from 'react';
import { QrCode, Search, Wrench, X, CheckCircle, ArrowRight } from 'lucide-react';
import { useRental } from '../context/RentalContext';
import { Tool } from '../types';
import { formatMoney } from '../utils/formatters';
import { AsyncToolImage } from './AsyncToolImage';

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRentTool: (tool: Tool) => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({
  isOpen,
  onClose,
  onRentTool
}) => {
  const { tools } = useRental();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [foundTool, setFoundTool] = useState<Tool | null>(null);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const query = barcodeInput.trim().toLowerCase();
    const tool = tools.find(
      t => t.code.toLowerCase() === query || 
           t.article.toLowerCase() === query ||
           t.id.toLowerCase() === query
    );

    setFoundTool(tool || null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Shtrix-kod Skanerlash</h3>
              <p className="text-[11px] text-slate-500">Uskunani shtrix-kodi yoki artikoli bo‘yicha tezkor topish</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input */}
        <div className="p-5 space-y-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Skaner yoki klaviatura orqali kodni kiriting:
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Masalan: KD-8812 yoki PRF-042..."
                value={barcodeInput}
                onChange={e => {
                  setBarcodeInput(e.target.value);
                  const query = e.target.value.trim().toLowerCase();
                  const tool = tools.find(
                    t => t.code.toLowerCase() === query || t.article.toLowerCase() === query
                  );
                  if (tool) setFoundTool(tool);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 focus:outline-hidden"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
              >
                Topish
              </button>
            </div>
          </form>

          {/* Result Card */}
          {foundTool && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <AsyncToolImage
                  toolName={foundTool.name}
                  originalUrl={foundTool.imageUrl}
                  className="w-14 h-14 object-cover rounded-lg border border-emerald-200 bg-white"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-emerald-200 text-emerald-800 font-mono">
                      {foundTool.code}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {foundTool.article}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm truncate mt-0.5">
                    {foundTool.name}
                  </h4>
                  <p className="text-xs font-bold text-blue-600 font-mono">
                    {formatMoney(foundTool.dailyPrice)} / kun
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/60">
                <span className="text-slate-600">
                  Mavjud: <b className="text-emerald-700">{foundTool.availableStock} ta</b> / Jami: {foundTool.totalStock} ta
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onRentTool(foundTool);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1"
                >
                  <span>Ijaraga berish</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {barcodeInput && !foundTool && (
            <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200">
              "{barcodeInput}" kodi bo‘yicha asbob topilmadi. Qaytadan tekshirib ko‘ring.
            </div>
          )}

          {/* Quick List of Sample Barcodes */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Tezkor tanlash uchun mavjud kodlar:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
              {tools.slice(0, 6).map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setBarcodeInput(t.code);
                    setFoundTool(t);
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-md text-[10px] font-mono font-medium text-slate-700 transition"
                >
                  {t.code} ({t.name.split(' ')[0]})
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
