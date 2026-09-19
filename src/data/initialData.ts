import { Tool, RentalOrder, StockReceipt, Client, Seller } from '../types';

// Standart boshlang'ich ma'lumotlar: Foydalanuvchi barcha asboblarni 0 dan o'zi qo'shishi uchun bo'sh (0) holatda
export const INITIAL_TOOLS: Tool[] = [];
export const INITIAL_ORDERS: RentalOrder[] = [];
export const INITIAL_RECEIPTS: StockReceipt[] = [];
export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_SELLERS: Seller[] = [
  {
    id: 'sel-1',
    fullName: 'Shoxjaxon Aliyev',
    phone: '+998 90 123 45 67',
    active: true,
    role: 'admin',
    roleTitle: 'Bosh administrator & Kassir',
    telegram: '@shoxjaxon_arenda',
    commissionRate: 5,
    notes: 'Bosh boshqaruvchi va asosiy kassa mas’uli',
    createdAt: '2025-01-10T08:00:00.000Z'
  },
  {
    id: 'sel-2',
    fullName: 'Azizbek Rahimov',
    phone: '+998 91 987 65 43',
    active: true,
    role: 'manager',
    roleTitle: 'Katta menejer / Operator',
    telegram: '@azizbek_rent',
    commissionRate: 4,
    notes: 'Mijozlar bilan ishlash va shartnomalar tuzish bo‘yicha mas’ul',
    createdAt: '2025-01-15T09:00:00.000Z'
  },
  {
    id: 'sel-3',
    fullName: 'Jasur Temirov',
    phone: '+998 93 555 11 22',
    active: true,
    role: 'seller',
    roleTitle: 'Kassir va Ijaraga beruvchi',
    telegram: '@jasur_tools',
    commissionRate: 3,
    notes: 'Asboblarni topshirish va garov qabul qilish',
    createdAt: '2025-02-01T10:00:00.000Z'
  },
  {
    id: 'sel-4',
    fullName: 'Otabek Mahmudov',
    phone: '+998 97 777 88 99',
    active: true,
    role: 'technician',
    roleTitle: 'Asboblar sozlovchisi & Qabul qiluvchi',
    telegram: '@otabek_servis',
    commissionRate: 2,
    notes: 'Uskunalarni tekshirish, sozlash va ta’mirga yuborish',
    createdAt: '2025-02-10T11:00:00.000Z'
  }
];

