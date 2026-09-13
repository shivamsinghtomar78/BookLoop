import * as React from "react";
import { cn } from "cn";

// Styled native <select> matching Input heights (44px touch on mobile,
// denser on md+). One place for the classes — no per-form one-offs.
function NativeSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "border-input h-11 w-full min-w-0 rounded-lg border bg-transparent px-3 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 md:h-10 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect };
