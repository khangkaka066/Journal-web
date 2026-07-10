"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface ScreenshotView {
  path: string;
  url: string;
}

export function ScreenshotGallery({ screenshots }: { screenshots: ScreenshotView[] }) {
  if (screenshots.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card/80 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ImageIcon className="size-4 text-primary" />
        Saved chart screenshots
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {screenshots.map((screenshot) => (
          <Dialog key={screenshot.path}>
            <DialogTrigger
              render={
                <button
                  type="button"
                  className="group block w-full overflow-hidden rounded-lg border bg-background text-left transition hover:border-primary/60"
                />
              }
            >
              <>
                <Image
                  src={screenshot.url}
                  alt={screenshot.path.split("/").at(-1) ?? "Trade screenshot"}
                  width={900}
                  height={506}
                  unoptimized
                  className="aspect-video w-full object-cover transition group-hover:scale-[1.02]"
                />
                <div className="truncate px-3 py-2 text-xs text-muted-foreground">
                  {screenshot.path.split("/").at(-1)}
                </div>
              </>
            </DialogTrigger>
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle>Chart screenshot</DialogTitle>
                <DialogDescription>{screenshot.path.split("/").at(-1)}</DialogDescription>
              </DialogHeader>
              <Image
                src={screenshot.url}
                alt={screenshot.path.split("/").at(-1) ?? "Trade screenshot"}
                width={1600}
                height={1000}
                unoptimized
                className="max-h-[75vh] w-full rounded-lg border object-contain"
              />
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
