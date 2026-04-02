"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
} from "recharts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const fmtTooltipPct = (v: any) => `${typeof v === "number" ? v.toFixed(1) : v}%`;
const fmtTooltipPctInt = (v: any) => `${v}%`;
const fmtTooltipNum = (v: any) => typeof v === "number" ? v.toLocaleString() : v;
/* eslint-enable @typescript-eslint/no-explicit-any */
import {
  monthlySnapshots, funnelData, cohortData, postBuyBehavior,
  tradingStyleBySegment, tradingStyleTrend, orderPaths, entryPoints,
  healthMetrics, segmentInsights, conversionTrend,
  avgRetentionCurve, avgSegRetentionCurve,
} from "@/lib/mockData";
import type { TradingStyle } from "@/lib/types";

// ── Constants ──
const SEG_COLORS: Record<string, string> = {
  newFirst: "#10b981", newDomToIntl: "#047857",
  returning: "#2563eb", resurrecting: "#d97706",
};
const SEG_LABELS: Record<string, string> = {
  newFirst: "최초신규_해외첫거래", newDomToIntl: "기존고객_해외첫거래",
  returning: "Returning", resurrecting: "Resurrecting",
};
const STYLE_COLORS: Record<TradingStyle, string> = {
  daily: "#7c3aed", swing: "#0284c7", occasional: "#78818f",
};
const STYLE_LABELS: Record<TradingStyle, string> = {
  daily: "데일리", swing: "스윙", occasional: "가끔",
};
const PATH_COLORS: Record<string, string> = { pathA: "#0ea5e9", pathB: "#8b5cf6", pathC: "#f59e0b", pathD: "#ef4444" };
const PATH_LABELS: Record<string, string> = {
  pathA: "현재가 조회", pathB: "관심종목", pathC: "잔고·손익", pathD: "퀵버튼",
};
const ENTRY_COLORS: Record<string, string> = {
  priceView: "#0ea5e9", watchlist: "#8b5cf6", portfolio: "#f59e0b", quickOrder: "#ef4444",
};
const ENTRY_LABELS: Record<string, string> = {
  priceView: "현재가 조회", watchlist: "관심종목", portfolio: "잔고/손익", quickOrder: "퀵버튼",
};

// ── Helpers ──
function fmt(n: number): string { return n.toLocaleString(); }
function pct(a: number, b: number): string {
  const d = ((a - b) / b * 100).toFixed(1);
  return Number(d) >= 0 ? `+${d}%` : `${d}%`;
}
function retColor(v: number | null): string {
  if (v === null) return "bg-slate-50 text-slate-300";
  if (v >= 80) return "bg-blue-700 text-white";
  if (v >= 60) return "bg-blue-500 text-white";
  if (v >= 40) return "bg-blue-300 text-blue-950";
  if (v >= 25) return "bg-blue-100 text-blue-800";
  if (v >= 10) return "bg-slate-100 text-slate-600";
  return "bg-slate-50 text-slate-400";
}

// ── Shared Components ──

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 shadow-card ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-bold text-ink">{children}</h2>
      {sub && <p className="text-xs text-ink-tertiary mt-0.5">{sub}</p>}
    </div>
  );
}

function Pill({ active, color, onClick, children }: {
  active: boolean; color?: string; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className="px-3 py-2 rounded-lg text-xs font-medium transition-all min-h-[36px]"
      style={active
        ? { backgroundColor: color ?? "#0f172a", color: "white" }
        : { backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b" }}>
      {children}
    </button>
  );
}

function MiniSparkline({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={height} className="inline-block">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendBadge({ value }: { value: string }) {
  const isPositive = value.startsWith("+");
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
      <span>{isPositive ? "\u25B2" : "\u25BC"}</span>{value}
    </span>
  );
}

// ════════════════════════════════════════════
// TAB 0: Executive Summary
// ════════════════════════════════════════════

function ExecSummaryTab() {
  const cur = monthlySnapshots[monthlySnapshots.length - 1];
  const prev = monthlySnapshots[monthlySnapshots.length - 2];
  const convRate = (cur.traders.total / cur.visitors.total * 100).toFixed(1);
  const convPrev = (prev.traders.total / prev.visitors.total * 100).toFixed(1);

  // Sparkline data for each KPI
  const visitorSpark = monthlySnapshots.map(s => s.visitors.total);
  const traderSpark = monthlySnapshots.map(s => s.traders.total);
  const convSpark = monthlySnapshots.map(s => s.traders.total / s.visitors.total * 100);
  const returningSpark = monthlySnapshots.map(s => s.traders.returning / s.traders.total * 100);

  return (
    <div className="space-y-6 animate-fade">
      {/* Hero KPIs with Sparklines */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "앱 방문자 (MAU)", value: fmt(cur.visitors.total), trend: pct(cur.visitors.total, prev.visitors.total), spark: visitorSpark, color: "#64748b" },
          { title: "거래고객수", value: fmt(cur.traders.total), trend: pct(cur.traders.total, prev.traders.total), spark: traderSpark, color: "#1B4FD8" },
          { title: "방문→거래 전환율", value: `${convRate}%`, trend: pct(Number(convRate), Number(convPrev)), spark: convSpark, color: "#10b981" },
          { title: "Returning 비중", value: `${(cur.traders.returning / cur.traders.total * 100).toFixed(1)}%`, trend: pct(cur.traders.returning / cur.traders.total, prev.traders.returning / prev.traders.total), spark: returningSpark, color: "#2563eb" },
        ].map((kpi, i) => (
          <SectionCard key={i} className="p-4">
            <p className="text-xs text-ink-tertiary font-medium">{kpi.title}</p>
            <div className="flex items-end justify-between mt-1">
              <div>
                <p className="text-2xl font-extrabold tabular-nums text-ink">{kpi.value}</p>
                <TrendBadge value={kpi.trend} />
              </div>
              <MiniSparkline data={kpi.spark} color={kpi.color} />
            </div>
          </SectionCard>
        ))}
      </div>

      {/* Health Scorecards */}
      <SectionCard className="p-5">
        <SectionTitle sub="주요 지표 건강도 (전월 대비)">종합 인사이트 스코어보드</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {healthMetrics.map((hm, i) => {
            const scoreColor = hm.score >= 60 ? "#10b981" : hm.score >= 40 ? "#f59e0b" : "#ef4444";
            return (
              <div key={i} className="border border-slate-100 rounded-lg p-4 card-interactive">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-ink-secondary">{hm.label}</p>
                  <span className="text-lg font-extrabold tabular-nums" style={{ color: scoreColor }}>
                    {typeof hm.score === "number" && hm.score < 1 ? hm.score : hm.score}
                    {hm.label.includes("전환율") || hm.label.includes("리텐션") || hm.label.includes("비중") ? "%" : ""}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(hm.score, 100)}%`, backgroundColor: scoreColor }} />
                </div>
                <p className="text-xs text-ink-tertiary leading-relaxed">{hm.insight}</p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Segment Deep-Dive Cards */}
      <SectionCard className="p-5">
        <SectionTitle sub="세그먼트별 기회·리스크·액션">세그먼트 전략 맵</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {segmentInsights.map((si) => (
            <div key={si.segment} className="border rounded-lg p-4 card-interactive" style={{ borderColor: si.color + "40" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: si.color }} />
                <span className="text-sm font-bold" style={{ color: si.color }}>{si.label}</span>
              </div>
              {/* Mini metrics row */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: "전환율", value: `${si.metrics.conversionRate}%` },
                  { label: "M+3 리텐션", value: `${si.metrics.retentionM3}%` },
                  { label: "월평균 거래", value: `${si.metrics.avgTradesPerMonth}회` },
                  { label: "LTV 지수", value: `${si.metrics.ltv}` },
                ].map((m, j) => (
                  <div key={j} className="text-center">
                    <p className="text-[10px] text-ink-tertiary">{m.label}</p>
                    <p className="text-sm font-bold text-ink">{m.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 text-xs">
                <p><span className="font-semibold text-emerald-600">기회:</span> <span className="text-ink-secondary">{si.opportunity}</span></p>
                <p><span className="font-semibold text-red-500">리스크:</span> <span className="text-ink-secondary">{si.risk}</span></p>
                <p className="bg-blue-50 rounded px-2 py-1.5 text-brand font-medium mt-2">
                  Action: {si.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Conversion Rate Trend */}
      <SectionCard className="p-5">
        <SectionTitle sub="세그먼트별 방문→거래 전환율 13개월 추이">전환율 트렌드</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={conversionTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" />
            <Tooltip formatter={fmtTooltipPct} />
            <Legend />
            <Line type="monotone" dataKey="visitorToTrader" name="전체" stroke="#6366f1" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="returningConv" name="Returning" stroke="#2563eb" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="resurrectingConv" name="Resurrecting" stroke="#d97706" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>
  );
}

// ════════════════════════════════════════════
// TAB 1: MAU 세그먼트
// ════════════════════════════════════════════

function MAUTab() {
  const cur = monthlySnapshots[monthlySnapshots.length - 1];
  const prev = monthlySnapshots[monthlySnapshots.length - 2];
  const data = cur.traders;

  const chartData = monthlySnapshots.map((s) => ({
    name: s.label,
    "최초신규_해외첫거래": s.traders.newFirst,
    "기존고객_해외첫거래": s.traders.newDomToIntl,
    Returning: s.traders.returning,
    Resurrecting: s.traders.resurrecting,
  }));

  return (
    <div className="space-y-6 animate-fade">
      {/* Segment KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { key: "newFirst" as const, label: "최초신규_해외첫거래", val: data.newFirst, prevVal: prev.traders.newFirst },
          { key: "newDomToIntl" as const, label: "기존고객_해외첫거래", val: data.newDomToIntl, prevVal: prev.traders.newDomToIntl },
          { key: "returning" as const, label: "Returning", val: data.returning, prevVal: prev.traders.returning },
          { key: "resurrecting" as const, label: "Resurrecting", val: data.resurrecting, prevVal: prev.traders.resurrecting },
        ]).map((item) => (
          <SectionCard key={item.key} className="p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEG_COLORS[item.key] }} />
              <p className="text-xs text-ink-tertiary font-medium">{item.label}</p>
            </div>
            <p className="text-xl font-bold tabular-nums" style={{ color: SEG_COLORS[item.key] }}>{fmt(item.val)}</p>
            <div className="flex items-center justify-between mt-1">
              <TrendBadge value={pct(item.val, item.prevVal)} />
              <MiniSparkline data={monthlySnapshots.map(s => s.traders[item.key])} color={SEG_COLORS[item.key]} height={24} />
            </div>
          </SectionCard>
        ))}
      </div>

      {/* Stacked bar chart */}
      <SectionCard className="p-5">
        <SectionTitle sub="해외주식 거래고객 기준">월별 MAU 세그먼트 추이</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
            <Tooltip formatter={fmtTooltipNum} />
            <Legend />
            <Bar dataKey="최초신규_해외첫거래" stackId="a" fill={SEG_COLORS.newFirst} />
            <Bar dataKey="기존고객_해외첫거래" stackId="a" fill={SEG_COLORS.newDomToIntl} />
            <Bar dataKey="Returning" stackId="a" fill={SEG_COLORS.returning} />
            <Bar dataKey="Resurrecting" stackId="a" fill={SEG_COLORS.resurrecting} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Segment ratio trend */}
      <SectionCard className="p-5">
        <SectionTitle>세그먼트 비율 추이 (%)</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={monthlySnapshots.map((s) => ({
              name: s.label,
              "최초신규": +(s.traders.newFirst / s.traders.total * 100).toFixed(1),
              "국내→해외": +(s.traders.newDomToIntl / s.traders.total * 100).toFixed(1),
              Returning: +(s.traders.returning / s.traders.total * 100).toFixed(1),
              Resurrecting: +(s.traders.resurrecting / s.traders.total * 100).toFixed(1),
            }))}
            margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" />
            <Tooltip formatter={fmtTooltipPctInt} />
            <Legend />
            <Line type="monotone" dataKey="최초신규" stroke={SEG_COLORS.newFirst} dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="국내→해외" stroke={SEG_COLORS.newDomToIntl} dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="Returning" stroke={SEG_COLORS.returning} dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="Resurrecting" stroke={SEG_COLORS.resurrecting} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Segment definitions */}
      <SectionCard className="p-4">
        <p className="text-xs font-semibold text-ink-secondary mb-2">세그먼트 정의</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-ink-secondary">
          <p><span className="font-medium" style={{ color: SEG_COLORS.newFirst }}>최초신규_해외첫거래</span> — 앱 가입 후 해외주식 첫 거래</p>
          <p><span className="font-medium" style={{ color: SEG_COLORS.newDomToIntl }}>기존고객_해외첫거래</span> — 국내주식만 거래 후 해외 첫 거래</p>
          <p><span className="font-medium" style={{ color: SEG_COLORS.returning }}>Returning</span> — 최근 활동 1~90일 이내 재방문</p>
          <p><span className="font-medium" style={{ color: SEG_COLORS.resurrecting }}>Resurrecting</span> — 90일 초과 후 재방문</p>
        </div>
      </SectionCard>
    </div>
  );
}

// ════════════════════════════════════════════
// TAB 2: 퍼널 분석
// ════════════════════════════════════════════

function FunnelTab() {
  const [activeSegIdx, setActiveSegIdx] = useState(0);
  const selected = funnelData[activeSegIdx];
  const segKey = selected.segment as keyof typeof orderPaths;
  const paths = orderPaths[segKey] ?? orderPaths.all;
  const ep = entryPoints[segKey] ?? entryPoints.all;
  const [visit, , orderScreen, orderExec] = selected.steps;

  return (
    <div className="space-y-6 animate-fade">
      {/* 경로 구조 안내 */}
      <SectionCard className="p-4 bg-blue-50/40 border-blue-200/50">
        <p className="text-xs font-bold text-brand-navy mb-2">퍼널 경로 구조 — 모든 경로는 반드시 해외주식 주문화면을 거침</p>
        <div className="space-y-1 text-xs text-brand">
          {(["pathA", "pathB", "pathC", "pathD"] as const).map((pk) => (
            <p key={pk} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PATH_COLORS[pk] }} />
              경로 {pk.slice(-1)}: {PATH_LABELS[pk]} → 주문화면 → 주문실행
            </p>
          ))}
        </div>
      </SectionCard>

      {/* 퍼널 유형 안내 (로드맵) */}
      <SectionCard className="p-4 bg-amber-50/40 border-amber-200/50">
        <p className="text-xs font-bold text-amber-900 mb-2">퍼널 분석 로드맵</p>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500 text-white flex-shrink-0">LIVE</span>
            <p className="text-xs text-amber-800"><strong>화면 퍼널</strong> — 앱 방문 → 진입 경로 → 주문화면 → 주문 실행</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand text-white flex-shrink-0">SOON</span>
            <p className="text-xs text-amber-800"><strong>주문화면 내 퍼널</strong> — 종목 선택 → 수량 입력 → 주문 확인 등 세부 단계 분석</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand text-white flex-shrink-0">SOON</span>
            <p className="text-xs text-amber-800"><strong>CJS 고객여정 퍼널</strong> — 앱 방문 → 관심종목 등록 → 주문화면 → 주문 실행 등 대표 시퀀스</p>
          </div>
        </div>
      </SectionCard>

      {/* Segment selector */}
      <div className="flex flex-wrap gap-2">
        {funnelData.map((f, i) => (
          <Pill key={f.segment} active={activeSegIdx === i} color={f.color} onClick={() => setActiveSegIdx(i)}>
            {f.label}
          </Pill>
        ))}
      </div>

      {/* Funnel visualization */}
      <SectionCard className="p-6">
        <SectionTitle sub={`방문자 ${fmt(visit.count)}명 기준`}>
          퍼널 — <span style={{ color: selected.color }}>{selected.label}</span>
        </SectionTitle>

        {/* Step 1: 앱 방문 */}
        <div className="border-2 rounded-lg p-4 mb-2" style={{ borderColor: selected.color }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full text-xs flex items-center justify-center text-white font-bold" style={{ backgroundColor: selected.color }}>1</span>
              <span className="text-sm font-semibold text-ink">앱 방문</span>
            </div>
            <span className="text-lg font-bold text-ink">{fmt(visit.count)}명</span>
          </div>
        </div>

        <div className="text-center py-1 text-xs text-ink-faint">↓ 4가지 진입 경로</div>

        {/* Step 2: Entry points */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          {(["priceView", "watchlist", "portfolio", "quickOrder"] as const).map((k, idx) => {
            const cnt = ep[k];
            const rate = Math.round(cnt / visit.count * 1000) / 10;
            return (
              <div key={k} className="border rounded-lg p-3" style={{ borderColor: ENTRY_COLORS[k] + "80" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white font-bold" style={{ backgroundColor: ENTRY_COLORS[k] }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-[11px] font-semibold text-ink-secondary">{ENTRY_LABELS[k]}</span>
                </div>
                <p className="text-base font-bold text-ink">{fmt(cnt)}</p>
                <p className="text-[10px] font-medium" style={{ color: ENTRY_COLORS[k] }}>{rate}%</p>
              </div>
            );
          })}
        </div>

        <div className="text-center py-1 text-xs text-ink-faint">↓ 주문화면 수렴</div>

        {/* Step 3: Order screen */}
        <div className="border rounded-lg p-4 mb-2 border-purple-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full text-xs flex items-center justify-center text-white font-bold bg-purple-500">3</span>
              <div>
                <span className="text-sm font-semibold text-ink">주문화면</span>
                <span className="text-[10px] text-ink-tertiary ml-2">필수 경유</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-ink">{fmt(orderScreen.count)}명</span>
              <span className="text-xs text-ink-tertiary ml-2">{orderScreen.rateFromTop}%</span>
            </div>
          </div>
        </div>

        <div className="text-center py-1 text-xs text-ink-faint">↓</div>

        {/* Step 4: Order execution - highlighted */}
        <div className="border-2 rounded-lg p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50" style={{ borderColor: selected.color }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full text-xs flex items-center justify-center text-white font-bold" style={{ backgroundColor: selected.color }}>4</span>
              <span className="text-sm font-bold text-ink">주문 실행</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold" style={{ color: selected.color }}>{fmt(orderExec.count)}명</p>
              <p className="text-xs text-ink-secondary">방문자의 <strong>{orderExec.rateFromTop}%</strong></p>
            </div>
          </div>
        </div>

        {/* Path distribution */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-ink-secondary mb-3">주문 {fmt(orderExec.count)}명의 진입 경로 분포</p>
          <div className="flex h-8 rounded-lg overflow-hidden mb-3">
            {(["pathA", "pathB", "pathC", "pathD"] as const).map((pk) => (
              <div key={pk} className="h-full flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${paths[pk]}%`, backgroundColor: PATH_COLORS[pk] }}>
                {paths[pk] >= 10 && `${paths[pk]}%`}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["pathA", "pathB", "pathC", "pathD"] as const).map((pk) => (
              <div key={pk} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PATH_COLORS[pk] }} />
                <span className="text-ink-secondary">{PATH_LABELS[pk]}</span>
                <span className="font-bold text-ink ml-auto">{paths[pk]}%</span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Segment comparison table */}
      <SectionCard className="p-5 overflow-x-auto scroll-hint">
        <SectionTitle>세그먼트별 전환율 비교</SectionTitle>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 pr-3 text-ink-tertiary font-medium">단계</th>
              {funnelData.map((f) => (
                <th key={f.segment} className="py-2 px-2 text-center font-semibold" style={{ color: f.color }}>{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-50">
              <td className="py-2 pr-3 text-ink-secondary">앱 방문</td>
              {funnelData.map((f) => (
                <td key={f.segment} className="py-2 px-2 text-center font-semibold text-ink">{fmt(f.steps[0].count)}</td>
              ))}
            </tr>
            {/* 진입 경로 A/B/C/D */}
            {(["priceView", "watchlist", "portfolio", "quickOrder"] as const).map((k, idx) => (
              <tr key={k} className="border-b border-slate-50">
                <td className="py-2 pr-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: ENTRY_COLORS[k] }}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-ink-secondary">{ENTRY_LABELS[k]}</span>
                  </span>
                </td>
                {funnelData.map((f) => {
                  const sKey = f.segment as keyof typeof entryPoints;
                  const cnt = entryPoints[sKey][k];
                  const rate = Math.round(cnt / f.steps[0].count * 1000) / 10;
                  return (
                    <td key={f.segment} className="py-2 px-2 text-center">
                      <div className="font-semibold text-ink">{fmt(cnt)}</div>
                      <div className="text-ink-faint">{rate}%</div>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-b border-slate-50">
              <td className="py-2 pr-3 text-ink-secondary">주문화면</td>
              {funnelData.map((f) => (
                <td key={f.segment} className="py-2 px-2 text-center">
                  <div className="font-semibold text-ink">{fmt(f.steps[2].count)}</div>
                  <div className="text-ink-faint">{f.steps[2].rateFromTop}%</div>
                </td>
              ))}
            </tr>
            <tr className="border-b border-slate-50">
              <td className="py-2 pr-3 text-ink-secondary">주문 실행</td>
              {funnelData.map((f) => (
                <td key={f.segment} className="py-2 px-2 text-center">
                  <div className="font-semibold text-ink">{fmt(f.steps[3].count)}</div>
                  <div className="text-ink-faint">{f.steps[3].rateFromTop}%</div>
                </td>
              ))}
            </tr>
            <tr className="bg-slate-50/50 font-bold">
              <td className="py-2 pr-3 text-ink">최종 전환율</td>
              {funnelData.map((f) => (
                <td key={f.segment} className="py-2 px-2 text-center text-base" style={{ color: f.color }}>
                  {f.steps[3].rateFromTop}%
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </SectionCard>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { seg: "newFirst", title: "최초신규 전환율 3.8%", text: "퀵버튼(22%) 의존 높음. 온보딩에서 현재가 조회→관심종목 등록 유도 시 전환율 개선 가능." },
          { seg: "newDomToIntl", title: "국내→해외 전환율 27%", text: "신규 중 최고. 국내 앱 숙련도 덕분에 정규 경로(51%) 비중 높음. 크로스셀 최적 타겟." },
          { seg: "returning", title: "Returning 전환율 15.1%", text: "경로A(67%) 지배적. 동선 최적화 효과 큼. 개인화 추천으로 추가 상승 여지." },
          { seg: "resurrecting", title: "Resurrecting 전환율 14%", text: "퀵버튼(18%) 비중 상대적 높음. 복귀 시 즉시 매수 의향 — 리타겟팅 ROI 양호." },
        ].map(({ seg, title, text }) => (
          <SectionCard key={seg} className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEG_COLORS[seg] }} />
              <span className="text-xs font-bold" style={{ color: SEG_COLORS[seg] }}>{title}</span>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">{text}</p>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// TAB 3: 코호트 & 리텐션
// ════════════════════════════════════════════

type SegmentFilter = "all" | "newFirst" | "newDomToIntl" | "returning" | "resurrecting";

function CohortTab() {

  const [segFilter, setSegFilter] = useState<SegmentFilter>("all");
  const [styleFilter, setStyleFilter] = useState<TradingStyle | "all">("all");
  const [showBehavior, setShowBehavior] = useState(false);

  function getRetention(row: (typeof cohortData)[0]): (number | null)[] {
    if (segFilter !== "all") return row.segmentRetention[segFilter];
    if (styleFilter !== "all") return row.styleRetention[styleFilter];
    return row.tradeRetention;
  }

  return (
    <div className="space-y-6 animate-fade">

      {/* 트레이딩 스타일 분류 기준 */}
      <SectionCard className="p-4 bg-slate-50/80">
        <p className="text-xs font-bold text-ink mb-3">트레이딩 스타일 분류 기준 (30일 기준)</p>
        <div className="grid grid-cols-3 gap-3">
          {([
            { style: "daily" as const, desc: "월 15일 이상 거래일 — 단기 차익 추구, 높은 활성도" },
            { style: "swing" as const, desc: "월 3~14일 거래 — 수일~수주 보유 후 매도" },
            { style: "occasional" as const, desc: "월 1~2일 거래 — 테마/이슈 발생 시 간헐적 거래" },
          ]).map(({ style, desc }) => (
            <div key={style} className="text-xs text-ink-secondary space-y-1">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STYLE_COLORS[style] }} />
                <span className="font-semibold" style={{ color: STYLE_COLORS[style] }}>{STYLE_LABELS[style]} 트레이딩</span>
              </div>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Average Retention Curve - NEW in dash2 */}
      <SectionCard className="p-5">
        <SectionTitle sub="전체 코호트 평균 (트레이딩 스타일별)">리텐션 커브 비교</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={avgRetentionCurve} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
            <Tooltip formatter={fmtTooltipPctInt} />
            <Legend />
            <Line type="monotone" dataKey="전체" stroke="#64748b" strokeWidth={2.5} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="데일리" stroke={STYLE_COLORS.daily} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="스윙" stroke={STYLE_COLORS.swing} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="가끔" stroke={STYLE_COLORS.occasional} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-3 bg-amber-50 rounded-lg p-3 text-xs text-amber-800">
          <strong>핵심:</strong> 데일리 트레이더는 M+6에서 43%를 유지하는 반면, 가끔 트레이더는 17%로 급락. 첫 거래 후 30일 내 거래 빈도를 높이는 것이 LTV 핵심 레버.
        </div>
      </SectionCard>

      {/* Segment Retention Curve - NEW in dash2 */}
      <SectionCard className="p-5">
        <SectionTitle sub="유입 세그먼트별 평균 거래 리텐션">세그먼트별 리텐션 커브</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={avgSegRetentionCurve} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
            <Tooltip formatter={fmtTooltipPctInt} />
            <Legend />
            <Line type="monotone" dataKey="최초신규" stroke={SEG_COLORS.newFirst} strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="국내→해외" stroke={SEG_COLORS.newDomToIntl} strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="Returning" stroke={SEG_COLORS.returning} strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="Resurrecting" stroke={SEG_COLORS.resurrecting} strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          {([
            { label: "최초신규", color: SEG_COLORS.newFirst, m1: 42, m6: 16 },
            { label: "국내→해외", color: SEG_COLORS.newDomToIntl, m1: 62, m6: 36 },
            { label: "Returning", color: SEG_COLORS.returning, m1: 72, m6: 46 },
            { label: "Resurrecting", color: SEG_COLORS.resurrecting, m1: 55, m6: 25 },
          ]).map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-lg p-2.5 text-center">
              <p className="text-[10px] font-medium" style={{ color: s.color }}>{s.label}</p>
              <p className="text-sm font-bold text-ink">M+1: {s.m1}%</p>
              <p className="text-xs text-ink-tertiary">M+6: {s.m6}%</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Trading style composition */}
      <SectionCard className="p-5">
        <SectionTitle>세그먼트별 트레이딩 스타일 구성</SectionTitle>
        <div className="space-y-3">
          {(["newFirst", "newDomToIntl", "returning", "resurrecting"] as const).map((seg) => {
            const d = tradingStyleBySegment[seg];
            return (
              <div key={seg} className="flex items-center gap-3">
                <div className="w-24 text-xs font-medium" style={{ color: SEG_COLORS[seg] }}>{SEG_LABELS[seg]}</div>
                <div className="flex-1 h-7 flex rounded-lg overflow-hidden">
                  {(["daily", "swing", "occasional"] as TradingStyle[]).map((st) => (
                    <div key={st} className="h-full flex items-center justify-center text-[10px] text-white font-medium"
                      style={{ width: `${d[st]}%`, backgroundColor: STYLE_COLORS[st] }}>
                      {d[st] >= 10 && `${d[st]}%`}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="flex gap-4 pt-1">
            {(["daily", "swing", "occasional"] as TradingStyle[]).map((st) => (
              <div key={st} className="flex items-center gap-1 text-[10px] text-ink-tertiary">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STYLE_COLORS[st] }} />
                {STYLE_LABELS[st]}
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Trading style trend */}
      <TradingStyleTrendSection />

      {/* Cohort Heatmap Controls */}
      <div className="space-y-2">
        <p className="text-[10px] text-ink-tertiary font-medium">세그먼트 필터</p>
        <div className="flex flex-wrap gap-2">
          {(["all", "newFirst", "newDomToIntl", "returning", "resurrecting"] as SegmentFilter[]).map((sf) => (
            <Pill key={sf} active={segFilter === sf}
              color={sf === "all" ? "#0f172a" : SEG_COLORS[sf]}
              onClick={() => { setSegFilter(sf); setStyleFilter("all"); }}>
              {sf === "all" ? "전체" : SEG_LABELS[sf]}
            </Pill>
          ))}
        </div>
      </div>

      {segFilter === "all" && (
        <div className="space-y-2">
          <p className="text-[10px] text-ink-tertiary font-medium">트레이딩 스타일 필터</p>
          <div className="flex flex-wrap gap-2">
            <Pill active={styleFilter === "all"} onClick={() => setStyleFilter("all")}>전체</Pill>
            {(["daily", "swing", "occasional"] as TradingStyle[]).map((st) => (
              <Pill key={st} active={styleFilter === st} color={STYLE_COLORS[st]} onClick={() => setStyleFilter(st)}>
                {STYLE_LABELS[st]}
              </Pill>
            ))}
          </div>
        </div>
      )}

      {/* Cohort Heatmap */}
      <SectionCard className="p-5 overflow-x-auto scroll-hint">
        <SectionTitle sub="첫 해외주식 거래월 기준 코호트">
          코호트 리텐션 히트맵
          {segFilter !== "all" && (
            <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: SEG_COLORS[segFilter] }}>
              {SEG_LABELS[segFilter]}
            </span>
          )}
          {segFilter === "all" && styleFilter !== "all" && (
            <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: STYLE_COLORS[styleFilter] }}>
              {STYLE_LABELS[styleFilter]}
            </span>
          )}
        </SectionTitle>
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr>
              <th className="text-left pr-3 py-1.5 text-ink-tertiary font-medium whitespace-nowrap">코호트</th>
              <th className="px-2 py-1.5 text-ink-tertiary font-medium whitespace-nowrap">초기</th>
              {Array.from({ length: 13 }, (_, i) => (
                <th key={i} className="px-1.5 py-1.5 text-ink-faint font-medium w-11 text-center">M+{i}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohortData.map((row) => {
              const ret = getRetention(row);
              return (
                <tr key={row.cohortMonth} className="hover:bg-slate-50/50">
                  <td className="pr-3 py-1 text-ink-secondary font-medium whitespace-nowrap">{row.label}</td>
                  <td className="px-2 py-1 text-center text-ink-tertiary tabular-nums">{fmt(row.initialSize)}</td>
                  {Array.from({ length: 13 }, (_, mi) => {
                    const val = ret[mi] ?? null;
                    return (
                      <td key={mi} className={`px-1 py-1 text-center rounded-sm tabular-nums ${retColor(val)}`}>
                        {val !== null ? `${val}%` : "—"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center gap-1.5 mt-4 text-[10px] text-ink-faint">
          <span>낮음</span>
          {["bg-slate-100", "bg-blue-100", "bg-blue-300", "bg-blue-500", "bg-blue-700"].map((c, i) => (
            <span key={i} className={`w-7 h-3 rounded ${c} inline-block`} />
          ))}
          <span>높음</span>
        </div>
      </SectionCard>

      {/* Post-buy behavior */}
      <div>
        <button onClick={() => setShowBehavior(!showBehavior)}
          className="flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-navy min-h-[36px]">
          <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs">
            {showBehavior ? "−" : "+"}
          </span>
          매수 후 익월 행동 분석
        </button>
        {showBehavior && (
          <SectionCard className="p-5 mt-3">
            <SectionTitle sub="해외주식 매수 고객의 익월 행동 비율">매수 후 행동 패턴</SectionTitle>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={postBuyBehavior} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={fmtTooltipPctInt} />
                <Legend />
                <Bar dataKey="addedMore" name="추가 매수" stackId="a" fill="#10b981" />
                <Bar dataKey="held" name="보유 유지" stackId="a" fill="#3b82f6" />
                <Bar dataKey="soldPartial" name="일부 매도" stackId="a" fill="#f59e0b" />
                <Bar dataKey="soldAll" name="전량 매도" stackId="a" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[
                { key: "addedMore", label: "추가 매수", color: "#10b981", val: 25 },
                { key: "held", label: "보유 유지", color: "#3b82f6", val: 36 },
                { key: "soldPartial", label: "일부 매도", color: "#f59e0b", val: 22 },
                { key: "soldAll", label: "전량 매도", color: "#ef4444", val: 17 },
              ].map((item) => (
                <div key={item.key} className="bg-slate-50 rounded-lg p-3 text-center">
                  <span className="inline-block w-2 h-2 rounded-full mb-1" style={{ backgroundColor: item.color }} />
                  <p className="text-xs text-ink-secondary font-medium">{item.label}</p>
                  <p className="text-xl font-bold" style={{ color: item.color }}>{item.val}%</p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      {/* Insights */}
      <SectionCard className="p-5 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border-blue-200/50">
        <p className="text-sm font-bold text-brand-navy mb-3">코호트 분석 핵심 인사이트</p>
        <div className="space-y-2 text-xs text-brand">
          <p><strong>데일리 트레이더</strong> M+6 리텐션 43% (전체 29%의 1.5배) — LTV 최고 세그먼트. 가끔→스윙 전환이 핵심 레버.</p>
          <p><strong>국내→해외 전환</strong> 고객의 M+3 리텐션(46%)이 최초신규(26%)의 1.8배 — 크로스셀이 순수 신규보다 ROI 높음.</p>
          <p><strong>가끔 트레이더</strong> M+1에서 52% 이탈. 첫 거래 후 7일 내 2회차 거래 유도가 리텐션 핵심.</p>
          <p><strong>전량 매도(17%)</strong> 단기 차익 실현자 → 스윙 전환 넛지 전략 고려. 매도 직후 관련 종목 추천.</p>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Trading Style Trend (sub-component) ──

function TradingStyleTrendSection() {
  type TrendSeg = "newFirst" | "newDomToIntl" | "returning" | "resurrecting";
  const [seg, setSeg] = useState<TrendSeg>("newFirst");
  const data = tradingStyleTrend[seg];

  return (
    <SectionCard className="p-5">
      <SectionTitle sub="세그먼트별 데일리/스윙/가끔 비율 변화">트레이딩 스타일 월별 추이</SectionTitle>
      <div className="flex flex-wrap gap-2 mb-4">
        {(["newFirst", "newDomToIntl", "returning", "resurrecting"] as TrendSeg[]).map((s) => (
          <Pill key={s} active={seg === s} color={SEG_COLORS[s]} onClick={() => setSeg(s)}>
            {SEG_LABELS[s]}
          </Pill>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={fmtTooltipPctInt} />
          <Legend />
          <Area type="monotone" dataKey="occasional" name="가끔" stackId="1" fill={STYLE_COLORS.occasional} stroke={STYLE_COLORS.occasional} fillOpacity={0.85} />
          <Area type="monotone" dataKey="swing" name="스윙" stackId="1" fill={STYLE_COLORS.swing} stroke={STYLE_COLORS.swing} fillOpacity={0.85} />
          <Area type="monotone" dataKey="daily" name="데일리" stackId="1" fill={STYLE_COLORS.daily} stroke={STYLE_COLORS.daily} fillOpacity={0.85} />
        </AreaChart>
      </ResponsiveContainer>
    </SectionCard>
  );
}

// ════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════

const TABS = [
  { id: "exec", label: "Executive Summary" },
  { id: "mau", label: "MAU 세그먼트" },
  { id: "funnel", label: "퍼널 분석" },
  { id: "cohort", label: "코호트 & 리텐션" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("exec");
  const cur = monthlySnapshots[monthlySnapshots.length - 1];

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-gradient-to-r from-brand-navy via-[#122e6b] to-[#1a3a7a] text-white px-4 sm:px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-blue-300 font-semibold mb-1">Global Brokerage Dashboard</p>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">해외주식 MAU 인사이트</h1>
              <p className="text-sm text-slate-400 mt-0.5">{cur.label} 기준</p>
            </div>
            <div className="flex gap-5 text-xs text-slate-300">
              <div className="text-center">
                <p className="text-[10px] text-slate-400">방문자</p>
                <p className="text-base font-bold text-white tabular-nums">{fmt(cur.visitors.total)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400">거래고객</p>
                <p className="text-base font-bold text-white tabular-nums">{fmt(cur.traders.total)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400">침투율</p>
                <p className="text-base font-bold text-emerald-400 tabular-nums">{(cur.traders.total / cur.visitors.total * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="bg-white border-b sticky top-0 z-10" aria-label="Dashboard tabs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-[3px] transition-colors
                  ${activeTab === t.id ? "border-brand text-ink" : "border-transparent text-ink-tertiary hover:text-ink-secondary"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        {activeTab === "exec" && <ExecSummaryTab />}
        {activeTab === "mau" && <MAUTab />}
        {activeTab === "funnel" && <FunnelTab />}
        {activeTab === "cohort" && <CohortTab />}
      </main>

      <footer className="text-center text-[10px] text-ink-faint pb-8 pt-4">
        * 본 대시보드는 샘플 데이터 기반입니다. 실제 데이터 연동 후 사용하세요. | v2.0
      </footer>
    </div>
  );
}
