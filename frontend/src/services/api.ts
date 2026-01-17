import type { Behavior, AppState, RationalScore, AiChatEntry, SOPData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = {
  async getAllVisions(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/behaviors/all`);
    return response.json();
  },

  async getWorkshop(id?: string): Promise<AppState & { _id: string }> {
    const url = id ? `${API_BASE_URL}/behaviors/${id}` : `${API_BASE_URL}/behaviors`;
    const response = await fetch(url);
    return response.json();
  },

  async createWorkshop(vision: string): Promise<AppState & { _id: string }> {
    const response = await fetch(`${API_BASE_URL}/behaviors/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vision }),
    });
    return response.json();
  },

  async deleteWorkshop(id: string): Promise<void> {
    await fetch(`${API_BASE_URL}/behaviors/${id}`, {
      method: 'DELETE',
    });
  },

  async saveWorkshop(id: string, state: AppState): Promise<void> {
    await fetch(`${API_BASE_URL}/behaviors/save/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
  },

  async generateBehaviors(vision: string, language: string, excludeTexts: string[]): Promise<{ text: string; impact: number; ability: number }[]> {
    const response = await fetch(`${API_BASE_URL}/behaviors/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vision, language, excludeTexts }),
    });
    return response.json();
  },

  async validateBehavior(behavior: string, vision: string, language: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/behaviors/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ behavior, vision, language }),
    });
    return response.json();
  },

  async getNextQuestion(behavior: string, vision: string, history: AiChatEntry[], language: string, validatorCritique?: string): Promise<{ content: string }> {
    const response = await fetch(`${API_BASE_URL}/behaviors/coach/next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ behavior, vision, history, language, validatorCritique }),
    });
    return response.json();
  },

  async getFinalEvaluation(behavior: string, vision: string, history: AiChatEntry[], language: string): Promise<{ summary: string; score: RationalScore }> {
    const response = await fetch(`${API_BASE_URL}/behaviors/coach/final`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ behavior, vision, history, language }),
    });
    return response.json();
  },

  async generateSOP(vision: string, behaviors: Behavior[], language: string): Promise<SOPData> {
    const response = await fetch(`${API_BASE_URL}/behaviors/sop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vision, behaviors, language }),
    });
    return response.json();
  }
};
