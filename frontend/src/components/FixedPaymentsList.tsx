import { useMemo } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Calendar, Pencil } from 'lucide-react'; // Added icons
import type { Transaction } from '../hooks/useFinance';

interface FixedPaymentsListProps {
    items: Transaction[];
    onAdd: () => void;
    onEdit?: (item: Transaction) => void;
    onDelete: (id: number) => void;
    onToggleStatus: (id: number) => void;
}

export const FixedPaymentsList = ({ items, onAdd, onEdit, onDelete, onToggleStatus }: FixedPaymentsListProps) => {

    // Group items by Month
    const groupedItems = useMemo(() => {
        const groups: { [key: string]: Transaction[] } = {};

        // Sort by date first
        const sorted = [...items].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

        sorted.forEach(item => {
            // Create a key like "Enero 2024"
            const date = new Date(item.fecha); // Assuming YYYY-MM-DD local or UTC handled by browser
            // Using 'es-GT' for consistent Spanish month names
            // Note: Date parsing from '2024-01-01' string works well in recent browsers but sometimes timezone issues apply. 
            // We'll treat the string simply.

            const monthName = date.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' });
            // Capitalize first letter
            const key = monthName.charAt(0).toUpperCase() + monthName.slice(1);

            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        return groups;
    }, [items]);

    const monthKeys = Object.keys(groupedItems);

    const totalProjected = items.reduce((acc, curr) => acc + curr.monto, 0);
    const totalPaid = items.filter(i => i.isPaid).reduce((acc, curr) => acc + curr.monto, 0);
    const remainingRequired = totalProjected - totalPaid;

    // Progress is how much we have PAID vs Total
    const progress = totalProjected > 0 ? (totalPaid / totalProjected) * 100 : 0;

    return (
        <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-orange-400 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-400" />
                    Proyección de Gastos
                </h3>
                <button
                    onClick={onAdd}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-amber-300"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Projection Summary Box */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-3">
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Requerido Anual</span>
                        <div className="text-2xl font-mono text-amber-400 mt-1 font-bold">
                            Q{remainingRequired.toLocaleString()}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Total Anual</span>
                        <div className="text-sm font-mono text-zinc-300 mt-1">
                            Q{totalProjected.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-amber-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
                {items.length === 0 && (
                    <div className="text-center py-8 text-zinc-500 text-sm italic">
                        No hay pagos fijos registrados.
                    </div>
                )}

                {monthKeys.map(month => {
                    const monthItems = groupedItems[month];
                    const monthTotal = monthItems.reduce((acc, curr) => acc + curr.monto, 0);

                    return (
                        <div key={month} className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <div className="h-px flex-1 bg-white/10"></div>
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    {month}
                                    <span className="text-amber-400/80 font-mono bg-amber-400/10 px-1.5 py-0.5 rounded">
                                        Q{monthTotal.toLocaleString()}
                                    </span>
                                </span>
                                <div className="h-px flex-1 bg-white/10"></div>
                            </div>

                            <div className="space-y-2">
                                {monthItems.map(item => (
                                    <div
                                        key={item.id}
                                        className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-300
                      ${item.isPaid
                                                ? 'bg-zinc-900/50 border-zinc-800 opacity-60'
                                                : 'bg-white/5 hover:bg-white/10 border-white/5'
                                            }
                    `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => onToggleStatus(item.id)}
                                                className={`transition-colors ${item.isPaid ? 'text-zinc-600' : 'text-amber-400 hover:text-amber-300'}`}
                                            >
                                                {item.isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                            </button>

                                            <div className="flex flex-col">
                                                <span className={`font-medium transition-all ${item.isPaid ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                                    {item.descripcion}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-zinc-500">
                                                        Dia {item.fecha.split('-')[2]}
                                                    </span>
                                                    {item.isPaid && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">PAGADO</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`font-mono font-semibold ${item.isPaid ? 'text-zinc-600' : 'text-zinc-300'}`}>
                                                Q{item.monto.toLocaleString()}
                                            </span>

                                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                {onEdit && (
                                                    <button
                                                        onClick={() => onEdit(item)}
                                                        className="text-zinc-500 hover:text-indigo-400 p-1.5"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onDelete(item.id)}
                                                    className="text-zinc-500 hover:text-red-400 p-1.5"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
