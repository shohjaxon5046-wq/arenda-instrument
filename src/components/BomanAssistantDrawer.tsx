import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  ArrowRight, 
  Package, 
  Receipt, 
  HelpCircle, 
  Send,
  CheckCircle,
  Calendar,
  Layers,
  Search,
  MessageSquare
} from 'lucide-react';
import { useRental } from '../context/RentalContext';
import { formatMoney } from '../utils/formatters';

interface BomanAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewOrder: () => void;
  onOpenAddTool: () => void;
  onNavigateTab: (tab: any) => void;
}

export const BomanAssistantDrawer: React.FC<BomanAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onOpenNewOrder,
  onOpenAddTool,
  onNavigateTab
}) => {
  const { tools, orders, dueTodayOrders, overdueOrders } = useRental();
  const [messages, setMessages] = useState<Array<{ sender: 'boman' | 'user'; text: string; time: string }>>([]);
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleQuickPrompt = (prompt: string) => {
    const userMsg = { sender: 'user' as const, text: prompt, time: 'hozir' };
    let botReply = '';

    if (prompt.includes('mahsulot')) {
      botReply = `Hozirda tizimingizda jami ${tools.length} xil uskuna mavjud. Yangi uskuna qo'shish uchun "+ Yangi Asbob" tugmasini bosing yoki artikul va shtrix-kod kiriting.`;
      onOpenAddTool();
    } else if (prompt.includes('zakaz') || prompt.includes('buyurtma')) {
      botReply = `Faol zakazlar soni: ${orders.filter(o => o.status === 'active').length} ta. Bugun qaytishi kerak: ${dueTodayOrders.length} ta, kechikkanlar: ${overdueOrders.length} ta.`;
    } else if (prompt.includes('sozlash')) {
      botReply = "Boshlash uchun: 1) Inventarizatsiyaga uskunalar kiriting, 2) Sotuvchilarni qo'shing, 3) Mijozga yangi zakaz rasmiylashtiring va chek chiqaring.";
    } else {
      botReply = `Sizning savolingiz: "${prompt}". Men sizga ijaralarni nazorat qilishda va hisobotlarni chiqarishda doim ko'maklashaman.`;
    }

    setMessages(prev => [...prev, userMsg, { sender: 'boman', text: botReply, time: 'hozir' }]);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue('');
    handleQuickPrompt(text);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Boman Yordamchi</h3>
            <p className="text-[11px] text-slate-400">Booqable aqlli assistenti</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Intro Avatar and greeting */}
        <div className="text-center py-4 space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-b from-blue-400 via-sky-300 to-indigo-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-blue-100 opacity-50 rounded-full blur-xs"></div>
              <Sparkles className="w-8 h-8 text-blue-600 relative z-10" />
            </div>
          </div>

          <h4 className="font-bold text-slate-800 text-base">Hey, men Boman</h4>
          <p className="text-xs text-slate-500 leading-relaxed max-w-[280px] mx-auto">
            Men sizga buyurtmalarni boshqarishda, mijozlarni qidirishda, inventarizatsiyani tekshirishda va kuningizni ravon o‘tkazishda yordam bera olaman.
          </p>
        </div>

        {/* Quick Suggestion Buttons (as seen in screenshot) */}
        <div className="space-y-2">
          <button
            onClick={() => handleQuickPrompt("Birinchi mahsulotimni qo'shishga yordam bering")}
            className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">
                Birinchi mahsulotimni qo‘shishga yordam bering
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
          </button>

          <button
            onClick={() => handleQuickPrompt("Bugungi buyurtmalar va qaytarishlar")}
            className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">
                Bugungi buyurtmalar va qaytarishlar
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
          </button>

          <button
            onClick={() => handleQuickPrompt("Avval nimani sozlashim kerak?")}
            className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">
                Avval nimani sozlashim kerak?
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
          </button>
        </div>

        {/* Chat History */}
        {messages.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs max-w-[90%] ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Input Area */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            placeholder="Ijara biznesingiz haqida so‘rang..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className="w-full pl-3 pr-10 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400 shadow-xs"
          />
          <button
            type="submit"
            className="absolute right-2 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
            disabled={!inputValue.trim()}
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          Tezkor savollar va hisobotlar uchun sun’iy intellekt assistenti
        </p>
      </div>

    </div>
  );
};
