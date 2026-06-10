// Advisor visual primitives: animated grade ring, dimension bars with
// deltas, score-history sparkline, and the typewriter narrative block.

import { useEffect, useRef, useState } from 'react';
import { Dimensions } from './advisorEngine';
import { HistoryPoint, overallScore } from './scoreHistory';

const GRADE_COLOR: Record<string, string> = {
  A: '#2D7E24', B: '#2D7E24', C: '#EA712F', D: '#EA712F', F: '#C70032'
};

const GRADE_VALUE: Record<string, number> = { A: 95, B: 80, C: 60, D: 40, F: 18 };

export function GradeRing({ grade }: { grade: string }) {
  const [sweep, setSweep] = useState(0);
  const target = GRADE_VALUE[grade] ?? 50;
  useEffect(() => {
    setSweep(0);
    const t = setTimeout(() => setSweep(target), 60);
    return () => clearTimeout(t);
  }, [grade, target]);

  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 flex-shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#EEF0F2" strokeWidth="6" />
        <circle
          cx="32" cy="32" r={r} fill="none"
          stroke={GRADE_COLOR[grade] ?? '#0057B8'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * sweep) / 100}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
        style={{ color: GRADE_COLOR[grade] ?? '#0057B8' }}
      >
        {grade}
      </div>
    </div>
  );
}

const DIMENSION_LABELS: { key: keyof Dimensions; label: string }[] = [
  { key: 'resilience', label: 'Resilience' },
  { key: 'security', label: 'Security' },
  { key: 'performance', label: 'Performance' },
  { key: 'cost', label: 'Cost efficiency' }
];

export function DimensionBars({ current, previous }: { current: Dimensions; previous?: Dimensions | null }) {
  return (
    <div className="space-y-1.5">
      {DIMENSION_LABELS.map(({ key, label }) => {
        const value = current[key];
        const delta = previous ? value - previous[key] : 0;
        const barColor = value >= 70 ? 'bg-green-600' : value >= 40 ? 'bg-orange-500' : 'bg-red-600';
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="w-24 text-[11px] text-fw-bodyLight">{label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-fw-wash overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor}`}
                style={{ width: `${value}%`, transition: 'width 700ms ease' }}
              />
            </div>
            <span className="w-7 text-right text-[11px] font-semibold text-fw-heading tabular-nums">{value}</span>
            <span className={`w-8 text-right text-[10px] font-medium tabular-nums ${
              delta > 0 ? 'text-fw-success' : delta < 0 ? 'text-fw-error' : 'text-fw-disabled'
            }`}>
              {delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '·'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function TrendSparkline({ history }: { history: HistoryPoint[] }) {
  if (history.length < 2) return null;
  const points = history.slice(-20).map(h => overallScore(h.dimensions));
  const w = 96;
  const h = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(1, max - min);
  const path = points
    .map((p, i) => `${(i / (points.length - 1)) * w},${h - 3 - ((p - min) / span) * (h - 6)}`)
    .join(' ');
  const improving = points[points.length - 1] >= points[0];
  return (
    <div className="flex items-center gap-1.5" title={`Score trend over the last ${points.length} runs`}>
      <svg width={w} height={h} className="overflow-visible">
        <polyline
          points={path}
          fill="none"
          stroke={improving ? '#2D7E24' : '#C70032'}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle
          cx={w} cy={h - 3 - ((points[points.length - 1] - min) / span) * (h - 6)}
          r="2.5" fill={improving ? '#2D7E24' : '#C70032'}
        />
      </svg>
      <span className={`text-[10px] font-medium ${improving ? 'text-fw-success' : 'text-fw-error'}`}>
        {improving ? 'improving' : 'declining'}
      </span>
    </div>
  );
}

// Typewriter narrative. Reveals ~3 chars per frame; click to finish instantly.
export function NarrativeBlock({ text }: { text: string }) {
  const [shown, setShown] = useState(0);
  const lastText = useRef(text);

  useEffect(() => {
    if (text !== lastText.current) {
      lastText.current = text;
      setShown(0);
    }
    if (shown >= text.length) return;
    const timer = setInterval(() => {
      setShown(s => Math.min(text.length, s + 3));
    }, 16);
    return () => clearInterval(timer);
  }, [text, shown]);

  return (
    <div
      className="text-[13px] leading-relaxed text-fw-body whitespace-pre-line cursor-default"
      onClick={() => setShown(text.length)}
      title={shown < text.length ? 'Click to finish' : undefined}
    >
      {text.slice(0, shown)}
      {shown < text.length && <span className="inline-block w-1.5 h-3.5 bg-fw-link align-middle ml-0.5 animate-pulse" />}
    </div>
  );
}
