import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    Wallet, Calendar, Wrench,
    Code, GraduationCap, BookOpen,
    Bell, CheckCircle, AlertCircle,
    ArrowUpRight, Sparkles, Target, Clock, Heart
} from 'lucide-react';
import { useFinance } from '../hooks/useFinance';
import { api } from '../utils/api';

export default function Dashboard() {
    const navigate = useNavigate();
    const { pagos } = useFinance();

    const [tasks, setTasks] = useState<{ id: number, text: string, description?: string, date: string, source: 'study' | 'plan', completed?: boolean }[]>([]);
    const [verse, setVerse] = useState<{ text: string, citation: string }>({ text: "Cargando...", citation: "" });
    const [quote, setQuote] = useState<{ text: string, author: string }>({ text: "Cargando...", author: "" });
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchTasks = async () => {
            let allTasks: any[] = [];
            try {
                const data = await api.get('/study');
                if (data.tasks) {
                    const studyTasks = data.tasks
                        .filter((t: any) => !t.completed && t.status !== 'completed')
                        .map((t: any) => ({ ...t, source: 'study' }));
                    allTasks = [...allTasks, ...studyTasks];
                }
            } catch (err) { console.error("Error loading study tasks", err); }

            try {
                const data = await api.get('/programming');
                const today = new Date().toISOString().split('T')[0];
                if (data.sections) {
                    data.sections.forEach((section: any) => {
                        section.items.forEach((item: any) => {
                            if (item.type === 'goal' && item.startDate && item.endDate) {
                                if (today >= item.startDate && today <= item.endDate) {
                                    const isDoneToday = item.dailyLogs?.[today]?.completed;
                                    if (!isDoneToday) {
                                        allTasks.push({
                                            id: item.id,
                                            text: `Meta: ${item.text}`,
                                            description: `Progreso diario pendiente`,
                                            date: today,
                                            source: 'plan'
                                        });
                                    }
                                }
                            } else if (!item.completed) {
                                allTasks.push({ id: item.id, text: item.text, date: 'Pendiente', source: 'plan' });
                            }
                        });
                    });
                }
            } catch (err) { console.error("Error loading plan tasks", err); }

            allTasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setTasks(allTasks);
        };

        fetchTasks();

        api.get('/devotional')
            .then(data => {
                const entries = data.entries || data.versiculos || [];
                if (entries.length > 0) {
                    const random = entries[Math.floor(Math.random() * entries.length)];
                    setVerse({
                        text: random.text || random.texto || random.verse || "No text",
                        citation: random.citation || random.cita || "Unknown"
                    });
                    if (entries.length > 1) {
                        const interval = setInterval(() => {
                            const nextRandom = entries[Math.floor(Math.random() * entries.length)];
                            setVerse({
                                text: nextRandom.text || nextRandom.texto || nextRandom.verse || "No text",
                                citation: nextRandom.citation || nextRandom.cita || "Unknown"
                            });
                        }, 30000);
                        return () => clearInterval(interval);
                    }
                } else {
                    setVerse({ text: "No hay versículos guardados aún.", citation: "Ve a Ajustes para agregar." });
                }
            })
            .catch(() => {
                setVerse({ text: "Error cargando versículos.", citation: "Intenta recargar." });
            });

        // Fetch motivational quotes
        api.get('/quotes')
            .then(data => {
                const entries = data.entries || [];
                if (entries.length > 0) {
                    const random = entries[Math.floor(Math.random() * entries.length)];
                    setQuote({ text: random.text || "", author: random.author || "" });
                    if (entries.length > 1) {
                        const interval = setInterval(() => {
                            const nextRandom = entries[Math.floor(Math.random() * entries.length)];
                            setQuote({ text: nextRandom.text || "", author: nextRandom.author || "" });
                        }, 30000);
                        return () => clearInterval(interval);
                    }
                } else {
                    setQuote({ text: "No hay frases guardadas aún.", author: "Ve a Ajustes para agregar." });
                }
            })
            .catch(() => {
                setQuote({ text: "Error cargando frases.", author: "Intenta recargar." });
            });
    }, []);

    const features = [
        { title: "Billetera", icon: Wallet, gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/20", path: "/wallet" },
        { title: "Horario", icon: Calendar, gradient: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20", path: "/schedule" },
        { title: "Tareas", icon: GraduationCap, gradient: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20", path: "/study" },
        { title: "Ingeniería", icon: Wrench, gradient: "from-slate-400 to-slate-600", shadow: "shadow-slate-500/20", path: "/engineering" },
        { title: "Teología", icon: BookOpen, gradient: "from-amber-400 to-yellow-600", shadow: "shadow-amber-400/20", path: "/theology" },
        { title: "Plan", icon: Code, gradient: "from-cyan-500 to-blue-600", shadow: "shadow-cyan-500/20", path: "/programming" },
    ];

    const pendingPayments = pagos.filter(p => !p.isPaid);

    const greeting = () => {
        const h = currentTime.getHours();
        if (h < 12) return "Buenos días";
        if (h < 18) return "Buenas tardes";
        return "Buenas noches";
    };

    const formattedDate = new Intl.DateTimeFormat('es-GT', {
        weekday: 'long', day: 'numeric', month: 'long'
    }).format(currentTime);

    return (
        <div className="space-y-6 pb-10 w-full max-w-7xl mx-auto animate-entry">
            {/* Hero Header */}
            <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent border border-white/5 p-6 md:p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">{formattedDate}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                            {greeting()}, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Marcos</span>
                        </h2>
                        <p className="text-slate-400 mt-1 text-sm">Tu centro de control está listo.</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        {currentTime.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {/* Verse Card */}
                <div className="group relative overflow-hidden rounded-2xl bg-[#14161b] border border-white/5 hover:border-purple-500/30 transition-all p-6 md:p-8 flex flex-col justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shadow-inner">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                            </div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Versículo</span>
                        </div>
                        <p className="text-base md:text-lg italic text-slate-200 leading-relaxed line-clamp-3">"{verse.text}"</p>
                        <p className="text-sm text-purple-400/80 mt-3 font-semibold">{verse.citation}</p>
                    </div>
                </div>

                {/* Motivational Quote Card */}
                <div className="group relative overflow-hidden rounded-2xl bg-[#14161b] border border-white/5 hover:border-rose-500/30 transition-all p-6 md:p-8 flex flex-col justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shadow-inner">
                                <Heart className="w-5 h-5 text-rose-400" />
                            </div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Frase del día</span>
                        </div>
                        <p className="text-base md:text-lg italic text-slate-200 leading-relaxed line-clamp-3">"{quote.text}"</p>
                        <p className="text-sm text-rose-400/80 mt-3 font-semibold">{quote.author}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Modules */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Target className="w-4 h-4" /> Módulos
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {features.map((feature, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => navigate(feature.path)}
                                    className={`group relative overflow-hidden rounded-xl bg-[#14161b] border border-white/5 hover:border-white/15 p-4 flex flex-col items-center gap-3 transition-all hover:-translate-y-1 hover:shadow-lg ${feature.shadow}`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500`} />
                                    <div className={`relative z-10 w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg ${feature.shadow} group-hover:scale-110 transition-transform duration-300`}>
                                        <feature.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="relative z-10 font-semibold text-slate-300 text-xs group-hover:text-white transition-colors">{feature.title}</span>
                                    <ArrowUpRight className="absolute top-3 right-3 w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="rounded-2xl bg-[#14161b] border border-white/5 p-5 h-full">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Bell className="w-4 h-4 text-amber-400" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Recordatorios</h3>
                        </div>

                        <div className="space-y-5">
                            {/* Pending Payments */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <AlertCircle className="w-3 h-3" /> Pagos Pendientes
                                </h4>
                                <div className="space-y-1.5">
                                    {pendingPayments.length === 0 ? (
                                        <p className="text-xs text-slate-600 italic">Al día ✓</p>
                                    ) : (
                                        pendingPayments.slice(0, 3).map(p => (
                                            <div key={p.id} className="flex justify-between items-center text-xs p-2.5 bg-white/[0.03] rounded-lg border-l-2 border-rose-500/60 hover:bg-white/[0.06] transition-colors">
                                                <span className="text-slate-400 truncate max-w-[120px]" title={p.descripcion}>{p.descripcion}</span>
                                                <span className="font-mono font-bold text-rose-400 text-[11px]">Q{p.monto}</span>
                                            </div>
                                        ))
                                    )}
                                    {pendingPayments.length > 3 && <p className="text-[10px] text-center text-slate-600">y {pendingPayments.length - 3} más...</p>}
                                </div>
                            </div>

                            {/* Tasks & Goals */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <CheckCircle className="w-3 h-3" /> Tareas & Metas
                                </h4>
                                <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                                    {tasks.length === 0 ? (
                                        <p className="text-xs text-slate-600 italic">Todo completado ✓</p>
                                    ) : (
                                        tasks.slice(0, 8).map((t, idx) => (
                                            <div key={idx} className={`flex flex-col gap-0.5 text-xs p-2.5 bg-white/[0.03] rounded-lg border-l-2 hover:bg-white/[0.06] transition-colors ${t.source === 'plan' ? 'border-cyan-500/60' : 'border-indigo-500/60'}`}>
                                                <div className="flex justify-between items-start gap-2">
                                                    <span className="font-semibold text-slate-300 line-clamp-1 flex-1">{t.text}</span>
                                                    <span className="text-[10px] text-slate-600 whitespace-nowrap">{t.date}</span>
                                                </div>
                                                {t.description && (
                                                    <p className="text-[11px] text-slate-500 line-clamp-1">{t.description}</p>
                                                )}
                                                <span className={`text-[9px] uppercase font-black mt-0.5 ${t.source === 'plan' ? 'text-cyan-500/60' : 'text-indigo-500/60'}`}>
                                                    {t.source === 'plan' ? 'Meta' : 'Tarea'}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
