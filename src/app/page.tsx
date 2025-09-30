import Auth from "@/components/Auth";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import db from "@/lib/db";
import ChatContainer from "@/components/ChatContainer";

type HomePageProps = {
  searchParams: {
    chatId?: string;
  };
};

export default async function Home({ searchParams }: HomePageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return <Auth />;
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: {
      chats: {
        orderBy: {
          updatedAt: 'desc',
        },
      },
    },
  });

  const activeChatId = searchParams.chatId;
  const messages = activeChatId
    ? await db.message.findMany({
      where: { chatId: activeChatId },
      orderBy: { createdAt: 'asc' },
    })
    : [];

  return (
    <ChatContainer
      chats={user?.chats ?? []}
      activeChatId={activeChatId ?? null}
      initialMessages={messages}
    />
  );
}
