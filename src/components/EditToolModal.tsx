import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Upload, FolderOpen, Image as ImageIcon } from 'lucide-react';
import { Tool, ToolCategory } from '../types';
import { useRental } from '../context/RentalContext';

interface EditToolModalProps {
  tool: Tool | null;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: ToolCategory[] = [
  'Elektroinstrument',
  'Benzinli & Generator',
  'Payvandlash & Metall',
  'Beton & Qurilish',
  'Bog‘ & Tozalash',
  'Narvon & Havoza',
  'O‘lchov & Lazer'
];

export const EditToolModal: React.FC<EditToolModalProps> = ({
  tool,
  isOpen,
  onClose
}) => {
  const { updateTool } = useRental();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [article, setArticle] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<ToolCategory>('Elektroinstrument');
  const [dailyPrice, setDailyPrice] = useState('');
  const [depositPrice, setDepositPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (tool) {
      setName(tool.name);
      setArticle(tool.article);
      setCode(tool.code);
      setCategory(tool.category);
      setDailyPrice(tool.dailyPrice.toString());
      setDepositPrice(tool.depositPrice.toString());
      setBrand(tool.brand || '');
      setModel(tool.model || '');
      setImageUrl(tool.imageUrl);
      setDescription(tool.description || '');
    }
  }, [tool]);

  if (!isOpen || !tool) return null;

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Faqat rasm faylini tanlang!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const dPrice = parseFloat(dailyPrice) || 0;
    const depPrice = parseFloat(depositPrice) || 0;

    const updated: Tool = {
      ...tool,
      name: name.trim(),
      article: article.trim() || tool.article,
      code: code.trim() || tool.code,
      category,
      dailyPrice: dPrice,
      depositPrice: depPrice,
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      imageUrl: imageUrl || tool.imageUrl,
      description: description.trim() || undefined
    };

    updateTool(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Mahsulotni tahrirlash
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Artikul: {tool.article} • Kod: {tool.code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Mahsulot Nomi *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kategoriya
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ToolCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Brend / Ishlab chiqaruvchi
              </label>
              <input
                type="text"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                placeholder="Masalan: Bosch, Makita..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kunlik Ijara Narxi (so‘m) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={dailyPrice}
                onChange={e => setDailyPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Garov Summasi (so‘m) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={depositPrice}
                onChange={e => setDepositPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Image Upload Area */}
          <div className="space-y-2 pt-1">
            <label className="block font-bold text-slate-700">
              Mahsulot Rasmi (Kompyuterdan yoki URL)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-between gap-3 ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-slate-300 bg-white"
                />
                <div className="text-left">
                  <p className="font-bold text-slate-800">Kompyuterdan yangi rasm yuklash</p>
                  <span className="text-[11px] text-slate-400">Yoki sudrab tashlang</span>
                </div>
              </div>

              <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-1">
                <FolderOpen className="w-3.5 h-3.5" /> Tanlash
              </span>
            </div>

            <input
              type="text"
              value={imageUrl.startsWith('data:') ? '' : imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="Yoki to‘g‘ridan-to‘g‘ri rasm havolasi (URL)..."
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Qo‘shimcha Izoh
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="Texnik ko‘rsatkichlari, to‘plamdagi detallar..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Saqlash</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
