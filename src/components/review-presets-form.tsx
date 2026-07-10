"use client";

import { useState } from "react";
import { Plus, RotateCcw, Save, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  CHECKLIST_GROUPS,
  DEFAULT_REVIEW_PRESETS,
  type ChecklistDrafts,
  type ReviewPresets,
  parseReviewPresets,
  uniqueItems,
} from "@/lib/review-presets";
import type { ReviewPresetRecord, TradeChecklist } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ReviewPresetsForm({
  userId,
  preset,
}: {
  userId: string;
  preset?: ReviewPresetRecord | null;
}) {
  const [presets, setPresets] = useState<ReviewPresets>(() =>
    preset
      ? parseReviewPresets({
          checklist: preset.checklist,
          mistakeTags: preset.mistake_tags,
          ruleBreaks: preset.rule_breaks,
        })
      : DEFAULT_REVIEW_PRESETS
  );
  const [drafts, setDrafts] = useState<ChecklistDrafts>({
    entryModels: "",
    context: "",
    confirmation: "",
    execution: "",
    review: "",
  });
  const [mistakeDraft, setMistakeDraft] = useState("");
  const [ruleDraft, setRuleDraft] = useState("");
  const [saving, setSaving] = useState(false);

  function addChecklistItem(group: keyof TradeChecklist) {
    const item = drafts[group].trim();
    if (!item) return;

    setPresets((current) => ({
      ...current,
      checklist: {
        ...current.checklist,
        [group]: uniqueItems([...current.checklist[group], item]),
      },
    }));
    setDrafts((current) => ({ ...current, [group]: "" }));
  }

  function removeChecklistItem(group: keyof TradeChecklist, item: string) {
    setPresets((current) => ({
      ...current,
      checklist: {
        ...current.checklist,
        [group]: current.checklist[group].filter((value) => value !== item),
      },
    }));
  }

  function addTag(kind: "mistakeTags" | "ruleBreaks", value: string) {
    const item = value.trim();
    if (!item) return;

    setPresets((current) => ({
      ...current,
      [kind]: uniqueItems([...current[kind], item]),
    }));
    if (kind === "mistakeTags") setMistakeDraft("");
    else setRuleDraft("");
  }

  function removeTag(kind: "mistakeTags" | "ruleBreaks", value: string) {
    setPresets((current) => ({
      ...current,
      [kind]: current[kind].filter((item) => item !== value),
    }));
  }

  async function save() {
    setSaving(true);
    const { error } = await createClient().from("review_presets").upsert({
      user_id: userId,
      checklist: presets.checklist,
      mistake_tags: presets.mistakeTags,
      rule_breaks: presets.ruleBreaks,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);

    if (error) return toast.error(error.message);
    toast.success("Review presets saved");
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card/80 p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="font-semibold">Review presets</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Customize checklist items, mistake tags, and rule breaks for your process.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setPresets(DEFAULT_REVIEW_PRESETS)}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            <Save className="size-4" />
            Save presets
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {CHECKLIST_GROUPS.map((group) => (
          <PresetSection
            key={group.key}
            title={group.title}
            items={presets.checklist[group.key]}
            draft={drafts[group.key]}
            onDraftChange={(value) => setDrafts((current) => ({ ...current, [group.key]: value }))}
            onAdd={() => addChecklistItem(group.key)}
            onRemove={(item) => removeChecklistItem(group.key, item)}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PresetSection
          title="Mistake tags"
          items={presets.mistakeTags}
          draft={mistakeDraft}
          onDraftChange={setMistakeDraft}
          onAdd={() => addTag("mistakeTags", mistakeDraft)}
          onRemove={(item) => removeTag("mistakeTags", item)}
        />
        <PresetSection
          title="Rule breaks"
          items={presets.ruleBreaks}
          draft={ruleDraft}
          onDraftChange={setRuleDraft}
          onAdd={() => addTag("ruleBreaks", ruleDraft)}
          onRemove={(item) => removeTag("ruleBreaks", item)}
        />
      </div>
    </div>
  );
}

function PresetSection({
  title,
  items,
  draft,
  onDraftChange,
  onAdd,
  onRemove,
}: {
  title: string;
  items: string[];
  draft: string;
  onDraftChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (item: string) => void;
}) {
  return (
    <div className="rounded-lg border bg-background/50 p-4">
      <Label className="text-xs uppercase text-muted-foreground">{title}</Label>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
            No items yet.
          </div>
        ) : (
          items.map((item) => (
            <span key={item} className="inline-flex overflow-hidden rounded-lg border">
              <span className="bg-card px-3 py-1.5 text-sm">{item}</span>
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => onRemove(item)}
                className="border-l bg-card px-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAdd();
            }
          }}
          placeholder={`Add ${title.toLowerCase()}`}
        />
        <Button type="button" variant="secondary" size="icon" aria-label={`Add ${title}`} onClick={onAdd}>
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
