import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserSquare, 
  User, 
  Phone, 
  Send, 
  Briefcase, 
  Percent, 
  FileText, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { Seller, SellerRole } from '../types';

interface EditSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerToEdit?: Seller | null;
  onSave: (sellerData: {
    fullName: string;
    phone: string;
    role: SellerRole;
    roleTitle?: string;
    telegram?: string;
    commissionRate: number;
    notes?: string;
    active: boolean;
  }) => void;
}

export const EditSellerModal: React.FC<EditSellerModalProps> = ({
  isOpen,
  onClose,
  sellerToEdit,
  onSave
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [role, setRole] = useState<SellerRole>('seller');
  const [roleTitle, setRoleTitle] = useState('');
  const [telegram, setTelegram] = useState('');
  const [commissionRate, setCommissionRate] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sellerToEdit) {
      setFullName(sellerToEdit.fullName);
      setPhone(sellerToEdit.phone || '+998 ');
      setRole(sellerToEdit.role || 'seller');
      setRoleTitle(sellerToEdit.roleTitle || '');
      setTelegram(sellerToEdit.telegram || '');
      setCommissionRate(sellerToEdit.commissionRate ?? 3);
      setNotes(sellerToEdit.notes || '');
      setActive(sellerToEdit.active !== false);
    } else {
      setFullName('');
      setPhone('+998 ');
      setRole('seller');
      setRoleTitle('');
      setTelegram('');
      setCommissionRate(3);
      setNotes('');
      setActive(true);
    }
    setError('');
  }, [sellerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Iltimos, xodimning F.I.Sh (ism va familiyasi)ni kiriting');
      return;
    }

    onSave({
      fullName: fullName.trim(),
      phone: phone.trim() === '+998' ? '' : phone.trim(),
      role,
      roleTitle: roleTitle.trim() || undefined,
      telegram: telegram.trim() || undefined,
      commissionRate: Number(commissionRate) || 0,
      notes: notes.trim() || undefined,
      active
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <UserSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {sellerToEdit ? 'Xodim Ma’lumotlarini Tahrirlash' : 'Yangi Xodim Qo‘shish'}
              </h3>
              <p className="text-xs text-slate-400">
                {sellerToEdit ? 'Mavjud sotuvchi ma’lumotlarini yangilash' : 'Yangi sotuvchi yoki menejerni tizimga kiritish'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              F.I.Sh (Ism va Familiya) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Masalan: Shoxjaxon Aliyev"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Phone & Telegram */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Telefon raqami
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Telegram username
              </label>
              <div className="relative">
                <Send className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={telegram}
                  onChange={e => setTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Role & Role Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Lavozim toifasi
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={role}
                  onChange={e => {
                    const newRole = e.target.value as SellerRole;
                    setRole(newRole);
                    if (!roleTitle || roleTitle === 'Kassir-Sotuvchi' || roleTitle === 'Katta Menejer' || roleTitle === 'Bosh Administrator' || roleTitle === 'Texnik Usta') {
                      if (newRole === 'admin') setRoleTitle('Bosh administrator');
                      if (newRole === 'manager') setRoleTitle('Katta menejer');
                      if (newRole === 'seller') setRoleTitle('Kassir-operator');
                      if (newRole === 'technician') setRoleTitle('Texnik qabul qiluvchi');
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
                >
                  <option value="seller">Kassir / Sotuvchi</option>
                  <option value="manager">Katta Menejer</option>
                  <option value="admin">Administrator</option>
                  <option value="technician">Texnik Usta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Lavozim nomi (aniqroq)
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={e => setRoleTitle(e.target.value)}
                placeholder="Masalan: Kassa va ijara operatori"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Commission & Active Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                KPI Bonusi (%)
              </label>
              <div className="relative">
                <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={commissionRate}
                  onChange={e => setCommissionRate(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Faollik holati
              </label>
              <button
                type="button"
                onClick={() => setActive(!active)}
                className={`w-full py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                  active 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100' 
                    : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {active ? 'Faol ishlamoqda' : 'Nofaol / Ta’tilda'}
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Qo'shimcha izoh / Eslatma
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Xodim bo'yicha qo'shimcha ma'lumot, vazifalari yoki qabul qilingan sanasi..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Modal Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{sellerToEdit ? 'O‘zgarishlarni Saqlash' : 'Xodimni Qo‘shish'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
