import { useState } from 'react';
import { Clock, Plus, Trash2, Loader2 } from 'lucide-react';
import { useSchedule, type ScheduleEvent } from '../hooks/useSchedule';

const DAY_MAP: Record<string, string> = {
    'monday': 'Lunes',
    'tuesday': 'Martes',
    'wednesday': 'Miércoles',
    'thursday': 'Jueves',
    'friday': 'Viernes',
    'saturday': 'Sábado',
    'sunday': 'Domingo',
    // Spanish mapping self-reference for normalization
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miércoles': 'Miércoles',
    'miercoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sábado': 'Sábado',
    'sabado': 'Sábado',
    'domingo': 'Domingo'
};
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Helper to normalize day string
const normalizeDay = (day: any): string => {
    if (!day) return '';
    if (typeof day !== 'string') return String(day); // Handle non-string cases gracefully
    const cleanDay = day.toLowerCase().trim();
    return DAY_MAP[cleanDay] || day; // Return mapped day or original if not found
};

export default function SchedulePage() {
    const { schedule, isLoaded, saveEvent, deleteEvent } = useSchedule();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Partial<ScheduleEvent>>({});

    if (!isLoaded) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-indigo-500" /></div>;
    }

    const { startHour, endHour } = schedule.config;
    const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

    const getEventStyle = (event: ScheduleEvent) => {
        const [startH, startM] = event.start.split(':').map(Number);
        const [endH, endM] = event.end.split(':').map(Number);

        const startOffset = (startH - startHour) * 60 + startM;
        const duration = (endH * 60 + endM) - (startH * 60 + startM);

        return {
            top: `${startOffset}px`,
            height: `${duration}px`,
            backgroundColor: event.color || '#4f46e5'
        };
    };

    const handleEdit = (event?: ScheduleEvent) => {
        setEditingEvent(event || { color: '#4f46e5', day: 'Monday' });
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingEvent.day && editingEvent.start && editingEvent.end && editingEvent.title) {
            // Ensure we save a standardized day key if the backend relies on it, 
            // but for now we accept what the user selected in the dropdown (which is keyed by English in original, but let's be flexible).
            // Actually, the dropdown below uses Object.entries(DAY_MAP) which might duplicates generic keys.
            // Let's fix the dropdown options too.
            saveEvent(editingEvent as ScheduleEvent);
            setIsModalOpen(false);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <Clock className="text-indigo-400" /> Horario Semanal
                    </h2>
                    <p className="text-slate-500 text-sm">Organiza tu tiempo académico y personal</p>
                </div>
                <div className="flex gap-3">

                    <button
                        onClick={() => handleEdit()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Evento
                    </button>
                </div>
            </header>

            {/* Schedule Grid Container */}
            <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col relative">
                {/* Header Row */}
                <div className="grid grid-cols-8 border-b border-white/10 bg-[#1a1d24]">
                    <div className="p-3 text-center text-xs font-bold text-slate-500 border-r border-white/5">Hora</div>
                    {DAYS.map(day => (
                        <div key={day} className="p-3 text-center text-xs font-bold text-slate-300 border-r border-white/5 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    <div className="grid grid-cols-8 relative" style={{ height: `${hours.length * 60}px` }}>
                        {/* Hour Column */}
                        <div className="border-r border-white/5 bg-[#14161b]">
                            {hours.map(h => (
                                <div key={h} className="h-[60px] border-b border-white/5 text-xs text-slate-500 p-2 text-right relative">
                                    <span className="-top-2 relative">{h}:00</span>
                                </div>
                            ))}
                        </div>

                        {/* Day Columns */}
                        {DAYS.map(dayMsg => {
                            // Filter events that match this day using normalization
                            const dayEvents = schedule.events.filter(e => normalizeDay(e.day) === dayMsg);

                            return (
                                <div key={dayMsg} className="border-r border-white/5 relative bg-[#0f1115]/50">
                                    {/* Grid Lines */}
                                    {hours.map(h => (
                                        <div key={h} className="h-[60px] border-b border-white/5 mx-2"></div>
                                    ))}

                                    {/* Events */}
                                    {dayEvents.map(event => (
                                        <div
                                            key={event.id}
                                            onClick={() => handleEdit(event)}
                                            className="absolute left-1 right-1 rounded-md p-2 text-xs text-white shadow-lg cursor-pointer hover:brightness-110 transition-all z-10 overflow-hidden"
                                            style={getEventStyle(event)}
                                        >
                                            <div className="font-bold leading-tight">{event.title}</div>
                                            <div className="text-[10px] opacity-80 truncate">{event.description}</div>
                                            <div className="text-[10px] opacity-80 mt-1">{event.start} - {event.end}</div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1d24] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {editingEvent.id ? 'Editar Evento' : 'Nuevo Evento'}
                        </h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Título</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-[#0f1115] border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={editingEvent.title || ''}
                                    onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Día</label>
                                    <select
                                        className="w-full bg-[#0f1115] border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={editingEvent.day}
                                        onChange={e => setEditingEvent({ ...editingEvent, day: e.target.value })}
                                    >
                                        {Object.entries(DAY_MAP).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Color</label>
                                    <input
                                        type="color"
                                        className="w-full h-10 bg-[#0f1115] border border-white/10 rounded-lg p-1"
                                        value={editingEvent.color}
                                        onChange={e => setEditingEvent({ ...editingEvent, color: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Inicio (HH:MM)</label>
                                    <input
                                        type="time"
                                        className="w-full bg-[#0f1115] border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={editingEvent.start || ''}
                                        onChange={e => setEditingEvent({ ...editingEvent, start: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Fin (HH:MM)</label>
                                    <input
                                        type="time"
                                        className="w-full bg-[#0f1115] border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={editingEvent.end || ''}
                                        onChange={e => setEditingEvent({ ...editingEvent, end: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Descripción</label>
                                <textarea
                                    className="w-full bg-[#0f1115] border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
                                    value={editingEvent.description || ''}
                                    onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                {editingEvent.id && (
                                    <button
                                        type="button"
                                        onClick={() => { deleteEvent(editingEvent.id!); setIsModalOpen(false); }}
                                        className="p-3 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                                <div className="flex-1 flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
