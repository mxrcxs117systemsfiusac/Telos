import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    Wallet, Calendar, Wrench,
    Code, GraduationCap, Brain,
    ExternalLink, Bell, CheckCircle, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { useFinance } from '../hooks/useFinance';
import { useSchedule } from '../hooks/useSchedule';

export default function Dashboard() {
    const navigate = useNavigate();
    const { balance, pagos, isLoaded: financeLoaded } = useFinance();
    const { schedule, isLoaded: scheduleLoaded } = useSchedule();

    // State
    const [tasks, setTasks] = useState<{ id: number, text: string, description?: string, date: string, source: 'study' | 'plan', completed?: boolean }[]>([]);
    const [verse, setVerse] = useState<{ text: string, citation: string }>({ text: "Cargando...", citation: "" });
    const [showBalance, setShowBalance] = useState(false);

    // Toggle Balance
    const toggleBalance = () => {
        const newState = !showBalance;
        setShowBalance(newState);
        localStorage.setItem('finance_show_balance', String(newState));
    };

    useEffect(() => {
        const fetchTasks = async () => {
            let allTasks: any[] = [];

            // 1. Fetch Study Tasks
            try {
                const res = await fetch('http://localhost:3001/api/study');
                const data = await res.json();
                if (data.tasks) {
                    const studyTasks = data.tasks
                        .filter((t: any) => !t.completed)
                        .map((t: any) => ({ ...t, source: 'study' }));
                    allTasks = [...allTasks, ...studyTasks];
                }
            } catch (err) { console.error("Error loading study tasks", err); }

            // 2. Fetch Plan Goals/Habits (Active today)
            try {
                const res = await fetch('http://localhost:3001/api/programming');
                const data = await res.json();
                const today = new Date().toISOString().split('T')[0];

                if (data.sections) {
                    data.sections.forEach((section: any) => {
                        section.items.forEach((item: any) => {
                            // If it's a Goal/Habit logic
                            if (item.type === 'goal' && item.startDate && item.endDate) {
                                if (today >= item.startDate && today <= item.endDate) {
                                    // Check if logged today
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
                                // Simple item
                                // allTasks.push({ id: item.id, text: item.text, date: 'Pendiente', source: 'plan' });
                            }
                        });
                    });
                }
            } catch (err) { console.error("Error loading plan tasks", err); }

            // Sort by date (ascending)
            allTasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            setTasks(allTasks);
        };

        fetchTasks();

        // Fetch Verse (Devotional)
        fetch('http://localhost:3001/api/devotional')
            .then(res => res.json())
            .then(data => {
                const entries = data.entries || data.versiculos || [];
                if (entries.length > 0) {
                    const random = entries[Math.floor(Math.random() * entries.length)];
                    setVerse({
                        text: random.text || random.texto || random.verse || "No text",
                        citation: random.citation || random.cita || "Unknown"
                    });
                } else {
                    setVerse({ text: "Todo lo puedo en Cristo que me fortalece.", citation: "Filipenses 4:13" });
                }
            })
            .catch(err => {
                setVerse({ text: "Todo lo puedo en Cristo que me fortalece.", citation: "Filipenses 4:13" });
            });
    }, []);

    const features = [
        { title: "Billetera", icon: Wallet, color: "text-emerald-400", path: "/wallet" },
        { title: "Horario", icon: Calendar, color: "text-blue-400", path: "/schedule" },
        { title: "Estudio", icon: GraduationCap, color: "text-amber-400", path: "/study" },
        // Devotional removed
        { title: "Ingeniería", icon: Wrench, color: "text-slate-400", path: "/engineering" },
        { title: "IA", icon: Brain, color: "text-indigo-400", path: "/ai" },
        { title: "Plan Dev", icon: Code, color: "text-cyan-400", path: "/programming" },
    ];

    const externalLinks = [
        { label: "DTT", url: "https://dtt-ecys.org", icon: "🌐" },
        { label: "Dashboard Ing", url: "https://dashboardacademico.ingenieria.usac.edu.gt/dashboard", icon: "📈" },
        { label: "Portal Ing", url: "https://portal.ingenieria.usac.edu.gt", icon: "🏛️" },
    ];

    // Calculate Next Class
    const getNextClass = () => {
        if (!scheduleLoaded || !schedule.events.length) return null;


        const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        const now = new Date();
        const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Mon, ... 6=Sun
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;

        // Helper to parse time string "HH:MM" -> minutes
        const parseTime = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        // Check today first
        const todayKey = dayOrder[currentDayIndex];
        const todayEvents = schedule.events
            .filter((e: any) => e.day.toLowerCase() === todayKey)
            .sort((a: any, b: any) => parseTime(a.start) - parseTime(b.start));

        const nextToday = todayEvents.find((e: any) => parseTime(e.start) > currentTime);
        if (nextToday) return { ...nextToday, isToday: true, dayName: todayKey };

        // Check future days
        for (let i = 1; i < 7; i++) {
            const nextDayIndex = (currentDayIndex + i) % 7;
            const nextDayKey = dayOrder[nextDayIndex];

            const nextDayEvents = schedule.events
                .filter((e: any) => e.day.toLowerCase() === nextDayKey)
                .sort((a: any, b: any) => parseTime(a.start) - parseTime(b.start));

            if (nextDayEvents.length > 0) {
                return { ...nextDayEvents[0], isToday: false, dayName: nextDayKey };
            }
        }

        return null;
    };

    const translateDay = (day: string) => {
        const days: Record<string, string> = {
            'monday': 'Lunes',
            'tuesday': 'Martes',
            'wednesday': 'Miércoles',
            'thursday': 'Jueves',
            'friday': 'Viernes',
            'saturday': 'Sábado',
            'sunday': 'Domingo'
        };
        return days[day.toLowerCase()] || day;
    };

    const nextClass = getNextClass();
    const pendingPayments = pagos.filter(p => !p.isPaid);

    return (
        <div className="space-y-8 animate-entry pb-10 w-full max-w-7xl mx-auto">
            <header className="mb-8 block md:flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-slate-100">Hola, Marcos</h2>
                    <p className="text-slate-500">Bienvenido a tu Centro de Control Total.</p>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="glass-panel p-5 rounded-xl border-l-4 border-indigo-500">
                    <h3 className="text-slate-400 text-sm font-medium uppercase">Próxima Clase</h3>
                    {nextClass ? (
                        <>
                            <p className="text-xl font-bold mt-1 truncate">{nextClass.title}</p>
                            <div className="flex flex-col mt-2">
                                <span className="text-xs text-indigo-400 font-medium">
                                    {nextClass.isToday ? 'HOY' : translateDay(nextClass.dayName)}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {nextClass.start} - {nextClass.end}
                                </span>
                            </div>
                        </>
                    ) : (
                        <p className="text-slate-500 italic mt-1">No hay clases programadas</p>
                    )}
                </div>
                <div className="glass-panel p-5 rounded-xl border-l-4 border-emerald-500 relative group">
                    <div className="flex justify-between items-start">
                        <h3 className="text-slate-400 text-sm font-medium uppercase">Finanzas</h3>
                        <button onClick={toggleBalance} className="text-slate-500 hover:text-white transition-colors">
                            {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className={`text-xl font-bold mt-1 ${financeLoaded ? '' : 'animate-pulse bg-white/10 w-20 h-6 rounded'}`}>
                        {financeLoaded ? (showBalance ? `Q${balance.toLocaleString()}` : '*******') : ''}
                    </p>
                    <p className="text-xs text-emerald-400 mt-2">Balance Actual</p>
                </div>
                <div className="glass-panel p-5 rounded-xl border-l-4 border-purple-500">
                    <h3 className="text-slate-400 text-sm font-medium uppercase">Versículo del Día</h3>
                    <p className="text-sm italic mt-1">"{verse.text}"</p>
                    <p className="text-xs text-purple-400 mt-2">{verse.citation}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content (Modules) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Modules */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-200 mb-4">Módulos</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {features.map((feature, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => navigate(feature.path)}
                                    className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all hover:-translate-y-1 group"
                                >
                                    <div className={`p-3 rounded-xl bg-white/5 group-hover:scale-110 transition-transform ${feature.color}`}>
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                    <span className="font-medium text-slate-300 text-sm">{feature.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick External Links */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-200 mb-4">Accesos Rápidos</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {externalLinks.map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="glass-panel p-4 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all group"
                                >
                                    <span className="text-2xl">{link.icon}</span>
                                    <span className="font-medium text-slate-300 text-sm flex-1">{link.label}</span>
                                    <ExternalLink className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar (Reminders) */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-xl h-full">
                        <div className="flex items-center gap-2 mb-6">
                            <Bell className="w-5 h-5 text-amber-400" />
                            <h3 className="text-lg font-bold text-slate-200">Recordatorios</h3>
                        </div>

                        <div className="space-y-6">
                            {/* Payments */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3" /> Pagos Pendientes
                                </h4>
                                <div className="space-y-2">
                                    {pendingPayments.length === 0 ? (
                                        <p className="text-sm text-slate-500 italic">Al día con tus pagos.</p>
                                    ) : (
                                        pendingPayments.slice(0, 3).map(p => (
                                            <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-white/5 rounded border-l-2 border-rose-500">
                                                <span className="text-slate-300 truncate w-32" title={p.descripcion}>{p.descripcion}</span>
                                                <span className="font-mono text-rose-400">Q{p.monto}</span>
                                            </div>
                                        ))
                                    )}
                                    {pendingPayments.length > 3 && <p className="text-xs text-center text-slate-500">y {pendingPayments.length - 3} más...</p>}
                                </div>
                            </div>

                            {/* Tasks & Goals */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3" /> Tareas & Metas
                                </h4>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                    {tasks.length === 0 ? (
                                        <p className="text-sm text-slate-500 italic">Todo completado.</p>
                                    ) : (
                                        tasks.slice(0, 10).map((t, idx) => (
                                            <div key={idx} className={`flex flex-col gap-1 text-sm p-3 bg-white/5 rounded border-l-2 ${t.source === 'plan' ? 'border-cyan-500' : 'border-indigo-500'}`}>
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-slate-200 line-clamp-1">{t.text}</span>
                                                    <span className="text-xs text-slate-500 whitespace-nowrap">{t.date}</span>
                                                </div>
                                                {t.description && (
                                                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{t.description}</p>
                                                )}
                                                <span className={`text-[10px] uppercase font-bold mt-1 ${t.source === 'plan' ? 'text-cyan-400' : 'text-indigo-400'}`}>
                                                    {t.source === 'plan' ? 'Meta Diaria' : 'Estudio'}
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
