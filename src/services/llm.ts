import { ChatOpenAI } from '@langchain/openai';

const API_KEY = import.meta.env.VITE_LLM_API_KEY || '';
const BASE_URL = (import.meta.env.VITE_LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const MODEL_NAME = import.meta.env.VITE_LLM_MODEL || 'gpt-3.5-turbo';

// 获取当前的基础路径，用于开发环境代理
const getBaseUrl = () => {
  if (import.meta.env.DEV) {
    // 强制指向标准的 v1 路径，配合 Vite Proxy
    return window.location.origin + '/api-llm/v1';
  }
  return BASE_URL;
};

// 创建 LangChain ChatOpenAI 实例
export const model = new ChatOpenAI({
  apiKey: API_KEY,
  configuration: {
    baseURL: getBaseUrl(),
  },
  modelName: MODEL_NAME,
  temperature: 0.7,
});

/**
 * 基础调用函数（保留用于兼容）
 */
export async function callLLM(messages: any, jsonMode: boolean = false) {
  console.warn('callLLM is deprecated, please use LangChain instances instead.');
  return null;
}
