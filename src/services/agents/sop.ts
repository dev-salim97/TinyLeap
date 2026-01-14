import { z } from 'zod';
import { model } from '../llm';
import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * SOP 生成专家 Agent
 * 负责为黄金行为和核心挑战生成标准作业程序 (SOP)
 */
export async function generateSOP(
  vision: string, 
  behaviors: { text: string; type: 'golden' | 'challenge' }[], 
  language: string = 'zh'
): Promise<any> {
  try {
    const sopSchema = z.object({
      title: z.string().describe('SOP 的总标题'),
      overview: z.string().describe('SOP 的背景和目标概述'),
      sections: z.array(z.object({
        behaviorText: z.string().describe('对应的行为描述'),
        behaviorType: z.enum(['golden', 'challenge']).describe('行为类型'),
        steps: z.array(z.string()).describe('具体的执行步骤'),
        tips: z.array(z.string()).describe('执行小贴士或注意事项'),
        motivation: z.string().describe('针对该行为的动力维持建议')
      })).describe('每个行为的具体 SOP 章节')
    });

    const structuredModel = model.withStructuredOutput(sopSchema);

    const langName = language === 'zh' ? '中文' : 'English';

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `你是一个流程管理和行为设计专家。
你的任务是根据用户的“核心愿望”以及筛选出的“黄金行为”和“核心挑战”，编写一份实操性极强的 SOP（标准作业程序）。

*** 目标愿望 ***
{vision}

*** 编写原则 ***
1. **可落地性**：步骤必须非常具体，让人看一眼就知道怎么做。
2. **针对性**：
   - 对于 **黄金行为 (Golden)**：重点在于如何将其“自动化”，利用习惯锚点（After I..., I will...）。
   - 对于 **核心挑战 (Challenge)**：重点在于如何“拆解”和“降低难度”，将其转化为更容易执行的版本。
3. **语言风格**：使用 **${langName}**，语气专业、鼓励且简洁。
4. **禁止事项**：在 "steps" 数组中，**禁止**在字符串开头手动添加数字编号（如 "1. "），因为 UI 会自动生成编号。直接输出步骤描述即可。

*** 格式要求 ***
必须返回符合以下结构的 JSON 对象：
{{
  "title": "SOP 标题",
  "overview": "整体概述",
  "sections": [
    {{
      "behaviorText": "原始行为文本",
      "behaviorType": "golden 或 challenge",
      "steps": ["具体步骤描述（不要带数字编号）", "另一个步骤描述"],
      "tips": ["贴士1", "贴士2"],
      "motivation": "动力维持建议"
    }}
  ]
}}`],
      ["user", `请严格按照上述 JSON 格式，为以下行为建立 SOP：
${behaviors.map(b => `- [${b.type === 'golden' ? '黄金行为' : '核心挑战'}] ${b.text}`).join('\n')}`]
    ]);

    const result = await prompt.pipe(structuredModel).invoke({
      vision: vision
    });

    return result;
  } catch (error) {
    console.error("LangChain: Failed to generate SOP", error);
    return null;
  }
}
