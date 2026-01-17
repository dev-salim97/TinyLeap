import React, { useRef, useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import type { Behavior, Position } from '../types';
import StickyNote from './StickyNote';
import { useTranslation } from 'react-i18next';

interface CanvasProps {
  behaviors: Behavior[];
  onUpdatePosition: (id: string, pos: Position) => void;
  onUpdateText: (id: string, text: string) => void;
  onEvaluate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleSidebar: () => void;
  vision: string;
}

const Canvas: React.FC<CanvasProps> = ({ 
  behaviors, 
  onUpdatePosition, 
  onUpdateText,
  onEvaluate,
  onDelete,
  onToggleSidebar,
  vision
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { t } = useTranslation();

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        setDimensions({
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleDragEnd = (id: string, x: number, y: number) => {
    if (!canvasRef.current) return;
    
    // Map pixels to 0-100
    // x: 0 (left) to 100 (right - Easy)
    // y: 0 (bottom - Low Impact) to 100 (top - High Impact)
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Ensure the drop coordinates are within the canvas rectangle
    const boundedX = Math.max(rect.left, Math.min(rect.right, x));
    const boundedY = Math.max(rect.top, Math.min(rect.bottom, y));

    const relativeX = ((boundedX - rect.left) / rect.width) * 100;
    const relativeY = (1 - (boundedY - rect.top) / rect.height) * 100;

    onUpdatePosition(id, { 
      x: Math.max(0, Math.min(100, relativeX)), 
      y: Math.max(0, Math.min(100, relativeY)) 
    });
  };

  return (
    <div 
      ref={canvasRef}
      className="w-full h-full relative bg-dot-pattern select-none overflow-hidden"
      id="workshop-canvas"
    >
      {/* Mobile Menu Toggle */}
      <button
        onClick={onToggleSidebar}
        className="absolute top-4 left-4 z-30 p-3 bg-white/80 backdrop-blur shadow-lg border border-black/5 rounded-xl text-slate-600 lg:hidden hover:text-amber-500 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Vision Header Plate - Recentered and offset from Y-axis text */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center group pointer-events-none">
        <div className="px-6 py-2 bg-white/40 backdrop-blur-md border border-white/40 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex items-center gap-3 transition-all hover:bg-white/60">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <h2 className="text-xs md:text-sm font-black text-slate-800 tracking-tight italic uppercase">
            {vision || t('sidebar.visionPlaceholder')}
          </h2>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        </div>
        <div className="mt-1.5 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-60 group-hover:opacity-100 transition-opacity">
          {t('sidebar.currentVision')}
        </div>
      </div>

      {/* Visual Quadrants / Labels */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Central Axes with Arrows */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#CBD5E1" />
            </marker>
          </defs>
          {/* X Axis */}
          <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="#CBD5E1" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
          {/* Y Axis */}
          <line x1="50%" y1="95%" x2="50%" y2="5%" stroke="#CBD5E1" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
        </svg>

        {/* Axis Labels */}
        <div className="absolute inset-0 pointer-events-none">
          {/* X Axis Extremes (Ability) - Positioned below the axis line */}
          <span className="absolute left-6 top-[53%] text-[11px] font-black text-slate-400 uppercase tracking-wider max-w-[120px] leading-tight">{t('canvas.extremes.hard')}</span>
          <span className="absolute right-8 top-[53%] text-[11px] font-black text-slate-400 uppercase tracking-wider max-w-[120px] text-right leading-tight">{t('canvas.extremes.easy')}</span>

          {/* Y Axis Extremes (Impact) - Positioned further to the right to avoid centered vision plate */}
          <span className="absolute left-[52%] bottom-6 text-[11px] font-black text-slate-400 uppercase tracking-wider leading-tight whitespace-pre-line">{t('canvas.extremes.low')}</span>
          <span className="absolute left-[54%] top-14 text-[11px] font-black text-slate-400 uppercase tracking-wider leading-tight whitespace-pre-line">{t('canvas.extremes.high')}</span>
        </div>

        {/* Quadrant Names */}
        <div className="absolute top-[25%] right-[25%] translate-x-1/2 -translate-y-1/2 text-amber-500/20 font-black text-3xl md:text-5xl italic rotate-[-5deg] pointer-events-none select-none tracking-tighter text-center">
          {t('canvas.quadrants.golden')}
        </div>
        <div className="absolute top-[25%] left-[25%] -translate-x-1/2 -translate-y-1/2 text-slate-300/20 font-black text-3xl md:text-5xl italic rotate-[5deg] pointer-events-none select-none tracking-tighter text-center">
          {t('canvas.quadrants.challenge')}
        </div>
        <div className="absolute bottom-[25%] right-[25%] translate-x-1/2 translate-y-1/2 text-slate-300/20 font-black text-3xl md:text-5xl italic rotate-[5deg] pointer-events-none select-none tracking-tighter text-center">
          {t('canvas.quadrants.quickWins')}
        </div>
        <div className="absolute bottom-[25%] left-[25%] -translate-x-1/2 translate-y-1/2 text-slate-300/20 font-black text-3xl md:text-5xl italic rotate-[-5deg] pointer-events-none select-none tracking-tighter text-center">
          {t('canvas.quadrants.lowPriority')}
        </div>

        {/* Golden Area Background (Impact > 60 and Ability > 60 - i.e., Easy) */}
        <div 
          className="absolute top-0 right-0 bg-amber-500/5 border-l border-b border-amber-500/10 transition-all duration-500" 
          style={{ width: '40%', height: '40%', borderBottomLeftRadius: '40px' }}
        />
      </div>

      {/* Behaviors */}
      {behaviors.map((behavior) => (
        <StickyNote
          key={behavior.id}
          behavior={behavior}
          canvasDimensions={dimensions}
          canvasRef={canvasRef}
          onDragStart={() => {}}
          onDragEnd={(x, y) => handleDragEnd(behavior.id, x, y)}
          onUpdateText={(text) => onUpdateText(behavior.id, text)}
          onEvaluate={() => onEvaluate(behavior.id)}
          onDelete={() => onDelete(behavior.id)}
        />
      ))}
    </div>
  );
};

export default Canvas;
