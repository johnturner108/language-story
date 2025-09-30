import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const promptTemplate = `# 角色与目标
你是一位专业的俄语老师和内容创作者，专为中文学习者服务。你的核心目标是依据下述规则，生成高质量的、带有详尽注释的俄语文章，以帮助用户高效、准确地学习。

# 核心任务
生成一篇俄语文章。整个输出内容，从俄语单词到每一个注释字符，都必须严格遵守下方的所有格式化规则。

# 规则与限制

1. 通用规则 (General Rules)
* **重音标记**: 每一个俄语单词都必须用重音符号（´）准确标记重音。唯一的例外是天然带重音的字母 \`ё\`，它本身无需添加额外符号。
* **注释范围**: 仅为 **名词 (n)**、**动词 (v)**、**形容词 (adj)** 和 **副词 (adv)** 添加注释。其他任何词性（如代词、前置词等）只标记重音，**绝不添加**任何括号或注释。
* **格式要求**: 注释必须紧跟在单词之后，并用一个**半角空格**隔开。方括号 \`[]\` 及内部所有字符，包括标点符号，都必须是 **半角** (英文) 字符。

2. 分词性注释格式 (POS-Specific Annotation Format)

* **名词 (n)**
    * **格式**: \`[n. 单数主格: 中文翻译]\`
    * **示例**: \`дру́га\` -> \`[n. друг: 朋友]\`

* **形容词 (adj)**
    * **格式**: \`[adj. 阳性单数主格: 中文翻译]\`
    * **示例**: \`хоро́шему\` -> \`[adj. хороший: 好的]\`

* **副词 (adv)**
    * **目标**: 注释副词，并提供其对应的形容词（如果存在）。
    * **格式**: \`[adv. 词根形式: 中文翻译]\`
    * **“词根形式”规则**:
        * 对于由形容词派生的副词，“词根形式”为其对应的**形容词**（阳性单数主格）。
        * 对于没有对应形容词的副词，“词根形式”为**副词本身**。
    * **示例 1 (有对应形容词)**:
        * 单词 \`бы́стро\` 的注释应为: \`[adv. быстрый: 迅速地]\`
    * **示例 2 (无对应形容词)**:
        * 单词 \`вчера́\` 的注释应为: \`[adv. вчера: 昨天]\`

* **动词 (v)**
    * **目标**: 动词注释将以固定的 **“未完成体, 完成体”** 顺序展示动词对，并通过**加粗**来指明文中单词实际对应的原型。
    * **格式**: \`[v. 未完成体不定式 (未), 完成体不定式 (完): 中文翻译]\`
    * **加粗规则**:
        * 如果文中的动词是**未完成体**，则**加粗**前半部分。
        * 如果文中的动词是**完成体**，则**加粗**后半部分。
    * **示例 1 (文中是未完成体)**:
        * 单词 \`чита́л\` 的注释应为: \`[v. **читать (未)**, прочитать (完): 阅读]\`
    * **示例 2 (文中是完成体)**:
        * 单词 \`купи́л\` 的注释应为: \`[v. покупать (未), **купить (完)**: 购买]\`
    * **注意**: 形动词和副动词也归类为动词(v)，并遵循相同的注释规则。

# 正确输出示例
Мой хоро́ший [adj. хороший: 好的] друг [n. друг: 朋友] вчера́ [adv. вчера: 昨天] купи́л [v. покупать (未), **купить (完)**: 购买] интере́сную [adj. интересный: 有趣的] кни́гу [n. книга: 书], кото́рую он до́лго [adv. долгий: 长时间地] чита́л [v. **читать (未)**, прочитать (完): 阅读].


请你输出关于{{topic}}的文章。`;


export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return new NextResponse('Prompt is required', { status: 400 });
        }
        const finalPrompt = promptTemplate.replace('{{topic}}', prompt);

        // const url = 'https://search.bytedance.net/gpt/openapi/online/v2/crawl?ak=DbWO3JBONL1FLkD1DPw2R6Zsf5zF9aZi_GPT_AK'
        // const model = 'gemini-2.5-pro-preview-06-05'
        // const max_tokens = 40960
        // const url = 'https://search.bytedance.net/gpt/openapi/online/multimodal/crawl?ak=fgQQD249xbTBhVnmsKze2ZBJALs3pTxg_GPT_AK'
        // const model = 'gemini-2.5-flash'
        const url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
        const model = 'qwen-plus'
        const api_key = 'sk-03c7d037df484dd281c02e2ed679d03b'
        const max_tokens = 12800

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-TT-LOGID': 'your_logid_here', // You should generate a unique logid for each request
                'Authorization': `Bearer ${api_key}`,
            },
            body: JSON.stringify({
                stream: true,
                model: model,
                max_tokens: max_tokens,
                messages: [
                    {
                        content: finalPrompt,
                        role: 'user',
                    },
                ],
                thinking: {
                    include_thoughts: true,
                    budget_tokens: 2000,
                },
            }),
        });

        if (!response.ok || !response.body) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            return new NextResponse(`API Error: ${errorText}`, { status: response.status });
        }

        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body!.getReader();
                const decoder = new TextDecoder();

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            break;
                        }
                        const chunkString = decoder.decode(value, { stream: true });
                        console.log('[Server] Forwarding chunk:', chunkString); // This log will appear in the terminal
                        // Just forward the chunk
                        controller.enqueue(value);
                    }
                } catch (error) {
                    console.error('Stream reading error:', error);
                    controller.error(error);
                } finally {
                    reader.releaseLock();
                    controller.close();
                }
            },
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Internal Server Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
