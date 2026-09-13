// Profile (Task 1.7): guest state or profile card + empty tabs + logout.
// "Verified student" badge slot rendered-but-hidden until full launch (D-008).

import { BadgeCheck, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  GuestProfileButtons,
  LogoutButton,
  ResendConfirmation,
} from "@/components/auth/profile-actions";
import { getCurrentUser } from "@/services/users";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const current = await getCurrentUser();

  if (!current) {
    return (
      <div className="mt-16 flex flex-col items-center gap-4 text-center">
        <p className="text-4xl">👋</p>
        <h1 className="text-xl font-bold">Your BookLoop profile</h1>
        <p className="text-subtle max-w-xs text-sm">
          Sign up to list books, chat with sellers and build your 👍 reputation.
        </p>
        <GuestProfileButtons />
      </div>
    );
  }

  const { profile } = current;
  const memberSince = profile.createdAt.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="mt-6 flex flex-col gap-6">
      <section className="rounded-2xl bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{profile.fullName}</h1>
            <p className="text-subtle text-sm">
              Class {profile.class} · {profile.schoolName}
            </p>
            <p className="text-subtle mt-1 text-xs">Member since {memberSince}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-subtle flex items-center gap-1 text-sm">
              <ThumbsUp className="size-4" /> 0
            </span>
            {profile.verified && (
              <Badge className="bg-primary-soft text-primary-active">
                <BadgeCheck className="size-3.5" /> Verified student
              </Badge>
            )}
          </div>
        </div>
        {!profile.emailConfirmed && (
          <div className="bg-surface-soft mt-4 flex flex-col items-start gap-2 rounded-lg p-3">
            <p className="text-sm">
              <span className="font-medium">Confirm your email</span> to list
              books and chat.
            </p>
            <ResendConfirmation />
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <EmptyTab
          title="My Listings"
          hint="Your finished books are worth money — list one from the ＋ tab."
        />
        <EmptyTab title="My Chats" hint="Chats with buyers and sellers appear here." />
        <EmptyTab
          title="My Wishlist"
          hint="Save books with the heart — coming in Phase 3."
        />
      </section>

      <LogoutButton />
    </div>
  );
}

function EmptyTab({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h2 className="font-semibold">{title}</h2>
      <p className="text-subtle mt-1 text-sm">{hint}</p>
    </div>
  );
}
