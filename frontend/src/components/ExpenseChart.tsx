import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Transaction } from '../hooks/useFinance'; // Agregamos "type"
import { formatCurrency } from '../utils/format';

interface Props {
  egresos: Transaction[];
  pagos: Transaction[];
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#6366f1'];

export const ExpenseChart = ({ egresos, pagos }: Props) => {
  const allExpenses = [...egresos, ...pagos];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = allExpenses.reduce((acc: any[], curr) => {
    const cat = curr.categoria || 'Otros';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = acc.find((item: any) => item.name === cat);
    if (existing) {
      existing.value += curr.monto;
    } else {
      acc.push({ name: cat, value: curr.monto });
    }
    return acc;
  }, []);

  if (data.length === 0) return (
    <div className="h-64 flex items-center justify-center text-zinc-500 bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800/50">
      <p>Agrega gastos para ver la gráfica</p>
    </div>
  );

  return (
    <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800/50 p-6 shadow-xl h-96 flex flex-col">
      <h3 className="text-lg font-bold text-white mb-4">Distribución de Gastos</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
              ))}
            </Pie>
            {/* Aquí arreglamos el error del Tooltip usando 'any' para calmar a TypeScript */}
            <Tooltip 
              formatter={(value: any) => formatCurrency(Number(value))}
              contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};