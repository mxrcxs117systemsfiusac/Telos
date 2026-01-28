import { Trash2, Pencil, Plus, type LucideIcon } from 'lucide-react';
import type { Transaction } from '../hooks/useFinance';
import { formatCurrency } from '../utils/format';

interface Props {
  title: string;
  items: Transaction[];
  icon: LucideIcon;
  colorClass: string;
  onAdd: () => void;
  onEdit?: (item: Transaction) => void;
  onDelete: (id: number) => void;
}

export const TransactionList = ({ title, items, icon: Icon, colorClass, onAdd, onEdit, onDelete }: Props) => {
  return (
    <div className="p-6 flex flex-col h-[450px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Icon className={`w-5 h-5 ${colorClass}`} />
          {title}
        </h3>
        <button onClick={onAdd} className="bg-zinc-800/50 hover:bg-zinc-700 text-white rounded-lg p-2 transition-colors border border-zinc-700">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {items.length === 0 ? (
          <div className="text-center text-zinc-600 py-12 text-sm italic">Sin registros</div>
        ) : (
          items.map(item => (
            <div key={item.id} className="bg-zinc-950/30 border border-zinc-800/50 rounded-xl p-4 flex justify-between items-center group hover:bg-zinc-900/50 transition-all">
              <div>
                <p className="text-zinc-200 font-medium text-sm">{item.descripcion}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">
                    {item.categoria || 'General'}
                  </span>
                  <p className="text-zinc-500 text-xs">{item.fecha}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-mono font-bold ${colorClass}`}>
                  {formatCurrency(item.monto)}
                </span>
                {onEdit && (
                  <button
                    onClick={() => onEdit(item)}
                    className="text-zinc-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-zinc-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};