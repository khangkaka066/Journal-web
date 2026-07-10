"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, FileImage, Save, Send, ShieldAlert, WalletCards } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { computePnl, computeRMultiple } from "@/lib/pnl";
import { deriveSession } from "@/lib/sessions";
import type {
  Direction,
  Instrument,
  Session,
  Trade,
  TradeChecklist,
} from "@/lib/types";
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

const CHECKLIST_GROUPS: {
  key: keyof TradeChecklist;
  title: string;
  items: string[];
}[] = [
  {
    key: "entryModels",
    title: "Entry model",
    items: ["CISD", "iFVG", "FVG mitigation", "Liquidity sweep", "Order block", "Breaker"],
  },
  {
    key: "context",
    title: "Market context",
    items: ["HTF PDA", "Premium/discount", "Draw on liquidity", "Killzone", "News clear"],
  },
  {
    key: "confirmation",
    title: "Confirmation",
    items: ["Absorption", "Exhaustion", "Displacement", "MSS/BOS", "Volume shift"],
  },
  {
    key: "execution",
    title: "Execution discipline",
    items: ["Planned entry", "Stop at invalidation", "Target liquidity", "2R+ available", "No chase"],
  },
  {
    key: "review",
    title: "Review",
    items: ["Followed plan", "Screenshot saved", "Mistake tagged", "Lesson written"],
  },
];

const EMPTY_CHECKLIST: Required<TradeChecklist> = {
  entryModels: [],
  context: [],
  confirmation: [],
  execution: [],
  review: [],
};

const MISTAKE_TAGS = [
  "Chased entry",
  "Late entry",
  "No HTF PDA",
  "Ignored news",
  "Moved stop",
  "Early exit",
  "Oversized",
  "Revenge trade",
  "No liquidity target",
  "Entered in chop",
];

const RULE_BREAKS = [
  "No checklist",
  "No invalidation",
  "No 2R available",
  "Outside killzone",
  "Against HTF bias",
  "No displacement",
  "Entered before confirmation",
  "Held past plan",
];

function normalizeChecklist(checklist?: TradeChecklist | null): Required<TradeChecklist> {
  return {
    entryModels: checklist?.entryModels ?? [],
    context: checklist?.context ?? [],
    confirmation: checklist?.confirmation ?? [],
    execution: checklist?.execution ?? [],
    review: checklist?.review ?? [],
  };
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
  const [mistakeTags, setMistakeTags] = useState<string[]>(trade?.mistake_tags ?? []);
  const [ruleBreaks, setRuleBreaks] = useState<string[]>(trade?.rule_breaks ?? []);
  const [lessons, setLessons] = useState(trade?.lessons ?? "");
  const [tradeChecklist, setTradeChecklist] = useState<Required<TradeChecklist>>(
    normalizeChecklist(trade?.trade_checklist)
  );
  const [tags, setTags] = useState(trade?.tags?.join(", ") ?? "");
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>(
    trade?.screenshot_urls ?? []
  );
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
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
  const totalChecklistItems = CHECKLIST_GROUPS.reduce(
    (sum, group) => sum + group.items.length,
    0
  );
  const selectedChecklistItems = CHECKLIST_GROUPS.reduce(
    (sum, group) => sum + tradeChecklist[group.key].length,
    0
  );

  function toggleChecklistItem(group: keyof TradeChecklist, item: string) {
    setTradeChecklist((current) => {
      const selected = current[group];
      const nextSelected = selected.includes(item)
        ? selected.filter((value) => value !== item)
        : [...selected, item];

      return { ...current, [group]: nextSelected };
    });
  }

  function toggleString(list: string[], item: string, setList: (value: string[]) => void) {
    setList(list.includes(item) ? list.filter((value) => value !== item) : [...list, item]);
  }

  async function uploadScreenshots(): Promise<string[] | null> {
    if (screenshotFiles.length === 0) return [];

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      toast.error("Sign in again before uploading screenshots");
      return null;
    }

    const uploaded: string[] = [];
    for (const file of screenshotFiles) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage.from("screenshots").upload(path, file);

      if (error) {
        toast.error(error.message);
        return null;
      }

      uploaded.push(path);
    }

    return uploaded;
  }

  async function save(addAnother: boolean) {
    if (!instrumentId || !entryPrice || !exitPrice || !quantity || !entryTime) {
      return toast.error("Fill in the required fields");
    }
    if (pnl == null || isNaN(pnl)) return toast.error("PnL could not be computed");

    setSaving(true);
    const uploadedScreenshots = await uploadScreenshots();
    if (uploadedScreenshots == null) {
      setSaving(false);
      return;
    }

    const nextScreenshotUrls = [...screenshotUrls, ...uploadedScreenshots];
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
      mistake_tags: mistakeTags,
      rule_breaks: ruleBreaks,
      lessons: lessons || null,
      trade_checklist: tradeChecklist,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      screenshot_urls: nextScreenshotUrls,
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
      setTradeChecklist(EMPTY_CHECKLIST);
      setMistakeTags([]);
      setRuleBreaks([]);
      setScreenshotUrls([]);
      setScreenshotFiles([]);
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
          <div className="rounded-lg border bg-background/50 p-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-medium">Setup checklist</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedChecklistItems}/{totalChecklistItems} conditions checked
                </p>
              </div>
              <div className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium tabular-nums">
                {Math.round((selectedChecklistItems / totalChecklistItems) * 100)}%
              </div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {CHECKLIST_GROUPS.map((group) => (
                <div key={group.key} className="space-y-2">
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    {group.title}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => {
                      const selected = tradeChecklist[group.key].includes(item);

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleChecklistItem(group.key, item)}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                            selected
                              ? "border-primary/60 bg-primary/15 text-primary"
                              : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
          <ReviewChips
            icon={<ShieldAlert className="size-4 text-primary" />}
            title="Mistake tags"
            description="Structured tags make mistake stats reliable."
            items={MISTAKE_TAGS}
            selected={mistakeTags}
            onToggle={(item) => toggleString(mistakeTags, item, setMistakeTags)}
          />
          <ReviewChips
            icon={<ShieldAlert className="size-4 text-destructive" />}
            title="Rule breaks"
            description="Mark broken rules to measure their real cost."
            items={RULE_BREAKS}
            selected={ruleBreaks}
            onToggle={(item) => toggleString(ruleBreaks, item, setRuleBreaks)}
          />
          <div className="rounded-lg border bg-background/50 p-4">
            <div className="flex items-center gap-2">
              <FileImage className="size-4 text-primary" />
              <div>
                <h3 className="font-medium">Screenshots</h3>
                <p className="text-sm text-muted-foreground">
                  Upload chart images to preserve the exact market context.
                </p>
              </div>
            </div>
            <Input
              className="mt-3"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) =>
                setScreenshotFiles(Array.from(event.target.files ?? []))
              }
            />
            {(screenshotUrls.length > 0 || screenshotFiles.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {screenshotUrls.map((url) => (
                  <span key={url} className="rounded-md border bg-card px-2 py-1">
                    {url.split("/").at(-1)}
                  </span>
                ))}
                {screenshotFiles.map((file) => (
                  <span key={file.name} className="rounded-md border bg-card px-2 py-1">
                    {file.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Mistakes</Label>
            <Textarea
              rows={2}
              placeholder="What rule did you break, or what almost broke?"
              value={mistakes}
              onChange={(e) => setMistakes(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Lessons learned</Label>
            <Textarea
              rows={2}
              placeholder="What should be repeated, avoided, or tested next?"
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              rows={3}
              placeholder="Narrative, HTF story, target, management, screenshots link..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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

function ReviewChips({
  icon,
  title,
  description,
  items,
  selected,
  onToggle,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <div className="rounded-lg border bg-background/50 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected.includes(item);

          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                active
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
