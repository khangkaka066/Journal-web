import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, ListChecks, Plus, Settings, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <nav className="flex min-w-0 items-center gap-1 text-sm">
            <Link href="/dashboard" className="mr-3 flex items-center gap-2 font-semibold">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <TrendingUp className="size-4" />
              </span>
              <span className="hidden sm:inline">Journal</span>
            </Link>
            <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
              <BarChart3 className="size-4" />
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/trades" />}>
              <ListChecks className="size-4" />
              Trades
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/settings" />}>
              <Settings className="size-4" />
              Settings
            </Button>
          </nav>
          <div className="flex items-center gap-2">
            <Button size="sm" render={<Link href="/trades/new" />}>
              <Plus className="size-4" />
              Trade
            </Button>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
