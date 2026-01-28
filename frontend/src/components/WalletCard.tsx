import { CreditCard, Wifi } from 'lucide-react';

export const WalletCard = () => {
    return (
        <div className="relative group perspective-1000 h-56 w-full max-w-sm mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl rotate-y-6 group-hover:rotate-y-0 transition-transform duration-500 ease-out shadow-2xl overflow-hidden border border-white/10">

                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>

                {/* Card Content */}
                <div className="relative h-full p-6 flex flex-col justify-between z-10">

                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">Billetera Digital</span>
                            <span className="text-white font-black italic tracking-tighter text-xl mt-1">PLATINUM</span>
                        </div>
                        <Wifi className="text-white/80 w-8 h-8 rotate-90" />
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-9 bg-gradient-to-tr from-yellow-200 to-yellow-500 rounded-md shadow-inner flex items-center justify-center">
                                <div className="w-8 h-6 border border-yellow-600/30 rounded-sm grid grid-cols-4 gap-[1px] p-[2px]">
                                    {[...Array(8)].map((_, i) => <div key={i} className="bg-yellow-600/20 rounded-[1px]"></div>)}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <CreditCard className="text-white/80 w-6 h-6" />
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-white/90 font-mono text-xl tracking-[0.2em] drop-shadow-md">
                                    **** **** **** 1234
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-white/50 uppercase">Vencimiento</span>
                                        <span className="text-white/90 font-mono text-sm">12/28</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-white/50 uppercase">Titular</span>
                                        <span className="text-white/90 font-medium tracking-wide">MARCOS USER</span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                                <div className="w-6 h-6 bg-white/80 rounded-full opacity-50 -mr-3"></div>
                                <div className="w-6 h-6 bg-white/80 rounded-full opacity-50"></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
        </div>
    );
};
