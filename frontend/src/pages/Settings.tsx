import { useState, useEffect } from 'react';
import { Upload, Image, FileText, Database, Check, Trash2, User, Settings, Heart } from 'lucide-react';
import { api } from '../utils/api';

const FILE_BASE_URL = 'http://localhost:3001';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [statusMsg, setStatusMsg] = useState('');

    // State for Profile
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password && password !== confirmPassword) {
            showStatus('Las contraseñas no coinciden', true);
            return;
        }

        try {
            const data = await api.post('/auth/update-profile', {
                username: username || undefined,
                password: password || undefined
            });

            if (data.token) localStorage.setItem('token', data.token);
            showStatus('Perfil actualizado correctamente');
            setPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            showStatus(err.message || 'Error al actualizar', true);
        }
    };

    // State for Data Status
    const [hasVerses, setHasVerses] = useState(false);
    const [hasQuotes, setHasQuotes] = useState(false);

    // State for Image Upload
    const [uploadingImg, setUploadingImg] = useState(false);
    const [savingsImage, setSavingsImage] = useState<string | null>(null);
    const [pdfs, setPdfs] = useState<{ name: string, url: string }[]>([]);

    useEffect(() => {
        // Check status on load
        api.get('/devotional').then(data => {
            if (data.entries?.length > 0 || data.versiculos?.length > 0) setHasVerses(true);
        }).catch(() => { });

        api.get('/finance').then(data => {
            if (data.savingsImage) setSavingsImage(data.savingsImage);
        }).catch(() => { });

        // Schedule check removed

        api.get('/study/pdfs').then(data => {
            if (Array.isArray(data)) setPdfs(data);
        }).catch(() => { });

        api.get('/quotes').then(data => {
            if (data.entries?.length > 0) setHasQuotes(true);
        }).catch(() => { });
    }, [activeTab]);

    // Helpers
    const showStatus = (msg: string, isError = false) => {
        setStatusMsg(msg);
        if (!isError) {
            setTimeout(() => setStatusMsg(''), 3000);
        }
    };

    const handleReset = async (type: 'schedule' | 'verses') => {
        if (!confirm('¿Estás seguro de eliminar estos datos?')) return;

        try {
            if (type === 'verses') {
                await api.post('/devotional', { entries: [] });
                setHasVerses(false);
                showStatus('Versículos eliminados');
            } else {
                await api.post('/schedule', { config: { startHour: 7, endHour: 21 }, events: [] });
                showStatus('Horario reiniciado');
            }
        } catch (err) {
            showStatus('Error al reiniciar', true);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm(`¿Estás seguro de subir la imagen "${file.name}"? Reemplazará la actual.`)) {
            e.target.value = '';
            return;
        }

        setUploadingImg(true);
        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            // Sanitize filename: remove spaces, accents, special chars
            const safeName = file.name
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
                .replace(/[^a-zA-Z0-9.-]/g, '_'); // Replace special chars with _

            try {
                const json = await api.post('/settings/upload-image', { name: safeName, data: base64 });

                // Update finance data "savingsImage"
                const finData = await api.get('/finance');
                await api.post('/finance', { ...finData, savingsImage: json.url });

                setSavingsImage(json.url);
                showStatus('Imagen de Billetera actualizada');

            } catch (err: any) {
                showStatus(`Error: ${err.message || 'Fallo la carga'}`, true);
            } finally {
                setUploadingImg(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm(`¿Estás seguro de subir el PDF "${file.name}" a la biblioteca?`)) {
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            try {
                await api.post('/study/upload-pdf', { name: file.name, data: base64 });

                // Refresh list
                const dataLists = await api.get('/study/pdfs');
                setPdfs(dataLists);

                showStatus('PDF subido a la biblioteca');
            } catch (err) {
                showStatus('Error al subir PDF', true);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteImage = async () => {
        if (!confirm('¿Estás seguro de eliminar la imagen de la meta de ahorro?')) return;

        try {
            const finData = await api.get('/finance');

            // Remove from finance data
            await api.post('/finance', { ...finData, savingsImage: null });

            // Optional: Delete physical file if needed, but for now just unset reference
            if (savingsImage) {
                const name = savingsImage.split('/').pop();
                if (name) {
                    await api.delete(`/settings/images/${name}`);
                }
            }

            setSavingsImage(null);
            showStatus('Imagen eliminada');
        } catch (err) {
            showStatus('Error al eliminar imagen', true);
        }
    };

    const handleDeletePdf = async (name: string) => {
        if (!confirm(`¿Estás seguro de eliminar el PDF "${name}"?`)) return;

        try {
            await api.delete(`/study/pdfs/${name}`);
            setPdfs(pdfs.filter(p => p.name !== name));
            showStatus('PDF eliminado');
        } catch (err) {
            showStatus('Error al eliminar PDF', true);
        }
    };

    return (
        <div className="space-y-6 animate-entry pb-20">
            <header className="mb-6">
                <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
                    <Settings className="w-8 h-8 text-indigo-400" /> Ajustes Globales
                </h2>
                <p className="text-slate-500">Administra los datos y recursos de la aplicación.</p>
            </header>

            {statusMsg && (
                <div className="p-4 bg-indigo-500/20 border border-indigo-500 rounded-xl text-indigo-200 flex items-center gap-2">
                    <Check className="w-5 h-5" /> {statusMsg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Tabs */}
                <div className="md:col-span-1 space-y-2">
                    <button onClick={() => setActiveTab('profile')} className={`w-full text-left p-3 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                        <div className="flex items-center gap-2"><User className="w-4 h-4" /> Perfil</div>
                    </button>
                    <button onClick={() => setActiveTab('data')} className={`w-full text-left p-3 rounded-lg transition-colors ${activeTab === 'data' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                        <div className="flex items-center gap-2"><Database className="w-4 h-4" /> Datos</div>
                    </button>
                    <button onClick={() => setActiveTab('resources')} className={`w-full text-left p-3 rounded-lg transition-colors ${activeTab === 'resources' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                        <div className="flex items-center gap-2"><Image className="w-4 h-4" /> Recursos Visuales</div>
                    </button>
                </div>

                {/* Content */}
                <div className="md:col-span-3 space-y-6">

                    {activeTab === 'profile' && (
                        <div className="glass-panel p-6 rounded-xl">
                            <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                                <User className="text-indigo-400" /> Editar Perfil
                            </h3>
                            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Nuevo Usuario</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder="Dejar en blanco para mantener actual"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Confirmar Contraseña</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                    Guardar Cambios
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="space-y-6">
                            {/* Manual Verse Add */}
                            <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                                <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                                    <FileText className="text-purple-400" /> Agregar Versículo
                                </h3>

                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const text = (form.elements.namedItem('text') as HTMLInputElement).value;
                                    const citation = (form.elements.namedItem('citation') as HTMLInputElement).value;

                                    if (!text || !citation) return;

                                    try {
                                        await api.post('/devotional', { text, citation });
                                        showStatus('Versículo agregado correctamente');
                                        form.reset();
                                        setHasVerses(true);
                                    } catch (err) { showStatus('Error de conexión', true); }
                                }} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cita Bíblica</label>
                                        <input name="citation" placeholder="Ej. Juan 3:16" className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-slate-200 focus:border-purple-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Texto</label>
                                        <textarea name="text" placeholder="Porque de tal manera amó Dios al mundo..." className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-slate-200 focus:border-purple-500 outline-none h-24 resize-none" />
                                    </div>
                                    <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg w-full transition-colors">
                                        Guardar Versículo
                                    </button>
                                </form>

                                {/* Verse List */}
                                <div className="mt-6 border-t border-white/10 pt-4">
                                    <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase">Versículos Guardados</h4>
                                    <VerseList hasVerses={hasVerses} setHasVerses={setHasVerses} showStatus={showStatus} />
                                </div>
                            </div>

                            {/* Manual Quote Add */}
                            <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                                <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                                    <Heart className="text-rose-400" /> Agregar Frase Motivadora
                                </h3>

                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const text = (form.elements.namedItem('quoteText') as HTMLInputElement).value;
                                    const author = (form.elements.namedItem('quoteAuthor') as HTMLInputElement).value;

                                    if (!text) return;

                                    try {
                                        await api.post('/quotes', { text, author });
                                        showStatus('Frase motivadora agregada correctamente');
                                        form.reset();
                                        setHasQuotes(true);
                                    } catch (err) { showStatus('Error de conexión', true); }
                                }} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Frase</label>
                                        <textarea name="quoteText" placeholder="Ej. Sé el hombre que ella merece..." className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-slate-200 focus:border-rose-500 outline-none h-24 resize-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Autor (opcional)</label>
                                        <input name="quoteAuthor" placeholder="Ej. Anónimo" className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-slate-200 focus:border-rose-500 outline-none" />
                                    </div>
                                    <button type="submit" className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-4 rounded-lg w-full transition-colors">
                                        Guardar Frase
                                    </button>
                                </form>

                                {/* Quote List */}
                                <div className="mt-6 border-t border-white/10 pt-4">
                                    <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase">Frases Guardadas</h4>
                                    <QuoteList hasQuotes={hasQuotes} setHasQuotes={setHasQuotes} showStatus={showStatus} />
                                </div>
                            </div>

                            {/* Reset Zone */}
                            <div className="glass-panel p-6 rounded-xl border border-rose-500/20">
                                <h3 className="text-lg font-bold text-rose-400 mb-4 flex items-center gap-2">
                                    <Trash2 className="w-5 h-5" /> Zona de Peligro
                                </h3>
                                <p className="text-sm text-slate-400 mb-4">Estas acciones no se pueden deshacer.</p>
                                <div className="space-y-2">
                                    <button onClick={() => handleReset('verses')} className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/50 py-2 px-4 rounded-lg transition-colors font-medium">
                                        Borrar todos los versículos
                                    </button>
                                    <button onClick={async () => {
                                        if (!confirm('¿Estás seguro de eliminar todas las frases motivadoras?')) return;
                                        try {
                                            await api.delete('/quotes');
                                            setHasQuotes(false);
                                            showStatus('Frases eliminadas');
                                        } catch { showStatus('Error al eliminar', true); }
                                    }} className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/50 py-2 px-4 rounded-lg transition-colors font-medium">
                                        Borrar todas las frases motivadoras
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'resources' && (
                        <div className="space-y-6">
                            {/* Wallet Image */}
                            <div className="glass-panel p-6 rounded-xl">
                                <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                                    <Image className="text-emerald-400" /> Imagen de Meta de Ahorro
                                </h3>
                                <label className="block w-full p-8 border-2 border-dashed border-white/10 rounded-xl hover:border-emerald-500/50 hover:bg-white/5 transition-all cursor-pointer text-center relative group">
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        {savingsImage ? (
                                            <div className="relative">
                                                <img src={`${FILE_BASE_URL}${savingsImage}`} alt="Current" className="h-32 object-contain rounded-lg border border-white/10" />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                    <p className="text-white text-sm font-bold">Click para cambiar</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8" />
                                                <span>Click para subir imagen</span>
                                            </>
                                        )}
                                        {uploadingImg && <span className="text-emerald-400 text-xs">Subiendo...</span>}
                                    </div>
                                </label>
                                {savingsImage && (
                                    <div className="mt-4 flex justify-end">
                                        <button onClick={handleDeleteImage} className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-sm bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 transition-colors hover:bg-white/10">
                                            <Trash2 className="w-3 h-3" /> Eliminar Imagen
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* PDFs */}
                            <div className="glass-panel p-6 rounded-xl">
                                <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                                    <FileText className="text-amber-400" /> Biblioteca PDF
                                </h3>
                                <label className="block w-full p-8 border-2 border-dashed border-white/10 rounded-xl hover:border-amber-500/50 hover:bg-white/5 transition-all cursor-pointer text-center">
                                    <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        <Upload className="w-8 h-8" />
                                        <span>Click para subir PDF</span>
                                    </div>
                                </label>

                                {pdfs.length > 0 && (
                                    <div className="mt-6 space-y-2">
                                        <h4 className="text-sm font-semibold text-slate-400">Archivos guardados ({pdfs.length})</h4>
                                        <div className="custom-scrollbar max-h-40 overflow-y-auto space-y-2 pr-1">
                                            {pdfs.map(pdf => (
                                                <div key={pdf.name} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                                    <span className="text-sm text-slate-300 truncate max-w-[200px]" title={pdf.name}>{pdf.name}</span>
                                                    <button onClick={() => handleDeletePdf(pdf.name)} className="text-rose-400 hover:text-rose-300 p-1 rounded-md hover:bg-white/10">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

function VerseList({ hasVerses, setHasVerses, showStatus }: { hasVerses: boolean, setHasVerses: (v: boolean) => void, showStatus: (msg: string, err?: boolean) => void }) {
    const [verses, setVerses] = useState<any[]>([]);

    const fetchVerses = () => {
        api.get('/devotional')
            .then(data => {
                if (data.entries) {
                    setVerses(data.entries);
                    setHasVerses(data.entries.length > 0);
                }
            })
            .catch(console.error);
    };

    useEffect(() => {
        fetchVerses();
    }, [hasVerses]); // Refresh when hasVerses changes (added/deleted)

    const handleDelete = async (id: number) => {
        if (!confirm('Eliminar este versículo?')) return;
        try {
            await api.delete(`/devotional/${id}`);
            showStatus('Versículo eliminado');
            fetchVerses();
        } catch (e) { showStatus('Error de conexión', true); }
    };

    if (verses.length === 0) return <p className="text-xs text-slate-500 italic">No hay versículos guardados.</p>;

    return (
        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {verses.map((v: any) => (
                <div key={v.id} className="bg-black/20 p-3 rounded-lg border border-white/5 flex justify-between items-start group">
                    <div>
                        <p className="text-xs font-bold text-purple-400 mb-1">{v.citation}</p>
                        <p className="text-xs text-slate-300 line-clamp-2">{v.text}</p>
                    </div>
                    <button onClick={() => handleDelete(v.id)} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}

function QuoteList({ hasQuotes, setHasQuotes, showStatus }: { hasQuotes: boolean, setHasQuotes: (v: boolean) => void, showStatus: (msg: string, err?: boolean) => void }) {
    const [quotes, setQuotes] = useState<any[]>([]);

    const fetchQuotes = () => {
        api.get('/quotes')
            .then(data => {
                if (data.entries) {
                    setQuotes(data.entries);
                    setHasQuotes(data.entries.length > 0);
                }
            })
            .catch(console.error);
    };

    useEffect(() => {
        fetchQuotes();
    }, [hasQuotes]);

    const handleDelete = async (id: number) => {
        if (!confirm('Eliminar esta frase?')) return;
        try {
            await api.delete(`/quotes/${id}`);
            showStatus('Frase eliminada');
            fetchQuotes();
        } catch (e) { showStatus('Error de conexión', true); }
    };

    if (quotes.length === 0) return <p className="text-xs text-slate-500 italic">No hay frases guardadas.</p>;

    return (
        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {quotes.map((q: any) => (
                <div key={q.id} className="bg-black/20 p-3 rounded-lg border border-white/5 flex justify-between items-start group">
                    <div>
                        {q.author && <p className="text-xs font-bold text-rose-400 mb-1">{q.author}</p>}
                        <p className="text-xs text-slate-300 line-clamp-2">{q.text}</p>
                    </div>
                    <button onClick={() => handleDelete(q.id)} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
