import { useState } from 'react';

export const CHART_COLORS = ['#1c6b52', '#c56a32', '#2457a6', '#8a6232', '#6d3b4a', '#3e7a6a', '#b0893e'];

const W = 640;
const H = 228;
const PAD = { l: 32, r: 36, t: 12, b: 28 };

export function titleCase(value) {
  return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function dayParts(iso) {
  const [year, month, day] = String(iso).slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return {
    short: String(day),
    full: new Intl.DateTimeFormat('en-OM', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date)
  };
}

export function hourLabel(hour) {
  const value = Number(hour);
  const suffix = value >= 12 ? 'pm' : 'am';
  const hour12 = value % 12 || 12;
  return { short: `${hour12}${suffix[0]}`, full: `${hour12}${suffix}` };
}

function niceMax(value) {
  const peak = Math.max(1, Number(value) || 0);
  if (peak <= 4) return peak + 1;
  return Math.ceil(peak * 1.25);
}

export function ChartCard({ title, note, children }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="font-display text-xl">{title}</h2>
        {note && <div className="text-right text-xs leading-5 text-mute">{note}</div>}
      </div>
      {children}
    </section>
  );
}

function layout(points, max) {
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const slot = innerW / Math.max(points.length, 1);
  return points.map((point, index) => {
    const value = Number(point.value) || 0;
    const x = PAD.l + slot * index + slot / 2;
    const y = PAD.t + innerH - (value / max) * innerH;
    return { ...point, value, x, y, slot, base: PAD.t + innerH };
  });
}

function smooth(coords) {
  if (!coords.length) return '';
  let path = `M${coords[0].x},${coords[0].y}`;
  for (let index = 0; index < coords.length - 1; index += 1) {
    const from = coords[index];
    const to = coords[index + 1];
    const mid = (from.x + to.x) / 2;
    path += ` C${mid},${from.y} ${mid},${to.y} ${to.x},${to.y}`;
  }
  return path;
}

function useActive(coords) {
  const [active, setActive] = useState(null);
  function move(event) {
    if (!coords.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let distance = Infinity;
    coords.forEach((point, index) => {
      const gap = Math.abs(point.x - x);
      if (gap < distance) {
        distance = gap;
        best = index;
      }
    });
    setActive(best);
  }
  return { active, move, leave: () => setActive(null) };
}

function Tip({ coords, active, children }) {
  if (active == null || !coords[active]) return null;
  const point = coords[active];
  const align = point.x > W * 0.72 ? 'translate(-100%, -120%)' : 'translate(-20%, -120%)';
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-2xl bg-moss-deep px-3 py-2 text-xs text-sand shadow-lg"
      style={{ left: `${(point.x / W) * 100}%`, top: `${(point.y / H) * 100}%`, transform: align }}
    >
      <div className="font-medium text-white">{point.full || point.label}</div>
      {children(point)}
    </div>
  );
}

function Axis({ max, format = (value) => String(Math.round(value)) }) {
  const innerH = H - PAD.t - PAD.b;
  const ticks = [...new Set([max, Math.round(max / 2), 0])];
  return ticks.map((tick) => {
    const y = PAD.t + innerH - (max ? (tick / max) * innerH : innerH);
    return (
      <g key={tick}>
        <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="#e4dccf" strokeWidth="1" />
        <text x={4} y={y + 4} fontSize="10" fill="#5d6b64">{format(tick)}</text>
      </g>
    );
  });
}

export function AreaChart({ points, seriesName = 'Visits' }) {
  const max = niceMax(Math.max(0, ...points.map((point) => Number(point.value) || 0)));
  const coords = layout(points, max);
  const line = smooth(coords);
  const area = coords.length ? `${line} L${coords.at(-1).x},${coords[0].base} L${coords[0].x},${coords[0].base} Z` : '';
  const { active, move, leave } = useActive(coords);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full" onMouseMove={move} onMouseLeave={leave} role="img" aria-label={seriesName}>
        <Axis max={max} />
        <path d={area} fill="#1c6b52" opacity="0.16" />
        <path d={line} fill="none" stroke="#1c6b52" strokeWidth="2.5" />
        {coords.map((point, index) => (
          <g key={point.label}>
            {index % 2 === 0 && (
              <text x={point.x} y={H - 6} textAnchor="middle" fontSize="10" fill="#5d6b64">{point.short || point.label}</text>
            )}
            {active === index && <circle cx={point.x} cy={point.y} r="4" fill="#c56a32" />}
          </g>
        ))}
      </svg>
      <Tip coords={coords} active={active}>
        {(point) => <div>{seriesName} {point.value}</div>}
      </Tip>
    </div>
  );
}

export function ComboChart({ points, barName, lineName, formatLine }) {
  const maxBar = niceMax(Math.max(0, ...points.map((point) => Number(point.bar) || 0)));
  const maxLine = niceMax(Math.max(0, ...points.map((point) => Number(point.line) || 0)));
  const innerH = H - PAD.t - PAD.b;
  const coords = layout(points.map((point) => ({ ...point, value: point.bar })), maxBar).map((point, index) => ({
    ...point,
    lineValue: Number(points[index].line) || 0,
    lineY: PAD.t + innerH - ((Number(points[index].line) || 0) / maxLine) * innerH
  }));
  const line = smooth(coords.map((point) => ({ x: point.x, y: point.lineY })));
  const { active, move, leave } = useActive(coords);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full" onMouseMove={move} onMouseLeave={leave} role="img" aria-label={`${barName} and ${lineName}`}>
        <Axis max={maxBar} />
        {coords.map((point, index) => (
          <g key={point.label}>
            <rect
              x={point.x - point.slot * 0.28}
              y={point.base - (point.value / maxBar) * innerH}
              width={point.slot * 0.56}
              height={Math.max((point.value / maxBar) * innerH, point.value ? 2 : 0)}
              rx="4"
              fill={active === index ? '#c56a32' : '#1c6b52'}
            />
            {index % 2 === 0 && (
              <text x={point.x} y={H - 6} textAnchor="middle" fontSize="10" fill="#5d6b64">{point.short || point.label}</text>
            )}
          </g>
        ))}
        <path d={line} fill="none" stroke="#c56a32" strokeWidth="2.5" />
        {active != null && coords[active] && <circle cx={coords[active].x} cy={coords[active].lineY} r="4" fill="#10241c" />}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-mute">
        <span className="inline-flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-sm bg-moss" /> {barName}</span>
        <span className="inline-flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full bg-copper" /> {lineName}</span>
      </div>
      <Tip coords={coords} active={active}>
        {(point) => (
          <>
            <div>{barName} {point.value}</div>
            <div>{lineName} {formatLine ? formatLine(point.lineValue) : point.lineValue}</div>
          </>
        )}
      </Tip>
    </div>
  );
}

export function DonutChart({ slices, centerLabel = 'total' }) {
  const rows = slices.filter((slice) => Number(slice.value) > 0);
  const total = rows.reduce((sum, slice) => sum + Number(slice.value), 0);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div>
      <svg viewBox="0 0 160 160" className="mx-auto h-36 w-36" role="img" aria-label={centerLabel}>
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#e4dccf" strokeWidth="16" />
        {rows.map((slice, index) => {
          const length = total ? (Number(slice.value) / total) * circumference : 0;
          const element = (
            <circle
              key={slice.label}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth="16"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 80 80)"
            />
          );
          offset += length;
          return element;
        })}
        <text x="80" y="78" textAnchor="middle" fontSize="26" fill="#14241f" fontFamily="Fraunces, Georgia, serif">{total}</text>
        <text x="80" y="98" textAnchor="middle" fontSize="11" fill="#5d6b64">{centerLabel}</text>
      </svg>
      <ul className="mt-4 space-y-1.5 text-sm">
        {rows.map((slice, index) => (
          <li key={slice.label} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
              {titleCase(slice.label)}
            </span>
            <span className="text-mute">{slice.value}</span>
          </li>
        ))}
        {!rows.length && <li className="text-mute">Nothing to chart yet.</li>}
      </ul>
    </div>
  );
}

export function BarList({ rows, format }) {
  const max = Math.max(1, ...rows.map((row) => Number(row.value) || 0));
  if (!rows.length) return <p className="text-sm text-mute">Nothing to chart yet.</p>;
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.label}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate">{row.label}</span>
            <span className="text-mute">{format ? format(row.value) : row.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max((Number(row.value) / max) * 100, row.value ? 4 : 0)}%`, background: CHART_COLORS[index % CHART_COLORS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlatformCharts({ overview }) {
  const tenants = overview.tenants || [];
  const statuses = Object.entries(tenants.reduce((groups, tenant) => {
    const key = tenant.subscription_status || tenant.status || 'unknown';
    groups[key] = (groups[key] || 0) + 1;
    return groups;
  }, {})).map(([label, value]) => ({ label, value }));
  const activity = (overview.activity || []).map((point) => {
    const parts = dayParts(point.day);
    return { label: parts.full, short: parts.short, full: parts.full, value: point.events };
  });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Patients by group">
        <BarList rows={tenants.map((tenant) => ({ label: tenant.name, value: tenant.patients }))} />
      </ChartCard>
      <ChartCard title="Staff accounts">
        <BarList rows={tenants.map((tenant) => ({ label: tenant.name, value: tenant.users }))} />
      </ChartCard>
      <ChartCard title="Plans in force">
        <DonutChart slices={statuses} centerLabel="groups" />
      </ChartCard>
      <ChartCard title="Activity" note="Last 14 days · Muscat">
        <AreaChart points={activity} seriesName="Events" />
      </ChartCard>
      <ChartCard title="Branches">
        <BarList rows={tenants.map((tenant) => ({ label: `${tenant.name} · ${tenant.plan_name || 'No plan'}`, value: tenant.clinics }))} />
      </ChartCard>
    </div>
  );
}
