'use client';

'use client';

import React, { useState } from 'react';
import AnnotatedWord from './AnnotatedWord';






const streamStory = async (prompt: string, onChunk: (chunk: string) => void) => {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
    });

    if (!response.body) {
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        // The response is a stream of SSE.
        // A event is something like: 
        // data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1727677595,"model":"gemini-2.5-pro-preview-06-05","choices":[{"index":0,"delta":{"content":"Мой"},"finish_reason":null}]}
        // It's possible that a single `read()` call returns a partial event.
        // It's also possible that a single `read()` call returns multiple events.
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        // The last line could be incomplete, so we keep it in the buffer.
        buffer = lines.pop() ?? '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.substring(6).trim();
                console.log('[Browser] Received data chunk:', data); // This log will appear in the browser console
                if (data === '[DONE]') {
                    return;
                }
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.choices && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                            onChunk(parsed.choices[0].delta.content);
                        }
                    } catch (e) {
                        console.error('Failed to parse SSE data:', data);
                    }
                }
            }
        }
    }
};

const StoryRenderer = ({ text }: { text: string }) => {
    // Regex to find patterns like "word [annotation]"
    const regex = /(\S+?)\s*\[(.+?)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Add the text before the match
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        const [fullMatch, word, annotation] = match;
        parts.push(<AnnotatedWord key={match.index} word={word} annotation={annotation} />);

        lastIndex = regex.lastIndex;
    }

    // Add any remaining text after the last match
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return <>{parts.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>)}</>;
};

const Chat = () => {
    const [prompt, setPrompt] = useState('russian story');
    const [story, setStory] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async () => {
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setStory('');

        await streamStory(prompt, (chunk) => {
            setStory((prev) => prev + chunk);
        });

        setIsLoading(false);
    };

    return (
        <div className="flex-1 flex flex-col h-screen">
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="whitespace-pre-wrap text-lg leading-loose">
                    <StoryRenderer text={story} />
                </div>
            </div>
            <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="请输入故事主题..."
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-blue-300"
                    >
                        {isLoading ? '生成中...' : '发送'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
