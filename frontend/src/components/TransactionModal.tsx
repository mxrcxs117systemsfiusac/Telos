import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Transaction } from '../hooks/useFinance';

interface Props {
  isOpen: boolean;
  type: string | null;
  initialData?: Transaction | null;
  onClose: () => void;
  onSave: (desc: string, monto: number, categoria: string, fecha: string) => void;
}

const CATEGORIAS_GASTOS = ['Comida', 'Transporte', 'Casa', 'Servicios', 'Diversión', 'Salud', 'Educación', 'Deudas', 'Otros'];
const CATEGORIAS_INGRESOS = ['Salario', 'Negocio', 'Freelance', 'Regalo', 'Inversiones', 'Otros'];

export const TransactionModal = ({ isOpen, type, initialData, onClose, onSave }: Props) => {
  const [desc, setDesc] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [fecha, setFecha] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDesc(initialData.descripcion);
        setMonto(initialData.monto.toString());
        setCategoria(initialData.categoria);
        setFecha(initialData.fecha);
      } else {
        setDesc('');
        setMonto('');
        setCategoria('');
        setFecha(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const categorias = type === 'ingreso' ? CATEGORIAS_INGRESOS : CATEGORIAS_GASTOS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (desc && monto && categoria && fecha) {
      onSave(desc, parseFloat(monto), categoria, fecha);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white capitalize">Nuevo {type}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-zinc-400 text-xs uppercase font-bold mb-2 block">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors calendar-picker-indicator:filter-invert"
            />
          </div>

          <div>
            <label className="text-zinc-400 text-xs uppercase font-bold mb-2 block">Descripción</label>
            <input
              autoFocus
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Ej: McDonald's, Uber..."
            />
          </div>

          <div>
            <label className="text-zinc-400 text-xs uppercase font-bold mb-2 block">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
            >
              <option value="">Selecciona una opción</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-zinc-400 text-xs uppercase font-bold mb-2 block">Monto (Q)</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="0.00"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3 rounded-lg transition-all mt-4"
          >
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
};