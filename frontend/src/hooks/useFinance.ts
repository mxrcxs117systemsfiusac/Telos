import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

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
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!token) return;

    api.get('/finance')
      .then(data => {
        setIngresos(data.ingresos || []);
        setEgresos(data.egresos || []);
        setPagos(data.pagos || []);
        setPlannedIncomes(data.plannedIncomes || []);
        setMetaAhorro(data.metaAhorro || 10000);
        setAhorroActual(data.ahorroActual || 0);
        setSavingsImage(data.savingsImage || null);
        setIsLoaded(true);
        // Mark initial load complete after state settles
        setTimeout(() => { isInitialLoad.current = false; }, 100);
      })
      .catch(err => console.error('Error loading finance data', err));
  }, [token]);

  // Debounced persistence for metaAhorro
  useEffect(() => {
    if (isInitialLoad.current || !isLoaded) return;
    const timer = setTimeout(() => {
      api.post('/finance', { metaAhorro }).catch(console.error);
    }, 500);
    return () => clearTimeout(timer);
  }, [metaAhorro]);

  // Debounced persistence for ahorroActual
  useEffect(() => {
    if (isInitialLoad.current || !isLoaded) return;
    const timer = setTimeout(() => {
      api.post('/finance', { ahorroActual }).catch(console.error);
    }, 500);
    return () => clearTimeout(timer);
  }, [ahorroActual]);

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
      const saved = await api.post('/finance/add', {
        type: mapTypeToDB(type),
        amount: item.monto,
        category: item.categoria,
        date: item.fecha,
        description: item.descripcion
      });

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
      await api.put(`/finance/${item.id}`, {
        type: mapTypeToDB(type),
        amount: item.monto,
        category: item.categoria,
        date: item.fecha,
        description: item.descripcion
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
      await api.delete(`/finance/${id}`);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  // Re-implement Automation Logic (kept local for now, but could be backend)
  const togglePaymentStatus = async (id: number) => {
    const item = pagos.find(p => p.id === id);
    if (!item) return;

    const newStatus = !item.isPaid;

    // Optimistic Update
    setPagos(prev => prev.map(p => p.id === id ? { ...p, isPaid: newStatus } : p));

    // Persist
    try {
      await api.put(`/finance/${id}`, {
        ...item,
        isPaid: newStatus
      });

      // Trigger logic: If paid, maybe create a real expense?
      // For now, let's keep it simple. If user wants a record, they might see it in "Gastos Reales" if we calculated it.
      // The original logic created a new transaction.
      if (newStatus) {
        const newItem = {
          id: 0,
          descripcion: `${item.descripcion} (Pago Fijo)`,
          monto: item.monto,
          fecha: item.fecha,
          categoria: item.categoria
        };
        addTransaction('egreso', newItem);
      }
    } catch (e) {
      console.error("Failed to toggle payment status", e);
      // Revert
      setPagos(prev => prev.map(p => p.id === id ? { ...p, isPaid: !newStatus } : p));
    }
  };

  const toggleReceivedStatus = async (id: number) => {
    const item = plannedIncomes.find(p => p.id === id);
    if (!item) return;

    const newStatus = !item.isReceived;

    // Optimistic
    setPlannedIncomes(prev => prev.map(p => p.id === id ? { ...p, isReceived: newStatus } : p));

    // Persist
    try {
      await api.put(`/finance/${id}`, {
        ...item,
        isReceived: newStatus
      });

      if (newStatus) {
        addTransaction('ingreso', { ...item, descripcion: `${item.descripcion} (Planificado)` });
      }
    } catch (e) {
      console.error("Failed to toggle received status", e);
      setPlannedIncomes(prev => prev.map(p => p.id === id ? { ...p, isReceived: !newStatus } : p));
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