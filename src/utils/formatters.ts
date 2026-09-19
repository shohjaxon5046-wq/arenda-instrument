/**
 * Format currency in Uzbek Soums
 */
export function formatMoney(amount: number): string {
  if (isNaN(amount)) return '0 so‘m';
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so‘m';
}

/**
 * Format date in friendly Uzbek format (e.g., "15-Sentabr, 2026")
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Get today's date in YYYY-MM-DD string
 */
export function getTodayDateString(): string {
  // Use today's system local date
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Shift a date by number of days (e.g. -1 for yesterday, +1 for tomorrow)
 */
export function shiftDate(dateString: string, daysOffset: number): string {
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + daysOffset);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    const d = new Date(dateString);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().slice(0, 10);
  } catch {
    return dateString;
  }
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
export function getYesterdayDateString(): string {
  return shiftDate(getTodayDateString(), -1);
}

/**
 * Format date with day of week in Uzbek (e.g. "Seshanba, 15-Sentabr 2026")
 */
export function formatDateWithWeekday(dateString: string): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('-');
    const d = parts.length === 3 
      ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
      : new Date(dateString);
      
    if (isNaN(d.getTime())) return dateString;

    const weekdays = [
      'Yakshanba',
      'Dushanba',
      'Seshanba',
      'Chorshanba',
      'Payshanba',
      'Juma',
      'Shanba'
    ];

    const months = [
      'Yanvar',
      'Fevral',
      'Mart',
      'Aprel',
      'May',
      'Iyun',
      'Iyul',
      'Avgust',
      'Sentabr',
      'Oktabr',
      'Noyabr',
      'Dekabr'
    ];

    const weekday = weekdays[d.getDay()];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${weekday}, ${day}-${month} ${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Calculate difference in days between two date strings (minimum 1 day)
 */
export function calculateRentalDays(startDate: string, returnDate: string): number {
  if (!startDate || !returnDate) return 1;
  const start = new Date(startDate);
  const end = new Date(returnDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

/**
 * Calculate days overdue if any
 */
export function getOverdueDays(expectedReturnDate: string): number {
  const todayStr = getTodayDateString();
  const today = new Date(todayStr).getTime();
  const expected = new Date(expectedReturnDate).getTime();
  if (today > expected) {
    const diff = Math.floor((today - expected) / (1000 * 60 * 60 * 24));
    return diff;
  }
  return 0;
}

/**
 * Check if order is due today
 */
export function isDueToday(expectedReturnDate: string): boolean {
  return expectedReturnDate === getTodayDateString();
}

/**
 * Play a gentle notification sound using Web Audio API
 */
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play two pleasant melodic tones
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.warn('Audio playback not permitted or supported:', e);
  }
}

/**
 * Generate telegram/sms message for client reminder
 */
export function generateReminderMessage(
  clientName: string,
  toolsList: string,
  returnDate: string,
  isOverdue: boolean,
  overdueDays: number
): string {
  if (isOverdue) {
    return `Assalomu alaykum, ${clientName}! Siz ijaraga olgan asboblar (${toolsList}) qaytarish muddati ${overdueDays} kun oldin o'tgan (${formatDate(returnDate)}). Iltimos, asbobni bugunoq qaytarishingizni yoki muddatini uzaytirishingizni so'raymiz. Aloqa: +998 90 123-45-67`;
  }
  return `Assalomu alaykum, ${clientName}! Siz ijaraga olgan asboblar (${toolsList}) qaytarish muddati BUGUN (${formatDate(returnDate)}) yetib keldi. Iltimos, o'z vaqtida topshirishingizni so'raymiz. Manzilimiz: Ishxona ustaxonasi. Aloqa: +998 90 123-45-67`;
}
