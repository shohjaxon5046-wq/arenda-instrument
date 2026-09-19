import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  DollarSign, 
  Check,
  Wrench
} from 'lucide-react';
import { RentalOrder, PaymentMethod } from '../types';
import { useRental } from '../context/RentalContext';
import { formatMoney, formatDate, getOverdueDays } from '../utils/formatters';

interface ReturnOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RentalOrder | null;
}

export const ReturnOrderModal: React.FC<ReturnOrderModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const { returnOrder, sendToRepair } = useRental();

  const [penaltyAmount, setPenaltyAmount] = useState<number>(0);
  const [returnNotes, setReturnNotes] = useState('Asboblar soz holatda, toza qilib qabul qilindi.');
  const [depositReturned, setDepositReturned] = useState(true);
  const [finalPaymentMethod, setFinalPaymentMethod] = useState<PaymentMethod>('cash');

  // Damage / Repair Claim fields
  const [hasDamageClaim, setHasDamageClaim] = useState(false);
  const [damagedToolId, setDamagedToolId] = useState(order?.items[0]?.toolId || '');
  const [damageDefectNote, setDamageDefectNote] = useState('');
  const [damageClaimAmount, setDamageClaimAmount] = useState<number>(0);
  const [damageClaimSettled, setDamageClaimSettled] = useState(false);

  if (!isOpen || !order) return null;

  const overdueDays = getOverdueDays(order.expectedReturnDate);
  const isOverdue = overdueDays > 0;

  // Calculate suggested overdue charge
  const suggestedPenalty = isOverdue
    ? order.items.reduce((acc, item) => acc + item.dailyPrice * item.quantity, 0) * overdueDays
    : 0;

  const totalToSettle = order.remainingAmount + Number(penaltyAmount || 0);

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();

    if (hasDamageClaim && damageDefectNote.trim()) {
      const toolToRepair = order.items.find(i => i.toolId === damagedToolId) || order.items[0];
      if (toolToRepair) {
        sendToRepair({
          toolId: toolToRepair.toolId,
          quantity: 1,
          defectDescription: damageDefectNote.trim(),
          masterName: 'Servis / Usta',
          estimatedCost: damageClaimAmount,
          clientId: order.client.id,
          clientName: order.client.fullName,
          orderId: order.id,
          orderNumber: order.orderNumber,
          claimAmount: damageClaimAmount,
          claimSettled: damageClaimSettled,
          claimType: 'damage'
        });
      }
    }

    const damageNoteText = hasDamageClaim && damageDefectNote.trim()
      ? ` | Nuqson da‘vosi: ${damageDefectNote.trim()} (${formatMoney(damageClaimAmount)}, ${damageClaimSettled ? 'to‘landi' : 'ochiq'})`
      : '';

    returnOrder(
      order.id, 
      penaltyAmount, 
      `${returnNotes} (Garov qaytarildi: ${depositReturned ? 'Ha' : 'Yo‘q'})${damageNoteText}`,
      finalPaymentMethod
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white text-emerald-800 flex items-center justify-center font-black">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Asbobni Qaytarib Olish</h2>
              <p className="text-xs text-emerald-100">
                Zakaz {order.orderNumber} - {order.client.fullName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConfirmReturn} className="p-6 space-y-4 text-xs">
          
          {/* Overdue alert if late */}
          {isOverdue && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <b className="block font-bold">Kechikkan ijara: {overdueDays} kun o‘tdi!</b>
                <span>
                  Tavsiya etilgan qo‘shimcha to‘lov: <b>{formatMoney(suggestedPenalty)}</b>
                </span>
              </div>
            </div>
          )}

          {/* Returned Items List */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2">
            <span className="font-bold text-stone-700 block uppercase text-[10px] tracking-wider">
              Omborga qaytariladigan asboblar:
            </span>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="font-bold text-stone-900">{item.toolName}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                  +{item.quantity} dona
                </span>
              </div>
            ))}
          </div>

          {/* Deposit check */}
          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span className="font-bold text-amber-950">Garovni qaytarish:</span>
            </div>
            <p className="text-stone-700">
              Mijoz topshirgan garov: <b>{order.depositNote}</b>
            </p>
            <label className="flex items-center gap-2 text-stone-900 font-semibold cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={depositReturned}
                onChange={e => setDepositReturned(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <span>Garov hujjati / puli mijozga to‘liq qaytarib berildi</span>
            </label>
          </div>

          {/* Damage / Repair Claim Toggle */}
          <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 space-y-2">
            <label className="flex items-center gap-2 text-rose-950 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={hasDamageClaim}
                onChange={e => setHasDamageClaim(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded"
              />
              <span className="flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-rose-600" />
                Asbobda shikastlanish/nuqson bor (Mijozga ta‘mir da‘vosi ochish)
              </span>
            </label>

            {hasDamageClaim && (
              <div className="space-y-2.5 pt-2 border-t border-rose-200/80">
                {order.items.length > 1 && (
                  <div>
                    <label className="block text-stone-700 font-bold mb-1 text-[11px]">
                      Shikastlangan asbob:
                    </label>
                    <select
                      value={damagedToolId}
                      onChange={e => setDamagedToolId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-semibold text-stone-900"
                    >
                      {order.items.map(i => (
                        <option key={i.toolId} value={i.toolId}>
                          {i.toolName} ({i.article})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-stone-700 font-bold mb-1 text-[11px]">
                    Nosozlik / Shikastlanish tafsiloti *
                  </label>
                  <input
                    type="text"
                    required={hasDamageClaim}
                    value={damageDefectNote}
                    onChange={e => setDamageDefectNote(e.target.value)}
                    placeholder="Masalan: Patron singan, korpus yorilgan"
                    className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs text-stone-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1 text-[11px]">
                      Undiriladigan summa (so‘m):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={damageClaimAmount}
                      onChange={e => setDamageClaimAmount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-bold text-rose-700"
                    />
                  </div>

                  <div className="flex items-end pb-1.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={damageClaimSettled}
                        onChange={e => setDamageClaimSettled(e.target.checked)}
                        className="w-3.5 h-3.5 text-emerald-600 rounded"
                      />
                      <span>Zararni joyida to‘ladi</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Financial Settlement */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-600 font-bold mb-1">
                  Qoldiq qarz summasi:
                </label>
                <div className="p-2 bg-stone-100 rounded-xl font-bold text-stone-900">
                  {formatMoney(order.remainingAmount)}
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">
                  Kechikish jarimasi (so‘m):
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={penaltyAmount}
                  onChange={e => setPenaltyAmount(Number(e.target.value))}
                  placeholder={suggestedPenalty > 0 ? String(suggestedPenalty) : '0'}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {totalToSettle > 0 && (
              <div className="p-3 bg-stone-100 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-stone-900">
                  <span>Hozir undiriladigan yakuniy to‘lov:</span>
                  <span className="text-emerald-700 text-sm font-black">{formatMoney(totalToSettle)}</span>
                </div>
                <div>
                  <label className="block text-stone-600 font-bold mb-1 text-[11px]">
                    To‘lov usuli:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFinalPaymentMethod('cash')}
                      className={`p-1.5 rounded-lg border text-center font-bold text-xs transition ${
                        finalPaymentMethod === 'cash'
                          ? 'bg-stone-900 text-amber-400 border-stone-900'
                          : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      💵 Naqd
                    </button>
                    <button
                      type="button"
                      onClick={() => setFinalPaymentMethod('card')}
                      className={`p-1.5 rounded-lg border text-center font-bold text-xs transition ${
                        finalPaymentMethod === 'card'
                          ? 'bg-stone-900 text-amber-400 border-stone-900'
                          : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      💳 Karta
                    </button>
                    <button
                      type="button"
                      onClick={() => setFinalPaymentMethod('transfer')}
                      className={`p-1.5 rounded-lg border text-center font-bold text-xs transition ${
                        finalPaymentMethod === 'transfer'
                          ? 'bg-stone-900 text-amber-400 border-stone-900'
                          : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      🏦 Perevod
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-stone-600 font-bold mb-1">
                Asbob holati va qabul qilish izohi:
              </label>
              <input
                type="text"
                value={returnNotes}
                onChange={e => setReturnNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Actions */}
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Qabul Qilish & Zakazni Yopish</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
