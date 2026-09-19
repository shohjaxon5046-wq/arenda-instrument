import { LogisticsTariffs } from '../types';

export const DEFAULT_LOGISTICS_TARIFFS: LogisticsTariffs = {
  // Loader (Gruzchik)
  loaderPricePerKg: 320, // 320 so'm / kg
  loaderPassengerLiftFixed: 40000, // 40,000 so'm (Yo'lovchi lifti fiks stavkasi)
  loaderCargoLiftFixed: 20000, // 20,000 so'm (Yuk lifti stavkasi)
  loaderPerFloorNoLiftLight: 18000, // 18,000 so'm / qavat (<= 500kg zina)
  loaderPerFloorNoLiftHeavy: 30000, // 30,000 so'm / qavat (> 500kg zina)
  loaderEntranceDistanceRatePer10m: 15000, // 15,000 so'm har 10 metr uchun (20m dan oshsa)

  // Waste Removal (Musor)
  gazelBasePrice: 350000, // Gazel (1.5t gacha, 8m³)
  zilBasePrice: 700000, // ZIL (5t gacha, 12m³)
  containerBasePrice: 1100000, // Maxsus bunker konteyner (8m³)
  baggingPricePerBag: 5000, // Qoplash (fartovka) har 1 dona qop uchun
  bulkyItemPricePerPiece: 40000, // Katta o'lchamli buyumlar (eshik, vanna, oyna va h.k.) har 1 dona
  looseWasteMultiplier: 1.3, // Qoplanmagan/sochiluvchan chiqindi (+30%)
  supportPhone: '+998 (71) 200–88–00'
};

const TARIFFS_STORAGE_KEY = 'unified_wms_logistics_tariffs_v2';
export const TARIFF_UPDATE_EVENT = 'unified_wms_tariffs_updated';

export function getStoredTariffs(): LogisticsTariffs {
  try {
    const raw = localStorage.getItem(TARIFFS_STORAGE_KEY) || localStorage.getItem('petrovich_logistics_tariffs_v1');
    if (!raw) return DEFAULT_LOGISTICS_TARIFFS;
    return { ...DEFAULT_LOGISTICS_TARIFFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_LOGISTICS_TARIFFS;
  }
}

export function saveStoredTariffs(tariffs: LogisticsTariffs): void {
  try {
    localStorage.setItem(TARIFFS_STORAGE_KEY, JSON.stringify(tariffs));
    // Dispatch custom event so all active views and calculators recalculate instantly
    window.dispatchEvent(new CustomEvent(TARIFF_UPDATE_EVENT, { detail: tariffs }));
  } catch (e) {
    console.error('Error saving logistics tariffs:', e);
  }
}
