import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { type Chat } from '$/generated/prisma';
import { PlusIcon } from '@heroicons/react/24/outline'; // Using a popular icon library

type SidebarProps = {
    chats: Chat[];
    activeChatId: string | null;
};

const Sidebar = ({ chats, activeChatId }: SidebarProps) => {
    return (
        <div className="w-64 bg-gray-900 text-white flex flex-col h-screen">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Conversations</h2>
                <Link href="/" passHref>
                    <button className="p-2 rounded-md hover:bg-gray-700">
                        <PlusIcon className="h-6 w-6" />
                    </button>
                </Link>
            </div>
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {chats.map((chat) => (
                    <Link key={chat.id} href={`/?chatId=${chat.id}`} passHref>
                        <div
                            className={`block px-4 py-2 rounded-md text-sm truncate ${activeChatId === chat.id
                                    ? 'bg-blue-600 text-white'
                                    : 'hover:bg-gray-700'
                                }`}
                        >
                            {chat.title}
                        </div>
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700">
                <button
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-2 rounded-md text-sm hover:bg-gray-700"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
