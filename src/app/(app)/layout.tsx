import Link from "next/link";
import { redirect } from "next/navigation";
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
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/dashboard" className="mr-2 font-semibold">
              TJ
            </Link>
            <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/trades" />}>
              Trades
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/settings" />}>
              Settings
            </Button>
          </nav>
          <div className="flex items-center gap-2">
            <Button size="sm" render={<Link href="/trades/new" />}>
              + Trade
            </Button>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
