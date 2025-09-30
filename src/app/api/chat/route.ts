import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const promptFilePath = path.join(process.cwd(), 'src', 'prompts', 'prompt.md');
const promptTemplate = fs.readFileSync(promptFilePath, 'utf-8');


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
