import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, ImageIcon, Sparkles, Star } from 'lucide-react';

interface AlbumImage {
    name: string;
    url: string;
}

const FILE_BASE_URL = 'http://localhost:3001';

// Component for floating stars background
const FloatingStars = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className="absolute animate-float"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${3 + Math.random() * 4}s`
                    }}
                >
                    {i % 2 === 0 ? (
                        <Star className="w-2 h-2 text-pink-300/30" fill="currentColor" />
                    ) : (
                        <Sparkles className="w-3 h-3 text-pink-200/20" fill="currentColor" />
                    )}
                </div>
            ))}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
                    50% { transform: translateY(-15px) scale(1.2); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
};

export default function Flipbook({ images }: { images: AlbumImage[] }) {
    const [currentPage, setCurrentPage] = useState(0);
    const [isFlipping, setIsFlipping] = useState(false);
    const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('right');
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const totalPages = images.length;

    const goToPage = (page: number, direction: 'left' | 'right') => {
        if (isFlipping || page < 0 || page >= totalPages) return;
        setFlipDirection(direction);
        setIsFlipping(true);
        setTimeout(() => {
            setCurrentPage(page);
            setIsFlipping(false);
        }, 500); // match new animation duration
    };

    const nextPage = () => goToPage(currentPage + 1, 'right');
    const prevPage = () => goToPage(currentPage - 1, 'left');

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextPage();
            if (e.key === 'ArrowLeft') prevPage();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [currentPage, isFlipping]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = () => {
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) {
            if (diff > 0) nextPage();
            else prevPage();
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const third = rect.width / 3;
        if (x < third) prevPage();
        else if (x > third * 2) nextPage();
    };

    if (totalPages === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center relative min-h-[400px]">
                <FloatingStars />
                <div className="p-6 rounded-full bg-pink-500/10 mb-6 relative z-10 border border-pink-500/20">
                    <ImageIcon className="w-16 h-16 text-pink-400/50" />
                </div>
                <p className="text-slate-200 text-lg font-bold mb-2 relative z-10">Tu álbum está vacío</p>
                <p className="text-slate-500 text-sm relative z-10">Sube fotos desde <span className="text-pink-400 font-medium">Ajustes → Recursos Visuales</span></p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-6 h-full relative p-4 lg:p-10">
            <FloatingStars />

            {/* Book Container with 3D Tilt */}
            <div
                ref={containerRef}
                className="relative w-full max-w-[500px] aspect-[3/4] cursor-pointer select-none group z-10 mx-auto"
                style={{
                    perspective: '1500px',
                    transformStyle: 'preserve-3d',
                }}
                onClick={handleClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Outer Book Tilt Wrapper */}
                <div
                    className="w-full h-full relative"
                    style={{
                        transform: 'rotateX(5deg) rotateY(-5deg)',
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.5s ease'
                    }}
                >
                    {/* Shadow underneath the book */}
                    <div
                        className="absolute -inset-4 bg-black/50 blur-xl rounded-[30px] -z-10"
                        style={{ transform: 'translateZ(-50px)' }}
                    />

                    {/* Left Pages (Thickness Illusion) */}
                    <div className="absolute left-[-15px] top-[10px] bottom-[-10px] w-[15px] bg-slate-200 rounded-l-md" style={{ transform: 'translateZ(-10px) rotateY(-90deg)', transformOrigin: 'right' }} />

                    {/* Bottom Pages (Thickness Illusion) */}
                    <div className="absolute left-[0px] right-[-10px] bottom-[-15px] h-[15px] bg-slate-300 rounded-b-md" style={{ transform: 'translateZ(-10px) rotateX(90deg)', transformOrigin: 'top' }} />


                    {/* Main Content Area */}
                    <div className="absolute inset-0 bg-[#e6e2dd] rounded-r-2xl rounded-l-md shadow-inner overflow-hidden border border-[#d4cfc7]">
                        {/* Book Spine Deformation */}
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 via-black/5 to-transparent z-20 pointer-events-none mix-blend-multiply" />
                        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-r from-white/40 to-transparent z-20 pointer-events-none" />

                        {/* Display Previous Image underneath if flipping left */}
                        {isFlipping && flipDirection === 'left' && currentPage - 1 >= 0 && (
                            <div className="absolute inset-0 w-full h-full p-2 lg:p-4 z-0">
                                <img
                                    src={`${FILE_BASE_URL}${images[currentPage - 1].url}`}
                                    className="w-full h-full object-cover rounded shadow-sm border border-black/5"
                                    alt="prev"
                                />
                            </div>
                        )}

                        {/* Display Next Image underneath if flipping right */}
                        {isFlipping && flipDirection === 'right' && currentPage + 1 < totalPages && (
                            <div className="absolute inset-0 w-full h-full p-2 lg:p-4 z-0">
                                <img
                                    src={`${FILE_BASE_URL}${images[currentPage + 1].url}`}
                                    className="w-full h-full object-cover rounded shadow-sm border border-black/5"
                                    alt="next"
                                />
                            </div>
                        )}

                        {/* Current Page with Flip Animation */}
                        <div
                            className="absolute inset-0 w-full h-full p-2 lg:p-4 transform-origin-left"
                            style={{
                                transformOrigin: 'left center',
                                animation: isFlipping
                                    ? flipDirection === 'right'
                                        ? 'flipRight 0.5s ease-in forwards'
                                        : 'flipLeft 0.5s ease-out forwards'
                                    : 'none',
                                backfaceVisibility: 'hidden',
                                zIndex: isFlipping ? 10 : 2
                            }}
                        >
                            <div className="relative w-full h-full rounded shadow-sm border border-black/5 bg-white overflow-hidden">
                                <img
                                    src={`${FILE_BASE_URL}${images[currentPage].url}`}
                                    alt={`Página ${currentPage + 1}`}
                                    className="w-full h-full object-cover"
                                    draggable={false}
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-transparent pointer-events-none" />
                            </div>
                        </div>

                        {/* Navigation Overlay (invisible clicking areas) */}
                        <div className="absolute inset-0 flex z-30">
                            <div className="w-1/2 h-full opacity-0 hover:opacity-100 flex items-center justify-start pl-4 group-hover:opacity-100 transition-opacity">
                                {currentPage > 0 && (
                                    <div className="p-3 rounded-full bg-white/20 backdrop-blur-md shadow-lg border border-white/40 text-black">
                                        <ChevronLeft className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                            <div className="w-1/2 h-full opacity-0 hover:opacity-100 flex items-center justify-end pr-4 group-hover:opacity-100 transition-opacity">
                                {currentPage < totalPages - 1 && (
                                    <div className="p-3 rounded-full bg-white/20 backdrop-blur-md shadow-lg border border-white/40 text-black">
                                        <ChevronRight className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page Number Badge */}
                <div className="absolute -bottom-10 right-4 bg-black/50 backdrop-blur-md text-white/80 text-xs font-mono px-4 py-2 rounded-full border border-white/10 z-20 shadow-lg">
                    {currentPage + 1} / {totalPages}
                </div>
            </div>

            {/* Page Indicator Dots */}
            <div className="flex items-center gap-2 flex-wrap justify-center max-w-[400px] mt-8 relative z-20">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => goToPage(idx, idx > currentPage ? 'right' : 'left')}
                        className={`transition-all duration-300 rounded-full ${idx === currentPage
                            ? 'w-8 h-2 bg-gradient-to-r from-pink-400 to-rose-400 shadow-[0_0_10px_rgba(244,114,182,0.5)]'
                            : 'w-2 h-2 bg-white/15 hover:bg-white/30'
                            }`}
                    />
                ))}
            </div>

            {/* Swipe hint */}
            <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-2 relative z-20 font-medium">
                <BookOpen className="w-4 h-4 text-pink-400/70" />
                Desliza o haz clic en los bordes para pasar página
            </p>

            <style>{`
                @keyframes flipRight {
                    0% { transform: rotateY(0deg); opacity: 1; }
                    40% { opacity: 1; filter: brightness(0.8); }
                    100% { transform: rotateY(-90deg); opacity: 0; filter: brightness(0.5); }
                }
                @keyframes flipLeft {
                    0% { transform: rotateY(90deg); opacity: 0; filter: brightness(0.5); }
                    60% { opacity: 1; filter: brightness(0.8); }
                    100% { transform: rotateY(0deg); opacity: 1; filter: brightness(1); }
                }
                .group:hover > div {
                    transform: rotateX(2deg) rotateY(-2deg) !important;
                }
            `}</style>
        </div>
    );
}
