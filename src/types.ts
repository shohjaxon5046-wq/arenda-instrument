export type ToolCategory = 
  | 'Elektroinstrument'
  | 'Benzinli & Generator'
  | 'Payvandlash & Metall'
  | 'Beton & Qurilish'
  | 'Bog‘ & Tozalash'
  | 'Narvon & Havoza'
  | 'O‘lchov & Lazer';

export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface Tool {
  id: string;
  name: string;
  article: string; // Artikul (masalan: PRF-042)
  code: string;    // Shtrix yoki ichki kod (masalan: KD-8812)
  category: ToolCategory;
  dailyPrice: number; // Kunlik ijara narxi (so'm)
  depositPrice: number; // Garov summasi (so'm)
  totalStock: number; // Jami soni
  availableStock: number; // Hozirda mavjud (bo'sh) soni
  rentedStock: number; // Ijarada turgan soni
  repairStock?: number; // Ta'mirda (remontda) turgan soni
  imageUrl: string;
  brand?: string;
  model?: string;
  condition?: 'A' | 'B' | 'C'; // Holati
  description?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  fullName: string;
  phone: string;
  passport: string; // Pasport yoki ID seriya raqami
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface RentalOrderItem {
  toolId: string;
  toolName: string;
  article: string;
  code: string;
  quantity: number;
  dailyPrice: number;
  imageUrl?: string;
}

export type SellerRole = 'admin' | 'manager' | 'seller' | 'technician';

export interface Seller {
  id: string;
  fullName: string;
  phone?: string;
  active: boolean;
  role?: SellerRole;
  roleTitle?: string;
  telegram?: string;
  commissionRate?: number; // % komissiya yoki bonus
  avatar?: string;
  notes?: string;
  createdAt: string;
}

export type OrderStatus = 'active' | 'overdue' | 'returned';

export interface RentalOrder {
  id: string;
  orderNumber: string; // Masalan: #ZR-104
  sellerId?: string; // Sotuvchi ID si
  client: {
    id?: string;
    fullName: string;
    phone: string;
    passport: string;
    address?: string;
  };
  items: RentalOrderItem[];
  startDate: string; // YYYY-MM-DD
  startTime?: string;
  expectedReturnDate: string; // YYYY-MM-DD
  actualReturnDate?: string;
  totalDays: number;
  subtotalAmount?: number; // Chegirmasiz asl ijara summasi
  discountPercent?: number; // Chegirma foizi (masalan 10%)
  discountAmount?: number; // Ayrilgan chegirma summasi (so'mda)
  discountReason?: string; // Masalan: "Ko'p kunga chegirma"
  totalRentAmount: number; // Ijara summasi (chegirma ayrilganidan keyin)
  paidAmount: number; // Oldindan to'langan
  remainingAmount: number; // Qoldiq to'lov
  paymentMethod?: PaymentMethod; // To'lov turi: 'cash' (Naqd) | 'card' (Karta) | 'transfer' (Perevod)
  finalPaymentMethod?: PaymentMethod;
  depositType: 'passport' | 'cash' | 'driver_license' | 'other';
  depositNote: string; // Masalan: "1,000,000 so'm" yoki "Prava AA 1234567"
  status: OrderStatus;
  penaltyAmount?: number; // Kechikish jarimasi
  notes?: string;
  createdAt: string;
}

export interface RepairRecord {
  id: string;
  toolId: string;
  toolName: string;
  toolArticle: string;
  quantity: number;
  sentDate: string; // YYYY-MM-DD
  defectDescription: string; // Nosozlik tavsifi
  masterName?: string; // Usta yoki servis nomi
  estimatedCost?: number;
  actualCost: number; // Sarflangan haqiqiy xarajat
  status: 'in_repair' | 'repaired'; // 'in_repair' (Ta'mirda) | 'repaired' (Tuzatildi)
  completedDate?: string;
  notes?: string;
  createdAt: string;

  // Mijoz va buyurtma bilan bog'langan ta'mir/zarar da'vosi (Repair claim)
  clientId?: string;
  clientName?: string;
  orderId?: string;
  orderNumber?: string;
  claimAmount?: number; // Mijozga hisoblangan zarar/ta'mir summasi
  claimSettled?: boolean; // To'langan/qoplanganligi
  claimType?: 'damage' | 'loss' | 'maintenance';
}

export interface StockReceiptItem {
  toolId: string;
  toolName: string;
  article: string;
  code: string;
  quantity: number;
  costPrice: number; // Olingan tannarxi
  dailyRentalPrice: number; // Belgilangan kunlik ijara narxi
  unit?: string; // Masalan: "yugurish metri", "dona", "kg"
  totalPrice?: number; // quantity * costPrice
}

export interface StockReceipt {
  id: string;
  receiptNumber: string; // Masalan: # 5594 yoki #PX-202
  date: string;
  supplierName: string;
  items: StockReceiptItem[];
  totalCost: number;
  currency?: 'UZS' | 'USD';
  status?: string; // Masalan: "Qabul qilindi", "Kutilmoqda", "To'langan"
  responsiblePerson?: string; // Masalan: "G'iyosiddin To'xtayev (OPERATSION BO'LIM)"
  creatorPerson?: string; // Masalan: "Muhammadjon Xudoyberganov (OPERATSION BO'LIM)"
  warehouse?: string; // Masalan: "KO'CHA", "ASOSIY OMBOR"
  priceListType?: string; // Masalan: "KELISH NARXI"
  supplierBalance?: string; // Masalan: "Qoldiq: -197,184,090 UZS..."
  notes?: string;
  createdAt: string;
}

export interface AdminUser {
  username: string;
  fullName: string;
  role: 'admin' | 'manager';
  avatar?: string;
  loginAt?: string;
}

export type WasteTruckType = 'gazel' | 'zil' | 'container';
export type WasteMaterialType = 'bagged' | 'loose';

export interface LogisticsTariffs {
  // Loader (Gruzchik)
  loaderPricePerKg: number; // e.g. 320 so'm / kg
  loaderPassengerLiftFixed: number; // e.g. 40,000 so'm
  loaderCargoLiftFixed: number; // e.g. 20,000 so'm
  loaderPerFloorNoLiftLight: number; // e.g. 18,000 so'm (<= 500kg)
  loaderPerFloorNoLiftHeavy: number; // e.g. 30,000 so'm (> 500kg)
  loaderEntranceDistanceRatePer10m: number; // e.g. 15,000 so'm per 10m beyond 20m

  // Waste Removal (Musor)
  gazelBasePrice: number; // 1.5t e.g. 350,000 so'm
  zilBasePrice: number; // 5t e.g. 700,000 so'm
  containerBasePrice: number; // 8m3 e.g. 1,100,000 so'm
  baggingPricePerBag: number; // Fartovka e.g. 5,000 so'm per bag
  bulkyItemPricePerPiece: number; // Gabarit buyumlar e.g. 40,000 so'm per item
  looseWasteMultiplier: number; // +30% for loose/unsorted
  supportPhone: string;
}

export interface UnifiedOrderItem {
  toolId: string;
  toolName: string;
  quantity: number;
  dailyPrice: number;
}

export interface UnifiedOrder {
  id: string;
  orderNumber: string; // Masalan: #UN-8821
  client: {
    id?: string;
    fullName: string;
    phone: string;
    address?: string;
    passport?: string;
  };
  sellerId?: string;
  deliveryDate: string;
  deliveryTime?: string;
  
  // 1. Tool Rental (Arenda)
  enableRental: boolean;
  rentalItems: UnifiedOrderItem[];
  rentalDays: number;
  rentalAmount: number;
  depositNote?: string;

  // 2. Transport & Delivery (Logistika)
  enableLogistics: boolean;
  logisticsVehicle: 'damas' | 'labo' | 'gazel' | 'none';
  logisticsAmount: number;

  // 3. Porter (Gruzchik)
  enableLoader: boolean;
  loaderWeightKg: number;
  loaderFloor: number;
  loaderHasLift: boolean;
  loaderLiftType: 'yolovchi' | 'yuk';
  loaderAmount: number;

  // 4. Waste Removal (Musor)
  enableWaste: boolean;
  wasteTruckType: WasteTruckType;
  wasteMaterialType: WasteMaterialType;
  wasteVolumeRatio: number;
  wasteBaggingCount: number;
  wasteBulkyCount: number;
  wasteAmount: number;

  // Combined Totals
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface LogisticsOrder {
  id: string;
  orderNumber: string;
  serviceType: 'gruzchik' | 'musor';
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  createdAt: string;
  
  // Attached to WMS
  clientId?: string;
  clientName: string;
  clientPhone: string;
  clientAddress?: string;
  rentalOrderId?: string;
  rentalOrderNumber?: string;
  
  // Details
  totalPrice: number;
  breakdown: Record<string, string | number>;
  notes?: string;
  deliveryDate?: string;
  deliveryTime?: string;
}

