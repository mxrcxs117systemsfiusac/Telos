import { Wrench, Bot, ExternalLink, ArrowRight } from 'lucide-react';
import { useState } from 'react';

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
    const [selectedAI, setSelectedAI] = useState<number | null>(null);

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
                        onMouseEnter={() => setSelectedAI(idx)}
                        onMouseLeave={() => setSelectedAI(null)}
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

export { EngineeringPage, AIPage };
