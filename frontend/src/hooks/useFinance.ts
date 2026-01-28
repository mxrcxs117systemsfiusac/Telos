import { useState, useEffect } from 'react';

export interface Transaction {
  id: number;
  descripcion: string;
  monto: number;
  fecha: string; // YYYY-MM-DD
  categoria: string;
  isPaid?: boolean;
  gastoEstimado?: number; // Para planificación
  isReceived?: boolean;   // Para planificación
  relatedIds?: number[];  // IDs de transacciones automáticas generadas
}

const API_URL = 'http://localhost:3001/api/data';

export const useFinance = () => {
  const [ingresos, setIngresos] = useState<Transaction[]>([]);
  const [egresos, setEgresos] = useState<Transaction[]>([]);
  const [pagos, setPagos] = useState<Transaction[]>([]); // Pagos Fijos
  const [plannedIncomes, setPlannedIncomes] = useState<Transaction[]>([]); // Planificación de Ingresos
  const [metaAhorro, setMetaAhorro] = useState<number>(10000);
  const [ahorroActual, setAhorroActual] = useState<number>(0);
  const [savingsImage, setSavingsImage] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data on mount
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setIngresos(data.ingresos || []);
        setEgresos(data.egresos || []);
        setPagos(data.pagos || []);
        setPlannedIncomes(data.plannedIncomes || []);
        setMetaAhorro(data.metaAhorro || 10000);
        setAhorroActual(data.ahorroActual || 0);
        setSavingsImage(data.savingsImage || null);
        setIsLoaded(true);
      })
      .catch(err => {
        console.error('Error loading data:', err);
        // Fallback for demo if server is not running (optional but good practice)
        setIsLoaded(true);
      });
  }, []);

  // Save data on changes
  useEffect(() => {
    if (!isLoaded) return;

    const saveData = {
      ingresos,
      egresos,
      pagos,
      plannedIncomes,
      metaAhorro,
      ahorroActual,
      savingsImage
    };

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveData)
    }).catch(err => console.error('Error saving data:', err));

  }, [ingresos, egresos, pagos, plannedIncomes, metaAhorro, ahorroActual, isLoaded]);

  const addTransaction = (type: 'ingreso' | 'egreso' | 'pago' | 'planned', item: Transaction) => {
    if (type === 'ingreso') setIngresos(prev => [...prev, item]);
    if (type === 'egreso') setEgresos(prev => [...prev, item]);
    if (type === 'pago') setPagos(prev => [...prev, item]);
    if (type === 'planned') setPlannedIncomes(prev => [...prev, item]);
  };

  const updateTransaction = (type: 'ingreso' | 'egreso' | 'pago' | 'planned', updatedItem: Transaction) => {
    if (type === 'ingreso') setIngresos(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    if (type === 'egreso') setEgresos(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    if (type === 'pago') setPagos(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    if (type === 'planned') setPlannedIncomes(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const deleteTransaction = (type: 'ingreso' | 'egreso' | 'pago' | 'planned', id: number) => {
    if (type === 'ingreso') setIngresos(prev => prev.filter(i => i.id !== id));
    if (type === 'egreso') setEgresos(prev => prev.filter(i => i.id !== id));
    if (type === 'pago') setPagos(prev => prev.filter(i => i.id !== id));
    if (type === 'planned') setPlannedIncomes(prev => prev.filter(i => i.id !== id));
  };

  // Automation Logic: Toggle Payment (Fixed Payments)
  const togglePaymentStatus = (id: number) => {
    const item = pagos.find(p => p.id === id);
    if (!item) return;

    if (!item.isPaid) {
      // Logic: Mark as Paid -> Create Real Expense
      const newExpenseId = Date.now();
      const realExpense: Transaction = {
        id: newExpenseId,
        descripcion: `${item.descripcion} (Pago Fijo)`,
        monto: item.monto,
        fecha: item.fecha, // Or new Date().toISOString() if we want "paid today"? User usually wants scheduled date.
        categoria: item.categoria
      };

      setEgresos(prev => [...prev, realExpense]);
      setPagos(prev => prev.map(p =>
        p.id === id ? { ...p, isPaid: true, relatedIds: [newExpenseId] } : p
      ));

    } else {
      // Logic: Mark as Unpaid -> Remove Real Expense if it exists
      const relatedIds = item.relatedIds || [];
      if (relatedIds.length > 0) {
        setEgresos(prev => prev.filter(e => !relatedIds.includes(e.id)));
      }

      setPagos(prev => prev.map(p =>
        p.id === id ? { ...p, isPaid: false, relatedIds: [] } : p
      ));
    }
  };

  // Automation Logic: Toggle Received (Planned Income)
  const toggleReceivedStatus = (id: number) => {
    const item = plannedIncomes.find(p => p.id === id);
    if (!item) return;

    if (!item.isReceived) {
      // Logic: Mark as Received -> Create Real Income and Real Expense (Estimated)
      const incomeId = Date.now();
      const expenseId = incomeId + 1; // Ensure unique

      const realIncome: Transaction = {
        id: incomeId,
        descripcion: `${item.descripcion} (Planificado)`,
        monto: item.monto,
        fecha: item.fecha,
        categoria: 'Ingreso Planificado' // Or map original
      };

      // Only create expense if there is an estimated expense
      const relatedIds = [incomeId];

      setIngresos(prev => [...prev, realIncome]);

      if (item.gastoEstimado && item.gastoEstimado > 0) {
        const realExpense: Transaction = {
          id: expenseId,
          descripcion: `Gasto de ${item.descripcion}`,
          monto: item.gastoEstimado,
          fecha: item.fecha,
          categoria: 'Gasto Planificado'
        };
        setEgresos(prev => [...prev, realExpense]);
        relatedIds.push(expenseId);
      }

      setPlannedIncomes(prev => prev.map(p =>
        p.id === id ? { ...p, isReceived: true, relatedIds: relatedIds } : p
      ));

    } else {
      // Logic: Uncheck -> Remove created transactions
      const relatedIds = item.relatedIds || [];
      if (relatedIds.length > 0) {
        setIngresos(prev => prev.filter(i => !relatedIds.includes(i.id)));
        setEgresos(prev => prev.filter(e => !relatedIds.includes(e.id)));
      }

      setPlannedIncomes(prev => prev.map(p =>
        p.id === id ? { ...p, isReceived: false, relatedIds: [] } : p
      ));
    }
  }

  const totalIngresos = ingresos.reduce((sum, item) => sum + (item.monto || 0), 0);
  const totalEgresos = egresos.reduce((sum, item) => sum + (item.monto || 0), 0);

  // Updated Logic: Pagos Fijos are technically independent expense projections often.
  // But if they are just "Bills", they shouldn't double count in balance if they are in 'egresos'.
  // CRITICAL CHANGE: The user wants "Automated".
  // Note: if togglePaymentStatus ADDS to `egresos`, then `totalEgresos` will ALREADY include it.
  // So `balance` calculation should NOT subtract `totalPagos` separately anymore if they are Paid!
  // Wait, if I mark as Paid, I add to Egresos.
  // If I ALSO subtract in `totalPagos` (if isPaid), I double count.
  // FIX: `totalPagos` used for balance should be 0 or separate concept.
  // The user said: "El monto requerido debe ir disminuyendo...".
  // So "Fixed Payments" list is a *Todo List*.
  // The *Real Balance* is `Ingresos - Egresos`.
  // Since "Paid Fixed Payment" is now in `Egresos`, we simply use `Ingresos - Egresos`.
  // We should REMOVE `totalPagos` from the balance calculation entirely to avoid double counting
  // OR we keep `totalPagos` as just a stat.

  // Let's check previous balance logic: 
  // const totalPagos = pagos.reduce((sum, item) => sum + (item.isPaid ? (item.monto || 0) : 0), 0);
  // const balance = totalIngresos - totalEgresos - totalPagos;

  // IF I adopt the new automation (Paid -> Egreso), then `totalEgresos` increases.
  // So I MUST remove `- totalPagos` from balance.
  // `totalPagos` variable itself can remain as a stat of "How much I paid in fixed bills", 
  // but for Balance it shouldn't be subtracted twice.

  const totalPagos = pagos.reduce((sum, item) => sum + (item.isPaid ? (item.monto || 0) : 0), 0);

  // Balance calculation updated to avoid double counting since Paid items are now in Egresos
  const balance = totalIngresos - totalEgresos;

  const totalPagosProyectados = pagos.reduce((sum, item) => sum + (item.monto || 0), 0);

  return {
    ingresos, egresos, pagos, plannedIncomes,
    metaAhorro, setMetaAhorro,
    ahorroActual, setAhorroActual,
    savingsImage,
    totalIngresos, totalEgresos, totalPagos, balance, totalPagosProyectados,
    addTransaction, updateTransaction, deleteTransaction, togglePaymentStatus, toggleReceivedStatus,
    isLoaded
  };
};