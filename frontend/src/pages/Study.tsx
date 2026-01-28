import { useState, useEffect } from 'react';
import {
    Book, CheckSquare, Clock, Plus, Trash2, FileText,
    ChevronLeft, ChevronRight, ZoomIn, ZoomOut, GraduationCap, X
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
    category: 'Universidad' | 'Iglesia' | 'Otro';
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

    // --- UI State ---
    const [activeTab, setActiveTab] = useState<'tasks' | 'glossary'>('tasks');

    // --- Task Form State ---
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState<Partial<Task>>({ category: 'Universidad', date: new Date().toISOString().split('T')[0] });

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
            })
            .catch(e => console.error(e));

        fetch('http://localhost:3001/api/study/pdfs')
            .then(r => r.json())
            .then(data => setPdfs(Array.isArray(data) ? data : []))
            .catch(e => console.error(e));
    }, []);

    // Save Data Helpers
    const saveStudyData = async (updatedTasks: Task[], updatedConcepts: Concept[], updatedProgress: PdfProgress) => {
        await fetch('http://localhost:3001/api/study', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: updatedTasks, concepts: updatedConcepts, pdfProgress: updatedProgress })
        });
    }

    // Task Handlers
    const handleAddTask = async () => {
        if (!newTask.text) return;
        const task: Task = {
            id: Date.now(),
            text: newTask.text,
            description: newTask.description || '',
            date: newTask.date || new Date().toISOString().split('T')[0],
            startTime: newTask.startTime,
            endTime: newTask.endTime,
            completed: false,
            category: newTask.category as any || 'Universidad'
        };
        const updated = [...tasks, task];
        setTasks(updated);
        await saveStudyData(updated, concepts, pdfProgress);
        setShowTaskForm(false);
        setNewTask({ category: 'Universidad', date: new Date().toISOString().split('T')[0] });
    };

    const handleDeleteTask = async (id: number) => {
        const updated = tasks.filter(t => t.id !== id);
        setTasks(updated);
        await saveStudyData(updated, concepts, pdfProgress);
    };

    const toggleTask = async (id: number) => {
        const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        setTasks(updated);
        await saveStudyData(updated, concepts, pdfProgress);
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
        await saveStudyData(tasks, updated, pdfProgress);
        setShowConceptForm(false);
        setNewConcept({});
    };

    const handleDeleteConcept = async (id: number) => {
        const updated = concepts.filter(c => c.id !== id);
        setConcepts(updated);
        await saveStudyData(tasks, updated, pdfProgress);
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
                saveStudyData(tasks, concepts, newProgress); // Saves silently
            }
            return newPage;
        });
    };

    return (
        <div className="h-full flex flex-col lg:flex-row gap-6 animate-entry">

            {/* LEFT Panel */}
            <div className="lg:w-1/3 flex flex-col gap-6">
                <header className="flex justify-between items-center bg-black/20 p-1 rounded-lg">
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
                    <>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Lista de pendientes</span>
                            <button onClick={() => setShowTaskForm(!showTaskForm)} className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">
                                <Plus className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        {showTaskForm && (
                            <div className="glass-panel p-4 rounded-xl space-y-3 border-l-4 border-indigo-500">
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
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        className="bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200"
                                        value={newTask.date}
                                        onChange={e => setNewTask({ ...newTask, date: e.target.value })}
                                    />
                                    <select
                                        className="bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200 flex-1"
                                        value={newTask.category}
                                        onChange={e => setNewTask({ ...newTask, category: e.target.value as any })}
                                    >
                                        <option value="Universidad">Universidad</option>
                                        <option value="Iglesia">Iglesia</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <textarea
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-200 resize-none h-20 focus:outline-none focus:border-indigo-500"
                                    placeholder="Descripción..."
                                    value={newTask.description || ''}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                />
                                <button onClick={handleAddTask} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg text-sm font-medium">Guardar Tarea</button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                            {tasks.length === 0 && <p className="text-slate-500 text-center py-4">No hay tareas pendientes.</p>}
                            {tasks.map(task => (
                                <div key={task.id} className={`p-4 rounded-xl border ${task.completed ? 'bg-indigo-900/10 border-indigo-500/20 opacity-60' : 'bg-white/5 border-white/5'} transition-all group relative`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => toggleTask(task.id)}
                                                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                                            />
                                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${task.category === 'Universidad' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{task.category}</span>
                                        </div>
                                        <button onClick={() => handleDeleteTask(task.id)} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h4 className={`font-bold text-slate-200 mb-1 ${task.completed ? 'line-through' : ''}`}>{task.text}</h4>
                                    {task.description && <p className="text-xs text-slate-400 mb-2">{task.description}</p>}
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.date}</span>
                                        {task.startTime && (
                                            <span className="text-indigo-400 font-medium">
                                                {task.startTime} {task.endTime ? `- ${task.endTime}` : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Glosario de Aprendizaje</span>
                            <button onClick={() => setShowConceptForm(!showConceptForm)} className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">
                                <Plus className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        {showConceptForm && (
                            <div className="glass-panel p-4 rounded-xl space-y-3 border-l-4 border-indigo-500 animate-slide-down">
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

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
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
                    </>
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
                                className="bg-white/5 p-6 rounded-xl border border-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all flex flex-col items-center text-center gap-3 group"
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
                    <div className="flex flex-col h-full">
                        {/* PDF Toolbar */}
                        <div className="flex items-center justify-between p-3 bg-black/20 border-b border-white/5">
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
                            <div className="p-3 bg-black/20 border-t border-white/5 flex justify-center items-center gap-4">
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
