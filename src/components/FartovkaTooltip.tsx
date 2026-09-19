import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface FartovkaTooltipProps {
  className?: string;
  iconSize?: number;
}

export const FartovkaTooltip: React.FC<FartovkaTooltipProps> = ({ 
  className = '', 
  iconSize = 15 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        title="Fartovka xizmati haqida ma‘lumot"
        aria-label="Fartovka nima?"
        className="text-amber-600 hover:text-amber-800 p-0.5 rounded-full hover:bg-amber-100 transition inline-flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
      >
        <HelpCircle size={iconSize} className="stroke-[2.2]" />
      </button>

      {isOpen && (
        <div 
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-stone-900 text-white text-xs leading-relaxed rounded-xl shadow-2xl border border-stone-800 pointer-events-auto text-left font-normal animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-stone-800">
            <span className="font-bold text-amber-400 text-xs flex items-center gap-1">
              <span>Fartovka nima?</span>
            </span>
            <span className="text-[10px] text-stone-400 font-mono">Qoplash</span>
          </div>
          <p className="text-stone-200 text-[11px] leading-snug">
            Fartovka — sochiluvchan chiqindilarni (qum, tosh, g‘isht va suvoq qoldiqlari) xavfsiz yuklash va olib ketish uchun qoplarga joylash xizmati.
          </p>
          <div className="mt-1.5 pt-1.5 border-t border-stone-800/80 text-[10px] text-amber-300/90 font-medium">
            💡 Chiqindi oldindan qoplangan bo‘lsa, bu xizmat talab etilmaydi.
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-stone-900" />
        </div>
      )}
    </div>
  );
};
