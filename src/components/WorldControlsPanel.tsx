import { useState } from 'react';
import { formatResourceCost, getRoadTileCost } from '../simulation/rules';
import type {
  AnimalType,
  BiomeType,
  DivineTool,
  EconomyReserve,
  ResourceOperationRecord,
  RoadType,
  VillageLaw,
  VillageLawId,
  WeatherType,
} from '../types/simulation';

interface WorldControlsPanelProps {
  biome: BiomeType;
  weather: WeatherType;
  tool: DivineTool;
  selectedRoadType: RoadType;
  selectedRoadLamp: boolean;
  resourcesPaused: boolean;
  farmsCount: number;
  roadsCount: number;
  animalsCount: number;
  firesCount: number;
  loansCount: number;
  riverFishStock: number;
  riverFishMaxStock: number;
  riverFishRestTimer: number;
  economyReserve: EconomyReserve;
  operationalBuildingsCount: number;
  totalSpecialBuildingsCount: number;
  laws: VillageLaw[];
  representativeName: string | null;
  petitionTimerSec: number;
  qwenAutoRespondPetitions: boolean;
  collectiveHint: string;
  resourceLedger: ResourceOperationRecord[];
  onChangeBiome: (biome: BiomeType) => void;
  onChangeWeather: (weather: WeatherType) => void;
  onSelectTool: (tool: DivineTool) => void;
  onSelectRoadType: (roadType: RoadType) => void;
  onToggleRoadLamp: () => void;
  onToggleResourcesPaused: () => void;
  onBuildBaseRoads: () => void;
  onKillAllCrops: () => void;
  onSpawnAnimal: (animalType: AnimalType) => void;
  onToggleLaw: (lawId: VillageLawId) => void;
  onSummonPetition: () => void;
  onToggleQwenAutoRespond: () => void;
  onTriggerLightningStorm: () => void;
  onGrantRequest: () => void;
  onTrialAbundance: () => void;
  onTrialScarcity: () => void;
  onTrialPlague: () => void;
}

const TOOLS: Array<{ id: DivineTool; label: string }> = [
  { id: 'inspect', label: 'Inspeccionar' },
  { id: 'add_road', label: '+ Camino' },
  { id: 'food', label: '+ Comida' },
  { id: 'wood', label: '+ Madera' },
  { id: 'pine_wood', label: '+ Pino' },
  { id: 'maple_wood', label: '+ Arce' },
  { id: 'oak_wood', label: '+ Roble' },
  { id: 'stone', label: '+ Piedra' },
  { id: 'copper', label: '+ Cobre' },
  { id: 'iron', label: '+ Hierro' },
  { id: 'silver', label: '+ Plata 🥈' },
  { id: 'gold', label: '+ Oro 🥇' },
  { id: 'coins', label: '+ Monedas' },
  { id: 'knowledge', label: '+ Saber' },
  { id: 'kill_crop', label: 'Matar cultivo' },
  { id: 'lightning_storm', label: '⚡ Rayo/Tormenta' },
  { id: 'start_fire', label: '🔥 Incendio' },
  { id: 'heal', label: 'Curar clic' },
  { id: 'infect', label: 'Enfermar clic' },
  { id: 'sterilize', label: 'Impotente clic' },
  { id: 'kill', label: 'Matar clic' },
];

const ANIMAL_BUTTONS: Array<{ id: AnimalType; label: string }> = [
  { id: 'dog', label: '+ Perro' },
  { id: 'cat', label: '+ Gato' },
  { id: 'chicken', label: '+ Gallina' },
  { id: 'cow', label: '+ Vaca' },
  { id: 'horse', label: '+ Caballo' },
  { id: 'sheep', label: '+ Oveja' },
  { id: 'fish', label: '+ Peces' },
  { id: 'wildcat', label: '+ Gato salv.' },
  { id: 'bear', label: '+ Oso' },
];

function formatCountdown(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function MinToggle({
  open,
  onClick,
  label,
  testId,
}: {
  open: boolean;
  onClick: () => void;
  label: string;
  testId: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={open ? `Minimizar ${label}` : `Expandir ${label}`}
      data-testid={testId}
      onClick={onClick}
      className="w-6 h-6 rounded bg-[#0b1120] border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-mono flex items-center justify-center transition-colors shrink-0"
    >
      {open ? '−' : '+'}
    </button>
  );
}

export function WorldControlsPanel({
  biome,
  weather,
  tool,
  selectedRoadType,
  selectedRoadLamp,
  resourcesPaused,
  farmsCount,
  roadsCount,
  animalsCount,
  firesCount,
  loansCount,
  riverFishStock,
  riverFishMaxStock,
  riverFishRestTimer,
  economyReserve,
  operationalBuildingsCount,
  totalSpecialBuildingsCount,
  laws,
  representativeName,
  petitionTimerSec,
  qwenAutoRespondPetitions,
  collectiveHint,
  resourceLedger,
  onChangeBiome,
  onChangeWeather,
  onSelectTool,
  onSelectRoadType,
  onToggleRoadLamp,
  onToggleResourcesPaused,
  onBuildBaseRoads,
  onKillAllCrops,
  onSpawnAnimal,
  onToggleLaw,
  onSummonPetition,
  onToggleQwenAutoRespond,
  onTriggerLightningStorm,
  onGrantRequest,
  onTrialAbundance,
  onTrialScarcity,
  onTrialPlague,
}: WorldControlsPanelProps) {
  const [openEnv, setOpenEnv] = useState(true);
  const [openTools, setOpenTools] = useState(true);
  const [openLaws, setOpenLaws] = useState(true);
  const [openEvents, setOpenEvents] = useState(true);
  const [openLedger, setOpenLedger] = useState(false);

  const activeLawsCount = laws.filter((l) => l.active).length;
  const currentRoadUnitCost = formatResourceCost(getRoadTileCost(selectedRoadType, selectedRoadLamp));
  const recentLedger = [...resourceLedger].slice(-15).reverse();

  return (
    <div className="flex flex-col gap-3">
      <section className="bg-[#111827] border border-slate-800 rounded-xl p-4" data-testid="env-panel">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-slate-400">Fondo Metálico y Entorno</h2>
          <MinToggle
            open={openEnv}
            onClick={() => setOpenEnv((v) => !v)}
            label="Fondo Metálico y Entorno"
            testId="toggle-env-panel"
          />
        </div>

        {openEnv && (
          <div className="mt-3 flex flex-col gap-3">
            <div
              className="bg-[#0b1120] border border-slate-800 rounded-lg p-2.5 text-[11px] flex flex-col gap-1"
              data-testid="economy-reserve-box"
            >
              <div className="flex items-center justify-between text-slate-300">
                <span>Respaldo Banco Central</span>
                <span className="font-mono tabular-nums text-amber-300">
                  {economyReserve.mintedCoins}/{economyReserve.backedCoinsCapacity} mon.
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 font-mono tabular-nums">
                <span>🥇 Oro: {economyReserve.goldReserve}</span>
                <span>🥈 Plata: {economyReserve.silverReserve}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[10.5px] text-slate-400 font-mono tabular-nums whitespace-nowrap">
                <span>Préstamos: {economyReserve.bankLoanPool} mon.</span>
                <span>Imp.: {economyReserve.taxRatePct}% ({loansCount} act.)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Cardumen del río (finito)</span>
                <span className="font-mono tabular-nums text-sky-300" data-testid="river-fish-stock">
                  {riverFishStock}/{riverFishMaxStock} peces
                  {riverFishStock === 0 && riverFishRestTimer > 0
                    ? ` (renov. ${Math.ceil(riverFishRestTimer)}d)`
                    : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Edificios operativos</span>
                <span
                  className={`font-mono tabular-nums font-semibold ${
                    operationalBuildingsCount < totalSpecialBuildingsCount ? 'text-amber-300' : 'text-emerald-400'
                  }`}
                >
                  {operationalBuildingsCount}/{totalSpecialBuildingsCount}
                </span>
              </div>
              {firesCount > 0 && (
                <div className="flex items-center justify-between text-rose-300 font-semibold">
                  <span>Incendios activos</span>
                  <span className="font-mono tabular-nums">{firesCount}</span>
                </div>
              )}
            </div>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300">
              <span>Bioma del mundo (auto cada 30 días)</span>
              <select
                value={biome}
                onChange={(e) => onChangeBiome(e.target.value as BiomeType)}
                className="bg-[#0b1120] border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="grassland">Pradera Verde (Primavera)</option>
                <option value="arid">Tierra Seca / Árida (Verano)</option>
                <option value="forest">Bosque Frondoso (Otoño)</option>
                <option value="tundra">Tundra / Frío (Invierno)</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300">
              <span>Clima actual</span>
              <select
                value={weather}
                onChange={(e) => onChangeWeather(e.target.value as WeatherType)}
                data-testid="weather-select"
                className="bg-[#0b1120] border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="sunny">Soleado</option>
                <option value="rain">Lluvia (Renueva vegetación)</option>
                <option value="drought">Sequía (Aumenta hambre)</option>
                <option value="storm">Tormenta (Riesgo sanitario)</option>
                <option value="thunderstorm">Tormenta eléctrica (Rayos y fuego)</option>
              </select>
            </label>

            <button
              type="button"
              onClick={onToggleResourcesPaused}
              className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                resourcesPaused
                  ? 'border-amber-600 bg-amber-950/70 text-amber-200 hover:bg-amber-900/70'
                  : 'border-slate-700 bg-[#0b1120] text-slate-200 hover:border-amber-500/60'
              }`}
            >
              {resourcesPaused ? 'Reanudar entrega de recursos' : 'Pausar todos los recursos'}
            </button>
          </div>
        )}
      </section>

      <section className="bg-[#111827] border border-slate-800 rounded-xl p-4" data-testid="tools-panel">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-slate-400">Herramientas en el Mapa</h2>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-mono tabular-nums">{roadsCount} caminos</span>
            <MinToggle
              open={openTools}
              onClick={() => setOpenTools((v) => !v)}
              label="Herramientas en el Mapa"
              testId="toggle-tools-panel"
            />
          </div>
        </div>

        {openTools && (
          <div className="mt-3">
            <div className="grid grid-cols-2 gap-1.5">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  data-testid={`tool-${t.id}`}
                  onClick={() => onSelectTool(t.id)}
                  className={`px-2.5 py-2 text-xs font-medium rounded-lg border text-left transition-colors whitespace-nowrap truncate ${
                    tool === t.id
                      ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200'
                      : 'border-slate-800 bg-[#0b1120] text-slate-300 hover:border-slate-700 hover:text-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-2.5 bg-[#0b1120] border border-slate-800 rounded-lg p-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300">Camino por tramo</span>
                <span className="font-mono text-amber-300" data-testid="road-unit-cost">
                  {currentRoadUnitCost}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: 'dirt', label: 'Tierra' },
                    { id: 'stone', label: 'Piedra' },
                    { id: 'reinforced', label: 'Reforz.' },
                  ] as const
                ).map((rt) => (
                  <button
                    key={rt.id}
                    type="button"
                    data-testid={`road-type-${rt.id}`}
                    onClick={() => onSelectRoadType(rt.id)}
                    className={`py-1 px-1.5 rounded border text-[11px] font-medium transition-colors ${
                      selectedRoadType === rt.id
                        ? 'border-sky-500 bg-sky-950/60 text-sky-200'
                        : 'border-slate-800 bg-[#111827] text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                data-testid="toggle-road-lamp"
                aria-pressed={selectedRoadLamp}
                onClick={onToggleRoadLamp}
                className={`w-full py-1.5 px-2.5 rounded border text-[11px] font-medium text-left flex items-center justify-between transition-colors ${
                  selectedRoadLamp
                    ? 'border-amber-500/80 bg-amber-950/40 text-amber-200'
                    : 'border-slate-800 bg-[#111827] text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>Farol en tramos (+2 Mad. +1 Cob. +1 Hie.)</span>
                <span className="font-mono text-[10px]">{selectedRoadLamp ? 'ON' : 'OFF'}</span>
              </button>
              <button
                type="button"
                data-testid="build-base-roads-btn"
                onClick={onBuildBaseRoads}
                className="w-full py-2 px-3 rounded-lg bg-[#111827] border border-slate-700 hover:border-sky-500 text-sky-200 text-xs font-medium transition-colors whitespace-nowrap"
              >
                Trazar red principal (gasta materiales)
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Fauna y Ganado</span>
                <span className="text-[11px] text-slate-500 font-mono tabular-nums">{animalsCount} activos</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {ANIMAL_BUTTONS.map((ab) => (
                  <button
                    key={ab.id}
                    type="button"
                    onClick={() => onSpawnAnimal(ab.id)}
                    className={`px-2 py-1.5 text-[11px] rounded border text-left transition-colors whitespace-nowrap truncate ${
                      ab.id === 'bear' || ab.id === 'wildcat'
                        ? 'border-rose-900/70 bg-rose-950/40 text-rose-200 hover:border-rose-600'
                        : 'border-slate-800 bg-[#0b1120] text-slate-300 hover:border-emerald-600'
                    }`}
                  >
                    {ab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Necesidad colectiva detectada</div>
              <p className="text-xs text-slate-200 leading-relaxed mb-2.5">{collectiveHint}</p>
              <button
                type="button"
                disabled={resourcesPaused}
                onClick={onGrantRequest}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                {resourcesPaused ? 'Ayuda bloqueada (recursos pausados)' : 'Conceder ayuda a la aldea'}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="bg-[#111827] border border-slate-800 rounded-xl p-4" data-testid="laws-panel">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-slate-400">
            Leyes, Consejo y Representante
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-violet-300 font-mono tabular-nums">{activeLawsCount}/7 act.</span>
            <MinToggle
              open={openLaws}
              onClick={() => setOpenLaws((v) => !v)}
              label="Leyes, Consejo y Representante"
              testId="toggle-laws-panel"
            />
          </div>
        </div>

        {openLaws && (
          <div className="mt-3 flex flex-col gap-2.5">
            <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-2.5 text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Representante actual</span>
                <strong className="text-violet-300" data-testid="representative-name">
                  {representativeName ?? 'Por elegir'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Próxima petición (30m)</span>
                <span className="font-mono tabular-nums text-slate-200" data-testid="petition-countdown">
                  {formatCountdown(petitionTimerSec)}
                </span>
              </div>
              <button
                type="button"
                data-testid="summon-petition-btn"
                onClick={onSummonPetition}
                className="mt-0.5 w-full py-1.5 px-2.5 rounded bg-violet-950/70 border border-violet-700/70 hover:bg-violet-900/70 text-violet-200 text-[11px] font-semibold transition-colors"
              >
                Convocar petición ahora (Intervención Divina)
              </button>
              <label
                className={`mt-1 flex items-start gap-2 rounded-lg border px-2.5 py-2 cursor-pointer select-none transition-colors ${
                  qwenAutoRespondPetitions
                    ? 'bg-violet-950/45 border-violet-500/70 text-violet-100'
                    : 'bg-[#111827] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  data-testid="qwen-auto-respond-checkbox"
                  checked={qwenAutoRespondPetitions}
                  onChange={onToggleQwenAutoRespond}
                  className="mt-0.5 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500 shrink-0"
                />
                <span className="flex flex-col leading-snug">
                  <span className="text-[11px] font-semibold">Qwen Responde</span>
                  <span className="text-[10px] text-slate-400">
                    Si está activo, Qwen 2.5 responde automáticamente los mensajes de cada 30 min según su criterio.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              {laws.map((law) => (
                <div
                  key={law.id}
                  className={`rounded-lg border p-2 text-xs flex items-start justify-between gap-2 ${
                    law.active
                      ? 'bg-violet-950/35 border-violet-600/60 text-slate-100'
                      : 'bg-[#0b1120] border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-[11px] leading-snug">{law.name}</div>
                    <div className="text-[10px] text-slate-400 leading-snug mt-0.5">{law.description}</div>
                  </div>
                  <button
                    type="button"
                    data-testid={`law-toggle-${law.id}`}
                    onClick={() => onToggleLaw(law.id)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold shrink-0 transition-colors ${
                      law.active
                        ? 'bg-violet-600 hover:bg-violet-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {law.active ? 'Activa' : 'Activar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="bg-[#111827] border border-slate-800 rounded-xl p-4" data-testid="events-panel">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-slate-400">
            Eventos de Supervivencia
          </h2>
          <MinToggle
            open={openEvents}
            onClick={() => setOpenEvents((v) => !v)}
            label="Eventos de Supervivencia"
            testId="toggle-events-panel"
          />
        </div>

        {openEvents && (
          <div className="mt-2.5 flex flex-col gap-1.5">
            <button
              type="button"
              disabled={resourcesPaused}
              onClick={onTrialAbundance}
              className="w-full py-2 px-3 rounded-lg bg-[#0b1120] border border-slate-800 hover:border-slate-700 disabled:opacity-45 text-slate-200 text-xs font-medium text-left transition-colors whitespace-nowrap"
            >
              Lluvia de recursos, Oro 🥇 y Plata 🥈
            </button>
            <button
              type="button"
              onClick={onTrialScarcity}
              className="w-full py-2 px-3 rounded-lg bg-[#0b1120] border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium text-left transition-colors whitespace-nowrap"
            >
              Ola de calor y escasez
            </button>
            <button
              type="button"
              onClick={onTriggerLightningStorm}
              data-testid="trigger-lightning-btn"
              className="w-full py-2 px-3 rounded-lg bg-amber-950/50 border border-amber-800/60 hover:bg-amber-900/60 text-amber-200 text-xs font-medium text-left transition-colors whitespace-nowrap"
            >
              ⚡ Desatar tormenta eléctrica (Rayos e incendios)
            </button>
            <button
              type="button"
              onClick={onTrialPlague}
              className="w-full py-2 px-3 rounded-lg bg-[#0b1120] border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium text-left transition-colors whitespace-nowrap"
            >
              Brote estacional de enfermedad
            </button>
            <button
              type="button"
              disabled={farmsCount === 0}
              onClick={onKillAllCrops}
              className="w-full py-2 px-3 rounded-lg bg-rose-950/60 border border-rose-800/70 hover:bg-rose-900/70 disabled:opacity-45 text-rose-200 text-xs font-medium text-left transition-colors whitespace-nowrap"
            >
              Matar todos los cultivos ({farmsCount})
            </button>
          </div>
        )}
      </section>

      <section className="bg-[#111827] border border-slate-800 rounded-xl p-4" data-testid="resource-ledger-panel">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-slate-400">
            Control de Recursos (Auditoría)
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-mono tabular-nums" data-testid="ledger-count">
              {resourceLedger.length} reg.
            </span>
            <MinToggle
              open={openLedger}
              onClick={() => setOpenLedger((v) => !v)}
              label="Control de Recursos (Auditoría)"
              testId="toggle-ledger-panel"
            />
          </div>
        </div>

        {openLedger && (
          <div className="mt-3 flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-0.5">
            {recentLedger.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">
                Aún no se registraron consumos, reservas, mantenimientos ni producciones.
              </p>
            ) : (
              recentLedger.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-[#0b1120] border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] flex flex-col gap-0.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-200 truncate">
                      {entry.targetName}
                    </span>
                    <span className="font-mono text-[10px] text-sky-300 shrink-0">
                      Día {entry.day} · {entry.operationType}
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-300 font-mono">
                    {formatResourceCost(entry.materials)}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between gap-2">
                    <span className="truncate">Actor: {entry.actorName}</span>
                    <span className="truncate">Origen: {entry.source}</span>
                  </div>
                  <div className="text-[10px] text-emerald-300/90">{entry.result}</div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
