// Profile (Task 1.7): guest state or profile card + empty tabs + logout.
// "Verified student" badge slot rendered-but-hidden until full launch (D-008).

import Image from "next/image";
import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { BadgeCheck, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  GuestProfileButtons,
  LogoutButton,
} from "@/components/auth/profile-actions";
import { MyListingActions } from "@/components/sell/my-listing-row";
import { AlertRow } from "@/components/alerts/alert-row";
import { BookCard } from "@/components/book-card";
import { DonorShareButton } from "@/components/donor-share";
import { ReportProblem } from "@/components/report-problem";
import { getCurrentUser } from "@/services/users";
import { myListings } from "@/services/listings";
import { myWishlist } from "@/services/wishlist";
import { myAlerts } from "@/services/alerts";
import { completedDonations } from "@/services/exchange";
import { recentActiveListings } from "@/db/repos/listings";
import { getDb } from "@/db/client";
import { listingPhotos, ratings } from "@/db/schema";
import { CATEGORIES } from "@/lib/constants";

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
  const donations = await completedDonations(profile.id);
  const thumbs = await getDb()
    .select({ id: ratings.id })
    .from(ratings)
    .where(and(eq(ratings.rateeId, profile.id), eq(ratings.thumbsUp, true)));
  const memberSince = profile.createdAt.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="mx-auto mt-6 flex w-full max-w-md flex-col gap-6 md:max-w-2xl lg:mt-8 lg:grid lg:max-w-5xl lg:grid-cols-[minmax(280px,1fr)_2fr] lg:items-start lg:gap-8">
      <div className="flex flex-col gap-4 lg:sticky lg:top-20">
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
              <ThumbsUp className="size-4" /> {thumbs.length}
            </span>
            {profile.verified && (
              <Badge className="bg-primary-soft text-primary-active">
                <BadgeCheck className="size-3.5" /> Verified student
              </Badge>
            )}
            {donations > 0 && (
              <Badge className="bg-primary-soft text-primary-active">
                🌱 Book donor · {donations}
              </Badge>
            )}
          </div>
        </div>
        {donations > 0 && (
          <div className="mt-3">
            <DonorShareButton count={donations} />
          </div>
        )}
      </section>

        <div className="flex items-center gap-2">
          <ReportProblem />
          <div className="hidden lg:block">
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <MyListingsSection sellerId={profile.id} />
        <WishlistSection userId={profile.id} userClass={profile.class} />
        <AlertsSection userId={profile.id} />

        <section>
          <h2 className="font-semibold">My Chats</h2>
          <p className="text-subtle mt-1 text-sm">
            <Link href="/chats" className="text-primary underline-offset-4 hover:underline">
              Open your chats
            </Link>{" "}
            — buying and selling conversations live there.
          </p>
        </section>

        <div className="lg:hidden">
          <LogoutButton />
        </div>
      </div>
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
      <div className="mt-2 grid grid-cols-1 gap-2 xl:grid-cols-2">
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

async function WishlistSection({
  userId,
  userClass,
}: {
  userId: number;
  userClass: number;
}) {
  const items = await myWishlist(userId);

  if (items.length === 0) {
    // Empty state → trending in the user's class (WORKFLOW.md §9)
    const trending = (await recentActiveListings(6)).filter(
      (b) => b.class === userClass,
    );
    return (
      <section>
        <h2 className="font-semibold">My Wishlist</h2>
        <p className="text-subtle mt-1 text-sm">
          Save books with the ♥ — they&apos;ll wait for you here.
        </p>
        {trending.length > 0 && (
          <>
            <p className="text-subtle mt-3 text-xs font-medium uppercase">
              New in Class {userClass}
            </p>
            <div className="-mx-4 mt-2 flex gap-3 overflow-x-auto px-4 pb-1">
              {trending.map((b) => (
                <BookCard key={b.id} book={b} layout="shelf" />
              ))}
            </div>
          </>
        )}
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-semibold">My Wishlist</h2>
      <div className="mt-2 grid grid-cols-1 gap-2 xl:grid-cols-2">
        {items.map((l) => (
          <Link
            key={l.id}
            href={`/listings/${l.id}`}
            className="flex items-center gap-3 rounded-2xl bg-card p-2.5"
          >
            <span className="bg-surface-soft relative size-12 shrink-0 overflow-hidden rounded-lg">
              {l.photoUrl && (
                <Image
                  src={l.photoUrl}
                  alt={l.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{l.title}</span>
              <span className="text-subtle block text-xs">
                {l.mode === "sell" && l.priceInr != null && `₹${l.priceInr}`}
                {l.mode === "donate" && "FREE"}
                {l.mode === "exchange" && "exchange"}
                {l.status !== "active" && ` · ${l.status}`}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function AlertsSection({ userId }: { userId: number }) {
  const alerts = await myAlerts(userId);
  if (alerts.length === 0) return null;

  const label = (a: (typeof alerts)[number]) =>
    [
      a.keyword && `"${a.keyword}"`,
      a.category && CATEGORIES.find((c) => c.value === a.category)?.label,
      a.class && `Class ${a.class}`,
      a.subject,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <section>
      <h2 className="font-semibold">My Alerts</h2>
      <p className="text-subtle mt-1 text-sm">
        We notify you when a matching book is listed.
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {alerts.map((a) => (
          <AlertRow key={a.id} alertId={a.id} label={label(a)} />
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
