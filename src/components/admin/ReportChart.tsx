"use client";

import { useState } from "react";
import { ReportRangeSelect, type RangeParams } from "@/components/admin/ReportRangeSelect";
import { formatUsd } from "@/lib/admin/period";
import type { ReportChartData } from "@/lib/admin/report-chart";

/**
 * Daily-tips chart. Changing the range refetches only this chart from
 * `/api/admin/reports/chart` (no page navigation), showing a skeleton in place
 * of the chart while the new data loads — the rest of the reports page stays put.
 */
export function ReportChart({ initial }: { initial: ReportChartData }) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function load(params: RangeParams) {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (params.range) qs.set("range", params.range);
      if (params.from) qs.set("from", params.from);
      if (params.to) qs.set("to", params.to);
      const res = await fetch(`/api/admin/reports/chart?${qs.toString()}`);
      if (!res.ok) throw new Error("chart_failed");
      setData((await res.json()) as ReportChartData);
    } catch {
      // Keep the current chart on failure.
    } finally {
      setLoading(false);
    }
  }

  const { days, maxTotal, dayCount, rangeTotal, rangeCount } = data;

  // Line chart geometry in a 0–100 viewBox (points at each day's column centre).
  const n = days.length;
  const px = (i: number) => ((i + 0.5) / n) * 100;
  const py = (total: number) => 96 - (total / maxTotal) * 90;
  const baseY = py(0).toFixed(2);
  const linePoints = days.map((d, i) => `${px(i).toFixed(2)},${py(d.total).toFixed(2)}`).join(" ");
  const areaPoints = `${px(0).toFixed(2)},${baseY} ${linePoints} ${px(n - 1).toFixed(2)},${baseY}`;
  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((f) => Math.round(maxTotal * f));

  const labelEveryNth = dayCount <= 14 ? 1 : Math.ceil(dayCount / 12);
  const showValues = dayCount <= 10;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-sm font-bold text-neutral-700">日別チップ推移</h2>
        <ReportRangeSelect
          selection={data.selection}
          fromISO={data.fromISO}
          toISO={data.toISO}
          todayISO={data.todayISO}
          onChange={load}
        />
      </div>

      {loading ? (
        <ChartSkeleton />
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-4 flex flex-wrap gap-x-8 gap-y-2 border-b border-neutral-100 pb-4">
            <RangeStat label="期間合計" value={formatUsd(rangeTotal)} accent />
            <RangeStat label="チップ件数" value={`${rangeCount.toLocaleString("ja-JP")} 件`} />
            <RangeStat label="1日平均" value={formatUsd(Math.round(rangeTotal / dayCount))} />
            <RangeStat label="最高日" value={formatUsd(maxTotal)} />
          </div>

          <div className="relative h-56">
            {yTicks.map((t, i) => (
              <div key={i} className="absolute inset-x-0 flex -translate-y-1/2 items-center" style={{ top: `${py(t)}%` }}>
                <span className="w-14 shrink-0 pr-2 text-right text-[10px] tabular-nums text-neutral-400">{t === 0 ? "$0" : formatUsd(t)}</span>
                <span className="h-px flex-1 bg-neutral-100" />
              </div>
            ))}

            <div className="absolute inset-y-0 left-14 right-0">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon points={areaPoints} fill="var(--color-accent)" fillOpacity={0.1} />
                {n > 1 ? (
                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : null}
              </svg>
              {days.map((d, i) => (
                <div
                  key={d.key}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${px(i)}%`, top: `${py(d.total)}%` }}
                  title={`${d.key}（${d.weekday}）: ${formatUsd(d.total)} ・ ${d.count}件`}
                >
                  <span
                    className={`block rounded-full border-2 border-white bg-[var(--color-accent)] ${
                      d.isToday ? "h-3.5 w-3.5" : "h-2.5 w-2.5"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 flex gap-1 border-t border-neutral-100 pt-2">
            <div className="w-14 shrink-0" />
            {days.map((d, i) => (
              <div
                key={d.key}
                className={`min-w-0 flex-1 text-center ${d.isToday ? "font-semibold text-neutral-700" : "text-neutral-400"}`}
              >
                {i % labelEveryNth === 0 ? (
                  <>
                    <p className="text-[10px] leading-tight">{d.key}</p>
                    {showValues ? (
                      <p className="text-[10px] font-medium leading-tight tabular-nums text-neutral-600">
                        {d.count > 0 ? formatUsd(d.total) : "—"}
                      </p>
                    ) : null}
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function RangeStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${accent ? "text-[var(--color-accent)]" : "text-neutral-900"}`}>
        {value}
      </p>
    </div>
  );
}

// A ghost of the real chart — a gentle placeholder line + area over the same
// gridlines and axes — so the range change reads as "this chart is loading".
const GHOST_LINE = "0,64 17,48 33,58 50,30 67,46 83,40 100,56";
const GHOST_AREA = `0,100 ${GHOST_LINE} 100,100`;

/** Pulsing placeholder shown in place of the chart while a new range loads. */
function ChartSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4" aria-hidden="true">
      {/* Sheen sweep across the whole card for a livelier "loading" feel. */}
      <div className="skeleton-sheen pointer-events-none absolute inset-0 z-10" />

      <div className="mb-4 flex flex-wrap gap-x-8 gap-y-3 border-b border-neutral-100 pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-2.5 w-12 rounded-full bg-neutral-100" />
            <div className="h-5 w-20 rounded-md bg-neutral-200/70" />
          </div>
        ))}
      </div>

      <div className="relative h-56 animate-pulse">
        {/* Y gridlines + tick placeholders */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <div key={f} className="absolute inset-x-0 flex -translate-y-1/2 items-center" style={{ top: `${6 + f * 90}%` }}>
            <span className="mr-2 h-2 w-11 shrink-0 rounded-full bg-neutral-100" />
            <span className="h-px flex-1 bg-neutral-100" />
          </div>
        ))}

        {/* Ghost line + area over the plot region */}
        <div className="absolute inset-y-0 left-14 right-0">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points={GHOST_AREA} fill="rgb(245 245 245)" />
            <polyline
              points={GHOST_LINE}
              fill="none"
              stroke="rgb(214 214 214)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* X-axis label placeholders */}
      <div className="mt-2 flex gap-1 border-t border-neutral-100 pt-3">
        <div className="w-14 shrink-0" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-1 justify-center">
            <span className="h-2 w-8 animate-pulse rounded-full bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
