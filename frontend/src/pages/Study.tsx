import { useState, useEffect } from 'react';
import {
    Book, CheckSquare, Clock, Plus, Trash2, FileText,
    ChevronLeft, ChevronRight, ZoomIn, ZoomOut, GraduationCap
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Worker configuration
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Task {
    id: number;
    text: string;
    description: string;
    date: string; // YYYY-MM-DD
    startTime?: string;
    endTime?: string;
    completed: boolean;
    category: string;
}

interface Concept {
    id: number;
    term: string;
    definition: string;
}

interface PdfProgress {
    [filename: string]: number; // page number
}

export default function StudyPage() {
    // --- Data State ---
    const [tasks, setTasks] = useState<Task[]>([]);
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [pdfs, setPdfs] = useState<{ name: string, url: string }[]>([]);
    const [pdfProgress, setPdfProgress] = useState<PdfProgress>({});

    // Custom Categories State
    const [categories, setCategories] = useState<string[]>(['Universidad', 'Iglesia', 'Personal', 'Otro']);

    // --- UI State ---
    const [activeTab, setActiveTab] = useState<'tasks' | 'glossary'>('tasks');
    const [taskTab, setTaskTab] = useState<'in_progress' | 'upcoming' | 'finished'>('in_progress');

    // --- Task Form State ---
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newTask, setNewTask] = useState<Partial<Task>>({ category: 'Universidad', date: new Date().toISOString().split('T')[0] });
    const [newCategory, setNewCategory] = useState('');
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    // --- Concept Form State ---
    const [showConceptForm, setShowConceptForm] = useState(false);
    const [newConcept, setNewConcept] = useState<Partial<Concept>>({});

    // --- PDF Reader State ---
    const [selectedPdf, setSelectedPdf] = useState<{ name: string, url: string } | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);

    // Fetch Data
    useEffect(() => {
        fetch('http://localhost:3001/api/study')
            .then(r => r.json())
            .then(data => {
                setTasks(data.tasks || []);
                setConcepts(data.concepts || []);
                setPdfProgress(data.pdfProgress || {});
                if (data.categories && Array.isArray(data.categories)) {
                    setCategories(data.categories);
                }
            })
            .catch(e => console.error(e));

        fetch('http://localhost:3001/api/study/pdfs')
            .then(r => r.json())
            .then(data => setPdfs(Array.isArray(data) ? data : []))
            .catch(e => console.error(e));
    }, []);

    // Save Data Helpers
    const saveStudyData = async (updatedTasks: Task[], updatedConcepts: Concept[], updatedProgress: PdfProgress, updatedCategories: string[]) => {
        await fetch('http://localhost:3001/api/study', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: updatedTasks, concepts: updatedConcepts, pdfProgress: updatedProgress, categories: updatedCategories })
        });
    }

    // Task Logic: Filtering & Sorting
    const getFilteredTasks = () => {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];

        let filtered = [...tasks];

        // 1. Filter by Tab
        if (taskTab === 'in_progress') {
            filtered = filtered.filter(t => !t.completed); // Active tasks (all active, or maybe just today/past?)
            // Requirement says "Tareas activas actuales". Let's show ALL active tasks here for now, or maybe prioritize.
            // Actually, "Upcoming" is specifically next 7 days.
            // Let's make "In Progress" be everything not completed, maybe excluding far future?
            // User asked: "En Progreso: Tareas activas actuales." "Próximas: Tareas cuya fecha de vencimiento esté dentro de los próximos 7 días."
            // If I have a task for next month, where does it go?
            // Let's assume 'In Progress' is general active backlog, but since 'Upcoming' exists, let's make a distinction.
            // Maybe "In Progress" = Due today or past due? A stricter definition.
            // Let's try: In Progress = !completed (All pending) OR maybe !completed AND date <= today?
            // Let's stick to a simple split:
            // Finished = completed
            // Upcoming = !completed AND date > today AND date <= today+7
            // In Progress = !completed AND (date <= today OR date > today+7 ??? No, that's weird).
            // Let's make 'In Progress' = ALL Pending tasks, sorted by date.
            // AND 'Upcoming' = subset of pending that are soon.
            // User request:
            // 1. En Progreso: Tareas activas actuales.
            // 2. Próximas: Tareas cuya fecha de vencimiento esté dentro de los próximos 7 días.
            // 3. Finalizadas: Historial de tareas completadas.

            // Interpretation:
            // Finished: completed = true
            // Upcoming: completed = false && date > today && date <= today + 7
            // In Progress: completed = false (Default view) OR maybe "Do Now" (today/overdue)?
            // Let's make "In Progress" = Today + Overdue + Others?
            // Actually usually "In Progress" implies "Working on it".
            // Let's do:
            // Finished: completed === true
            // Upcoming: completed === false && date > today && date <= nextWeek
            // In Progress: completed === false && date <= today  (Overdue + Today) check?
            // Let's try this strict split to avoid duplicates? Or can Upcoming overlap?
            // "Próximas" usually implies future. "En Progreso" implies now.
            // So:
            // In Progress: !completed && date <= today
            // Upcoming: !completed && date > today
            // Finished: completed

            filtered = filtered.filter(t => !t.completed && t.date <= today);
        } else if (taskTab === 'upcoming') {
            filtered = filtered.filter(t => !t.completed && t.date > today && t.date <= nextWeekStr);
        } else if (taskTab === 'finished') {
            filtered = filtered.filter(t => t.completed);
        }

        // 2. Sort by Date Ascending
        filtered.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            // Secondary sort by time if available
            if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
            return 0;
        });

        return filtered;
    };

    const filteredTasks = getFilteredTasks();

    // Task Handlers
    const handleAddTask = async () => {
        if (!newTask.text) return;

        let finalCategory = newTask.category || 'Universidad';
        let updatedCategories = [...categories];

        if (isCustomCategory && newCategory.trim()) {
            finalCategory = newCategory.trim();
            if (!categories.includes(finalCategory)) {
                updatedCategories.push(finalCategory);
                setCategories(updatedCategories);
            }
        }

        let updatedTasks = [...tasks];

        if (editingId) {
            // Update existing
            updatedTasks = tasks.map(t => t.id === editingId ? {
                ...t,
                text: newTask.text!,
                description: newTask.description || '',
                date: newTask.date || new Date().toISOString().split('T')[0],
                startTime: newTask.startTime,
                endTime: newTask.endTime,
                category: finalCategory
            } : t);
        } else {
            // Create new
            const task: Task = {
                id: Date.now(),
                text: newTask.text,
                description: newTask.description || '',
                date: newTask.date || new Date().toISOString().split('T')[0],
                startTime: newTask.startTime,
                endTime: newTask.endTime,
                completed: false,
                category: finalCategory
            };
            updatedTasks.push(task);
        }

        setTasks(updatedTasks);
        await saveStudyData(updatedTasks, concepts, pdfProgress, updatedCategories);

        // Reset
        setShowTaskForm(false);
        setEditingId(null);
        setNewTask({ category: 'Universidad', date: new Date().toISOString().split('T')[0] });
        setNewCategory('');
        setIsCustomCategory(false);
    };

    const startEditTask = (task: Task) => {
        setNewTask({ ...task });
        setEditingId(task.id);
        setShowTaskForm(true);
        if (!categories.includes(task.category)) {
            // handle custom category hidden logic if needed
        }
        setIsCustomCategory(false);
        setNewCategory('');
    };

    const handleDeleteTask = async (id: number) => {
        if (!confirm("¿Eliminar tarea?")) return;
        const updated = tasks.filter(t => t.id !== id);
        setTasks(updated);
        await saveStudyData(updated, concepts, pdfProgress, categories);
    };

    const toggleTask = async (id: number) => {
        const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        setTasks(updated);
        await saveStudyData(updated, concepts, pdfProgress, categories);
    };

    // Concept Handlers
    const handleAddConcept = async () => {
        if (!newConcept.term || !newConcept.definition) return;
        const concept: Concept = {
            id: Date.now(),
            term: newConcept.term,
            definition: newConcept.definition
        };
        const updated = [...concepts, concept];
        setConcepts(updated);
        await saveStudyData(tasks, updated, pdfProgress, categories);
        setShowConceptForm(false);
        setNewConcept({});
    };

    const handleDeleteConcept = async (id: number) => {
        const updated = concepts.filter(c => c.id !== id);
        setConcepts(updated);
        await saveStudyData(tasks, updated, pdfProgress, categories);
    };

    // PDF Handlers
    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        // Load progress
        if (selectedPdf && pdfProgress[selectedPdf.name]) {
            setPageNumber(pdfProgress[selectedPdf.name]);
        } else {
            setPageNumber(1);
        }
    };

    const changePage = (offset: number) => {
        setPageNumber(prev => {
            const newPage = Math.min(Math.max(1, prev + offset), numPages || 1);
            // Auto save progress
            if (selectedPdf) {
                const newProgress = { ...pdfProgress, [selectedPdf.name]: newPage };
                setPdfProgress(newProgress);
                saveStudyData(tasks, concepts, newProgress, categories); // Saves silently
            }
            return newPage;
        });
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6 animate-entry pb-2">

            {/* LEFT Panel */}
            <div className="lg:w-1/3 flex flex-col gap-4 h-full overflow-hidden">
                <header className="flex justify-between items-center bg-black/20 p-1 rounded-lg shrink-0">
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${activeTab === 'tasks' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <CheckSquare className="w-4 h-4" /> Tareas
                    </button>
                    <button
                        onClick={() => setActiveTab('glossary')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${activeTab === 'glossary' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <GraduationCap className="w-4 h-4" /> Conceptos
                    </button>
                </header>

                {activeTab === 'tasks' ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Task Tabs */}
                        <div className="flex gap-2 mb-4 shrink-0 overflow-x-auto p-1 custom-scrollbar">
                            <button
                                onClick={() => setTaskTab('in_progress')}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${taskTab === 'in_progress' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'}`}
                            >
                                En Progreso
                            </button>
                            <button
                                onClick={() => setTaskTab('upcoming')}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${taskTab === 'upcoming' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'}`}
                            >
                                Próximas (7d)
                            </button>
                            <button
                                onClick={() => setTaskTab('finished')}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${taskTab === 'finished' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'}`}
                            >
                                Finalizadas
                            </button>
                        </div>

                        <div className="flex justify-between items-center mb-2 shrink-0">
                            <span className="text-slate-400 text-sm">
                                {taskTab === 'in_progress' && 'Pendientes (Hoy/Atrasado)'}
                                {taskTab === 'upcoming' && 'Próxima Semana'}
                                {taskTab === 'finished' && 'Completadas'}
                            </span>
                            <button onClick={() => {
                                setShowTaskForm(!showTaskForm);
                                setEditingId(null);
                                setNewTask({ category: 'Universidad', date: new Date().toISOString().split('T')[0] });
                                setIsCustomCategory(false);
                            }} className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">
                                <Plus className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        {showTaskForm && (
                            <div className="glass-panel p-4 rounded-xl space-y-3 border-l-4 border-indigo-500 animate-slide-down shrink-0 mb-4">
                                <h4 className="text-sm font-bold text-slate-200 mb-2">{editingId ? 'Editar Tarea' : 'Nueva Tarea'}</h4>
                                <input
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                    placeholder="Título de la tarea..."
                                    value={newTask.text || ''}
                                    onChange={e => setNewTask({ ...newTask, text: e.target.value })}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="time"
                                        className="bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200"
                                        value={newTask.startTime || ''}
                                        onChange={e => setNewTask({ ...newTask, startTime: e.target.value })}
                                    />
                                    <input
                                        type="time"
                                        className="bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200"
                                        value={newTask.endTime || ''}
                                        onChange={e => setNewTask({ ...newTask, endTime: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="date"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200"
                                        value={newTask.date}
                                        onChange={e => setNewTask({ ...newTask, date: e.target.value })}
                                    />

                                    {!isCustomCategory ? (
                                        <div className="flex gap-2">
                                            <select
                                                className="bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200 flex-1"
                                                value={newTask.category}
                                                onChange={e => {
                                                    if (e.target.value === 'new_custom') {
                                                        setIsCustomCategory(true);
                                                    } else {
                                                        setNewTask({ ...newTask, category: e.target.value as any });
                                                    }
                                                }}
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                                <option value="new_custom">+ Crear Categoría</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                className="bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200 flex-1"
                                                placeholder="Nombre de categoría..."
                                                value={newCategory}
                                                onChange={e => setNewCategory(e.target.value)}
                                            />
                                            <button onClick={() => setIsCustomCategory(false)} className="bg-white/10 p-2 rounded text-xs text-slate-400">Cancelar</button>
                                        </div>
                                    )}
                                </div>
                                <textarea
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200 resize-none h-20 focus:outline-none focus:border-indigo-500"
                                    placeholder="Descripción..."
                                    value={newTask.description || ''}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => setShowTaskForm(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 p-2 rounded-lg text-sm">Cancelar</button>
                                    <button onClick={handleAddTask} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg text-sm font-medium">
                                        {editingId ? 'Actualizar' : 'Guardar'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 pb-4">
                            {filteredTasks.length === 0 && <p className="text-slate-500 text-center py-4">No hay tareas.</p>}
                            {filteredTasks.map(task => (
                                <div key={task.id}
                                    className={`p-4 rounded-xl border ${task.completed ? 'bg-indigo-900/10 border-indigo-500/20 opacity-60' : 'bg-white/5 border-white/5'} transition-all group relative hover:border-indigo-500/30 cursor-pointer`}
                                    onClick={(e) => {
                                        // If clicking checkboxes or buttons, don't edit
                                        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) return;
                                        startEditTask(task);
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => toggleTask(task.id)}
                                                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                                            />
                                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400`}>{task.category}</span>
                                        </div>
                                        <button onClick={() => handleDeleteTask(task.id)} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h4 className={`font-bold text-slate-200 mb-1 ${task.completed ? 'line-through' : ''}`}>{task.text}</h4>
                                    {task.description && <p className="text-xs text-slate-400 mb-2">{task.description}</p>}
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span className={`flex items-center gap-1 ${task.date < new Date().toISOString().split('T')[0] && !task.completed ? 'text-rose-400 font-bold' : ''}`}>
                                            <Clock className="w-3 h-3" /> {task.date}
                                        </span>
                                        {task.startTime && (
                                            <span className="text-indigo-400 font-medium">
                                                {task.startTime} {task.endTime ? `- ${task.endTime}` : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex justify-between items-center shrink-0 mb-4">
                            <span className="text-slate-400 text-sm">Glosario de Aprendizaje</span>
                            <button onClick={() => setShowConceptForm(!showConceptForm)} className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">
                                <Plus className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        {showConceptForm && (
                            <div className="glass-panel p-4 rounded-xl space-y-3 border-l-4 border-indigo-500 animate-slide-down shrink-0 mb-4">
                                <input
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                    placeholder="Término / Concepto..."
                                    value={newConcept.term || ''}
                                    onChange={e => setNewConcept({ ...newConcept, term: e.target.value })}
                                />
                                <textarea
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200 resize-none h-24 focus:outline-none focus:border-indigo-500"
                                    placeholder="Definición o significado..."
                                    value={newConcept.definition || ''}
                                    onChange={e => setNewConcept({ ...newConcept, definition: e.target.value })}
                                />
                                <button onClick={handleAddConcept} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg text-sm font-medium">Guardar Concepto</button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 pb-4">
                            {concepts.length === 0 && <p className="text-slate-500 text-center py-4">No hay conceptos guardados.</p>}
                            {concepts.map(concept => (
                                <div key={concept.id} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all group">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-indigo-400">{concept.term}</h4>
                                        <button onClick={() => handleDeleteConcept(concept.id)} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed">{concept.definition}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: PDF Reader */}
            <div className="lg:w-2/3 flex flex-col h-full bg-[#1a1d24] rounded-xl border border-white/5 overflow-hidden">
                {!selectedPdf ? (
                    <div className="flex-1 p-8 grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto">
                        {pdfs.length === 0 && (
                            <div className="col-span-full h-full flex flex-col items-center justify-center text-slate-500">
                                <FileText className="w-16 h-16 mb-4 opacity-20" />
                                <p>Carga PDFs desde Ajustes</p>
                            </div>
                        )}
                        {pdfs.map((pdf, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedPdf(pdf)}
                                className="bg-white/5 p-6 rounded-xl border border-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all flex flex-col items-center text-center gap-3 group h-40 justify-center"
                            >
                                <div className="w-12 h-12 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                                    <Book className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-medium text-slate-300 line-clamp-2">{pdf.name}</span>
                                {pdfProgress[pdf.name] && <span className="text-xs text-emerald-400">Pág. {pdfProgress[pdf.name]}</span>}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* PDF Toolbar */}
                        <div className="flex items-center justify-between p-3 bg-black/20 border-b border-white/5 shrink-0">
                            <button onClick={() => setSelectedPdf(null)} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
                                <ChevronLeft className="w-4 h-4" /> Volver
                            </button>
                            <span className="text-sm font-bold text-slate-200 truncate max-w-[200px]">{selectedPdf.name}</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 hover:bg-white/10 rounded"><ZoomOut className="w-4 h-4 text-slate-400" /></button>
                                <span className="text-xs text-slate-400 w-8 text-center">{Math.round(scale * 100)}%</span>
                                <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-1.5 hover:bg-white/10 rounded"><ZoomIn className="w-4 h-4 text-slate-400" /></button>
                            </div>
                        </div>

                        {/* PDF Content */}
                        <div className="flex-1 overflow-auto bg-[#525659] flex justify-center p-4 relative">
                            <Document
                                file={`http://localhost:3001${selectedPdf.url}`}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={<div className="text-white">Cargando PDF...</div>}
                                error={<div className="text-rose-400">Error cargando PDF</div>}
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    scale={scale}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    className="shadow-2xl"
                                />
                            </Document>
                        </div>

                        {/* Pagination Footer */}
                        {numPages && (
                            <div className="p-3 bg-black/20 border-t border-white/5 flex justify-center items-center gap-4 shrink-0">
                                <button onClick={() => changePage(-1)} disabled={pageNumber <= 1} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30">
                                    <ChevronLeft className="w-5 h-5 text-white" />
                                </button>
                                <span className="text-sm text-slate-300">
                                    Página <input
                                        type="number"
                                        value={pageNumber}
                                        onChange={e => {
                                            const val = parseInt(e.target.value);
                                            if (val > 0 && val <= numPages) changePage(val - pageNumber);
                                        }}
                                        className="w-12 bg-black/30 border border-white/10 rounded text-center mx-1 focus:outline-none focus:border-indigo-500"
                                    /> de {numPages}
                                </span>
                                <button onClick={() => changePage(1)} disabled={pageNumber >= numPages} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30">
                                    <ChevronRight className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

}
