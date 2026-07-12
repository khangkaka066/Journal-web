"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  FileImage,
  Plus,
  Save,
  Send,
  ShieldAlert,
  WalletCards,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { computePnl, computeRMultiple } from "@/lib/pnl";
import { deriveSession } from "@/lib/sessions";
import { normalizeTag, normalizeTags, parseTagInput } from "@/lib/tags";
import type { ProcessAlert } from "@/lib/stats";
import type {
  Direction,
  Instrument,
  ReviewPresetRecord,
  Session,
  Trade,
  TradeChecklist,
} from "@/lib/types";
import {
  CHECKLIST_GROUPS,
  DEFAULT_REVIEW_PRESETS,
  EMPTY_CHECKLIST,
  REVIEW_PRESETS_KEY,
  type ChecklistDrafts,
  type ReviewPresets,
  mergeReviewPresets,
  normalizeChecklist,
  parseReviewPresets,
  uniqueItems,
} from "@/lib/review-presets";
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

function loadReviewPresets(
  savedChecklist: Required<TradeChecklist>,
  serverPresets?: ReviewPresetRecord | null
): ReviewPresets {
  const base = serverPresets
    ? parseReviewPresets({
        checklist: serverPresets.checklist,
        mistakeTags: serverPresets.mistake_tags,
        ruleBreaks: serverPresets.rule_breaks,
      })
    : DEFAULT_REVIEW_PRESETS;

  if (typeof window === "undefined") {
    return mergeReviewPresets(base, savedChecklist);
  }

  try {
    const raw = localStorage.getItem(REVIEW_PRESETS_KEY);
    if (!raw || serverPresets) return mergeReviewPresets(base, savedChecklist);

    const stored = JSON.parse(raw) as Partial<ReviewPresets>;
    return mergeReviewPresets(parseReviewPresets(stored), savedChecklist);
  } catch {
    return mergeReviewPresets(base, savedChecklist);
  }
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
  reviewPreset,
  processAlerts = [],
}: {
  instruments: Instrument[];
  trade?: Trade;
  reviewPreset?: ReviewPresetRecord | null;
  processAlerts?: ProcessAlert[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

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
  const [mistakeTags, setMistakeTags] = useState<string[]>(normalizeTags(trade?.mistake_tags ?? []));
  const [ruleBreaks, setRuleBreaks] = useState<string[]>(normalizeTags(trade?.rule_breaks ?? []));
  const [lessons, setLessons] = useState(trade?.lessons ?? "");
  const [tradeChecklist, setTradeChecklist] = useState<Required<TradeChecklist>>(
    normalizeChecklist(trade?.trade_checklist)
  );
  const [reviewPresets, setReviewPresets] = useState<ReviewPresets>(() =>
    loadReviewPresets(normalizeChecklist(trade?.trade_checklist), reviewPreset)
  );
  const [newChecklistItems, setNewChecklistItems] = useState<ChecklistDrafts>({
    entryModels: "",
    context: "",
    confirmation: "",
    execution: "",
    review: "",
  });
  const [newMistakeTag, setNewMistakeTag] = useState("");
  const [newRuleBreak, setNewRuleBreak] = useState("");
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

  useEffect(() => {
    localStorage.setItem(REVIEW_PRESETS_KEY, JSON.stringify(reviewPresets));

    let canceled = false;
    const timeout = window.setTimeout(async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (canceled || userError || !user) return;

      await supabase.from("review_presets").upsert({
        user_id: user.id,
        checklist: reviewPresets.checklist,
        mistake_tags: reviewPresets.mistakeTags,
        rule_breaks: reviewPresets.ruleBreaks,
        updated_at: new Date().toISOString(),
      });
    }, 500);

    return () => {
      canceled = true;
      window.clearTimeout(timeout);
    };
  }, [reviewPresets, supabase]);

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
    (sum, group) => sum + reviewPresets.checklist[group.key].length,
    0
  );
  const selectedChecklistItems = CHECKLIST_GROUPS.reduce(
    (sum, group) => sum + tradeChecklist[group.key].length,
    0
  );
  const checklistProgress = totalChecklistItems
    ? Math.round((selectedChecklistItems / totalChecklistItems) * 100)
    : 0;
  const selectedProcessAlerts = processAlerts.filter((alert) =>
    alert.source === "Mistake"
      ? mistakeTags.includes(alert.name)
      : ruleBreaks.includes(alert.name)
  );

  function addChecklistItem(group: keyof TradeChecklist) {
    const item = newChecklistItems[group].trim();
    if (!item) return;

    setReviewPresets((current) => ({
      ...current,
      checklist: {
        ...current.checklist,
        [group]: uniqueItems([...current.checklist[group], item]),
      },
    }));
    setTradeChecklist((current) => ({
      ...current,
      [group]: uniqueItems([...current[group], item]),
    }));
    setNewChecklistItems((current) => ({ ...current, [group]: "" }));
  }

  function removeChecklistPreset(group: keyof TradeChecklist, item: string) {
    setReviewPresets((current) => ({
      ...current,
      checklist: {
        ...current.checklist,
        [group]: current.checklist[group].filter((value) => value !== item),
      },
    }));
    setTradeChecklist((current) => ({
      ...current,
      [group]: current[group].filter((value) => value !== item),
    }));
  }

  function addReviewPreset(kind: "mistakeTags" | "ruleBreaks", item: string) {
    const nextItem = normalizeTag(item);
    if (!nextItem) return;

    setReviewPresets((current) => ({
      ...current,
      [kind]: uniqueItems([...current[kind], nextItem]),
    }));

    if (kind === "mistakeTags") {
      setMistakeTags((current) => uniqueItems([...current, nextItem]));
      setNewMistakeTag("");
    } else {
      setRuleBreaks((current) => uniqueItems([...current, nextItem]));
      setNewRuleBreak("");
    }
  }

  function removeReviewPreset(kind: "mistakeTags" | "ruleBreaks", item: string) {
    setReviewPresets((current) => ({
      ...current,
      [kind]: current[kind].filter((value) => value !== item),
    }));

    if (kind === "mistakeTags") {
      setMistakeTags((current) => current.filter((value) => value !== item));
    } else {
      setRuleBreaks((current) => current.filter((value) => value !== item));
    }
  }

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
    const nextItem = normalizeTag(item);
    if (!nextItem) return;
    setList(list.includes(nextItem) ? list.filter((value) => value !== nextItem) : normalizeTags([...list, nextItem]));
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
      mistake_tags: normalizeTags(mistakeTags),
      rule_breaks: normalizeTags(ruleBreaks),
      lessons: lessons || null,
      trade_checklist: tradeChecklist,
      tags: parseTagInput(tags),
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
              {pnl == null || isNaN(pnl) ? "N/A" : `$${pnl.toFixed(2)}`}
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
                {checklistProgress}%
              </div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {CHECKLIST_GROUPS.map((group) => (
                <div key={group.key} className="space-y-2">
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    {group.title}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {reviewPresets.checklist[group.key].map((item) => {
                      const selected = tradeChecklist[group.key].includes(item);

                      return (
                        <span key={item} className="inline-flex overflow-hidden rounded-lg border">
                          <button
                            type="button"
                            onClick={() => toggleChecklistItem(group.key, item)}
                            className={`px-3 py-1.5 text-sm transition ${
                              selected
                                ? "bg-primary/15 text-primary"
                                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            {item}
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${item}`}
                            onClick={() => removeChecklistPreset(group.key, item)}
                            className="border-l bg-card px-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="size-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newChecklistItems[group.key]}
                      onChange={(event) =>
                        setNewChecklistItems((current) => ({
                          ...current,
                          [group.key]: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addChecklistItem(group.key);
                        }
                      }}
                      placeholder="Add custom item"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      aria-label={`Add ${group.title} item`}
                      onClick={() => addChecklistItem(group.key)}
                    >
                      <Plus className="size-4" />
                    </Button>
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
            items={reviewPresets.mistakeTags}
            selected={mistakeTags}
            onToggle={(item) => toggleString(mistakeTags, item, setMistakeTags)}
            newItem={newMistakeTag}
            onNewItemChange={setNewMistakeTag}
            onAddItem={() => addReviewPreset("mistakeTags", newMistakeTag)}
            onRemoveItem={(item) => removeReviewPreset("mistakeTags", item)}
          />
          <ReviewChips
            icon={<ShieldAlert className="size-4 text-destructive" />}
            title="Rule breaks"
            description="Mark broken rules to measure their real cost."
            items={reviewPresets.ruleBreaks}
            selected={ruleBreaks}
            onToggle={(item) => toggleString(ruleBreaks, item, setRuleBreaks)}
            newItem={newRuleBreak}
            onNewItemChange={setNewRuleBreak}
            onAddItem={() => addReviewPreset("ruleBreaks", newRuleBreak)}
            onRemoveItem={(item) => removeReviewPreset("ruleBreaks", item)}
          />
          {selectedProcessAlerts.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 font-medium text-destructive">
                <ShieldAlert className="size-4" />
                Process alerts
              </div>
              <div className="mt-3 grid gap-2">
                {selectedProcessAlerts.slice(0, 4).map((alert) => (
                  <div key={`${alert.source}-${alert.name}`} className="rounded-lg border bg-background/70 p-3 text-sm">
                    <div className="font-medium">
                      {alert.name} has cost ${Math.abs(alert.totalPnl).toFixed(2)} across {alert.count} trade{alert.count === 1 ? "" : "s"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {alert.source} · {alert.lossCount} loss{alert.lossCount === 1 ? "" : "es"} · avg ${alert.avgPnl.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
  newItem,
  onNewItemChange,
  onAddItem,
  onRemoveItem,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  newItem: string;
  onNewItemChange: (value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (item: string) => void;
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
            <span key={item} className="inline-flex overflow-hidden rounded-lg border">
              <button
                type="button"
                onClick={() => onToggle(item)}
                className={`px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item}
              </button>
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => onRemoveItem(item)}
                className="border-l bg-card px-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </span>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          value={newItem}
          onChange={(event) => onNewItemChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAddItem();
            }
          }}
          placeholder={`Add custom ${title.toLowerCase()}`}
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={`Add ${title.toLowerCase()}`}
          onClick={onAddItem}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
