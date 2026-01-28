import React, { useState } from 'react';
import { Plus, Trash2, Pencil, PiggyBank, Briefcase, CheckCircle2, Circle } from 'lucide-react';
import type { Transaction } from '../hooks/useFinance';

interface IncomePlanningProps {
    items: Transaction[];
    onAdd: (item: Transaction) => void;
    onEdit: (item: Transaction) => void;
    onDelete: (id: number) => void;
    onToggleReceived: (id: number) => void;
}

export const IncomePlanning = ({ items, onAdd, onEdit, onDelete, onToggleReceived }: IncomePlanningProps) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newDesc, setNewDesc] = useState('');
    const [newIncome, setNewIncome] = useState('');
    const [newExpenseEst, setNewExpenseEst] = useState('');
    const [newDate, setNewDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDesc || !newIncome || !newDate) return;

        onAdd({
            id: Date.now(),
            descripcion: newDesc,
            monto: Number(newIncome),
            gastoEstimado: newExpenseEst ? Number(newExpenseEst) : 0,
            fecha: newDate,
            categoria: 'Planificado',
            isReceived: false
        });

        setNewDesc('');
        setNewIncome('');
        setNewExpenseEst('');
        setNewDate('');
        setIsAdding(false);
    };

    const totalPlannedSavings = items.reduce((acc, curr) => {
        // Logic: Ahorro = Ingreso - Gasto Estimado
        return acc + (curr.monto - (curr.gastoEstimado || 0));
    }, 0);

    const realizedSavings = items.reduce((acc, curr) => {
        // Logic: Ahorro "Real" only if received
        if (curr.isReceived) {
            return acc + (curr.monto - (curr.gastoEstimado || 0));
        }
        return acc;
    }, 0);

    return (
        <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300 flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-indigo-400" />
                    Planificación Inteligente
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-indigo-300"
                >
                    <Plus className={`w-5 h-5 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
                </button>
            </div>

            {/* Summary Box */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 grid grid-cols-2 gap-4">
                <div>
                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Proyección Ahorro</span>
                    <div className="text-lg font-mono text-indigo-400 mt-1">
                        Q{totalPlannedSavings.toLocaleString()}
                    </div>
                </div>
                <div>
                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Ahorro Real (Recibido)</span>
                    <div className="text-lg font-mono text-emerald-400 mt-1 flex items-center gap-2">
                        <PiggyBank className="w-4 h-4" />
                        Q{realizedSavings.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {isAdding && (
                    <form onSubmit={handleSubmit} className="bg-white/5 p-4 rounded-xl space-y-3 border border-indigo-500/30 animate-entry">
                        <input
                            type="text"
                            placeholder="Fuente de Ingreso"
                            value={newDesc}
                            onChange={e => setNewDesc(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-zinc-200"
                            autoFocus
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                placeholder="Ingreso Total"
                                value={newIncome}
                                onChange={e => setNewIncome(e.target.value)}
                                className="bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-zinc-200"
                            />
                            <input
                                type="number"
                                placeholder="Gasto Est."
                                value={newExpenseEst}
                                onChange={e => setNewExpenseEst(e.target.value)}
                                className="bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-zinc-200"
                            />
                        </div>
                        <input
                            type="date"
                            value={newDate}
                            onChange={e => setNewDate(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-zinc-200"
                        />
                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Agregar Planificación
                        </button>
                    </form>
                )}

                {items.length === 0 && !isAdding && (
                    <div className="text-center py-4 text-zinc-500 text-sm italic">
                        No hay ingresos planificados.
                    </div>
                )}

                {items.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).map(item => (
                    <div key={item.id} className={`group flex flex-col p-4 rounded-xl border transition-all ${item.isReceived ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 hover:bg-white/10 border-white/5'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => onToggleReceived(item.id)}
                                    className={`transition-colors ${item.isReceived ? 'text-emerald-400' : 'text-zinc-600 hover:text-emerald-400/50'}`}
                                    title="Marcar como Recibido"
                                >
                                    {item.isReceived ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                </button>
                                <div className="flex flex-col">
                                    <span className={`font-medium ${item.isReceived ? 'text-zinc-200' : 'text-zinc-200'}`}>{item.descripcion}</span>
                                    <span className="text-xs text-zinc-500">{new Date(item.fecha).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEdit(item)} className="p-1 hover:text-indigo-400 text-zinc-500"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => onDelete(item.id)} className="p-1 hover:text-red-400 text-zinc-500"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-1 border-t border-white/5 pt-2">
                            <div>
                                <span className="text-[10px] uppercase text-zinc-500 block">Ingreso</span>
                                <span className="text-zinc-300 font-mono">Q{item.monto.toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase text-zinc-500 block">Ahorro Est.</span>
                                <span className={`font-mono font-bold ${(item.monto - (item.gastoEstimado || 0)) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    Q{(item.monto - (item.gastoEstimado || 0)).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
