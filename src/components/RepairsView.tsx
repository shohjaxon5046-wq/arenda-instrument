import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Trash2, 
  User, 
  FileText,
  Hammer,
  Check,
  X,
  Filter
} from 'lucide-react';
import { useRental } from '../context/RentalContext';
import { Tool, RepairRecord } from '../types';
import { formatMoney, formatDate, getTodayDateString } from '../utils/formatters';

interface RepairsViewProps {
  preSelectedTool?: Tool | null;
  onClearPreSelected?: () => void;
}

export const RepairsView: React.FC<RepairsViewProps> = ({
  preSelectedTool,
  onClearPreSelected
}) => {
  const { tools, repairs, sendToRepair, completeRepair, deleteRepair } = useRental();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_repair' | 'repaired'>('all');

  // Modal: Send to Repair
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [defectDescription, setDefectDescription] = useState('');
  const [masterName, setMasterName] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Modal: Complete Repair
  const [completeModalTarget, setCompleteModalTarget] = useState<RepairRecord | null>(null);
  const [actualCost, setActualCost] = useState<number>(0);
  const [completionNotes, setCompletionNotes] = useState('Usta sozlab berdi, to‘liq ishga yaroqli.');

  // Preselected tool handling
  React.useEffect(() => {
    if (preSelectedTool) {
      setSelectedToolId(preSelectedTool.id);
      setIsSendModalOpen(true);
      if (onClearPreSelected) onClearPreSelected();
    }
  }, [preSelectedTool]);

  // Statistics
  const activeRepairs = repairs.filter(r => r.status === 'in_repair');
  const completedRepairs = repairs.filter(r => r.status === 'repaired');
  const totalInRepairUnits = activeRepairs.reduce((acc, r) => acc + r.quantity, 0);
  const totalRepairSpent = completedRepairs.reduce((acc, r) => acc + (r.actualCost || 0), 0);

  // Available tools for repair selection
  const toolsAvailableForRepair = tools.filter(t => t.availableStock > 0);

  // Selected tool object for modal validation
  const currentSelectedTool = tools.find(t => t.id === selectedToolId);
  const maxAvailableQty = currentSelectedTool ? currentSelectedTool.availableStock : 1;

  const handleOpenSendModal = () => {
    setErrorMessage('');
    if (!selectedToolId && toolsAvailableForRepair.length > 0) {
      setSelectedToolId(toolsAvailableForRepair[0].id);
    }
    setQuantity(1);
    setDefectDescription('');
    setMasterName('');
    setEstimatedCost(0);
    setIsSendModalOpen(true);
  };

  const handleConfirmSendToRepair = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedToolId) {
      setErrorMessage('Iltimos, ta‘mirga yuboriladigan asbobni tanlang');
      return;
    }

    if (!currentSelectedTool || currentSelectedTool.availableStock < 1) {
      setErrorMessage('Ushbu asbobdan erkin qoldiq mavjud emas');
      return;
    }

    if (quantity < 1 || quantity > currentSelectedTool.availableStock) {
      setErrorMessage(`Maksimal ${currentSelectedTool.availableStock} dona yuborishingiz mumkin`);
      return;
    }

    if (!defectDescription.trim()) {
      setErrorMessage('Iltimos, asbobdagi nuqson yoki muammoni yozing');
      return;
    }

    sendToRepair({
      toolId: selectedToolId,
      quantity,
      defectDescription: defectDescription.trim(),
      masterName: masterName.trim() || undefined,
      estimatedCost: Number(estimatedCost) || 0
    });

    setIsSendModalOpen(false);
  };

  const handleOpenCompleteModal = (repair: RepairRecord) => {
    setCompleteModalTarget(repair);
    setActualCost(repair.estimatedCost || 0);
    setCompletionNotes('Asbob sozlandi va sinovdan o‘tkazildi.');
  };

  const handleConfirmCompleteRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalTarget) return;

    completeRepair(completeModalTarget.id, Number(actualCost) || 0, completionNotes.trim());
    setCompleteModalTarget(null);
  };

  const handleDeleteRepair = (repairId: string) => {
    if (window.confirm("Rostdan ham ushbu ta'mirlash yozuvini o'chirmoqchimisiz?")) {
      deleteRepair(repairId);
    }
  };

  // Filtered repairs
  const filteredRepairs = repairs.filter(r => {
    const matchesSearch = 
      r.toolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.toolArticle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.masterName && r.masterName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.defectDescription.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' 
        ? true 
        : r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <Wrench className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-black text-stone-900 tracking-tight">
              Ta’mirlash & Servis Boshqaruvi
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Buzilgan yoki profilaktika talab qiluvchi asboblarni hisobga olish va xarajatlarni nazorat qilish
          </p>
        </div>

        <button
          onClick={handleOpenSendModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-sm transition active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Asbobni Ta’mirga Yuborish</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: In Repair Units */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black">
            <Wrench className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Hozir Servisda
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-stone-900">{totalInRepairUnits}</span>
              <span className="text-xs font-semibold text-stone-500">dona asbob</span>
            </div>
          </div>
        </div>

        {/* Card 2: Completed Repairs */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Tugallangan Ta’mirlar
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-stone-900">{completedRepairs.length}</span>
              <span className="text-xs font-semibold text-stone-500">ta ish</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Money Spent on Repairs */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center font-black">
            <DollarSign className="w-6 h-6 text-stone-700" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Jami Ta’mir Xarajati
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-stone-900">{formatMoney(totalRepairSpent)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Barchasi ({repairs.length})
          </button>
          <button
            onClick={() => setStatusFilter('in_repair')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'in_repair'
                ? 'bg-amber-500 text-stone-950'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Hozir Ta’mirda ({activeRepairs.length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('repaired')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'repaired'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tugallangan ({completedRepairs.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Asbob, artikul yoki usta nomi..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

      </div>

      {/* Repairs List */}
      {filteredRepairs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
            <Wrench className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-stone-800 text-base">Hozircha ta’mirlash yozuvlari mavjud emas</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Asboblardan biri nosoz bo‘lsa yoki profilaktikaga yuborilsa, «Asbobni Ta’mirga Yuborish» tugmasi orqali hisobga oling.
          </p>
          <button
            onClick={handleOpenSendModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Birinchi Asbobni Yuborish</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRepairs.map(repair => {
            const isInRepair = repair.status === 'in_repair';

            return (
              <div
                key={repair.id}
                className={`bg-white rounded-2xl border transition shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isInRepair ? 'border-amber-300' : 'border-stone-200'
                }`}
              >
                {/* Header */}
                <div className={`p-4 border-b flex items-start justify-between gap-2 ${
                  isInRepair ? 'bg-amber-50/50 border-amber-100' : 'bg-stone-50 border-stone-100'
                }`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-800">
                        {repair.toolArticle}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isInRepair 
                          ? 'bg-amber-500 text-stone-950 animate-pulse' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isInRepair ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {isInRepair ? 'Ta‘mirda' : 'Tugallangan'}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-stone-900 mt-1.5 leading-tight">
                      {repair.toolName}
                    </h3>
                  </div>

                  <span className="px-2 py-1 bg-white rounded-lg border border-stone-200 font-bold text-xs text-stone-900 shadow-2xs shrink-0">
                    {repair.quantity} dona
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-3 text-xs flex-1">
                  
                  {/* Defect Description */}
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                      Nosozlik tavsifi:
                    </span>
                    <p className="text-stone-800 font-medium leading-relaxed">
                      {repair.defectDescription}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-stone-600 text-[11px]">
                    <div>
                      <span className="text-stone-400 block">Usta / Servis:</span>
                      <b className="text-stone-800">{repair.masterName || 'Kiritilmagan'}</b>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Yuborilgan sana:</span>
                      <b className="text-stone-800">{formatDate(repair.sentDate)}</b>
                    </div>
                    {repair.completedDate && (
                      <div>
                        <span className="text-stone-400 block">Tugallangan:</span>
                        <b className="text-emerald-700">{formatDate(repair.completedDate)}</b>
                      </div>
                    )}
                    <div>
                      <span className="text-stone-400 block">
                        {isInRepair ? 'Taxminiy xarajat:' : 'Haqiqiy to‘langan:'}
                      </span>
                      <b className={isInRepair ? 'text-stone-800' : 'text-emerald-700 font-bold'}>
                        {formatMoney(isInRepair ? repair.estimatedCost : repair.actualCost)}
                      </b>
                    </div>
                  </div>

                  {repair.notes && (
                    <div className="text-[11px] text-stone-500 italic bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                      Natija: {repair.notes}
                    </div>
                  )}

                </div>

                {/* Footer Action */}
                <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDeleteRepair(repair.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-stone-200 transition"
                    title="Yozuvni o'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {isInRepair ? (
                    <button
                      onClick={() => handleOpenCompleteModal(repair)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xs transition active:scale-95"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Ta’mirlandi & Omborga Qaytish</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1 px-2 py-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Omborda mavjud</span>
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Send to Repair */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-white">Asbobni Ta’mirga Yuborish</h2>
                  <p className="text-xs text-stone-400">
                    Buzilgan uskunani servisga biriktirish
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSendModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmSendToRepair} className="p-6 space-y-4 text-xs">
              
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Select Tool */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Ta’mirga yuboriladigan asbob *
                </label>
                <select
                  value={selectedToolId}
                  onChange={e => {
                    setSelectedToolId(e.target.value);
                    setQuantity(1);
                  }}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {tools.map(tool => (
                    <option 
                      key={tool.id} 
                      value={tool.id} 
                      disabled={tool.availableStock <= 0}
                    >
                      {tool.name} ({tool.article}) — {tool.availableStock > 0 ? `Bo‘sh: ${tool.availableStock} ta` : 'Hozir mavjud emas'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <div className="flex justify-between text-stone-700 font-bold mb-1">
                  <span>Soni (dona) *</span>
                  <span className="text-stone-400 text-[11px]">
                    Maksimal erkin: {maxAvailableQty} ta
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={maxAvailableQty}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, Math.min(maxAvailableQty, Number(e.target.value))))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Defect Description */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Nosozlik / Nuqson tavsifi *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Masalan: Yakoridan tutun chiqmoqda, patron qotib qolgan yoki zaryad olmayapti..."
                  value={defectDescription}
                  onChange={e => setDefectDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden resize-none"
                />
              </div>

              {/* Master / Service Center */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Usta yoki Servis markazi nomi
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Akmal Usta (Tel: 90 123-45-67) yoki Bosch Servis"
                  value={masterName}
                  onChange={e => setMasterName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Estimated Cost */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Taxminiy ta’mir narxi (so‘m)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  placeholder="0"
                  value={estimatedCost || ''}
                  onChange={e => setEstimatedCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsSendModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black shadow-md transition flex items-center gap-1.5"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Ta’mirga Yuborish</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal: Complete Repair */}
      {completeModalTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white text-emerald-800 flex items-center justify-center font-black">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-white">Ta’mirdan Qabul Qilish</h2>
                  <p className="text-xs text-emerald-100">
                    {completeModalTarget.toolName} ({completeModalTarget.quantity} dona)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCompleteModalTarget(null)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCompleteRepair} className="p-6 space-y-4 text-xs">
              
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 space-y-1">
                <div className="flex justify-between text-emerald-900">
                  <span>Asbob nomi:</span>
                  <b>{completeModalTarget.toolName}</b>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Omborga qaytadigan soni:</span>
                  <b>+{completeModalTarget.quantity} dona</b>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Nosozlik:</span>
                  <span className="italic">{completeModalTarget.defectDescription}</span>
                </div>
              </div>

              {/* Actual Cost */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Ustaga to‘langan haqiqiy summa (so‘m) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  required
                  value={actualCost}
                  onChange={e => setActualCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Completion Notes */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Bajarilgan ishlar izohi
                </label>
                <input
                  type="text"
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  placeholder="Masalan: Yangi yakor qo‘yildi, moylandi, yaxshi ishlayapti"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setCompleteModalTarget(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Omborga Qaytarish</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
