import Sidebar from "@/components/Sidebar";
import Chat from "@/components/Chat";
import Auth from "@/components/Auth";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Auth />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <Chat />
    </div>
  );
}
