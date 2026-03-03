import { Wrench, Bot, ExternalLink, ArrowRight, BookOpen, Book, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
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

const EngineeringPage = () => {
    const links = [
        { label: "GitHub", url: "https://github.com", icon: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" },
        { label: "Portal Ingeniería", url: "https://portal.ingenieria.usac.edu.gt", icon: "🏛️" },
        { label: "UEDI", url: "https://uedi.ingenieria.usac.edu.gt/campus", icon: "🎓" },
        { label: "Registro", url: "https://registro.usac.edu.gt", icon: "📊" },
        { label: "Dashboard", url: "https://dashboardacademico.ingenieria.usac.edu.gt/dashboard", icon: "📈" },
        { label: "DTT", url: "https://dtt-ecys.org", icon: "🌐" },
    ];

    return (
        <div className="p-4 h-full flex flex-col">
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                    <Wrench className="text-slate-400" /> Ingeniería en Sistemas
                </h2>
                <p className="text-slate-500 text-sm">Accesos rápidos a portales universitarios.</p>
            </header>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {links.map((link, idx) => (
                    <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-panel p-6 rounded-xl flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-all hover:-translate-y-1 group border border-white/5 hover:border-indigo-500/50"
                    >
                        {link.icon.startsWith('http') ? (
                            <img src={link.icon} alt={link.label} className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" />
                        ) : (
                            <div className="text-4xl group-hover:scale-110 transition-transform">{link.icon}</div>
                        )}
                        <span className="font-medium text-slate-300 text-center text-sm">{link.label}</span>
                        <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                    </a>
                ))}
            </div>
        </div>
    );
};

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

const TheologyPage = () => {
    const [pdfs, setPdfs] = useState<PdfResource[]>([]);
    const [selectedPdf, setSelectedPdf] = useState<PdfResource | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);

    useEffect(() => {
        api.get('/study/pdfs')
            .then(data => {
                if (Array.isArray(data)) setPdfs(data);
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

    const links = [
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {links.map((link, idx) => (
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
