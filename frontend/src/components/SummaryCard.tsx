import type { LucideIcon } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface Props {
  title: string;
  amount: number;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

export const SummaryCard = ({ title, amount, icon: Icon, colorClass, bgClass }: Props) => {
  return (
    <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-6 shadow-xl h-full flex flex-col justify-between hover:border-zinc-700/50 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${bgClass}`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
        <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{title}</span>
      </div>
      <p className="text-3xl font-black text-white tracking-tight">{formatCurrency(amount)}</p>
    </div>
  );
};