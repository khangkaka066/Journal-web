"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Bot, Brain, Camera, GraduationCap, Loader2, MessageSquareText, Sparkles } from "lucide-react";
import type { AiCoachMode } from "@/lib/ai/prompts";
import { AI_SETTINGS_KEYS } from "@/components/ai/ai-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AiAction {
  mode: AiCoachMode;
  title: string;
  description: string;
  tradeId?: string;
}

const ICONS: Record<AiCoachMode, ReactNode> = {
  weekly_review: <Sparkles className="size-4 text-primary" />,
  trade_debrief: <MessageSquareText className="size-4 text-primary" />,
  mistake_patterns: <Brain className="size-4 text-primary" />,
  screenshot_review: <Camera className="size-4 text-primary" />,
  study_plan: <GraduationCap className="size-4 text-primary" />,
};

export function AiCoachPanel({
  title = "AI coach",
  description = "Use OpenRouter to turn your journal data into study feedback.",
  actions,
}: {
  title?: string;
  description?: string;
  actions: AiAction[];
}) {
  const [activeMode, setActiveMode] = useState<AiCoachMode | null>(null);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  async function run(action: AiAction) {
    setActiveMode(action.mode);
    setOutput("");
    setError("");

    const response = await fetch("/api/ai/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: action.mode,
        tradeId: action.tradeId,
        openRouterApiKey: localStorage.getItem(AI_SETTINGS_KEYS.apiKey) ?? "",
        openRouterModel: localStorage.getItem(AI_SETTINGS_KEYS.model) ?? "",
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      output?: string;
      error?: string;
    };

    setActiveMode(null);

    if (!response.ok) {
      setError(payload.error ?? "AI coach failed");
      return;
    }

    setOutput(payload.output ?? "");
  }

  return (
    <Card className="bg-card/75">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="size-4 text-primary" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => {
            const running = activeMode === action.mode;

            return (
              <button
                key={`${action.mode}-${action.tradeId ?? "global"}`}
                type="button"
                onClick={() => run(action)}
                disabled={activeMode != null}
                className="rounded-lg border bg-background/50 p-3 text-left transition hover:border-primary/60 hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex items-center gap-2 font-medium">
                  {running ? <Loader2 className="size-4 animate-spin text-primary" /> : ICONS[action.mode]}
                  {action.title}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{action.description}</div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {output && (
          <div className="rounded-lg border bg-background/70 p-4">
            <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              AI output
            </div>
            <div className="whitespace-pre-wrap text-sm leading-6">{output}</div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Educational review only. Do not treat this as financial advice or a trading signal.
        </div>
      </CardContent>
    </Card>
  );
}
