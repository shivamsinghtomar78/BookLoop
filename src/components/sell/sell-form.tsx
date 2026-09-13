"use client";

// The 2-minute sell form (D-042, Tasks 2.2–2.4, 2.6, 2.8):
// photo-first, category-conditional fields, condition picture-cards,
// Sell/Exchange/Donate toggle, price nudge, preview → publish → success,
// localStorage draft with resume.

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Share2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { PhotoUploader } from "@/components/sell/photo-uploader";
import {
  publishListingAction,
  updateListingAction,
} from "@/app/(main)/sell/actions";
import { listingSchema, type ListingInput } from "@/lib/zod-schemas";
import {
  CATEGORIES,
  CLASSES,
  CONDITIONS,
  CONDITION_EMOJI,
  EXAMS,
  MODES,
  PRICE_HINTS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "bookloop-sell-draft";

type Step = "form" | "preview" | { published: { id: number; bookloopId: string } };

export function SellForm({
  sellerClass,
  edit,
  presetMode,
}: {
  sellerClass: number;
  edit?: { id: number; values: ListingInput };
  presetMode?: "sell" | "exchange" | "donate";
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [hadDraft, setHadDraft] = useState(false);

  const form = useForm<ListingInput>({
    resolver: zodResolver(listingSchema),
    defaultValues: edit?.values ?? {
      mode: presetMode ?? "sell", // /sell?mode=exchange|donate presets the toggle
      category: "textbook",
      class: sellerClass, // smart default: seller's own class (D-042)
      photos: [],
      title: "",
    },
  });

  const values = form.watch();

  // ---- Draft: autosave + resume (Task 2.8; new listings only) ----
  useEffect(() => {
    if (edit) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as ListingInput;
        form.reset({ ...draft, photos: draft.photos ?? [] });
        setHadDraft(true);
      }
    } catch {
      /* corrupted/blocked storage — start fresh */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (edit || typeof step !== "string") return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    } catch {
      /* storage full/blocked — draft is a convenience, not a requirement */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values), step]);

  const { errors, isSubmitting } = form.formState;
  const cat = values.category;
  const mode = values.mode;
  const showClassSubject = cat === "textbook" || cat === "reference";
  const showExam = cat === "competitive";
  const showNovel = cat === "novel";
  const priceHint = PRICE_HINTS[cat];

  async function onPublish(v: ListingInput) {
    const res = edit
      ? await updateListingAction(edit.id, v)
      : await publishListingAction(v);
    if (res.ok) {
      if (!edit) {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {}
      }
      setStep({ published: { id: res.id, bookloopId: res.bookloopId } });
    } else {
      toast.error(res.error);
      setStep("form");
    }
  }

  if (typeof step === "object") {
    return <SuccessView {...step.published} edited={!!edit} />;
  }

  if (step === "preview") {
    return (
      <PreviewView
        values={values}
        submitting={isSubmitting}
        onBack={() => setStep("form")}
        onPublish={form.handleSubmit(onPublish)}
        edited={!!edit}
      />
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(() => setStep("preview"))}
      className="mx-auto mt-4 flex w-full max-w-md flex-col gap-5 pb-8 md:mt-8 md:max-w-2xl"
      noValidate
    >
      <h1 className="text-display">{edit ? "Edit listing" : "Sell a book"}</h1>
      {hadDraft && !edit && (
        <p className="bg-primary-soft text-primary-active rounded-lg px-3 py-2 text-sm">
          Draft resumed — pick up where you left off.
        </p>
      )}

      {/* 1. Photos first (D-042) */}
      <PhotoUploader
        photos={values.photos}
        onChange={(p) => form.setValue("photos", p, { shouldValidate: true })}
      />
      <FieldError message={errors.photos?.message} />

      {/* 2. Title */}
      <div className="grid gap-1.5">
        <Label htmlFor="title">Book title</Label>
        <Input id="title" placeholder="e.g. Science Textbook — Class 9" {...form.register("title")} />
        <FieldError message={errors.title?.message} />
      </div>

      {/* 3. Category → conditional fields */}
      <div className="grid gap-1.5">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip
              key={c.value}
              active={cat === c.value}
              onClick={() => form.setValue("category", c.value, { shouldValidate: true })}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      {showClassSubject && (
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="class">Class</Label>
            <NativeSelect
              id="class"
              {...form.register("class", { valueAsNumber: true })}
            >
              {CLASSES.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </NativeSelect>
            <FieldError message={errors.class?.message} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="e.g. Science" {...form.register("subject")} />
            <FieldError message={errors.subject?.message} />
          </div>
        </div>
      )}

      {showExam && (
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="exam">Exam</Label>
            <NativeSelect id="exam" {...form.register("exam")}>
              <option value="">Pick…</option>
              {EXAMS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </NativeSelect>
            <FieldError message={errors.exam?.message} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="csubject">Subject</Label>
            <Input id="csubject" placeholder="e.g. Physics" {...form.register("subject")} />
            <FieldError message={errors.subject?.message} />
          </div>
        </div>
      )}

      {showNovel && (
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="genre">Genre</Label>
            <Input id="genre" placeholder="e.g. Adventure" {...form.register("genre")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="author">Author</Label>
            <Input id="author" placeholder="optional" {...form.register("author")} />
          </div>
        </div>
      )}

      {/* 4. Edition/year */}
      <div className="grid gap-1.5">
        <Label htmlFor="editionYear">Edition / year (syllabus changes matter)</Label>
        <Input id="editionYear" placeholder="e.g. 2025" {...form.register("editionYear")} />
      </div>

      {/* 5. Condition — 4 picture cards */}
      <div className="grid gap-1.5">
        <Label>Condition</Label>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => form.setValue("condition", c.value, { shouldValidate: true })}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition",
                values.condition === c.value
                  ? "border-primary bg-primary-soft"
                  : "border-hairline bg-card",
              )}
            >
              <span className="text-lg">{CONDITION_EMOJI[c.value]}</span>
              <span className="text-sm font-semibold">{c.label}</span>
              <span className="text-subtle text-xs">{c.hint}</span>
            </button>
          ))}
        </div>
        <FieldError message={errors.condition?.message} />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="conditionNote">Condition note (optional)</Label>
        <Input id="conditionNote" placeholder="e.g. name written on first page" {...form.register("conditionNote")} />
      </div>

      {/* 6. Mode toggle + price / wants */}
      <div className="grid gap-1.5">
        <Label>I want to…</Label>
        <div className="bg-surface-soft flex rounded-lg p-1">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => form.setValue("mode", m.value, { shouldValidate: true })}
              className={cn(
                "flex-1 rounded-md py-1.5 text-sm font-medium transition",
                mode === m.value ? "bg-card shadow-sm" : "text-subtle",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "sell" && (
        <div className="grid gap-1.5">
          <Label htmlFor="priceInr">Price (₹)</Label>
          <Input
            id="priceInr"
            type="number"
            inputMode="numeric"
            placeholder={`${priceHint.lo}–${priceHint.hi}`}
            {...form.register("priceInr", { valueAsNumber: true })}
          />
          <p className="text-subtle text-xs">
            Books like this usually go for ₹{priceHint.lo}–{priceHint.hi}.
          </p>
          <FieldError message={errors.priceInr?.message} />
        </div>
      )}

      {mode === "exchange" && (
        <div className="grid gap-1.5">
          <Label htmlFor="wantsBook">Which book do you want?</Label>
          <Input id="wantsBook" placeholder="e.g. Class 8 Maths" {...form.register("wantsBook")} />
          <FieldError message={errors.wantsBook?.message} />
        </div>
      )}

      {mode === "donate" && (
        <p className="bg-primary-soft text-primary-active rounded-lg px-3 py-2 text-sm">
          This book will be listed FREE. Thank you! 🌱
        </p>
      )}

      <Button type="submit" size="lg" className="mt-2">
        Preview listing
      </Button>
    </form>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-10 rounded-lg border px-3.5 text-sm font-medium transition",
        active ? "border-primary bg-primary-soft text-primary-active" : "border-hairline bg-card text-subtle",
      )}
    >
      {children}
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive text-sm">{message}</p>;
}

function PreviewView({
  values,
  submitting,
  onBack,
  onPublish,
  edited,
}: {
  values: ListingInput;
  submitting: boolean;
  onBack: () => void;
  onPublish: () => void;
  edited: boolean;
}) {
  const meta =
    values.class && values.subject
      ? `Class ${values.class} · ${values.subject}`
      : (values.subject ?? values.genre ?? "");
  const conditionLabel = CONDITIONS.find((c) => c.value === values.condition)?.label;

  return (
    <div className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 pb-8 md:mt-8">
      <h1 className="text-display">Preview</h1>
      <p className="text-subtle text-sm">Exactly how buyers will see it.</p>

      <div className="rounded-2xl bg-card p-4">
        {values.photos[0] && (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
            <Image src={values.photos[0]} alt={values.title} fill sizes="400px" className="object-cover" />
          </div>
        )}
        <div className="mt-3 flex flex-col gap-1">
          <p className="text-lg font-semibold">{values.title}</p>
          <p className="text-subtle text-sm">
            {meta}
            {meta && " · "}
            {conditionLabel}
            {values.editionYear && ` · ${values.editionYear}`}
          </p>
          {values.mode === "sell" && <p className="text-lg font-bold">₹{values.priceInr}</p>}
          {values.mode === "donate" && <p className="text-free text-lg font-bold">FREE</p>}
          {values.mode === "exchange" && (
            <p className="text-sm font-medium">EXCHANGE — wants: {values.wantsBook}</p>
          )}
          {values.conditionNote && (
            <p className="text-subtle text-sm">&quot;{values.conditionNote}&quot;</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="lg" className="flex-1" onClick={onBack}>
          Edit
        </Button>
        <Button size="lg" className="flex-1" disabled={submitting} onClick={onPublish}>
          {submitting ? "Publishing…" : edited ? "Save changes" : "Publish"}
        </Button>
      </div>
    </div>
  );
}

function SuccessView({
  id,
  bookloopId,
  edited,
}: {
  id: number;
  bookloopId: string;
  edited: boolean;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const url = useMemo(
    () => (typeof window === "undefined" ? "" : `${window.location.origin}/listings/${id}`),
    [id],
  );

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 240, margin: 1 }).then(setQr).catch(() => {});
  }, [url]);

  async function share() {
    const text = `📚 My book is on BookLoop — ${url}`;
    try {
      if (navigator.share) await navigator.share({ title: "BookLoop", text, url });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("Link copied — paste it anywhere");
      }
    } catch {
      /* user cancelled share */
    }
  }

  return (
    <div className="mx-auto mt-10 flex w-full max-w-md flex-col items-center gap-4 pb-8 text-center md:mt-16">
      <p className="text-4xl">🎉</p>
      <h1 className="text-display">{edited ? "Changes saved!" : "Your book is live!"}</h1>
      <p className="text-subtle text-sm">
        BookLoop ID: <span className="text-foreground font-semibold">{bookloopId}</span>
      </p>
      {qr && (
        <div className="rounded-2xl bg-card p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt={`QR code for ${bookloopId}`} width={180} height={180} />
        </div>
      )}
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button size="lg" onClick={share}>
          <Share2 className="size-4" /> Share on WhatsApp
        </Button>
        <Link href={`/listings/${id}`} className={buttonVariants({ variant: "outline", size: "lg" })}>
          View listing
        </Link>
        <Link href="/" className="text-subtle mt-1 text-sm underline-offset-4 hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
