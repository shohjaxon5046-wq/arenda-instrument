import React from 'react';
import { AlertCircle, Clock, BellRing, ArrowRight, MessageSquare, Phone } from 'lucide-react';
import { useRental } from '../context/RentalContext';
import { formatDate, getOverdueDays } from '../utils/formatters';

interface AlertBannerProps {
  onOpenReminders: () => void;
  onFilterOrders: (filter: 'today' | 'overdue') => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ onOpenReminders, onFilterOrders }) => {
  const { dueTodayOrders, overdueOrders } = useRental();

  if (dueTodayOrders.length === 0 && overdueOrders.length === 0) {
    return null;
  }

  const hasOverdue = overdueOrders.length > 0;
  const hasToday = dueTodayOrders.length > 0;

  return (
    <div className={`border-b transition-all ${
      hasOverdue 
        ? 'bg-red-50 border-red-200 text-red-950' 
        : 'bg-amber-50 border-amber-200 text-amber-950'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${
              hasOverdue ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-500 text-stone-950'
            }`}>
              {hasOverdue ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-white/70 border border-stone-200 shadow-2xs">
                  Avtomatik Eslatma
                </span>
                
                {hasToday && (
                  <span className="text-xs font-semibold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full">
                    🔔 Bugun qaytishi kerak: <b>{dueTodayOrders.length} ta</b>
                  </span>
                )}

                {hasOverdue && (
                  <span className="text-xs font-bold text-red-700 bg-red-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                    ⚠️ Kechikkan (Muddati o‘tgan): <b>{overdueOrders.length} ta</b>
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-700 mt-0.5 line-clamp-1">
                {hasOverdue ? (
                  <>
                    Diqqat! <b>{overdueOrders[0].client.fullName}</b> ({overdueOrders[0].items.map(i => i.toolName).join(', ')}) ijarasi {getOverdueDays(overdueOrders[0].expectedReturnDate)} kun kechikmoqda.
                  </>
                ) : (
                  <>
                    Bugun <b>{dueTodayOrders[0].client.fullName}</b> ({dueTodayOrders[0].items.map(i => i.toolName).join(', ')}) asbobni topshirishi lozim.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {hasToday && (
              <button
                id="btn-banner-filter-today"
                onClick={() => onFilterOrders('today')}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition shadow-2xs"
              >
                Bugungilar ({dueTodayOrders.length})
              </button>
            )}

            {hasOverdue && (
              <button
                id="btn-banner-filter-overdue"
                onClick={() => onFilterOrders('overdue')}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white border border-red-300 text-red-900 hover:bg-red-100 transition shadow-2xs"
              >
                Kechikkanlar ({overdueOrders.length})
              </button>
            )}

            <button
              id="btn-banner-open-all-reminders"
              onClick={onOpenReminders}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition shadow-sm ${
                hasOverdue 
                  ? 'bg-red-700 hover:bg-red-800' 
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Eslatish markazi</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
