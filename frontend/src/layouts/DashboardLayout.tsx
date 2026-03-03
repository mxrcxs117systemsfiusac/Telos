import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Wallet, Calendar, Book, Wrench,
    Code, Menu, Settings, LogOut, BookOpen, X
} from 'lucide-react';

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { logout } = useAuth();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const navItems = [
        { to: "/", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/wallet", icon: Wallet, label: "Billetera" },
        { to: "/schedule", icon: Calendar, label: "Horario" },
        { to: "/study", icon: Book, label: "Tareas" },
        { to: "/engineering", icon: Wrench, label: "Ingeniería" },
        { to: "/theology", icon: BookOpen, label: "Teología" },
        { to: "/programming", icon: Code, label: "Plan" },
        { to: "/settings", icon: Settings, label: "Ajustes" },
    ];

    return (
        <div className="flex h-screen bg-[#0f1115] text-slate-200 font-sans overflow-hidden relative">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/15 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/15 rounded-full blur-[150px]"></div>
            </div>

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:relative z-50 h-full flex flex-col 
                    bg-[#12141a]/95 backdrop-blur-2xl border-r border-white/[0.04]
                    transition-all duration-300 ease-in-out
                    ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}
                `}
            >
                {/* Brand */}
                <div className="p-5 border-b border-white/[0.04] flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <span className="text-white text-sm font-black tracking-tight">T</span>
                    </div>
                    <div>
                        <h1 className="font-extrabold text-base text-white tracking-tight">Telos</h1>
                        <p className="text-[10px] text-slate-600 font-medium tracking-wider uppercase">Workspace</p>
                    </div>
                </div>

                {/* Nav Items */}
                <div className="flex-1 overflow-y-auto py-4 px-2.5 space-y-0.5 custom-scrollbar">
                    <div className="px-3 mb-3 text-[10px] font-black text-slate-600 uppercase tracking-[0.15em]">Navegación</div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/"}
                            onClick={() => {
                                if (window.innerWidth < 768) setIsSidebarOpen(false);
                            }}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group
                                ${isActive
                                    ? 'bg-indigo-500/10 text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'}
                            `}
                        >
                            <item.icon className="w-[18px] h-[18px] transition-transform group-hover:scale-110" />
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/[0.04] space-y-1">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-rose-400/70 hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
                    >
                        <LogOut className="w-[18px] h-[18px] transition-transform group-hover:-translate-x-0.5" />
                        Cerrar Sesión
                    </button>
                    <div className="text-[10px] text-center text-slate-700 mt-1">v3.1 &bull; Telos</div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-full overflow-hidden flex flex-col relative z-10 w-full transition-all duration-300">
                {/* Header */}
                <header className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-white/[0.04] bg-[#0f1115]/60 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg text-slate-500 hover:bg-white/5 hover:text-white transition-all active:scale-95"
                        >
                            {isSidebarOpen ? <X className="w-4 h-4 md:hidden" /> : null}
                            <Menu className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="w-8"></div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
                    <div className="max-w-7xl mx-auto p-4 md:p-8 w-full">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
