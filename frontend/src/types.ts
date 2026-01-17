export interface Position {
  x: number;
  y: number;
}

export interface RationalScore {
  impact: number; // 0-100
  ability: number; // 0-100
}

export interface FoggFactors {
  time: number; // 1-5
  money: number; // 1-5
  physicalEffort: number; // 1-5
  mentalCycles: number; // 1-5
  socialDeviance: number; // 1-5
  nonRoutine: number; // 1-5
}

export type MorandiColor = 'blue' | 'green' | 'pink' | 'yellow' | 'purple' | 'gray';

export interface AiChatEntry {
  role: 'ai' | 'user';
  content: string;
}

export interface AiEvaluation {
  isBehavior: boolean;
  suggestion?: string;
  scores?: {
    actionable: number;
    specific: number;
    tiny: number;
    relevance: number;
  };
  chatHistory: AiChatEntry[];
  finalSummary?: string;
  isComplete: boolean;
  rationalScore?: RationalScore;
}

export interface Behavior {
  id: string;
  text: string;
  color: MorandiColor;
  intuitivePosition: Position; // 0-100 (mapped from canvas %)
  rationalScore?: RationalScore;
  foggFactors?: FoggFactors; // Keep for compatibility but we will stop using it for new evaluations
  isEvaluated: boolean;
  isGolden: boolean;
  rotation: number; // -2 to 2 degrees
  aiEvaluation?: AiEvaluation;
  source?: 'user' | 'ai';
}

export interface AppState {
  behaviors: Behavior[];
  vision?: string;
  sopData?: SOPData;
}

export interface SOPSection {
  behaviorText: string;
  behaviorType: 'golden' | 'challenge';
  steps: string[];
  tips: string[];
  motivation: string;
}

export interface SOPData {
  title: string;
  overview: string;
  sections: SOPSection[];
}
