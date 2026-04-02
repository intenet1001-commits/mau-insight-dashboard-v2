import type {
  MonthlySnapshot, SegmentFunnel, CohortRow, PostBuyBehavior,
  HealthMetric, SegmentInsight, ConversionTrend,
} from "./types";

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return `${String(y).slice(2)}년 ${parseInt(m)}월`;
}

// ── 1. MAU 월별 스냅샷 (2025-03 ~ 2026-03) ──

const VISITOR_BASE = [
  1443000, 1478000, 1570000, 1544000, 1620000, 1595000,
  1671000, 1747000, 1823000, 1772000, 1899000, 1924000, 2000000,
];
const TRADER_RATIO = [
  0.120, 0.122, 0.124, 0.123, 0.126, 0.127,
  0.130, 0.132, 0.133, 0.131, 0.135, 0.137, 0.140,
];
const VISITOR_MIX: [number, number, number][] = [
  [0.19, 0.61, 0.20], [0.18, 0.62, 0.20], [0.20, 0.60, 0.20],
  [0.17, 0.63, 0.20], [0.19, 0.62, 0.19], [0.18, 0.63, 0.19],
  [0.17, 0.64, 0.19], [0.18, 0.63, 0.19], [0.19, 0.62, 0.19],
  [0.17, 0.64, 0.19], [0.18, 0.63, 0.19], [0.17, 0.64, 0.19],
  [0.16, 0.65, 0.19],
];
const TRADER_MIX: [number, number, number][] = [
  [0.13, 0.67, 0.20], [0.12, 0.68, 0.20], [0.14, 0.67, 0.19],
  [0.12, 0.68, 0.20], [0.13, 0.68, 0.19], [0.12, 0.69, 0.19],
  [0.12, 0.69, 0.19], [0.13, 0.68, 0.19], [0.14, 0.67, 0.19],
  [0.12, 0.69, 0.19], [0.13, 0.68, 0.19], [0.12, 0.69, 0.19],
  [0.11, 0.70, 0.19],
];
const MONTHS = [
  "2025-03","2025-04","2025-05","2025-06","2025-07","2025-08",
  "2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03",
];
const VISITOR_NEW_SPLIT: [number, number] = [0.75, 0.25];
const TRADER_NEW_SPLIT: [number, number] = [0.35, 0.65];

export const monthlySnapshots: MonthlySnapshot[] = MONTHS.map((m, i) => {
  const vTotal = VISITOR_BASE[i];
  const [vN, vR, vRe] = VISITOR_MIX[i];
  const tTotal = Math.round(vTotal * TRADER_RATIO[i]);
  const [tN, tR, tRe] = TRADER_MIX[i];
  const vNew = Math.round(vTotal * vN);
  const tNew = Math.round(tTotal * tN);
  return {
    month: m, label: monthLabel(m),
    visitors: {
      total: vTotal, new: vNew,
      newFirst: Math.round(vNew * VISITOR_NEW_SPLIT[0]),
      newDomToIntl: Math.round(vNew * VISITOR_NEW_SPLIT[1]),
      returning: Math.round(vTotal * vR),
      resurrecting: Math.round(vTotal * vRe),
    },
    traders: {
      total: tTotal, new: tNew,
      newFirst: Math.round(tNew * TRADER_NEW_SPLIT[0]),
      newDomToIntl: Math.round(tNew * TRADER_NEW_SPLIT[1]),
      returning: Math.round(tTotal * tR),
      resurrecting: Math.round(tTotal * tRe),
    },
  };
});

// ── 2. 퍼널 분석 ──

const currentMonth = monthlySnapshots[monthlySnapshots.length - 1];

function buildFunnel(
  label: string, color: string,
  segment: "all" | "newFirst" | "newDomToIntl" | "returning" | "resurrecting",
  visitCount: number, rates: [number, number, number]
): SegmentFunnel {
  const counts = [
    visitCount,
    Math.round(visitCount * rates[0]),
    Math.round(visitCount * rates[1]),
    Math.round(visitCount * rates[2]),
  ];
  const labels = ["앱 방문", "해외주식 현재가 조회", "해외주식 주문화면", "주문 실행"];
  return {
    segment, label, color,
    steps: counts.map((c, idx) => ({
      key: ["visit", "price_view", "order_screen", "order_exec"][idx],
      label: labels[idx], count: c,
      rateFromTop: idx === 0 ? 100 : Math.round((c / counts[0]) * 1000) / 10,
      rateFromPrev: idx === 0 ? 100 : Math.round((c / counts[idx - 1]) * 1000) / 10,
    })),
  };
}

const v = currentMonth.visitors;

export const funnelData: SegmentFunnel[] = [
  buildFunnel("전체", "#6366f1", "all", v.total, [0.55, 0.32, 0.140]),
  buildFunnel("최초신규_해외첫거래", "#10b981", "newFirst", v.newFirst, [0.18, 0.08, 0.038]),
  buildFunnel("기존고객_해외첫거래", "#059669", "newDomToIntl", v.newDomToIntl, [0.52, 0.38, 0.270]),
  buildFunnel("Returning", "#3b82f6", "returning", v.returning, [0.65, 0.38, 0.151]),
  buildFunnel("Resurrecting", "#f59e0b", "resurrecting", v.resurrecting, [0.40, 0.22, 0.140]),
];

export const entryPoints: Record<
  "all" | "newFirst" | "newDomToIntl" | "returning" | "resurrecting",
  { priceView: number; watchlist: number; portfolio: number; quickOrder: number }
> = {
  all:          { priceView: Math.round(v.total * 0.55), watchlist: Math.round(v.total * 0.31), portfolio: Math.round(v.total * 0.18), quickOrder: Math.round(v.total * 0.09) },
  newFirst:     { priceView: Math.round(v.newFirst * 0.18), watchlist: Math.round(v.newFirst * 0.25), portfolio: Math.round(v.newFirst * 0.08), quickOrder: Math.round(v.newFirst * 0.04) },
  newDomToIntl: { priceView: Math.round(v.newDomToIntl * 0.52), watchlist: Math.round(v.newDomToIntl * 0.38), portfolio: Math.round(v.newDomToIntl * 0.22), quickOrder: Math.round(v.newDomToIntl * 0.15) },
  returning:    { priceView: Math.round(v.returning * 0.65), watchlist: Math.round(v.returning * 0.35), portfolio: Math.round(v.returning * 0.24), quickOrder: Math.round(v.returning * 0.12) },
  resurrecting: { priceView: Math.round(v.resurrecting * 0.40), watchlist: Math.round(v.resurrecting * 0.28), portfolio: Math.round(v.resurrecting * 0.16), quickOrder: Math.round(v.resurrecting * 0.08) },
};

export const orderPaths: Record<
  "all" | "newFirst" | "newDomToIntl" | "returning" | "resurrecting",
  { pathA: number; pathB: number; pathC: number; pathD: number }
> = {
  all:          { pathA: 63, pathB: 13, pathC:  9, pathD: 15 },
  newFirst:     { pathA: 38, pathB: 22, pathC: 18, pathD: 22 },
  newDomToIntl: { pathA: 51, pathB: 16, pathC: 13, pathD: 20 },
  returning:    { pathA: 67, pathB: 12, pathC:  8, pathD: 13 },
  resurrecting: { pathA: 57, pathB: 13, pathC: 12, pathD: 18 },
};

// ── 3. 코호트 리텐션 ──

const COHORT_MONTHS = MONTHS.slice(0, 12);
const COHORT_SIZES = [26000, 25500, 29500, 24000, 27000, 25500, 26000, 29000, 31500, 26000, 29000, 28000];
const VISIT_RET_BASE = [100, 72, 60, 52, 46, 41, 37, 34, 31, 29, 27, 25, 24];
const TRADE_RET_BASE = [100, 65, 52, 44, 38, 33, 29, 27, 24, 22, 21, 20, 19];
const DAILY_MULT  = [1.0, 1.35, 1.40, 1.43, 1.45, 1.47, 1.48, 1.48, 1.47, 1.46, 1.44, 1.42, 1.40];
const SWING_MULT  = [1.0, 1.10, 1.12, 1.11, 1.10, 1.09, 1.08, 1.07, 1.06, 1.05, 1.04, 1.03, 1.02];
const OCC_MULT    = [1.0, 0.73, 0.68, 0.65, 0.62, 0.60, 0.58, 0.57, 0.56, 0.55, 0.54, 0.53, 0.52];
const SEG_NEW_FIRST_RET    = [100, 42, 32, 26, 21, 18, 16, 14, 13, 12, 11, 10, 10];
const SEG_DOM_TO_INTL_RET  = [100, 62, 52, 46, 42, 39, 36, 34, 32, 31, 30, 29, 28];
const SEG_RETURNING_RET    = [100, 72, 64, 58, 53, 49, 46, 44, 42, 40, 39, 38, 37];
const SEG_RESURRECTING_RET = [100, 55, 44, 37, 32, 28, 25, 23, 21, 20, 19, 18, 17];

export const cohortData: CohortRow[] = COHORT_MONTHS.map((m, ci) => {
  const maxMonths = 13 - ci;
  function trimRet(base: number[], mult: number[]): (number | null)[] {
    return base.map((val, idx) => {
      if (idx >= maxMonths) return null;
      const multiplier = mult.length > 0 ? (mult[idx] ?? 1) : 1;
      return Math.min(100, Math.max(1, Math.round(val * multiplier)));
    });
  }
  return {
    cohortMonth: m, label: monthLabel(m), initialSize: COHORT_SIZES[ci],
    visitRetention: trimRet(VISIT_RET_BASE, []),
    tradeRetention: trimRet(TRADE_RET_BASE, []),
    styleBreakdown: {
      daily: Math.round(COHORT_SIZES[ci] * 0.10),
      swing: Math.round(COHORT_SIZES[ci] * 0.50),
      occasional: Math.round(COHORT_SIZES[ci] * 0.40),
    },
    styleRetention: {
      daily: trimRet(TRADE_RET_BASE, DAILY_MULT),
      swing: trimRet(TRADE_RET_BASE, SWING_MULT),
      occasional: trimRet(TRADE_RET_BASE, OCC_MULT),
    },
    segmentRetention: {
      newFirst: trimRet(SEG_NEW_FIRST_RET, []),
      newDomToIntl: trimRet(SEG_DOM_TO_INTL_RET, []),
      returning: trimRet(SEG_RETURNING_RET, []),
      resurrecting: trimRet(SEG_RESURRECTING_RET, []),
    },
  };
});

// ── 4. 매수 후 행동 분석 ──

export const postBuyBehavior: PostBuyBehavior[] = MONTHS.slice(1).map((m, i) => ({
  month: m, label: monthLabel(m),
  soldAll:     [18, 19, 17, 20, 18, 19, 17, 18, 19, 17, 18, 17][i],
  soldPartial: [22, 21, 23, 21, 22, 21, 22, 23, 22, 23, 22, 22][i],
  held:        [35, 36, 34, 33, 35, 35, 36, 34, 34, 35, 35, 36][i],
  addedMore:   [25, 24, 26, 26, 25, 25, 25, 25, 25, 25, 25, 25][i],
}));

// ── 5. 트레이딩 스타일 ──

export const tradingStyleBySegment = {
  newFirst:     { daily: 3,  swing: 32, occasional: 65 },
  newDomToIntl: { daily: 8,  swing: 48, occasional: 44 },
  returning:    { daily: 14, swing: 55, occasional: 31 },
  resurrecting: { daily: 7,  swing: 44, occasional: 49 },
};

type StyleRow = { month: string; label: string; daily: number; swing: number; occasional: number };
function buildStyleTrend(
  start: { daily: number; swing: number; occasional: number },
  end: { daily: number; swing: number; occasional: number }
): StyleRow[] {
  return MONTHS.map((m, i) => {
    const t = i / (MONTHS.length - 1);
    const daily = Math.round(start.daily + (end.daily - start.daily) * t);
    const swing = Math.round(start.swing + (end.swing - start.swing) * t);
    const occasional = 100 - daily - swing;
    return { month: m, label: monthLabel(m), daily, swing, occasional };
  });
}

export const tradingStyleTrend: Record<
  "newFirst" | "newDomToIntl" | "returning" | "resurrecting", StyleRow[]
> = {
  newFirst:     buildStyleTrend({ daily: 2, swing: 26, occasional: 72 }, { daily: 3, swing: 32, occasional: 65 }),
  newDomToIntl: buildStyleTrend({ daily: 5, swing: 42, occasional: 53 }, { daily: 8, swing: 48, occasional: 44 }),
  returning:    buildStyleTrend({ daily: 11, swing: 51, occasional: 38 }, { daily: 14, swing: 55, occasional: 31 }),
  resurrecting: buildStyleTrend({ daily: 5, swing: 40, occasional: 55 }, { daily: 7, swing: 44, occasional: 49 }),
};

// ══════════════════════════════════════════
// dash2 추가: 인사이트 계산 데이터
// ══════════════════════════════════════���═══

const cur = monthlySnapshots[monthlySnapshots.length - 1];
const prev = monthlySnapshots[monthlySnapshots.length - 2];

function pctChange(a: number, b: number): number {
  return Math.round((a - b) / b * 1000) / 10;
}

// ── 6. Health Metrics (Executive Summary) ──

export const healthMetrics: HealthMetric[] = [
  {
    label: "방문→거래 전환율",
    score: Math.round(cur.traders.total / cur.visitors.total * 100 * 10) / 10,
    trend: cur.traders.total / cur.visitors.total > prev.traders.total / prev.visitors.total ? "up" : "down",
    delta: pctChange(cur.traders.total / cur.visitors.total, prev.traders.total / prev.visitors.total),
    insight: "전환율이 점진 개선 중. Returning 비중 확대가 주요인.",
  },
  {
    label: "신규 유입 품질",
    score: 62,
    trend: "up",
    delta: 2.1,
    insight: "국내→해외 전환 고객(전환율 27%)이 순수 신규(3.8%)보다 7배 양질. 국내 고객 크로스셀에 집중 필요.",
  },
  {
    label: "M+3 거래 리텐션",
    score: 44,
    trend: "flat",
    delta: 0,
    insight: "3개월 시점 리텐션 44%로 안정적. 데일리 트레이더(63%)와 가끔 트레이더(29%) 격차 큼.",
  },
  {
    label: "고가치 고객 비중",
    score: 69,
    trend: "up",
    delta: 1.5,
    insight: "Returning(70%) + 데일리/스윙 트레이더 비중 증가. LTV 상위 20%가 거래량 60% 차지 추정.",
  },
];

// ── 7. Segment Insights (세그먼트별 딥다이브) ──

export const segmentInsights: SegmentInsight[] = [
  {
    segment: "newFirst", label: "최초신규_해외첫거래", color: "#10b981",
    opportunity: "신규 유입 파이프라인의 시작점. 매월 ~10,000명 유입.",
    risk: "M+1 리텐션 42%로 최저. 58%가 첫 달에 이탈.",
    action: "첫 거래 후 7일 이내 푸시 알림 + 인기종목 추천으로 2회차 거래 유도",
    metrics: { conversionRate: 3.8, retentionM3: 26, avgTradesPerMonth: 1.2, ltv: 15 },
  },
  {
    segment: "newDomToIntl", label: "기존고객_해외첫거래", color: "#047857",
    opportunity: "이미 앱 숙련된 고객. 전환율 27%로 신규 중 최고.",
    risk: "국내주식 시장 변동 시 해외주식 관심 저하 가능.",
    action: "국내 고객 대상 해외주식 진입 배너 + 환전 수수료 프로모션으로 전환 가속",
    metrics: { conversionRate: 27.0, retentionM3: 46, avgTradesPerMonth: 3.8, ltv: 55 },
  },
  {
    segment: "returning", label: "Returning", color: "#2563eb",
    opportunity: "핵심 수익 기반. 거래고객의 70%, 전환율 15.1%.",
    risk: "성장 정체 시 자연 이탈률 증가. 경쟁사 유출 리스크.",
    action: "개인화 포트폴리오 리밸런싱 알림 + VIP 수수료 혜택으로 잔류율 강화",
    metrics: { conversionRate: 15.1, retentionM3: 58, avgTradesPerMonth: 6.2, ltv: 82 },
  },
  {
    segment: "resurrecting", label: "Resurrecting", color: "#d97706",
    opportunity: "복귀 고객은 이미 온보딩 비용 0. 매월 ~53,000명.",
    risk: "재이탈 확률 높음 (M+1 55%). 복귀 동기가 일시적일 수 있음.",
    action: "복귀 트리거(앱 재오픈) 감지 시 맞춤 종목 추천 + 이전 보유 종목 현황 알림",
    metrics: { conversionRate: 14.0, retentionM3: 37, avgTradesPerMonth: 2.8, ltv: 35 },
  },
];

// ── 8. Conversion Trend (전환율 추이) ──

export const conversionTrend: ConversionTrend[] = monthlySnapshots.map((s) => ({
  month: s.month,
  label: s.label,
  visitorToTrader: Math.round(s.traders.total / s.visitors.total * 1000) / 10,
  newFirstConv: 3.8 + (Math.random() - 0.5) * 0.4,
  newDomToIntlConv: 27.0 + (Math.random() - 0.5) * 2,
  returningConv: Math.round(s.traders.returning / s.visitors.returning * 1000) / 10,
  resurrectingConv: Math.round(s.traders.resurrecting / s.visitors.resurrecting * 1000) / 10,
}));

// ── 9. 코호트 평균 리텐션 커브 (오버레이용) ──

export const avgRetentionCurve = TRADE_RET_BASE.map((val, i) => ({
  month: `M+${i}`,
  전체: val,
  데일리: Math.min(100, Math.round(val * (DAILY_MULT[i] ?? 1))),
  스윙: Math.min(100, Math.round(val * (SWING_MULT[i] ?? 1))),
  가끔: Math.min(100, Math.round(val * (OCC_MULT[i] ?? 1))),
}));

export const avgSegRetentionCurve = Array.from({ length: 13 }, (_, i) => ({
  month: `M+${i}`,
  최초신규: SEG_NEW_FIRST_RET[i],
  "국내→해외": SEG_DOM_TO_INTL_RET[i],
  Returning: SEG_RETURNING_RET[i],
  Resurrecting: SEG_RESURRECTING_RET[i],
}));
