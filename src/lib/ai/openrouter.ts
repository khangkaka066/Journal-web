type OpenRouterMessage =
  | {
      role: "system" | "user" | "assistant";
      content: string;
    }
  | {
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
    };

interface OpenRouterChoice {
  message?: {
    content?: string;
  };
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  error?: {
    message?: string;
  };
}

export async function askOpenRouter({
  messages,
  maxTokens = 1200,
}: {
  messages: OpenRouterMessage[];
  maxTokens?: number;
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY. Add it in Vercel and .env.local.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-Title": "Trading Journal AI Coach",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_completion_tokens: maxTokens,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as OpenRouterResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `OpenRouter request failed (${response.status})`);
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenRouter returned an empty response.");

  return content;
}
