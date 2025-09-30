'use client';

import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Chat from './Chat';
import { type Chat as ChatModel, type Message } from '$/generated/prisma';

type ChatContainerProps = {
    chats: ChatModel[];
    activeChatId: string | null;
    initialMessages: Message[];
};

export default function ChatContainer({ chats, activeChatId, initialMessages }: ChatContainerProps) {
    const router = useRouter();

    const handleNewChat = (newChatId: string) => {
        router.push(`/?chatId=${newChatId}`);
    };

    return (
        <div className="flex h-screen">
            <Sidebar chats={chats} activeChatId={activeChatId} />
            <Chat
                chatId={activeChatId}
                initialMessages={initialMessages}
                onNewChat={handleNewChat}
            />
        </div>
    );
}
