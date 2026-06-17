import { useEffect, useState } from "react";
import type { FormEvent, SVGProps } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { StickyNote as StickyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { LocalSetupNotice } from "@/components/LocalSetupNotice";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Sticky Board" },
      {
        name: "description",
        content: "Sign in or create an account to manage your sticky notes on Sticky Board.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) return toast.error(signInError.message);
      toast.success("Welcome back");
      navigate({ to: "/" });
    } catch (signInError) {
      toast.error(signInError instanceof Error ? signInError.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (signUpError) return toast.error(signUpError.message);
      toast.success("Account created. You're signed in.");
      navigate({ to: "/" });
    } catch (signUpError) {
      toast.error(signUpError instanceof Error ? signUpError.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Could not sign in with Google");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch (googleError) {
      toast.error(googleError instanceof Error ? googleError.message : "Could not sign in with Google");
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return <LocalSetupNotice message={error} />;
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sticky-yellow text-sticky-yellow-foreground shadow-sticky">
            <StickyIcon className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Sticky Board</h1>
          <p className="text-sm text-muted-foreground">
            Capture thoughts, pin what matters, never lose an idea.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="mt-4 space-y-4">
                <Field id="si-email" label="Email" type="email" value={email} onChange={setEmail} />
                <Field
                  id="si-pw"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                />
                <Button type="submit" className="w-full" disabled={busy}>
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="mt-4 space-y-4">
                <Field id="su-email" label="Email" type="email" value={email} onChange={setEmail} />
                <Field
                  id="su-pw"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                />
                <Button type="submit" className="w-full" disabled={busy}>
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 text-xs uppercase tracking-wide text-muted-foreground">
                or
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={busy}
          >
            <GoogleIcon className="mr-2 h-4 w-4" /> Continue with Google
          </Button>
        </div>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={type === "password" ? "current-password" : "email"}
      />
    </div>
  );
}

function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.3 12 2.3 6.7 2.3 2.5 6.6 2.5 12s4.2 9.7 9.5 9.7c5.5 0 9.1-3.9 9.1-9.4 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}
