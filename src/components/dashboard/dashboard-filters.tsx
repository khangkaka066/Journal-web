import Link from "next/link";
import type { ReactNode } from "react";
import { Filter, RotateCcw } from "lucide-react";
import type { Instrument } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface DashboardFilters {
  from?: string;
  to?: string;
  instrument?: string;
  session?: string;
  setup?: string;
  strategy?: string;
  mistake?: string;
  rule?: string;
}

export function DashboardFiltersPanel({
  filters,
  instruments,
  setups,
  strategies,
  mistakes,
  rules,
}: {
  filters: DashboardFilters;
  instruments: Instrument[];
  setups: string[];
  strategies: string[];
  mistakes: string[];
  rules: string[];
}) {
  return (
    <form className="rounded-xl border bg-card/75 p-4 shadow-sm" action="/dashboard">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="size-4 text-primary" />
          Dashboard filters
        </div>
        <Button variant="ghost" render={<Link href="/dashboard" />}>
          <RotateCcw className="size-4" />
          Clear
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="From">
          <input
            className="h-8 w-full rounded-lg border bg-background px-2 text-sm"
            type="date"
            name="from"
            defaultValue={filters.from ?? ""}
          />
        </Field>
        <Field label="To">
          <input
            className="h-8 w-full rounded-lg border bg-background px-2 text-sm"
            type="date"
            name="to"
            defaultValue={filters.to ?? ""}
          />
        </Field>
        <Field label="Instrument">
          <select
            className="h-8 w-full rounded-lg border bg-background px-2 text-sm"
            name="instrument"
            defaultValue={filters.instrument ?? ""}
          >
            <option value="">All instruments</option>
            {instruments.map((instrument) => (
              <option key={instrument.id} value={instrument.id}>
                {instrument.symbol}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Session">
          <select
            className="h-8 w-full rounded-lg border bg-background px-2 text-sm"
            name="session"
            defaultValue={filters.session ?? ""}
          >
            <option value="">All sessions</option>
            <option value="asia">Asia</option>
            <option value="london">London</option>
            <option value="new_york">New York</option>
          </select>
        </Field>
        <Field label="Setup">
          <OptionSelect name="setup" value={filters.setup} allLabel="All setups" options={setups} />
        </Field>
        <Field label="Strategy">
          <OptionSelect name="strategy" value={filters.strategy} allLabel="All strategies" options={strategies} />
        </Field>
        <Field label="Mistake">
          <OptionSelect name="mistake" value={filters.mistake} allLabel="All mistakes" options={mistakes} />
        </Field>
        <Field label="Rule break">
          <OptionSelect name="rule" value={filters.rule} allLabel="All rules" options={rules} />
        </Field>
      </div>
      <Button className="mt-4" type="submit">
        Apply filters
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function OptionSelect({
  name,
  value,
  allLabel,
  options,
}: {
  name: string;
  value?: string;
  allLabel: string;
  options: string[];
}) {
  return (
    <select
      className="h-8 w-full rounded-lg border bg-background px-2 text-sm"
      name={name}
      defaultValue={value ?? ""}
    >
      <option value="">{allLabel}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
