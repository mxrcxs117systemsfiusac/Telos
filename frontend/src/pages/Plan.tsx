import { useState, useEffect } from 'react';
import { Code, CheckSquare, Plus, Trash2, FolderPlus, X, Save, FileText, Pencil, Check } from 'lucide-react';
import { api } from '../utils/api';

interface DailyLog {
    completed: boolean;
    status?: 'progressed' | 'not_progressed' | 'achieved' | null;
    learned: string;
    notes: string;
}

interface PlanItem {
    id: number;
    text: string;
    type: 'simple' | 'goal';
    completed?: boolean; // For simple items
    startDate?: string;
    endDate?: string;
    dailyLogs?: { [date: string]: DailyLog };
}

interface Section {
    id: number;
    title: string;
    items: PlanItem[];
}

interface LogModalData {
    sectionId: number;
    itemId: number;
    date: string;
    log: DailyLog;
}

export default function PlanPage() {
    const [sections, setSections] = useState<Section[]>([]);
    const [newSectionTitle, setNewSectionTitle] = useState('');

    // Form States
    const [showItemForm, setShowItemForm] = useState<{ sectionId: number } | null>(null);
    const [newItemText, setNewItemText] = useState('');
    const [newItemType, setNewItemType] = useState<'simple' | 'goal'>('simple');
    const [newItemStart, setNewItemStart] = useState('');
    const [newItemEnd, setNewItemEnd] = useState('');

    // Modal State
    const [logModal, setLogModal] = useState<LogModalData | null>(null);

    // Section Editing State
    const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
    const [editingSectionTitle, setEditingSectionTitle] = useState('');

    useEffect(() => {
        api.get('/programming')
            .then(data => {
                if (data.sections) {
                    setSections(data.sections);
                } else if (data.checklist) {
                    // Migration
                    const legItems = data.checklist.map((i: any) => ({ ...i, type: 'simple' }));
                    setSections([{ id: 1, title: 'General', items: legItems }]);
                }
            })
            .catch(err => console.error(err));
    }, []);

    const saveSections = async (updatedSections: Section[], manual = false) => {
        setSections(updatedSections);
        try {
            await api.post('/programming', { sections: updatedSections });
            if (manual) alert('Guardado correctamente');
        } catch (err: any) {
            console.error("Failed to save sections", err);
            if (manual) alert(`Error al guardar: ${err.message || 'Error desconocido'}`);
        }
    };

    const addSection = () => {
        if (!newSectionTitle.trim()) return;
        const newSection: Section = { id: Date.now(), title: newSectionTitle, items: [] };
        saveSections([...sections, newSection]);
        setNewSectionTitle('');
    };

    const deleteSection = (id: number) => {
        if (!confirm('Eliminar sección?')) return;
        saveSections(sections.filter(s => s.id !== id));
    };

    const startEditingSection = (section: Section) => {
        setEditingSectionId(section.id);
        setEditingSectionTitle(section.title);
    };

    const saveEditingSection = () => {
        if (!editingSectionId || !editingSectionTitle.trim()) return;
        const updated = sections.map(s =>
            s.id === editingSectionId ? { ...s, title: editingSectionTitle.trim() } : s
        );
        saveSections(updated);
        setEditingSectionId(null);
        setEditingSectionTitle('');
    };

    const cancelEditingSection = () => {
        setEditingSectionId(null);
        setEditingSectionTitle('');
    };

    const getMonthsBetween = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const months = [];

        let currentDate = new Date(startDate);
        currentDate.setDate(1); // Set to first of month to avoid skipping issues

        while (currentDate <= endDate || (currentDate.getMonth() === endDate.getMonth() && currentDate.getFullYear() === endDate.getFullYear())) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(currentDate);

            // Get all days in this month that fall within start-end range
            const daysInMonth = [];
            const daysInMonthTotal = new Date(year, month + 1, 0).getDate();

            for (let d = 1; d <= daysInMonthTotal; d++) {
                const dateObj = new Date(year, month, d);
                const dateStr = dateObj.toISOString().split('T')[0];

                // Check if date is within range
                if (dateStr >= start && dateStr <= end) {
                    daysInMonth.push(dateStr);
                }
            }

            if (daysInMonth.length > 0) {
                months.push({ name: monthName, days: daysInMonth });
            }

            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return months;
    };

    const calculateDays = (start: string, end: string) => {
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const days = [];
        for (let i = 0; i < diffDays; i++) {
            const d = new Date(s);
            d.setDate(d.getDate() + i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };

    const addItem = (sectionId: number) => {
        if (!newItemText.trim()) return;

        const newItem: PlanItem = {
            id: Date.now(),
            text: newItemText,
            type: newItemType,
            completed: false,
        };

        if (newItemType === 'goal') {
            if (!newItemStart || !newItemEnd) {
                alert('Selecciona fechas para la meta');
                return;
            }
            newItem.startDate = newItemStart;
            newItem.endDate = newItemEnd;
            newItem.dailyLogs = {};
        }

        const updatedSections = sections.map(s => {
            if (s.id === sectionId) {
                return { ...s, items: [...s.items, newItem] };
            }
            return s;
        });
        saveSections(updatedSections);

        // Reset form
        setNewItemText('');
        setNewItemStart('');
        setNewItemEnd('');
        setShowItemForm(null);
    };

    const simpleToggle = (sectionId: number, itemId: number) => {
        const updated = sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    items: s.items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i)
                };
            }
            return s;
        });
        saveSections(updated);
    };

    const deleteItem = (sectionId: number, itemId: number) => {
        if (!confirm("Eliminar tarea?")) return;
        const updated = sections.map(s => {
            if (s.id === sectionId) {
                return { ...s, items: s.items.filter(i => i.id !== itemId) };
            }
            return s;
        });
        saveSections(updated);
    };

    const openLogModal = (sectionId: number, itemId: number, date: string) => {
        const section = sections.find(s => s.id === sectionId);
        const item = section?.items.find(i => i.id === itemId);
        if (!item) return;

        const log = item.dailyLogs?.[date] || { completed: false, status: null, learned: '', notes: '' };

        // Backwards compatibility for 'completed' check
        if (!log.status && log.completed !== undefined) {
            if (log.completed) log.status = 'progressed';
        }

        setLogModal({ sectionId, itemId, date, log });
    };

    const saveLog = () => {
        if (!logModal) return;
        const { sectionId, itemId, date, log } = logModal;

        const updated = sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    items: s.items.map(i => i.id === itemId ? {
                        ...i,
                        dailyLogs: { ...i.dailyLogs, [date]: { ...log, completed: log.status === 'progressed' || log.status === 'achieved' } }
                    } : i)
                };
            }
            return s;
        });
        saveSections(updated);
        setLogModal(null);
    };

    // Calculate Progress
    const getProgress = (item: PlanItem) => {
        if (item.type === 'simple') return item.completed ? 100 : 0;
        if (!item.startDate || !item.endDate) return 0;

        const days = calculateDays(item.startDate, item.endDate);
        const completedCount = days.reduce((acc, date) => {
            const status = item.dailyLogs?.[date]?.status;
            return acc + (status === 'progressed' || status === 'achieved' || item.dailyLogs?.[date]?.completed ? 1 : 0);
        }, 0);
        return Math.round((completedCount / days.length) * 100);
    };

    const getStatusIcon = (status?: string | null, completed?: boolean) => {
        if (status === 'progressed' || status === 'achieved') return <CheckSquare className="w-4 h-4" />;
        if (status === 'not_progressed') return <X className="w-4 h-4" />;
        // Fallback
        if (completed) return <CheckSquare className="w-4 h-4" />;
        return null;
    };

    const getStatusColorClass = (status?: string | null, completed?: boolean) => {
        if (status === 'progressed' || status === 'achieved') return 'bg-emerald-500 text-black font-bold';
        if (status === 'not_progressed') return 'bg-rose-500 text-white font-bold';
        if (completed) return 'bg-emerald-500 text-black font-bold';
        return 'bg-white/10 text-slate-500 hover:bg-white/20';
    };


    return (
        <div className="h-full flex flex-col animate-entry relative">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
                        <Code className="text-emerald-400" /> Plan & Hábitos
                    </h2>
                    <p className="text-slate-500">Define tus metas, hábitos y progreso diario.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                        placeholder="Nueva Sección (ej. Hábitos)..."
                        value={newSectionTitle}
                        onChange={e => setNewSectionTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSection()}
                    />
                    <button onClick={addSection} className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg">
                        <FolderPlus className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => saveSections(sections)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
                    >
                        <Save className="w-5 h-5" /> Guardar Todo
                    </button>
                </div>
            </header>

            {/* Status Message */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {/* Hacky way to show status via console for now, or just trust the button visual feedback if added */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-20">
                {sections.map(section => (
                    <div key={section.id} className="glass-panel p-5 rounded-xl flex flex-col gap-4 border-t-4 border-emerald-500">
                        <div className="flex justify-between items-center">
                            {editingSectionId === section.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        className="bg-black/30 border border-emerald-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none flex-1"
                                        value={editingSectionTitle}
                                        onChange={e => setEditingSectionTitle(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') saveEditingSection();
                                            if (e.key === 'Escape') cancelEditingSection();
                                        }}
                                        autoFocus
                                    />
                                    <button onClick={saveEditingSection} className="text-emerald-400 hover:text-emerald-300 p-1">
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={cancelEditingSection} className="text-slate-500 hover:text-slate-300 p-1">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg text-slate-200" onDoubleClick={() => startEditingSection(section)}>{section.title}</h3>
                                    <button onClick={() => startEditingSection(section)} className="text-slate-600 hover:text-emerald-400 transition-colors" title="Editar nombre">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            <button onClick={() => deleteSection(section.id)} className="text-slate-600 hover:text-rose-400">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] custom-scrollbar pr-1">
                            {section.items.map(item => (
                                <div key={item.id} className="bg-white/5 p-3 rounded-lg border border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {item.type === 'simple' && (
                                                <button onClick={() => simpleToggle(section.id, item.id)} className={`w-4 h-4 rounded border flex items-center justify-center ${item.completed ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-slate-600'}`}>
                                                    {item.completed && <CheckSquare className="w-3 h-3" />}
                                                </button>
                                            )}
                                            <span className={`font-medium ${item.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{item.text}</span>
                                        </div>
                                        <button onClick={() => deleteItem(section.id, item.id)} className="text-slate-600 hover:text-rose-400">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {item.type === 'goal' && item.startDate && item.endDate && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>{item.startDate} - {item.endDate}</span>
                                                <span>{getProgress(item)}%</span>
                                            </div>
                                            <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${getProgress(item)}%` }}></div>
                                            </div>

                                            <div className="space-y-4">
                                                {getMonthsBetween(item.startDate, item.endDate).map(month => (
                                                    <div key={month.name}>
                                                        <h4 className="text-xs font-bold text-slate-400 mb-2 capitalize">{month.name}</h4>
                                                        <div className="grid grid-cols-7 gap-1">
                                                            {month.days.map((date) => {
                                                                const log = item.dailyLogs?.[date];
                                                                const status = log?.status;
                                                                const completed = log?.completed;
                                                                const dayNumber = new Date(date).getDate();

                                                                return (
                                                                    <button
                                                                        key={date}
                                                                        onClick={() => openLogModal(section.id, item.id, date)}
                                                                        title={date}
                                                                        className={`h-7 text-[10px] rounded flex items-center justify-center transition-colors ${getStatusColorClass(status, completed)}`}
                                                                    >
                                                                        {getStatusIcon(status, completed) || dayNumber}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add Item Form Toggle */}
                        {showItemForm?.sectionId === section.id ? (
                            <div className="bg-black/20 p-3 rounded-lg space-y-2 border border-white/10 animate-fade-in">
                                <input
                                    className="w-full bg-transparent border-b border-white/10 text-sm text-slate-200 p-1 focus:outline-none"
                                    placeholder="Título de tarea/meta..."
                                    value={newItemText}
                                    onChange={e => setNewItemText(e.target.value)}
                                />
                                <div className="flex gap-2 text-xs">
                                    <button onClick={() => setNewItemType('simple')} className={`px-2 py-1 rounded ${newItemType === 'simple' ? 'bg-emerald-600' : 'bg-white/10'}`}>Simple</button>
                                    <button onClick={() => setNewItemType('goal')} className={`px-2 py-1 rounded ${newItemType === 'goal' ? 'bg-emerald-600' : 'bg-white/10'}`}>Meta/Hábito</button>
                                </div>
                                {newItemType === 'goal' && (
                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                                        <div>
                                            <label>Inicio</label>
                                            <input type="date" className="w-full bg-white/5 rounded p-1" value={newItemStart} onChange={e => setNewItemStart(e.target.value)} />
                                        </div>
                                        <div>
                                            <label>Fin</label>
                                            <input type="date" className="w-full bg-white/5 rounded p-1" value={newItemEnd} onChange={e => setNewItemEnd(e.target.value)} />
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setShowItemForm(null)} className="text-slate-400 text-xs hover:text-white">Cancelar</button>
                                    <button onClick={() => addItem(section.id)} className="bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded hover:bg-emerald-400">Agregar</button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setShowItemForm({ sectionId: section.id })} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm mt-auto pt-4 border-t border-white/5">
                                <Plus className="w-4 h-4" /> Agregar Item
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal for Daily Log */}
            {logModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-100">Registro Diario</h3>
                            <button onClick={() => setLogModal(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                <span className="text-slate-300 text-sm font-medium">{logModal.date}</span>
                            </div>

                            <div className='flex gap-2 justify-between'>
                                <button
                                    onClick={() => setLogModal({ ...logModal, log: { ...logModal.log, status: 'progressed' } })}
                                    className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg border transition-all ${logModal.log.status === 'progressed' ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-slate-600 text-slate-400 hover:border-emerald-500'}`}
                                >
                                    Progresé
                                </button>
                                <button
                                    onClick={() => setLogModal({ ...logModal, log: { ...logModal.log, status: 'not_progressed' } })}
                                    className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg border transition-all ${logModal.log.status === 'not_progressed' ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-600 text-slate-400 hover:border-rose-500'}`}
                                >
                                    No progresé
                                </button>
                                <button
                                    onClick={() => setLogModal({ ...logModal, log: { ...logModal.log, status: 'achieved' } })}
                                    className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg border transition-all ${logModal.log.status === 'achieved' ? 'bg-amber-500 border-amber-500 text-black' : 'border-slate-600 text-slate-400 hover:border-amber-500'}`}
                                >
                                    Lo logré
                                </button>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1"><FileText className="w-3 h-3" /> ¿Qué progreso tuve hoy?</label>
                                <textarea
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-slate-200 focus:border-emerald-500 outline-none h-24 resize-none"
                                    placeholder="Resumen del progreso..."
                                    value={logModal.log.learned}
                                    onChange={e => setLogModal({ ...logModal, log: { ...logModal.log, learned: e.target.value } })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1"><FileText className="w-3 h-3" /> Notas Adicionales</label>
                                <textarea
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-slate-200 focus:border-emerald-500 outline-none h-20 resize-none"
                                    placeholder="Observaciones..."
                                    value={logModal.log.notes}
                                    onChange={e => setLogModal({ ...logModal, log: { ...logModal.log, notes: e.target.value } })}
                                />
                            </div>

                            <button onClick={saveLog} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20">
                                <Save className="w-5 h-5" /> Guardar Progreso
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
