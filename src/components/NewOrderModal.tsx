import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CreditCard, 
  ShieldCheck, 
  FileText, 
  Layers, 
  Check, 
  AlertCircle,
  Tag,
  Percent,
  Sparkles,
  Gift
} from 'lucide-react';
import { Tool, Client, RentalOrder, PaymentMethod } from '../types';
import { useRental } from '../context/RentalContext';
import { getTodayDateString, calculateRentalDays, formatMoney } from '../utils/formatters';
import { calculateDepositPrice } from '../utils/toolHelpers';
import { AsyncToolImage } from './AsyncToolImage';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedTool?: Tool | null;
  preSelectedSellerId?: string | null;
  preSelectedClient?: Client | null;
  onOrderCreated: (order: RentalOrder) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  preSelectedTool,
  preSelectedSellerId,
  preSelectedClient,
  onOrderCreated
}) => {
  const { tools, clients, sellers, createOrder } = useRental();

  // Seller & Client form state
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('new');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('+998 ');
  const [clientPassport, setClientPassport] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  // Items in order: [{ toolId, quantity }]
  const [selectedItems, setSelectedItems] = useState<{ toolId: string; quantity: number }[]>([]);

  // Dates
  const todayStr = getTodayDateString();
  const [startDate, setStartDate] = useState(todayStr);
  const [expectedReturnDate, setExpectedReturnDate] = useState(() => {
    // Tomorrow by default
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  });

  // Deposit & Payment
  const [depositType, setDepositType] = useState<'passport' | 'cash' | 'driver_license' | 'other'>('passport');
  const [depositNote, setDepositNote] = useState('Pasport asl olindi');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  // Discount / Skidka state
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'fixed'>('none');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountFixed, setDiscountFixed] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("Ko'p kunga chegirma");

  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle preSelectedClient
  useEffect(() => {
    if (isOpen && preSelectedClient) {
      setSelectedClientId(preSelectedClient.id);
      setClientName(preSelectedClient.fullName);
      setClientPhone(preSelectedClient.phone);
      setClientPassport(preSelectedClient.passport);
      setClientAddress(preSelectedClient.address || '');
    }
  }, [isOpen, preSelectedClient]);

  // Handle preSelectedTool
  useEffect(() => {
    if (preSelectedTool && preSelectedTool.availableStock > 0) {
      setSelectedItems([{ toolId: preSelectedTool.id, quantity: 1 }]);
    }
  }, [preSelectedTool]);

  // Handle seller selection on open or prop change
  useEffect(() => {
    if (isOpen) {
      if (preSelectedSellerId) {
        setSelectedSellerId(preSelectedSellerId);
      } else if (!selectedSellerId && sellers && sellers.length > 0) {
        const firstActive = sellers.find(s => s.active) || sellers[0];
        if (firstActive) {
          setSelectedSellerId(firstActive.id);
        }
      }
    }
  }, [isOpen, preSelectedSellerId, sellers, selectedSellerId]);

  // When selecting existing client
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId === 'new') {
      setClientName('');
      setClientPhone('+998 ');
      setClientPassport('');
      setClientAddress('');
    } else {
      const cli = clients.find(c => c.id === clientId);
      if (cli) {
        setClientName(cli.fullName);
        setClientPhone(cli.phone);
        setClientPassport(cli.passport);
        setClientAddress(cli.address || '');
      }
    }
  };

  // Add tool item
  const handleAddItem = (toolId: string) => {
    if (!toolId) return;
    const existing = selectedItems.find(i => i.toolId === toolId);
    const tool = tools.find(t => t.id === toolId);
    if (!tool || tool.availableStock <= 0) return;

    if (existing) {
      if (existing.quantity < tool.availableStock) {
        setSelectedItems(prev =>
          prev.map(i => (i.toolId === toolId ? { ...i, quantity: i.quantity + 1 } : i))
        );
      }
    } else {
      setSelectedItems(prev => [...prev, { toolId, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (toolId: string, delta: number) => {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;

    setSelectedItems(prev =>
      prev
        .map(i => {
          if (i.toolId === toolId) {
            const nextQty = i.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > tool.availableStock) return i; // Cap at available stock
            return { ...i, quantity: nextQty };
          }
          return i;
        })
        .filter(Boolean) as { toolId: string; quantity: number }[]
    );
  };

  const handleRemoveItem = (toolId: string) => {
    setSelectedItems(prev => prev.filter(i => i.toolId !== toolId));
  };

  // Calculations
  const rentalDays = calculateRentalDays(startDate, expectedReturnDate);

  let subtotalAmount = 0;
  for (const item of selectedItems) {
    const tool = tools.find(t => t.id === item.toolId);
    if (tool) {
      subtotalAmount += tool.dailyPrice * item.quantity * rentalDays;
    }
  }

  // Calculated discount amount
  let calculatedDiscountAmount = 0;
  if (discountType === 'percent' && discountPercent > 0) {
    calculatedDiscountAmount = Math.min(subtotalAmount, Math.round(subtotalAmount * (discountPercent / 100)));
  } else if (discountType === 'fixed' && discountFixed > 0) {
    calculatedDiscountAmount = Math.min(subtotalAmount, Math.round(discountFixed));
  }

  const finalTotalAmount = Math.max(0, subtotalAmount - calculatedDiscountAmount);

  // Quick discount preset selector
  const handleApplyDiscountPreset = (percent: number, reason: string) => {
    if (percent === 0) {
      setDiscountType('none');
      setDiscountPercent(0);
      setDiscountFixed(0);
    } else {
      setDiscountType('percent');
      setDiscountPercent(percent);
      setDiscountFixed(0);
      setDiscountReason(reason);
    }
  };

  // Update suggested deposit note when type changes
  const handleDepositTypeChange = (type: 'passport' | 'cash' | 'driver_license' | 'other') => {
    setDepositType(type);
    if (type === 'passport') setDepositNote('Pasport asl nusxasi');
    else if (type === 'cash') {
      const totalDeposit = selectedItems.reduce((acc, item) => {
        const tool = tools.find(t => t.id === item.toolId);
        if (!tool) return acc;
        const dep = tool.depositPrice > 0 ? tool.depositPrice : calculateDepositPrice(0, tool.dailyPrice);
        return acc + (dep * item.quantity);
      }, 0);
      setDepositNote(totalDeposit > 0 ? `Naqd garov puli: ${formatMoney(totalDeposit)}` : 'Naqd garov puli: 1 000 000 so‘m');
    }
    else if (type === 'driver_license') setDepositNote('Prava haydovchilik guvohnomasi');
    else setDepositNote('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedSellerId) {
      setErrorMessage('Iltimos, sotuvchini tanlang');
      return;
    }

    if (!clientName.trim()) {
      setErrorMessage('Iltimos, mijoz ismini kiriting');
      return;
    }

    if (!clientPhone.trim() || clientPhone === '+998 ') {
      setErrorMessage('Iltimos, mijoz telefon raqamini kiriting');
      return;
    }

    if (selectedItems.length === 0) {
      setErrorMessage('Kamida bitta asbob tanlang');
      return;
    }

    if (!startDate || !expectedReturnDate) {
      setErrorMessage('Olingan va qaytarish sanasini belgilang');
      return;
    }

    if (expectedReturnDate < startDate) {
      setErrorMessage('Qaytarish sanasi olingan sanadan oldin bo‘lishi mumkin emas');
      return;
    }

    const newOrder = createOrder({
      sellerId: selectedSellerId,
      client: {
        id: selectedClientId !== 'new' ? selectedClientId : undefined,
        fullName: clientName.trim(),
        phone: clientPhone.trim(),
        passport: clientPassport.trim(),
        address: clientAddress.trim()
      },
      items: selectedItems,
      startDate,
      expectedReturnDate,
      paidAmount: Number(paidAmount) || 0,
      paymentMethod,
      depositType,
      depositNote: depositNote.trim() || 'Garov hujjati',
      discountPercent: discountType === 'percent' ? discountPercent : (subtotalAmount > 0 && calculatedDiscountAmount > 0 ? Math.round((calculatedDiscountAmount / subtotalAmount) * 100) : 0),
      discountAmount: calculatedDiscountAmount,
      discountReason: calculatedDiscountAmount > 0 ? discountReason : undefined,
      notes: notes.trim()
    });

    if (newOrder) {
      onOrderCreated(newOrder);
      onClose();
    } else {
      setErrorMessage('Zakazni saqlashda xatolik yuz berdi');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-black">
              +
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Yangi Zakaz Ochish</h2>
              <p className="text-xs text-stone-400">
                Mijozga asbobni ijaraga berish va shartnoma kiritish
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SECTION 1: Client Information */}
          <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-stone-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <User className="w-4 h-4 text-blue-600" />
                1. Sotuvchi va Mijoz
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 pb-3 border-b border-stone-200">
              <div>
                <label className="block text-stone-600 font-medium mb-1">
                  Sotuvchini tanlang *
                </label>
                <select
                  value={selectedSellerId}
                  onChange={e => setSelectedSellerId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                >
                  <option value="" disabled>-- Sotuvchini tanlang --</option>
                  {sellers.filter(s => s.active).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">
                  Mijoz bazadan tanlash
                </label>
                {clients.length > 0 ? (
                  <select
                    value={selectedClientId}
                    onChange={e => handleSelectClient(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="new">+ Yangi Mijoz kiritish</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.phone})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 text-sm">
                    Mijozlar bazasi bo'sh
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-600 font-medium mb-1">
                  Mijozning F.I.Sh (Ism-familiya) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Azizbek Rahimov"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">
                  Telefon raqami *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+998 90 123 45 67"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">
                  Pasport yoki ID seriya raqami
                </label>
                <input
                  type="text"
                  placeholder="AB 1234567"
                  value={clientPassport}
                  onChange={e => setClientPassport(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">
                  Yashash manzili
                </label>
                <input
                  type="text"
                  placeholder="Toshkent sh., Yunusobod..."
                  value={clientAddress}
                  onChange={e => setClientAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Tool Selection */}
          <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Layers className="w-4 h-4 text-blue-600" />
                2. Berilayotgan Asboblar ({selectedItems.length} xil)
              </span>

              {/* Quick tool selector dropdown */}
              <select
                onChange={e => {
                  if (e.target.value) {
                    handleAddItem(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="py-1 px-2.5 bg-blue-600 text-white font-bold border border-blue-700 rounded-lg text-xs cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>+ Asbob qo‘shish...</option>
                {tools
                  .filter(t => t.availableStock > 0)
                  .map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.availableStock} ta bo‘sh - {formatMoney(t.dailyPrice)}/k)
                    </option>
                  ))}
              </select>
            </div>

            {/* Selected Items List */}
            {selectedItems.length === 0 ? (
              <div className="p-4 text-center bg-white rounded-xl border border-dashed border-stone-300 text-stone-500">
                Hozircha hech qanday asbob tanlanmadi. Yuqoridagi <b>"+ Asbob qo‘shish"</b> menyusidan tanlang.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedItems.map(item => {
                  const tool = tools.find(t => t.id === item.toolId);
                  if (!tool) return null;
                  const itemSubtotal = tool.dailyPrice * item.quantity * rentalDays;

                  return (
                    <div
                      key={tool.id}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-200 gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <AsyncToolImage
                          toolName={tool.name}
                          originalUrl={tool.imageUrl}
                          className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-200"
                        />
                        <div>
                          <p className="font-bold text-stone-900">{tool.name}</p>
                          <p className="text-[11px] text-stone-500 font-mono">
                            Art: <span className="text-blue-700 font-semibold">{tool.article}</span> | Kod: {tool.code}
                          </p>
                        </div>
                      </div>

                      {/* Quantity counter */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-stone-300 rounded-lg bg-stone-50">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(tool.id, -1)}
                            className="px-2.5 py-1 text-stone-600 hover:bg-stone-200 font-bold rounded-l-lg"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 font-bold text-stone-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(tool.id, 1)}
                            disabled={item.quantity >= tool.availableStock}
                            className="px-2.5 py-1 text-stone-600 hover:bg-stone-200 font-bold rounded-r-lg disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right min-w-[90px]">
                          <span className="font-black text-amber-700 block">
                            {formatMoney(itemSubtotal)}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {formatMoney(tool.dailyPrice)} × {item.quantity} dona
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(tool.id)}
                          className="p-1 text-stone-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: Dates & Rental Duration */}
          <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <span className="font-bold text-stone-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <Calendar className="w-4 h-4 text-amber-600" />
              3. Ijara Muddatlari (Kunlar Hisobi)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-stone-600 font-medium mb-1">
                  Olingan sana (Boshlanishi)
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">
                  Qaytarish sanasi (Oxirgi kun) *
                </label>
                <input
                  type="date"
                  required
                  value={expectedReturnDate}
                  min={startDate}
                  onChange={e => setExpectedReturnDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="p-2 bg-amber-100/80 border border-amber-300 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-900 block">Jami Ijara Muddati</span>
                  <span className="text-base font-black text-amber-950">{rentalDays} kun</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Discount / Skidka */}
          <div className="space-y-3 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Tag className="w-4 h-4 text-amber-600" />
                4. Skidka / Chegirma (Ko‘p kunga arzonlashtirish)
              </span>
              {calculatedDiscountAmount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5" />
                  -{formatMoney(calculatedDiscountAmount)} tejaldi
                </span>
              )}
            </div>

            {/* Smart discount recommendation for long rentals */}
            {rentalDays >= 3 && (
              <div className="p-2.5 bg-amber-100/90 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Ko‘p kunlik ijara tavsiyasi: </span>
                  Mijoz <b>{rentalDays} kunga</b> olyapti. {rentalDays >= 10 ? '15% yoki 20%' : rentalDays >= 5 ? '10% yoki 15%' : '5%'} skidka berishingiz mumkin.
                </div>
              </div>
            )}

            {/* Quick Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleApplyDiscountPreset(0, '')}
                className={`py-2 px-2 rounded-xl font-bold border transition text-center ${
                  discountType === 'none'
                    ? 'bg-stone-900 text-amber-400 border-stone-900'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                }`}
              >
                Skidkasiz (0%)
              </button>

              <button
                type="button"
                onClick={() => handleApplyDiscountPreset(5, "Ko‘p kunga (3+ kun) chegirma")}
                className={`py-2 px-2 rounded-xl font-bold border transition text-center ${
                  discountType === 'percent' && discountPercent === 5
                    ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-amber-50'
                }`}
              >
                5% skidka
              </button>

              <button
                type="button"
                onClick={() => handleApplyDiscountPreset(10, "Ko‘p kunga (5+ kun) chegirma")}
                className={`py-2 px-2 rounded-xl font-bold border transition text-center ${
                  discountType === 'percent' && discountPercent === 10
                    ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-amber-50'
                }`}
              >
                10% skidka
              </button>

              <button
                type="button"
                onClick={() => handleApplyDiscountPreset(15, "Ko‘p kunga (10+ kun) chegirma")}
                className={`py-2 px-2 rounded-xl font-bold border transition text-center ${
                  discountType === 'percent' && discountPercent === 15
                    ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-amber-50'
                }`}
              >
                15% skidka
              </button>

              <button
                type="button"
                onClick={() => handleApplyDiscountPreset(20, "Uzoq muddatli (20+ kun) chegirma")}
                className={`py-2 px-2 rounded-xl font-bold border transition text-center ${
                  discountType === 'percent' && discountPercent === 20
                    ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-amber-50'
                }`}
              >
                20% skidka
              </button>

              <button
                type="button"
                onClick={() => {
                  setDiscountType('fixed');
                  setDiscountPercent(0);
                  if (discountFixed === 0) setDiscountFixed(20000);
                }}
                className={`py-2 px-2 rounded-xl font-bold border transition text-center ${
                  discountType === 'fixed'
                    ? 'bg-stone-900 text-amber-400 border-stone-900'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                }`}
              >
                💵 So‘mda (Qo‘lda)
              </button>
            </div>

            {/* Custom Input Details if discount active */}
            {discountType !== 'none' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/80">
                <div>
                  <label className="block text-stone-700 font-bold mb-1 text-xs">
                    {discountType === 'percent' ? 'Chegirma foizi (%)' : 'Chegirma summasi (so‘mda)'}
                  </label>
                  <div className="flex items-center gap-2">
                    {discountType === 'percent' ? (
                      <div className="relative w-full">
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={discountPercent}
                          onChange={e => setDiscountPercent(Math.max(0, Math.min(90, Number(e.target.value))))}
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-stone-900 pr-8 focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-sm"
                        />
                        <span className="absolute right-3 top-2.5 font-bold text-stone-400 text-sm">%</span>
                      </div>
                    ) : (
                      <div className="relative w-full">
                        <input
                          type="number"
                          min="0"
                          step="5000"
                          value={discountFixed}
                          onChange={e => setDiscountFixed(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-stone-900 pr-14 focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-sm"
                        />
                        <span className="absolute right-3 top-2.5 font-bold text-stone-400 text-xs">so‘m</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1 text-xs">
                    Skidka sababi / izohi
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: Ko‘p kunga olingani uchun, Doimiy mijoz"
                    value={discountReason}
                    onChange={e => setDiscountReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: Deposit & Payment */}
          <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <span className="font-bold text-stone-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              5. Garov va To‘lov Hisob-Kitobi
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-600 font-medium mb-1">
                  Garov turi
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDepositTypeChange('passport')}
                    className={`p-2 rounded-xl border text-center font-bold transition ${
                      depositType === 'passport'
                        ? 'bg-stone-900 text-blue-400 border-stone-900'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    🪪 Pasport
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDepositTypeChange('cash')}
                    className={`p-2 rounded-xl border text-center font-bold transition ${
                      depositType === 'cash'
                        ? 'bg-stone-900 text-amber-400 border-stone-900'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    💵 Naqd pul
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDepositTypeChange('driver_license')}
                    className={`p-2 rounded-xl border text-center font-bold transition ${
                      depositType === 'driver_license'
                        ? 'bg-stone-900 text-amber-400 border-stone-900'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    🚗 Prava
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDepositTypeChange('other')}
                    className={`p-2 rounded-xl border text-center font-bold transition ${
                      depositType === 'other'
                        ? 'bg-stone-900 text-amber-400 border-stone-900'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    📦 Boshqa
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">
                  Garov haqida izoh / hujjat raqami
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Pasport asl nusxasi yoki 1,000,000 so‘m"
                  value={depositNote}
                  onChange={e => setDepositNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">
                  Oldindan to‘langan summa (so‘m)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={paidAmount}
                    onChange={e => setPaidAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setPaidAmount(finalTotalAmount)}
                    className="px-3 py-2 rounded-xl bg-stone-200 text-stone-700 font-bold hover:bg-stone-300 transition whitespace-nowrap"
                  >
                    To‘liq
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">
                  To‘lov turi (qanday qabul qilindi)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-2 rounded-xl border text-center font-bold text-xs transition ${
                      paymentMethod === 'cash'
                        ? 'bg-stone-900 text-blue-400 border-stone-900'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    💵 Naqd pul
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2 rounded-xl border text-center font-bold text-xs transition ${
                      paymentMethod === 'card'
                        ? 'bg-stone-900 text-blue-400 border-stone-900'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    💳 Karta
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`p-2 rounded-xl border text-center font-bold text-xs transition ${
                      paymentMethod === 'transfer'
                        ? 'bg-stone-900 text-blue-400 border-stone-900'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    🏦 Perevod
                  </button>
                </div>
              </div>

              {/* Total Balance Card */}
              <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1">
                <div className="flex justify-between text-stone-600 text-xs">
                  <span>Asl hisoblangan summa:</span>
                  <span className="font-semibold">{formatMoney(subtotalAmount)}</span>
                </div>

                {calculatedDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold text-xs">
                    <span>Skidka / Chegirma:</span>
                    <span>-{formatMoney(calculatedDiscountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-900 font-bold pt-1 border-t border-stone-100">
                  <span>To‘lanishi kerak:</span>
                  <b className="text-stone-900 text-sm">{formatMoney(finalTotalAmount)}</b>
                </div>

                <div className="flex justify-between text-stone-900 pt-1 border-t border-stone-100">
                  <span className="font-bold">Qoldiq qarz:</span>
                  <b className="font-black text-sm text-red-600">
                    {formatMoney(Math.max(0, finalTotalAmount - paidAmount))}
                  </b>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-stone-600 font-medium mb-1">
                Qo‘shimcha izoh / shartlar
              </label>
              <input
                type="text"
                placeholder="Masalan: Kafel teshish uchun oldi, komplektida 3 ta bur bor..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-stone-200">
            <div>
              <span className="text-stone-500 text-xs">Jami to‘lanishi kerak:</span>
              <div className="flex items-baseline gap-2">
                <p className="text-lg font-black text-blue-600 leading-tight">
                  {formatMoney(finalTotalAmount)}
                </p>
                {calculatedDiscountAmount > 0 && (
                  <span className="text-xs text-stone-400 line-through">
                    {formatMoney(subtotalAmount)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 transition"
              >
                Bekor qilish
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Zakazni Saqlash</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
