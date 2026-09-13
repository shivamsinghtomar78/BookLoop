// Landing page for the email confirmation link (Task 1.4).

import Link from "next/link";
import { MailCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function EmailVerifiedPage() {
  return (
    <div className="mt-16 flex flex-col items-center gap-4 text-center">
      <MailCheck className="text-primary size-12" />
      <h1 className="text-xl font-bold">Email confirmed</h1>
      <p className="text-subtle max-w-xs text-sm">
        You&apos;re all set — you can now list books, chat with sellers and
        save books to your wishlist.
      </p>
      <Link href="/" className={buttonVariants({ size: "lg" })}>
        Start exploring
      </Link>
    </div>
  );
}
