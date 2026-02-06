import { ExternalLink } from 'lucide-react';

export const BankShortcuts = () => {
    const banks = [
        {
            name: 'Banco Industrial',
            url: 'https://www.bienlinea.bi.com.gt/InicioSesion/Inicio/Autenticar',
            domain: 'bienlinea.bi.com.gt',
            color: 'hover:bg-blue-900/20 hover:border-blue-500/30'
        },
        {
            name: 'Banrural',
            url: 'https://bancavirtual.banrural.com.gt/cb/pages/jsp-ns/login-cons.jsp?request_locale=ES',
            domain: 'bancavirtual.banrural.com.gt',
            color: 'hover:bg-green-900/20 hover:border-green-500/30'
        },
        {
            name: 'PayPal',
            url: 'https://www.paypal.com',
            domain: 'paypal.com',
            color: 'hover:bg-indigo-900/20 hover:border-indigo-500/30'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {banks.map((bank) => (
                <a
                    key={bank.name}
                    href={bank.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-zinc-900/50 transition-all duration-300 group ${bank.color}`}
                >
                    <div className="w-10 h-10 rounded-lg bg-white/5 p-2 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                        <img
                            src={`https://www.google.com/s2/favicons?domain=${bank.domain}&sz=64`}
                            alt={bank.name}
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-zinc-200 font-semibold text-sm group-hover:text-white transition-colors">
                            {bank.name}
                        </h3>
                        <p className="text-zinc-500 text-xs flex items-center gap-1 group-hover:text-zinc-400">
                            Ir al portal <ExternalLink className="w-3 h-3" />
                        </p>
                    </div>
                </a>
            ))}
        </div>
    );
};
