// Score history - every advisor run appends a point so the header can show
// the grade trend as the user edits. Browser cache, capped, POC-consistent.

import { Assessment, Dimensions, toDimensions } from './advisorEngine';

const KEY = 'cloud-designer:advisor-history';
const CAP = 40;

export interface HistoryPoint {
  at: number;
  grade: Assessment['grade'];
  dimensions: Dimensions;
  monthlyCost: number;
}

export function readHistory(): HistoryPoint[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryPoint[]) : [];
  } catch {
    return [];
  }
}

export function appendHistory(assessment: Assessment): HistoryPoint[] {
  const point: HistoryPoint = {
    at: assessment.generatedAt,
    grade: assessment.grade,
    dimensions: toDimensions(assessment),
    monthlyCost: assessment.monthlyCost
  };
  const history = readHistory();
  const last = history[history.length - 1];
  // Skip no-op points so the sparkline shows movement, not noise
  if (last &&
    last.grade === point.grade &&
    last.monthlyCost === point.monthlyCost &&
    JSON.stringify(last.dimensions) === JSON.stringify(point.dimensions)) {
    return history;
  }
  const next = [...history, point].slice(-CAP);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* ignore */ }
  return next;
}

export function overallScore(d: Dimensions): number {
  return Math.round((d.resilience + d.security + d.performance + d.cost) / 4);
}
