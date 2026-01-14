import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, Behavior, Position, RationalScore, AiEvaluation } from './types';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';
import RationalWizard from './components/RationalWizard';
import SOPModal from './components/SOPModal';
import { generateSOP } from './services/agents/sop';
import { COLOR_KEYS } from './constants';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'tinyleap_workshop_data';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    return { behaviors: [] };
  });

  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSOP, setShowSOP] = useState(false);
  const [isGeneratingSOP, setIsGeneratingSOP] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addBehavior = useCallback((text: string) => {
    const newBehavior: Behavior = {
      id: uuidv4(),
      text,
      color: COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)],
      intuitivePosition: { x: 50, y: 50 },
      isEvaluated: false,
      isGolden: false,
      rotation: Math.random() * 4 - 2,
      source: 'user',
    };
    setState(prev => ({
      ...prev,
      behaviors: [...prev.behaviors, newBehavior],
    }));
  }, []);

  const addBehaviors = useCallback((generatedBehaviors: { text: string; impact: number; ability: number }[]) => {
    setState(prev => ({
      ...prev,
      behaviors: [
        ...prev.behaviors,
        ...generatedBehaviors.map((gb): Behavior => ({
          id: uuidv4(),
          text: gb.text,
          color: COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)],
          intuitivePosition: { x: gb.ability, y: gb.impact },
          rotation: Math.random() * 4 - 2,
          isEvaluated: false,
          isGolden: gb.impact >= 60 && gb.ability >= 60,
          source: 'ai',
        })),
      ],
    }));
  }, []);

  const updateBehaviorPosition = useCallback((id: string, pos: Position) => {
    setState(prev => ({
      ...prev,
      behaviors: prev.behaviors.map(b => {
        if (b.id !== id) return b;
        
        // 如果已经评估过，移动位置意味着用户在手动调整“理性评估”后的位置
        // 我们保留评估数据，但更新分值
        if (b.isEvaluated) {
          return {
            ...b,
            rationalScore: {
              ability: pos.x,
              impact: pos.y
            },
            isGolden: pos.x >= 60 && pos.y >= 60,
          };
        }

        // 未评估时，只更新直觉位置
        return { 
          ...b, 
          intuitivePosition: pos,
          isGolden: pos.x >= 60 && pos.y >= 60,
        };
      }),
    }));
  }, []);

  const updateBehaviorText = useCallback((id: string, text: string) => {
    setState(prev => ({
      ...prev,
      behaviors: prev.behaviors.map(b => 
        b.id === id ? { 
          ...b, 
          text,
          isEvaluated: false,
          rationalScore: undefined,
          aiEvaluation: undefined
        } : b
      ),
    }));
  }, []);

  const updateBehavior = useCallback((id: string, updates: Partial<Behavior>) => {
    setState(prev => ({
      ...prev,
      behaviors: prev.behaviors.map(b => 
        b.id === id ? { ...b, ...updates } : b
      ),
    }));
  }, []);

  const completeEvaluation = useCallback((id: string, score: RationalScore, aiEvaluation: AiEvaluation) => {
    setState(prev => ({
      ...prev,
      behaviors: prev.behaviors.map(b => 
        b.id === id ? { 
          ...b, 
          // 评估完成时，当前位置（rationalScore）被设为评估出的分数
          rationalScore: score, 
          aiEvaluation: aiEvaluation,
          isEvaluated: true,
          isGolden: score.impact >= 60 && score.ability >= 60
        } : b
      ),
    }));
    setEvaluatingId(null);
  }, []);

  const deleteBehavior = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      behaviors: prev.behaviors.filter(b => b.id !== id),
    }));
  }, []);

  const updateVision = useCallback((vision: string) => {
    setState(prev => ({ ...prev, vision }));
  }, []);

  const clearCanvas = useCallback(() => {
    if (window.confirm(t('sidebar.clearConfirm'))) {
      setState({ behaviors: [], vision: '', sopData: undefined });
    }
  }, [t]);

  const handleGenerateSOP = useCallback(async () => {
    const relevantBehaviors = state.behaviors
      .filter(b => {
        const impact = b.isEvaluated && b.rationalScore ? b.rationalScore.impact : b.intuitivePosition.y;
        const ability = b.isEvaluated && b.rationalScore ? b.rationalScore.ability : b.intuitivePosition.x;
        
        const isGolden = impact >= 60 && ability >= 60;
        const isChallenge = impact >= 60 && ability < 60;
        return isGolden || isChallenge;
      })
      .map(b => {
        const impact = b.isEvaluated && b.rationalScore ? b.rationalScore.impact : b.intuitivePosition.y;
        const ability = b.isEvaluated && b.rationalScore ? b.rationalScore.ability : b.intuitivePosition.x;
        
        return {
          text: b.text,
          type: (impact >= 60 && ability >= 60) ? 'golden' as const : 'challenge' as const
        };
      });

    if (relevantBehaviors.length === 0) {
      alert(t('sidebar.noBehaviorsForSOP') || '没有找到足够的黄金行为或核心挑战行为来生成 SOP');
      return;
    }

    setIsGeneratingSOP(true);
    try {
      const result = await generateSOP(state.vision || '', relevantBehaviors, i18n.language);
      if (result) {
        setState(prev => ({ ...prev, sopData: result }));
        setShowSOP(true);
      }
    } catch (error) {
      console.error("Failed to generate SOP", error);
    } finally {
      setIsGeneratingSOP(false);
    }
  }, [state.behaviors, state.vision, i18n.language, t]);

  const behaviorToEvaluate = state.behaviors.find(b => b.id === evaluatingId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 relative">
      <Sidebar 
        onAddBehavior={addBehavior} 
        onAddBehaviors={addBehaviors}
        onClearCanvas={clearCanvas}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        vision={state.vision || ''}
        onUpdateVision={updateVision}
        onGenerateSOP={handleGenerateSOP}
        isGeneratingSOP={isGeneratingSOP}
        existingSOP={state.sopData}
        onViewSOP={() => setShowSOP(true)}
        behaviors={state.behaviors}
      />
      
      <main className="flex-1 relative overflow-hidden">
        <Canvas 
          behaviors={state.behaviors}
          onUpdatePosition={updateBehaviorPosition}
          onUpdateText={updateBehaviorText}
          onEvaluate={setEvaluatingId}
          onDelete={deleteBehavior}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          vision={state.vision || ''}
        />
      </main>

      <AnimatePresence>
        {behaviorToEvaluate && (
          <RationalWizard
            behavior={behaviorToEvaluate}
            onClose={() => setEvaluatingId(null)}
            onUpdateBehavior={(updates) => updateBehavior(behaviorToEvaluate.id, updates)}
            onComplete={(score, factors) => completeEvaluation(behaviorToEvaluate.id, score, factors)}
            vision={state.vision || ''}
          />
        )}
        {showSOP && state.sopData && (
          <SOPModal 
            data={state.sopData} 
            onClose={() => setShowSOP(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
