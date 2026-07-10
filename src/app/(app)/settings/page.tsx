import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings-form";
import { ReviewPresetsForm } from "@/components/review-presets-form";
import { SlidersHorizontal } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: profile }, { data: reviewPreset }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("review_presets").select("*").eq("user_id", user!.id).maybeSingle(),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border bg-card/75 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="size-4 text-primary" />
          Workspace preferences
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Align reporting with your timezone and base currency.
        </p>
      </div>
      <SettingsForm
        profile={profile ?? { id: user!.id, timezone: "UTC", base_currency: "USD" }}
      />
      <ReviewPresetsForm userId={user!.id} preset={reviewPreset} />
    </div>
  );
}
