"use client";

import { useState } from "react";
import { Bot, Eye, EyeOff, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const AI_SETTINGS_KEYS = {
  apiKey: "journal_openrouter_api_key",
  model: "journal_openrouter_model",
} as const;

const DEFAULT_MODEL = "openai/gpt-4o-mini";

export function AiSettingsForm() {
  const [apiKey, setApiKey] = useState(() =>
    typeof window === "undefined" ? "" : localStorage.getItem(AI_SETTINGS_KEYS.apiKey) ?? ""
  );
  const [model, setModel] = useState(() =>
    typeof window === "undefined"
      ? DEFAULT_MODEL
      : localStorage.getItem(AI_SETTINGS_KEYS.model) ?? DEFAULT_MODEL
  );
  const [showKey, setShowKey] = useState(false);

  function save() {
    const key = apiKey.trim();
    const nextModel = model.trim() || DEFAULT_MODEL;

    if (key) localStorage.setItem(AI_SETTINGS_KEYS.apiKey, key);
    else localStorage.removeItem(AI_SETTINGS_KEYS.apiKey);

    localStorage.setItem(AI_SETTINGS_KEYS.model, nextModel);
    setModel(nextModel);
    toast.success("AI settings saved on this browser");
  }

  function clear() {
    localStorage.removeItem(AI_SETTINGS_KEYS.apiKey);
    localStorage.removeItem(AI_SETTINGS_KEYS.model);
    setApiKey("");
    setModel(DEFAULT_MODEL);
    toast.success("AI key removed from this browser");
  }

  return (
    <div className="rounded-xl border bg-card/80 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bot className="size-5" />
        </div>
        <div>
          <h2 className="font-semibold">AI settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your OpenRouter key for AI reviews. The key is stored only in this browser.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="space-y-1.5">
          <Label>OpenRouter API key</Label>
          <div className="flex gap-2">
            <Input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="sk-or-v1-..."
              autoComplete="off"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label={showKey ? "Hide API key" : "Show API key"}
              onClick={() => setShowKey((value) => !value)}
            >
              {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>OpenRouter model</Label>
          <Input
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder={DEFAULT_MODEL}
          />
          <p className="text-xs text-muted-foreground">
            Use a vision-capable model if you want screenshot review.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" onClick={save}>
          <Save className="size-4" />
          Save AI settings
        </Button>
        <Button type="button" variant="secondary" onClick={clear}>
          <Trash2 className="size-4" />
          Remove key
        </Button>
      </div>
    </div>
  );
}
