import React, { useState, useEffect, useRef } from 'react';
import type { Behavior, RationalScore, AiEvaluation, AiChatEntry } from '../types';
import { X, BrainCircuit, CheckCircle2, AlertCircle, Loader2, Send, RotateCcw, Target, Zap, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

interface RationalWizardProps {
  behavior: Behavior;
  onClose: () => void;
  onUpdateBehavior: (updates: Partial<Behavior>) => void;
  onComplete: (score: RationalScore, aiEvaluation: AiEvaluation) => void;
  vision: string;
}

const MAX_QUESTIONS = 6;

const RationalWizard: React.FC<RationalWizardProps> = ({ behavior, onClose, onUpdateBehavior, onComplete, vision }) => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<'evaluating' | 'chatting' | 'summary' | 'completed'>(
    'evaluating'
  );
  
  const [aiEval, setAiEval] = useState<AiEvaluation>(behavior.aiEvaluation || {
    isBehavior: behavior.source === 'ai',
    chatHistory: [],
    isComplete: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [finalScore, setFinalScore] = useState<RationalScore | null>(behavior.rationalScore || null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 自动同步 AI 评估状态到父组件，确保即使中途关闭也能保存进度
  useEffect(() => {
    // 只有在有实际评估内容时才同步
    if (aiEval.suggestion || aiEval.chatHistory.length > 0) {
      onUpdateBehavior({
        aiEvaluation: aiEval,
        rationalScore: finalScore || behavior.rationalScore
      });
    }
  }, [aiEval, finalScore, onUpdateBehavior]);

  useEffect(() => {
    if (step === 'evaluating' && !aiEval.suggestion && !isLoading) {
      performInitialCheck();
    }
  }, [step]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiEval.chatHistory, isLoading]);

  const performInitialCheck = async () => {
    setIsLoading(true);
    try {
      const result = await api.validateBehavior(behavior.text, vision, i18n.language);
      
      const newAiEval = {
        ...aiEval,
        isBehavior: result.isBehavior,
        suggestion: result.suggestion,
        scores: result.scores,
        rationalScore: result.rationalScore
      };
      
      setAiEval(newAiEval);

      // 如果 AI 给出了初步评分，且用户还没有正式评分，则设置 finalScore 为 AI 的初步评分
      if (result.rationalScore && !finalScore) {
        setFinalScore(result.rationalScore);
      }
    } catch (error) {
      console.error('Initial check failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startChatAnalysis = async () => {
    setIsLoading(true);
    setStep('chatting');
    
    // 重置对话历史（如果是重新分析）
    const initialHistory: AiChatEntry[] = behavior.source === 'ai' 
      ? [{ role: 'ai', content: t('wizard.aiSourceWelcome') || '我是你的行为设计教练。这个行为是由 AI 灵感爆发生成的，已经过初步筛选。让我们开始深度评测，看看它是否真的适合你。' }]
      : [{ role: 'ai', content: aiEval.suggestion || '' }];
    
    setAiEval(prev => ({
      ...prev,
      chatHistory: [...initialHistory]
    }));

    try {
      const response = await api.getNextQuestion(
        behavior.text, 
        vision, 
        initialHistory, 
        i18n.language,
        aiEval.suggestion
      );

      setAiEval(prev => ({
        ...prev,
        chatHistory: [...prev.chatHistory, { role: 'ai', content: response.content }]
      }));
    } catch (error) {
      console.error('Failed to start chat analysis', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage: AiChatEntry = { role: 'user', content: userInput };
    const updatedHistory = [...aiEval.chatHistory, userMessage];
    
    setAiEval(prev => ({ 
      ...prev, 
      chatHistory: updatedHistory 
    }));
    setUserInput('');
    setIsLoading(true);

    try {
      const questionCount = updatedHistory.filter(m => m.role === 'ai').length;
      
      if (questionCount < MAX_QUESTIONS) {
        const response = await api.getNextQuestion(
          behavior.text, 
          vision, 
          updatedHistory, 
          i18n.language,
          aiEval.suggestion
        );
        
        setAiEval(prev => ({
          ...prev,
          chatHistory: [...prev.chatHistory, { role: 'ai', content: response.content }]
        }));
      } else {
        setStep('summary');
        const { summary, score } = await api.getFinalEvaluation(behavior.text, vision, updatedHistory, i18n.language);
        setAiEval(prev => ({
          ...prev,
          finalSummary: summary,
          isComplete: true
        }));
        setFinalScore(score);
      }
    } catch (error) {
      console.error('Failed to get next AI response', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (finalScore) {
      onComplete(finalScore, { ...aiEval, isComplete: true });
    }
  };

  const handleRegenerate = () => {
    setAiEval({
      isBehavior: false,
      chatHistory: [],
      isComplete: false
    });
    setFinalScore(null);
    setStep('evaluating');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                {behavior.text}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {step === 'evaluating' ? t('wizard.expertTitle') : t('wizard.assessmentTitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {step === 'evaluating' && (
            <div className="space-y-6">
              {isLoading && !aiEval.suggestion ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                  <p className="text-slate-500 font-medium">{t('wizard.analyzing')}</p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Phase Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded uppercase tracking-wider">
                      Phase 01
                    </div>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>

                  {/* 初步评价 */}
                  {behavior.source === 'user' ? (
                    <div className={clsx(
                      "p-6 rounded-2xl border",
                      aiEval.isBehavior ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
                    )}>
                      <div className="flex items-start gap-3">
                        {aiEval.isBehavior ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-rose-500 mt-1" />
                        )}
                        <div>
                          <h3 className={clsx(
                            "font-bold mb-1",
                            aiEval.isBehavior ? "text-emerald-900" : "text-rose-900"
                          )}>
                            {aiEval.isBehavior ? t('wizard.evaluationTitle') : t('wizard.notABehavior')}
                          </h3>
                          <p className={clsx(
                            "text-sm",
                            aiEval.isBehavior ? "text-emerald-700" : "text-rose-700"
                          )}>
                            {aiEval.suggestion}
                          </p>
                        </div>
                      </div>

                      {/* 细分评分展示 */}
                      {aiEval.scores && (
                        <div className="mt-4 grid grid-cols-4 gap-2">
                          {[
                            { label: t('wizard.actionable'), score: aiEval.scores.actionable },
                            { label: t('wizard.specific'), score: aiEval.scores.specific },
                            { label: t('wizard.tiny'), score: aiEval.scores.tiny },
                            { label: t('wizard.relevance'), score: aiEval.scores.relevance },
                          ].map((item, i) => (
                            <div key={i} className="bg-white/50 p-2 rounded-xl border border-black/5 text-center">
                              <div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5 whitespace-nowrap">{item.label}</div>
                              <div className={clsx(
                                "text-sm font-black",
                                item.score >= 8 ? "text-emerald-600" : item.score >= 5 ? "text-amber-600" : "text-rose-600"
                              )}>
                                {item.score}/10
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <h3 className="text-amber-900 font-bold">
                          {t('wizard.aiExpertOpinion') || 'AI 专家评估结论'}
                        </h3>
                      </div>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        {aiEval.suggestion || t('wizard.aiSourceWelcome')}
                      </p>
                    </div>
                  )}

                  {/* 预估分展示 (通用) */}
                  {aiEval.rationalScore && (
                    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-3 bg-amber-500 rounded-full" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {t('wizard.preliminaryScores') || '专家预估分值'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">{t('wizard.impact')}</span>
                            <span className="text-sm font-black text-amber-600">{aiEval.rationalScore.impact}</span>
                          </div>
                          <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${aiEval.rationalScore.impact}%` }} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">{t('wizard.ability')}</span>
                            <span className="text-sm font-black text-blue-500">{aiEval.rationalScore.ability}</span>
                          </div>
                          <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400" style={{ width: `${aiEval.rationalScore.ability}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 历史分析结论 (如果有) */}
                  {aiEval.finalSummary && (
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                      <div className="flex items-center gap-2 mb-3">
                        <BrainCircuit className="w-5 h-5 text-amber-500" />
                        <h3 className="text-amber-900 font-bold">{t('wizard.aiSummary')}</h3>
                      </div>
                      <div className="text-amber-800 text-sm prose prose-amber prose-sm max-w-none">
                        <ReactMarkdown>{aiEval.finalSummary}</ReactMarkdown>
                      </div>
                      
                      {finalScore && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-white p-3 rounded-xl border border-amber-200/50">
                            <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">{t('wizard.impact')}</div>
                            <div className="text-xl font-black text-amber-600">{finalScore.impact}</div>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-amber-200/50">
                            <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">{t('wizard.ability')}</div>
                            <div className="text-xl font-black text-amber-600">{finalScore.ability}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex flex-col gap-3 pt-4">
                    {aiEval.isBehavior && (
                      <>
                        <button
                          onClick={startChatAnalysis}
                          className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-lg hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 active:scale-[0.98]"
                        >
                          {aiEval.isComplete ? t('wizard.reAnalyze') : t('wizard.startAnalysis')}
                        </button>
                        
                        {!aiEval.isComplete && finalScore && (
                          <button
                            onClick={handleConfirm}
                            className="w-full py-3 bg-white border-2 border-amber-500 text-amber-600 rounded-2xl font-bold text-sm hover:bg-amber-50 transition-all active:scale-[0.98]"
                          >
                            {t('wizard.usePreliminaryScore') || '直接使用初步评估结果'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}

              {(step === 'chatting' || step === 'summary' || step === 'completed') && (
                <div className="space-y-4">
                  {/* Phase Header */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded uppercase tracking-wider">
                      Phase 02
                    </div>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                  
                  {aiEval.chatHistory.map((message, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: message.role === 'ai' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={clsx(
                    "flex",
                    message.role === 'ai' ? "justify-start" : "justify-end"
                  )}
                >
                  <div className={clsx(
                "max-w-[85%] p-4 rounded-2xl text-sm shadow-sm prose prose-slate",
                message.role === 'ai' 
                  ? "bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100" 
                  : "bg-amber-500 text-white rounded-tr-none prose-invert"
              )}>
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100">
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  </div>
                </div>
              )}

              {(step === 'summary' || step === 'completed') && aiEval.finalSummary && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-amber-50 rounded-2xl border border-amber-100 mt-8"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-amber-500" />
                    <h3 className="text-amber-900 font-bold">{t('wizard.aiSummary')}</h3>
                  </div>
                  <div className="text-amber-800 text-sm mb-6 leading-relaxed prose prose-amber prose-sm max-w-none">
                    <ReactMarkdown>{aiEval.finalSummary}</ReactMarkdown>
                  </div>
                  
                  {finalScore && (
                    <div className="mt-6 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                            {t('wizard.aiSummary')}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <div className="w-2 h-2 rounded-full bg-slate-100 border border-slate-200" />
                            {t('wizard.chart.userTitle')}
                          </div>
                          <div className="flex items-center gap-1.5 text-amber-500">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            {t('wizard.chart.aiTitle')}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* Impact Comparison */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Target size={14} className="opacity-70" />
                              <span className="text-[10px] font-black uppercase tracking-widest">{t('wizard.chart.impact')}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-slate-800">{finalScore.impact}</span>
                              <span className="text-[9px] font-bold text-slate-400">/ 100</span>
                            </div>
                          </div>
                          <div className="relative h-2 bg-slate-50 rounded-full overflow-hidden">
                            {/* User Score Ghost Bar */}
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${behavior.rationalScore?.impact || 0}%` }}
                              className="absolute inset-y-0 left-0 bg-slate-200/40 border-r border-slate-300/30 z-10"
                            />
                            {/* AI Score Bar */}
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${finalScore.impact}%` }}
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.2)] z-20"
                            />
                          </div>
                        </div>

                        {/* Ability Comparison */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Zap size={14} className="opacity-70" />
                              <span className="text-[10px] font-black uppercase tracking-widest">{t('wizard.chart.ability')}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-slate-800">{finalScore.ability}</span>
                              <span className="text-[9px] font-bold text-slate-400">/ 100</span>
                            </div>
                          </div>
                          <div className="relative h-2 bg-slate-50 rounded-full overflow-hidden">
                            {/* User Score Ghost Bar */}
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${behavior.rationalScore?.ability || 0}%` }}
                              className="absolute inset-y-0 left-0 bg-slate-200/40 border-r border-slate-300/30 z-10"
                            />
                            {/* AI Score Bar */}
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${finalScore.ability}%` }}
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.2)] z-20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {step === 'summary' ? (
                      <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                      >
                        {t('wizard.confirmAndGenerate')}
                      </button>
                    ) : (
                      <button
                        onClick={handleRegenerate}
                        className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {t('wizard.regenerate')}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        {step === 'chatting' && (
          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={t('wizard.chatPlaceholder')}
                className="flex-1 p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                onClick={handleSendMessage}
                disabled={!userInput.trim() || isLoading}
                className="p-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-all active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest">
              {aiEval.chatHistory.filter(m => m.role === 'ai').length} / {MAX_QUESTIONS} {t('wizard.questionsCount')}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RationalWizard;
