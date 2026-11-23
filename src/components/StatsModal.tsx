import type { DaySnapshot } from '../types/simulation';

interface StatsModalProps {
  history: DaySnapshot[];
  onClose: () => void;
}

function buildLinePath(values: number[], width: number, height: number, maxVal: number): string {
  if (values.length === 0) return '';
  if (values.length === 1) {
    const y = height - (values[0] / Math.max(1, maxVal)) * (height - 16) - 8;
    return `M 10 ${y.toFixed(1)} L ${width - 10} ${y.toFixed(1)}`;
  }
  return values
    .map((val, idx) => {
      const x = 10 + (idx / (values.length - 1)) * (width - 20);
      const y = height - (val / Math.max(1, maxVal)) * (height - 16) - 8;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

export function StatsModal({ history, onClose }: StatsModalProps) {
  const latest = history[history.length - 1] ?? {
    day: 1,
    population: 0,
    avgHealth: 0,
    avgHappiness: 0,
    houses: 0,
    knowledge: 0,
    totalCoins: 0,
  };

  const w = 480;
  const h = 150;
  const maxPop = Math.max(30, ...history.map((d) => d.population));
  const maxKnow = Math.max(60, ...history.map((d) => d.knowledge));
  const maxCoins = Math.max(200, ...history.map((d) => d.totalCoins));

  const popPath = buildLinePath(history.map((d) => d.population), w, h, maxPop);
  const healthPath = buildLinePath(history.map((d) => d.avgHealth), w, h, 100);
  const knowPath = buildLinePath(history.map((d) => d.knowledge), w, h, maxKnow);
  const coinsPath = buildLinePath(history.map((d) => d.totalCoins), w, h, maxCoins);

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-modal-title"
    >
      <div className="bg-[#111827] border border-slate-700 rounded-xl p-5 w-full max-w-xl flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h2 id="stats-modal-title" className="text-base font-bold text-slate-50">
            Estadísticas Históricas de la Aldea
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-2.5">
            <div className="text-slate-400">Población</div>
            <div className="text-base font-bold font-mono tabular-nums text-emerald-400">
              {latest.population}
            </div>
          </div>
          <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-2.5">
            <div className="text-slate-400">Salud media</div>
            <div className="text-base font-bold font-mono tabular-nums text-sky-400">
              {latest.avgHealth}%
            </div>
          </div>
          <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-2.5">
            <div className="text-slate-400">Saber acumulado</div>
            <div className="text-base font-bold font-mono tabular-nums text-violet-400">
              {latest.knowledge}
            </div>
          </div>
          <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-2.5">
            <div className="text-slate-400">Economía total</div>
            <div className="text-base font-bold font-mono tabular-nums text-amber-400">
              {latest.totalCoins} mon.
            </div>
          </div>
        </div>

        <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300">
            <span className="text-emerald-400">● Población</span>
            <span className="text-sky-400">● Salud media</span>
            <span className="text-violet-400">● Saber</span>
            <span className="text-amber-400">● Monedas</span>
            <span className="ml-auto font-mono tabular-nums text-slate-400">
              {history.length} día(s) registrados
            </span>
          </div>
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="w-full h-40 overflow-visible"
            role="img"
            aria-label="Gráfico histórico de población, salud, saber y monedas"
          >
            <line x1="10" y1={h / 2} x2={w - 10} y2={h / 2} stroke="#1e293b" strokeDasharray="4 4" />
            <line x1="10" y1={h - 8} x2={w - 10} y2={h - 8} stroke="#334155" />
            <path d={popPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <path d={healthPath} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <path d={knowPath} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
            <path d={coinsPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
