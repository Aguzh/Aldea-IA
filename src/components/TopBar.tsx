import type { EconomyReserve, LayoutMode, SeasonType, SimulationState } from '../types/simulation';
import { DAYS_PER_YEAR, ERA_METADATA, isNightMinute, SPEED_TIMINGS } from '../simulation/rules';

interface TopBarProps {
  snapshot: {
    day: number;
    minute: number;
    season: SeasonType;
    population: number;
    sickCount: number;
    firesCount: number;
    housesCount: number;
    totalCoins: number;
    economyReserve: EconomyReserve;
    knowledge: number;
    era: SimulationState['era'];
    speed: SimulationState['speed'];
    resourcesPaused: boolean;
    layoutMode: LayoutMode;
    ollamaEnabled: boolean;
    ollamaModel: string;
  };
  onSetSpeed: (speed: 0 | 1 | 2 | 4) => void;
  onToggleResourcesPaused: () => void;
  onSetLayout: (mode: LayoutMode) => void;
  onOpenStats: () => void;
  onOpenFamilies: () => void;
  onOpenSaveLoad: () => void;
  onOpenDownload: () => void;
  onRequestReset: () => void;
  onOpenOllama: () => void;
}

export function TopBar({
  snapshot,
  onSetSpeed,
  onToggleResourcesPaused,
  onSetLayout,
  onOpenStats,
  onOpenFamilies,
  onOpenSaveLoad,
  onOpenDownload,
  onRequestReset,
  onOpenOllama,
}: TopBarProps) {
  const hh = String(Math.floor(snapshot.minute / 60)).padStart(2, '0');
  const mm = String(Math.floor(snapshot.minute % 60)).padStart(2, '0');
  const isNight = isNightMinute(snapshot.minute);
  const eraLabel = ERA_METADATA[snapshot.era].label;
  const activeSpeed: 1 | 2 | 4 = snapshot.speed === 0 ? 1 : snapshot.speed;
  const timing = SPEED_TIMINGS[activeSpeed];
  const yearNum = Math.floor((Math.max(1, snapshot.day) - 1) / DAYS_PER_YEAR) + 1;
  const dayOfYear = ((Math.max(1, snapshot.day) - 1) % DAYS_PER_YEAR) + 1;

  return (
    <header className="bg-[#111827] border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <h1 className="text-base font-bold tracking-tight text-slate-50">Aldea IA</h1>
        <span className="text-slate-600" aria-hidden="true">·</span>
        <span className="text-xs font-medium text-emerald-400" data-testid="era-label">
          {eraLabel}
        </span>
        <span className="text-slate-600" aria-hidden="true">·</span>
        <span className="text-xs font-medium text-sky-300" data-testid="season-label">
          {snapshot.season}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <div
          className="flex items-baseline gap-1"
          title={`Año ${yearNum} (día ${dayOfYear}/${DAYS_PER_YEAR}, estaciones de 30 días)`}
        >
          <span>Año</span>
          <strong className="font-mono tabular-nums text-slate-100" data-testid="stat-year">
            {yearNum}
          </strong>
          <span className="text-slate-600">·</span>
          <span>Día</span>
          <strong className="font-mono tabular-nums text-slate-100" data-testid="stat-day">
            {snapshot.day}
          </strong>
        </div>
        <span className="text-slate-700" aria-hidden="true">·</span>
        <div
          className="flex items-baseline gap-1"
          title={`Velocidad x${activeSpeed}: Día ${timing.dayLabel} · Noche ${timing.nightLabel}`}
        >
          <span>Hora</span>
          <strong className="font-mono tabular-nums text-slate-100" data-testid="stat-time">
            {hh}:{mm}
          </strong>
          <span
            className={`text-[10px] font-medium ${isNight ? 'text-indigo-300' : 'text-amber-300'}`}
            data-testid="day-phase"
          >
            ({isNight ? `Noche ${timing.nightLabel}` : `Día ${timing.dayLabel}`})
          </span>
        </div>
        <span className="text-slate-700" aria-hidden="true">·</span>
        <div className="flex items-baseline gap-1">
          <span>Pob.</span>
          <strong className="font-mono tabular-nums text-slate-100" data-testid="stat-pop">
            {snapshot.population}
          </strong>
          {snapshot.sickCount > 0 && (
            <span className="text-rose-400 font-mono tabular-nums">({snapshot.sickCount})</span>
          )}
        </div>
        <span className="text-slate-700" aria-hidden="true">·</span>
        <div className="flex items-baseline gap-1">
          <span>Casas</span>
          <strong className="font-mono tabular-nums text-slate-100" data-testid="stat-houses">
            {snapshot.housesCount}
          </strong>
        </div>
        <span className="text-slate-700" aria-hidden="true">·</span>
        <div
          className="flex items-baseline gap-1"
          title={`Respaldo metálico: ${snapshot.economyReserve.goldReserve} Oro 🥇 y ${snapshot.economyReserve.silverReserve} Plata 🥈 (Tope ${snapshot.economyReserve.backedCoinsCapacity} monedas)`}
        >
          <span>Monedas</span>
          <strong className="font-mono tabular-nums text-amber-300" data-testid="stat-coins">
            {snapshot.totalCoins}
          </strong>
          <span className="text-[10px] font-mono tabular-nums text-slate-500">
            /{snapshot.economyReserve.backedCoinsCapacity}
          </span>
        </div>
        <span className="text-slate-700" aria-hidden="true">·</span>
        <div className="flex items-baseline gap-1">
          <span>Saber</span>
          <strong className="font-mono tabular-nums text-emerald-400" data-testid="stat-tech">
            {Math.round(snapshot.knowledge)}
          </strong>
        </div>
        {snapshot.firesCount > 0 && (
          <>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <span className="text-rose-400 font-semibold font-mono tabular-nums" data-testid="stat-fires">
              🔥 {snapshot.firesCount} incendio(s)
            </span>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        <div className="flex items-center bg-[#0b1120] border border-slate-800 rounded-lg p-0.5" role="group" aria-label="Velocidad de simulación">
          {([
            { val: 0, label: 'Pausa', hint: 'Pausar simulación' },
            { val: 1, label: 'x1', hint: 'x1: Día 7m · Noche 3m' },
            { val: 2, label: 'x2', hint: 'x2: Día 5m · Noche 1.5m' },
            { val: 4, label: 'x4', hint: 'x4: Día 2.5m · Noche 1m' },
          ] as const).map((item) => (
            <button
              key={item.val}
              type="button"
              title={item.hint}
              data-testid={`speed-btn-${item.val}`}
              onClick={() => onSetSpeed(item.val)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                snapshot.speed === item.val
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onToggleResourcesPaused}
          data-testid="toggle-resources-pause"
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
            snapshot.resourcesPaused
              ? 'border-amber-600 bg-amber-950/70 text-amber-200 hover:bg-amber-900/70'
              : 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
          }`}
        >
          {snapshot.resourcesPaused ? 'Recursos: Pausados' : 'Pausar recursos'}
        </button>

        <button
          type="button"
          onClick={onOpenStats}
          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
        >
          Gráfico
        </button>

        <button
          type="button"
          onClick={onOpenFamilies}
          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
        >
          Familias
        </button>

        <button
          type="button"
          onClick={onOpenSaveLoad}
          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
        >
          Guardar
        </button>

        <button
          type="button"
          onClick={onOpenDownload}
          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-emerald-700/70 bg-emerald-950/60 text-emerald-200 hover:bg-emerald-900/70 transition-colors whitespace-nowrap shrink-0"
        >
          Descargar PC
        </button>

        <button
          type="button"
          onClick={onRequestReset}
          data-testid="reset-village-btn"
          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-rose-700/70 bg-rose-950/60 text-rose-200 hover:bg-rose-900/70 transition-colors whitespace-nowrap shrink-0"
        >
          Reiniciar
        </button>

        <div className="flex items-center bg-[#0b1120] border border-slate-800 rounded-lg p-0.5" role="group" aria-label="Orientación de pantalla">
          {([
            { val: 'auto', label: 'Auto' },
            { val: 'vertical', label: 'Vert' },
            { val: 'horizontal', label: 'Horiz' },
          ] as const).map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => onSetLayout(item.val)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                snapshot.layoutMode === item.val
                  ? 'bg-slate-700 text-slate-50'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenOllama}
          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
        >
          {snapshot.ollamaEnabled ? `Ollama · ${snapshot.ollamaModel}` : 'Ollama'}
        </button>
      </div>
    </header>
  );
}
