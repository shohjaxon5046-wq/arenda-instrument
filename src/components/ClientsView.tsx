import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  CreditCard, 
  MapPin, 
  ClipboardList, 
  Check, 
  Clock, 
  History, 
  Wrench, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Client, RentalOrder } from '../types';
import { useRental } from '../context/RentalContext';
import { formatMoney } from '../utils/formatters';
import { ClientActivityTimelineModal } from './ClientActivityTimelineModal';

interface ClientsViewProps {
  onNewOrderForClient: (client: Client) => void;
  onPrintReceipt?: (order: RentalOrder) => void;
  externalSearchTerm?: string;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ 
  onNewOrderForClient,
  onPrintReceipt,
  externalSearchTerm = ''
}) => {
  const { clients, orders, repairs, addClient } = useRental();
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientForTimeline, setSelectedClientForTimeline] = useState<Client | null>(null);

  useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);

  // New client form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [passport, setPassport] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const filteredClients = clients.filter(c =>
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.passport.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;

    addClient({
      fullName: fullName.trim(),
      phone: phone.trim(),
      passport: passport.trim().toUpperCase(),
      address: address.trim(),
      notes: notes.trim()
    });

    setFullName('');
    setPhone('+998 ');
    setPassport('');
    setAddress('');
    setNotes('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-stone-900 tracking-tight">
              Mijozlar bazasi
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
              {clients.length} ta mijoz
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Doimiy mijozlar, pasport ma’lumotlari, faoliyat tarixi, to‘lovlar va ta‘mir da‘volari xronologiyasi
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md shadow-amber-500/20 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Yangi Mijoz Qo‘shish</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Mijoz ismi, telefon raqami yoki pasporti bo‘yicha qidirish..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white text-stone-900 transition"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map(client => {
          const clientPhoneClean = client.phone.replace(/\s+/g, '');
          const clientOrders = orders.filter(
            o => (client.id && o.client.id === client.id) ||
                 o.client.phone.replace(/\s+/g, '') === clientPhoneClean ||
                 (client.passport && o.client.passport.toUpperCase() === client.passport.toUpperCase())
          );
          const activeRentals = clientOrders.filter(o => o.status !== 'returned');
          const totalDebt = clientOrders.reduce((sum, o) => sum + (o.remainingAmount || 0), 0);

          const clientOrderIds = new Set(clientOrders.map(o => o.id));
          const clientOrderNumbers = new Set(clientOrders.map(o => o.orderNumber));
          const clientRepairs = repairs.filter(
            r => (client.id && r.clientId === client.id) ||
                 (r.clientName && r.clientName.toLowerCase().trim() === client.fullName.toLowerCase().trim()) ||
                 (r.orderId && clientOrderIds.has(r.orderId)) ||
                 (r.orderNumber && clientOrderNumbers.has(r.orderNumber))
          );
          const unsettledClaims = clientRepairs.filter(r => !r.claimSettled);

          return (
            <div
              key={client.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedClientForTimeline(client)}
                      title="Mijoz faoliyat xronologiyasini ko‘rish"
                      className="w-10 h-10 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-black flex items-center justify-center text-sm transition shrink-0"
                    >
                      {client.fullName.charAt(0).toUpperCase()}
                    </button>
                    <div>
                      <h3 
                        onClick={() => setSelectedClientForTimeline(client)}
                        className="font-bold text-sm text-stone-900 leading-tight hover:text-amber-700 cursor-pointer transition"
                      >
                        {client.fullName}
                      </h3>
                      <a
                        href={`tel:${clientPhoneClean}`}
                        className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        {client.phone}
                      </a>
                    </div>
                  </div>

                  {activeRentals.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-stone-950">
                      {activeRentals.length} ta ijarada
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600">
                      Bo‘sh
                    </span>
                  )}
                </div>

                {/* Status Badges Row */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {totalDebt > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                      Qarz: {formatMoney(totalDebt)}
                    </span>
                  ) : clientOrders.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> To‘liq to‘langan
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-500">
                      Yangi mijoz
                    </span>
                  )}

                  {clientRepairs.length > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      unsettledClaims.length > 0 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                        : 'bg-stone-100 text-stone-700'
                    }`}>
                      <Wrench className="w-3 h-3" />
                      {clientRepairs.length} ta ta‘mir {unsettledClaims.length > 0 ? `(${unsettledClaims.length} ochiq)` : ''}
                    </span>
                  )}
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs space-y-1 text-stone-600">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Pasport / ID:</span>
                    <b className="font-mono text-stone-900">{client.passport || 'Kiritilmagan'}</b>
                  </div>
                  {client.address && (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-stone-400 shrink-0">Manzil:</span>
                      <span className="text-right text-stone-700 truncate max-w-[170px]">{client.address}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-stone-200/80">
                    <span className="text-stone-400">Jami buyurtmalar:</span>
                    <b className="text-stone-900">{clientOrders.length} marta</b>
                  </div>
                </div>

                {client.notes && (
                  <p className="text-[11px] text-stone-500 italic bg-amber-50/50 p-2 rounded-lg truncate">
                    {client.notes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                <button
                  onClick={() => setSelectedClientForTimeline(client)}
                  className="flex-1 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
                >
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>Faoliyat Tarixi</span>
                </button>

                <button
                  onClick={() => onNewOrderForClient(client)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs transition active:scale-95"
                  title="Ushbu mijozga yangi asbob ijaraga berish"
                >
                  + Ijara
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dedicated Activity Timeline View Modal */}
      {selectedClientForTimeline && (
        <ClientActivityTimelineModal
          isOpen={!!selectedClientForTimeline}
          onClose={() => setSelectedClientForTimeline(null)}
          client={selectedClientForTimeline}
          onNewOrderForClient={onNewOrderForClient}
          onPrintReceipt={onPrintReceipt}
        />
      )}

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-stone-900">
              Yangi Mijoz Kiritish
            </h3>

            <form onSubmit={handleAddClient} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Mijoz F.I.Sh (Ism va Familiya) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Sardor Rustamov"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Telefon raqami *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  Pasport / ID seriya raqami
                </label>
                <input
                  type="text"
                  placeholder="AA 1234567"
                  value={passport}
                  onChange={e => setPassport(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono uppercase focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  Manzil
                </label>
                <input
                  type="text"
                  placeholder="Toshkent sh..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  Mijoz haqida izoh (kasbi, ishonchliligi)
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Betonchi usta, doimiy mijoz..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black shadow-md transition"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

