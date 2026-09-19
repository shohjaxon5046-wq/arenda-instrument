import { ToolCategory } from '../types';

export function calculateDepositPrice(tannarx: number, dailyPrice: number = 0): number {
  if (tannarx <= 0) {
    tannarx = dailyPrice * 36.5; // fallback approximation
  }
  
  if (tannarx <= 0) return 0;

  const rawDeposit = tannarx < 5000000 ? tannarx * 0.8 : tannarx * 0.6;
  return Math.round(rawDeposit / 100) * 100;
}

export function detectCategory(name: string): ToolCategory {
  const n = name.toLowerCase();
  if (n.includes('generator') || n.includes('benzin') || n.includes('dvijok') || n.includes('arra') || n.includes('trimmer')) return 'Benzinli & Generator';
  if (n.includes('svarka') || n.includes('payvand') || n.includes('metall') || n.includes('rezak')) return 'Payvandlash & Metall';
  if (n.includes('beton') || n.includes('meshalka') || n.includes('vibrator')) return 'Beton & Qurilish';
  if (n.includes('lesa') || n.includes('havoza') || n.includes('narvon') || n.includes('vyshka')) return 'Narvon & Havoza';
  if (n.includes('lazer') || n.includes('uroven') || n.includes('ruletka') || n.includes('metr') || n.includes('tormoz') || n.includes('kalit')) return 'O‘lchov & Lazer';
  if (n.includes('karcher') || n.includes('moyka') || n.includes('tozalash') || n.includes('gazon')) return 'Bog‘ & Tozalash';
  return 'Elektroinstrument';
}

export function detectBrand(name: string): string {
  const brands = ['Makita', 'Bosch', 'DeWalt', 'Hilti', 'Crown', 'Yato', 'Total', 'Ingco', 'Dongcheng', 'Ken', 'Bosh', 'Zubr', 'Karcher'];
  const n = name.toLowerCase();
  for (const b of brands) {
    if (n.includes(b.toLowerCase())) return b;
  }
  return '';
}

export function getToolImageUrl(toolName: string, originalUrl?: string): string {
  if (originalUrl && originalUrl.length > 5 && !originalUrl.includes('images.unsplash.com/photo-1581147036324-c17741825700')) {
    return originalUrl;
  }
  
  const name = toolName.toLowerCase();
  
  if (name.includes('bosch') || name.includes('perforator') || name.includes('перфоратор')) {
    return 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=600'; // Perforator
  }
  if (name.includes('drel') || name.includes('drill') || name.includes('shurup') || name.includes('гайковерт') || name.includes('дрель') || name.includes('шуруповерт')) {
    return 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&q=80&w=600'; // Drill/impact
  }
  if (name.includes('arra') || name.includes('saw') || name.includes('пила')) {
    return 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=600'; // Circular saw (using a placeholder, ideally a saw image but we'll use a tool one)
  }
  if (name.includes('bolgarka') || name.includes('grinder') || name.includes('rezak') || name.includes('lobzik')) {
    return 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&q=80&w=600'; // Grinder
  }
  if (name.includes('changyutgich') || name.includes('пылесос') || name.includes('vacuum')) {
    return 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&q=80&w=600'; // Vacuum cleaner
  }
  if (name.includes('svarka') || name.includes('payvand') || name.includes('welding') || name.includes('сварка')) {
    return 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=600';
  }
  if (name.includes('generator') || name.includes('dvijok') || name.includes('генератор')) {
    return 'https://images.unsplash.com/photo-1533626904905-cc52fd99285e?auto=format&fit=crop&q=80&w=600';
  }
  if (name.includes('beton') || name.includes('meshalka') || name.includes('qoruvchi') || name.includes('бетон')) {
    return 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?auto=format&fit=crop&q=80&w=600';
  }
  if (name.includes('tormoz') || name.includes('kalit') || name.includes('klyuch') || name.includes('nabor') || name.includes('ключ')) {
    return 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&q=80&w=600';
  }
  if (name.includes('lesa') || name.includes('narvon') || name.includes('havoza') || name.includes('леса')) {
    return 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&q=80&w=600';
  }
  if (name.includes('kompressor') || name.includes('nasos') || name.includes('pomp') || name.includes('компрессор')) {
    return 'https://images.unsplash.com/photo-1590424744257-f4089eeec717?auto=format&fit=crop&q=80&w=600';
  }
  if (name.includes('otboynik') || name.includes('bolg`a') || name.includes('molotok') || name.includes('отбойник')) {
    return 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&q=80&w=600';
  }
  
  // Generic high-quality tool fallback
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(toolName)}&background=0D8ABC&color=fff&size=512&rounded=true&font-size=0.33`;
}
