import { z } from 'zod';
import { model } from '../llm';
import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * 行为设计专家 Agent
 * 负责生成符合 Fogg 模型的行为建议
 */
export async function generateBehaviors(
  vision: string, 
  language: string = 'zh', 
  excludeTexts: string[] = []
): Promise<{ text: string; impact: number; ability: number }[]> {
  try {
    const behaviorSchema = z.object({
      behaviors: z.array(z.object({
        text: z.string().describe('具体行为描述，必须是明确的动作'),
        impact: z.number().min(0).max(100).describe('影响力 (0-100)'),
        ability: z.number().min(0).max(100).describe('可行性 (0-100)'),
        rationale: z.string().describe('为什么这个行为有效'),
      })).describe('生成的一组行为建议')
    });

    // 结构化输出模型 - 强制使用 jsonMode 并提供更清晰的结构引导
    const structuredModel = model.withStructuredOutput(behaviorSchema, {
      method: "jsonMode"
    });

    const langName = language === 'zh' ? '中文' : 'English';
    const excludeInfo = excludeTexts.length > 0 
      ? `*** 严格禁止项 (严禁生成以下已存在的行为) ***\n${excludeTexts.map(t => `- ${t}`).join('\n')}\n请确保生成的新行为在语义和文本上都与上述列表完全不同。`
      : '';

    // 优化提示词：明确要求根节点必须包含 behaviors 键
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `你是一个行为设计大师，精通 BJ Fogg 行为模型。
你的任务是将用户的愿望转化为具体的“微行为”。

${excludeInfo}

*** 行为生成标准 (必须严格遵守) ***
1. **动作导向 (Actionable)**：行为必须是具体的物理动作，用户可以直接执行，而不是抽象的愿望或结果。
2. **极其微小 (Tiny)**：每个行为都应该非常简单，理想情况下应在 30 秒内完成，以降低启动门槛。
3. **清晰明确 (Specific)**：描述中应包含明确的对象或简单的触发情境。
4. **排除重复**：绝对禁止返回与上述“严格禁止项”中相同的行为文本。即使相似也要进行差异化处理。

*** 核心要求：数据分布多样性 ***
不要只生成完美的“黄金行为”。请生成一组分布在不同象限的行为建议，包含：
1. **黄金行为 (Golden Behaviors)**：高影响(70-100) + 高可行(70-100)。最理想的行为。
2. **快速胜利 (Quick Wins)**：低影响(20-50) + 高可行(80-100)。容易开始的小事，建立信心。
3. **核心挑战 (Core Challenges)**：高影响(80-100) + 低可行(20-50)。很难做，但如果不做就无法成功。

*** 严格格式要求 ***
1. 必须返回一个包含 "behaviors" 键的 JSON 对象，其值是一个数组。
   示例格式：{{"behaviors": [{{"text": "...", "impact": 80, "ability": 90, "rationale": "..."}}]}}
2. **严禁使用单引号 (')** 来包裹字符串，必须使用标准双引号 (")。
3. 必须使用 **${langName}** 输出所有文本内容。`],
      ["user", language === 'zh' 
        ? "我的核心愿望是：'{vision}'。请为我生成 5-8 个具体的微行为建议，确保行为符合 Tiny Habit 标准，并覆盖上述三个维度。" 
        : "My core aspiration is: '{vision}'. Please generate 5-8 specific micro-behavior suggestions for me, ensuring they meet Tiny Habit standards and cover the three dimensions mentioned above."]
    ]);

    // 执行链
    const result = await prompt.pipe(structuredModel).invoke({
      vision: vision
    });

    return result.behaviors;
  } catch (error) {
    console.error("LangChain: Failed to generate behaviors", error);
    // 返回空数组，由 UI 处理空状态
    return [];
  }
}