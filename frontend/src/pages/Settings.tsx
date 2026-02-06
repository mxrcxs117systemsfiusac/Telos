import { useState, useEffect } from 'react';
import { Upload, FileJson, Image, FileText, Database, Check, Trash2 } from 'lucide-react';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('data');
    const [statusMsg, setStatusMsg] = useState('');

    // State for Data Status
    const [hasVerses, setHasVerses] = useState(false);
    const [hasSchedule, setHasSchedule] = useState(false);

    // State for Image Upload
    const [uploadingImg, setUploadingImg] = useState(false);
    const [savingsImage, setSavingsImage] = useState<string | null>(null);
    const [pdfs, setPdfs] = useState<{ name: string, url: string }[]>([]);

    useEffect(() => {
        // Check status on load
        fetch('http://localhost:3001/api/devotional').then(res => res.json()).then(data => {
            if (data.entries?.length > 0 || data.versiculos?.length > 0) setHasVerses(true);
        }).catch(() => { });

        fetch('http://localhost:3001/api/schedule').then(res => res.json()).then(data => {
            if (data.events?.length > 0) setHasSchedule(true);
        }).catch(() => { });

        fetch('http://localhost:3001/api/finance').then(res => res.json()).then(data => {
            if (data.savingsImage) setSavingsImage(data.savingsImage);
        }).catch(() => { });

        fetch('http://localhost:3001/api/study/pdfs').then(res => res.json()).then(data => {
            if (Array.isArray(data)) setPdfs(data);
        }).catch(() => { });
    }, [activeTab]);

    // Helpers
    const showStatus = (msg: string, isError = false) => {
        setStatusMsg(msg);
        if (!isError) {
            setTimeout(() => setStatusMsg(''), 3000);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'schedule' | 'verses') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const json = JSON.parse(text);

                if (type === 'verses') {
                    // Handle Verses
                    // Expected format: Array of verses OR object with "versiculos"
                    let entries = Array.isArray(json) ? json : (json.versiculos || json.entries || []);

                    // Normalize standard
                    if (!Array.isArray(entries)) throw new Error("Formato inválido");

                    const res = await fetch('http://localhost:3001/api/devotional');
                    const current = await res.json();
                    const newData = { ...current, entries: entries }; // Store as entries

                    await fetch('http://localhost:3001/api/devotional', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newData)
                    });
                    setHasVerses(true);
                    showStatus('Versículos actualizados correctamente');

                } else if (type === 'schedule') {
                    // Handle Schedule
                    // Expected standard format or just replace entire object
                    await fetch('http://localhost:3001/api/schedule', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(json)
                    });
                    setHasSchedule(true);
                    showStatus('Horario actualizado correctamente');
                }

            } catch (err) {
                console.error(err);
                showStatus('Error: Archivo JSON inválido', true);
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const handleReset = async (type: 'schedule' | 'verses') => {
        if (!confirm('¿Estás seguro de eliminar estos datos?')) return;

        if (type === 'verses') {
            await fetch('http://localhost:3001/api/devotional', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries: [] })
            });
            setHasVerses(false);
            showStatus('Versículos eliminados');
        } else {
            await fetch('http://localhost:3001/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config: { startHour: 7, endHour: 21 }, events: [] })
            });
            setHasSchedule(false);
            showStatus('Horario reiniciado');
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
                const res = await fetch('http://localhost:3001/api/settings/upload-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: safeName, data: base64 })
                });

                if (res.ok) {
                    const json = await res.json();

                    // Update finance data "savingsImage"
                    const finRes = await fetch('http://localhost:3001/api/finance');
                    const finData = await finRes.json();
                    await fetch('http://localhost:3001/api/finance', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...finData, savingsImage: json.url })
                    });

                    setSavingsImage(json.url);
                    showStatus('Imagen de Billetera actualizada');

                } else {
                    const err = await res.json();
                    showStatus(`Error: ${err.error || 'Fallo la carga'}`, true);
                }
            } catch (err) {
                showStatus('Error de red al intentar subir imagen', true);
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
            await fetch('http://localhost:3001/api/study/upload-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: file.name, data: base64 })
            });

            // Refresh list
            const resLists = await fetch('http://localhost:3001/api/study/pdfs');
            const dataLists = await resLists.json();
            setPdfs(dataLists);

            showStatus('PDF subido a la biblioteca');
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteImage = async () => {
        if (!confirm('¿Estás seguro de eliminar la imagen de la meta de ahorro?')) return;

        try {
            const finRes = await fetch('http://localhost:3001/api/finance');
            const finData = await finRes.json();

            // Remove from finance data
            await fetch('http://localhost:3001/api/finance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...finData, savingsImage: null })
            });

            // Optional: Delete physical file if needed, but for now just unset reference
            if (savingsImage) {
                const name = savingsImage.split('/').pop();
                if (name) {
                    await fetch(`http://localhost:3001/api/settings/images/${name}`, { method: 'DELETE' });
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
            await fetch(`http://localhost:3001/api/study/pdfs/${name}`, { method: 'DELETE' });
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
                    <button onClick={() => setActiveTab('data')} className={`w-full text-left p-3 rounded-lg transition-colors ${activeTab === 'data' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                        <div className="flex items-center gap-2"><Database className="w-4 h-4" /> Datos JSON</div>
                    </button>
                    <button onClick={() => setActiveTab('resources')} className={`w-full text-left p-3 rounded-lg transition-colors ${activeTab === 'resources' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                        <div className="flex items-center gap-2"><Image className="w-4 h-4" /> Recursos Visuales</div>
                    </button>
                </div>

                {/* Content */}
                <div className="md:col-span-3 space-y-6">

                    {activeTab === 'data' && (
                        <div className="space-y-6">
                            {/* Verses */}
                            <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                                <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                                    <FileJson className="text-purple-400" /> Versículos
                                    {hasVerses && <span title="Datos cargados"><Check className="w-5 h-5 text-emerald-500" /></span>}
                                </h3>
                                <div className="p-6 border-2 border-dashed border-white/10 rounded-xl hover:border-purple-500/50 hover:bg-white/5 transition-all text-center">
                                    <label className="cursor-pointer block">
                                        <input type="file" accept=".json" className="hidden" onChange={(e) => handleFileUpload(e, 'verses')} />
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Upload className="w-8 h-8" />
                                            <span>Subir JSON de Versículos</span>
                                        </div>
                                    </label>
                                </div>
                                {hasVerses && (
                                    <div className="mt-4 flex justify-between items-center text-sm bg-white/5 p-3 rounded-lg">
                                        <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Archivo cargado</span>
                                        <button onClick={() => handleReset('verses')} className="text-rose-400 hover:text-rose-300 flex items-center gap-1">
                                            <Trash2 className="w-3 h-3" /> Eliminar
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Schedule */}
                            <div className="glass-panel p-6 rounded-xl">
                                <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                                    <FileJson className="text-blue-400" /> Horario
                                    {hasSchedule && <span title="Datos cargados"><Check className="w-5 h-5 text-emerald-500" /></span>}
                                </h3>
                                <div className="p-6 border-2 border-dashed border-white/10 rounded-xl hover:border-blue-500/50 hover:bg-white/5 transition-all text-center">
                                    <label className="cursor-pointer block">
                                        <input type="file" accept=".json" className="hidden" onChange={(e) => handleFileUpload(e, 'schedule')} />
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Upload className="w-8 h-8" />
                                            <span>Subir JSON de Horario</span>
                                        </div>
                                    </label>
                                </div>
                                {hasSchedule && (
                                    <div className="mt-4 flex justify-between items-center text-sm bg-white/5 p-3 rounded-lg">
                                        <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Archivo cargado</span>
                                        <button onClick={() => handleReset('schedule')} className="text-rose-400 hover:text-rose-300 flex items-center gap-1">
                                            <Trash2 className="w-3 h-3" /> Eliminar
                                        </button>
                                    </div>
                                )}
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
                                                <img src={`http://localhost:3001${savingsImage}`} alt="Current" className="h-32 object-contain rounded-lg border border-white/10" />
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
