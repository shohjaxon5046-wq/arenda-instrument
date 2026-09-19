import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Truck, 
  Users, 
  Scale, 
  Layers, 
  Building2, 
  Check, 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  UserCheck, 
  DollarSign, 
  Package, 
  Car, 
  Container, 
  AlertTriangle, 
  ArrowRight, 
  PackageCheck, 
  FileText, 
  Settings, 
  ShieldCheck,
  Receipt,
  CheckCircle2,
  Sparkles,
  ClipboardList,
  Lock
} from 'lucide-react';
import { useRental } from '../context/RentalContext';
import { Tool, PaymentMethod, WasteTruckType, WasteMaterialType, UnifiedOrder, UnifiedOrderItem } from '../types';
import { getStoredTariffs, TARIFF_UPDATE_EVENT } from '../utils/logisticsTariffs';
import { formatMoney, getTodayDateString } from '../utils/formatters';
import { calculateDepositPrice } from '../utils/toolHelpers';
import { FartovkaTooltip } from './FartovkaTooltip';
import { AiWasteScannerModal, AiWasteAnalysisResult } from './AiWasteScannerModal';

interface UnifiedOrderViewProps {
  onOpenSettings?: () => void;
}

export const UnifiedOrderView: React.FC<UnifiedOrderViewProps> = ({ onOpenSettings }) => {
  const { tools, clients, sellers, addClient } = useRental();
  
  // Real-time Tariffs from Admin Panel
  const [tariffs, setTariffs] = useState(() => getStoredTariffs());

  useEffect(() => {
    const handleTariffUpdate = (e: any) => {
      setTariffs(e.detail || getStoredTariffs());
    };
    window.addEventListener(TARIFF_UPDATE_EVENT, handleTariffUpdate);
    return () => window.removeEventListener(TARIFF_UPDATE_EVENT, handleTariffUpdate);
  }, []);

  // View Subtabs: 'order_form' (Yangi Yagona Buyurtma) | 'orders_history' (Buyurtmalar jurnali)
  const [activeSubTab, setActiveSubTab] = useState<'order_form' | 'orders_history'>('order_form');

  // Client info state
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('+998 ');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [selectedSellerId, setSelectedSellerId] = useState<string>(sellers[0]?.id || '');
  const [deliveryDate, setDeliveryDate] = useState<string>(getTodayDateString());
  const [deliveryTime, setDeliveryTime] = useState<string>('10:00');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ================= 1. ARENDA (USKUNA IJARASI) =================
  const [enableRental, setEnableRental] = useState<boolean>(true);
  const [rentalDays, setRentalDays] = useState<number>(1);
  const [rentalItems, setRentalItems] = useState<UnifiedOrderItem[]>([]);
  const [depositNote, setDepositNote] = useState<string>('Pasport nusxasi');

  // Selected tool to add
  const [selectedToolId, setSelectedToolId] = useState<string>('');
  const [toolQuantity, setToolQuantity] = useState<number>(1);

  const recommendedDeposit = useMemo(() => {
    return rentalItems.reduce((acc, item) => {
      const tool = tools.find(t => t.id === item.toolId);
      if (!tool) return acc;
      const dep = tool.depositPrice > 0 ? tool.depositPrice : calculateDepositPrice(0, tool.dailyPrice);
      return acc + (dep * item.quantity);
    }, 0);
  }, [rentalItems, tools]);

  // ================= 2. LOGISTIKA (YETKAZISH) =================
  const [enableLogistics, setEnableLogistics] = useState<boolean>(false);
  const [logisticsVehicle, setLogisticsVehicle] = useState<'damas' | 'labo' | 'gazel'>('labo');
  const logisticsFixedPrices = {
    damas: 70000,
    labo: 100000,
    gazel: 150000
  };

  // ================= 3. GRUZCHIK (QAVATGA KO'TARISH) =================
  const [enableLoader, setEnableLoader] = useState<boolean>(false);
  const [loaderWeightKg, setLoaderWeightKg] = useState<number>(300);
  const [loaderFloor, setLoaderFloor] = useState<number>(2);
  const [loaderHasLift, setLoaderHasLift] = useState<boolean>(true);
  const [loaderLiftType, setLoaderLiftType] = useState<'yolovchi' | 'yuk'>('yolovchi');
  const [loaderDistanceMeters, setLoaderDistanceMeters] = useState<number>(10);

  // ================= 4. MUSOR (CHIQINDILARNI OLIB KETISH) =================
  const [enableWaste, setEnableWaste] = useState<boolean>(false);
  const [wasteTruckType, setWasteTruckType] = useState<WasteTruckType>('gazel');
  const [wasteMaterialType, setWasteMaterialType] = useState<WasteMaterialType>('bagged');
  const [wasteVolumeRatio, setWasteVolumeRatio] = useState<number>(1.0);
  const [wasteBaggingCount, setWasteBaggingCount] = useState<number>(0);
  const [wasteBulkyCount, setWasteBulkyCount] = useState<number>(0);

  // AI Waste Scanner states
  const [showAiScanner, setShowAiScanner] = useState<boolean>(false);
  const [aiWasteData, setAiWasteData] = useState<AiWasteAnalysisResult | null>(null);

  const handleApplyAiWaste = (result: AiWasteAnalysisResult) => {
    setEnableWaste(true);

    if (result.state === 'Sochiluvchan') {
      setWasteMaterialType('loose');
      setWasteBaggingCount(result.estimated_bags || 0);
    } else {
      setWasteMaterialType('bagged');
      setWasteBaggingCount(0);
    }

    if (result.recommended_transport.toLowerCase().includes('zil')) {
      setWasteTruckType('zil');
    } else if (result.recommended_transport.toLowerCase().includes('konteyner')) {
      setWasteTruckType('container');
    } else {
      setWasteTruckType('gazel');
    }

    if (result.volume_m3 <= 1.5) {
      setWasteVolumeRatio(0.5);
    } else if (result.volume_m3 <= 3.5) {
      setWasteVolumeRatio(1.0);
    } else {
      setWasteVolumeRatio(1.5);
    }

    if (result.recommended_loaders && result.estimated_weight_tons) {
      setEnableLoader(true);
      setLoaderWeightKg(Math.round(result.estimated_weight_tons * 1000));
    }

    setAiWasteData(result);
  };

  // Saved Unified Orders in LocalStorage
  const [unifiedOrders, setUnifiedOrders] = useState<UnifiedOrder[]>(() => {
    try {
      const saved = localStorage.getItem('unified_orders_storage_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveUnifiedOrders = (updated: UnifiedOrder[]) => {
    setUnifiedOrders(updated);
    try {
      localStorage.setItem('unified_orders_storage_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Populate client details if chosen from dropdown
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setClientName(client.fullName);
      setClientPhone(client.phone);
      setClientAddress(client.address || '');
    }
  };

  // Add Tool to Rental List
  const handleAddToolToRental = () => {
    if (!selectedToolId) return;
    const tool = tools.find(t => t.id === selectedToolId);
    if (!tool) return;

    const existingIndex = rentalItems.findIndex(i => i.toolId === tool.id);
    if (existingIndex >= 0) {
      const copy = [...rentalItems];
      copy[existingIndex].quantity += toolQuantity;
      setRentalItems(copy);
    } else {
      setRentalItems([
        ...rentalItems,
        {
          toolId: tool.id,
          toolName: tool.name,
          quantity: toolQuantity,
          dailyPrice: tool.dailyPrice
        }
      ]);
    }
    setSelectedToolId('');
    setToolQuantity(1);
  };

  const handleRemoveRentalItem = (index: number) => {
    setRentalItems(rentalItems.filter((_, idx) => idx !== index));
  };

  // --- CALCULATION LOGIC ---

  // 1. Rental calculation
  const rentalTotalAmount = useMemo(() => {
    if (!enableRental) return 0;
    const itemDailySum = rentalItems.reduce((acc, item) => acc + item.dailyPrice * item.quantity, 0);
    return itemDailySum * rentalDays;
  }, [enableRental, rentalItems, rentalDays]);

  // 2. Logistics calculation
  const logisticsTotalAmount = useMemo(() => {
    if (!enableLogistics) return 0;
    return logisticsFixedPrices[logisticsVehicle] || 100000;
  }, [enableLogistics, logisticsVehicle]);

  // 3. Gruzchik calculation
  const loaderTotalAmount = useMemo(() => {
    if (!enableLoader) return 0;
    const baseWeightCost = loaderWeightKg * tariffs.loaderPricePerKg;

    let floorCost = 0;
    if (loaderHasLift) {
      floorCost = loaderLiftType === 'yolovchi' 
        ? tariffs.loaderPassengerLiftFixed 
        : tariffs.loaderCargoLiftFixed;
    } else {
      const perFloorRate = loaderWeightKg > 500 
        ? tariffs.loaderPerFloorNoLiftHeavy 
        : tariffs.loaderPerFloorNoLiftLight;
      floorCost = loaderFloor * perFloorRate;
    }

    let distanceCost = 0;
    if (loaderDistanceMeters > 20) {
      const extraSegments = Math.ceil((loaderDistanceMeters - 20) / 10);
      distanceCost = extraSegments * tariffs.loaderEntranceDistanceRatePer10m;
    }

    return baseWeightCost + floorCost + distanceCost;
  }, [enableLoader, loaderWeightKg, loaderFloor, loaderHasLift, loaderLiftType, loaderDistanceMeters, tariffs]);

  // 4. Waste (Musor) calculation
  const wasteCalculation = useMemo(() => {
    if (!enableWaste) {
      return { total: 0, truckVolumeCost: 0, looseExtraCost: 0, baggingFee: 0, bulkyFee: 0, isLoose: false };
    }
    let baseTruck = tariffs.gazelBasePrice;
    if (wasteTruckType === 'zil') baseTruck = tariffs.zilBasePrice;
    if (wasteTruckType === 'container') baseTruck = tariffs.containerBasePrice;

    const truckVolumeCost = baseTruck * wasteVolumeRatio;
    const isLoose = wasteMaterialType === 'loose';
    const multiplier = isLoose ? tariffs.looseWasteMultiplier : 1.0;
    const adjustedTruck = truckVolumeCost * multiplier;
    const looseExtraCost = isLoose ? Math.round(adjustedTruck - truckVolumeCost) : 0;

    // Fartovka (Bagging) faqat sochiluvchan rejimda hisoblanadi
    const effectiveBaggingCount = isLoose ? wasteBaggingCount : 0;
    const baggingFee = effectiveBaggingCount * tariffs.baggingPricePerBag;
    const bulkyFee = wasteBulkyCount * tariffs.bulkyItemPricePerPiece;

    return {
      total: Math.round(adjustedTruck + baggingFee + bulkyFee),
      truckVolumeCost,
      looseExtraCost,
      baggingFee,
      bulkyFee,
      isLoose
    };
  }, [enableWaste, wasteTruckType, wasteMaterialType, wasteVolumeRatio, wasteBaggingCount, wasteBulkyCount, tariffs]);

  const wasteTotalAmount = wasteCalculation.total;

  // GRAND TOTAL
  const grandTotalAmount = useMemo(() => {
    return rentalTotalAmount + logisticsTotalAmount + loaderTotalAmount + wasteTotalAmount;
  }, [rentalTotalAmount, logisticsTotalAmount, loaderTotalAmount, wasteTotalAmount]);

  // Handle Form Submission
  const handleCreateUnifiedOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      alert('Iltimos, mijoz ismi va telefon raqamini kiriting!');
      return;
    }

    if (!enableRental && !enableLogistics && !enableLoader && !enableWaste) {
      alert('Kamida 1 ta xizmat turini (Arenda, Logistika, Gruzchik yoki Musor) tanlashingiz kerak!');
      return;
    }

    if (enableRental && rentalItems.length === 0) {
      alert('Iltimos, ijara uchun kamida bitta asbob qo‘shing yoki "Arenda" xizmatini o‘chiring.');
      return;
    }

    // Auto-create client in WMS if not exists
    let finalClientId = selectedClientId;
    if (!finalClientId) {
      const existing = clients.find(c => c.phone.replace(/\s+/g, '') === clientPhone.replace(/\s+/g, ''));
      if (existing) {
        finalClientId = existing.id;
      } else {
        const newId = `client_${Date.now()}`;
        addClient({
          fullName: clientName.trim(),
          phone: clientPhone.trim(),
          passport: 'Keltirilmagan (Yagona Buyurtma)',
          address: clientAddress.trim(),
          notes: 'Yagona Buyurtma Paneli orqali qo‘shildi'
        });
        finalClientId = newId;
      }
    }

    const orderNumber = `#UN-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: UnifiedOrder = {
      id: `ord_${Date.now()}`,
      orderNumber,
      client: {
        id: finalClientId,
        fullName: clientName.trim(),
        phone: clientPhone.trim(),
        address: clientAddress.trim()
      },
      sellerId: selectedSellerId,
      deliveryDate,
      deliveryTime,
      
      // 1. Rental
      enableRental,
      rentalItems: enableRental ? rentalItems : [],
      rentalDays: enableRental ? rentalDays : 0,
      rentalAmount: rentalTotalAmount,
      depositNote: enableRental ? depositNote : undefined,

      // 2. Logistics
      enableLogistics,
      logisticsVehicle: enableLogistics ? logisticsVehicle : 'none',
      logisticsAmount: logisticsTotalAmount,

      // 3. Loader
      enableLoader,
      loaderWeightKg: enableLoader ? loaderWeightKg : 0,
      loaderFloor: enableLoader ? loaderFloor : 0,
      loaderHasLift: enableLoader ? loaderHasLift : false,
      loaderLiftType: loaderLiftType,
      loaderAmount: loaderTotalAmount,

      // 4. Waste
      enableWaste,
      wasteTruckType,
      wasteMaterialType,
      wasteVolumeRatio,
      wasteBaggingCount,
      wasteBulkyCount,
      wasteAmount: wasteTotalAmount,

      // Overall
      totalAmount: grandTotalAmount,
      paidAmount: paidAmount > 0 ? paidAmount : grandTotalAmount,
      remainingAmount: Math.max(0, grandTotalAmount - (paidAmount > 0 ? paidAmount : grandTotalAmount)),
      paymentMethod,
      notes: orderNotes.trim(),
      status: 'active',
      createdAt: new Date().toISOString()
    };

    saveUnifiedOrders([newOrder, ...unifiedOrders]);
    setSuccessMessage(`Yagona Buyurtma ${orderNumber} muvaffaqiyatli saqlandi!`);

    // Reset form after short delay
    setTimeout(() => {
      setRentalItems([]);
      setPaidAmount(0);
      setOrderNotes('');
      setSuccessMessage(null);
      setActiveSubTab('orders_history');
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Top Banner & Title */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              All-in-One Multi-Service Platform
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Yagona Buyurtma Paneli
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Asbob-uskuna ijarasi, avto-yetkazish (logistika), qavatlarga ko‘tarish (gruzchik) hamda qurilish chiqindilarini (musor) bitta yagona buyurtma va hisob-kitob orqali boshqaring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenSettings}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Admin Narxlar Paneli</span>
            </button>
            <div className="hidden sm:block text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Dispetcherlik:</span>
              <span className="text-sm font-extrabold text-amber-400">{tariffs.supportPhone}</span>
            </div>
          </div>
        </div>

        {/* Mini stats badges */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-300 font-medium">
          <span className="flex items-center gap-1.5 text-blue-400">
            <Package className="w-4 h-4" /> 1. Asbob ijarasi (Arenda)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <Truck className="w-4 h-4" /> 2. Transport yetkazish
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Users className="w-4 h-4" /> 3. Gruzchik xizmati
          </span>
          <span className="flex items-center gap-1.5 text-red-400">
            <Trash2 className="w-4 h-4" /> 4. Chiqindini olib ketish (Musor)
          </span>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('order_form')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'order_form'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Yangi Yagona Buyurtma Yaratish</span>
        </button>

        <button
          onClick={() => setActiveSubTab('orders_history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'orders_history'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Yagona Buyurtmalar Jurnali</span>
          {unifiedOrders.length > 0 && (
            <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-blue-500 text-white">
              {unifiedOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* ===================== TAB 1: ALL-IN-ONE ORDER FORM ===================== */}
      {activeSubTab === 'order_form' && (
        <form onSubmit={handleCreateUnifiedOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT 2 COLUMNS: SERVICE MODULES & CLIENT DETAILS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 0. MIJOZ VA YETKAZISH MANZILI */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-slate-900">Mijoz va Manzil Ma’lumotlari</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  Majburiy
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mavjud Mijozlar bazasidan tanlash (yoki yangi kiritish):
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={e => handleClientSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
                  >
                    <option value="">-- Yangi mijoz (Qo‘lda kiritish) --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.phone}) - {c.address || 'Manzilsiz'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mijoz Ism-Familiyasi *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Masalan: Sardor Rahimov"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefon Raqami *</label>
                  <input
                    type="text"
                    required
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Yetkazish Manzili (Obyekt joylashuvi)</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={clientAddress}
                      onChange={e => setClientAddress(e.target.value)}
                      placeholder="Toshkent shahar, Yunusobod tumani, 4-mavze, 12-uy..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Yetkazish / Ijara Sanasi</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Buyurtmani qabul qilgan xodim</label>
                  <select
                    value={selectedSellerId}
                    onChange={e => setSelectedSellerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
                  >
                    {sellers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.roleTitle || 'Sotuvchi'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ================= 1. ARENDA (USKUNA IJARASI) ================= */}
            <div className={`p-6 rounded-2xl border transition ${
              enableRental ? 'bg-white border-blue-300 shadow-xs' : 'bg-slate-50/70 border-slate-200 opacity-75'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${enableRental ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">1. Asbob-Uskunalar Ijarasi (Arenda)</h3>
                    <p className="text-[11px] text-slate-500">Katalogdan asboblarni tanlash va muddatni belgilash</p>
                  </div>
                </div>

                {/* Enable toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableRental}
                    onChange={e => setEnableRental(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {enableRental && (
                <div className="space-y-4 pt-4 animate-in fade-in">
                  
                  {/* Select tool and quantity */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Asbobni tanlang:</label>
                      <select
                        value={selectedToolId}
                        onChange={e => setSelectedToolId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
                      >
                        <option value="">-- Asbobni tanlang --</option>
                        {tools.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({formatMoney(t.dailyPrice)}/kun) [Qoldiq: {t.availableStock} dona]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Soni (dona):</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={toolQuantity}
                        onChange={e => setToolQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-center font-bold"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddToolToRental}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Qo‘shish
                      </button>
                    </div>
                  </div>

                  {/* Selected items table */}
                  {rentalItems.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                      {rentalItems.map((item, idx) => (
                        <div key={idx} className="p-3 bg-white flex items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 block">{item.toolName}</span>
                            <span className="text-[11px] text-slate-500">
                              {item.quantity} dona × {formatMoney(item.dailyPrice)} = {formatMoney(item.dailyPrice * item.quantity)}/kun
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRentalItem(idx)}
                            className="p-1 text-slate-400 hover:text-red-600"
                            title="O‘chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
                      Hozircha birorta asbob qo‘shilmagan. Yuqoridan asbob tanlab "Qo‘shish" tugmasini bosing.
                    </div>
                  )}

                  {/* Rental Days & Deposit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ijara muddati (kun):</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRentalDays(Math.max(1, rentalDays - 1))}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg text-xs"
                        >
                          -1 kun
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={rentalDays}
                          onChange={e => setRentalDays(Math.max(1, Number(e.target.value)))}
                          className="flex-1 py-1.5 px-3 text-center border border-slate-300 rounded-lg text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setRentalDays(rentalDays + 1)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg text-xs"
                        >
                          +1 kun
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">Garov hujjati / depozit:</label>
                        {recommendedDeposit > 0 && (
                          <button 
                            type="button"
                            onClick={() => setDepositNote(`Naqd: ${formatMoney(recommendedDeposit)}`)}
                            className="text-[10px] text-blue-600 font-bold hover:underline"
                          >
                            Naqd tavsiya: {formatMoney(recommendedDeposit)}
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={depositNote}
                        onChange={e => setDepositNote(e.target.value)}
                        placeholder="Masalan: Pasport yoki 500,000 so‘m"
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ================= 2. LOGISTIKA (YETKAZIB BERISH) ================= */}
            <div className={`p-6 rounded-2xl border transition ${
              enableLogistics ? 'bg-white border-amber-300 shadow-xs' : 'bg-slate-50/70 border-slate-200 opacity-75'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${enableLogistics ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-600'}`}>
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">2. Logistika & Yetkazib Berish</h3>
                    <p className="text-[11px] text-slate-500">Obyektgacha avtomashinada yetkazish (Damas, Labo, Gazel)</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableLogistics}
                    onChange={e => setEnableLogistics(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {enableLogistics && (
                <div className="space-y-4 pt-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setLogisticsVehicle('damas')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        logisticsVehicle === 'damas'
                          ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Car className="w-5 h-5 text-amber-600 mb-1" />
                      <div className="font-bold text-xs text-slate-900">Damas Furgon</div>
                      <div className="text-[11px] text-slate-500">Kichik asboblar</div>
                      <div className="text-xs font-black text-amber-700 mt-1">{formatMoney(logisticsFixedPrices.damas)}</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLogisticsVehicle('labo')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        logisticsVehicle === 'labo'
                          ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Truck className="w-5 h-5 text-amber-600 mb-1" />
                      <div className="font-bold text-xs text-slate-900">Labo Bortli</div>
                      <div className="text-[11px] text-slate-500">O‘rtacha asboblar</div>
                      <div className="text-xs font-black text-amber-700 mt-1">{formatMoney(logisticsFixedPrices.labo)}</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLogisticsVehicle('gazel')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        logisticsVehicle === 'gazel'
                          ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Truck className="w-5 h-5 text-amber-600 mb-1" />
                      <div className="font-bold text-xs text-slate-900">Gazel Katta Bort</div>
                      <div className="text-[11px] text-slate-500">Katta uskunalar (1.5t)</div>
                      <div className="text-xs font-black text-amber-700 mt-1">{formatMoney(logisticsFixedPrices.gazel)}</div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ================= 3. GRUZCHIK (QAVATGA KO'TARISH) ================= */}
            <div className={`p-6 rounded-2xl border transition ${
              enableLoader ? 'bg-white border-emerald-300 shadow-xs' : 'bg-slate-50/70 border-slate-200 opacity-75'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${enableLoader ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">3. Gruzchik Xizmati (Qavatga ko‘tarish)</h3>
                    <p className="text-[11px] text-slate-500">Vazn (kg), qavatlar soni va lift holatiga qarab avtomatik hisob</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableLoader}
                    onChange={e => setEnableLoader(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {enableLoader && (
                <div className="space-y-4 pt-4 animate-in fade-in">
                  
                  {/* Weight Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Yuk og‘irligi:</span>
                      <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        {loaderWeightKg.toLocaleString()} kg
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="3000"
                      step="50"
                      value={loaderWeightKg}
                      onChange={e => setLoaderWeightKg(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>50 kg</span>
                      <span>500 kg</span>
                      <span>1,500 kg</span>
                      <span>3,000 kg</span>
                    </div>
                  </div>

                  {/* Floor & Lift */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold text-slate-700">Qavat soni:</span>
                        <span className="font-bold text-emerald-700">{loaderFloor}-qavat</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={loaderFloor}
                        onChange={e => setLoaderFloor(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>

                    <div>
                      <span className="block text-xs font-bold text-slate-700 mb-1">Lift mavjudligi:</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setLoaderHasLift(true)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            loaderHasLift ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Lift bor
                        </button>
                        <button
                          type="button"
                          onClick={() => setLoaderHasLift(false)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            !loaderHasLift ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Zina (Piyoda)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ================= 4. MUSOR (CHIQINDILARNI OLIB KETISH) ================= */}
            <div className={`p-6 rounded-2xl border transition ${
              enableWaste ? 'bg-white border-red-300 shadow-xs' : 'bg-slate-50/70 border-slate-200 opacity-75'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${enableWaste ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">4. Chiqindilarni Olib Ketish (Musor)</h3>
                    <p className="text-[11px] text-slate-500">Gazel, ZIL, bunker konteyner va qoplash (fartovka)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setShowAiScanner(true)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer active:scale-98"
                    title="Fotosurat orqali avtomatik baholash"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                    <span>📸 AI Foto-Baholash</span>
                  </button>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableWaste}
                      onChange={e => setEnableWaste(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>

              {/* AI Natijasi ko'rsatgichi */}
              {enableWaste && aiWasteData && (
                <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-emerald-50 border border-emerald-300 rounded-xl flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>AI Natijasi: {aiWasteData.trash_type}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 rounded">
                          {aiWasteData.confidence_score} aniqlik
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Hajm: <strong>~{aiWasteData.volume_m3} m³</strong> | Og‘irlik: <strong>~{aiWasteData.estimated_weight_tons}t</strong> | Qoplar: <strong>~{aiWasteData.estimated_bags} ta</strong> | Mos mashina: <strong>{aiWasteData.recommended_transport}</strong> | Ishchilar: <strong>{aiWasteData.recommended_loaders} kishi</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiScanner(true)}
                    className="text-amber-700 hover:text-amber-900 font-bold text-[11px] underline shrink-0 cursor-pointer"
                  >
                    Boshqa rasm
                  </button>
                </div>
              )}

              {enableWaste && (
                <div className="space-y-4 pt-4 animate-in fade-in">
                  
                  {/* Truck type */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setWasteTruckType('gazel')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        wasteTruckType === 'gazel'
                          ? 'border-red-500 bg-red-50/60 ring-2 ring-red-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900">Gazel Bortli (1.5t)</div>
                      <div className="text-[11px] text-slate-500">8 m³ gacha</div>
                      <div className="text-xs font-black text-red-600 mt-1">{formatMoney(tariffs.gazelBasePrice)}</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWasteTruckType('zil')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        wasteTruckType === 'zil'
                          ? 'border-red-500 bg-red-50/60 ring-2 ring-red-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900">ZIL Samosval (5t)</div>
                      <div className="text-[11px] text-slate-500">12 m³ gacha</div>
                      <div className="text-xs font-black text-red-600 mt-1">{formatMoney(tariffs.zilBasePrice)}</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWasteTruckType('container')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        wasteTruckType === 'container'
                          ? 'border-red-500 bg-red-50/60 ring-2 ring-red-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900">Konteyner (8m³)</div>
                      <div className="text-[11px] text-slate-500">Bunker qoldiriladi</div>
                      <div className="text-xs font-black text-red-600 mt-1">{formatMoney(tariffs.containerBasePrice)}</div>
                    </button>
                  </div>

                  {/* Material condition & Bort volume */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="block text-xs font-bold text-slate-700 mb-1">Chiqindi holati:</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setWasteMaterialType('bagged');
                            setWasteBaggingCount(0);
                          }}
                          className={`py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            wasteMaterialType === 'bagged' 
                              ? 'bg-slate-900 text-white shadow-xs' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span>Qoplangan</span>
                          <span className={`text-[10px] font-normal ${wasteMaterialType === 'bagged' ? 'text-emerald-300' : 'text-slate-400'}`}>
                            Standart tarif
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setWasteMaterialType('loose')}
                          className={`py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            wasteMaterialType === 'loose' 
                              ? 'bg-red-600 text-white shadow-xs' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span>Sochiluvchan</span>
                          <span className={`text-[10px] font-bold ${wasteMaterialType === 'loose' ? 'text-red-100' : 'text-red-600'}`}>
                            +30% transport
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-xl border transition ${
                      wasteMaterialType === 'bagged'
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-white border-amber-200 ring-1 ring-amber-500/20'
                    }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1">
                          <span className="block text-xs font-bold text-slate-700">Qoplash xizmati (Fartovka):</span>
                          <FartovkaTooltip iconSize={13} />
                        </div>
                        {wasteMaterialType === 'bagged' ? (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5 text-slate-400" />
                            O‘chirilgan
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                            {wasteBaggingCount} ta qop
                          </span>
                        )}
                      </div>

                      {/* Sanoq tugmalari: -10, -1, [input], +1, +10 */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={wasteMaterialType === 'bagged'}
                          onClick={() => setWasteBaggingCount(Math.max(0, wasteBaggingCount - 10))}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-bold text-slate-700 transition"
                          title="10 taga kamaytirish"
                        >
                          -10
                        </button>
                        <button
                          type="button"
                          disabled={wasteMaterialType === 'bagged'}
                          onClick={() => setWasteBaggingCount(Math.max(0, wasteBaggingCount - 1))}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-bold text-slate-700 transition"
                          title="1 taga kamaytirish"
                        >
                          -1
                        </button>
                        <input
                          type="number"
                          min="0"
                          max="500"
                          disabled={wasteMaterialType === 'bagged'}
                          value={wasteBaggingCount}
                          onChange={e => setWasteBaggingCount(Math.max(0, Number(e.target.value)))}
                          placeholder="0"
                          className="w-14 py-1 px-1 text-center border border-slate-300 rounded text-xs font-bold bg-white disabled:bg-slate-100 disabled:text-slate-400"
                        />
                        <button
                          type="button"
                          disabled={wasteMaterialType === 'bagged'}
                          onClick={() => setWasteBaggingCount(wasteBaggingCount + 1)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-bold text-slate-700 transition"
                          title="1 taga oshirish"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          disabled={wasteMaterialType === 'bagged'}
                          onClick={() => setWasteBaggingCount(wasteBaggingCount + 10)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-bold text-slate-700 transition"
                          title="10 taga oshirish"
                        >
                          +10
                        </button>
                      </div>

                      <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between">
                        {wasteMaterialType === 'bagged' ? (
                          <span className="text-slate-400 italic">🔒 Qoplangan rejimda fartovka talab etilmaydi</span>
                        ) : (
                          <>
                            <span>1 qop = {formatMoney(tariffs.baggingPricePerBag)}</span>
                            {wasteBaggingCount > 0 && (
                              <span className="font-bold text-amber-700">
                                Jami: {formatMoney(wasteBaggingCount * tariffs.baggingPricePerBag)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <label className="block text-xs font-bold text-slate-700 mb-1">Qo‘shimcha izoh / Haydovchi yoki Usta uchun eslatma:</label>
              <textarea
                rows={2}
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                placeholder="Shlagbaum bor, orqa eshikdan kiriladi, oldindan qo‘ng‘iroq qilinsin..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

          </div>

          {/* ================= RIGHT 1 COLUMN: LIVE ALL-IN-ONE SUMMARY CARD ================= */}
          <div className="bg-white rounded-2xl border-2 border-blue-600 p-6 shadow-xl space-y-6 sticky top-20">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 font-bold">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Yagona Hisob-Kitob</h3>
                    <p className="text-[10px] text-slate-400">Barcha xizmatlar jamlanmasi</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-900">
                  LIVE
                </span>
              </div>

              {/* Itemized breakdown per service */}
              <div className="space-y-3.5 pt-4 text-xs">
                
                {/* 1. Rental line */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-blue-600" />
                      1. Asbob ijarasi (Arenda)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {enableRental ? `${rentalItems.length} xil uskuna (${rentalDays} kun)` : 'Tanlanmagan'}
                    </span>
                  </div>
                  <span className={`font-bold ${enableRental ? 'text-slate-900' : 'text-slate-400'}`}>
                    {formatMoney(rentalTotalAmount)}
                  </span>
                </div>

                {/* 2. Logistics line */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-amber-600" />
                      2. Transport yetkazish
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {enableLogistics ? `Mashina: ${logisticsVehicle.toUpperCase()}` : 'Tanlanmagan'}
                    </span>
                  </div>
                  <span className={`font-bold ${enableLogistics ? 'text-slate-900' : 'text-slate-400'}`}>
                    {formatMoney(logisticsTotalAmount)}
                  </span>
                </div>

                {/* 3. Loader line */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      3. Gruzchik xizmati
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {enableLoader ? `${loaderWeightKg} kg, ${loaderFloor}-qavat (${loaderHasLift ? 'Lift' : 'Zina'})` : 'Tanlanmagan'}
                    </span>
                  </div>
                  <span className={`font-bold ${enableLoader ? 'text-slate-900' : 'text-slate-400'}`}>
                    {formatMoney(loaderTotalAmount)}
                  </span>
                </div>

                {/* 4. Waste line */}
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        4. Chiqindi olib ketish (Musor)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {enableWaste ? `${wasteTruckType.toUpperCase()} (${wasteMaterialType === 'loose' ? 'Sochiluvchan' : 'Qoplangan'})` : 'Tanlanmagan'}
                      </span>
                    </div>
                    <span className={`font-bold ${enableWaste ? 'text-slate-900' : 'text-slate-400'}`}>
                      {formatMoney(wasteTotalAmount)}
                    </span>
                  </div>

                  {enableWaste && wasteCalculation.isLoose && (
                    <div className="p-2 rounded-lg bg-red-50/80 border border-red-200/80 text-[10px] text-red-800 space-y-0.5">
                      <div className="flex justify-between font-semibold">
                        <span>• Transport narxi:</span>
                        <span>{formatMoney(wasteCalculation.truckVolumeCost)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-red-700">
                        <span>• Sochiluvchan ustamasi (+30% transportdan):</span>
                        <span>+{formatMoney(wasteCalculation.looseExtraCost)}</span>
                      </div>
                      {wasteCalculation.baggingFee > 0 && (
                        <div className="flex justify-between text-amber-900 font-semibold pt-0.5 border-t border-red-200/60">
                          <span className="flex items-center gap-1">
                            • Fartovka ({wasteBaggingCount} qop):
                            <FartovkaTooltip iconSize={11} />
                          </span>
                          <span>+{formatMoney(wasteCalculation.baggingFee)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {enableWaste && !wasteCalculation.isLoose && (
                    <div className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 flex justify-between">
                      <span>• Qoplangan chiqindi: standart tarif</span>
                      <span className="text-emerald-700 font-bold">Fartovkasiz</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment & Grand Total Box */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              
              {/* Grand Total */}
              <div className="flex justify-between items-end bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">JAMI YAKUNIY SUMMA:</span>
                  <span className="text-[10px] text-slate-400">Yagona buyurtma ostida</span>
                </div>
                <div className="text-2xl font-black text-blue-700">
                  {formatMoney(grandTotalAmount)}
                </div>
              </div>

              {/* Payment details */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">To‘lov turi:</span>
                  <div className="flex gap-1">
                    {(['cash', 'card', 'transfer'] as PaymentMethod[]).map(pm => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setPaymentMethod(pm)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition cursor-pointer ${
                          paymentMethod === pm ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {pm === 'cash' ? 'Naqd' : pm === 'card' ? 'Karta' : 'Perevod'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Oldindan to‘langan summa (so‘m):</label>
                  <input
                    type="number"
                    step="10000"
                    value={paidAmount || ''}
                    placeholder={`To‘liq: ${grandTotalAmount.toLocaleString()}`}
                    onChange={e => setPaidAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              {successMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition cursor-pointer"
              >
                <span>Yagona Buyurtmani Rasmiylashtirish</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-500 border border-slate-200 text-center">
                Barcha 4 xizmat bitta buyurtma ID raqami ostida jurnallanadi.
              </div>
            </div>

          </div>

        </form>
      )}

      {/* ===================== TAB 2: UNIFIED ORDERS HISTORY ===================== */}
      {activeSubTab === 'orders_history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                Yagona Buyurtmalar Jurnali
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ijara, logistika, yuk ko‘tarish va chiqindilar jamlangan buyurtmalar arxivi
              </p>
            </div>

            <button
              onClick={() => setActiveSubTab('order_form')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Yangi Buyurtma</span>
            </button>
          </div>

          {unifiedOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <PackageCheck className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <p className="text-sm font-bold text-slate-700">Hozircha yagona buyurtmalar mavjud emas</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                "Yangi Yagona Buyurtma Yaratish" bo‘limida barcha xizmatlarni tanlab tasdiqlasangiz, ushbu ro‘yxatda aks etadi.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {unifiedOrders.map(order => (
                <div key={order.id} className="p-5 hover:bg-slate-50 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-black bg-blue-900 text-white">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        {order.status === 'active' ? 'Faol' : 'Bajarildi'}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{order.client.fullName}</span>
                      <span className="text-xs font-mono font-normal text-slate-500">({order.client.phone})</span>
                      {order.client.address && (
                        <span className="text-xs font-normal text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {order.client.address}
                        </span>
                      )}
                    </div>

                    {/* Services badge tags */}
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                      {order.enableRental && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold flex items-center gap-1">
                          <Package className="w-3 h-3" /> Arenda: {formatMoney(order.rentalAmount)} ({order.rentalItems.length} uskuna)
                        </span>
                      )}
                      {order.enableLogistics && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Yetkazish ({order.logisticsVehicle.toUpperCase()}): {formatMoney(order.logisticsAmount)}
                        </span>
                      )}
                      {order.enableLoader && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-1">
                          <Users className="w-3 h-3" /> Gruzchik: {formatMoney(order.loaderAmount)} ({order.loaderWeightKg}kg, {order.loaderFloor}-qavat)
                        </span>
                      )}
                      {order.enableWaste && (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-800 font-bold flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Musor ({order.wasteTruckType.toUpperCase()}): {formatMoney(order.wasteAmount)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-left lg:text-right shrink-0 space-y-2">
                    <div className="text-xl font-black text-blue-700">
                      {formatMoney(order.totalAmount)}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      To‘langan: <strong>{formatMoney(order.paidAmount)}</strong> | Qoldiq: <strong>{formatMoney(order.remainingAmount)}</strong>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Ushbu yagona buyurtmani o‘chirmoqchimisiz?')) {
                          saveUnifiedOrders(unifiedOrders.filter(o => o.id !== order.id));
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 transition"
                      title="O‘chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Waste Scanner Modal */}
      <AiWasteScannerModal
        isOpen={showAiScanner}
        onClose={() => setShowAiScanner(false)}
        onApplyResult={handleApplyAiWaste}
      />

    </div>
  );
};
