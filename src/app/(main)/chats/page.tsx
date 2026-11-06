// Chats tab (Task 4.8): conversation list, both roles, unread dots.

import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getCurrentUser } from "@/services/users";
import { listMyChats } from "@/services/chat";
import { ChatList } from "@/components/chat/chat-list";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/");

  const rows = await listMyChats(current.profile.id);

  return (
    <div className="mx-auto mt-4 w-full max-w-md md:mt-8 md:max-w-lg">
      <h1 className="text-display">Chats</h1>

      {rows.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No chats yet"
          description="Find a book and tap Chat with Seller — no phone numbers, everything happens here."
          className="mt-16"
        >
          <Link
            href="/search"
            className="bg-primary text-primary-foreground hover:bg-primary-active inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition"
          >
            Browse books
          </Link>
        </EmptyState>
      ) : (
        <div className="mt-4">
          <ChatList rows={rows} />
        </div>
      )}
    </div>
  );
}
