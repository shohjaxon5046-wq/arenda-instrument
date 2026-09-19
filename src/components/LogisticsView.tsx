import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  Users, 
  Trash2, 
  Scale, 
  Layers, 
  Building2, 
  Check, 
  AlertTriangle, 
  Phone, 
  Plus, 
  Clock, 
  ArrowRight, 
  Calendar, 
  UserCheck, 
  MapPin, 
  X, 
  ShieldCheck, 
  HelpCircle,
  Car,
  PackageCheck,
  Container,
  CheckCircle2,
  FileText,
  Lock,
  Sparkles
} from 'lucide-react';
import { useRental } from '../context/RentalContext';
import { LogisticsOrder, WasteTruckType, WasteMaterialType } from '../types';
import { getStoredTariffs } from '../utils/logisticsTariffs';
import { formatMoney, getTodayDateString } from '../utils/formatters';
import { FartovkaTooltip } from './FartovkaTooltip';
import { AiWasteScannerModal, AiWasteAnalysisResult } from './AiWasteScannerModal';

interface LogisticsViewProps {
  onOpenNewOrder?: () => void;
}

export const LogisticsView: React.FC<LogisticsViewProps> = () => {
  const { clients, orders, addClient } = useRental();
  const tariffs = useMemo(() => getStoredTariffs(), []);

  // Main active tab: 'gruzchik' (Yuk ko'tarish) | 'musor' (Chiqindilarni olib ketish) | 'orders_history'
  const [activeService, setActiveService] = useState<'gruzchik' | 'musor' | 'history'>('gruzchik');

  // --- LOADER (GRUZCHIK) STATE ---
  const [weight, setWeight] = useState<number>(600);
  const [floor, setFloor] = useState<number>(3);
  const [hasLift, setHasLift] = useState<boolean>(true);
  const [liftType, setLiftType] = useState<'yolovchi' | 'yuk'>('yolovchi');
  const [entranceDistance, setEntranceDistance] = useState<number>(10); // metrlarda (masalan 10m, 20m, 50m)

  // --- WASTE (MUSOR) STATE ---
  const [wasteMaterial, setWasteMaterial] = useState<WasteMaterialType>('bagged'); // 'bagged' | 'loose'
  const [truckType, setTruckType] = useState<WasteTruckType>('gazel'); // 'gazel' | 'zil' | 'container'
  const [volumeFillRatio, setVolumeFillRatio] = useState<number>(1.0); // 0.25 (1/4 bort), 0.5 (1/2 bort), 1.0 (to'liq bort)
  const [baggingCount, setBaggingCount] = useState<number>(0); // Fartovka qilingan qoplar soni
  const [bulkyItemsCount, setBulkyItemsCount] = useState<number>(0); // Katta o'lchamli buyumlar (eshik, oyna va h.k.)
  const [wasteFloor, setWasteFloor] = useState<number>(1);
  const [wasteHasLift, setWasteHasLift] = useState<boolean>(true);

  // --- BOOKING / ATTACHING TO WMS STATE ---
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedRentalOrderId, setSelectedRentalOrderId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('+998 ');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>(getTodayDateString());
  const [deliveryTime, setDeliveryTime] = useState<string>('11:00');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // AI Waste Scanner states
  const [showAiScanner, setShowAiScanner] = useState<boolean>(false);
  const [aiWasteData, setAiWasteData] = useState<AiWasteAnalysisResult | null>(null);

  const handleApplyAiWaste = (result: AiWasteAnalysisResult) => {
    // 1. Chiqindi holati (Sochiluvchan yoki Qoplangan)
    if (result.state === 'Sochiluvchan') {
      setWasteMaterial('loose');
      setBaggingCount(result.estimated_bags || 0);
    } else {
      setWasteMaterial('bagged');
      setBaggingCount(0);
    }

    // 2. Mos transport turi
    if (result.recommended_transport.toLowerCase().includes('zil')) {
      setTruckType('zil');
    } else if (result.recommended_transport.toLowerCase().includes('konteyner')) {
      setTruckType('container');
    } else {
      setTruckType('gazel');
    }

    // 3. Hajm borti (volumeFillRatio)
    if (result.volume_m3 <= 1.5) {
      setVolumeFillRatio(0.5);
    } else if (result.volume_m3 <= 3.5) {
      setVolumeFillRatio(1.0);
    } else {
      setVolumeFillRatio(1.5);
    }

    // 4. Og‘irlik (kg)
    if (result.estimated_weight_tons) {
      setWeight(Math.round(result.estimated_weight_tons * 1000));
    }

    setAiWasteData(result);
    setOrderSuccessMsg(`AI Tahlil natijasi qo‘llandi: ${result.trash_type}, ~${result.volume_m3}m³ (${result.estimated_weight_tons}t).`);
    setTimeout(() => setOrderSuccessMsg(null), 6000);
  };

  // Logistics orders stored in localStorage
  const [logisticsOrders, setLogisticsOrders] = useState<LogisticsOrder[]>(() => {
    try {
      const saved = localStorage.getItem('petrovich_logistics_orders_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveLogisticsOrders = (updated: LogisticsOrder[]) => {
    setLogisticsOrders(updated);
    try {
      localStorage.setItem('petrovich_logistics_orders_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // --- REAL-TIME CALCULATIONS: LOADER (GRUZCHIK) ---
  const gruzchikCalculation = useMemo(() => {
    const baseWeightCost = weight * tariffs.loaderPricePerKg;

    let floorCost = 0;
    let floorDescription = '';

    if (hasLift) {
      floorCost = liftType === 'yolovchi' 
        ? tariffs.loaderPassengerLiftFixed 
        : tariffs.loaderCargoLiftFixed;
      floorDescription = liftType === 'yolovchi' ? 'Yo‘lovchi lifti (qulay tarif)' : 'Katta yuk lifti';
    } else {
      const ratePerFloor = weight > 500 
        ? tariffs.loaderPerFloorNoLiftHeavy 
        : tariffs.loaderPerFloorNoLiftLight;
      floorCost = floor * ratePerFloor;
      floorDescription = `Zinadan piyoda olib chiqish (${floor}-qavat)`;
    }

    // Distance carry fee (agar mashina pod'ezddan 20 metrdan uzoq to'xtasa)
    let distanceCost = 0;
    if (entranceDistance > 20) {
      const extra10mSegments = Math.ceil((entranceDistance - 20) / 10);
      distanceCost = extra10mSegments * tariffs.loaderEntranceDistanceRatePer10m;
    }

    const total = baseWeightCost + floorCost + distanceCost;

    return {
      baseWeightCost,
      floorCost,
      floorDescription,
      distanceCost,
      total
    };
  }, [weight, floor, hasLift, liftType, entranceDistance, tariffs]);

  // --- REAL-TIME CALCULATIONS: WASTE (MUSOR) ---
  const musorCalculation = useMemo(() => {
    // 1. Truck base cost
    let truckBase = tariffs.gazelBasePrice;
    let truckLabel = 'Gazel (1.5t / 8m³)';
    if (truckType === 'zil') {
      truckBase = tariffs.zilBasePrice;
      truckLabel = 'ZIL samosval (5t / 12m³)';
    } else if (truckType === 'container') {
      truckBase = tariffs.containerBasePrice;
      truckLabel = 'Maxsus konteyner (8m³)';
    }

    // Fill ratio multiplier
    const truckVolumeCost = truckBase * volumeFillRatio;

    // 2. Loose / Gabarit multiplier
    const isLoose = wasteMaterial === 'loose';
    const materialMultiplier = isLoose ? tariffs.looseWasteMultiplier : 1.0;
    const adjustedTruckCost = truckVolumeCost * materialMultiplier;
    const looseExtraCost = isLoose ? Math.round(adjustedTruckCost - truckVolumeCost) : 0;

    // 3. Fartovka (Bagging) cost - faqat sochiluvchan ('loose') rejimida hisoblanadi
    const effectiveBaggingCount = isLoose ? baggingCount : 0;
    const baggingCost = effectiveBaggingCount * tariffs.baggingPricePerBag;

    // 4. Bulky items (Gabarit)
    const bulkyCost = bulkyItemsCount * tariffs.bulkyItemPricePerPiece;

    // 5. Descent cost if loading from floors
    let descentCost = 0;
    if (wasteFloor > 1) {
      if (wasteHasLift) {
        descentCost = 30000; // Lift bilan tushirish ramziy xizmati
      } else {
        descentCost = (wasteFloor - 1) * 25000;
      }
    }

    const total = Math.round(adjustedTruckCost + baggingCost + bulkyCost + descentCost);

    return {
      truckBase,
      truckLabel,
      truckVolumeCost,
      adjustedTruckCost,
      looseExtraCost,
      effectiveBaggingCount,
      baggingCost,
      bulkyCost,
      descentCost,
      isLoose,
      total
    };
  }, [truckType, volumeFillRatio, wasteMaterial, baggingCount, bulkyItemsCount, wasteFloor, wasteHasLift, tariffs]);

  // Handle client selection dropdown
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) {
      setClientName('');
      setClientPhone('+998 ');
      setClientAddress('');
      return;
    }
    const found = clients.find(c => c.id === clientId);
    if (found) {
      setClientName(found.fullName);
      setClientPhone(found.phone);
      setClientAddress(found.address || '');
    }
  };

  // Handle rental order selection dropdown
  const handleSelectRentalOrder = (orderId: string) => {
    setSelectedRentalOrderId(orderId);
    if (!orderId) return;
    const found = orders.find(o => o.id === orderId);
    if (found) {
      setClientName(found.client.fullName);
      setClientPhone(found.client.phone);
      if (found.client.address) {
        setClientAddress(found.client.address);
      }
      if (found.client.id) {
        setSelectedClientId(found.client.id);
      }
    }
  };

  // Open booking modal
  const handleOpenBookingModal = () => {
    setOrderSuccessMsg(null);
    setIsOrderModalOpen(true);
  };

  // Submit delivery order
  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      alert('Iltimos, mijoz ismi va telefon raqamini kiriting!');
      return;
    }

    // Auto-create client in WMS if new
    let finalClientId = selectedClientId;
    if (!finalClientId) {
      const existingClient = clients.find(c => c.phone.replace(/\s+/g, '') === clientPhone.replace(/\s+/g, ''));
      if (existingClient) {
        finalClientId = existingClient.id;
      } else {
        const newClientId = `cl_${Date.now()}`;
        addClient({
          fullName: clientName.trim(),
          phone: clientPhone.trim(),
          passport: 'Keltirilmagan (Logistika)',
          address: clientAddress.trim(),
          notes: 'Logistika servisi orqali qo‘shildi'
        });
        finalClientId = newClientId;
      }
    }

    const currentTotal = activeService === 'gruzchik' ? gruzchikCalculation.total : musorCalculation.total;
    const orderNumber = `#LG-${Math.floor(1000 + Math.random() * 9000)}`;

    const breakdownData: Record<string, string | number> = activeService === 'gruzchik' ? {
      service: 'Yuk ko‘tarish (Gruzchik)',
      weight: `${weight} kg`,
      floor: `${floor}-qavat`,
      hasLift: hasLift ? (liftType === 'yolovchi' ? 'Yo‘lovchi lifti' : 'Yuk lifti') : 'Zinadan',
      distance: `${entranceDistance} m`,
      total: currentTotal
    } : {
      service: 'Chiqindilarni olib ketish (Musor)',
      truck: musorCalculation.truckLabel,
      volumeRatio: volumeFillRatio === 1.0 ? 'To‘liq bort' : `${volumeFillRatio * 100}% bort`,
      wasteType: wasteMaterial === 'bagged' ? 'Qoplangan (standart)' : 'Sochiluvchan (+30%)',
      baggingCount: baggingCount,
      bulkyItemsCount: bulkyItemsCount,
      total: currentTotal
    };

    const newLogisticsOrder: LogisticsOrder = {
      id: `lg_${Date.now()}`,
      orderNumber,
      serviceType: activeService === 'gruzchik' ? 'gruzchik' : 'musor',
      status: 'pending',
      createdAt: new Date().toISOString(),
      clientId: finalClientId,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientAddress: clientAddress.trim(),
      rentalOrderId: selectedRentalOrderId || undefined,
      rentalOrderNumber: selectedRentalOrderId ? orders.find(o => o.id === selectedRentalOrderId)?.orderNumber : undefined,
      totalPrice: currentTotal,
      breakdown: breakdownData,
      notes: orderNotes.trim(),
      deliveryDate,
      deliveryTime
    };

    saveLogisticsOrders([newLogisticsOrder, ...logisticsOrders]);
    setOrderSuccessMsg(`Buyurtma muvaffaqiyatli qabul qilindi! Buyurtma kodi: ${orderNumber}`);

    setTimeout(() => {
      setIsOrderModalOpen(false);
      setActiveService('history');
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Top Banner & Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Yellow Accent Glow Background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Truck className="w-3.5 h-3.5" />
              Petrovich uslubidagi ekspress logistika
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Logistika & Chiqindi Kalkulyatori
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Qurilish asboblari va materiallarini qavatlarga ko‘tarish (gruzchik) hamda qurilish chiqindilarini (musor) olib ketishni shaffof, qat’iy stavkalar bilan hisoblang.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <div className="text-left md:text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Yagona dispetcherlik:</span>
              <a href={`tel:${tariffs.supportPhone.replace(/[^0-9+]/g, '')}`} className="text-base font-extrabold text-amber-400 hover:underline flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                {tariffs.supportPhone}
              </a>
            </div>
            
            <button
              onClick={handleOpenBookingModal}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Tezkor buyurtma rasmiylashtirish</span>
            </button>
          </div>
        </div>

        {/* Feature badges */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-300 font-medium">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Shaffof va kafolatlangan stavkalar
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Yashirin to‘lovlarsiz aniq hisob
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <ShieldCheck className="w-4 h-4" /> WMS mijozlar bazasi bilan integratsiya
          </span>
        </div>
      </div>

      {/* Main Service Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Tab 1: Gruzchik */}
        <button
          onClick={() => setActiveService('gruzchik')}
          className={`p-4 rounded-xl font-bold flex items-center justify-between text-left transition border ${
            activeService === 'gruzchik'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${activeService === 'gruzchik' ? 'bg-slate-950/15 text-slate-950' : 'bg-amber-50 text-amber-600'}`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black flex items-center gap-1.5">
                Yuk ko‘tarish 
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${activeService === 'gruzchik' ? 'bg-slate-950 text-amber-400' : 'bg-slate-100 text-slate-600'}`}>
                  Gruzchik
                </span>
              </div>
              <div className={`text-[11px] font-normal ${activeService === 'gruzchik' ? 'text-slate-900/80' : 'text-slate-500'}`}>
                Qavatlarga ko‘tarish & tushirish
              </div>
            </div>
          </div>
        </button>

        {/* Tab 2: Musor */}
        <button
          onClick={() => setActiveService('musor')}
          className={`p-4 rounded-xl font-bold flex items-center justify-between text-left transition border ${
            activeService === 'musor'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${activeService === 'musor' ? 'bg-slate-950/15 text-slate-950' : 'bg-red-50 text-red-600'}`}>
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black flex items-center gap-1.5">
                Chiqindilarni olib ketish
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${activeService === 'musor' ? 'bg-slate-950 text-amber-400' : 'bg-slate-100 text-slate-600'}`}>
                  Musor
                </span>
              </div>
              <div className={`text-[11px] font-normal ${activeService === 'musor' ? 'text-slate-900/80' : 'text-slate-500'}`}>
                Gazel, ZIL, Konteyner va Fartovka
              </div>
            </div>
          </div>
        </button>

        {/* Tab 3: History / Orders */}
        <button
          onClick={() => setActiveService('history')}
          className={`p-4 rounded-xl font-bold flex items-center justify-between text-left transition border ${
            activeService === 'history'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${activeService === 'history' ? 'bg-slate-950/15 text-slate-950' : 'bg-blue-50 text-blue-600'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black flex items-center gap-1.5">
                Buyurtmalar jurnali
                {logisticsOrders.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeService === 'history' ? 'bg-slate-950 text-amber-400' : 'bg-blue-100 text-blue-700'}`}>
                    {logisticsOrders.length}
                  </span>
                )}
              </div>
              <div className={`text-[11px] font-normal ${activeService === 'history' ? 'text-slate-900/80' : 'text-slate-500'}`}>
                Qabul qilingan barcha yetkazishlar
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* ===================== TAB 1: GRUZCHIK (YUK KO'TARISH) ===================== */}
      {activeService === 'gruzchik' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left 2 Columns: Controls */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Weight Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-500" />
                  Yukning umumiy og‘irligi
                </label>
                <div className="bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-xl text-amber-400 font-black text-lg">
                  {weight.toLocaleString()} <span className="text-xs font-normal text-slate-300">kg</span>
                </div>
              </div>

              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={weight}
                onChange={e => setWeight(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <div className="flex justify-between text-xs text-slate-400 font-semibold">
                <span>50 kg</span>
                <span>1,000 kg (1t)</span>
                <span>2,500 kg (2.5t)</span>
                <span>5,000 kg (5t)</span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium mr-1">Tezkor tanlov:</span>
                {[150, 350, 600, 1000, 2000, 3500].map(val => (
                  <button
                    key={val}
                    onClick={() => setWeight(val)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      weight === val
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {val >= 1000 ? `${val / 1000} t` : `${val} kg`}
                  </button>
                ))}
              </div>
            </div>

            {/* Floor & Lift Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Floor Slider */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-500" /> Qavat soni
                  </label>
                  <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 font-black rounded-lg text-sm">
                    {floor}-qavat
                  </span>
                </div>

                <p className="text-[11px] text-slate-500">
                  {hasLift ? '✅ Lift ishlasa: har bir qavat uchun qo‘shimcha to‘lov hisoblanmaydi' : '⚠️ Zinadan olib chiqilganda har bir qavat hisobga olinadi'}
                </p>

                <input
                  type="range"
                  min="1"
                  max="25"
                  value={floor}
                  onChange={e => setFloor(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => setFloor(Math.max(1, floor - 1))}
                    className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
                  >
                    -1 Qavat
                  </button>
                  <button
                    onClick={() => setFloor(Math.min(25, floor + 1))}
                    className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
                  >
                    +1 Qavat
                  </button>
                </div>
              </div>

              {/* Lift Condition */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-500" /> Lift mavjudligi
                  </label>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    hasLift ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {hasLift ? 'Lift bor' : 'Lift yo‘q'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setHasLift(true)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      hasLift
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Ha, ishlaydi
                  </button>
                  <button
                    onClick={() => setHasLift(false)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      !hasLift
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <X className="w-3.5 h-3.5 stroke-[3]" /> Yo‘q (Zina)
                  </button>
                </div>

                {/* If lift works, choose type */}
                {hasLift && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Lift turi:</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setLiftType('yolovchi')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          liftType === 'yolovchi'
                            ? 'bg-slate-900 text-amber-400'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Yo‘lovchi lifti
                      </button>
                      <button
                        onClick={() => setLiftType('yuk')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          liftType === 'yuk'
                            ? 'bg-slate-900 text-amber-400'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Yuk lifti (Arzonroq)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Entrance distance */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <label className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    Mashinadan pod'ezdgacha bo‘lgan masofa (Gorizontal tashish)
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Birinchi 20 metr bepul kiritilgan. 20 metrdan oshsa har 10 metr uchun qo‘shimcha to‘lov qo‘shiladi.
                  </p>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg text-xs">
                  {entranceDistance} metr
                </span>
              </div>

              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={entranceDistance}
                onChange={e => setEntranceDistance(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>5 metr (Yaqin)</span>
                <span>20 metr (Standart)</span>
                <span>50 metr</span>
                <span>100 metr (Uzoq hovli)</span>
              </div>
            </div>

          </div>

          {/* Right Column: Live Summary Card */}
          <div className="bg-white rounded-2xl border-2 border-amber-500 p-6 shadow-xl space-y-6 sticky top-20">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Gruzchik Hisob-kitobi</h3>
                    <p className="text-[10px] text-slate-400">Jonli hisob & Shaffof narx</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900">
                  JONLI
                </span>
              </div>

              {/* Itemized list */}
              <div className="space-y-3 pt-4 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-800 block">Og‘irlik haqi ({weight.toLocaleString()} kg)</span>
                    <span className="text-[11px] text-slate-400">{weight} kg × {tariffs.loaderPricePerKg} so‘m</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatMoney(gruzchikCalculation.baseWeightCost)}</span>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-800 block">Qavat/Lift xizmati</span>
                    <span className="text-[11px] text-slate-400">{gruzchikCalculation.floorDescription}</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatMoney(gruzchikCalculation.floorCost)}</span>
                </div>

                {gruzchikCalculation.distanceCost > 0 && (
                  <div className="flex justify-between items-start text-amber-700">
                    <div>
                      <span className="font-bold block">Masofa uchun (+{entranceDistance - 20}m)</span>
                      <span className="text-[11px]">20 metrdan uzoq masofa haqi</span>
                    </div>
                    <span className="font-bold">{formatMoney(gruzchikCalculation.distanceCost)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Total Block */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Jami summa:</span>
                  <span className="text-[10px] text-slate-400">Barcha xizmatlar ichida</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-600">
                  {formatMoney(gruzchikCalculation.total)}
                </div>
              </div>

              <button
                onClick={handleOpenBookingModal}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <span>Buyurtma berish</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Petrovich standarti:
                </div>
                <p>Buyurtma WMS mijoziga yoki joriy ijara buyurtmasiga biriktirilishi mumkin.</p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ===================== TAB 2: MUSOR (CHIQINDILARNI OLIB KETISH) ===================== */}
      {activeService === 'musor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left 2 Columns: Controls */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Waste Material Type Toggle */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
                <label className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  Chiqindi turi va holati
                </label>
                <button
                  type="button"
                  onClick={() => setShowAiScanner(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto active:scale-98"
                >
                  <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                  <span>📸 AI Foto-Baholash (Rasm orqali aniqlash)</span>
                </button>
              </div>

              {/* AI Natijasi ko'rsatgichi (agar AI orqali to'ldirilgan bo'lsa) */}
              {aiWasteData && (
                <div className="p-3 bg-gradient-to-r from-amber-50 to-emerald-50 border border-emerald-300 rounded-xl flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>AI Tahlil qilingan: {aiWasteData.trash_type}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 rounded">
                          {aiWasteData.confidence_score} aniqlik
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Hajm: <strong>~{aiWasteData.volume_m3} m³</strong> | Og‘irlik: <strong>~{aiWasteData.estimated_weight_tons} tonna</strong> | Qoplar: <strong>~{aiWasteData.estimated_bags} ta</strong> | Mos mashina: <strong>{aiWasteData.recommended_transport}</strong> | Ishchilar: <strong>{aiWasteData.recommended_loaders} kishi</strong>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setWasteMaterial('bagged');
                    setBaggingCount(0);
                  }}
                  className={`p-4 rounded-xl border text-left transition flex items-start gap-3 ${
                    wasteMaterial === 'bagged'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${wasteMaterial === 'bagged' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'}`}>
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900">Qoplangan chiqindi (Standart)</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Qoplarga solingan g‘isht siniqlari, shpaklyovka, gips va boshqa qurilish qoldiqlari
                    </p>
                    <span className="inline-block mt-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                      ✓ Fartovka talab etilmaydi
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setWasteMaterial('loose')}
                  className={`p-4 rounded-xl border text-left transition flex items-start gap-3 ${
                    wasteMaterial === 'loose'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${wasteMaterial === 'loose' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                      Sochiluvchan / Gabarit 
                      <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-black">+30%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Qoplanmagan, katta bo‘lakli beton, devor g‘ishtlari yoki aralash yirik qoldiqlar
                    </p>
                    <span className="inline-block mt-1.5 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                      ⚙ Qoplash xizmati (fartovka) mavjud
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Truck Selection & Bort fill */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <label className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-500" />
                Maxsus transport turini tanlang
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Gazel */}
                <button
                  onClick={() => setTruckType('gazel')}
                  className={`p-4 rounded-xl border text-left transition ${
                    truckType === 'gazel'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Car className="w-6 h-6 text-amber-600" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">1.5 tonna</span>
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900">Gazel Bortli</div>
                  <div className="text-[11px] text-slate-500">8 m³ hajmgacha</div>
                  <div className="text-xs font-black text-amber-600 mt-2">{formatMoney(tariffs.gazelBasePrice)}</div>
                </button>

                {/* ZIL */}
                <button
                  onClick={() => setTruckType('zil')}
                  className={`p-4 rounded-xl border text-left transition ${
                    truckType === 'zil'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Truck className="w-6 h-6 text-blue-600" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">5 tonna</span>
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900">ZIL Samosval</div>
                  <div className="text-[11px] text-slate-500">12 m³ hajmgacha</div>
                  <div className="text-xs font-black text-amber-600 mt-2">{formatMoney(tariffs.zilBasePrice)}</div>
                </button>

                {/* Container */}
                <button
                  onClick={() => setTruckType('container')}
                  className={`p-4 rounded-xl border text-left transition ${
                    truckType === 'container'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Container className="w-6 h-6 text-emerald-600" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">Konteyner</span>
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900">Maxsus Bunker</div>
                  <div className="text-[11px] text-slate-500">8 m³ (Qoldirib ketiladi)</div>
                  <div className="text-xs font-black text-amber-600 mt-2">{formatMoney(tariffs.containerBasePrice)}</div>
                </button>
              </div>

              {/* Bort fill ratio */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Bortni to‘ldirish hajmi:</span>
                  <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {volumeFillRatio === 1.0 ? 'To‘liq bort (100%)' : volumeFillRatio === 0.5 ? 'Yarim bort (50%)' : 'Chorak bort (25%)'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setVolumeFillRatio(0.25)}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      volumeFillRatio === 0.25 ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    0.25 bort (25%)
                  </button>
                  <button
                    onClick={() => setVolumeFillRatio(0.5)}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      volumeFillRatio === 0.5 ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    0.5 bort (50%)
                  </button>
                  <button
                    onClick={() => setVolumeFillRatio(1.0)}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      volumeFillRatio === 1.0 ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    1.0 bort (To‘liq)
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Services: Fartovka (Bagging) & Bulky Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Bagging (Fartovka) */}
              <div className={`p-6 rounded-2xl border transition space-y-3 ${
                wasteMaterial === 'bagged'
                  ? 'bg-slate-50 border-slate-200 opacity-65'
                  : 'bg-white border-amber-300 shadow-xs ring-2 ring-amber-500/20'
              }`}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <label className="font-bold text-slate-900 text-sm block">Qoplash xizmati (Fartovka)</label>
                      <FartovkaTooltip />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Har bir qop uchun {formatMoney(tariffs.baggingPricePerBag)}
                    </p>
                  </div>
                  {wasteMaterial === 'bagged' ? (
                    <span className="px-2.5 py-1 bg-slate-200/80 text-slate-600 font-bold rounded-lg text-xs flex items-center gap-1 shrink-0">
                      <Lock className="w-3 h-3 text-slate-500" />
                      Qoplangan (O‘chiq)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg text-xs shrink-0">
                      {baggingCount} ta qop {baggingCount > 0 ? `(${formatMoney(baggingCount * tariffs.baggingPricePerBag)})` : ''}
                    </span>
                  )}
                </div>

                {wasteMaterial === 'bagged' ? (
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Fartovka xizmati avtomatik o‘chirilgan</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Chiqindi turi <strong>"Qoplangan"</strong> bo‘lgani sababli qo‘shimcha qoplash talab etilmaydi.
                        Ushbu xizmatni faollashtirish uchun yuqoridagi <strong>"Sochiluvchan (+30%)"</strong> rejimini tanlang.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      Sochiluvchan rejim faol: qoplarga joylash xizmatini kiritishingiz mumkin
                    </span>
                  </div>
                )}

                {/* Sanoq tugmalari: -10, -1, [input], +1, +10 */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    disabled={wasteMaterial === 'bagged'}
                    onClick={() => setBaggingCount(Math.max(0, baggingCount - 10))}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-slate-700 transition"
                    title="10 taga kamaytirish"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    disabled={wasteMaterial === 'bagged'}
                    onClick={() => setBaggingCount(Math.max(0, baggingCount - 1))}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-slate-700 transition"
                    title="1 taga kamaytirish"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    disabled={wasteMaterial === 'bagged'}
                    value={baggingCount}
                    onChange={e => setBaggingCount(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="flex-1 py-1.5 px-3 text-center border border-slate-200 rounded-lg text-xs font-black bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500/30"
                  />
                  <button
                    type="button"
                    disabled={wasteMaterial === 'bagged'}
                    onClick={() => setBaggingCount(baggingCount + 1)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-slate-700 transition"
                    title="1 taga oshirish"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    disabled={wasteMaterial === 'bagged'}
                    onClick={() => setBaggingCount(baggingCount + 10)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-slate-700 transition"
                    title="10 taga oshirish"
                  >
                    +10
                  </button>
                </div>

                {/* Tezkor presetlar */}
                <div className="flex gap-1.5 pt-0.5">
                  {[0, 10, 25, 50, 100].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      disabled={wasteMaterial === 'bagged'}
                      onClick={() => setBaggingCount(cnt)}
                      className={`flex-1 py-1 rounded-md text-[11px] font-bold transition disabled:opacity-30 disabled:cursor-not-allowed ${
                        baggingCount === cnt && wasteMaterial !== 'bagged'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cnt === 0 ? 'Kerakmas' : `${cnt} qop`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bulky items (Gabarit buyumlar) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <label className="font-bold text-slate-900 text-sm block">Katta o‘lchamli buyumlar</label>
                    <p className="text-[11px] text-slate-500 mt-0.5">Eshik, vanna, deraza romlari ({formatMoney(tariffs.bulkyItemPricePerPiece)}/dona)</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg text-xs">
                    {bulkyItemsCount} dona
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setBulkyItemsCount(Math.max(0, bulkyItemsCount - 1))}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={bulkyItemsCount}
                    onChange={e => setBulkyItemsCount(Math.max(0, Number(e.target.value)))}
                    className="flex-1 py-1.5 px-3 text-center border border-slate-200 rounded-lg text-xs font-bold bg-slate-50"
                  />
                  <button
                    onClick={() => setBulkyItemsCount(bulkyItemsCount + 1)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    +1
                  </button>
                </div>

                <div className="flex gap-1.5">
                  {[0, 2, 4, 8].map(cnt => (
                    <button
                      key={cnt}
                      onClick={() => setBulkyItemsCount(cnt)}
                      className={`flex-1 py-1 rounded text-[11px] font-bold ${
                        bulkyItemsCount === cnt ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cnt === 0 ? 'Yo‘q' : `${cnt} dona`}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Live Summary Card for Waste */}
          <div className="bg-white rounded-2xl border-2 border-red-500 p-6 shadow-xl space-y-6 sticky top-20">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-red-50 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Musor Olib Ketish Hisobi</h3>
                    <p className="text-[10px] text-slate-400">Shaffof stavka & QQS kiritilgan</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-900">
                  JONLI
                </span>
              </div>

              {/* Itemized list */}
              <div className="space-y-3 pt-4 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-800 block">{musorCalculation.truckLabel}</span>
                    <span className="text-[11px] text-slate-400">
                      {volumeFillRatio === 1.0 ? 'To‘liq bort' : `${volumeFillRatio * 100}% bort hajmi`}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">{formatMoney(musorCalculation.truckVolumeCost)}</span>
                </div>

                {musorCalculation.isLoose ? (
                  <div className="p-2.5 rounded-xl bg-red-50/90 border border-red-200 space-y-1 text-red-900">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold block text-xs">Sochiluvchan chiqindi stavkasi (+30%)</span>
                        <span className="text-[11px] text-red-700 block font-medium">
                          Bazaviy transport narxidan: {formatMoney(musorCalculation.truckVolumeCost)} × 30%
                        </span>
                      </div>
                      <span className="font-black text-sm text-red-700">
                        +{formatMoney(musorCalculation.adjustedTruckCost - musorCalculation.truckVolumeCost)}
                      </span>
                    </div>
                    <p className="text-[10px] text-red-600/90 leading-tight pt-1 border-t border-red-200/60 font-medium">
                      * 30% ustama umumiy xizmatlardan emas, aynan tanlangan transport hajmiga ({formatMoney(musorCalculation.truckVolumeCost)}) qo‘llaniladi.
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-slate-500 py-1 border-y border-dashed border-slate-200 text-[11px]">
                    <span className="flex items-center gap-1 font-medium text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Qoplangan chiqindi (Standart tarif, ustamasiz)
                    </span>
                    <span className="font-mono font-bold text-slate-400">+0 so‘m</span>
                  </div>
                )}

                {musorCalculation.baggingCost > 0 && (
                  <div className="flex justify-between items-start bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-800 block">Qoplash xizmati (Fartovka)</span>
                        <FartovkaTooltip iconSize={13} />
                      </div>
                      <span className="text-[11px] text-slate-500">{baggingCount} ta qop × {formatMoney(tariffs.baggingPricePerBag)}</span>
                    </div>
                    <span className="font-bold text-slate-900">{formatMoney(musorCalculation.baggingCost)}</span>
                  </div>
                )}

                {musorCalculation.bulkyCost > 0 && (
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-800 block">Katta o‘lchamli buyumlar</span>
                      <span className="text-[11px] text-slate-400">{bulkyItemsCount} dona × {tariffs.bulkyItemPricePerPiece} so‘m</span>
                    </div>
                    <span className="font-bold text-slate-900">{formatMoney(musorCalculation.bulkyCost)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Total Block */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Yakuniy Narx:</span>
                  <span className="text-[10px] text-slate-400">Utilizatsiya poligoni ichida</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-red-600">
                  {formatMoney(musorCalculation.total)}
                </div>
              </div>

              <button
                onClick={handleOpenBookingModal}
                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition cursor-pointer"
              >
                <span>Chiqindi tashishga buyurtma berish</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Rasmiy utilizatsiya:
                </div>
                <p>Qurilish chiqindilari faqat qonuniy maxsus chiqindi poligonlariga yetkaziladi.</p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ===================== TAB 3: HISTORY / ORDERS ===================== */}
      {activeService === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Qabul qilingan Logistika Buyurtmalari
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                WMS mijozlari va ijara zakazlariga bog‘langan yetkazish va chiqindi buyurtmalari
              </p>
            </div>
            
            <button
              onClick={handleOpenBookingModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Yangi logistika buyurtmasi</span>
            </button>
          </div>

          {logisticsOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Truck className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <p className="text-sm font-bold text-slate-700">Hozircha logistika buyurtmalari mavjud emas</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Kalkulyatorda hisoblab, "Buyurtma berish" tugmasini bossangiz, buyurtmalar ushbu ro‘yxatda saqlanadi.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logisticsOrders.map(order => (
                <div key={order.id} className="p-5 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-black bg-slate-900 text-amber-400">
                        {order.orderNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        order.serviceType === 'gruzchik'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-red-100 text-red-900'
                      }`}>
                        {order.serviceType === 'gruzchik' ? 'Yuk ko‘tarish (Gruzchik)' : 'Chiqindi (Musor)'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{order.clientName}</span>
                      <span className="text-xs font-mono font-normal text-slate-500">({order.clientPhone})</span>
                      {order.clientAddress && (
                        <span className="text-xs font-normal text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {order.clientAddress}
                        </span>
                      )}
                    </div>

                    {order.rentalOrderNumber && (
                      <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Asbob ijarasi bilan bog‘langan: <strong>{order.rentalOrderNumber}</strong>
                      </div>
                    )}

                    {/* Breakdown details */}
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-500">
                      {Object.entries(order.breakdown).map(([k, v]) => (
                        <span key={k} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {k}: <strong>{String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-left md:text-right shrink-0 space-y-2">
                    <div className="text-lg font-black text-slate-900">
                      {formatMoney(order.totalPrice)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        Qabul qilindi
                      </span>
                      <button
                        onClick={() => {
                          if (confirm('Ushbu buyurtmani ro‘yxatdan o‘chirmoqchimisiz?')) {
                            saveLogisticsOrders(logisticsOrders.filter(o => o.id !== order.id));
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-red-600"
                        title="O‘chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== WMS BOOKING MODAL ===================== */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Logistika Buyurtmasini Rasmiylashtirish</h3>
                  <p className="text-[11px] text-slate-400">
                    {activeService === 'gruzchik' ? 'Gruzchik xizmati' : 'Chiqindilarni tashish'} | WMS Bazasiga bog‘lash
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleConfirmOrder} className="p-5 space-y-4 overflow-y-auto flex-1">
              
              {/* Total Banner */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-900 block uppercase">Hisoblangan xizmat narxi:</span>
                  <span className="text-xs text-amber-800">
                    {activeService === 'gruzchik' ? `Yuk: ${weight} kg, ${floor}-qavat` : `Musor: ${musorCalculation.truckLabel}`}
                  </span>
                </div>
                <div className="text-xl font-black text-amber-700">
                  {formatMoney(activeService === 'gruzchik' ? gruzchikCalculation.total : musorCalculation.total)}
                </div>
              </div>

              {/* Attach to Existing WMS Order */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mavjud Ijara Buyurtmasiga biriktirish (Ixtiyoriy):
                </label>
                <select
                  value={selectedRentalOrderId}
                  onChange={e => handleSelectRentalOrder(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900"
                >
                  <option value="">-- Alohida logistika buyurtmasi (Bog‘lanmagan) --</option>
                  {orders.filter(o => o.status !== 'returned').map(o => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.client.fullName} ({o.client.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Attach to Existing WMS Client */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mijozlar bazasidan tanlash (Yoki yangi kiritish):
                </label>
                <select
                  value={selectedClientId}
                  onChange={e => handleSelectClient(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900"
                >
                  <option value="">-- Yangi mijoz (Qo‘lda kiritish) --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mijoz Ismi *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Masalan: Sardor Rahimov"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 font-medium"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Yetkazish yoki Manzil</label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={e => setClientAddress(e.target.value)}
                  placeholder="Shahar, tuman, ko‘cha, dom va xonadon raqami"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sana</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vaqt</label>
                  <input
                    type="time"
                    value={deliveryTime}
                    onChange={e => setDeliveryTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Izoh / Qo‘shimcha ko‘rsatmalar</label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="Shlagbaum bor, orqa eshikdan kiriladi..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
              </div>

              {orderSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{orderSuccessMsg}</span>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Tasdiqlash & Saqlash</span>
                </button>
              </div>

            </form>

          </div>
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
