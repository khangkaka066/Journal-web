"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Save, Send, WalletCards } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { computePnl, computeRMultiple } from "@/lib/pnl";
import { deriveSession } from "@/lib/sessions";
import type { Direction, Instrument, Session, Trade } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";

const DEFAULTS_KEY = "last_trade_defaults";

interface Defaults {
  instrument_id?: string;
  direction?: Direction;
  quantity?: string;
  fees?: string;
}

function nowLocalInput(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function TradeForm({
  instruments,
  trade,
}: {
  instruments: Instrument[];
  trade?: Trade;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [instrumentId, setInstrumentId] = useState(trade?.instrument_id ?? "");
  const [direction, setDirection] = useState<Direction>(trade?.direction ?? "long");
  const [entryPrice, setEntryPrice] = useState(trade?.entry_price?.toString() ?? "");
  const [exitPrice, setExitPrice] = useState(trade?.exit_price?.toString() ?? "");
  const [quantity, setQuantity] = useState(trade?.quantity?.toString() ?? "1");
  const [entryTime, setEntryTime] = useState(
    trade ? toLocalInput(trade.entry_time) : nowLocalInput()
  );
  const [exitTime, setExitTime] = useState(
    trade?.exit_time ? toLocalInput(trade.exit_time) : ""
  );
  const [fees, setFees] = useState(trade?.fees?.toString() ?? "0");
  const [pnlOverride, setPnlOverride] = useState(
    trade?.pnl_overridden ? trade.pnl.toString() : ""
  );
  const [risk, setRisk] = useState(trade?.risk?.toString() ?? "");
  const [session, setSession] = useState<Session | "">(trade?.session ?? "");
  const [setup, setSetup] = useState(trade?.setup ?? "");
  const [strategy, setStrategy] = useState(trade?.strategy ?? "");
  const [confidence, setConfidence] = useState(trade?.confidence?.toString() ?? "");
  const [emotionBefore, setEmotionBefore] = useState(trade?.emotion_before ?? "");
  const [emotionAfter, setEmotionAfter] = useState(trade?.emotion_after ?? "");
  const [mistakes, setMistakes] = useState(trade?.mistakes ?? "");
  const [lessons, setLessons] = useState(trade?.lessons ?? "");
  const [tags, setTags] = useState(trade?.tags?.join(", ") ?? "");
  const [notes, setNotes] = useState(trade?.notes ?? "");
  const [saving, setSaving] = useState(false);

  // prefill from last trade defaults (new trades only)
  useEffect(() => {
    if (trade) return;
    const frame = requestAnimationFrame(() => {
      try {
        const d: Defaults = JSON.parse(localStorage.getItem(DEFAULTS_KEY) ?? "{}");
        if (d.instrument_id) setInstrumentId(d.instrument_id);
        if (d.direction) setDirection(d.direction);
        if (d.quantity) setQuantity(d.quantity);
        if (d.fees) setFees(d.fees);
      } catch {}
    });

    return () => cancelAnimationFrame(frame);
  }, [trade]);

  const instrument = instruments.find((i) => i.id === instrumentId);

  const autoPnl = useMemo(() => {
    const e = parseFloat(entryPrice);
    const x = parseFloat(exitPrice);
    const q = parseFloat(quantity);
    const f = parseFloat(fees) || 0;
    if (!instrument || isNaN(e) || isNaN(x) || isNaN(q)) return null;
    return computePnl({
      entryPrice: e,
      exitPrice: x,
      direction,
      quantity: q,
      pointValue: instrument.point_value,
      fees: f,
    });
  }, [entryPrice, exitPrice, quantity, fees, direction, instrument]);

  const pnl = pnlOverride !== "" ? parseFloat(pnlOverride) : autoPnl;
  const rMultiple = pnl != null ? computeRMultiple(pnl, parseFloat(risk) || null) : null;
  const autoSession = entryTime ? deriveSession(new Date(entryTime)) : null;

  async function save(addAnother: boolean) {
    if (!instrumentId || !entryPrice || !exitPrice || !quantity || !entryTime) {
      return toast.error("Fill in the required fields");
    }
    if (pnl == null || isNaN(pnl)) return toast.error("PnL could not be computed");

    setSaving(true);
    const payload = {
      instrument_id: instrumentId,
      direction,
      entry_price: parseFloat(entryPrice),
      exit_price: parseFloat(exitPrice),
      quantity: parseFloat(quantity),
      entry_time: new Date(entryTime).toISOString(),
      exit_time: exitTime ? new Date(exitTime).toISOString() : null,
      fees: parseFloat(fees) || 0,
      pnl,
      pnl_overridden: pnlOverride !== "",
      risk: parseFloat(risk) || null,
      r_multiple: rMultiple,
      session: session || autoSession,
      setup: setup || null,
      strategy: strategy || null,
      confidence: confidence ? parseInt(confidence) : null,
      emotion_before: emotionBefore || null,
      emotion_after: emotionAfter || null,
      mistakes: mistakes || null,
      lessons: lessons || null,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      notes: notes || null,
    };

    const { error } = trade
      ? await supabase.from("trades").update(payload).eq("id", trade.id)
      : await supabase.from("trades").insert(payload);
    setSaving(false);

    if (error) return toast.error(error.message);

    localStorage.setItem(
      DEFAULTS_KEY,
      JSON.stringify({ instrument_id: instrumentId, direction, quantity, fees } satisfies Defaults)
    );
    toast.success(trade ? "Trade updated" : "Trade saved");

    if (addAnother) {
      setEntryPrice("");
      setExitPrice("");
      setEntryTime(nowLocalInput());
      setExitTime("");
      setPnlOverride("");
      setRisk("");
      setNotes("");
      router.refresh();
    } else {
      router.push("/trades");
      router.refresh();
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Required fields */}
      <div className="rounded-xl border bg-card/80 p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Execution</h2>
            <p className="text-sm text-muted-foreground">
              Instrument, side, sizing, and prices.
            </p>
          </div>
          <div className="rounded-lg border bg-background px-3 py-2 text-right">
            <div className="text-xs text-muted-foreground">Auto session</div>
            <div className="text-sm font-medium capitalize">
              {(autoSession ?? "pending").replace("_", " ")}
            </div>
          </div>
        </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Instrument *</Label>
          <Select value={instrumentId} onValueChange={(v) => v && setInstrumentId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {instruments.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Direction *</Label>
          <ToggleGroup
            variant="outline"
            className="w-full"
            value={[direction]}
            onValueChange={(v: string[]) => v[0] && setDirection(v[0] as Direction)}
          >
            <ToggleGroupItem
              value="long"
              className="flex-1 data-[state=on]:bg-emerald-500/15 data-[state=on]:text-emerald-400"
            >
              Long
            </ToggleGroupItem>
            <ToggleGroupItem
              value="short"
              className="flex-1 data-[state=on]:bg-red-500/15 data-[state=on]:text-red-400"
            >
              Short
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="space-y-1.5">
          <Label>Entry price *</Label>
          <Input type="number" step="any" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Exit price *</Label>
          <Input type="number" step="any" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Quantity *</Label>
          <Input type="number" step="any" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Entry time *</Label>
          <Input type="datetime-local" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} />
        </div>
      </div>
      </div>

      {/* Live PnL preview */}
      <div className="grid gap-4 rounded-xl border bg-card/80 p-4 shadow-sm sm:grid-cols-[1fr_180px] sm:p-5">
        <div className="flex items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <WalletCards className="size-5" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Live PnL preview</div>
            <div
              className={`mt-1 text-3xl font-semibold tabular-nums ${
                pnl == null ? "" : pnl >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {pnl == null || isNaN(pnl) ? "—" : `$${pnl.toFixed(2)}`}
              {rMultiple != null && !isNaN(rMultiple) && (
                <span className="ml-2 align-middle text-sm text-muted-foreground">
                  {rMultiple.toFixed(2)}R
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Override PnL</Label>
          <Input
            type="number"
            step="any"
            placeholder={autoPnl != null ? autoPnl.toFixed(2) : "auto"}
            value={pnlOverride}
            onChange={(e) => setPnlOverride(e.target.value)}
          />
        </div>
      </div>

      {/* Optional details */}
      <Collapsible defaultOpen={!!trade} className="rounded-xl border bg-card/80 p-4 shadow-sm sm:p-5">
        <CollapsibleTrigger
          render={
            <Button variant="ghost" size="sm" className="text-muted-foreground" />
          }
        >
          <ChevronDown className="size-4" />
          More details
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Exit time</Label>
              <Input type="datetime-local" value={exitTime} onChange={(e) => setExitTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fees</Label>
              <Input type="number" step="any" value={fees} onChange={(e) => setFees(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Risk ($)</Label>
              <Input type="number" step="any" placeholder="for R-multiple" value={risk} onChange={(e) => setRisk(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Session</Label>
              <Select
                value={session || autoSession || ""}
                onValueChange={(v) => v && setSession(v as Session)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="auto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asia">Asia</SelectItem>
                  <SelectItem value="london">London</SelectItem>
                  <SelectItem value="new_york">New York</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Setup</Label>
              <Input value={setup} onChange={(e) => setSetup(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Strategy</Label>
              <Input value={strategy} onChange={(e) => setStrategy(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Confidence (1–5)</Label>
              <ToggleGroup
                variant="outline"
                className="w-full"
                value={confidence ? [confidence] : []}
                onValueChange={(v: string[]) => setConfidence(v[0] ?? "")}
              >
                {["1", "2", "3", "4", "5"].map((c) => (
                  <ToggleGroupItem key={c} value={c} className="flex-1">
                    {c}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma separated)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Emotion before</Label>
              <Input value={emotionBefore} onChange={(e) => setEmotionBefore(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Emotion after</Label>
              <Input value={emotionAfter} onChange={(e) => setEmotionAfter(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mistakes</Label>
            <Textarea rows={2} value={mistakes} onChange={(e) => setMistakes(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Lessons learned</Label>
            <Textarea rows={2} value={lessons} onChange={(e) => setLessons(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex gap-2">
        <Button onClick={() => save(false)} disabled={saving}>
          <Save className="size-4" />
          {trade ? "Update trade" : "Save trade"}
        </Button>
        {!trade && (
          <Button variant="secondary" onClick={() => save(true)} disabled={saving}>
            <Send className="size-4" />
            Save & add another
          </Button>
        )}
      </div>
    </div>
  );
}
