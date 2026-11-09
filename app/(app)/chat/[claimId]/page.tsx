import { notFound } from "next/navigation";
import { getChatContext } from "@/lib/chat";
import ChatRoom from "./ChatRoom";

// Screen 8 — Chat (only reachable for an accepted claim).
export default async function ChatPage({ params }: PageProps<"/chat/[claimId]">) {
  const { claimId } = await params;
  const ctx = await getChatContext(claimId);
  if (!ctx) notFound();

  return (
    <ChatRoom
      claimId={ctx.claimId}
      userId={ctx.userId}
      otherName={ctx.otherName}
      itemId={ctx.itemId}
      itemTitle={ctx.itemTitle}
      initialMessages={ctx.messages}
    />
  );
}
