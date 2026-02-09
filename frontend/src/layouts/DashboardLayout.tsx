import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Wallet, Calendar, Book, Wrench, Bot,
    Code, Menu, Settings, LogOut
} from 'lucide-react';

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { logout } = useAuth();


    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const navItems = [
        { to: "/", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/wallet", icon: Wallet, label: "Billetera" },
        { to: "/schedule", icon: Calendar, label: "Horario" },
        { to: "/study", icon: Book, label: "Estudio" },
        // Devotional Removed
        { to: "/engineering", icon: Wrench, label: "Ingeniería" },
        { to: "/ai", icon: Bot, label: "Inteligencia Artificial" },
        { to: "/programming", icon: Code, label: "Plan" }, // Renamed to "Plan" as requested
        { to: "/settings", icon: Settings, label: "Ajustes" }, // New Settings Item
    ];

    return (
        <div className="flex h-screen bg-[#0f1115] text-slate-200 font-sans overflow-hidden relative">

            {/* Ambient Background - matching Login */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:relative z-50 h-full flex flex-col 
                    bg-[#14161b]/95 backdrop-blur-xl border-r border-white/5
                    transition-all duration-300 ease-in-out
                    ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}
                `}
            >
                <div className="p-6 border-b border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <LayoutDashboard className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-slate-100 tracking-tight">Telos</h1>
                        <p className="text-xs text-slate-500 font-medium">Workspace</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                    <div className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Menu Principal</div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group
                                ${isActive
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:translate-x-1'}
                            `}
                        >
                            <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                <div className="p-4 border-t border-white/5 space-y-2">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all group"
                    >
                        <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                        Cerrar Sesión
                    </button>
                    <div className="text-xs text-center text-slate-600 mt-2">v3.0.0 &bull; Telos System</div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-full overflow-hidden flex flex-col relative z-10 w-full transition-all duration-300">
                {/* Header */}
                <header className="flex items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#0f1115]/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-all active:scale-95"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h2 className="font-medium text-slate-200 md:hidden">Telos Dashboard</h2>
                    </div>
                    {/* Placeholder for future header items (Notifications, Profile, etc.) */}
                    <div className="w-8"></div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
                    <div className="max-w-7xl mx-auto p-4 md:p-8 w-full animate-entry">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
