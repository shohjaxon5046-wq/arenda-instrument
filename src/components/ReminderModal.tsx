import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  AlertCircle, 
  Clock, 
  Send, 
  Phone, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Calendar 
} from 'lucide-react';
import { RentalOrder } from '../types';
import { useRental } from '../context/RentalContext';
import { 
  formatMoney, 
  formatDate, 
  getOverdueDays, 
  isDueToday, 
  generateReminderMessage 
} from '../utils/formatters';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetOrder?: RentalOrder | null;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  targetOrder
}) => {
  const { 
    dueTodayOrders, 
    overdueOrders, 
    soundEnabled, 
    setSoundEnabled, 
    triggerSound 
  } = useRental();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Determine list of orders to show in reminder center
  const alertOrders = targetOrder
    ? [targetOrder]
    : [...overdueOrders, ...dueTodayOrders];

  const handleCopyMessage = (order: RentalOrder) => {
    const overdueDays = getOverdueDays(order.expectedReturnDate);
    const isOver = overdueDays > 0;
    const toolsList = order.items.map(i => `${i.toolName} (${i.quantity} dona)`).join(', ');
    const msg = generateReminderMessage(
      order.client.fullName,
      toolsList,
      order.expectedReturnDate,
      isOver,
      overdueDays
    );

    navigator.clipboard.writeText(msg);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenTelegram = (order: RentalOrder) => {
    const overdueDays = getOverdueDays(order.expectedReturnDate);
    const isOver = overdueDays > 0;
    const toolsList = order.items.map(i => `${i.toolName} (${i.quantity} dona)`).join(', ');
    const msg = generateReminderMessage(
      order.client.fullName,
      toolsList,
      order.expectedReturnDate,
      isOver,
      overdueDays
    );
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(msg)}`;
    window.open(tgUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Avtomatik Eslatmalar Markazi</h2>
              <p className="text-xs text-stone-400">
                Bugun qaytishi kerak bo‘lgan va muddati o‘tgan asboblarni nazorat qilish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) triggerSound();
              }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition"
              title="Ovozli eslatma"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {alertOrders.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-stone-800">
                Hozirda shoshilinch eslatmalar yo‘q
              </h3>
              <p className="text-stone-500 mt-1 max-w-xs mx-auto">
                Barcha ijaralar o‘z vaqtida yoki bugun topshirilishi kutilayotgan asboblar yo‘q.
              </p>
            </div>
          ) : (
            alertOrders.map(order => {
              const overdueDays = getOverdueDays(order.expectedReturnDate);
              const isOver = overdueDays > 0;
              const toolsList = order.items.map(i => `${i.toolName} (${i.quantity} dona)`).join(', ');
              const reminderText = generateReminderMessage(
                order.client.fullName,
                toolsList,
                order.expectedReturnDate,
                isOver,
                overdueDays
              );

              return (
                <div
                  key={order.id}
                  className={`p-4 rounded-2xl border transition ${
                    isOver
                      ? 'bg-red-50/70 border-red-200 ring-1 ring-red-100'
                      : 'bg-amber-50/70 border-amber-200 ring-1 ring-amber-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">
                          {order.client.fullName}
                        </span>
                        <span className="font-mono text-[11px] text-stone-500">
                          {order.orderNumber}
                        </span>
                      </div>
                      <a 
                        href={`tel:${order.client.phone.replace(/\s+/g, '')}`}
                        className="text-amber-800 font-bold flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        {order.client.phone}
                      </a>
                    </div>

                    <div className="text-right">
                      {isOver ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-600 text-white animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          {overdueDays} kun kechikdi!
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-stone-950">
                          <Clock className="w-3 h-3" />
                          Bugun qaytishi shart!
                        </span>
                      )}
                      <span className="block text-[10px] text-stone-500 mt-1">
                        Muddat: {formatDate(order.expectedReturnDate)}
                      </span>
                    </div>
                  </div>

                  {/* Asboblar */}
                  <div className="bg-white/80 p-2.5 rounded-xl border border-stone-200/80 mb-3 space-y-1">
                    <p className="text-[11px] font-semibold text-stone-800">
                      Olingan texnikalar: <span className="font-bold text-amber-900">{toolsList}</span>
                    </p>
                    <div className="flex justify-between text-[11px] text-stone-600">
                      <span>Jami ijara: <b>{formatMoney(order.totalRentAmount)}</b></span>
                      {order.remainingAmount > 0 && (
                        <span className="text-red-700 font-bold">Qoldiq qarz: {formatMoney(order.remainingAmount)}</span>
                      )}
                    </div>
                  </div>

                  {/* Message preview */}
                  <div className="bg-stone-900 text-stone-200 p-3 rounded-xl font-sans text-[11px] leading-relaxed relative group">
                    <p className="line-clamp-3 select-all">{reminderText}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2 mt-3">
                    <button
                      onClick={() => handleCopyMessage(order)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 transition shadow-2xs"
                    >
                      {copiedId === order.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Nusxalandi!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Matndan nusxa olish</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`sms:${order.client.phone.replace(/\s+/g, '')}?body=${encodeURIComponent(reminderText)}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-800 text-white font-bold hover:bg-stone-700 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                      <span>SMS yuborish</span>
                    </a>

                    <button
                      onClick={() => handleOpenTelegram(order)}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold transition shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Telegram orqali</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>Har kuni tizim muddati yetgan asboblarni avtomatik tarzda eslatib turadi</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition"
          >
            Yopish
          </button>
        </div>

      </div>
    </div>
  );
};
