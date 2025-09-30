'use client';

import React, { useState, useEffect, useRef } from 'react';
import AnnotatedWord from './AnnotatedWord';
import { type Message } from '$/generated/prisma';

type ChatProps = {
    chatId: string | null;
    initialMessages: Message[];
    onNewChat: (chatId: string) => void;
};

const streamStory = async (
    prompt: string,
    chatId: string | null,
    onChunk: (chunk: string) => void,
    onChatId: (chatId: string) => void
) => {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, chatId }),
    });

    if (response.headers.has('X-Chat-Id')) {
        onChatId(response.headers.get('X-Chat-Id')!);
    }

    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const buffer = decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.substring(6).trim();
                if (data === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.choices?.[0]?.delta?.content) {
                        onChunk(parsed.choices[0].delta.content);
                    }
                } catch (e) {
                    console.error('Failed to parse SSE data:', data);
                }
            }
        }
    }
};

const StoryRenderer = ({ text }: { text: string }) => {
    const regex = /(\S+?)\s*\[(.+?)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }
        parts.push(<AnnotatedWord key={match.index} word={match[1]} annotation={match[2]} />);
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return <>{parts.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>)}</>;
};

const Chat = ({ chatId: activeChatId, initialMessages, onNewChat }: ChatProps) => {
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        const newOptimisticMessage: Message = { id: 'optimistic', content: prompt, role: 'user', createdAt: new Date(), chatId: activeChatId || 'temp' };
        setMessages(prev => [...prev, newOptimisticMessage]);

        let assistantResponse = '';
        const assistantMessageId = `assistant-${Date.now()}`;

        await streamStory(prompt, activeChatId, (chunk) => {
            assistantResponse += chunk;
            setMessages(prev => {
                const existingAssistantMessage = prev.find(m => m.id === assistantMessageId);
                if (existingAssistantMessage) {
                    return prev.map(m => m.id === assistantMessageId ? { ...m, content: assistantResponse } : m);
                } else {
                    const newAssistantMessage: Message = { id: assistantMessageId, content: assistantResponse, role: 'assistant', createdAt: new Date(), chatId: activeChatId || 'temp' };
                    return [...prev, newAssistantMessage];
                }
            });
        }, (newChatId) => {
            if (!activeChatId) {
                onNewChat(newChatId);
            }
        });
        setPrompt('');
        setIsLoading(false);
    };

    return (
        <div className="flex-1 flex flex-col h-screen bg-gray-50">
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-6">
                    {messages.map((message, index) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-2xl p-4 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border'}`}>
                                {message.role === 'assistant' ? <StoryRenderer text={message.content} /> : message.content}
                            </div>
                        </div>
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t bg-white">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="请输入故事主题..."
                        className="w-full px-4 py-2 border rounded-lg"
                        disabled={isLoading}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-300"
                    >
                        {isLoading ? '生成中...' : '发送'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
