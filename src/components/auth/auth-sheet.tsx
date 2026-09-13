"use client";

// Signup/login slide-up sheet with intent resume (D-041, Task 1.3/1.6):
// opens at the moment of intent, and after auth returns the user to what
// they were doing. Post-signup shows the "check your email" state (S3a).

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { signInAction, signUpAction } from "@/app/(auth)/actions";
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "@/lib/zod-schemas";
import { CLASSES } from "@/lib/constants";

type AuthSheetContextValue = {
  /** Open the sheet; `intent` = path to continue to after auth. */
  open: (opts?: { intent?: string; mode?: "signup" | "login" }) => void;
};

const AuthSheetContext = createContext<AuthSheetContextValue | null>(null);

export function useAuthSheet() {
  const ctx = useContext(AuthSheetContext);
  if (!ctx) throw new Error("useAuthSheet must be used inside AuthSheetProvider");
  return ctx;
}

export function AuthSheetProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"signup" | "login" | "check-email">("signup");
  const [intent, setIntent] = useState<string | null>(null);

  const open = useCallback<AuthSheetContextValue["open"]>((opts) => {
    setIntent(opts?.intent ?? null);
    setMode(opts?.mode ?? "signup");
    setIsOpen(true);
  }, []);

  const finish = useCallback(() => {
    setIsOpen(false);
    router.refresh();
    if (intent) router.push(intent);
    setIntent(null);
  }, [intent, router]);

  return (
    <AuthSheetContext.Provider value={{ open }}>
      {children}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl bg-card">
          <div className="mx-auto w-full max-w-md pb-4">
            {mode === "signup" && (
              <SignupForm
                onDone={() => setMode("check-email")}
                onSwitch={() => setMode("login")}
              />
            )}
            {mode === "login" && (
              <LoginForm onDone={finish} onSwitch={() => setMode("signup")} />
            )}
            {mode === "check-email" && <CheckEmail onContinue={finish} />}
          </div>
        </SheetContent>
      </Sheet>
    </AuthSheetContext.Provider>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function SignupForm({
  onDone,
  onSwitch,
}: {
  onDone: () => void;
  onSwitch: () => void;
}) {
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { class: 9 } as Partial<SignupInput> as SignupInput,
  });

  async function onSubmit(values: SignupInput) {
    const res = await signUpAction(values);
    if (res.ok) {
      toast.success("Account created!");
      onDone();
    } else {
      toast.error(res.error);
    }
  }

  const { errors, isSubmitting } = form.formState;

  return (
    <>
      <SheetHeader className="px-0">
        <SheetTitle>Join BookLoop</SheetTitle>
        <SheetDescription>
          Free for students — sign up to list, chat and save books.
        </SheetDescription>
      </SheetHeader>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
        noValidate
      >
        <div className="grid gap-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
          <FieldError message={errors.fullName?.message} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="schoolName">School name</Label>
          <Input id="schoolName" {...form.register("schoolName")} />
          <FieldError message={errors.schoolName?.message} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              inputMode="numeric"
              {...form.register("age", { valueAsNumber: true })}
            />
            <FieldError message={errors.age?.message} />
          </div>
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
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1">
          {isSubmitting ? "Creating account…" : "Sign up"}
        </Button>
        <button
          type="button"
          onClick={onSwitch}
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
        >
          Already have an account? Log in
        </button>
      </form>
    </>
  );
}

function LoginForm({
  onDone,
  onSwitch,
}: {
  onDone: () => void;
  onSwitch: () => void;
}) {
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    const res = await signInAction(values);
    if (res.ok) {
      toast.success("Welcome back!");
      onDone();
    } else {
      toast.error(res.error);
    }
  }

  const { errors, isSubmitting } = form.formState;

  return (
    <>
      <SheetHeader className="px-0">
        <SheetTitle>Log in</SheetTitle>
        <SheetDescription>Welcome back to BookLoop.</SheetDescription>
      </SheetHeader>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
        noValidate
      >
        <div className="grid gap-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            {...form.register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            {...form.register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1">
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
        <button
          type="button"
          onClick={onSwitch}
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
        >
          New here? Sign up
        </button>
      </form>
    </>
  );
}

function CheckEmail({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <MailCheck className="text-primary size-10" />
      <SheetTitle>Check your email</SheetTitle>
      <SheetDescription className="max-w-xs">
        We sent you a confirmation link. You can browse right away — confirm
        your email to list books and chat.
      </SheetDescription>
      <Button size="lg" className="mt-2 w-full" onClick={onContinue}>
        Continue browsing
      </Button>
    </div>
  );
}
