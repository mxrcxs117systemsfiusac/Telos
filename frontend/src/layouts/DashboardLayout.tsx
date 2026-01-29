import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Wallet, Calendar, Book, Wrench, Bot,
    Code, Menu, Settings
} from 'lucide-react';

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);


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
        <div className="flex h-screen bg-[#0f1115] text-slate-200 font-sans overflow-hidden">

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:relative z-50 h-full bg-[#14161b] border-r border-white/5 flex flex-col 
                    transition-all duration-300 ease-in-out overflow-hidden
                    ${isSidebarOpen
                        ? 'w-64 translate-x-0'
                        : 'w-64 -translate-x-full md:w-0 md:translate-x-0 md:border-none'
                    }
                `}
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/20">
                            <LayoutDashboard className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-slate-100 leading-tight">Telos</h1>
                            <p className="text-xs text-slate-500">Marcos Puluc</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${isActive
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}
              `}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}

                    <div className="pt-4 mt-4 border-t border-white/5">
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-full overflow-hidden flex flex-col relative w-full bg-[#0f1115]">
                {/* Top Bar (Mobile + Desktop Toggle) */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#14161b]">
                    <div className="flex items-center gap-4">
                        <button onClick={toggleSidebar} className="text-slate-400 hover:text-white transition-colors">
                            <Menu className="w-6 h-6" />
                        </button>
                        <span className="font-bold text-slate-200 md:hidden">Dashboard</span>
                    </div>
                    <div className="w-6"></div>
                </div>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full flex flex-col items-center">
                    <div className="w-full max-w-7xl">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
