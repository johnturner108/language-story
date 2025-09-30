import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export const runtime = 'nodejs';

const promptFilePath = path.join(process.cwd(), 'src', 'prompts', 'prompt.md');
const promptTemplate = fs.readFileSync(promptFilePath, 'utf-8');

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const user = await db.user.findUnique({ where: { email: session.user.email } });
        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        const { prompt, chatId: existingChatId } = await req.json();

        if (!prompt) {
            return new NextResponse('Prompt is required', { status: 400 });
        }

        const finalPrompt = promptTemplate.replace('{{topic}}', prompt);

        // Save user message
        let chatId = existingChatId;
        if (!chatId) {
            const newChat = await db.chat.create({
                data: {
                    userId: user.id,
                    title: prompt.substring(0, 30), // Use first 30 chars of prompt as title
                },
            });
            chatId = newChat.id;
        }

        await db.message.create({
            data: {
                chatId: chatId,
                content: prompt,
                role: 'user',
            },
        });

        const url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
        const model = 'qwen-plus'
        const api_key = 'sk-03c7d037df484dd281c02e2ed679d03b'
        const max_tokens = 12800

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${api_key}`,
            },
            body: JSON.stringify({
                stream: true,
                model: model,
                max_tokens: max_tokens,
                messages: [{ content: finalPrompt, role: 'user' }],
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
                let fullResponse = '';

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            // Save the full assistant response
                            await db.message.create({
                                data: {
                                    chatId: chatId,
                                    content: fullResponse,
                                    role: 'assistant',
                                },
                            });
                            break;
                        }
                        const chunkString = decoder.decode(value, { stream: true });
                        const lines = chunkString.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.substring(6).trim();
                                if (data === '[DONE]') {
                                    continue;
                                }
                                try {
                                    const parsed = JSON.parse(data);
                                    if (parsed.choices && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                                        fullResponse += parsed.choices[0].delta.content;
                                    }
                                } catch (e) {
                                    // Ignore parsing errors for now
                                }
                            }
                        }
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

        const headers = new Headers();
        headers.set('Content-Type', 'text/event-stream');
        headers.set('Cache-Control', 'no-cache');
        headers.set('Connection', 'keep-alive');
        headers.set('X-Chat-Id', chatId); // Send back the chat ID

        return new NextResponse(stream, { headers });

    } catch (error) {
        console.error('Internal Server Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
