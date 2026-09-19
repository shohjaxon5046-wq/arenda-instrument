import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  X, 
  Building2, 
  Phone, 
  MapPin, 
  Check, 
  Truck, 
  Users, 
  Trash2, 
  Scale, 
  Layers, 
  Car, 
  RotateCcw,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { getStoredTariffs, saveStoredTariffs, DEFAULT_LOGISTICS_TARIFFS } from '../utils/logisticsTariffs';
import { LogisticsTariffs } from '../types';
import { FartovkaTooltip } from './FartovkaTooltip';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'shop' | 'tariffs';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, defaultTab = 'shop' }) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'tariffs'>(defaultTab);

  // Shop settings
  const [shopName, setShopName] = useState(() => localStorage.getItem('shop_name') || 'Instrument Arenda');
  const [shopPhone, setShopPhone] = useState(() => localStorage.getItem('shop_phone') || '+998 90 123 45 67');
  const [shopAddress, setShopAddress] = useState(() => localStorage.getItem('shop_address') || 'Toshkent shahar, Yangi bozor hududi, 14-do‘kon');

  // Tariffs settings
  const [tariffs, setTariffs] = useState<LogisticsTariffs>(() => getStoredTariffs());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setTariffs(getStoredTariffs());
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('shop_name', shopName);
    localStorage.setItem('shop_phone', shopPhone);
    localStorage.setItem('shop_address', shopAddress);
    saveStoredTariffs(tariffs);

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  };

  const handleResetTariffs = () => {
    if (confirm('Barcha narx stavkalarini standart qiymatlarga qaytarishni xohlaysizmi?')) {
      setTariffs({ ...DEFAULT_LOGISTICS_TARIFFS });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Admin Sozlamalari & Narxlar Paneli</h3>
              <p className="text-[11px] text-slate-400">Do‘kon ma’lumotlari, Gruzchik va Chiqindi stavkalarini dinamik boshqarish</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-4 pt-2.5 gap-2 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('shop')}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'shop'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Do‘kon va Chek ma’lumotlari
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tariffs')}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'tariffs'
                ? 'border-amber-500 text-amber-800 bg-white rounded-t-lg font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-amber-500" />
            Narxlar Stavkasi (Gruzchik & Musor)
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-5 space-y-5 overflow-y-auto flex-1 text-slate-900">
          
          {/* TAB 1: SHOP SETTINGS */}
          {activeTab === 'shop' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" /> Do‘kon yoki Kompaniya nomi
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" /> Aloqa telefoni
                </label>
                <input
                  type="text"
                  required
                  value={shopPhone}
                  onChange={e => setShopPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> Do‘kon manzili
                </label>
                <input
                  type="text"
                  required
                  value={shopAddress}
                  onChange={e => setShopAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-1">
                <span className="font-bold block">Eslatma:</span>
                Ushbu ma’lumotlar ijara shartnomasi va kassa chekining yuqori qismida avtomatik chop etiladi.
              </div>
            </div>
          )}

          {/* TAB 2: TARIFFS & PRICE ENGINE */}
          {activeTab === 'tariffs' && (
            <div className="space-y-5">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 font-semibold">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Narxlar o‘zgarganda kalkulyator real-vaqtda avtomatik qayta hisoblanadi.</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetTariffs}
                  className="px-2 py-1 rounded bg-amber-200/70 hover:bg-amber-300 text-amber-950 font-bold text-[10px] flex items-center gap-1"
                  title="Standart narxlarga qaytarish"
                >
                  <RotateCcw className="w-3 h-3" /> Qaytarish
                </button>
              </div>

              {/* 1. GRUZCHIK (YUK KO'TARISH) STAVKALARI */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" /> Gruzchik Stavkalari
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">Yuk & Zina</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Scale className="w-3 h-3 text-amber-600" /> 1 kg yuk uchun stavka (so‘m)
                    </label>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      value={tariffs.loaderPricePerKg}
                      onChange={e => setTariffs({ ...tariffs, loaderPricePerKg: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Standart: 320 so‘m/kg</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-amber-600" /> 1 qavat zina narxi (&le;500kg)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={tariffs.loaderPerFloorNoLiftLight}
                      onChange={e => setTariffs({ ...tariffs, loaderPerFloorNoLiftLight: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Standart: 18,000 so‘m/qavat</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-amber-600" /> 1 qavat zina narxi (&gt;500kg)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={tariffs.loaderPerFloorNoLiftHeavy}
                      onChange={e => setTariffs({ ...tariffs, loaderPerFloorNoLiftHeavy: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Standart: 30,000 so‘m/qavat</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Yo‘lovchi lifti fiks to‘lovi (so‘m)</label>
                    <input
                      type="number"
                      step="5000"
                      min="0"
                      value={tariffs.loaderPassengerLiftFixed}
                      onChange={e => setTariffs({ ...tariffs, loaderPassengerLiftFixed: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Standart: 40,000 so‘m</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Katta yuk lifti to‘lovi (so‘m)</label>
                    <input
                      type="number"
                      step="5000"
                      min="0"
                      value={tariffs.loaderCargoLiftFixed}
                      onChange={e => setTariffs({ ...tariffs, loaderCargoLiftFixed: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Standart: 20,000 so‘m</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Masofa ustamasi (har 10m uchun)</label>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={tariffs.loaderEntranceDistanceRatePer10m}
                      onChange={e => setTariffs({ ...tariffs, loaderEntranceDistanceRatePer10m: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">20 metrdan oshganda: 15,000 so‘m</span>
                  </div>
                </div>
              </div>

              {/* 2. CHIQINDILARNI OLIB KETISH (MUSOR) STAVKALARI */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-red-600" /> Musor Olib Ketish Stavkalari
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-900">Transport & Fartovka</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Car className="w-3 h-3 text-amber-600" /> Gazel Bortli (1.5t / 8m³) narxi
                    </label>
                    <input
                      type="number"
                      step="10000"
                      min="0"
                      value={tariffs.gazelBasePrice}
                      onChange={e => setTariffs({ ...tariffs, gazelBasePrice: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Standart: 350,000 so‘m</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-blue-600" /> ZIL Samosval (5t / 12m³) narxi
                    </label>
                    <input
                      type="number"
                      step="20000"
                      min="0"
                      value={tariffs.zilBasePrice}
                      onChange={e => setTariffs({ ...tariffs, zilBasePrice: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Standart: 700,000 so‘m</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Maxsus Bunker Konteyner (8m³)</label>
                    <input
                      type="number"
                      step="50000"
                      min="0"
                      value={tariffs.containerBasePrice}
                      onChange={e => setTariffs({ ...tariffs, containerBasePrice: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Standart: 1,100,000 so‘m</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">Qoplash xizmati (1 qop fartovka)</label>
                      <FartovkaTooltip iconSize={12} />
                    </div>
                    <input
                      type="number"
                      step="500"
                      min="0"
                      value={tariffs.baggingPricePerBag}
                      onChange={e => setTariffs({ ...tariffs, baggingPricePerBag: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Standart: 5,000 so‘m / qop</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Katta o‘lchamli buyum (1 dona gabarit)</label>
                    <input
                      type="number"
                      step="5000"
                      min="0"
                      value={tariffs.bulkyItemPricePerPiece}
                      onChange={e => setTariffs({ ...tariffs, bulkyItemPricePerPiece: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Standart: 40,000 so‘m / dona</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Sochiluvchan chiqindi koeffitsienti</label>
                    <input
                      type="number"
                      step="0.05"
                      min="1.0"
                      max="2.5"
                      value={tariffs.looseWasteMultiplier}
                      onChange={e => setTariffs({ ...tariffs, looseWasteMultiplier: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Standart: 1.3 (+30%)</span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Dispetcherlik Call-markaz telefoni</label>
                  <input
                    type="text"
                    value={tariffs.supportPhone}
                    onChange={e => setTariffs({ ...tariffs, supportPhone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                  <span>Saqlandi!</span>
                </>
              ) : (
                <span>Saqlash & Qo‘llash</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
