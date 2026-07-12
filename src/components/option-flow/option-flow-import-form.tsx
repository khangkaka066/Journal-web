"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function OptionFlowImportForm() {
  const router = useRouter();
  const [symbol, setSymbol] = useState("QQQ");
  const [reportDate, setReportDate] = useState(todayIso());
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  async function importSnapshot() {
    if (!file) {
      toast.error("Choose a CSV or raw JSON snapshot first.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("symbol", symbol);
    formData.set("reportDate", reportDate);

    setImporting(true);
    const response = await fetch("/api/option-flow/import", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    setImporting(false);

    if (!response.ok) {
      toast.error(payload.error ?? "Failed to import snapshot");
      return;
    }

    toast.success("Snapshot imported and AI analysis generated");
    router.refresh();
  }

  return (
    <div className="rounded-xl border bg-card/75 p-5 shadow-sm">
      <div>
        <h2 className="text-base font-medium">Import historical option snapshot</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your CBOE CSV or raw JSON file, choose the session date, then generate a manual report.
          CSV is recommended on Vercel for large snapshots.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[10rem_12rem_1fr_auto] lg:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="snapshot-symbol">Symbol</Label>
          <Input
            id="snapshot-symbol"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            placeholder="QQQ"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="snapshot-date">Report date</Label>
          <Input
            id="snapshot-date"
            type="date"
            value={reportDate}
            onChange={(event) => setReportDate(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="snapshot-file">Snapshot file</Label>
          <Input
            id="snapshot-file"
            type="file"
            accept=".csv,.json"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </div>
        <Button onClick={importSnapshot} disabled={importing}>
          <Upload className="size-4" />
          Import
        </Button>
      </div>
    </div>
  );
}
