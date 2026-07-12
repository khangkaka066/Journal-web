"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_QQQ_LEVELS_TEXT,
  parseOptionFlowLevels,
  type OptionFlowLevel,
} from "@/lib/option-flow/levels";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface OptionFlowInputRecord {
  id: string;
  symbol: string;
  spot_price: number | null;
  raw_text: string;
  levels: OptionFlowLevel[];
  created_at: string;
}

export function OptionFlowInputForm({
  latestInput,
}: {
  latestInput?: OptionFlowInputRecord | null;
}) {
  const router = useRouter();
  const [symbol, setSymbol] = useState(latestInput?.symbol ?? "QQQ");
  const [spotPrice, setSpotPrice] = useState(latestInput?.spot_price?.toString() ?? "");
  const [rawText, setRawText] = useState(latestInput?.raw_text ?? DEFAULT_QQQ_LEVELS_TEXT);
  const [saving, setSaving] = useState(false);

  const preview = useMemo(() => parseOptionFlowLevels(rawText, symbol), [rawText, symbol]);

  async function save() {
    const parsed = parseOptionFlowLevels(rawText, symbol);
    const numericSpot = spotPrice.trim() ? Number(spotPrice) : null;

    if (!parsed.rawText || parsed.levels.length === 0) {
      toast.error("Paste levels in the format: $QQQ: Label, 123, Label, 456");
      return;
    }

    if (numericSpot != null && !Number.isFinite(numericSpot)) {
      toast.error("Current price must be a valid number.");
      return;
    }

    setSaving(true);
    const { error } = await createClient().from("option_flow_inputs").insert({
      symbol: parsed.symbol,
      spot_price: numericSpot,
      raw_text: parsed.rawText,
      levels: parsed.levels,
    });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Option flow levels saved");
    router.refresh();
  }

  return (
    <div className="rounded-xl border bg-card/75 p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-base font-medium">QQQ levels for AI plan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste your Call Resistance, Put Support, HVL, 0DTE, Gamma Wall, and GEX levels here.
            The next cron report will use the newest saved input.
          </p>
        </div>
        {latestInput?.created_at && (
          <div className="text-xs text-muted-foreground">
            Last saved {new Date(latestInput.created_at).toLocaleString()}
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[12rem_12rem_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="option-flow-symbol">Symbol</Label>
          <Input
            id="option-flow-symbol"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            placeholder="QQQ"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="option-flow-spot">Current price</Label>
          <Input
            id="option-flow-spot"
            inputMode="decimal"
            value={spotPrice}
            onChange={(event) => setSpotPrice(event.target.value)}
            placeholder="QQQ spot"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="option-flow-levels">Levels text</Label>
          <Textarea
            id="option-flow-levels"
            className="min-h-28"
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder={DEFAULT_QQQ_LEVELS_TEXT}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="text-xs text-muted-foreground">
          Parsed {preview.levels.length} level{preview.levels.length === 1 ? "" : "s"} for {preview.symbol}.
        </div>
        <Button onClick={save} disabled={saving}>
          <Save className="size-4" />
          Save levels
        </Button>
      </div>
    </div>
  );
}
