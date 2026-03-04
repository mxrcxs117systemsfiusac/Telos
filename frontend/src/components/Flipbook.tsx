import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, ImageIcon } from 'lucide-react';

interface AlbumImage {
    name: string;
    url: string;
}

const FILE_BASE_URL = 'http://localhost:3001';

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
        }, 400);
    };

    const nextPage = () => goToPage(currentPage + 1, 'right');
    const prevPage = () => goToPage(currentPage - 1, 'left');

    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextPage();
            if (e.key === 'ArrowLeft') prevPage();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [currentPage, isFlipping]);

    // Touch/swipe handling
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

    // Click on edges
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
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-6 rounded-full bg-pink-500/10 mb-6">
                    <ImageIcon className="w-16 h-16 text-pink-400/30" />
                </div>
                <p className="text-slate-400 text-lg font-medium mb-2">Tu álbum está vacío</p>
                <p className="text-slate-600 text-sm">Sube fotos desde <span className="text-pink-400">Ajustes → Recursos Visuales</span></p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-6 h-full">
            {/* Book Container */}
            <div
                ref={containerRef}
                className="relative w-full max-w-[500px] aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer select-none group"
                onClick={handleClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ perspective: '1200px' }}
            >
                {/* Book Shadow */}
                <div className="absolute inset-0 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]" />

                {/* Book Spine Decoration */}
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-pink-900/80 to-transparent z-20" />
                <div className="absolute left-2 top-0 bottom-0 w-px bg-pink-500/20 z-20" />

                {/* Current Page Image */}
                <div
                    className={`absolute inset-0 transition-all duration-400 ease-in-out ${isFlipping
                            ? flipDirection === 'right'
                                ? 'opacity-0 scale-95 -translate-x-4'
                                : 'opacity-0 scale-95 translate-x-4'
                            : 'opacity-100 scale-100 translate-x-0'
                        }`}
                >
                    <img
                        src={`${FILE_BASE_URL}${images[currentPage].url}`}
                        alt={`Página ${currentPage + 1}`}
                        className="w-full h-full object-cover"
                        draggable={false}
                    />
                    {/* Vignette overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
                </div>

                {/* Navigation Hints (visible on hover) */}
                <div className="absolute left-0 top-0 bottom-0 w-1/3 flex items-center justify-start pl-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {currentPage > 0 && (
                        <div className="p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
                            <ChevronLeft className="w-6 h-6 text-white/80" />
                        </div>
                    )}
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {currentPage < totalPages - 1 && (
                        <div className="p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
                            <ChevronRight className="w-6 h-6 text-white/80" />
                        </div>
                    )}
                </div>

                {/* Page Number Badge */}
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white/80 text-xs font-mono px-3 py-1.5 rounded-full border border-white/10 z-20">
                    {currentPage + 1} / {totalPages}
                </div>
            </div>

            {/* Page Indicator Dots */}
            <div className="flex items-center gap-2 flex-wrap justify-center max-w-[400px]">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => goToPage(idx, idx > currentPage ? 'right' : 'left')}
                        className={`transition-all duration-300 rounded-full ${idx === currentPage
                                ? 'w-8 h-2 bg-gradient-to-r from-pink-500 to-rose-500'
                                : 'w-2 h-2 bg-white/15 hover:bg-white/30'
                            }`}
                    />
                ))}
            </div>

            {/* Swipe hint */}
            <p className="text-slate-600 text-xs flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Desliza o haz clic en los bordes para pasar página
            </p>
        </div>
    );
}
