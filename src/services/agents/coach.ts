// src/services/agents/coach.ts

import { z } from 'zod';
import { model } from '../llm';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import type { AiChatEntry, RationalScore } from '../../types';

// 优化 1: 提问逻辑
export async function getNextQuestion(
  behavior: string, 
  vision: string, 
  history: AiChatEntry[],
  onChunk: (chunk: string) => void,
  language: string = 'zh',
  validatorCritique?: string
): Promise<string> {
  try {
    const langName = language === 'zh' ? '中文' : 'English';
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `你是一个基于 BJ Fogg 模型的行为教练。
目标：通过提问，找出阻碍用户执行行为 '{behavior}' 的核心因素（能力障碍）或动机强弱。

*** 诊断指南 ***
1. **如果已有校验反馈**：先结合 '{validatorCritique}' 与用户沟通。如果校验指出行为不够微小或不够具体，你的首要任务是引导用户“缩小”或“明确”这个行为。
2. **能力链诊断**：当行为本身已经足够微小时，请按照以下顺序挖掘障碍点：
   - 时间、金钱、体力、脑力、日程符合度。
3. **风格要求**：像朋友一样交谈，简短有力。必须使用 **${langName}** 进行对话。`],
      new MessagesPlaceholder("history"),
      ["user", history.length === 0 ? (language === 'zh' ? `我想通过 "{behavior}" 来实现 "{vision}"，帮我分析一下。` : `I want to achieve "{vision}" through "{behavior}", please help me analyze it.`) : "{input}"]
    ]);
    
    const langHistory = history.map(entry => 
      entry.role === 'ai' ? new AIMessage(entry.content) : new HumanMessage(entry.content)
    );

    const stream = await prompt.pipe(model).stream({
      behavior,
      vision,
      history: langHistory,
      input: history.length > 0 ? history[history.length - 1].content : "",
      validatorCritique: validatorCritique || ""
    });

    let fullText = "";
    for await (const chunk of stream) {
      const content = chunk.content.toString();
      fullText += content;
      onChunk(content);
    }
    return fullText;
  } catch (error) {
    console.error("LangChain: Coach error", error);
    return "如果我们把这个行为变得更简单一点，你觉得会是什么样？";
  }
}

// 优化 2: 最终评估
export async function getFinalEvaluation(
  behavior: string, 
  vision: string, 
  history: AiChatEntry[],
  _onChunk?: (chunk: string) => void,
  language: string = 'zh'
): Promise<{ summary: string; score: RationalScore }> {
  try {
    const langName = language === 'zh' ? '中文' : 'English';
    const schema = z.object({
      reasoning: z.string().describe('评分背后的逻辑分析，解释为什么给这个分'),
      summary: z.string().describe('给用户的最终反馈，Markdown格式'),
      score: z.object({
        impact: z.number().min(0).max(100),
        ability: z.number().min(0).max(100),
      })
    });

    // 结构化输出模型 - 强制使用 jsonMode
    const structuredModel = model.withStructuredOutput(schema, {
      method: "jsonMode"
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `你是一个行为设计评分系统。
请根据对话历史，客观评估行为 '{behavior}' 对愿望 '{vision}' 的价值。

*** 评分标准 (BJ Fogg Model) ***
1. **Ability (可行性)**：
   - 90-100: 不需要意志力，随时能做（如：喝水）。
   - 50-80: 需要一点努力，但不需要特殊资源。
   - 0-40: 需要大量时间、金钱 or 极高意志力。

2. **Impact (影响力)**：
   - 90-100: 对愿望实现有直接、决定性的作用。
   - 50-80: 有帮助，但需要长期积累。
   - 0-40: 关联度低，或者只是安慰剂行为。

*** 严格格式要求 ***
1. 必须严格遵守输出模式，仅返回 JSON 对象。
2. 确保输出包含 "reasoning", "summary", "score" 这三个根键。
3. **严禁使用单引号 (')** 来包裹字符串，必须使用标准双引号 (")。
4. 请先在 reasoning 字段中进行一步步思考，然后在 score 中给出结论。summary 字段是给用户看的最终建议。
5. 必须使用 **${langName}** 输出 reasoning 和 summary。`],
      new MessagesPlaceholder("history"),
      ["user", language === 'zh' ? "请给出最终评估报告。" : "Please provide the final evaluation report."]
    ]);
    
    // ... invoke logic ...
    const langHistory = history.map(entry => 
      entry.role === 'ai' ? new AIMessage(entry.content) : new HumanMessage(entry.content)
    );

    const result = await prompt.pipe(structuredModel).invoke({
      behavior,
      vision,
      history: langHistory
    });

    return result;
  } catch (error) {
    // Fallback
    return {
      summary: "评估完成。根据对话，这是一个值得尝试的行为。",
      score: { impact: 60, ability: 60 }
    };
  }
}