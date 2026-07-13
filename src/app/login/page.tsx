"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Globe2, LockKeyhole, Mail, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MarketDepthScene } from "@/components/dashboard/market-depth-scene";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabaseConfigured = hasSupabaseEnv();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function authCallbackUrl() {
    return `${window.location.origin}/auth/callback?next=/dashboard`;
  }

  async function signIn() {
    if (!supabaseConfigured) {
      return toast.error("Configure Supabase env vars first.");
    }
    setLoading(true);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    router.push("/dashboard");
    router.refresh();
  }

  async function signUp() {
    if (!supabaseConfigured) {
      return toast.error("Configure Supabase env vars first.");
    }
    setLoading(true);
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: authCallbackUrl(),
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    toast.success("Check your email to confirm your account.");
  }

  async function signInWithGoogle() {
    if (!supabaseConfigured) {
      return toast.error("Configure Supabase env vars first.");
    }
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: authCallbackUrl() },
    });
    if (error) toast.error(error.message);
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1fr_440px]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden border-r bg-card/40 p-10 lg:flex">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-3/5 opacity-70">
          <MarketDepthScene />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <div className="font-semibold">Trading Journal</div>
            <div className="text-xs text-muted-foreground">Execution review desk</div>
          </div>
        </div>
        <div className="relative z-10 max-w-xl space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
            <BarChart3 className="size-3.5 text-primary" />
            Journal, measure, refine
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-5xl font-semibold leading-tight">
              Turn every session into a clean feedback loop.
            </h1>
            <p className="max-w-lg text-base leading-7 text-muted-foreground">
              Capture trades quickly, track your edge, and keep the notes that
              make tomorrow&apos;s execution sharper.
            </p>
          </div>
        </div>
        <div className="relative z-10 grid max-w-xl grid-cols-3 gap-3 text-sm">
          {["PnL curve", "R multiples", "Session review"].map((item) => (
            <div key={item} className="rounded-lg border bg-background/60 p-3">
              <div className="font-medium">{item}</div>
              <div className="mt-1 text-xs text-muted-foreground">Synced with Supabase</div>
            </div>
          ))}
        </div>
      </section>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-45 lg:hidden">
          <MarketDepthScene />
        </div>
        <Card className="w-full max-w-sm border-border/70 shadow-2xl shadow-black/10">
          <CardHeader className="space-y-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary lg:hidden">
              <TrendingUp className="size-5" />
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to keep your trading record current</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!supabaseConfigured && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to
              .env.local, then restart the dev server.
            </div>
          )}
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            {(["signin", "signup"] as const).map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`email-${tab}`}>Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={`email-${tab}`}
                      className="pl-9"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`password-${tab}`}>Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={`password-${tab}`}
                      className="pl-9"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (tab === "signin" ? signIn() : signUp())
                      }
                      autoComplete={tab === "signin" ? "current-password" : "new-password"}
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  disabled={!supabaseConfigured || loading || !email || !password}
                  onClick={tab === "signin" ? signIn : signUp}
                >
                  {tab === "signin" ? "Sign in" : "Create account"}
                </Button>
              </TabsContent>
            ))}
          </Tabs>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            disabled={!supabaseConfigured}
            onClick={signInWithGoogle}
          >
            <Globe2 className="size-4" />
            Continue with Google
          </Button>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
