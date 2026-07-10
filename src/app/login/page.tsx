"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabaseConfigured = hasSupabaseEnv();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    const { error } = await createClient().auth.signUp({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Check your email to confirm your account.");
  }

  async function signInWithGoogle() {
    if (!supabaseConfigured) {
      return toast.error("Configure Supabase env vars first.");
    }
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error(error.message);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Trading Journal</CardTitle>
          <CardDescription>Sign in to your journal</CardDescription>
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
                  <Input
                    id={`email-${tab}`}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`password-${tab}`}>Password</Label>
                  <Input
                    id={`password-${tab}`}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (tab === "signin" ? signIn() : signUp())}
                    autoComplete={tab === "signin" ? "current-password" : "new-password"}
                  />
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
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
