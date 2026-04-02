export type UserSegment = "newFirst" | "newDomToIntl" | "returning" | "resurrecting";
export type TradingStyle = "daily" | "swing" | "occasional";
export type ViewMode = "visitor" | "trader";

export interface SegmentCounts {
  total: number;
  new: number;
  newFirst: number;
  newDomToIntl: number;
  returning: number;
  resurrecting: number;
}

export interface MonthlySnapshot {
  month: string;
  label: string;
  visitors: SegmentCounts;
  traders: SegmentCounts;
}

export interface FunnelStep {
  key: string;
  label: string;
  count: number;
  rateFromTop: number;
  rateFromPrev: number;
}

export interface SegmentFunnel {
  segment: UserSegment | "all";
  label: string;
  color: string;
  steps: FunnelStep[];
}

export interface CohortRow {
  cohortMonth: string;
  label: string;
  initialSize: number;
  visitRetention: (number | null)[];
  tradeRetention: (number | null)[];
  styleBreakdown: {
    daily: number;
    swing: number;
    occasional: number;
  };
  styleRetention: {
    daily: (number | null)[];
    swing: (number | null)[];
    occasional: (number | null)[];
  };
  segmentRetention: {
    newFirst: (number | null)[];
    newDomToIntl: (number | null)[];
    returning: (number | null)[];
    resurrecting: (number | null)[];
  };
}

export interface PostBuyBehavior {
  month: string;
  label: string;
  soldAll: number;
  soldPartial: number;
  held: number;
  addedMore: number;
}

// ── dash2 추가 타입 ──

export interface HealthMetric {
  label: string;
  score: number;      // 0-100
  trend: "up" | "down" | "flat";
  delta: number;       // MoM change
  insight: string;
}

export interface SegmentInsight {
  segment: UserSegment;
  label: string;
  color: string;
  opportunity: string;
  risk: string;
  action: string;
  metrics: {
    conversionRate: number;
    retentionM3: number;
    avgTradesPerMonth: number;
    ltv: number;  // relative index 1-100
  };
}

export interface ConversionTrend {
  month: string;
  label: string;
  visitorToTrader: number;
  newFirstConv: number;
  newDomToIntlConv: number;
  returningConv: number;
  resurrectingConv: number;
}
