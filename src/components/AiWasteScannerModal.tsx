import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  Camera, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Truck, 
  Users, 
  Scale, 
  Box, 
  Layers, 
  ArrowRight,
  HelpCircle,
  Image as ImageIcon,
  RotateCw
} from 'lucide-react';
import { formatMoney } from '../utils/formatters';

export interface AiWasteAnalysisResult {
  trash_type: string;
  volume_m3: number;
  estimated_weight_tons: number;
  estimated_bags: number;
  state: 'Sochiluvchan' | 'Qoplangan';
  recommended_transport: 'Gazel Bortli' | 'ZIL Samosval' | 'Konteyner 8m³';
  recommended_loaders: number;
  confidence_score: 'Yuqori' | 'O\'rtacha';
  analysis_summary?: string;
}

interface AiWasteScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyResult: (result: AiWasteAnalysisResult) => void;
}

// Demo namunaviy rasmlar (foydalanuvchi tezkor sinab ko'rishi uchun)
const SAMPLE_PRESETS = [
  {
    id: 'sample-brick',
    title: 'G‘isht va beton siniqlari (Sochiluvchan)',
    desc: 'Buzilgan devor qoldiqlari uyumi',
    // Unsplash dan qurilish qoldiqlari rasmi
    url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sample-bagged',
    title: 'Qoplarga solingan shtukaturka',
    desc: 'Oq qoplar terib qo‘yilgan',
    url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sample-heavy',
    title: 'Katta aralash qurilish chiqindisi',
    desc: 'Plitalar, armatura va beton bo‘laklari',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80',
  }
];

export const AiWasteScannerModal: React.FC<AiWasteScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyResult,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AiWasteAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Iltimos, faqat rasm faylini tanlang (JPG, PNG, WEBP).');
      return;
    }

    setErrorMessage(null);
    setAnalysisResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = async (url: string) => {
    try {
      setErrorMessage(null);
      setAnalysisResult(null);
      setIsAnalyzing(true);

      // Fetch sample image and convert to base64
      const res = await fetch(url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setSelectedImage(base64data);
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(blob);
    } catch {
      setIsAnalyzing(false);
      setErrorMessage('Namunaviy rasmni yuklab bo‘lmadi, iltimos o‘zingiz rasm yuklang.');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setErrorMessage('Iltimos, avval rasm tanlang yoki yuklang.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMessage(null);

      const mimeTypeMatch = selectedImage.match(/^data:(image\/[a-zA-Z0-9+]+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

      const response = await fetch('/api/analyze-waste-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server xatosi: ${response.status}`);
      }

      const data: AiWasteAnalysisResult = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      let msg = err?.message || 'Chiqindini tahlil qilishda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.';
      if (typeof msg === 'string') {
        try {
          const jsonStart = msg.indexOf('{');
          if (jsonStart !== -1) {
            const parsed = JSON.parse(msg.slice(jsonStart));
            if (parsed?.error?.message) {
              msg = parsed.error.message;
            }
          }
        } catch {
          // ignore
        }
      }
      if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
        msg = 'Google AI serverida ayni paytda yuqori yuklama (503). Bir necha soniyadan so‘ng qayta urinib ko‘ring.';
      }
      setErrorMessage(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!analysisResult) return;
    onApplyResult(analysisResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">AI Chiqindi Baholovchi</h2>
                <span className="bg-white/25 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                  Vision Gemini
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium mt-0.5">
                Fotosurat orqali hajm (m³), tonna, qoplar, kerakli mashina va ishchilar sonini avtomatik aniqlash
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-black/10 hover:bg-black/20 text-white/90 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Rasm yuklash va preview qismi */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-red-600" />
                Chiqindilar fotosuratini yuklang:
              </label>
              {selectedImage && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setAnalysisResult(null);
                    setErrorMessage(null);
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-bold"
                >
                  Rasmni o‘chirish
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {!selectedImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/40 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition flex items-center justify-center shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Fotosuratni bu yerga tortib keling yoki bosing
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Smartfon kamerasi yoki fayllardan JPG, PNG, WEBP (maks. 20MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group max-h-72 flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Yuklangan chiqindi"
                  className="w-full h-72 object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-4 opacity-90 group-hover:opacity-100 transition">
                  <span className="self-start bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                    Yuklangan fotosurat
                  </span>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-900 rounded-lg text-xs font-bold shadow-md transition"
                    >
                      Boshqa rasm tanlash
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Namunaviy rasmlar (Tezkor sinov) */}
            {!selectedImage && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">
                  Yoki tayyor namuna bilan sinab ko‘ring:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_PRESETS.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSelectSample(sample.url)}
                      className="p-2 border border-slate-200 hover:border-amber-400 rounded-xl bg-white hover:bg-amber-50/50 text-left transition flex items-center gap-2.5 text-xs group"
                    >
                      <img
                        src={sample.url}
                        alt={sample.title}
                        className="w-10 h-10 rounded-lg object-cover group-hover:scale-105 transition shrink-0"
                      />
                      <div className="overflow-hidden">
                        <div className="font-bold text-slate-800 truncate text-[11px]">
                          {sample.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {sample.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tahlil tugmasi */}
          {selectedImage && !analysisResult && (
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleAnalyze}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black text-sm shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI Fotosuratni tahlil qilmoqda (Gemini Vision)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-200" />
                  <span>AI orqali tahlil qilish & Baholash</span>
                </>
              )}
            </button>
          )}

          {/* Xatolik xabari */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Xatolik yuz berdi</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="shrink-0 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>Qayta urinish</span>
              </button>
            </div>
          )}

          {/* AI Natijalar Kartasi */}
          {analysisResult && (
            <div className="bg-slate-50 rounded-2xl border-2 border-amber-400 p-5 space-y-4 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">
                      AI Tahlil Natijasi
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Ishonchlilik: <strong className="text-emerald-700">{analysisResult.confidence_score}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Qayta tahlil
                </button>
              </div>

              {/* Parametrlar gridi */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                
                {/* Chiqindi turi */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-3">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                    Chiqindi turi
                  </span>
                  <div className="font-black text-slate-900 text-sm">
                    {analysisResult.trash_type}
                  </div>
                </div>

                {/* Hajmi (m³) */}
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1 flex items-center gap-1">
                    <Box className="w-3 h-3 text-blue-600" /> Hajmi (m³)
                  </span>
                  <div className="font-black text-blue-700 text-base">
                    ~{analysisResult.volume_m3} m³
                  </div>
                </div>

                {/* Og‘irligi (Tonna) */}
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1 flex items-center gap-1">
                    <Scale className="w-3 h-3 text-amber-600" /> Og‘irligi
                  </span>
                  <div className="font-black text-amber-700 text-base">
                    ~{analysisResult.estimated_weight_tons} tonna
                  </div>
                </div>

                {/* Qoplar soni */}
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-purple-600" /> 50 kg lik qop
                  </span>
                  <div className="font-black text-purple-700 text-base">
                    ~{analysisResult.estimated_bags} ta qop
                  </div>
                </div>

                {/* Holati: Sochiluvchan / Qoplangan */}
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                    Chiqindi holati
                  </span>
                  <span className={`inline-block px-2 py-0.5 rounded font-black text-xs ${
                    analysisResult.state === 'Sochiluvchan'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {analysisResult.state}
                  </span>
                </div>

                {/* Mos transport */}
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1 flex items-center gap-1">
                    <Truck className="w-3 h-3 text-red-600" /> Tavsiya transport
                  </span>
                  <div className="font-black text-red-700 text-xs sm:text-sm">
                    {analysisResult.recommended_transport}
                  </div>
                </div>

                {/* Zarur ishchilar soni */}
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3 text-emerald-600" /> Ishchilar (Gruzchik)
                  </span>
                  <div className="font-black text-emerald-700 text-base">
                    {analysisResult.recommended_loaders} nafar
                  </div>
                </div>

              </div>

              {/* Tahlil xulosasi */}
              {analysisResult.analysis_summary && (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                  <strong className="block mb-0.5 text-amber-950 font-bold">💡 AI Tavsiyasi:</strong>
                  {analysisResult.analysis_summary}
                </div>
              )}

              {/* Tugma: Buyurtma / Kalkulyatorga o'tkazish */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Kalkulyatorga o‘tkazish (Avtomatik to‘ldirish)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
