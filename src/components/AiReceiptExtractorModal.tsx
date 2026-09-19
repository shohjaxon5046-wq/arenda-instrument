import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  Camera, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Copy, 
  Check, 
  ArrowRight,
  ClipboardPaste,
  Building2,
  UserCheck,
  Calendar,
  DollarSign
} from 'lucide-react';

export interface ExtractedReceiptItem {
  raqam: string;
  sana: string;
  yetkazib_beruvchi: string;
  summa: string;
  holat: string;
  masuliyatli: string;
  yaratilgan: string;
}

interface AiReceiptExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToReceipt?: (item: ExtractedReceiptItem) => void;
}

const SAMPLE_TEXT = `#5594 buyurtma to'liq qabul qilindi. 
Sana: 2026-yil 17-sentabr.
Yetkazib beruvchi: (№ 233) ELYOR (ABDULAZIZ).
Umumiy hisoblangan summa: 455.91 AQSh dollari.
Hujjat holati: Qabul qilindi.
Mas'ul xodim: G'iyosiddin To'xtayev (OPERATSION BO'LIM).
Tizimda yaratuvchi: Muhammadjon Xudoyberganov (OPERATSION BO'LIM).`;

export const AiReceiptExtractorModal: React.FC<AiReceiptExtractorModalProps> = ({
  isOpen,
  onClose,
  onApplyToReceipt,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [rawText, setRawText] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<ExtractedReceiptItem[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
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
    setExtractedData(null);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    if (activeTab === 'text' && !rawText.trim()) {
      setErrorMessage('Iltimos, matn yoki chek maʼlumotlarini kiriting.');
      return;
    }
    if (activeTab === 'image' && !selectedImage) {
      setErrorMessage('Iltimos, chek yoki invoys rasmini yuklang.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMessage(null);

      let payload: { text?: string; imageBase64?: string; mimeType?: string } = {};

      if (activeTab === 'text') {
        payload.text = rawText;
      } else if (selectedImage) {
        const mimeTypeMatch = selectedImage.match(/^data:(image\/[a-zA-Z0-9+]+);base64,/);
        payload.imageBase64 = selectedImage;
        payload.mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
      }

      const res = await fetch('/api/extract-receipt-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server xatosi: ${res.status}`);
      }

      const data: ExtractedReceiptItem[] = await res.json();
      setExtractedData(data);
    } catch (err: any) {
      console.error('Extract receipt error:', err);
      setErrorMessage(err.message || 'Maʼlumotlarni ajratib olishda xatolik yuz berdi');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyJson = () => {
    if (!extractedData) return;
    const jsonString = JSON.stringify(extractedData, null, 2);
    navigator.clipboard.writeText(jsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 via-stone-800 to-stone-950 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 backdrop-blur-md flex items-center justify-center border border-amber-400/30">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">AI Ombor & Prixod Ma'lumot Strukturizatori</h2>
                <span className="bg-amber-500 text-stone-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-stone-300 font-medium mt-0.5">
                Har qanday matn, chek yoki invoysdan aniq 7 ta asosiy maydonni ajratib olish va jadvalga solish
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          
          {/* Tabs: Matn orqali yoki Rasm orqali */}
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('text');
                  setErrorMessage(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'text' 
                    ? 'bg-white shadow-xs text-stone-950' 
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <ClipboardPaste className="w-4 h-4 text-amber-600" />
                Matn / Chek xabari
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('image');
                  setErrorMessage(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'image' 
                    ? 'bg-white shadow-xs text-stone-950' 
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Camera className="w-4 h-4 text-amber-600" />
                Hujjat / Chek fotosurati
              </button>
            </div>

            {activeTab === 'text' && (
              <button
                type="button"
                onClick={() => setRawText(SAMPLE_TEXT)}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Namuna matnini qo‘yish (#5594)
              </button>
            )}
          </div>

          {/* Tab Content 1: Matn */}
          {activeTab === 'text' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 block">
                Qabul qilish hujjatining ixtiyoriy matnini kiriting yoki nusxalang:
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Masalan: #5594 buyurtma qabul qilindi. Sana: 2026-yil 17-sentabr. Yetkazib beruvchi: (№ 233) ELYOR (ABDULAZIZ), summa: 455.91 AQSh dollari..."
                rows={5}
                className="w-full p-3.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono leading-relaxed"
              />
            </div>
          )}

          {/* Tab Content 2: Rasm */}
          {activeTab === 'image' && (
            <div className="space-y-3">
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
                  className="border-2 border-dashed border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50/40 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-stone-950 transition flex items-center justify-center shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-800">
                      Chek yoki invoys rasmini bu yerga torting yoki bosing
                    </p>
                    <p className="text-xs text-stone-500 mt-1">
                      Kamera yoki galereyadan JPG, PNG, WEBP
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-950 max-h-64 flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Yuklangan invoys"
                    className="w-full h-64 object-contain"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white/90 hover:bg-white text-stone-900 rounded-lg text-xs font-bold shadow-md transition"
                    >
                      Boshqa rasm
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="p-1.5 bg-red-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-red-700 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Extraction Button */}
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={handleExtract}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-700 hover:to-amber-600 text-stone-950 font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-stone-950" />
                <span>AI Hujjat maʼlumotlarini ajratib olmoqda (Gemini Flash)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-stone-950" />
                <span>AI Orqali Strukturaga Solish & Jadval Yaratish</span>
              </>
            )}
          </button>

          {/* Xatolik */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Xatolik</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Natija jadvallari va JSON massivi */}
          {extractedData && extractedData.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-stone-200 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-stone-900 text-sm">
                      Muvaffaqiyatli Strukturaga Solindi ({extractedData.length} ta hujjat)
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      7 ta asosiy maydon ajratib olindi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-stone-300"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">JSON Nusxalandi!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-stone-600" />
                        <span>JSON Massivini Nusxalash</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Jadval ko'rinishi */}
              <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-600 font-black uppercase text-[10px] tracking-wider">
                      <th className="p-3">Raqam</th>
                      <th className="p-3">Sana</th>
                      <th className="p-3">Yetkazib beruvchi</th>
                      <th className="p-3">Summa</th>
                      <th className="p-3">Holat</th>
                      <th className="p-3">Mas'uliyatli</th>
                      <th className="p-3">Yaratilgan</th>
                      {onApplyToReceipt && <th className="p-3 text-right">Amal</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {extractedData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/40 transition">
                        <td className="p-3 font-mono font-bold text-amber-700 whitespace-nowrap">
                          {item.raqam}
                        </td>
                        <td className="p-3 font-medium text-stone-700 whitespace-nowrap">
                          {item.sana}
                        </td>
                        <td className="p-3 font-bold text-stone-900">
                          {item.yetkazib_beruvchi}
                        </td>
                        <td className="p-3 font-black text-emerald-700 whitespace-nowrap">
                          {item.summa}
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {item.holat}
                          </span>
                        </td>
                        <td className="p-3 text-stone-600 whitespace-nowrap">
                          {item.masuliyatli}
                        </td>
                        <td className="p-3 text-stone-500 whitespace-nowrap">
                          {item.yaratilgan}
                        </td>
                        {onApplyToReceipt && (
                          <td className="p-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                onApplyToReceipt(item);
                                onClose();
                              }}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-[11px] rounded-lg shadow-2xs transition flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <span>Prixodga</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* JSON preview blok */}
              <div className="bg-stone-900 rounded-xl p-4 text-stone-100 text-xs font-mono overflow-x-auto space-y-2">
                <div className="flex items-center justify-between text-stone-400 text-[11px] border-b border-stone-800 pb-2">
                  <span>Qaytarilgan qat'iy JSON massivi (So'ralgan formatda):</span>
                  <span className="text-emerald-400 font-bold">Valid JSON</span>
                </div>
                <pre className="text-amber-300">
                  {JSON.stringify(extractedData, null, 2)}
                </pre>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
