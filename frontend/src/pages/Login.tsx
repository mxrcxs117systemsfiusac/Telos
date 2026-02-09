import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, User } from 'lucide-react';

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
            const res = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

            login(data.token, data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.message === 'Invalid credentials' ? 'Credenciales incorrectas' : 'Error de servidor');
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
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center font-medium animate-pulse">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-300 ml-1">Usuario</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                <User className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-[#0a0c10] border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all text-white placeholder-slate-600"
                                placeholder="ej. admin"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-300 ml-1">Contraseña</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#0a0c10] border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all text-white placeholder-slate-600"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`
                            w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 
                            text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-900/30 
                            transform transition-all duration-200 active:scale-[0.98]
                            ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                        `}
                    >
                        {isLoading ? 'Iniciando sesión...' : 'Ingresar'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm">
                        ¿No tienes cuenta? <span className="text-slate-400 cursor-not-allowed">Contacta al administrador</span>
                    </p>
                </div>
            </div>

            <div className="absolute bottom-4 text-center text-slate-600 text-xs">
                &copy; {new Date().getFullYear()} Telos System. All rights reserved.
            </div>
        </div>
    );
}
