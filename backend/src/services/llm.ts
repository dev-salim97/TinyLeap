import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.LLM_API_KEY || '';
const ENV_BASE_URL = process.env.LLM_BASE_URL;
const MODEL_NAME = process.env.LLM_MODEL || 'gpt-3.5-turbo';

// 获取当前的基础路径
const getBaseUrl = () => {
  // 1. 优先使用显式设置的环境变量
  if (ENV_BASE_URL && ENV_BASE_URL.trim() !== '') {
    return ENV_BASE_URL.replace(/\/$/, '');
  }

  // 2. 兜底方案
  return 'https://api.openai.com/v1';
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
export async function callLLM(_messages: any, _jsonMode: boolean = false) {
  console.warn('callLLM is deprecated, please use LangChain instances instead.');
  return null;
}
