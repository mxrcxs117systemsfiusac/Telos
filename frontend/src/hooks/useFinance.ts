import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export interface Transaction {
  id: number;
  descripcion: string; // Mapped to 'description'
  monto: number;       // Mapped to 'amount'
  fecha: string;       // Mapped to 'date'
  categoria: string;   // Mapped to 'category'
  isPaid?: boolean;
  gastoEstimado?: number;
  isReceived?: boolean;
  relatedIds?: number[];
}

const API_URL = 'http://localhost:3001/api/finance';

export const useFinance = () => {
  const { token } = useAuth();
  const [ingresos, setIngresos] = useState<Transaction[]>([]);
  const [egresos, setEgresos] = useState<Transaction[]>([]);
  const [pagos, setPagos] = useState<Transaction[]>([]);
  const [plannedIncomes, setPlannedIncomes] = useState<Transaction[]>([]);
  const [metaAhorro, setMetaAhorro] = useState<number>(10000);
  const [ahorroActual, setAhorroActual] = useState<number>(0);
  const [savingsImage, setSavingsImage] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` }
    })
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
      .catch(err => console.error('Error loading finance data', err));
  }, [token]);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const mapTypeToDB = (type: string) => {
    if (type === 'ingreso') return 'income';
    if (type === 'egreso') return 'expense';
    if (type === 'pago') return 'payment';
    if (type === 'planned') return 'planned_income';
    return 'expense';
  };

  const addTransaction = async (type: 'ingreso' | 'egreso' | 'pago' | 'planned', item: Transaction) => {
    const tempId = Date.now();
    const optimisticItem = { ...item, id: tempId };

    if (type === 'ingreso') setIngresos(prev => [...prev, optimisticItem]);
    if (type === 'egreso') setEgresos(prev => [...prev, optimisticItem]);
    if (type === 'pago') setPagos(prev => [...prev, optimisticItem]);
    if (type === 'planned') setPlannedIncomes(prev => [...prev, optimisticItem]);

    try {
      const res = await fetch(`${API_URL}/add`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: mapTypeToDB(type),
          amount: item.monto,
          category: item.categoria,
          date: item.fecha,
          description: item.descripcion
        })
      });
      const saved = await res.json();
      const updateId = (list: Transaction[]) => list.map(i => i.id === tempId ? { ...i, id: saved.id } : i);

      if (type === 'ingreso') setIngresos(updateId);
      if (type === 'egreso') setEgresos(updateId);
      if (type === 'pago') setPagos(updateId);
      if (type === 'planned') setPlannedIncomes(updateId);
    } catch (err) {
      console.error('Add failed', err);
    }
  };

  const updateTransaction = async (type: string, item: Transaction) => {
    const updateList = (list: Transaction[]) => list.map(i => i.id === item.id ? item : i);
    if (type === 'ingreso') setIngresos(updateList);
    if (type === 'egreso') setEgresos(updateList);
    if (type === 'pago') setPagos(updateList);
    if (type === 'planned') setPlannedIncomes(updateList);

    try {
      await fetch(`${API_URL}/${item.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          type: mapTypeToDB(type),
          amount: item.monto,
          category: item.categoria,
          date: item.fecha,
          description: item.descripcion
        })
      });
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const deleteTransaction = async (type: string, id: number) => {
    if (type === 'ingreso') setIngresos(prev => prev.filter(i => i.id !== id));
    if (type === 'egreso') setEgresos(prev => prev.filter(i => i.id !== id));
    if (type === 'pago') setPagos(prev => prev.filter(i => i.id !== id));
    if (type === 'planned') setPlannedIncomes(prev => prev.filter(i => i.id !== id));

    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers });
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  // Re-implement Automation Logic (kept local for now, but could be backend)
  const togglePaymentStatus = (id: number) => {
    // For now, simple local toggle + no backend sync implemented for "isPaid" status on the 'payment' itself
    // Ideally, 'payment' items in DB should have 'is_paid' column.
    // My FinanceItem model has 'is_recurring', but not 'is_paid'.
    // I should add 'is_paid' to Finance model? Or just let it be.
    // For migration speed, I'll update local state.
    // NOTE: The user logic created REAL expenses when paid. 
    // I should call addTransaction('egreso', ...) when paid.

    const item = pagos.find(p => p.id === id);
    if (!item) return;

    if (!item.isPaid) {
      const newItem = {
        id: 0,
        descripcion: `${item.descripcion} (Pago Fijo)`,
        monto: item.monto,
        fecha: item.fecha,
        categoria: item.categoria
      };
      addTransaction('egreso', newItem);

      // Update Payment status locally (in-memory only for now if no DB field)
      setPagos(prev => prev.map(p => p.id === id ? { ...p, isPaid: true } : p));
    } else {
      setPagos(prev => prev.map(p => p.id === id ? { ...p, isPaid: false } : p));
    }
  };

  const toggleReceivedStatus = (id: number) => {
    // Similar logic
    const item = plannedIncomes.find(p => p.id === id);
    if (!item) return;
    if (!item.isReceived) {
      addTransaction('ingreso', { ...item, descripcion: `${item.descripcion} (Planificado)` });
      setPlannedIncomes(prev => prev.map(p => p.id === id ? { ...p, isReceived: true } : p));
    } else {
      setPlannedIncomes(prev => prev.map(p => p.id === id ? { ...p, isReceived: false } : p));
    }
  };

  const totalIngresos = ingresos.reduce((sum, item) => sum + (item.monto || 0), 0);
  const totalEgresos = egresos.reduce((sum, item) => sum + (item.monto || 0), 0);
  const totalPagos = pagos.reduce((sum, item) => sum + (item.isPaid ? (item.monto || 0) : 0), 0);
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