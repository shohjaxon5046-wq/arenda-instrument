import jsPDF from 'jspdf';
import { RentalOrder, StockReceipt } from '../types';
import { formatMoney, formatDate } from './formatters';

// Clean text for standard Helvetica font in jsPDF
const cleanPdfText = (str: string = ''): string => {
  return str
    .replace(/[‘’`]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();
};

export const generateOrderPDF = (order: RentalOrder) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTRUMENT ARENDA', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text("Asbob-uskunalar ijarasi va xizmat ko'rsatish tizimi", 14, 23);
  doc.text('Tel: +998 90 123-45-67 | Manzil: Asosiy ustaxona', 14, 27);

  // Right Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`ZAKAZ ${order.orderNumber}`, 196, 18, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sana: ${formatDate(order.startDate)}`, 196, 23, { align: 'right' });

  // Divider line
  doc.setLineWidth(0.5);
  doc.line(14, 31, 196, 31);

  // Document Title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('IJARAGA BERISH DALOLATNOMASI VA CHEKI', 105, 38, { align: 'center' });

  // Client Box
  doc.setFillColor(248, 248, 248);
  doc.rect(14, 43, 182, 24, 'F');
  doc.rect(14, 43, 182, 24, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Mijoz (Ijarachi): ${order.client.fullName}`, 18, 49);
  doc.setFont('helvetica', 'normal');
  doc.text(`Telefon: ${order.client.phone}`, 18, 55);
  if (order.client.address) {
    doc.text(`Manzil: ${order.client.address}`, 18, 61);
  }

  doc.setFont('helvetica', 'bold');
  doc.text(`Pasport / ID: ${order.client.passport || 'Kiritilmagan'}`, 110, 49);
  doc.setFont('helvetica', 'normal');
  doc.text(`Garov: ${order.depositNote}`, 110, 55);
  
  const paymentMethodLabel = 
    order.paymentMethod === 'card' 
      ? 'Karta (Click/Payme)' 
      : order.paymentMethod === 'transfer' 
      ? 'Perevod / Hisob raqam' 
      : 'Naqd pul';

  doc.text(`To'lov usuli: ${paymentMethodLabel}`, 110, 61);

  // Table header
  let y = 74;
  doc.setFillColor(230, 230, 230);
  doc.rect(14, y, 182, 8, 'F');
  doc.rect(14, y, 182, 8, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('№', 18, y + 5.5);
  doc.text('Asbob nomi', 28, y + 5.5);
  doc.text('Artikul / Kod', 92, y + 5.5);
  doc.text('Soni', 128, y + 5.5);
  doc.text('Kunlik', 145, y + 5.5);
  doc.text('Muddat', 165, y + 5.5);
  doc.text('Summa', 192, y + 5.5, { align: 'right' });

  y += 8;

  // Table rows
  order.items.forEach((item, index) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.rect(14, y, 182, 8, 'S');
    doc.text(String(index + 1), 18, y + 5.5);
    doc.text(item.toolName.substring(0, 32), 28, y + 5.5);
    doc.text(`${item.article}`, 92, y + 5.5);
    doc.text(`${item.quantity} ta`, 128, y + 5.5);
    doc.text(`${formatMoney(item.dailyPrice)}`, 145, y + 5.5);
    doc.text(`${order.totalDays} kun`, 165, y + 5.5);
    const itemTotal = item.dailyPrice * item.quantity * order.totalDays;
    doc.text(`${formatMoney(itemTotal)}`, 192, y + 5.5, { align: 'right' });
    y += 8;
  });

  // Financial summary
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Olingan sana: ${formatDate(order.startDate)}`, 18, y + 4);
  doc.text(`Qaytarish muddati: ${formatDate(order.expectedReturnDate)}`, 18, y + 9);
  if (order.notes) {
    doc.text(`Izoh: ${order.notes.substring(0, 50)}`, 18, y + 14);
  }

  // Totals box on the right
  doc.setFillColor(248, 248, 248);
  doc.rect(116, y, 80, 32, 'F');
  doc.rect(116, y, 80, 32, 'S');

  doc.text('Asl ijara summasi:', 120, y + 6);
  doc.text(`${formatMoney(order.subtotalAmount || order.totalRentAmount)}`, 192, y + 6, { align: 'right' });

  if (order.discountAmount && order.discountAmount > 0) {
    doc.text(`Chegirma (${order.discountPercent || 0}%):`, 120, y + 12);
    doc.text(`-${formatMoney(order.discountAmount)}`, 192, y + 12, { align: 'right' });
  }

  doc.setFont('helvetica', 'bold');
  doc.text("Oldindan to'landi:", 120, y + 19);
  doc.text(`${formatMoney(order.paidAmount)}`, 192, y + 19, { align: 'right' });

  doc.text("Qoldiq to'lov:", 120, y + 26);
  doc.text(`${formatMoney(order.remainingAmount)}`, 192, y + 26, { align: 'right' });

  // Terms & Conditions
  y += 38;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SHARTNOMA SHARTLARI:', 14, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text("1. Ijarachi asbobni soz, toza va to'liq komplektda belgilangan muddatda qaytarish majburiyatini oladi.", 14, y);
  y += 4;
  doc.text("2. Asbob buzilgan, shikastlangan yoki yo'qotilgan taqdirda yetkazilgan moddiy zarar mijoz tomonidan to'lanadi.", 14, y);
  y += 4;
  doc.text("3. Qaytarish muddati o'tgan har bir kun uchun shartnomadagi kunlik ijara narxi qo'shib hisoblanadi.", 14, y);

  // Signatures
  y += 18;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Ijaraga beruvchi (Mas‘ul shaxs):', 14, y);
  doc.text('Ijarachi (Mijoz):', 120, y);

  y += 14;
  doc.line(14, y, 80, y);
  doc.line(120, y, 186, y);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Imzo & M.O‘.', 14, y + 4);
  doc.text(`${order.client.fullName} (Imzo)`, 120, y + 4);

  // Download PDF
  const cleanNum = order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '');
  doc.save(`Shartnoma_${cleanNum}.pdf`);
};

export interface StockReceiptReportFilterMeta {
  date?: string;
  search?: string;
}

/**
 * Generates a formal, comprehensive WMS Stock Receipt report PDF
 * covering all filtered receipts in the WMS view.
 */
export const generateStockReceiptsReportPDF = (
  receipts: StockReceipt[],
  filterMeta?: StockReceiptReportFilterMeta
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2); // 182mm
  const rightMargin = margin + contentWidth; // 196mm
  const now = new Date();
  const generatedTimestamp = `${now.toLocaleDateString('uz-UZ')} ${now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`;

  // Aggregated totals
  const totalReceiptsCount = receipts.length;
  const totalUnitsReceived = receipts.reduce(
    (acc, r) => acc + r.items.reduce((s, it) => s + (it.quantity || 0), 0),
    0
  );
  const totalPurchasesCost = receipts.reduce((acc, r) => acc + (r.totalCost || 0), 0);

  const drawHeader = (pageNum: number) => {
    // Top brand bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, 12, contentWidth, 2, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('INSTRUMENT ARENDA - OMBOR BOSHQARUVI (WMS)', margin, 20);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text("Asbob-uskunalar ijarasi, servis va kirim-chiqim nazorat tizimi", margin, 25);

    // Right info
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('WMS KIRIM HISOBOTI', rightMargin, 20, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Chop etildi: ${generatedTimestamp}`, rightMargin, 25, { align: 'right' });

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, 28, rightMargin, 28);
  };

  const drawTableHeader = (currentY: number): number => {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, currentY, contentWidth, 8, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);

    doc.text('№', margin + 3, currentY + 5.5);
    doc.text('Hujjat & Sana', margin + 12, currentY + 5.5);
    doc.text("Ta'minotchi", margin + 42, currentY + 5.5);
    doc.text('Tovar nomi (Artikul)', margin + 82, currentY + 5.5);
    doc.text('Soni', margin + 130, currentY + 5.5, { align: 'center' });
    doc.text('Tannarx', margin + 155, currentY + 5.5, { align: 'right' });
    doc.text('Jami summa', rightMargin - 3, currentY + 5.5, { align: 'right' });

    return currentY + 8;
  };

  // Draw Page 1 Header
  drawHeader(1);

  // Filter & Summary Meta Box on First Page
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, 32, contentWidth, 24, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, 32, contentWidth, 24, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('HISOBOT METADATA VA QIDIRUV MEZONLARI', margin + 4, 38);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const dateFilterText = filterMeta?.date ? formatDate(filterMeta.date) : "Barcha sanalar";
  const searchFilterText = filterMeta?.search ? `"${cleanPdfText(filterMeta.search)}"` : "Barcha yozuvlar";

  doc.text(`Sana filtri: ${dateFilterText}`, margin + 4, 44);
  doc.text(`Qidiruv so'zi: ${searchFilterText}`, margin + 4, 50);

  // Summary indicators on right side of meta box
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Jami operatsiyalar: ${totalReceiptsCount} ta`, margin + 90, 44);
  doc.text(`Kirim qilingan tovarlar: ${totalUnitsReceived} dona`, margin + 90, 50);

  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text(`Jami xarid qiymati: ${formatMoney(totalPurchasesCost)}`, rightMargin - 4, 47, { align: 'right' });

  let y = 62;
  y = drawTableHeader(y);

  // Flatten receipt items for clear line-by-line inventory auditing
  let rowCount = 0;

  if (receipts.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text("Keltirilgan qidiruv yoki sana bo'yicha kirim ma'lumotlari mavjud emas.", pageWidth / 2, y + 12, { align: 'center' });
    y += 24;
  } else {
    receipts.forEach((receipt) => {
      receipt.items.forEach((item, itemIdx) => {
        // Check for page overflow
        if (y > 268) {
          doc.addPage();
          drawHeader(doc.getNumberOfPages());
          y = 34;
          y = drawTableHeader(y);
        }

        rowCount += 1;
        const isEven = rowCount % 2 === 0;

        if (isEven) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y, contentWidth, 8.5, 'F');
        }
        doc.setDrawColor(241, 245, 249);
        doc.rect(margin, y, contentWidth, 8.5, 'S');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);

        // 1. Row index
        doc.text(String(rowCount), margin + 3, y + 5.5);

        // 2. Receipt number & date (show receipt number on first item or compactly)
        const receiptLabel = itemIdx === 0 
          ? `${cleanPdfText(receipt.receiptNumber)} (${formatDate(receipt.date)})` 
          : `↳ ${cleanPdfText(receipt.receiptNumber)}`;
        doc.setFont('helvetica', itemIdx === 0 ? 'bold' : 'normal');
        doc.text(receiptLabel.substring(0, 20), margin + 12, y + 5.5);

        // 3. Supplier Name
        doc.setFont('helvetica', 'normal');
        doc.text(cleanPdfText(receipt.supplierName).substring(0, 18), margin + 42, y + 5.5);

        // 4. Tool Name & Article
        const toolLabel = `${cleanPdfText(item.toolName)} [${cleanPdfText(item.article)}]`;
        doc.setFont('helvetica', 'bold');
        doc.text(toolLabel.substring(0, 26), margin + 82, y + 5.5);

        // 5. Quantity
        doc.setFont('helvetica', 'normal');
        doc.text(`${item.quantity} ta`, margin + 130, y + 5.5, { align: 'center' });

        // 6. Unit Cost
        doc.text(formatMoney(item.costPrice), margin + 155, y + 5.5, { align: 'right' });

        // 7. Line Total
        const lineTotal = (item.costPrice || 0) * (item.quantity || 1);
        doc.setFont('helvetica', 'bold');
        doc.text(formatMoney(lineTotal), rightMargin - 3, y + 5.5, { align: 'right' });

        y += 8.5;
      });
    });
  }

  // Summary Totals Box
  if (y > 240) {
    doc.addPage();
    drawHeader(doc.getNumberOfPages());
    y = 34;
  }

  y += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 70, y, contentWidth - 70, 22, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin + 70, y, contentWidth - 70, 22, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Kirim operatsiyalari soni:', margin + 74, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalReceiptsCount} ta hujjat`, rightMargin - 4, y + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Jami qabul qilingan tovarlar:', margin + 74, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalUnitsReceived} dona`, rightMargin - 4, y + 12, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('JAMI XARID / KIRIM SUMMASI:', margin + 74, y + 18);
  doc.setTextColor(16, 185, 129);
  doc.text(formatMoney(totalPurchasesCost), rightMargin - 4, y + 18, { align: 'right' });

  // Formal Signatures Block
  y += 30;
  if (y > 265) {
    doc.addPage();
    drawHeader(doc.getNumberOfPages());
    y = 36;
  }

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text("Hisobotni tayyorladi (Ombor mudiri):", margin, y);
  doc.text("Tasdiqladi (Bosh hisobchi / Rahbar):", margin + 96, y);

  y += 12;
  doc.setDrawColor(148, 163, 184);
  doc.line(margin, y, margin + 70, y);
  doc.line(margin + 96, y, rightMargin - 10, y);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text("Imzo va sana", margin, y + 4);
  doc.text("Imzo va M.O‘.", margin + 96, y + 4);

  // Page numbering on all pages
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `"INSTRUMENT ARENDA" WMS Tizimi | Sahifa ${p} / ${pageCount}`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  const dateSuffix = filterMeta?.date ? filterMeta.date : new Date().toISOString().split('T')[0];
  doc.save(`WMS_Kirim_Hisoboti_${dateSuffix}.pdf`);
};

/**
 * Generates an official single Stock Inward Waybill (Prixod Nakladnoy) PDF
 */
export const generateSingleStockReceiptPDF = (receipt: StockReceipt) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const margin = 14;
  const contentWidth = 182;
  const rightMargin = 196;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, 12, contentWidth, 2, 'F');

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTRUMENT ARENDA', margin, 20);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text("Ombor boshqaruvi va tovar kirimi (WMS)", margin, 25);

  // Document Number & Date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`KIRIM NAKLADNOY ${cleanPdfText(receipt.receiptNumber)}`, rightMargin, 20, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Sana: ${formatDate(receipt.date)}`, rightMargin, 25, { align: 'right' });

  // Divider
  doc.setLineWidth(0.4);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 29, rightMargin, 29);

  // Supplier & Warehouse Box
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, 33, contentWidth, 22, 'F');
  doc.rect(margin, 33, contentWidth, 22, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Ta'minotchi (Yetkazib beruvchi): ${cleanPdfText(receipt.supplierName)}`, margin + 4, 40);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Qabul qiluvchi: Asosiy Ustaxona / Markaziy Ombor`, margin + 4, 46);

  if (receipt.notes) {
    doc.text(`Izoh / Hujjat: ${cleanPdfText(receipt.notes)}`, margin + 4, 51);
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`Jami qabul qiymati: ${formatMoney(receipt.totalCost)}`, rightMargin - 4, 45, { align: 'right' });

  // Table
  let y = 60;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.rect(margin, y, contentWidth, 8, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('№', margin + 3, y + 5.5);
  doc.text('Tovar / Uskuna Nomi', margin + 14, y + 5.5);
  doc.text('Artikul / Shtrix-kod', margin + 80, y + 5.5);
  doc.text('Soni', margin + 125, y + 5.5, { align: 'center' });
  doc.text('Xarid narxi', margin + 155, y + 5.5, { align: 'right' });
  doc.text('Jami summa', rightMargin - 3, y + 5.5, { align: 'right' });

  y += 8;

  receipt.items.forEach((item, index) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.rect(margin, y, contentWidth, 8, 'S');

    doc.text(String(index + 1), margin + 3, y + 5.5);
    doc.text(cleanPdfText(item.toolName).substring(0, 35), margin + 14, y + 5.5);
    doc.text(cleanPdfText(item.article), margin + 80, y + 5.5);
    doc.text(`${item.quantity} ta`, margin + 125, y + 5.5, { align: 'center' });
    doc.text(formatMoney(item.costPrice), margin + 155, y + 5.5, { align: 'right' });
    
    const lineTotal = (item.costPrice || 0) * (item.quantity || 1);
    doc.setFont('helvetica', 'bold');
    doc.text(formatMoney(lineTotal), rightMargin - 3, y + 5.5, { align: 'right' });
    y += 8;
  });

  // Summary box
  y += 6;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin + 100, y, contentWidth - 100, 18, 'F');
  doc.rect(margin + 100, y, contentWidth - 100, 18, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Jami tovarlar soni:', margin + 104, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const totalItemsCount = receipt.items.reduce((sum, it) => sum + it.quantity, 0);
  doc.text(`${totalItemsCount} dona`, rightMargin - 4, y + 6, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('JAMI XARID SUMMASI:', margin + 104, y + 13);
  doc.setTextColor(16, 185, 129);
  doc.text(formatMoney(receipt.totalCost), rightMargin - 4, y + 13, { align: 'right' });

  // Signatures
  y += 32;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("Topshirdi (Ta'minotchi vakili):", margin, y);
  doc.text("Qabul qildi (Moddiy javobgar shaxs):", margin + 96, y);

  y += 14;
  doc.line(margin, y, margin + 70, y);
  doc.line(margin + 96, y, rightMargin - 10, y);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text("Imzo & F.I.SH", margin, y + 4);
  doc.text("Imzo & M.O‘.", margin + 96, y + 4);

  const cleanReceiptNum = receipt.receiptNumber.replace(/[^a-zA-Z0-9_-]/g, '');
  doc.save(`Prixod_Nakladnoy_${cleanReceiptNum}.pdf`);
};
