import React, { useState } from 'react';
import { X, CalendarPlus, Clock, Check } from 'lucide-react';
import { RentalOrder } from '../types';
import { useRental } from '../context/RentalContext';
import { formatMoney, formatDate, calculateRentalDays } from '../utils/formatters';

interface ExtendOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RentalOrder | null;
}

export const ExtendOrderModal: React.FC<ExtendOrderModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const { extendOrder } = useRental();

  if (!isOpen || !order) return null;

  // Calculate default new date: +2 days from current expectedReturnDate
  const currentReturn = new Date(order.expectedReturnDate);
  currentReturn.setDate(currentReturn.getDate() + 2);
  const defYear = currentReturn.getFullYear();
  const defMo = String(currentReturn.getMonth() + 1).padStart(2, '0');
  const defDa = String(currentReturn.getDate()).padStart(2, '0');
  const defaultNewDate = `${defYear}-${defMo}-${defDa}`;

  const [newReturnDate, setNewReturnDate] = useState(defaultNewDate);

  // Daily rate of this order items
  const dailyTotalRate = order.items.reduce((acc, i) => acc + i.dailyPrice * i.quantity, 0);

  const extraDays = Math.max(1, calculateRentalDays(order.expectedReturnDate, newReturnDate));
  const suggestedAdditionalAmount = dailyTotalRate * extraDays;

  const [additionalAmount, setAdditionalAmount] = useState<number>(suggestedAdditionalAmount);

  const handleConfirmExtend = (e: React.FormEvent) => {
    e.preventDefault();
    extendOrder(order.id, newReturnDate, Number(additionalAmount) || 0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col">
        
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-black">
              <CalendarPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Ijara Muddatini Uzaytirish</h2>
              <p className="text-xs text-stone-400">
                {order.orderNumber} - {order.client.fullName}
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

        <form onSubmit={handleConfirmExtend} className="p-6 space-y-4 text-xs">
          
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1">
            <div className="flex justify-between text-stone-600">
              <span>Hozirgi qaytarish sanasi:</span>
              <b className="text-stone-900">{formatDate(order.expectedReturnDate)}</b>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Asboblar kunlik ijara narxi:</span>
              <b className="text-amber-700">{formatMoney(dailyTotalRate)}/kun</b>
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1">
              Yangi qaytarish sanasi *
            </label>
            <input
              type="date"
              required
              min={order.expectedReturnDate}
              value={newReturnDate}
              onChange={e => {
                setNewReturnDate(e.target.value);
                const days = Math.max(1, calculateRentalDays(order.expectedReturnDate, e.target.value));
                setAdditionalAmount(dailyTotalRate * days);
              }}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
            <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
              + {extraDays} kun qo‘shilmoqda
            </span>
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1">
              Qo‘shimcha to‘lov summasi (so‘m)
            </label>
            <input
              type="number"
              min="0"
              step="5000"
              value={additionalAmount}
              onChange={e => setAdditionalAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
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
              <span>Muddatni Saqlash</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
