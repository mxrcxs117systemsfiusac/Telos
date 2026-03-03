import { Wrench, Bot, ExternalLink, ArrowRight, BookOpen, Book, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Video, Plus, Trash2, X, Clock, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { api } from '../utils/api';

// Worker configuration
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfResource {
    id: number;
    name: string;
    url: string;
    progress: number;
}

interface ZoomLinkData {
    id: number;
    name: string;
    url: string;
    day: string;
    time: string;
}

interface MeetLinkData {
    id: number;
    course_name: string;
    url: string;
}

/** Helper: get Google favicon for a URL */
const getFavicon = (url: string) => {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
        return null;
    }
};

/* ===========================
   ENGINEERING PAGE
   =========================== */
const EngineeringPage = () => {
    const [meetLinks, setMeetLinks] = useState<MeetLinkData[]>([]);
    const [showMeetForm, setShowMeetForm] = useState(false);
    const [newMeet, setNewMeet] = useState({ course_name: '', url: '' });

    const links = [
        { label: "GitHub", url: "https://github.com", desc: "Repositorios y código fuente." },
        { label: "Portal Ingeniería", url: "https://portal.ingenieria.usac.edu.gt", desc: "Portal oficial de Ingeniería USAC." },
        { label: "UEDI", url: "https://uedi.ingenieria.usac.edu.gt/campus", desc: "Campus virtual UEDI." },
        { label: "Registro", url: "https://registro.usac.edu.gt", desc: "Sistema de registro USAC." },
        { label: "Dashboard", url: "https://dashboardacademico.ingenieria.usac.edu.gt/dashboard", desc: "Dashboard académico." },
        { label: "DTT", url: "https://dtt-ecys.org", desc: "DTT ECYS." },
    ];

    useEffect(() => {
        api.get('/engineering/meet-links')
            .then(data => { if (Array.isArray(data)) setMeetLinks(data); })
            .catch(console.error);
    }, []);

    const handleAddMeet = async () => {
        if (!newMeet.course_name.trim() || !newMeet.url.trim()) return;
        try {
            const saved = await api.post('/engineering/meet-links', newMeet);
            setMeetLinks(prev => [...prev, saved]);
            setShowMeetForm(false);
            setNewMeet({ course_name: '', url: '' });
        } catch (e) { console.error(e); }
    };

    const handleDeleteMeet = async (id: number) => {
        if (!confirm('¿Eliminar este link de Meet?')) return;
        await api.delete(`/engineering/meet-links/${id}`);
        setMeetLinks(prev => prev.filter(l => l.id !== id));
    };

    return (
        <div className="p-4 h-full flex flex-col animate-entry">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10">
                        <Wrench className="text-indigo-400 w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-100">Ingeniería en Sistemas</h2>
                        <p className="text-slate-500 text-sm">Accesos rápidos a portales universitarios.</p>
                    </div>
                </div>
            </header>

            {/* Portal Links — Premium Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {links.map((link, idx) => (
                    <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative overflow-hidden rounded-2xl bg-[#14161b] border border-white/5 hover:border-indigo-500/40 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500" />
                        <div className="p-6 flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300 shrink-0">
                                <img
                                    src={getFavicon(link.url) || ''}
                                    alt={link.label}
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-white mb-0.5 truncate">{link.label}</h3>
                                <p className="text-xs text-slate-500 line-clamp-1">{link.desc}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                        </div>
                    </a>
                ))}
            </div>

            {/* Meet Links Section */}
            <div className="bg-[#14161b] rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-blue-400" />
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Clases Virtuales (Meet)</h3>
                    </div>
                    <button
                        onClick={() => setShowMeetForm(!showMeetForm)}
                        className={`p-2 rounded-xl transition-all ${showMeetForm ? 'bg-rose-500/20 text-rose-400 rotate-45' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                    >
                        {showMeetForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                </div>

                {showMeetForm && (
                    <div className="p-5 border-b border-white/5 bg-black/20 animate-slide-down">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                className="flex-1 bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50"
                                placeholder="Nombre del curso..."
                                value={newMeet.course_name}
                                onChange={e => setNewMeet({ ...newMeet, course_name: e.target.value })}
                            />
                            <input
                                className="flex-1 bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50"
                                placeholder="URL de Google Meet..."
                                value={newMeet.url}
                                onChange={e => setNewMeet({ ...newMeet, url: e.target.value })}
                            />
                            <button onClick={handleAddMeet} className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors shrink-0">
                                Guardar
                            </button>
                        </div>
                    </div>
                )}

                <div className="p-5">
                    {meetLinks.length === 0 ? (
                        <div className="text-center text-slate-500 py-6 text-sm">
                            No hay links de Meet. Presiona + para agregar uno.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {meetLinks.map(link => (
                                <div key={link.id} className="group flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition-all">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                                        <img
                                            src="https://www.google.com/s2/favicons?domain=meet.google.com&sz=64"
                                            alt="Meet"
                                            className="w-6 h-6"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-slate-200 truncate">{link.course_name}</h4>
                                    </div>
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-600 hover:text-white transition-all shrink-0"
                                    >
                                        Unirse
                                    </a>
                                    <button
                                        onClick={() => handleDeleteMeet(link.id)}
                                        className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ===========================
   AI PAGE (unchanged)
   =========================== */
const AIPage = () => {

    const links = [
        { label: "Gemini", url: "https://gemini.google.com", icon: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg", desc: "Google's most capable AI model.", color: "from-blue-500 to-rose-500" },
        { label: "ChatGPT", url: "https://chat.openai.com", icon: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg", desc: "OpenAI's advanced language model.", color: "from-emerald-500 to-teal-500" },
        { label: "Perplexity", url: "https://perplexity.ai", icon: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Perplexity_AI_logo.svg", desc: "AI-powered answer engine.", color: "from-cyan-500 to-blue-500" },
        { label: "Claude", url: "https://claude.ai", icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Anthropic_logo.svg/2048px-Anthropic_logo.svg.png", desc: "Anthropic's helpful assistant.", color: "from-amber-500 to-orange-500" },
        { label: "DeepSeek", url: "https://chat.deepseek.com/", icon: "https://chat.deepseek.com/favicon.ico", desc: "DeepSeek Chat.", color: "from-blue-600 to-indigo-600" },
        { label: "Grok", url: "https://grok.com/", icon: "https://grok.com/favicon.ico", desc: "X.AI's humorous assistant.", color: "from-slate-500 to-gray-500" },
        { label: "Qwen", url: "https://chat.qwen.ai", icon: "https://chat.qwen.ai/favicon.ico", desc: "Alibaba's Qwen Chat.", color: "from-purple-500 to-violet-500" },
    ];

    return (
        <div className="p-4 h-full flex flex-col animate-entry">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
                    <Bot className="text-indigo-400 w-8 h-8" /> Central de Inteligencia
                </h2>
                <p className="text-slate-500">Selecciona tu asistente para hoy.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {links.map((ai, idx) => (
                    <div
                        key={idx}
                        className="group relative overflow-hidden rounded-2xl bg-[#14161b] border border-white/5 hover:border-white/20 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${ai.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                        <div className="p-8 flex flex-col items-center text-center h-full relative z-10">
                            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <img
                                    src={ai.icon}
                                    alt={ai.label}
                                    className="w-12 h-12 object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/2103/2103832.png"; }}
                                />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{ai.label}</h3>
                            <p className="text-sm text-slate-400 mb-6 line-clamp-2">{ai.desc}</p>

                            <a
                                href={ai.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-auto flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-indigo-600 rounded-full text-slate-200 hover:text-white transition-all text-sm font-medium group-hover:px-8 border border-white/5"
                            >
                                Iniciar Sesión <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ===========================
   THEOLOGY PAGE
   =========================== */
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const TheologyPage = () => {
    const [pdfs, setPdfs] = useState<PdfResource[]>([]);
    const [selectedPdf, setSelectedPdf] = useState<PdfResource | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);

    // Zoom links state
    const [zoomLinks, setZoomLinks] = useState<ZoomLinkData[]>([]);
    const [showZoomForm, setShowZoomForm] = useState(false);
    const [newZoom, setNewZoom] = useState({ name: '', url: '', day: 'Lunes', time: '19:00' });

    useEffect(() => {
        api.get('/study/pdfs')
            .then(data => {
                if (Array.isArray(data)) setPdfs(data);
            })
            .catch(console.error);

        api.get('/theology/zoom-links')
            .then(data => {
                if (Array.isArray(data)) setZoomLinks(data);
            })
            .catch(console.error);
    }, []);

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
                api.put(`/study/pdfs/${selectedPdf.id}`, { progress: newPage });
                setPdfs(curr => curr.map(p => p.id === selectedPdf.id ? { ...p, progress: newPage } : p));
            }
            return newPage;
        });
    };

    const handleAddZoom = async () => {
        if (!newZoom.name.trim() || !newZoom.url.trim()) return;
        try {
            const saved = await api.post('/theology/zoom-links', newZoom);
            setZoomLinks(prev => [...prev, saved]);
            setShowZoomForm(false);
            setNewZoom({ name: '', url: '', day: 'Lunes', time: '19:00' });
        } catch (e) { console.error(e); }
    };

    const handleDeleteZoom = async (id: number) => {
        if (!confirm('¿Eliminar este link de Zoom?')) return;
        await api.delete(`/theology/zoom-links/${id}`);
        setZoomLinks(prev => prev.filter(l => l.id !== id));
    };

    const resourceLinks = [
        {
            label: "Google Drive",
            url: "https://drive.google.com",
            icon: "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg",
            desc: "Archivos y documentos compartidos.",
            color: "from-yellow-500 to-green-500"
        },
        {
            label: "Google Classroom",
            url: "https://classroom.google.com",
            icon: "https://upload.wikimedia.org/wikipedia/commons/5/59/Google_Classroom_Logo.png",
            desc: "Clases, tareas y materiales.",
            color: "from-green-500 to-emerald-600"
        },
    ];

    return (
        <div className="p-4 h-full flex flex-col animate-entry">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10">
                        <BookOpen className="text-amber-400 w-7 h-7" />
                    </div>
                    Teología
                </h2>
                <p className="text-slate-500 mt-2">Acceso rápido a recursos de Teología.</p>
            </header>

            {/* Resource Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {resourceLinks.map((link, idx) => (
                    <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative overflow-hidden rounded-2xl bg-[#14161b] border border-white/5 hover:border-white/20 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/10"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                        <div className="p-8 flex flex-col items-center text-center relative z-10">
                            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <img
                                    src={link.icon}
                                    alt={link.label}
                                    className="w-12 h-12 object-contain"
                                />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{link.label}</h3>
                            <p className="text-sm text-slate-400 mb-6">{link.desc}</p>

                            <span className="mt-auto flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-amber-600 rounded-full text-slate-200 hover:text-white transition-all text-sm font-medium group-hover:px-8 border border-white/5">
                                Abrir <ArrowRight className="w-4 h-4" />
                            </span>
                        </div>
                    </a>
                ))}
            </div>

            {/* Zoom Links Section */}
            <div className="bg-[#14161b] rounded-2xl border border-white/5 overflow-hidden mb-8">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-blue-400" />
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Reuniones Zoom</h3>
                    </div>
                    <button
                        onClick={() => setShowZoomForm(!showZoomForm)}
                        className={`p-2 rounded-xl transition-all ${showZoomForm ? 'bg-rose-500/20 text-rose-400 rotate-45' : 'bg-amber-600 text-white hover:bg-amber-500'}`}
                    >
                        {showZoomForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                </div>

                {showZoomForm && (
                    <div className="p-5 border-b border-white/5 bg-black/20 animate-slide-down">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <input
                                className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-amber-500/50"
                                placeholder="Nombre de la reunión..."
                                value={newZoom.name}
                                onChange={e => setNewZoom({ ...newZoom, name: e.target.value })}
                            />
                            <input
                                className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-amber-500/50"
                                placeholder="URL de Zoom..."
                                value={newZoom.url}
                                onChange={e => setNewZoom({ ...newZoom, url: e.target.value })}
                            />
                            <select
                                className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-slate-200 outline-none"
                                value={newZoom.day}
                                onChange={e => setNewZoom({ ...newZoom, day: e.target.value })}
                            >
                                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <input
                                type="time"
                                className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-slate-200 outline-none"
                                value={newZoom.time}
                                onChange={e => setNewZoom({ ...newZoom, time: e.target.value })}
                            />
                        </div>
                        <button onClick={handleAddZoom} className="w-full bg-amber-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-amber-500 transition-colors">
                            Guardar Reunión
                        </button>
                    </div>
                )}

                <div className="p-5">
                    {zoomLinks.length === 0 ? (
                        <div className="text-center text-slate-500 py-6 text-sm">
                            No hay reuniones de Zoom. Presiona + para agregar una.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {zoomLinks.map(link => (
                                <div key={link.id} className="group flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition-all">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                                        <Video className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-slate-200 truncate">{link.name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Clock className="w-3 h-3" />
                                            <span>{link.day} — {link.time}</span>
                                        </div>
                                    </div>
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-600 hover:text-white transition-all shrink-0"
                                    >
                                        Unirse
                                    </a>
                                    <button
                                        onClick={() => handleDeleteZoom(link.id)}
                                        className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* PDF Library */}
            <div className="flex-1 flex flex-col bg-[#1a1d24] rounded-xl border border-white/5 overflow-hidden min-h-[400px]">
                <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                    <Book className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Biblioteca PDF</h3>
                </div>

                {!selectedPdf ? (
                    <div className="flex-1 p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto content-start">
                        {pdfs.length === 0 && <div className="col-span-full text-center text-slate-500 py-8">No hay PDFs. Súbelos desde Ajustes → Recursos Visuales.</div>}
                        {pdfs.map((pdf, idx) => (
                            <button key={idx} onClick={() => setSelectedPdf(pdf)} className="bg-white/5 p-6 rounded-xl border border-white/5 hover:bg-white/10 hover:border-amber-500/50 transition-all flex flex-col items-center text-center gap-3 group h-40 justify-center">
                                <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform"><Book className="w-6 h-6" /></div>
                                <span className="text-sm font-medium text-slate-300 line-clamp-2">{pdf.name}</span>
                                {pdf.progress > 1 && <span className="text-xs text-emerald-400">Pág. {pdf.progress}</span>}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col flex-1 overflow-hidden">
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
};

export { EngineeringPage, AIPage, TheologyPage };
