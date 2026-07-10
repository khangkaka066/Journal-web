"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Trade } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

function checklistCount(trade: Trade) {
  const checklist = trade.trade_checklist;
  if (!checklist) return 0;

  return [
    checklist.entryModels,
    checklist.context,
    checklist.confirmation,
    checklist.execution,
    checklist.review,
  ].reduce((sum, group) => sum + (group?.length ?? 0), 0);
}

export function TradeTable({ trades }: { trades: Trade[] }) {
  const router = useRouter();

  async function deleteTrade(id: string) {
    const { error } = await createClient().from("trades").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Trade deleted");
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card/80 shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Instrument</TableHead>
            <TableHead>Dir</TableHead>
            <TableHead className="text-right">Entry</TableHead>
            <TableHead className="text-right">Exit</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">PnL</TableHead>
            <TableHead className="text-right">R</TableHead>
            <TableHead className="text-right">Checks</TableHead>
            <TableHead>Session</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((t) => (
            <TableRow key={t.id} className="hover:bg-muted/35">
              <TableCell className="whitespace-nowrap">
                <Link href={`/trades/${t.id}`} className="font-medium hover:underline">
                  {new Date(t.entry_time).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Link>
              </TableCell>
              <TableCell className="font-medium">{t.instruments?.symbol}</TableCell>
              <TableCell>
                <Badge
                  variant={t.direction === "long" ? "default" : "destructive"}
                  className="capitalize"
                >
                  {t.direction}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">{t.entry_price}</TableCell>
              <TableCell className="text-right tabular-nums">{t.exit_price}</TableCell>
              <TableCell className="text-right tabular-nums">{t.quantity}</TableCell>
              <TableCell
                className={`text-right font-medium tabular-nums ${
                  t.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {t.pnl >= 0 ? "+" : ""}
                {t.pnl.toFixed(2)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {t.r_multiple != null ? `${t.r_multiple.toFixed(2)}R` : "N/A"}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {checklistCount(t)}
              </TableCell>
              <TableCell className="text-muted-foreground">{t.session ?? "N/A"}</TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete trade"
                      />
                    }
                  >
                    <Trash2 className="size-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this trade?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteTrade(t.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
