import { useState, useEffect } from 'react';
import { Heart, CheckSquare, Plus, Trash2, FolderPlus, X, Save, FileText, Pencil, Check, Sparkles, Star } from 'lucide-react';
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
    completed?: boolean;
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

export default function JosselinProgress() {
    const [sections, setSections] = useState<Section[]>([]);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [showItemForm, setShowItemForm] = useState<{ sectionId: number } | null>(null);
    const [newItemText, setNewItemText] = useState('');
    const [newItemType, setNewItemType] = useState<'simple' | 'goal'>('simple');
    const [newItemStart, setNewItemStart] = useState('');
    const [newItemEnd, setNewItemEnd] = useState('');
    const [logModal, setLogModal] = useState<LogModalData | null>(null);
    const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
    const [editingSectionTitle, setEditingSectionTitle] = useState('');

    useEffect(() => {
        api.get('/josselin-plan')
            .then(data => {
                if (data.sections) {
                    setSections(data.sections);
                }
            })
            .catch(err => console.error(err));
    }, []);

    const saveSections = async (updatedSections: Section[]) => {
        setSections(updatedSections);
        try {
            await api.post('/josselin-plan', { sections: updatedSections });
        } catch (err: any) {
            console.error("Failed to save plans", err);
        }
    };

    const addSection = () => {
        if (!newSectionTitle.trim()) return;
        const newSection: Section = { id: Date.now(), title: newSectionTitle, items: [] };
        saveSections([...sections, newSection]);
        setNewSectionTitle('');
    };

    const deleteSection = (id: number) => {
        if (!confirm('¿Eliminar sección?')) return;
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
        currentDate.setDate(1);

        while (currentDate <= endDate || (currentDate.getMonth() === endDate.getMonth() && currentDate.getFullYear() === endDate.getFullYear())) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(currentDate);

            const daysInMonth = [];
            const daysInMonthTotal = new Date(year, month + 1, 0).getDate();

            for (let d = 1; d <= daysInMonthTotal; d++) {
                const dateObj = new Date(year, month, d);
                const dateStr = dateObj.toISOString().split('T')[0];

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
                alert('Selecciona fechas para el progreso');
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
        if (!confirm("¿Eliminar progreso?")) return;
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
        if (status === 'progressed' || status === 'achieved') return <Heart className="w-4 h-4 text-white" fill="currentColor" />;
        if (status === 'not_progressed') return <X className="w-4 h-4" />;
        if (completed) return <Heart className="w-4 h-4 text-white" fill="currentColor" />;
        return null;
    };

    const getStatusColorClass = (status?: string | null, completed?: boolean) => {
        if (status === 'progressed' || status === 'achieved') return 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20 scale-105 z-10';
        if (status === 'not_progressed') return 'bg-black/30 border border-white/5 text-slate-500';
        if (completed) return 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20 scale-105 z-10';
        return 'bg-white/5 border border-white/5 text-slate-500 hover:bg-white/10 hover:border-pink-500/30';
    };

    return (
        <div className="h-full flex flex-col animate-entry relative mt-4">
            <header className="mb-6 flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <div>
                    <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                        <Sparkles className="text-pink-400 w-5 h-5" /> Nuestro Progreso
                    </h3>
                    <p className="text-slate-500 text-sm">Metas, acciones y pequeños detalles juntos.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500/50 transition-colors w-48"
                        placeholder="Nueva Categoría..."
                        value={newSectionTitle}
                        onChange={e => setNewSectionTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSection()}
                    />
                    <button onClick={addSection} className="bg-white/5 hover:bg-white/10 text-pink-400 p-2 rounded-xl border border-white/5 transition-colors">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pb-20 custom-scrollbar pr-2">
                {sections.map(section => (
                    <div key={section.id} className="bg-[#14161b] p-6 rounded-2xl flex flex-col gap-4 border border-white/5 hover:border-pink-500/20 transition-colors">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            {editingSectionId === section.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        className="bg-black/30 border border-pink-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none flex-1"
                                        value={editingSectionTitle}
                                        onChange={e => setEditingSectionTitle(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') saveEditingSection();
                                            if (e.key === 'Escape') cancelEditingSection();
                                        }}
                                        autoFocus
                                    />
                                    <button onClick={saveEditingSection} className="text-emerald-400 p-1"><Check className="w-4 h-4" /></button>
                                    <button onClick={cancelEditingSection} className="text-slate-500 p-1"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="bg-pink-500/10 p-2 rounded-lg">
                                        <Heart className="w-4 h-4 text-pink-400" />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-200" onDoubleClick={() => startEditingSection(section)}>{section.title}</h3>
                                    <button onClick={() => startEditingSection(section)} className="text-slate-600 hover:text-pink-400 opacity-0 group-hover:opacity-100 transition-all ml-2" title="Editar">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            <button onClick={() => deleteSection(section.id)} className="text-slate-600 hover:text-rose-400 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {section.items.map(item => (
                                <div key={item.id} className="bg-black/20 p-4 rounded-xl border border-white/5 relative overflow-hidden group">
                                    {/* Progress Background bar for goals */}
                                    {item.type === 'goal' && item.startDate && item.endDate && (
                                        <div
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500/5 to-rose-500/10 -z-10 transition-all"
                                            style={{ width: `${getProgress(item)}%` }}
                                        />
                                    )}

                                    <div className="flex justify-between items-start mb-3 z-10 relative">
                                        <div className="flex items-center gap-3">
                                            {item.type === 'simple' && (
                                                <button
                                                    onClick={() => simpleToggle(section.id, item.id)}
                                                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${item.completed ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20 scale-110' : 'bg-black/50 border border-white/10 hover:border-pink-500/50'}`}
                                                >
                                                    {item.completed && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                                                </button>
                                            )}
                                            {item.type === 'goal' && (
                                                <div className="w-5 h-5 flex items-center justify-center text-pink-400 opacity-50"><Star className="w-4 h-4" /></div>
                                            )}
                                            <span className={`font-medium transition-all ${item.completed ? 'text-slate-500 line-through decoration-pink-500/30' : 'text-slate-200'}`}>{item.text}</span>
                                        </div>
                                        <button onClick={() => deleteItem(section.id, item.id)} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {item.type === 'goal' && item.startDate && item.endDate && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-xs text-slate-500 font-medium">
                                                <span>{item.startDate} &rarr; {item.endDate}</span>
                                                <span className="text-pink-400">{getProgress(item)}%</span>
                                            </div>
                                            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-full transition-all duration-500 ease-out" style={{ width: `${getProgress(item)}%` }}></div>
                                            </div>

                                            <div className="space-y-4 pt-2">
                                                {getMonthsBetween(item.startDate, item.endDate).map(month => (
                                                    <div key={month.name}>
                                                        <h4 className="text-[10px] font-bold text-slate-500 mb-2 capitalize tracking-wider uppercase">{month.name}</h4>
                                                        <div className="grid grid-cols-7 gap-1.5">
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
                                                                        className={`h-8 text-[11px] rounded-lg flex items-center justify-center transition-all duration-200 ${getStatusColorClass(status, completed)}`}
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

                        {showItemForm?.sectionId === section.id ? (
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5 animate-slide-down">
                                <input
                                    className="w-full bg-transparent border-b border-white/10 text-sm text-slate-200 p-2 focus:outline-none focus:border-pink-500 transition-colors placeholder-slate-600"
                                    placeholder="Nombre de la acción o meta..."
                                    value={newItemText}
                                    onChange={e => setNewItemText(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2 text-xs mt-3 mb-3">
                                    <button onClick={() => setNewItemType('simple')} className={`flex-1 py-1.5 rounded-lg transition-colors border ${newItemType === 'simple' ? 'bg-pink-500/10 border-pink-500/50 text-pink-400' : 'bg-transparent border-white/5 text-slate-400'}`}>Simple</button>
                                    <button onClick={() => setNewItemType('goal')} className={`flex-1 py-1.5 rounded-lg transition-colors border ${newItemType === 'goal' ? 'bg-pink-500/10 border-pink-500/50 text-pink-400' : 'bg-transparent border-white/5 text-slate-400'}`}>Seguimiento (Días)</button>
                                </div>
                                {newItemType === 'goal' && (
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Inicio</label>
                                            <input type="date" className="w-full bg-black/50 border border-white/5 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-pink-500/30" value={newItemStart} onChange={e => setNewItemStart(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Fin</label>
                                            <input type="date" className="w-full bg-black/50 border border-white/5 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-pink-500/30" value={newItemEnd} onChange={e => setNewItemEnd(e.target.value)} />
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-end gap-2 text-sm mt-2">
                                    <button onClick={() => setShowItemForm(null)} className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-white/5 transition-colors">Cancelar</button>
                                    <button onClick={() => addItem(section.id)} className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 text-white font-medium hover:shadow-lg hover:shadow-pink-500/20 transition-all">Crear</button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setShowItemForm({ sectionId: section.id })} className="flex items-center justify-center gap-2 text-pink-400/70 hover:text-pink-400 text-sm mt-2 p-3 rounded-xl border border-dashed border-white/5 hover:border-pink-500/30 hover:bg-pink-500/5 transition-all">
                                <Plus className="w-4 h-4" /> Agregar acción
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {logModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-[#14161b] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2"><Heart className="w-5 h-5 text-pink-500" /> Registro del Día</h3>
                            <button onClick={() => setLogModal(null)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
                        </div>

                        <div className="space-y-5">
                            <div className="text-center">
                                <span className="inline-block bg-white/5 text-slate-300 text-sm font-medium px-4 py-1.5 rounded-full border border-white/5">
                                    {new Date(logModal.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <button
                                    onClick={() => setLogModal({ ...logModal, log: { ...logModal.log, status: 'progressed' } })}
                                    className={`py-3 px-2 text-sm font-bold rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${logModal.log.status === 'progressed' || logModal.log.status === 'achieved' ? 'bg-gradient-to-br from-pink-500 to-rose-500 border-transparent text-white shadow-lg shadow-pink-500/20' : 'bg-black/30 border-white/5 text-slate-400 hover:border-pink-500/50'}`}
                                >
                                    <Heart className="w-5 h-5" fill={logModal.log.status === 'progressed' || logModal.log.status === 'achieved' ? 'currentColor' : 'none'} />
                                    <span>Sí se pudo</span>
                                </button>
                                <button
                                    onClick={() => setLogModal({ ...logModal, log: { ...logModal.log, status: 'not_progressed' } })}
                                    className={`py-3 px-2 text-sm font-bold rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${logModal.log.status === 'not_progressed' ? 'bg-black/50 border-rose-500/50 text-rose-400' : 'bg-black/30 border-white/5 text-slate-400 hover:border-rose-500/30'}`}
                                >
                                    <X className="w-5 h-5" />
                                    <span>No se hizo</span>
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1.5 ml-1"><FileText className="w-3.5 h-3.5 text-pink-500/70" /> Resumen / Dedicatoria</label>
                                <textarea
                                    className="w-full bg-[#0a0c10] border border-white/5 rounded-xl p-3.5 text-sm text-slate-200 focus:border-pink-500/50 outline-none h-24 resize-none placeholder-slate-600 shadow-inner"
                                    placeholder="¿Qué logramos hoy?..."
                                    value={logModal.log.learned}
                                    onChange={e => setLogModal({ ...logModal, log: { ...logModal.log, learned: e.target.value } })}
                                />
                            </div>

                            <button onClick={saveLog} className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.3)] transform transition-all active:scale-[0.98]">
                                Guardar Corazón 💖
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
