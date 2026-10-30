// Privacy policy — plain language, because most users are students and parents.

import type { Metadata } from "next";
import Link from "next/link";
import { supportContact } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What BookLoop collects, who can see it, and how to get your data removed.",
};

const UPDATED = "30 October 2026";

export default function PrivacyPage() {
  return (
    <article className="mx-auto mt-4 w-full max-w-2xl md:mt-8">
      <h1 className="text-display">Privacy</h1>
      <p className="text-subtle mt-1 text-sm">Last updated {UPDATED}</p>

      <div className="text-body mt-6 space-y-6 text-sm leading-relaxed [&_h2]:text-ink [&_h2]:text-base [&_h2]:font-semibold [&_li]:mt-1 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        <p>
          BookLoop is a school book exchange. We keep the data small on purpose:
          enough to list books, chat about them, and keep the network limited to
          your school. We do not sell data, show ads, or run tracking pixels.
        </p>

        <section>
          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Account:</strong> name, email address, password (stored
              only as a one-way hash), school, class and an optional school ID.
            </li>
            <li>
              <strong>Listings:</strong> book title, class, subject, condition,
              price or exchange wish, and the photos you upload.
            </li>
            <li>
              <strong>Messages:</strong> chat messages between you and the other
              student about a listing.
            </li>
            <li>
              <strong>Usage:</strong> basic technical logs (page errors, IP
              address, browser) used to keep the site working and prevent abuse.
            </li>
          </ul>
        </section>

        <section>
          <h2>Who can see what</h2>
          <ul>
            <li>
              Listings are visible to students signed in on BookLoop. Your full
              name and class appear on your listings; your email and password
              never do.
            </li>
            <li>
              Phone numbers are never shown or required. Contact details stay
              hidden until you both reply in a chat.
            </li>
            <li>
              We do not share data with advertisers. Service providers (hosting
              and database) process it only to run BookLoop.
            </li>
          </ul>
        </section>

        <section>
          <h2>How long we keep it</h2>
          <p>
            Listings stay until you mark them sold, exchange them, or delete
            them. Chats stay while your account is open so you can look back at
            a deal. Deleting your account removes your profile, listings and
            photos; chat copies held by the other student are kept for their own
            record.
          </p>
        </section>

        <section>
          <h2>Your choices</h2>
          <ul>
            <li>Edit or remove any listing from your profile.</li>
            <li>Ask us to delete your account and data at any time.</li>
            <li>
              If you are under 18, a parent or guardian can contact us on your
              behalf.
            </li>
          </ul>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions or a deletion request: use {supportContact()}. We aim to
            reply within 7 days.
          </p>
        </section>

        <p className="text-subtle">
          See also the <Link href="/terms" className="underline underline-offset-4">Terms of use</Link>.
        </p>
      </div>
    </article>
  );
}
