import React, { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { useRental } from '../context/RentalContext';
import { getToolImageUrl, detectCategory, detectBrand, calculateDepositPrice } from '../utils/toolHelpers';
import { formatMoney } from '../utils/formatters';

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddToolModal: React.FC<AddToolModalProps> = ({ isOpen, onClose }) => {
  const { addTool, tools, receipts } = useRental();

  const nextCodeNum = 1010 + tools.length + 1;
  const [name, setName] = useState('');
  const [article, setArticle] = useState(`ART-${Math.floor(100 + Math.random() * 900)}`);
  const [code, setCode] = useState(`KD-${nextCodeNum}`);
  const [costPrice, setCostPrice] = useState<number | ''>('');
  
  // Auto-calculated logic
  const calculatedDailyPrice = typeof costPrice === 'number' && costPrice > 0 ? Math.round(costPrice / 730 / 0.05) : 0;
  const calculatedDepositPrice = typeof costPrice === 'number' && costPrice > 0 ? calculateDepositPrice(costPrice, calculatedDailyPrice) : 0;
  const autoCategory = detectCategory(name);
  const autoBrand = detectBrand(name);
  const autoImageUrl = getToolImageUrl(name);

  // Auto-fetch price from latest receipt
  useEffect(() => {
    if (name.length > 2) {
      const lowerName = name.toLowerCase();
      let latestPrice = 0;
      let latestDate = 0;
      
      receipts.forEach(receipt => {
        const rDate = new Date(receipt.date).getTime();
        receipt.items.forEach(item => {
          if (item.toolName.toLowerCase().includes(lowerName)) {
            if (rDate > latestDate && item.costPrice > 0) {
              latestDate = rDate;
              latestPrice = item.costPrice;
            }
          }
        });
      });
      
      // If we haven't manually typed a price yet or it's empty, suggest the latest
      if (latestPrice > 0 && costPrice === '') {
        setCostPrice(latestPrice);
      }
    }
  }, [name, receipts, costPrice]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addTool({
      name: name.trim(),
      article: article.trim().toUpperCase(),
      code: code.trim().toUpperCase(),
      category: autoCategory,
      dailyPrice: calculatedDailyPrice,
      depositPrice: calculatedDepositPrice,
      totalStock: 0, // Dastlabki zaxira 0 (prixoddan kiritiladi)
      availableStock: 0,
      imageUrl: autoImageUrl,
      brand: autoBrand,
      model: '',
      condition: 'A',
      description: ''
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-black">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Yangi Asbob Qo‘shish</h2>
              <p className="text-[11px] text-stone-400">
                Soddalashtirilgan yangi tovar kiritish oynasi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div>
            <label className="block text-stone-700 font-bold mb-1">Asbob nomi *</label>
            <input
              type="text"
              required
              placeholder="Masalan: Perforator Bosch GBH 2-26"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Artikul (ART-...)</label>
              <input
                type="text"
                required
                value={article}
                onChange={e => setArticle(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-bold mb-1">Shtrix/Ichki Kod</label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1">Xarid tannarxi (so‘m) *</label>
            <input
              type="number"
              min="0"
              required
              placeholder="Masalan: 1200000"
              value={costPrice}
              onChange={e => setCostPrice(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-black text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            {typeof costPrice === 'number' && costPrice > 0 && (
              <p className="mt-1 text-[10px] text-blue-600 font-semibold">
                Oxirgi prixoddan avtomatik topilishi yoki qo‘lda kiritilishi mumkin.
              </p>
            )}
          </div>

          {/* Auto-Calculated Preview Block */}
          {name.length > 2 && (
            <div className="mt-4 p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <h4 className="font-bold text-stone-800 text-[11px] uppercase tracking-wider mb-2 border-b border-stone-200 pb-2">
                Avto-shakllangan ma'lumotlar
              </h4>
              
              <div className="flex items-start gap-4">
                <img 
                  src={autoImageUrl} 
                  alt="Preview" 
                  className="w-16 h-16 rounded-xl object-cover bg-white border border-stone-200 shrink-0" 
                />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-stone-500">Kategoriya:</span>
                    <span className="font-bold text-stone-800">{autoCategory}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-stone-500">Brend:</span>
                    <span className="font-bold text-stone-800">{autoBrand || 'Noma\'lum'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-stone-500">Kunlik ijara narxi (avto):</span>
                    <span className="font-bold text-emerald-600">{formatMoney(calculatedDailyPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-stone-500">Garov summasi (avto):</span>
                    <span className="font-bold text-blue-600">{formatMoney(calculatedDepositPrice)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-100"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Saqlash</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
