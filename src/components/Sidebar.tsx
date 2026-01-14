import React, { useState } from 'react';
import { Plus, Trash2, ClipboardCheck, Languages, X, Star, Sparkles, Loader2, Eye, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';
import { generateBehaviors } from '../services/agents/designer';
import type { SOPData, Behavior } from '../types';

interface SidebarProps {
  onAddBehavior: (text: string) => void;
  onAddBehaviors: (behaviors: { text: string; impact: number; ability: number }[]) => void;
  onClearCanvas: () => void;
  isOpen: boolean;
  onClose: () => void;
  vision: string;
  onUpdateVision: (vision: string) => void;
  onGenerateSOP: () => void;
  isGeneratingSOP: boolean;
  existingSOP?: SOPData;
  onViewSOP: () => void;
  behaviors: Behavior[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onAddBehavior, 
  onAddBehaviors,
  onClearCanvas, 
  isOpen, 
  onClose,
  vision,
  onUpdateVision,
  onGenerateSOP,
  isGeneratingSOP,
  existingSOP,
  onViewSOP,
  behaviors
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { t, i18n } = useTranslation();

  const handleMagicBrainstorm = async () => {
    if (!vision.trim() || isGenerating) return;
    
    setIsGenerating(true);
    try {
      const existingTexts = behaviors.map(b => b.text);
      const generated = await generateBehaviors(vision, i18n.language, existingTexts);
      
      if (generated && generated.length > 0) {
        // 客户端过滤：确保生成的内容不在现有列表中
        const uniqueGenerated = generated.filter(
          gb => !existingTexts.some(et => et.trim().toLowerCase() === gb.text.trim().toLowerCase())
        );

        if (uniqueGenerated.length > 0) {
          onAddBehaviors(uniqueGenerated);
        } else {
          // 如果全部重复，可以考虑提示用户或重试，这里先保持静默或记录日志
          console.warn("AI generated only duplicate behaviors, skipping.");
        }
      }
    } catch (error) {
      console.error("Failed to generate behaviors", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(nextLang);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddBehavior(inputValue.trim());
      setInputValue('');
      // On mobile, close sidebar after adding
      if (window.innerWidth < 1024) {
        onClose();
      }
    }
  };

  const handleExport = async () => {
    const canvas = document.getElementById('workshop-canvas');
    if (canvas) {
      const canvasImage = await html2canvas(canvas, {
        backgroundColor: '#f8fafc',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `Golden-Behaviors-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvasImage.toDataURL();
      link.click();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside className={`fixed lg:static inset-y-0 left-0 w-80 bg-white border-r border-black/5 flex flex-col p-8 shadow-2xl lg:shadow-sm z-50 transition-transform duration-300 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tighter">
              <img src="/icon.svg" alt="Logo" className="w-8 h-8" />
              {t('sidebar.title')}
            </h1>
            <p className="text-[10px] text-slate-400 mt-2 font-black tracking-[0.2em] uppercase">{t('sidebar.mode')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-amber-500 transition-all flex items-center gap-1"
              title={i18n.language === 'zh' ? 'Switch to English' : '切换至中文'}
            >
              <Languages size={18} />
              <span className="text-[10px] font-black uppercase">{i18n.language === 'zh' ? 'EN' : 'ZH'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>
        </div>

      <div className="mb-8 p-4 bg-amber-50/50 border border-amber-100/50 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <Star size={40} className="text-amber-500" />
        </div>
        <label className="block text-[11px] font-black text-amber-600/60 uppercase tracking-widest mb-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {t('sidebar.vision')}
        </label>
        <div className="relative">
          <textarea
            value={vision}
            onChange={(e) => onUpdateVision(e.target.value)}
            placeholder={t('sidebar.visionPlaceholder')}
            rows={2}
            className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-slate-700 placeholder:text-slate-300 italic resize-none leading-relaxed"
          />
        </div>
        <button
          onClick={handleMagicBrainstorm}
          disabled={!vision.trim() || isGenerating}
          className="mt-4 w-full py-2 bg-amber-500 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-amber-500/20"
        >
          {isGenerating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {t('sidebar.magicBrainstorm')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-10">
        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('sidebar.brainstorm')}</label>
        <div className="relative group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('sidebar.placeholder')}
            disabled={!vision.trim()}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-[2px] focus:outline-none focus:ring-1 focus:ring-amber-500/20 focus:bg-white transition-all text-sm font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!vision.trim() || !inputValue.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-300 group-hover:text-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto space-y-8">
        <div>
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5">{t('sidebar.workflow')}</h3>
          <ul className="space-y-4">
            <li className="flex gap-4 text-[13px] text-slate-500 font-semibold leading-relaxed">
              <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0 text-slate-400">01</div>
              <span><b className="text-slate-700">{t('sidebar.steps.1.title')}</b>：{t('sidebar.steps.1.desc')}</span>
            </li>
            <li className="flex gap-4 text-[13px] text-slate-500 font-semibold leading-relaxed">
              <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0 text-slate-400">02</div>
              <span><b className="text-slate-700">{t('sidebar.steps.2.title')}</b>：{t('sidebar.steps.2.desc')}</span>
            </li>
            <li className="flex gap-4 text-[13px] text-slate-500 font-semibold leading-relaxed">
              <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0 text-slate-400">03</div>
              <span><b className="text-slate-700">{t('sidebar.steps.3.title')}</b>：{t('sidebar.steps.3.desc')}</span>
            </li>
            <li className="flex gap-4 text-[13px] text-slate-500 font-semibold leading-relaxed">
              <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0 text-slate-400">04</div>
              <span><b className="text-slate-700">{t('sidebar.steps.4.title')}</b>：{t('sidebar.steps.4.desc')}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-auto pt-8 border-t border-black/5 space-y-4">
        {existingSOP ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={onViewSOP}
              disabled={!vision.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 text-white rounded-[2px] font-black text-[12px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-slate-900/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye size={16} />
              {t('sidebar.viewSOP')}
            </button>
            <button
              onClick={onGenerateSOP}
              disabled={isGeneratingSOP || !vision.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-amber-500 text-amber-500 rounded-[2px] font-black text-[12px] uppercase tracking-widest hover:bg-amber-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingSOP ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              {t('sidebar.reGenerateSOP')}
            </button>
          </div>
        ) : (
          <button
            onClick={onGenerateSOP}
            disabled={isGeneratingSOP || !vision.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 text-white rounded-[2px] font-black text-[12px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingSOP ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ClipboardCheck size={16} />
            )}
            {t('sidebar.export')}
          </button>
        )}
        <button
          onClick={onClearCanvas}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-100 text-slate-400 rounded-[2px] font-black text-[12px] uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 transition-all"
        >
          <Trash2 size={16} />
          {t('sidebar.clear')}
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
