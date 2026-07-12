import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarClock,
  CircleDollarSign,
  DatabaseZap,
  Gauge,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OptionFlowInputForm, type OptionFlowInputRecord } from "@/components/option-flow/option-flow-input-form";
import type { DailyOptionFlowReport } from "@/lib/option-flow/report";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OptionFlowRecord {
  id: string;
  report_date: string;
  source: string;
  symbols: string[];
  status: "completed" | "partial" | "failed";
  fetched_at: string;
  report: DailyOptionFlowReport;
  errors: string[];
}

function number(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "n/a";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function money(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "n/a";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function dateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

function biasVariant(bias: string) {
  if (bias === "bullish") return "default" as const;
  if (bias === "bearish") return "destructive" as const;
  return "secondary" as const;
}

export default async function OptionFlowPage() {
  const supabase = await createClient();
  const [{ data, error }, { data: latestInput }] = await Promise.all([
    supabase
      .from("option_flow_reports")
      .select("*")
      .order("report_date", { ascending: false })
      .limit(8),
    supabase
      .from("option_flow_inputs")
      .select("id, symbol, spot_price, raw_text, levels, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const reports = (data ?? []) as OptionFlowRecord[];
  const latest = reports[0];
  const latestReport = latest?.report;
  const optionFlowInput = latestInput as OptionFlowInputRecord | null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card/75 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DatabaseZap className="size-4 text-primary" />
          CBOE delayed chain snapshot
        </div>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Option Flow Report</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Daily 09:00 New York report built from option chain volume, open interest, estimated premium, key strikes,
              and unusual volume. Use it as context for study, not as a standalone prediction.
            </p>
          </div>
          {latest && (
            <Badge variant={latest.status === "failed" ? "destructive" : latest.status === "partial" ? "secondary" : "default"}>
              {latest.status}
            </Badge>
          )}
        </div>
      </div>

      <OptionFlowInputForm latestInput={optionFlowInput} />

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-destructive" />
              Option flow table is not ready
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Run <span className="font-medium text-foreground">supabase/migrations/0006_option_flow_reports.sql</span>,
            then trigger the cron route again.
          </CardContent>
        </Card>
      )}

      {!error && !latest && (
        <div className="rounded-xl border border-dashed bg-card/60 p-12 text-center text-muted-foreground">
          No option flow report yet. The Vercel cron will generate one at 09:00 New York on weekdays.
        </div>
      )}

      {latestReport && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="bg-card/75">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CalendarClock className="size-4 text-primary" />
                  Report time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{latest.report_date}</div>
                <div className="mt-1 text-xs text-muted-foreground">{dateTime(latest.fetched_at)} NY</div>
              </CardContent>
            </Card>
            <Card className="bg-card/75">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Gauge className="size-4 text-primary" />
                  Put/call volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{number(latestReport.aggregate.putCallVolumeRatio)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Puts {number(latestReport.aggregate.putVolume)} / Calls {number(latestReport.aggregate.callVolume)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/75">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CircleDollarSign className="size-4 text-primary" />
                  Premium estimate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{money(latestReport.aggregate.callPremiumEstimate)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Put premium {money(latestReport.aggregate.putPremiumEstimate)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/75">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  {latestReport.aggregate.netPremiumBias === "bearish" ? (
                    <TrendingDown className="size-4 text-destructive" />
                  ) : (
                    <TrendingUp className="size-4 text-primary" />
                  )}
                  Net bias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={biasVariant(latestReport.aggregate.netPremiumBias)}>
                  {latestReport.aggregate.netPremiumBias}
                </Badge>
                <div className="mt-2 text-xs text-muted-foreground">{latestReport.symbols.join(", ")}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="size-4 text-primary" />
                Market notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {latestReport.narrative.map((note) => (
                  <div key={note} className="rounded-lg border bg-background/60 p-3 text-sm leading-6 text-muted-foreground">
                    {note}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="size-4 text-primary" />
                AI Trading Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestReport.aiPlan ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{latestReport.aiPlan.model}</Badge>
                    <Badge variant="outline">{latestReport.aiPlan.knowledgeSource}</Badge>
                    <Badge variant="outline">
                      {latestReport.aiPlan.manualInput.symbol} spot{" "}
                      {number(latestReport.aiPlan.manualInput.spotPrice)}
                    </Badge>
                    <Badge variant="outline">
                      {latestReport.aiPlan.manualInput.levels.length} levels
                    </Badge>
                  </div>
                  <div className="rounded-lg border bg-background/60 p-4 text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                    {latestReport.aiPlan.content}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-background/60 p-4 text-sm text-muted-foreground">
                  AI plan is not available yet. Add <span className="font-medium text-foreground">OPENROUTER_API_KEY</span> in
                  Vercel, then let the next cron run generate a plan.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            {latestReport.summaries.map((summary) => (
              <Card key={summary.symbol} className="bg-card/75">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3 text-base">
                    <span className="flex items-center gap-2">
                      <Activity className="size-4 text-primary" />
                      {summary.symbol}
                    </span>
                    <Badge variant={biasVariant(summary.netPremiumBias)}>{summary.netPremiumBias}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm sm:grid-cols-3">
                    <div className="rounded-lg border bg-background/60 p-3">
                      <div className="text-muted-foreground">Underlying</div>
                      <div className="mt-1 font-medium">{number(summary.underlyingLast)}</div>
                      <div className="text-xs text-muted-foreground">{number(summary.underlyingChangePct)}%</div>
                    </div>
                    <div className="rounded-lg border bg-background/60 p-3">
                      <div className="text-muted-foreground">PCR volume</div>
                      <div className="mt-1 font-medium">{number(summary.putCallVolumeRatio)}</div>
                      <div className="text-xs text-muted-foreground">OI {number(summary.putCallOpenInterestRatio)}</div>
                    </div>
                    <div className="rounded-lg border bg-background/60 p-3">
                      <div className="text-muted-foreground">Avg IV</div>
                      <div className="mt-1 font-medium">{summary.averageIv == null ? "n/a" : `${number(summary.averageIv * 100)}%`}</div>
                      <div className="text-xs text-muted-foreground">{number(summary.totalContracts)} contracts</div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-medium">Top volume contracts</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contract</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Vol</TableHead>
                          <TableHead>OI</TableHead>
                          <TableHead>Mid</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.topVolume.slice(0, 6).map((contract) => (
                          <TableRow key={contract.optionSymbol || `${contract.expiration}-${contract.optionType}-${contract.strike}`}>
                            <TableCell>{contract.expiration} {contract.strike}</TableCell>
                            <TableCell>{contract.optionType}</TableCell>
                            <TableCell>{number(contract.volume)}</TableCell>
                            <TableCell>{number(contract.openInterest)}</TableCell>
                            <TableCell>{number(contract.mid)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-medium">Key strikes</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {summary.keyStrikes.slice(0, 6).map((strike) => (
                        <div key={strike.strike} className="rounded-lg border bg-background/60 p-3 text-sm">
                          <div className="font-medium">{strike.strike}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Call vol {number(strike.callVolume)} / Put vol {number(strike.putVolume)}
                          </div>
                          <div className="text-xs text-muted-foreground">Premium {money(strike.premiumEstimate)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-medium">Unusual volume vs open interest</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contract</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Vol/OI</TableHead>
                          <TableHead>Vol</TableHead>
                          <TableHead>OI</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.unusualVolume.slice(0, 6).map((contract) => (
                          <TableRow key={`unusual-${contract.optionSymbol || `${contract.expiration}-${contract.optionType}-${contract.strike}`}`}>
                            <TableCell>{contract.expiration} {contract.strike}</TableCell>
                            <TableCell>{contract.optionType}</TableCell>
                            <TableCell>{number(contract.volumeToOpenInterest)}</TableCell>
                            <TableCell>{number(contract.volume)}</TableCell>
                            <TableCell>{number(contract.openInterest)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {reports.length > 1 && (
        <Card className="bg-card/75">
          <CardHeader>
            <CardTitle className="text-base">Recent reports</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Symbols</TableHead>
                  <TableHead>Bias</TableHead>
                  <TableHead>PCR</TableHead>
                  <TableHead>Fetched</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.report_date}</TableCell>
                    <TableCell>{record.status}</TableCell>
                    <TableCell>{record.symbols.join(", ")}</TableCell>
                    <TableCell>{record.report?.aggregate?.netPremiumBias ?? "n/a"}</TableCell>
                    <TableCell>{number(record.report?.aggregate?.putCallVolumeRatio)}</TableCell>
                    <TableCell>{dateTime(record.fetched_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {latestReport?.errors && latestReport.errors.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-destructive" />
              Fetch warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {latestReport.errors.map((item) => (
              <div key={item}>{item}</div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
