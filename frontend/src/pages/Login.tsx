import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, User } from 'lucide-react';
import { api } from '../utils/api';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const data = await api.post('/auth/login', { username, password });
            login(data.token, data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.message === 'Invalid credentials' ? 'Credenciales incorrectas' : err.message || 'Error de servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f1115] text-slate-200 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />

            <div className="bg-[#14161b]/80 backdrop-blur-xl border border-white/5 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/20 mb-4 transform rotate-3">
                        <LogIn className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Bienvenido</h2>
                    <p className="text-slate-400 mt-2">Inicia sesión en Telos</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-sm text-center font-medium animate-slide-down flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400 mx-1">Usuario</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                <User className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-[#0a0c10] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 hover:border-white/10 outline-none transition-all text-white placeholder-slate-600 shadow-inner"
                                placeholder="..."
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400 mx-1">Contraseña</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition-colors">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#0a0c10] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 hover:border-white/10 outline-none transition-all text-white placeholder-slate-600 shadow-inner"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`
                            w-full mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 
                            text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] 
                            transform transition-all duration-300 active:scale-[0.98] hover:-translate-y-0.5
                            ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                        `}
                    >
                        {isLoading ? 'Autenticando...' : 'Acceder al Workspace'}
                    </button>
                </form>


            </div>

            <div className="absolute bottom-4 text-center text-slate-600 text-xs w-full">
                &copy; {new Date().getFullYear()} Telos System. All rights reserved.
            </div>
        </div>
    );
}
