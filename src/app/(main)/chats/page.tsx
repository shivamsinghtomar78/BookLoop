// Chats tab (Task 4.8): conversation list, both roles, unread dots.

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/users";
import { listMyChats } from "@/services/chat";

export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/");

  const rows = await listMyChats(current.profile.id);

  return (
    <div className="mx-auto mt-4 w-full max-w-md md:mt-8 md:max-w-lg">
      <h1 className="text-display">Chats</h1>

      {rows.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <p className="text-4xl">💬</p>
          <p className="font-semibold">No chats yet</p>
          <p className="text-subtle max-w-xs text-sm">
            Find a book and tap <span className="font-medium">Chat with Seller</span> —
            no phone numbers, everything happens here.
          </p>
          <Link href="/search" className="text-primary text-sm underline-offset-4 hover:underline">
            Browse books
          </Link>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {rows.map((c) => (
            <li key={c.chatId}>
              <Link
                href={`/chats/${c.chatId}`}
                className="flex items-center gap-3 rounded-2xl bg-card p-3"
              >
                <span className="bg-surface-soft relative size-12 shrink-0 overflow-hidden rounded-lg">
                  {c.photoUrl && (
                    <Image src={c.photoUrl} alt={c.title} fill sizes="48px" className="object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{c.title}</span>
                    {c.status !== "active" && (
                      <span className="text-subtle shrink-0 text-[10px] uppercase">
                        {c.status}
                      </span>
                    )}
                  </span>
                  <span
                    className={
                      "block truncate text-xs " +
                      (c.unread ? "text-foreground font-medium" : "text-subtle")
                    }
                  >
                    {c.otherName}
                    {c.lastMessage ? `: ${c.lastMessage}` : " — say hi!"}
                  </span>
                </span>
                {c.unread && (
                  <span className="bg-primary size-2.5 shrink-0 rounded-full" aria-label="Unread messages" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
