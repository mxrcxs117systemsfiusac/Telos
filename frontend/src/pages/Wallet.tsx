import { useState } from 'react';
import {
    TrendingUp, TrendingDown, DollarSign, Loader2,
} from 'lucide-react';
import { useFinance, type Transaction } from '../hooks/useFinance';
import { SavingsGoal } from '../components/SavingsGoal';
import { TransactionList } from '../components/TransactionList';
import { TransactionModal } from '../components/TransactionModal';
import { ExpenseChart } from '../components/ExpenseChart';
import { BankShortcuts } from '../components/BankShortcuts';
import { IncomePlanning } from '../components/IncomePlanning';
import { FixedPaymentsList } from '../components/FixedPaymentsList';


export default function WalletPage() {
    const {
        ingresos, egresos, pagos, plannedIncomes,
        metaAhorro, setMetaAhorro,
        ahorroActual, setAhorroActual,
        savingsImage,
        totalIngresos, totalEgresos, totalPagos, balance,
        addTransaction, updateTransaction, deleteTransaction, togglePaymentStatus, toggleReceivedStatus,
        isLoaded
    } = useFinance();

    const [modalTypeExtended, setModalTypeExtended] = useState<'ingreso' | 'egreso' | 'pago' | 'planned' | null>(null);
    const [editingItem, setEditingItem] = useState<Transaction | null>(null);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'planning', 'fixed'

    const handleSaveExtended = (descripcion: string, monto: number, categoria: string, fecha: string) => {
        if (modalTypeExtended) {
            const transactionData = {
                id: editingItem ? editingItem.id : Date.now(),
                descripcion,
                monto,
                fecha,
                categoria,
                isPaid: editingItem ? editingItem.isPaid : false,
                gastoEstimado: editingItem ? editingItem.gastoEstimado : 0,
                isReceived: editingItem ? editingItem.isReceived : false
            };

            if (editingItem) {
                updateTransaction(modalTypeExtended, transactionData);
            } else {
                addTransaction(modalTypeExtended, transactionData);
            }
        }
    };

    const totalGastosReales = totalEgresos + totalPagos;

    if (!isLoaded) {
        return (
            <div className="min-h-full flex items-center justify-center text-indigo-500">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1a1d24] p-4 rounded-xl border border-white/5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <span className="text-indigo-500"></span> Billetera
                    </h1>
                </div>

                {/* Internal Wallet Navigation */}
                <div className="flex bg-[#0f1115] p-1 rounded-lg border border-white/5">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('planning')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'planning' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Planificación
                    </button>
                    <button
                        onClick={() => setActiveTab('fixed')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'fixed' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Pagos Fijos
                    </button>
                </div>

                <div className="flex gap-3">
                    <BankShortcuts />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-20">
                {/* CONTENT: DASHBOARD */}
                {activeTab === 'dashboard' && (
                    <div className="animate-entry space-y-6">

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingUp className="w-16 h-16" /></div>
                                <span className="text-muted font-medium">Ingresos Totales</span>
                                <div className="text-3xl font-mono font-bold text-emerald-400">Q{totalIngresos.toLocaleString()}</div>
                            </div>
                            <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingDown className="w-16 h-16" /></div>
                                <span className="text-muted font-medium">Gastos Reales</span>
                                <div className="text-3xl font-mono font-bold text-rose-400">Q{totalGastosReales.toLocaleString()}</div>
                            </div>
                            <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group border-l-4 border-indigo-500">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign className="w-16 h-16" /></div>
                                <span className="text-muted font-medium">Balance Disponible</span>
                                <div className={`text-3xl font-mono font-bold ${balance >= 0 ? 'text-indigo-400' : 'text-amber-500'}`}>Q{balance.toLocaleString()}</div>
                            </div>
                        </div>

                        {/* Charts & Goals */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <ExpenseChart egresos={egresos} pagos={pagos} />
                            </div>
                            <div className="lg:col-span-1">
                                <SavingsGoal meta={metaAhorro} ahorro={ahorroActual} imageUrl={savingsImage} setMeta={setMetaAhorro} setAhorro={setAhorroActual} />
                            </div>
                        </div>

                        {/* Recent Lists */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="glass-panel rounded-xl overflow-hidden h-[500px] flex flex-col">
                                <TransactionList title="Ingresos Recientes" items={ingresos} icon={TrendingUp} colorClass="text-emerald-400"
                                    onAdd={() => { setEditingItem(null); setModalTypeExtended('ingreso'); }}
                                    onEdit={(item) => { setEditingItem(item); setModalTypeExtended('ingreso'); }}
                                    onDelete={(id) => deleteTransaction('ingreso', id)}
                                />
                            </div>
                            <div className="glass-panel rounded-xl overflow-hidden h-[500px] flex flex-col">
                                <TransactionList title="Gastos Recientes" items={egresos} icon={TrendingDown} colorClass="text-rose-400"
                                    onAdd={() => { setEditingItem(null); setModalTypeExtended('egreso'); }}
                                    onEdit={(item) => { setEditingItem(item); setModalTypeExtended('egreso'); }}
                                    onDelete={(id) => deleteTransaction('egreso', id)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* CONTENT: PLANNING */}
                {activeTab === 'planning' && (
                    <div className="animate-entry h-full">
                        <IncomePlanning
                            items={plannedIncomes}
                            onAdd={(item) => addTransaction('planned', item)}
                            onEdit={(item) => { setEditingItem(item); setModalTypeExtended('planned'); }}
                            onDelete={(id) => deleteTransaction('planned', id)}
                            onToggleReceived={toggleReceivedStatus}
                        />
                    </div>
                )}

                {/* CONTENT: FIXED PAYMENTS */}
                {activeTab === 'fixed' && (
                    <div className="animate-entry h-full">
                        <FixedPaymentsList
                            items={pagos}
                            onAdd={() => { setEditingItem(null); setModalTypeExtended('pago'); }}
                            onEdit={(item) => { setEditingItem(item); setModalTypeExtended('pago'); }}
                            onDelete={(id) => deleteTransaction('pago', id)}
                            onToggleStatus={togglePaymentStatus}
                        />
                    </div>
                )}
            </div>

            <TransactionModal
                isOpen={!!modalTypeExtended}
                type={modalTypeExtended === 'planned' ? 'ingreso' : modalTypeExtended}
                initialData={editingItem}
                onClose={() => { setModalTypeExtended(null); setEditingItem(null); }}
                onSave={handleSaveExtended}
            />
        </div>
    );
}
