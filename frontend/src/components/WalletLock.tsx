import { useState } from 'react';
import { Lock, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

interface WalletLockProps {
    onUnlock: () => void;
}

export default function WalletLock({ onUnlock }: WalletLockProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [shake, setShake] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.post('/auth/verify-password', { password });
            onUnlock();
        } catch (err: any) {
            setError('Contraseña incorrecta');
            setShake(true);
            setTimeout(() => setShake(false), 600);
            setPassword('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center relative">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div
                className={`
                    bg-[#14161b]/80 backdrop-blur-xl border border-white/5 p-8 rounded-2xl shadow-2xl 
                    w-full max-w-sm relative z-10 transition-transform
                    ${shake ? 'animate-shake' : ''}
                `}
            >
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-5">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/30 transform rotate-3">
                            <Lock className="w-9 h-9 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#14161b]">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Billetera Protegida</h2>
                    <p className="text-slate-500 text-sm mt-1.5 text-center px-4">
                        Ingresa la contraseña de la billetera para acceder a tu información financiera
                        <br /><span className="text-xs text-indigo-400 opacity-80 mt-1 block">(Predeterminada: Cortana117)</span>
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center font-medium flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400 ml-1">Contraseña</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#0a0c10] border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all text-white placeholder-slate-600"
                                placeholder="•••••••••••••"
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`
                            w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 
                            text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-900/30 
                            transform transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2
                            ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                        `}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Verificando...
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-5 h-5" />
                                Desbloquear
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* CSS for shake animation */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
}
