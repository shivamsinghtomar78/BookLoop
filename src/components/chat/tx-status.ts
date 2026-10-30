// Pure presentation helpers for the four-gate reservation flow. Kept out of
// the components so the server page, stepper and tests share one truth.

import type { TxState } from "@/services/transactions";

export const STEPS = [
  "Chatting",
  "Reserved",
  "Meet at pickup",
  "Done",
  "Rate",
] as const;

// 0 chatting · 1 reserved (awaiting buyer) · 2 accepted (awaiting handover)
// 3 handed over (awaiting buyer) · 4 confirmed (awaiting rating) · 5 rated
export function currentStep(state: TxState): number {
  if (state.confirmed) return state.myRating !== null ? 5 : 4;
  if (state.handedOver) return 3;
  if (state.accepted) return 2;
  if (state.reserved) return 1;
  return 0;
}

/** When each step was completed (step 0 = reservation, last has no timestamp). */
export function stepTimes(state: TxState): (string | null)[] {
  return [
    state.reservedAt,
    state.acceptedAt,
    state.handedOverAt,
    state.confirmedAt,
    null,
  ];
}

/** One sentence both sides can read at a glance — also the live-region text. */
export function statusLine(
  state: TxState,
  role: "buyer" | "seller",
  otherName: string,
): string {
  if (state.listingStatus === "deleted") return "This listing was removed.";
  if (state.confirmed)
    return state.myRating !== null
      ? "Done — thanks for keeping the loop going."
      : "Done — rate your exchange.";
  if (state.handedOver)
    return role === "buyer"
      ? `${otherName} marked it handed over — confirm you received it.`
      : `Handed over — waiting for ${otherName} to confirm.`;
  if (state.accepted)
    return role === "buyer"
      ? `Accepted — waiting for ${otherName} to hand over.`
      : `${otherName} accepted — hand it over at the pickup point.`;
  if (state.reserved)
    return role === "buyer"
      ? "Reserved for you — accept to lock it in."
      : `Reserved — waiting for ${otherName} to accept.`;
  return role === "buyer"
    ? `Chatting with ${otherName}.`
    : "Not reserved yet — chat, then reserve.";
}

export function actionLabels(mode: string) {
  const exchange = mode === "exchange";
  const donate = mode === "donate";
  return {
    reserve: exchange
      ? "Agree exchange with this buyer"
      : donate
        ? "Reserve for this student"
        : "Reserve for this buyer",
    accept: "Accept reservation",
    handover: exchange ? "I exchanged it" : "I handed it over",
    confirm: exchange ? "Confirm exchanged ✓" : "Confirm received ✓",
  };
}
