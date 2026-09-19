import * as XLSX from 'xlsx';
import { Tool, RentalOrder, Seller } from '../types';
import { format } from 'date-fns';

export const exportToolsToExcel = (tools: Tool[]) => {
  const data = tools.map((tool) => ({
    'Artikul': tool.article,
    'Shtrix Kod': tool.code,
    'Nomi': tool.name,
    'Kategoriya': tool.category,
    'Umumiy soni': tool.totalStock,
    'Mavjud (Ostatka)': tool.availableStock,
    'Ijarada': tool.rentedStock,
    'Ta`mirlashda': tool.repairStock || 0,
    'Ijara narxi (kunlik)': tool.dailyPrice,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Asboblar (Ostatka)');
  
  const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');
  XLSX.writeFile(workbook, `Asboblar_Ostatka_${dateStr}.xlsx`);
};

export const exportOrdersToExcel = (orders: RentalOrder[], sellers: Seller[]) => {
  const data = orders.map((order) => {
    const sellerName = order.sellerId 
      ? (sellers.find(s => s.id === order.sellerId)?.fullName || 'Noma`lum')
      : 'Noma`lum';
      
    const toolsStr = order.items.map(i => `${i.toolName} (${i.quantity} ta)`).join(', ');

    return {
      'Zakaz Nomeri': order.orderNumber,
      'Mijoz': order.client.fullName,
      'Telefon': order.client.phone,
      'Pasport/ID': order.client.passport,
      'Sotuvchi': sellerName,
      'Asboblar': toolsStr,
      'Berilgan sana': order.startDate,
      'Qaytarish sanasi': order.expectedReturnDate,
      'Holati': order.status === 'active' ? 'Faol' : order.status === 'returned' ? 'Topshirilgan' : 'Muddati o`tgan',
      'Kunlik Jami': order.totalRentAmount,
      'To`langan summa': order.paidAmount,
      'Qarz (Qoldiq)': order.remainingAmount,
      'Chegirma': order.discountAmount || 0,
      'Garov turi': order.depositType,
      'To`lov usuli': order.paymentMethod,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Zakazlar');
  
  const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');
  XLSX.writeFile(workbook, `Zakazlar_${dateStr}.xlsx`);
};
