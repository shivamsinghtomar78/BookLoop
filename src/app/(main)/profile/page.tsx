// Profile (Task 1.7): guest state or profile card + empty tabs + logout.
// "Verified student" badge slot rendered-but-hidden until full launch (D-008).

import Image from "next/image";
import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { BadgeCheck, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  GuestProfileButtons,
  LogoutButton,
  ResendConfirmation,
} from "@/components/auth/profile-actions";
import { MyListingActions } from "@/components/sell/my-listing-row";
import { getCurrentUser } from "@/services/users";
import { myListings } from "@/services/listings";
import { getDb } from "@/db/client";
import { listingPhotos } from "@/db/schema";

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

      <MyListingsSection sellerId={profile.id} />

      <section className="flex flex-col gap-4">
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

async function MyListingsSection({ sellerId }: { sellerId: number }) {
  const rows = await myListings(sellerId);

  if (rows.length === 0) {
    return (
      <EmptyTab
        title="My Listings"
        hint="Your finished books are worth money — list one from the ＋ tab."
      />
    );
  }

  const db = getDb();
  const photos = await db
    .select()
    .from(listingPhotos)
    .where(
      inArray(
        listingPhotos.listingId,
        rows.map((r) => r.id),
      ),
    );
  const cover = new Map<number, string>();
  for (const p of photos.sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (!cover.has(p.listingId)) cover.set(p.listingId, p.url);
  }

  const active = rows.filter((r) => r.status === "active" || r.status === "reserved");
  const closed = rows.filter((r) => r.status === "closed");

  return (
    <section>
      <h2 className="font-semibold">My Listings</h2>
      <div className="mt-2 flex flex-col gap-2">
        {[...active, ...closed].map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-card p-2.5">
            <Link
              href={`/listings/${r.id}`}
              className="bg-surface-soft relative size-12 shrink-0 overflow-hidden rounded-lg"
            >
              {cover.get(r.id) && (
                <Image
                  src={cover.get(r.id)!}
                  alt={r.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.title}</p>
              <p className="text-subtle text-xs">
                {r.bookloopId}
                {r.mode === "sell" && r.priceInr != null && ` · ₹${r.priceInr}`}
                {r.mode === "donate" && " · FREE"}
                {r.mode === "exchange" && " · exchange"}
                {r.status !== "active" && ` · ${r.status}`}
              </p>
            </div>
            <MyListingActions listingId={r.id} title={r.title} status={r.status} />
          </div>
        ))}
      </div>
    </section>
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
