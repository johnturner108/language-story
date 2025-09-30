'use client';

'use client';

import React, { useState } from 'react';
import AnnotatedWord from './AnnotatedWord';

// Mock function to simulate streaming story generation
const mockStreamStory = async (prompt: string, onChunk: (chunk: string) => void) => {
    const story = `Мой хоро́ший [adj. хороший: 好的] друг [n. друг: 朋友] вчера́ [adv. вчера: 昨天] купи́л [v. покупать (未), **купить (完)**: 购买] интере́сную [adj. интересный: 有趣的] кни́гу [n. книга: 书], кото́рую он до́лго [adv. долгий: 长时间地] чита́л [v. **читать (未)**, прочитать (完): 阅读].`;
    const chunks = story.split('');
    for (const chunk of chunks) {
        await new Promise(resolve => setTimeout(resolve, 20)); // Simulate network delay
        onChunk(chunk);
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

        await mockStreamStory(prompt, (chunk) => {
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
