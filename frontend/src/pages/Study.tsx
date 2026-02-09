import { useState, useEffect } from 'react';
import {
    Book, CheckSquare, Plus, Trash2,
    ChevronLeft, ChevronRight, ZoomIn, ZoomOut, GraduationCap, Clock
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

// Worker configuration
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Task {
    id: number;
    title: string;
    description: string;
    deadline?: string;
    subject?: string;
    status: string; // 'pending' | 'completed'
}

interface Concept {
    id: number;
    term: string;
    definition: string;
}

interface Resource {
    id: number;
    name: string;
    url: string;
    progress: number;
}

export default function StudyPage() {
    const { token } = useAuth();
    // --- Data State ---
    const [tasks, setTasks] = useState<Task[]>([]);
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [pdfs, setPdfs] = useState<Resource[]>([]);

    // Custom Categories State (Local for now, or fetch if implemented)
    const [categories, setCategories] = useState<string[]>(['Universidad', 'Iglesia', 'Personal', 'Otro']);

    // --- UI State ---
    const [activeTab, setActiveTab] = useState<'tasks' | 'glossary'>('tasks');
    const [taskTab, setTaskTab] = useState<'in_progress' | 'upcoming' | 'all' | 'finished'>('in_progress');

    // --- Task Form State ---
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newTask, setNewTask] = useState<Partial<Task & { subject: string, deadline: string }>>({ subject: 'Universidad', deadline: new Date().toISOString().split('T')[0] });
    const [newCategory, setNewCategory] = useState('');
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    // --- Concept Form State ---
    const [showConceptForm, setShowConceptForm] = useState(false);
    const [newConcept, setNewConcept] = useState<Partial<Concept>>({});

    // --- PDF Reader State ---
    const [selectedPdf, setSelectedPdf] = useState<Resource | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);

    // Fetch Data
    useEffect(() => {
        if (!token) return;
        api.get('/study')
            .then(data => {
                setTasks(data.tasks || []);
                setConcepts(data.concepts || []);
                setPdfs(data.pdfs || []);
                if (data.categories) setCategories(data.categories);
            })
            .catch(e => console.error(e));
    }, [token]);

    // --- TASK LOGIC ---
    const getFilteredTasks = () => {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];

        let filtered = [...tasks];

        if (taskTab === 'in_progress') {
            filtered = filtered.filter(t => t.status !== 'completed' && (t.deadline || '') <= today);
        } else if (taskTab === 'upcoming') {
            filtered = filtered.filter(t => t.status !== 'completed' && (t.deadline || '') > today && (t.deadline || '') <= nextWeekStr);
        } else if (taskTab === 'all') {
            filtered = filtered.filter(t => t.status !== 'completed');
        } else if (taskTab === 'finished') {
            filtered = filtered.filter(t => t.status === 'completed');
        }

        filtered.sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));
        return filtered;
    };

    const filteredTasks = getFilteredTasks();

    const handleAddTask = async () => {
        if (!newTask.title) return;
        let finalCategory = newTask.subject || 'Universidad';
        // Handle custom category logic (omitted complex sync for brevity, assuming simple usage)

        const payload = {
            text: newTask.title,
            description: newTask.description,
            date: newTask.deadline,
            category: finalCategory
        };

        try {
            if (editingId) {
                // Update
                setTasks(prev => prev.map(t => t.id === editingId ? { ...t, ...newTask } as Task : t)); // Optimistic
                await api.put(`/study/tasks/${editingId}`, payload);
                // Ideally refresh
            } else {
                // Create
                const saved = await api.post('/study/tasks', payload);
                setTasks(prev => [...prev, saved]);
            }
        } catch (e) {
            console.error(e);
        }

        setShowTaskForm(false);
        setEditingId(null);
        setNewTask({ subject: 'Universidad', deadline: new Date().toISOString().split('T')[0] });
    };

    const handleDeleteTask = async (id: number) => {
        if (!confirm("¿Eliminar tarea?")) return;
        setTasks(prev => prev.filter(t => t.id !== id));
        await api.delete(`/study/tasks/${id}`);
    };

    const toggleTask = async (id: number) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';

        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
        await api.put(`/study/tasks/${id}`, { completed: newStatus === 'completed' });
    };

    // --- CONCEPT LOGIC ---
    const handleAddConcept = async () => {
        if (!newConcept.term || !newConcept.definition) return;
        try {
            const saved = await api.post('/study/concepts', newConcept);
            setConcepts(prev => [...prev, saved]);
            setShowConceptForm(false);
            setNewConcept({});
        } catch (e) { console.error(e); }
    };

    const handleDeleteConcept = async (id: number) => {
        setConcepts(prev => prev.filter(c => c.id !== id));
        await api.delete(`/study/concepts/${id}`);
    };

    // --- PDF LOGIC ---
    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        if (selectedPdf && selectedPdf.progress) {
            setPageNumber(selectedPdf.progress);
        } else {
            setPageNumber(1);
        }
    };

    const changePage = (offset: number) => {
        setPageNumber(prev => {
            const newPage = Math.min(Math.max(1, prev + offset), numPages || 1);
            if (selectedPdf) {
                // Save progress
                api.put(`/study/pdfs/${selectedPdf.id}`, { progress: newPage });
                // Update local
                setPdfs(curr => curr.map(p => p.id === selectedPdf.id ? { ...p, progress: newPage } : p));
            }
            return newPage;
        });
    };

    // --- RENDER (Simplified for replacement) ---
    // Reusing existing UI code structure but binding to new handlers

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6 animate-entry pb-2">
            {/* LEFT Panel */}
            <div className="lg:w-1/3 flex flex-col gap-4 h-full overflow-hidden">
                <header className="flex justify-between items-center bg-black/20 p-1 rounded-lg shrink-0">
                    <button onClick={() => setActiveTab('tasks')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${activeTab === 'tasks' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                        <CheckSquare className="w-4 h-4" /> Tareas
                    </button>
                    <button onClick={() => setActiveTab('glossary')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${activeTab === 'glossary' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                        <GraduationCap className="w-4 h-4" /> Conceptos
                    </button>
                </header>

                {activeTab === 'tasks' ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Task Tabs */}
                        <div className="flex gap-2 mb-4 shrink-0 overflow-x-auto p-1 custom-scrollbar">
                            <button onClick={() => setTaskTab('in_progress')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${taskTab === 'in_progress' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'}`}>En Progreso</button>
                            <button onClick={() => setTaskTab('upcoming')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${taskTab === 'upcoming' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'}`}>Próximas (7d)</button>
                            <button onClick={() => setTaskTab('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${taskTab === 'all' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'}`}>Todas</button>
                            <button onClick={() => setTaskTab('finished')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${taskTab === 'finished' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'}`}>Finalizadas</button>
                        </div>

                        <div className="flex justify-between items-center mb-2 shrink-0">
                            <span className="text-slate-400 text-sm">{taskTab === 'in_progress' && 'Pendientes'}</span>
                            <button onClick={() => { setShowTaskForm(!showTaskForm); setEditingId(null); setNewTask({ subject: 'Universidad', deadline: new Date().toISOString().split('T')[0] }); }} className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"><Plus className="w-4 h-4 text-white" /></button>
                        </div>

                        {showTaskForm && (
                            <div className="glass-panel p-4 rounded-xl space-y-3 border-l-4 border-indigo-500 animate-slide-down shrink-0 mb-4">
                                <h4 className="text-sm font-bold text-slate-200 mb-2">{editingId ? 'Editar Tarea' : 'Nueva Tarea'}</h4>
                                <input className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200 outline-none" placeholder="Título..." value={newTask.title || ''} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                                <textarea className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200 outline-none resize-none h-16" placeholder="Descripción (opcional)..." value={newTask.description || ''} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
                                <input type="date" className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200" value={newTask.deadline} onChange={e => setNewTask({ ...newTask, deadline: e.target.value })} />
                                {/* Simplified category select */}
                                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200" value={newTask.subject} onChange={e => setNewTask({ ...newTask, subject: e.target.value })}>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowTaskForm(false)} className="flex-1 bg-white/5 p-2 rounded-lg text-sm text-slate-300">Cancelar</button>
                                    <button onClick={handleAddTask} className="flex-1 bg-indigo-600 p-2 rounded-lg text-sm text-white">Guardar</button>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 pb-4">
                            {filteredTasks.map(task => (
                                <div key={task.id} className={`p-4 rounded-xl border ${task.status === 'completed' ? 'bg-indigo-900/10 border-indigo-500/20 opacity-60' : 'bg-white/5 border-white/5'} transition-all group relative hover:border-indigo-500/30 cursor-pointer`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={task.status === 'completed'} onChange={() => toggleTask(task.id)} className="w-4 h-4 accent-indigo-500 cursor-pointer" />
                                            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">{task.subject}</span>
                                        </div>
                                        <button onClick={() => handleDeleteTask(task.id)} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    <h4 className={`font-bold text-slate-200 mb-1 ${task.status === 'completed' ? 'line-through' : ''}`}>{task.title}</h4>
                                    {task.description && <p className="text-sm text-slate-400 mb-2 whitespace-pre-wrap">{task.description}</p>}
                                    <span className="text-xs text-slate-500"><Clock className="w-3 h-3 inline mr-1" />{task.deadline}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex justify-between items-center shrink-0 mb-4">
                            <span className="text-slate-400 text-sm">Glosario</span>
                            <button onClick={() => setShowConceptForm(!showConceptForm)} className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500"><Plus className="w-4 h-4 text-white" /></button>
                        </div>
                        {showConceptForm && (
                            <div className="glass-panel p-4 rounded-xl space-y-3 border-l-4 border-indigo-500 animate-slide-down shrink-0 mb-4">
                                <input className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200" placeholder="Término..." value={newConcept.term || ''} onChange={e => setNewConcept({ ...newConcept, term: e.target.value })} />
                                <textarea className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200 resize-none h-20" placeholder="Definición..." value={newConcept.definition || ''} onChange={e => setNewConcept({ ...newConcept, definition: e.target.value })} />
                                <button onClick={handleAddConcept} className="w-full bg-indigo-600 text-white p-2 rounded-lg text-sm">Guardar</button>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                            {concepts.map(c => (
                                <div key={c.id} className="bg-white/5 p-4 rounded-xl border border-white/5 group relative">
                                    <button onClick={() => handleDeleteConcept(c.id)} className="absolute top-2 right-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                    <h4 className="font-bold text-indigo-400">{c.term}</h4>
                                    <p className="text-sm text-slate-300">{c.definition}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT Panel: PDFs */}
            <div className="lg:w-2/3 flex flex-col h-full bg-[#1a1d24] rounded-xl border border-white/5 overflow-hidden">
                {!selectedPdf ? (
                    <div className="flex-1 p-8 grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto">
                        {pdfs.length === 0 && <div className="col-span-full text-center text-slate-500">No hay PDFs.</div>}
                        {pdfs.map((pdf, idx) => (
                            <button key={idx} onClick={() => setSelectedPdf(pdf)} className="bg-white/5 p-6 rounded-xl border border-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all flex flex-col items-center text-center gap-3 group h-40 justify-center">
                                <div className="w-12 h-12 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform"><Book className="w-6 h-6" /></div>
                                <span className="text-sm font-medium text-slate-300 line-clamp-2">{pdf.name}</span>
                                {pdf.progress > 1 && <span className="text-xs text-emerald-400">Pág. {pdf.progress}</span>}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex items-center justify-between p-3 bg-black/20 border-b border-white/5 shrink-0">
                            <button onClick={() => setSelectedPdf(null)} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm"><ChevronLeft className="w-4 h-4" /> Volver</button>
                            <span className="text-sm font-bold text-slate-200 truncate max-w-[200px]">{selectedPdf.name}</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 hover:bg-white/10 rounded"><ZoomOut className="w-4 h-4 text-slate-400" /></button>
                                <span className="text-xs text-slate-400 w-8 text-center">{Math.round(scale * 100)}%</span>
                                <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-1.5 hover:bg-white/10 rounded"><ZoomIn className="w-4 h-4 text-slate-400" /></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto bg-[#525659] flex justify-center p-4">
                            <Document file={`http://localhost:3001${selectedPdf.url}`} onLoadSuccess={onDocumentLoadSuccess}>
                                <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} className="shadow-2xl" />
                            </Document>
                        </div>
                        {numPages && (
                            <div className="p-3 bg-black/20 border-t border-white/5 flex justify-center items-center gap-4 shrink-0">
                                <button onClick={() => changePage(-1)} disabled={pageNumber <= 1} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30"><ChevronLeft className="w-5 h-5 text-white" /></button>
                                <span className="text-sm text-slate-300">Página {pageNumber} de {numPages}</span>
                                <button onClick={() => changePage(1)} disabled={pageNumber >= numPages} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30"><ChevronRight className="w-5 h-5 text-white" /></button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
