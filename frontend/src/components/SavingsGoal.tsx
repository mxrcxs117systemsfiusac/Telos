import { useRef } from 'react';
import { Target, Image as ImageIcon } from 'lucide-react';

interface SavingsGoalProps {
  meta: number;
  ahorro: number;
  imageUrl?: string | null;
  setMeta: (m: number) => void;
  setAhorro: (a: number) => void;
}

export function SavingsGoal({ meta, ahorro, imageUrl, setMeta, setAhorro }: SavingsGoalProps) {
  const progreso = Math.min((ahorro / meta) * 100, 100);

  return (
    <div className="glass-panel p-6 rounded-xl flex flex-col h-full relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-slate-400 text-sm font-medium uppercase flex items-center gap-2">
            <Target className="w-4 h-4" /> Meta de Ahorro
          </h3>
          <p className="text-xs text-slate-500 mt-1">Visualiza tu objetivo</p>
        </div>
      </div>

      {/* Image Gallery / Placeholder */}
      <div className="flex-1 bg-black/20 rounded-xl mb-6 relative group overflow-hidden min-h-[150px] flex items-center justify-center">
        {imageUrl ? (
          <img src={`http://localhost:3001${imageUrl}`} alt="Goal" className="w-full h-full object-cover absolute inset-0 transition-opacity duration-500" />
        ) : (
          <div className="text-center text-slate-600">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-xs">Configura la imagen en Ajustes</p>
          </div>
        )}
      </div>

      {/* Values */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <input
            type="number"
            value={ahorro}
            onChange={(e) => setAhorro(Number(e.target.value))}
            className="text-2xl font-bold bg-transparent focus:outline-none w-32 font-mono text-indigo-400"
          />
          <span className="text-slate-500 text-sm mb-1">/</span>
          <input
            type="number"
            value={meta}
            onChange={(e) => setMeta(Number(e.target.value))}
            className="text-right text-sm font-medium bg-transparent focus:outline-none w-24 font-mono text-slate-400"
          />
        </div>

        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-500 h-full rounded-full transition-all duration-1000 relative"
            style={{ width: `${progreso}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
          </div>
        </div>

        <div className="flex justify-between text-xs text-slate-500">
          <span>{progreso.toFixed(1)}% completado</span>
          <span>Faltan Q{(meta - ahorro).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}