"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "VND"];

export function SettingsForm({ profile }: { profile: Profile }) {
  const [timezone, setTimezone] = useState(profile.timezone);
  const [currency, setCurrency] = useState(profile.base_currency);
  const [saving, setSaving] = useState(false);
  const timezones = Intl.supportedValuesOf("timeZone");

  async function save() {
    setSaving(true);
    const { error } = await createClient()
      .from("profiles")
      .upsert({ id: profile.id, timezone, base_currency: currency });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
  }

  return (
    <div className="rounded-xl border bg-card/80 p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Timezone</Label>
          <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Base currency</Label>
          <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button className="mt-5" onClick={save} disabled={saving}>
        <Save className="size-4" />
        Save
      </Button>
    </div>
  );
}
