import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tool, RentalOrder, StockReceipt, Client, OrderStatus, PaymentMethod, RepairRecord, Seller } from '../types';
import { INITIAL_TOOLS, INITIAL_ORDERS, INITIAL_RECEIPTS, INITIAL_CLIENTS, INITIAL_SELLERS } from '../data/initialData';
import { getTodayDateString, getOverdueDays, isDueToday, playNotificationSound } from '../utils/formatters';

interface RentalContextType {
  tools: Tool[];
  orders: RentalOrder[];
  receipts: StockReceipt[];
  clients: Client[];
  repairs: RepairRecord[];
  sellers: Seller[];
  
  // Actions
  addTool: (tool: Omit<Tool, 'id' | 'createdAt' | 'rentedStock'>) => Tool;
  updateTool: (tool: Tool) => void;
  deleteTool: (id: string) => void;
  
  addStockReceipt: (receipt: Omit<StockReceipt, 'id' | 'createdAt'>) => void;
  deleteStockReceipt: (id: string) => void;
  clearAllStockReceipts: () => void;
  
  createOrder: (orderData: {
    sellerId: string;
    client: {
      fullName: string;
      phone: string;
      passport: string;
      address?: string;
    };
    items: {
      toolId: string;
      quantity: number;
    }[];
    startDate: string;
    expectedReturnDate: string;
    paidAmount: number;
    paymentMethod?: PaymentMethod;
    depositType: 'passport' | 'cash' | 'driver_license' | 'other';
    depositNote: string;
    discountPercent?: number;
    discountAmount?: number;
    discountReason?: string;
    notes?: string;
  }) => RentalOrder | null;

  returnOrder: (orderId: string, penaltyAmount?: number, returnNotes?: string, finalPaymentMethod?: PaymentMethod) => void;
  extendOrder: (orderId: string, newReturnDate: string, additionalAmount?: number, paymentMethod?: PaymentMethod) => void;
  deleteOrder: (orderId: string) => void;

  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  
  // Sellers Management
  addSeller: (seller: Omit<Seller, 'id' | 'createdAt'>) => void;
  updateSeller: (seller: Seller) => void;
  deleteSeller: (id: string) => void;
  resetSellersToDefaults: () => void;

  // Repairs Management
  sendToRepair: (data: {
    toolId: string;
    quantity: number;
    defectDescription: string;
    masterName?: string;
    estimatedCost?: number;
    clientId?: string;
    clientName?: string;
    orderId?: string;
    orderNumber?: string;
    claimAmount?: number;
    claimSettled?: boolean;
    claimType?: 'damage' | 'loss' | 'maintenance';
  }) => void;
  completeRepair: (repairId: string, actualCost: number, notes?: string) => void;
  deleteRepair: (repairId: string) => void;
  toggleRepairClaimSettled: (repairId: string) => void;
  settleOrderDebt: (orderId: string, amount: number, paymentMethod?: PaymentMethod, note?: string) => void;

  // Audio & Alert State
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  triggerSound: () => void;

  // Stats & Computed
  dueTodayOrders: RentalOrder[];
  overdueOrders: RentalOrder[];
  activeOrders: RentalOrder[];
  resetToDefaults: () => void;
  clearAllData: () => void;
}

const RentalContext = createContext<RentalContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TOOLS: 'arenda_tools_v2',
  ORDERS: 'arenda_orders_v2',
  RECEIPTS: 'arenda_receipts_v2',
  CLIENTS: 'arenda_clients_v2',
  REPAIRS: 'arenda_repairs_v2',
  SELLERS: 'arenda_sellers_v2',
  SOUND: 'arenda_sound_v1'
};

// Ensure migration to clean 0 state if coming from v1 mock data
try {
  const MIGRATION_KEY = 'arenda_clean_zero_done_v2';
  if (!localStorage.getItem(MIGRATION_KEY)) {
    localStorage.removeItem('arenda_tools_v1');
    localStorage.removeItem('arenda_orders_v1');
    localStorage.removeItem('arenda_receipts_v1');
    localStorage.removeItem('arenda_clients_v1');
    localStorage.setItem(MIGRATION_KEY, 'true');
  }
} catch {
  // localStorage may be unavailable in some iframe modes
}

export const RentalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tools, setTools] = useState<Tool[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TOOLS);
      return saved ? JSON.parse(saved) : INITIAL_TOOLS;
    } catch {
      return INITIAL_TOOLS;
    }
  });

  const [orders, setOrders] = useState<RentalOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const list: RentalOrder[] = saved ? JSON.parse(saved) : INITIAL_ORDERS;
      // Re-evaluate statuses on load
      const today = getTodayDateString();
      return list.map(order => {
        if (order.status !== 'returned') {
          if (order.expectedReturnDate < today) {
            return { ...order, status: 'overdue' as OrderStatus };
          } else {
            return { ...order, status: 'active' as OrderStatus };
          }
        }
        return order;
      });
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [receipts, setReceipts] = useState<StockReceipt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
      return saved ? JSON.parse(saved) : INITIAL_RECEIPTS;
    } catch {
      return INITIAL_RECEIPTS;
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  });

  const [repairs, setRepairs] = useState<RepairRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REPAIRS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [sellers, setSellers] = useState<Seller[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SELLERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_SELLERS;
    } catch {
      return INITIAL_SELLERS;
    }
  });

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
    return saved !== null ? saved === 'true' : true;
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(tools));
  }, [tools]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify(repairs));
  }, [repairs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELLERS, JSON.stringify(sellers));
  }, [sellers]);

  const setSoundEnabled = (val: boolean) => {
    setSoundEnabledState(val);
    localStorage.setItem(STORAGE_KEYS.SOUND, String(val));
  };

  const triggerSound = () => {
    if (soundEnabled) {
      playNotificationSound();
    }
  };

  // Recheck overdue orders periodically (every 60s)
  useEffect(() => {
    const interval = setInterval(() => {
      const today = getTodayDateString();
      setOrders(prev =>
        prev.map(ord => {
          if (ord.status !== 'returned') {
            if (ord.expectedReturnDate < today && ord.status !== 'overdue') {
              return { ...ord, status: 'overdue' };
            }
            if (ord.expectedReturnDate >= today && ord.status === 'overdue') {
              return { ...ord, status: 'active' };
            }
          }
          return ord;
        })
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Computed orders
  const dueTodayOrders = orders.filter(
    o => o.status !== 'returned' && isDueToday(o.expectedReturnDate)
  );

  const overdueOrders = orders.filter(
    o => o.status === 'overdue' || (o.status !== 'returned' && getOverdueDays(o.expectedReturnDate) > 0)
  );

  const activeOrders = orders.filter(o => o.status === 'active' || o.status === 'overdue');

  // Trigger sound when there are urgent alerts on first render
  useEffect(() => {
    if (soundEnabled && (dueTodayOrders.length > 0 || overdueOrders.length > 0)) {
      // Gentle delayed chime
      const timer = setTimeout(() => {
        triggerSound();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const addTool = (newToolData: Omit<Tool, 'id' | 'createdAt' | 'rentedStock'>) => {
    const newTool: Tool = {
      ...newToolData,
      id: 'tool-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      rentedStock: 0,
      availableStock: newToolData.totalStock,
      createdAt: new Date().toISOString()
    };
    setTools(prev => [newTool, ...prev]);
    return newTool;
  };

  const updateTool = (updatedTool: Tool) => {
    setTools(prev => prev.map(t => (t.id === updatedTool.id ? updatedTool : t)));
  };

  const deleteTool = (id: string) => {
    setTools(prev => prev.filter(t => t.id !== id));
  };

  // Add Prixod (Stock receipt)
  const addStockReceipt = (receiptData: Omit<StockReceipt, 'id' | 'createdAt'>) => {
    const newReceipt: StockReceipt = {
      ...receiptData,
      id: 'px-' + Date.now(),
      createdAt: new Date().toISOString()
    };

    // Update tools stock based on received items
    setTools(prevTools => {
      return prevTools.map(tool => {
        const item = receiptData.items.find(i => i.toolId === tool.id);
        if (item) {
          const added = Number(item.quantity) || 0;
          return {
            ...tool,
            totalStock: tool.totalStock + added,
            availableStock: tool.availableStock + added,
            dailyPrice: item.dailyRentalPrice > 0 ? item.dailyRentalPrice : tool.dailyPrice
          };
        }
        return tool;
      });
    });

    setReceipts(prev => [newReceipt, ...prev]);
  };

  const deleteStockReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const clearAllStockReceipts = () => {
    setReceipts([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.RECEIPTS);
    } catch {}
  };

  // Create new rental order
  const createOrder = (orderData: {
    sellerId: string;
    client: {
      fullName: string;
      phone: string;
      passport: string;
      address?: string;
    };
    items: {
      toolId: string;
      quantity: number;
    }[];
    startDate: string;
    expectedReturnDate: string;
    paidAmount: number;
    paymentMethod?: PaymentMethod;
    depositType: 'passport' | 'cash' | 'driver_license' | 'other';
    depositNote: string;
    discountPercent?: number;
    discountAmount?: number;
    discountReason?: string;
    notes?: string;
  }): RentalOrder | null => {
    const start = new Date(orderData.startDate);
    const end = new Date(orderData.expectedReturnDate);
    const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    // Assemble items details
    const orderItems: RentalOrder['items'] = [];
    let subtotalAmount = 0;

    for (const item of orderData.items) {
      const tool = tools.find(t => t.id === item.toolId);
      if (!tool) continue;

      const subtotal = tool.dailyPrice * item.quantity * diffDays;
      subtotalAmount += subtotal;

      orderItems.push({
        toolId: tool.id,
        toolName: tool.name,
        article: tool.article,
        code: tool.code,
        quantity: item.quantity,
        dailyPrice: tool.dailyPrice,
        imageUrl: tool.imageUrl
      });
    }

    if (orderItems.length === 0) return null;

    // Calculate discount
    let finalDiscountAmount = 0;
    if (orderData.discountAmount !== undefined && orderData.discountAmount > 0) {
      finalDiscountAmount = Math.min(subtotalAmount, Math.round(orderData.discountAmount));
    } else if (orderData.discountPercent !== undefined && orderData.discountPercent > 0) {
      finalDiscountAmount = Math.min(subtotalAmount, Math.round(subtotalAmount * (orderData.discountPercent / 100)));
    }

    const totalRentAmount = Math.max(0, subtotalAmount - finalDiscountAmount);
    const remainingAmount = Math.max(0, totalRentAmount - orderData.paidAmount);
    const orderNumber = `#ZR-${100 + orders.length + 1}`;
    const today = getTodayDateString();
    const isOver = orderData.expectedReturnDate < today;

    const calcDiscountPercent = subtotalAmount > 0 && finalDiscountAmount > 0
      ? Math.round((finalDiscountAmount / subtotalAmount) * 100)
      : (orderData.discountPercent || 0);

    const newOrder: RentalOrder = {
      id: 'ord-' + Date.now(),
      orderNumber,
      sellerId: orderData.sellerId,
      client: orderData.client,
      items: orderItems,
      startDate: orderData.startDate,
      expectedReturnDate: orderData.expectedReturnDate,
      totalDays: diffDays,
      subtotalAmount,
      discountPercent: calcDiscountPercent,
      discountAmount: finalDiscountAmount,
      discountReason: orderData.discountReason || (finalDiscountAmount > 0 ? "Ko'p kunga chegirma" : undefined),
      totalRentAmount,
      paidAmount: orderData.paidAmount,
      remainingAmount,
      paymentMethod: orderData.paymentMethod || 'cash',
      depositType: orderData.depositType,
      depositNote: orderData.depositNote,
      status: isOver ? 'overdue' : 'active',
      notes: orderData.notes,
      createdAt: new Date().toISOString()
    };

    // Update tools stock (decrease available, increase rented)
    setTools(prevTools =>
      prevTools.map(tool => {
        const matchingItem = orderData.items.find(i => i.toolId === tool.id);
        if (matchingItem) {
          const qty = Number(matchingItem.quantity) || 0;
          return {
            ...tool,
            availableStock: Math.max(0, tool.availableStock - qty),
            rentedStock: tool.rentedStock + qty
          };
        }
        return tool;
      })
    );

    // Save client if not already existing
    setClients(prevClients => {
      const existing = prevClients.find(
        c => c.phone.replace(/\s+/g, '') === orderData.client.phone.replace(/\s+/g, '') ||
             (orderData.client.passport && c.passport === orderData.client.passport)
      );
      if (!existing) {
        const newClient: Client = {
          id: 'cli-' + Date.now(),
          fullName: orderData.client.fullName,
          phone: orderData.client.phone,
          passport: orderData.client.passport,
          address: orderData.client.address || '',
          notes: 'Buyurtma ' + orderNumber + ' orqali qo‘shildi',
          createdAt: new Date().toISOString()
        };
        return [newClient, ...prevClients];
      }
      return prevClients;
    });

    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  // Return an order
  const returnOrder = (
    orderId: string, 
    penaltyAmount: number = 0, 
    returnNotes?: string, 
    finalPaymentMethod: PaymentMethod = 'cash'
  ) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Restore stock
    setTools(prevTools =>
      prevTools.map(tool => {
        const orderItem = order.items.find(i => i.toolId === tool.id);
        if (orderItem) {
          const qty = orderItem.quantity;
          return {
            ...tool,
            availableStock: Math.min(tool.totalStock, tool.availableStock + qty),
            rentedStock: Math.max(0, tool.rentedStock - qty)
          };
        }
        return tool;
      })
    );

    // Update order
    setOrders(prevOrders =>
      prevOrders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'returned',
            actualReturnDate: getTodayDateString(),
            penaltyAmount: penaltyAmount > 0 ? penaltyAmount : undefined,
            remainingAmount: 0,
            finalPaymentMethod,
            notes: returnNotes ? (o.notes ? `${o.notes} | ${returnNotes}` : returnNotes) : o.notes
          };
        }
        return o;
      })
    );
  };

  // Extend rental period
  const extendOrder = (
    orderId: string, 
    newReturnDate: string, 
    additionalAmount: number = 0,
    paymentMethod: PaymentMethod = 'cash'
  ) => {
    setOrders(prevOrders =>
      prevOrders.map(o => {
        if (o.id === orderId) {
          const start = new Date(o.startDate);
          const end = new Date(newReturnDate);
          const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
          const today = getTodayDateString();
          const newStatus: OrderStatus = newReturnDate < today ? 'overdue' : 'active';

          return {
            ...o,
            expectedReturnDate: newReturnDate,
            totalDays,
            totalRentAmount: o.totalRentAmount + additionalAmount,
            paidAmount: o.paidAmount + additionalAmount,
            status: newStatus,
            notes: o.notes 
              ? `${o.notes} (Muddat ${newReturnDate} gacha uzaytirildi, +${additionalAmount} so'm to'landi [${paymentMethod}])` 
              : `Muddat ${newReturnDate} gacha uzaytirildi, +${additionalAmount} so'm to'landi [${paymentMethod}]`
          };
        }
        return o;
      })
    );
  };

  const deleteOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order && order.status !== 'returned') {
      // Revert stock
      setTools(prevTools =>
        prevTools.map(tool => {
          const orderItem = order.items.find(i => i.toolId === tool.id);
          if (orderItem) {
            return {
              ...tool,
              availableStock: Math.min(tool.totalStock, tool.availableStock + orderItem.quantity),
              rentedStock: Math.max(0, tool.rentedStock - orderItem.quantity)
            };
          }
          return tool;
        })
      );
    }
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const addClient = (client: Omit<Client, 'id' | 'createdAt'>) => {
    setClients(prev => [{
      ...client,
      id: 'cl-' + Date.now(),
      createdAt: new Date().toISOString()
    }, ...prev]);
  };

  const addSeller = (seller: Omit<Seller, 'id' | 'createdAt'>) => {
    setSellers(prev => [{
      ...seller,
      id: 'sel-' + Date.now(),
      createdAt: new Date().toISOString()
    }, ...prev]);
  };

  const updateSeller = (seller: Seller) => {
    setSellers(prev => prev.map(s => s.id === seller.id ? seller : s));
  };

  const deleteSeller = (id: string) => {
    setSellers(prev => prev.filter(s => s.id !== id));
  };

  const resetSellersToDefaults = () => {
    setSellers(INITIAL_SELLERS);
    localStorage.setItem(STORAGE_KEYS.SELLERS, JSON.stringify(INITIAL_SELLERS));
  };

  // Repairs management
  const sendToRepair = (data: {
    toolId: string;
    quantity: number;
    defectDescription: string;
    masterName?: string;
    estimatedCost?: number;
    clientId?: string;
    clientName?: string;
    orderId?: string;
    orderNumber?: string;
    claimAmount?: number;
    claimSettled?: boolean;
    claimType?: 'damage' | 'loss' | 'maintenance';
  }) => {
    const tool = tools.find(t => t.id === data.toolId);
    if (!tool) return;
    const qty = Math.min(tool.availableStock, Math.max(1, data.quantity));
    if (qty <= 0) return;

    const newRepair: RepairRecord = {
      id: 'rep-' + Date.now(),
      toolId: tool.id,
      toolName: tool.name,
      toolArticle: tool.article,
      quantity: qty,
      sentDate: getTodayDateString(),
      defectDescription: data.defectDescription,
      masterName: data.masterName,
      estimatedCost: data.estimatedCost || 0,
      actualCost: 0,
      status: 'in_repair',
      createdAt: new Date().toISOString(),
      clientId: data.clientId,
      clientName: data.clientName,
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      claimAmount: data.claimAmount,
      claimSettled: data.claimSettled ?? false,
      claimType: data.claimType || 'damage'
    };

    setTools(prev => prev.map(t => {
      if (t.id === tool.id) {
        return {
          ...t,
          availableStock: Math.max(0, t.availableStock - qty),
          repairStock: (t.repairStock || 0) + qty
        };
      }
      return t;
    }));

    setRepairs(prev => [newRepair, ...prev]);
  };

  const toggleRepairClaimSettled = (repairId: string) => {
    setRepairs(prev => prev.map(r => {
      if (r.id === repairId) {
        return {
          ...r,
          claimSettled: !r.claimSettled
        };
      }
      return r;
    }));
  };

  const settleOrderDebt = (orderId: string, amount: number, paymentMethod: PaymentMethod = 'cash', note?: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const payAmount = Math.min(o.remainingAmount, Math.max(0, amount));
        const newPaid = o.paidAmount + payAmount;
        const newRemaining = Math.max(0, o.remainingAmount - payAmount);
        const logNote = `Qarz to'landi: +${payAmount.toLocaleString()} so'm (${paymentMethod === 'cash' ? 'Naqd' : paymentMethod === 'card' ? 'Karta' : 'Perevod'})${note ? ` - ${note}` : ''}`;
        return {
          ...o,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          finalPaymentMethod: paymentMethod,
          notes: o.notes ? `${o.notes} | ${logNote}` : logNote
        };
      }
      return o;
    }));
  };

  const completeRepair = (repairId: string, actualCost: number, notes?: string) => {
    const record = repairs.find(r => r.id === repairId);
    if (!record || record.status === 'repaired') return;

    setTools(prev => prev.map(t => {
      if (t.id === record.toolId) {
        return {
          ...t,
          availableStock: Math.min(t.totalStock, t.availableStock + record.quantity),
          repairStock: Math.max(0, (t.repairStock || 0) - record.quantity)
        };
      }
      return t;
    }));

    setRepairs(prev => prev.map(r => {
      if (r.id === repairId) {
        return {
          ...r,
          status: 'repaired',
          actualCost: Math.max(0, actualCost),
          completedDate: getTodayDateString(),
          notes: notes ? (r.notes ? `${r.notes} | ${notes}` : notes) : r.notes
        };
      }
      return r;
    }));
  };

  const deleteRepair = (repairId: string) => {
    const record = repairs.find(r => r.id === repairId);
    if (!record) return;

    if (record.status === 'in_repair') {
      setTools(prev => prev.map(t => {
        if (t.id === record.toolId) {
          return {
            ...t,
            availableStock: Math.min(t.totalStock, t.availableStock + record.quantity),
            repairStock: Math.max(0, (t.repairStock || 0) - record.quantity)
          };
        }
        return t;
      }));
    }

    setRepairs(prev => prev.filter(r => r.id !== repairId));
  };

  const resetToDefaults = () => {
    setTools(INITIAL_TOOLS);
    setOrders(INITIAL_ORDERS);
    setReceipts(INITIAL_RECEIPTS);
    setClients(INITIAL_CLIENTS);
    setRepairs([]);
    localStorage.removeItem(STORAGE_KEYS.TOOLS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.RECEIPTS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.REPAIRS);
  };

  const clearAllData = () => {
    setTools([]);
    setOrders([]);
    setReceipts([]);
    setClients([]);
    setRepairs([]);
    localStorage.removeItem(STORAGE_KEYS.TOOLS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.RECEIPTS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.REPAIRS);
  };

  return (
    <RentalContext.Provider
      value={{
        tools,
        orders,
        receipts,
        clients,
        repairs,
        sellers,
        addTool,
        updateTool,
        deleteTool,
        addStockReceipt,
        deleteStockReceipt,
        clearAllStockReceipts,
        createOrder,
        returnOrder,
        extendOrder,
        deleteOrder,
        addClient,
        addSeller,
        updateSeller,
        deleteSeller,
        resetSellersToDefaults,
        sendToRepair,
        completeRepair,
        deleteRepair,
        toggleRepairClaimSettled,
        settleOrderDebt,
        soundEnabled,
        setSoundEnabled,
        triggerSound,
        dueTodayOrders,
        overdueOrders,
        activeOrders,
        resetToDefaults,
        clearAllData
      }}
    >
      {children}
    </RentalContext.Provider>
  );
};

export const useRental = () => {
  const context = useContext(RentalContext);
  if (!context) {
    throw new Error('useRental must be used within a RentalProvider');
  }
  return context;
};
