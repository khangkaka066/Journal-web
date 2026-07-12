import { formatDistanceToNow } from "date-fns";
import { Bot, Save } from "lucide-react";
import type { AiReview } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function modeLabel(mode: string) {
  return mode
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function SavedAiReviews({ reviews }: { reviews: AiReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <Card className="bg-card/75">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Save className="size-4 text-primary" />
          Saved AI reviews
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-lg border bg-background/60 p-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 font-medium">
                <Bot className="size-4 text-primary" />
                {review.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {modeLabel(review.mode)} · {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </div>
            </div>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {review.content}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
