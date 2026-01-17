// src/services/agents/validator.ts

import { z } from 'zod';
import { model } from '../llm.js';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { AiEvaluation } from '../../types.js';

export async function checkIsBehavior(behavior: string, vision: string, language: string = 'zh'): Promise<{ 
  isBehavior: boolean; 
  suggestion: string;
  scores?: {
    actionable: number;
    specific: number;
    tiny: number;
    relevance: number;
  };
  rationalScore?: {
    impact: number;
    ability: number;
  };
}> {
  try {
    const langName = language === 'zh' ? '中文' : 'English';
    const schema = z.object({
      isBehavior: z.boolean().describe('是否符合行为设计的基本定义'),
      suggestion: z.string().describe('针对该行为的深度点评或改进建议'),
      scores: z.object({
        actionable: z.number().min(0).max(10).describe('动作导向程度：是否是具体的动作而非结果'),
        specific: z.number().min(0).max(10).describe('明确程度：时间、地点、对象是否清晰'),
        tiny: z.number().min(0).max(10).describe('微小程度：是否容易启动，不需要消耗意志力'),
        relevance: z.number().min(0).max(10).describe('关联程度：该行为与用户愿望的契合度'),
      }).describe('各项指标评分（0-10）'),
      rationalScore: z.object({
        impact: z.number().min(0).max(100).describe('初步估算的影响力（0-100）'),
        ability: z.number().min(0).max(100).describe('初步估算的可行性/能力要求（0-100）'),
      }).optional().describe('AI 对该行为影响力和可行性的初步估算')
    });

    // 结构化输出模型 - 强制使用 jsonMode
    const structuredModel = model.withStructuredOutput(schema, {
      method: "jsonMode"
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `你是一个严格的行为科学校验专家，精通 BJ Fogg 的行为模型和 Tiny Habits 方法论。
你的任务是评估用户输入的行为是否合格，并分析其与愿望的关联度。

*** 核心愿望 ***
{vision}

*** 校验维度 ***
1. **Actionable (动作导向)**：必须是能直接“做”出来的动作（如“打开电脑”），而不是愿望或结果（如“变聪明”、“不刷手机”）。
2. **Specific (明确)**：是否包含具体的对象或情境？越模糊越难执行。
3. **Tiny (微小)**：是否足够简单？理想的行为应该在 30 秒内完成，不需要消耗意志力。
4. **Relevance (关联度)**：该行为是否真的能有效服务于上述“核心愿望”？

*** 判定逻辑 ***
- 如果总分较低或不是动作：isBehavior = false。
- suggestion：请给出深度点评。如果合格，指出其精妙之处；如果不合格，给出具体的“微缩”建议。同时点评其与愿望的关联程度。

*** 严格格式要求 ***
1. 必须严格遵守输出模式，仅返回 JSON 对象。
2. 确保输出包含 "isBehavior", "suggestion", "scores" 这三个根键。
3. **scores 内部的键必须全部小写**："actionable", "specific", "tiny", "relevance"。
4. **严禁使用单引号 (')** 来包裹字符串，必须使用标准双引号 (")。
5. 必须使用 **${langName}** 输出所有文本内容。`],
      ["user", language === 'zh' ? "请校验行为：'{behavior}'" : "Please validate behavior: '{behavior}'"]
    ]);

    const result = await prompt.pipe(structuredModel).invoke({
      behavior: behavior,
      vision: vision
    });

    return result as any;
  } catch (error) {
    console.error("LangChain: Failed to validate", error);
    return { 
      isBehavior: true, 
      suggestion: language === 'zh' ? "AI 暂时无法校验，假定通过。" : "AI validation temporarily unavailable, assuming it passed.",
      scores: { actionable: 8, specific: 8, tiny: 8, relevance: 8 }
    };
  }
}

// evaluateBehavior function remains the same...
export async function evaluateBehavior(behavior: string, vision: string, language: string = 'zh'): Promise<AiEvaluation> {
    try {
      const check = await checkIsBehavior(behavior, vision, language);
      const evaluation: AiEvaluation = {
        isBehavior: check.isBehavior,
        suggestion: check.suggestion,
        chatHistory: [],
        isComplete: false
      };
      
      if (check.scores) evaluation.scores = check.scores;
      if (check.rationalScore) evaluation.rationalScore = check.rationalScore;
      
      return evaluation;
    } catch (error) {
      console.error("Failed to evaluate behavior", error);
      return {
        isBehavior: true,
        suggestion: language === 'zh' ? "评估过程中出现错误，请重试。" : "An error occurred during evaluation, please try again.",
        scores: { actionable: 8, specific: 8, tiny: 8, relevance: 8 },
        chatHistory: [],
        isComplete: false
      };
    }
}