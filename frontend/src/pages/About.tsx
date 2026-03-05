import { Info, User, GraduationCap, MapPin, Globe, Code2, Server, Database } from 'lucide-react';

export default function About() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-4 animate-entry">
            <div className="w-full max-w-2xl">

                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-1 ring-white/10 mb-4 shadow-lg shadow-indigo-500/10">
                        <Info className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Acerca de Telos</h2>
                    <p className="text-slate-400 mt-2 font-medium">Sistema Integral de Gestión Personal</p>
                </div>

                {/* Main Card */}
                <div className="relative overflow-hidden rounded-3xl bg-[#14161b]/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                    {/* Decorative Background Gradients */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    <div className="p-8 md:p-10 relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">

                        {/* Avatar / Identity */}
                        <div className="flex flex-col items-center shrink-0">
                            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-xl shadow-indigo-500/20">
                                <div className="w-full h-full rounded-full bg-[#12141a] flex items-center justify-center overflow-hidden border-4 border-[#12141a]">
                                    <User className="w-12 h-12 text-indigo-400/80" />
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <h3 className="text-lg font-bold text-slate-100">Marcos Samuel Puluc Coc</h3>
                                <div className="flex items-center justify-center gap-1.5 text-xs text-indigo-400 font-medium mt-1 bg-indigo-500/10 py-1 px-3 rounded-full border border-indigo-500/20">
                                    <Code2 className="w-3.5 h-3.5" />
                                    <span>Desarrollador Full-Stack</span>
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-6 w-full">
                            {/* Academic Info */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Información Académica</h4>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                                        <div className="mt-0.5 p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
                                            <GraduationCap className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-200">Universidad de San Carlos de Guatemala (USAC)</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Ingeniería en Ciencias y Sistemas</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                                        <div className="mt-0.5 p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-200">Campus Central</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Ciudad Universitaria, zona 12</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tech Stack */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Especificaciones del Sistema</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                                        <Globe className="w-4 h-4 text-blue-400" />
                                        <span className="text-xs font-medium text-slate-300">React + Vite + Tailwind</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                                        <Server className="w-4 h-4 text-green-400" />
                                        <span className="text-xs font-medium text-slate-300">Node.js + Express</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                                        <Database className="w-4 h-4 text-purple-400" />
                                        <span className="text-xs font-medium text-slate-300">PostgreSQL (Neon)</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Footer note */}
                    <div className="bg-black/40 p-4 border-t border-white/5 text-center">
                        <p className="text-xs text-slate-500 font-medium">
                            <span className="text-indigo-400">Telos Workspace v3.4</span> &mdash; Desarrollado con pasión para la excelencia, desarrollo personal y profesionalismo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
