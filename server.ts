import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parsing with support for large base64 image payloads
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Lazy initialization for GoogleGenAI
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// API Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Helper for Gemini requests with automatic retry and model fallback (503 / 429 resilience)
async function generateContentWithRetry(
  ai: GoogleGenAI,
  request: { contents: any[]; config: any },
  models: string[] = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview']
) {
  let lastErr: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini AI] Trying model ${model} (attempt ${attempt})...`);
        const response = await ai.models.generateContent({
          model,
          contents: request.contents,
          config: request.config,
        });

        if (response && response.text) {
          console.log(`[Gemini AI] Succeeded with model: ${model}`);
          return response;
        }
      } catch (err: any) {
        lastErr = err;
        const msg = String(err?.message || '');
        console.warn(`[Gemini AI] Error on ${model} (attempt ${attempt}):`, msg);

        const isBusy = msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE') || msg.includes('429');
        if (isBusy) {
          // Wait 600ms before retrying or trying next fallback model
          await new Promise((resolve) => setTimeout(resolve, 600));
        } else {
          // Switch to next fallback model immediately
          break;
        }
      }
    }
  }

  throw lastErr;
}

function formatErrorMessage(error: any): string {
  let errorMsg = error?.message || 'Tahlil qilishda xatolik yuz berdi';

  if (typeof errorMsg === 'string') {
    try {
      const jsonStart = errorMsg.indexOf('{');
      if (jsonStart !== -1) {
        const parsed = JSON.parse(errorMsg.slice(jsonStart));
        if (parsed?.error?.message) {
          errorMsg = parsed.error.message;
        }
      }
    } catch {
      // ignore json parse error
    }
  }

  if (errorMsg.includes('503') || errorMsg.includes('high demand') || errorMsg.includes('UNAVAILABLE')) {
    return 'Google AI serverida vaqtinchalik yuqori yuklama (503). Tizim avtomatik qayta urinishni qo‘llab-quvvatlaydi, iltimos qayta bosing.';
  }

  return errorMsg;
}

// AI Waste Analysis from Image
app.post('/api/analyze-waste-image', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Rasm ma\'lumoti (base64) taqdim etilmadi' });
    }

    // Sanitize base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
    const actualMimeType = mimeType || 'image/jpeg';

    const ai = getGenAI();

    const systemPrompt = `Siz qurilish chiqindilarini baholash va logistika transportini rejalashtirish bo'yicha yuqori malakali professional muhandis va AI assistentisiz.
Sizga qurilish chiqindisining fotosurati taqdim etilmoqda.

Vazifalaringiz:
1. Rasmdagi chiqindi turini (trash_type) aniqlash: gʻisht, beton, shtukaturka, gipsokarton, yirik bo'lakli aralash, maishiy va h.k.
2. Chiqindining umumiy hajmini kub metrda (volume_m3) va og'irligini tonnada (estimated_weight_tons) baholash.
   - 1 m³ beton/g'isht chiqindisi odatda ~1.4 - 1.8 tonna bo'ladi.
   - 1 m³ engilroq gips/shtukaturka chiqindisi ~1.0 - 1.2 tonna bo'ladi.
3. Taxminiy 50 kg lik qoplar sonini (estimated_bags) hisoblash (hajm va og'irlikdan kelib chiqib).
4. Chiqindi holatini (state) aniqlash: faqat "Qoplangan" yoki "Sochiluvchan". Agar rasmda qoplar ko'rinib tursa "Qoplangan", yerda sochilib yotgan bo'lsa "Sochiluvchan".
5. Ushbu hajm va tonnaga mos transport turini (recommended_transport) aniq tanlash:
   - "Gazel Bortli": 2.5 - 3.5 m³ gacha yoki 1.5 - 2.0 tonnagacha
   - "ZIL Samosval": 4.0 - 6.0 m³ gacha yoki 5.0 tonnagacha
   - "Konteyner 8m³": 7.0 - 8.5 m³ yoki uzoq muddatli bunker kerak bo'lsa
6. Ushbu hajmni yuklash uchun zarur ishchilar (gruzchiklar) sonini (recommended_loaders) aniqlash: 1, 2, 3 yoki 4 nafar.
7. Ishonchlilik darajasi (confidence_score): "Yuqori" yoki "O'rtacha".
8. analysis_summary: O'zbek tilida londa, professional tushuntirish va logistika bo'yicha maslahat.`;

    const response = await generateContentWithRetry(ai, {
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: actualMimeType,
          },
        },
        'Qurilish chiqindisini tahlil qiling va hajmi, tonnasi, qoplar soni, holati, zarur mashina va ishchilar sonini aniqlab bering.',
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trash_type: {
              type: Type.STRING,
              description: 'Chiqindi turi (masalan: Gʻisht va beton siniqlari, devor suvoqi)',
            },
            volume_m3: {
              type: Type.NUMBER,
              description: 'Chiqindining umumiy hajmi m³ da (masalan: 2.5)',
            },
            estimated_weight_tons: {
              type: Type.NUMBER,
              description: 'Chiqindining taxminiy og‘irligi tonnada (masalan: 3.2)',
            },
            estimated_bags: {
              type: Type.INTEGER,
              description: 'Taxminiy 50 kg lik qoplar soni',
            },
            state: {
              type: Type.STRING,
              description: 'Chiqindi holati: faqat "Sochiluvchan" yoki "Qoplangan"',
            },
            recommended_transport: {
              type: Type.STRING,
              description: 'Mos transport: "Gazel Bortli", "ZIL Samosval" yoki "Konteyner 8m³"',
            },
            recommended_loaders: {
              type: Type.INTEGER,
              description: 'Zarur ishchilar soni (1, 2, 3 yoki 4)',
            },
            confidence_score: {
              type: Type.STRING,
              description: 'Ishonchlilik darajasi: "Yuqori" yoki "O\'rtacha"',
            },
            analysis_summary: {
              type: Type.STRING,
              description: 'O‘zbek tilida qisqa tahlil va tavsiya',
            },
          },
          required: [
            'trash_type',
            'volume_m3',
            'estimated_weight_tons',
            'estimated_bags',
            'state',
            'recommended_transport',
            'recommended_loaders',
            'confidence_score',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('AI javobi bo‘sh keldi');
    }

    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('AI Waste analysis error:', error);
    return res.status(500).json({
      error: formatErrorMessage(error),
    });
  }
});

// AI Warehouse Stock Receipt & Invoice Data Extractor
app.post('/api/extract-receipt-data', async (req, res) => {
  try {
    const { text: inputText, imageBase64, mimeType } = req.body;

    if (!inputText && !imageBase64) {
      return res.status(400).json({ error: 'Matn yoki rasm ma\'lumoti taqdim etilmadi' });
    }

    const ai = getGenAI();

    const systemPrompt = `Siz ombor va xaridlar (приход/приёмка) tizimi uchun ma'lumotlarni strukturaga soluvchi professional AI assistentisiz.
Sizga kelgan har qanday matn, chek, invoys yoki hujjat rasmidan ma'lumotlarni ajratib olib, ularni aniq va tartibli jadval shaklida qaytarishingiz kerak.

Quyidagi maydonlarni (fields) aniq ajratib oling:
1. raqam: Hujjat yoki buyurtma raqami (#5594, PX-102 kabi)
2. sana: Qabul qilingan sana (masalan, 2026-yil 17-sentabr)
3. yetkazib_beruvchi: Yetkazib beruvchi nomi va kodi (masalan, (№ 233) ELYOR (ABDULAZIZ))
4. summa: Valyutasi bilan birga (so'm yoki AQSh dollari, masalan, 455.91 AQSh dollari yoki 5 800 000 so'm)
5. holat: Hujjat holati (masalan, "Qabul qilindi", "Kutilmoqda", "To'langan")
6. masuliyatli: Mas'ul xodim va uning bo'limi (masalan, G'iyosiddin To'xtayev (OPERATSION BO'LIM))
7. yaratilgan: Hujjatni tizimga kiritgan foydalanuvchi (masalan, Muhammadjon Xudoyberganov (OPERATSION BO'LIM))

Agar matn yoki rasmda bir nechta hujjat yoki qator bo'lsa, har birini alohida ob'ekt qilib massivda qaytaring. Agar ma'lumot to'liq bo'lmasa, mavjud bo'lmagan maydonni mantiqiy taxmin qiling yoki "Noma'lum" deb belgilang.
Javobni FAQAT JSON massivi (array of objects) formatida qaytaring.`;

    const contents: any[] = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
      contents.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      });
    }

    const promptText = inputText
      ? `Ushbu ma'lumot/matndan prixod hujjatlarini ajratib oling:\n\n${inputText}`
      : 'Ushbu chek/hujjat fotosuratidan prixod ma\'lumotlarini ajratib oling.';

    contents.push(promptText);

    const response = await generateContentWithRetry(ai, {
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              raqam: {
                type: Type.STRING,
                description: 'Hujjat yoki buyurtma raqami (#5594)',
              },
              sana: {
                type: Type.STRING,
                description: 'Qabul qilingan sana (masalan: 2026-yil 17-sentabr)',
              },
              yetkazib_beruvchi: {
                type: Type.STRING,
                description: 'Yetkazib beruvchi nomi va kodi (masalan: (№ 233) ELYOR (ABDULAZIZ))',
              },
              summa: {
                type: Type.STRING,
                description: 'Summa valyutasi bilan (masalan: 455.91 AQSh dollari yoki 5 800 000 so\'m)',
              },
              holat: {
                type: Type.STRING,
                description: 'Hujjat holati (masalan: Qabul qilindi)',
              },
              masuliyatli: {
                type: Type.STRING,
                description: 'Mas\'ul xodim va uning bo\'limi',
              },
              yaratilgan: {
                type: Type.STRING,
                description: 'Hujjatni tizimga kiritgan foydalanuvchi',
              },
            },
            required: [
              'raqam',
              'sana',
              'yetkazib_beruvchi',
              'summa',
              'holat',
              'masuliyatli',
              'yaratilgan',
            ],
          },
        },
      },
    });

    const resText = response.text;
    if (!resText) {
      throw new Error('AI javobi bo‘sh qaytdi');
    }

    const parsed = JSON.parse(resText);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Receipt extraction error:', error);
    return res.status(500).json({
      error: formatErrorMessage(error),
    });
  }
});

// Vite & Static file serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
