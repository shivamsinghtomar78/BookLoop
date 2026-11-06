// Terms of use — short, school-friendly rules. Not legal advice; review before a full launch.

import type { Metadata } from "next";
import Link from "next/link";
import { supportContact } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description: "The rules for buying, selling, exchanging and donating books on BookLoop.",
};

const UPDATED = "30 October 2026";

export default function TermsPage() {
  return (
    <article className="mx-auto mt-4 w-full max-w-2xl md:mt-8">
      <p className="text-primary text-[10px] font-semibold tracking-[0.2em] uppercase">
        Trust &amp; safety
      </p>
      <h1 className="text-display mt-1">Terms of use</h1>
      <p className="text-subtle mt-1 text-sm">Last updated {UPDATED}</p>

      <div className="text-body mt-8 space-y-6 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-ink [&_h2]:text-base [&_h2]:font-semibold [&_li]:mt-1 [&_section]:border-hairline [&_section]:border-t [&_section]:pt-6 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        <p>
          BookLoop connects students at the same school who want to pass books
          on. By using it you agree to these rules. If you are under 18, use it
          with your parent or guardian&apos;s knowledge.
        </p>

        <section>
          <h2>1. Who can join</h2>
          <p>
            You need a working email account and you should be part of the
            school community you list under. One account per person. Do not
            impersonate anyone.
          </p>
        </section>

        <section>
          <h2>2. What you can list</h2>
          <ul>
            <li>School books: textbooks, reference books, guides and novels.</li>
            <li>Books you own or are allowed to pass on.</li>
            <li>Accurate photos, condition and price or exchange wish.</li>
          </ul>
          <p>
            No pirated or photocopied books, no exam papers, no weapons, no
            other items, no abusive or misleading listings. We may remove
            listings that break these rules.
          </p>
        </section>

        <section>
          <h2>3. Payments and handover</h2>
          <p>
            BookLoop does not process payments. You agree a price in chat and
            hand over the book in person — at school, in a public place, during
            school hours. Never share phone numbers, addresses or bank details.
            Check the book before you pay.
          </p>
        </section>

        <section>
          <h2>4. Chat</h2>
          <p>
            Contact details stay hidden until you both reply. Keep chats about
            the book. Harassment, spam and scams lead to account removal.
          </p>
        </section>

        <section>
          <h2>5. Honest dealing</h2>
          <p>
            Describe the book truthfully, turn up when you say you will, and
            mark a listing as sold, exchanged or claimed once it is gone. Books
            are sold between students; BookLoop is not a party to the deal and
            cannot guarantee a book&apos;s condition.
          </p>
        </section>

        <section>
          <h2>6. Suspension</h2>
          <p>
            We can pause or remove accounts that break these rules or put other
            students at risk. You can stop using BookLoop and ask us to delete
            your account at any time.
          </p>
        </section>

        <section>
          <h2>7. Contact</h2>
          <p>
            Questions or reports: use {supportContact()}. See also the{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              Privacy policy
            </Link>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
