import React, { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Behavior } from '../types';
import { MORANDI_COLORS } from '../constants';
import { Trash2, Star, BrainCircuit, Sparkles, Target, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StickyNoteProps {
  behavior: Behavior;
  canvasDimensions: { width: number; height: number };
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onDragStart: () => void;
  onDragEnd: (x: number, y: number) => void;
  onUpdateText: (text: string) => void;
  onEvaluate: () => void;
  onDelete: () => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({
  behavior,
  canvasDimensions,
  canvasRef,
  onDragStart,
  onDragEnd,
  onUpdateText,
  onEvaluate,
  onDelete,
}) => {
  const { width, height } = canvasDimensions;
  const noteRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(behavior.text);

  const fontSizeClass = useMemo(() => {
    const len = behavior.text.length;
    if (len < 20) return 'text-sm';
    if (len < 50) return 'text-xs';
    return 'text-[10px]';
  }, [behavior.text]);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleTextSubmit = () => {
    setIsEditing(false);
    if (editText.trim() && editText !== behavior.text) {
      onUpdateText(editText.trim());
    } else {
      setEditText(behavior.text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(behavior.text);
    }
  };

  // Calculate position in pixels from 0-100 state
  const initialPos = useMemo(() => {
    // 如果画布尺寸还没准备好，先返回一个安全的位置（或者由父组件控制不渲染）
    if (width === 0 || height === 0) {
      return { x: -200, y: -200 }; // 放在屏幕外
    }

    // 始终显示在“理性坐标”上（如果已评估），否则显示在“直觉坐标”上
    const currentPos = behavior.isEvaluated && behavior.rationalScore 
      ? { x: behavior.rationalScore.ability, y: behavior.rationalScore.impact }
      : behavior.intuitivePosition;

    return {
      x: (currentPos.x / 100) * width - 60,
      y: (1 - currentPos.y / 100) * height - 60
    };
  }, [behavior.isEvaluated, behavior.rationalScore, behavior.intuitivePosition, width, height]);

  // 如果尺寸未准备好，不渲染，避免闪烁或跳动
  if (width === 0 || height === 0) return null;

  const handleDragEnd = () => {
    if (noteRef.current) {
      const rect = noteRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      onDragEnd(centerX, centerY);
    }
  };

  return (
    <motion.div
      ref={noteRef}
      drag
      dragConstraints={canvasRef}
      dragElastic={0}
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
      initial={{ 
        x: initialPos.x, 
        y: initialPos.y, 
        rotate: behavior.rotation,
        opacity: 0,
        scale: 0.5
      }}
      animate={{ 
        x: initialPos.x, 
        y: initialPos.y, 
        rotate: behavior.rotation,
        opacity: 1,
        scale: 1
      }}
      whileDrag={{ 
        zIndex: 50,
        scale: 1.05,
        rotate: 0,
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
      }}
      whileHover={{
        zIndex: 40,
        scale: 1.02,
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)"
      }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 30
      }}
      style={{ 
        backgroundColor: MORANDI_COLORS[behavior.color],
        position: 'absolute',
        top: 0,
        left: 0,
      }}
      className={cn(
        "w-[120px] h-[120px] p-3 flex flex-col justify-between cursor-grab active:cursor-grabbing",
        "skeuo-card group",
        behavior.isGolden && "ring-2 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        isEditing && "cursor-default active:cursor-default"
      )}
      onDoubleClick={() => setIsEditing(true)}
    >
      {behavior.isGolden && (
        <div className="absolute -top-2 -right-2 text-amber-500 drop-shadow-sm z-10 pointer-events-none">
          <Star size={20} fill="currentColor" />
        </div>
      )}

      {/* Action: Delete - Top Right (Offset from Star) */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-1 right-1 p-1 hover:bg-red-500/10 rounded-full text-slate-400 hover:text-red-500 transition-all z-20 lg:opacity-0 lg:group-hover:opacity-100"
        title={t('note.delete')}
      >
        <Trash2 size={12} />
      </button>

      {behavior.isEvaluated && (
        <div className="absolute -top-1.5 -left-1.5 p-1 bg-white rounded-full shadow-sm border border-amber-100 text-amber-500 z-10">
          <BrainCircuit size={12} />
        </div>
      )}

      {isEditing ? (
        <textarea
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleTextSubmit}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full h-full bg-transparent font-semibold text-slate-700 leading-tight outline-none resize-none border-none p-0 mt-5 pr-2 focus:ring-0",
            fontSizeClass
          )}
          spellCheck={false}
        />
      ) : (
        <div className={cn(
          "font-semibold text-slate-700 leading-tight overflow-y-auto break-words note-content pr-1 custom-scrollbar max-h-[75px] mt-5 w-full",
          fontSizeClass
        )}>
          {behavior.text}
        </div>
      )}

      <div className="mt-auto flex items-end justify-between">
        {behavior.isEvaluated && behavior.rationalScore && (
          <div className="flex flex-col gap-1 mb-0.5">
            <div className="flex items-center gap-1">
              <Target size={8} className="text-amber-600/60 flex-shrink-0" />
              <div className="w-8 h-1 bg-black/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500" 
                  style={{ width: `${behavior.rationalScore.impact}%` }} 
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Zap size={8} className="text-blue-600/60 flex-shrink-0" />
              <div className="w-8 h-1 bg-black/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-400" 
                  style={{ width: `${behavior.rationalScore.ability}%` }} 
                />
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end ml-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onEvaluate(); }}
            className="p-1.5 hover:bg-black/5 rounded-xl text-slate-400 hover:text-amber-500 transition-colors lg:opacity-0 lg:group-hover:opacity-100 flex-shrink-0"
            title={t('note.evaluate')}
          >
            <Sparkles size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default StickyNote;
