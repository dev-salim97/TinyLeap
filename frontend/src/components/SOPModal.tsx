import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, ClipboardCheck, Lightbulb, Zap, Target, FileDown, Loader2 } from 'lucide-react';
import type { SOPData } from '../types';
import { useTranslation } from 'react-i18next';
import { domToCanvas } from 'modern-screenshot';
import { jsPDF } from 'jspdf';

interface SOPModalProps {
  data: SOPData;
  onClose: () => void;
}

const SOPModal: React.FC<SOPModalProps> = ({ data, onClose }) => {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    
    setIsExporting(true);
    try {
      // 临时修改样式以确保捕获完整内容
      const element = contentRef.current;
      const originalStyle = element.style.height;
      const originalMaxHeight = element.style.maxHeight;
      const originalOverflow = element.style.overflow;

      element.style.height = 'auto';
      element.style.maxHeight = 'none';
      element.style.overflow = 'visible';

      const canvas = await domToCanvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      // 还原样式
      element.style.height = originalStyle;
      element.style.maxHeight = originalMaxHeight;
      element.style.overflow = originalOverflow;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      // 如果内容超过一页，则需要分页
      let heightLeft = finalHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', (pdfWidth - finalWidth) / 2, position, finalWidth, finalHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft > 1) { // 使用 1mm 的阈值，避免浮点数精度导致的空白页
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', (pdfWidth - finalWidth) / 2, position, finalWidth, finalHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`${data.title || 'SOP'}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('导出 PDF 失败，请尝试使用浏览器打印功能。');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:bg-transparent print:p-0 print:static">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .print-no-scroll {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }
          .print-hide {
            display: none !important;
          }
          /* 确保打印时背景色能显示（部分浏览器需要） */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col print-content"
      >
        {/* Header */}
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-xl text-white">
              <ClipboardCheck size={24} />
            </div>
            <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">{data.title}</h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t('sop.subtitle')}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors print-hide"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content */}
                <div 
                  ref={contentRef}
                  className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar print-no-scroll bg-white"
                >
                  {/* Overview */}
                  <section className="relative p-6 bg-slate-50/50 rounded-2xl border border-slate-100 italic text-slate-600 leading-relaxed text-sm">
                    <div className="absolute -top-3 left-6 px-3 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      {t('sop.overview')}
                    </div>
                    {data.overview}
                  </section>

                  {/* Sections */}
                  <div className="space-y-12">
                    {data.sections.map((section, idx) => (
                      <div key={idx} className="relative group">
                        {/* Behavior Label */}
                        <div className="flex items-center gap-3 mb-6">
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            section.behaviorType === 'golden' 
                              ? 'bg-amber-100 text-amber-600 border border-amber-200' 
                              : 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                          }`}>
                            {section.behaviorType === 'golden' ? t('sop.goldenBadge') : t('sop.challengeBadge')}
                          </div>
                          <h3 className="text-lg font-black text-slate-700">{section.behaviorText}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Steps */}
                          <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                              <Target size={14} className="text-slate-300" />
                              {t('sop.actionSteps')}
                            </h4>
                            <ul className="space-y-3">
                              {section.steps.map((step, sIdx) => (
                                <li key={sIdx} className="flex gap-3 text-sm text-slate-600 font-medium leading-relaxed">
                                  <span className="shrink-0 w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                    {String(sIdx + 1).padStart(2, '0')}
                                  </span>
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Tips & Motivation */}
                          <div className="space-y-8">
                            {/* Tips */}
                            <div className="space-y-4">
                              <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                                <Lightbulb size={14} className="text-amber-400" />
                                {t('sop.proTips')}
                              </h4>
                              <div className="bg-amber-50/30 rounded-2xl p-4 border border-amber-100/50 space-y-3">
                                {section.tips.map((tip, tIdx) => (
                                  <p key={tIdx} className="text-xs text-amber-800/80 font-semibold leading-relaxed flex gap-2">
                                    <span className="text-amber-400">•</span>
                                    {tip}
                                  </p>
                                ))}
                              </div>
                            </div>

                            {/* Motivation */}
                            <div className="space-y-4">
                              <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                                <Zap size={14} className="text-indigo-400" />
                                {t('sop.motivationHack')}
                              </h4>
                              <p className="text-sm text-indigo-800/70 font-medium leading-relaxed bg-indigo-50/30 rounded-2xl p-4 border border-indigo-100/50">
                                {section.motivation}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Divider */}
                        {idx < data.sections.length - 1 && (
                          <div className="mt-12 border-b border-slate-100" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0 print-hide">
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="px-6 py-2 bg-amber-500 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    {isExporting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <FileDown size={16} />
                    )}
                    {isExporting ? 'Exporting...' : t('sop.print')}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-8 py-2 bg-slate-800 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
                  >
                    {t('sop.close')}
                  </button>
                </div>
      </motion.div>
    </div>
  );
};

export default SOPModal;
