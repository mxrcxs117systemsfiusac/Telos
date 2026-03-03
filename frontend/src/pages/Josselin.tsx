import { useState, useEffect } from 'react';
import { Heart, Plus, Trash2, X, Sparkles, ThumbsUp, ThumbsDown, Star, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

interface JosselinEntry {
    id: number;
    category: string;
    title: string;
    content: string;
    createdAt: string;
}

const CATEGORIES = [
    { key: 'progreso', label: 'Progreso', icon: Sparkles, color: 'from-pink-500 to-rose-500', accent: 'pink' },
    { key: 'le_gusta', label: 'Le Gusta', icon: ThumbsUp, color: 'from-emerald-500 to-teal-500', accent: 'emerald' },
    { key: 'no_le_gusta', label: 'No Le Gusta', icon: ThumbsDown, color: 'from-red-500 to-orange-500', accent: 'red' },
    { key: 'quiere', label: 'Lo Que Quiere', icon: Star, color: 'from-amber-500 to-yellow-500', accent: 'amber' },
    { key: 'info', label: 'Sobre Ella', icon: User, color: 'from-violet-500 to-purple-500', accent: 'violet' },
];

export default function JosselinPage() {
    const { token } = useAuth();
    const [entries, setEntries] = useState<JosselinEntry[]>([]);
    const [activeTab, setActiveTab] = useState('progreso');
    const [showForm, setShowForm] = useState(false);
    const [newEntry, setNewEntry] = useState({ title: '', content: '' });

    useEffect(() => {
        if (!token) return;
        api.get('/josselin')
            .then(data => {
                if (Array.isArray(data)) setEntries(data);
            })
            .catch(console.error);
    }, [token]);

    const activeCategory = CATEGORIES.find(c => c.key === activeTab)!;
    const filteredEntries = entries.filter(e => e.category === activeTab);

    const handleAdd = async () => {
        if (!newEntry.title.trim()) return;
        try {
            const saved = await api.post('/josselin', {
                category: activeTab,
                title: newEntry.title,
                content: newEntry.content
            });
            setEntries(prev => [saved, ...prev]);
            setShowForm(false);
            setNewEntry({ title: '', content: '' });
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar esta entrada?')) return;
        try {
            await api.delete(`/josselin/${id}`);
            setEntries(prev => prev.filter(e => e.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col animate-entry pb-2">
            {/* Header */}
            <header className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20">
                        <Heart className="w-7 h-7 text-pink-400" fill="currentColor" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-100">Josselin</h2>
                        <p className="text-slate-500 text-sm">Todo lo importante sobre ella 💖</p>
                    </div>
                </div>
            </header>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar shrink-0">
                {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const isActive = activeTab === cat.key;
                    return (
                        <button
                            key={cat.key}
                            onClick={() => { setActiveTab(cat.key); setShowForm(false); }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${isActive
                                    ? `bg-gradient-to-r ${cat.color} text-white shadow-lg shadow-${cat.accent}-500/25`
                                    : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-slate-200'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Action Bar */}
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold bg-gradient-to-r ${activeCategory.color} bg-clip-text text-transparent`}>
                            {activeCategory.label}
                        </span>
                        <span className="text-xs text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
                            {filteredEntries.length}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`p-2 rounded-xl transition-all ${showForm ? 'bg-rose-500/20 text-rose-400 rotate-45' : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:shadow-lg hover:shadow-pink-500/25'}`}
                    >
                        {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                </div>

                {/* Add Form */}
                {showForm && (
                    <div className="glass-panel p-5 rounded-2xl space-y-3 border-l-4 border-pink-500 animate-slide-down shrink-0 mb-4">
                        <h4 className="text-sm font-bold text-slate-200">Nueva entrada — {activeCategory.label}</h4>
                        <input
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-pink-500/50 transition-colors"
                            placeholder="Título..."
                            value={newEntry.title}
                            onChange={e => setNewEntry({ ...newEntry, title: e.target.value })}
                        />
                        <textarea
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-slate-200 outline-none resize-none h-24 focus:border-pink-500/50 transition-colors"
                            placeholder="Descripción (opcional)..."
                            value={newEntry.content}
                            onChange={e => setNewEntry({ ...newEntry, content: e.target.value })}
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setShowForm(false)} className="flex-1 bg-white/5 p-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/10 transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleAdd} className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 p-2.5 rounded-xl text-sm text-white font-medium hover:shadow-lg hover:shadow-pink-500/25 transition-all">
                                Guardar 💖
                            </button>
                        </div>
                    </div>
                )}

                {/* Entries Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="text-5xl mb-4 opacity-30">💝</div>
                            <p className="text-slate-500 text-sm">No hay entradas en "{activeCategory.label}" aún.</p>
                            <p className="text-slate-600 text-xs mt-1">Presiona + para agregar la primera.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 content-start">
                            {filteredEntries.map((entry, idx) => (
                                <div
                                    key={entry.id}
                                    className="group relative bg-[#14161b] border border-white/5 rounded-2xl p-5 hover:border-pink-500/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-500/5"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {/* Delete button */}
                                    <button
                                        onClick={() => handleDelete(entry.id)}
                                        className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Category indicator */}
                                    <div className={`w-8 h-1 rounded-full bg-gradient-to-r ${activeCategory.color} mb-4`} />

                                    <h4 className="font-bold text-slate-200 mb-2 pr-6">{entry.title}</h4>
                                    {entry.content && (
                                        <p className="text-sm text-slate-400 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                                    )}

                                    <div className="mt-4 pt-3 border-t border-white/5">
                                        <span className="text-[10px] text-slate-600">
                                            {new Date(entry.createdAt).toLocaleDateString('es-GT', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
