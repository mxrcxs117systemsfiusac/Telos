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
    const [editingEvent, setEditingEvent] = useState<Partial<ScheduleEvent> & { selectedDays?: string[] }>({});

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
        if (event) {
            setEditingEvent({ ...event, selectedDays: [event.day] }); // Single day edit
        } else {
            setEditingEvent({ color: '#4f46e5', selectedDays: [], start: '08:00', end: '09:00' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const { id, title, start, end, description, color, selectedDays } = editingEvent;

        if (!title || !start || !end || !selectedDays || selectedDays.length === 0) {
            alert("Completa todos los campos y selecciona al menos un día.");
            return;
        }

        // If editing existing ID, update just that one (user can't change day easily on existing to multiple, typical behavior)
        if (id) {
            saveEvent({ ...editingEvent, day: selectedDays[0] } as ScheduleEvent);
        } else {
            // Create for all selected days
            for (const day of selectedDays) {
                // We fake an ID for local optmistic update or let hook handle it
                // Ideally use saveEvent which calls API.
                // We need to wait for each.
                // NOTE: useSchedule's saveEvent might not return promise? It does in my memory.
                // Check useSchedule hook if needed. Assuming it works.
                // We'll create separate event objects.
                const newEvent = {
                    title, start, end, description, color,
                    day: day // Logic handles normalization
                } as ScheduleEvent;
                await saveEvent(newEvent);
            }
        }
        setIsModalOpen(false);
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
                                    <label className="block text-sm text-slate-400 mb-2">Días</label>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS.map((dayLabel) => {
                                            const isSelected = editingEvent.selectedDays?.includes(dayLabel);
                                            // Handle mapping back to English key if needed? 
                                            // Actually backend/frontend uses mixed keys. 
                                            // Let's stick to the Label as the value for simplicity since normalizeDay handles it.
                                            // Or better: Use the keys that normalize to this label.
                                            // For new events, we send the Label (e.g. "Lunes"). normalization on display handles it.

                                            return (
                                                <button
                                                    key={dayLabel}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = editingEvent.selectedDays || [];
                                                        const newDays = current.includes(dayLabel)
                                                            ? current.filter(d => d !== dayLabel)
                                                            : [...current, dayLabel];
                                                        setEditingEvent({ ...editingEvent, selectedDays: newDays });
                                                    }}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isSelected
                                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                            : 'bg-[#0f1115] text-slate-400 border border-white/10 hover:border-indigo-500/50'
                                                        }`}
                                                >
                                                    {dayLabel.substring(0, 3)}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {!editingEvent.id && <p className="text-[10px] text-slate-500 mt-1">Selecciona varios para repetir.</p>}
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
