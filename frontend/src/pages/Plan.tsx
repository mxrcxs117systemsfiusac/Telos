import { useState, useEffect } from 'react';
import { Code, CheckSquare, Plus, Trash2, FolderPlus, Calendar, X, Save, FileText, ChevronRight } from 'lucide-react';

interface DailyLog {
    completed: boolean;
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

    useEffect(() => {
        fetch('http://localhost:3001/api/programming')
            .then(res => res.json())
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

    const saveSections = async (updatedSections: Section[]) => {
        setSections(updatedSections);
        await fetch('http://localhost:3001/api/programming', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sections: updatedSections })
        });
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

    const calculateDays = (start: string, end: string) => {
        const s = new Date(start);
        const e = new Date(end);
        // Correct time zone offset issues by setting hours or just simple diff
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

        const log = item.dailyLogs?.[date] || { completed: false, learned: '', notes: '' };
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
                        dailyLogs: { ...i.dailyLogs, [date]: log }
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
            return acc + (item.dailyLogs?.[date]?.completed ? 1 : 0);
        }, 0);
        return Math.round((completedCount / days.length) * 100);
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
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-20">
                {sections.map(section => (
                    <div key={section.id} className="glass-panel p-5 rounded-xl flex flex-col gap-4 border-t-4 border-emerald-500">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-200">{section.title}</h3>
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
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>{item.startDate} - {item.endDate}</span>
                                                <span>{getProgress(item)}%</span>
                                            </div>
                                            <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${getProgress(item)}%` }}></div>
                                            </div>
                                            <div className="grid grid-cols-7 gap-1 mt-2">
                                                {calculateDays(item.startDate, item.endDate).map((date, idx) => {
                                                    const isDone = item.dailyLogs?.[date]?.completed;
                                                    return (
                                                        <button
                                                            key={date}
                                                            onClick={() => openLogModal(section.id, item.id, date)}
                                                            title={date}
                                                            className={`h-6 text-[10px] rounded flex items-center justify-center transition-colors ${isDone ? 'bg-emerald-500 text-black font-bold' : 'bg-white/10 text-slate-500 hover:bg-white/20'}`}
                                                        >
                                                            {idx + 1}
                                                        </button>
                                                    );
                                                })}
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

                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                <span className="text-slate-300 text-sm">{logModal.date}</span>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <span className="text-sm text-emerald-400 font-bold">Completado</span>
                                    <input
                                        type="checkbox"
                                        checked={logModal.log.completed}
                                        onChange={e => setLogModal({ ...logModal, log: { ...logModal.log, completed: e.target.checked } })}
                                        className="w-5 h-5 accent-emerald-500 rounded"
                                    />
                                </label>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1"><FileText className="w-3 h-3" /> ¿Qué aprendí hoy?</label>
                                <textarea
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-slate-200 focus:border-emerald-500 outline-none h-24 resize-none"
                                    placeholder="Resumen del aprendizaje..."
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
