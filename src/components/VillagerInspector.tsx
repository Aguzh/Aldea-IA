import { useState } from 'react';
import type {
  Agent,
  Animal,
  BridgeStructure,
  FarmPlot,
  House,
  HouseStorage,
  JobType,
  PlazaStructure,
  ResourceInventory,
  SelectedEntity,
  SpecialBuilding,
} from '../types/simulation';
import {
  ANIMAL_LABELS,
  canGatherOrTradeMineral,
  canGatherOrTradeWood,
  countMaestroJobs,
  getHappinessLabel,
  getHealthStatusLabel,
  getJobMasteryTierLabel,
  getRankTitle,
  HOUSE_ALLOWED_STORAGE,
  HOUSE_LEVEL_LABELS,
  HOUSE_SIZE_LABELS,
  MAX_MAESTRO_JOBS_PER_AGENT,
  SPECIAL_BUILDING_ALLOWED_STORAGE,
  SPECIAL_BUILDING_STAFF_JOBS,
  VILLAGE_SKILLS,
} from '../simulation/rules';

interface VillagerInspectorProps {
  selectedEntity: SelectedEntity | null;
  agent: Agent | null;
  partnerName: string | null;
  mentorName: string | null;
  agentHouse: House | null;
  inspectedHouse: House | null;
  inspectedHouseResidents: Agent[];
  inspectedSpecial: SpecialBuilding | null;
  inspectedSpecialOwnerName: string | null;
  inspectedSpecialStaff: Agent[];
  inspectedFarm: FarmPlot | null;
  inspectedAnimal: Animal | null;
  inspectedPlaza: PlazaStructure | null;
  inspectedBridge: BridgeStructure | null;
  inspectedAnimalOwnerName: string | null;
  inspectedAnimalRiderName: string | null;
  populationCount: number;
  sickCount: number;
  highlightedFamilyId: number | null;
  onSelectFirstAgent: () => void;
  onSelectAgent: (id: number) => void;
  onCure: (id: number) => void;
  onInfect: (id: number) => void;
  onToggleSterile: (id: number) => void;
  onKill: (id: number) => void;
  onSwitchPartner: (id: number) => void;
  onStoreInHouse: (id: number) => void;
  onHighlightFamily: (id: number | null) => void;
  onModifyResource: (id: number, resource: keyof ResourceInventory | 'coins', delta: number) => void;
  onModifyKnowledge: (id: number, delta: number) => void;
  onCraftTools: (id: number) => void;
  onModifyHouseStorage: (houseId: number, key: keyof HouseStorage, delta: number) => void;
  onModifySpecialStorage: (buildingId: number, key: keyof HouseStorage, delta: number) => void;
  onDeleteHouse: (id: number) => void;
  onDeleteSpecial: (id: number) => void;
  onDeleteFarm: (id: number) => void;
  onDeleteAnimal: (id: number) => void;
  onDeletePlaza: () => void;
  onDeleteBridge: () => void;
}

const SPECIAL_ROLE_INFO: Record<SpecialBuilding['type'], string> = {
  infirmary: 'Atiende aldeanos enfermos y frena cuadros graves. Requiere Curandero activo.',
  school: 'Eleva el Saber general, Carpintería y Construcción. Requiere Maestro o Erudito.',
  bank: 'Administra Oro 🥇, Plata 🥈, préstamos e impuestos. Requiere Banquero.',
  market: 'Centraliza el comercio de bienes y monedas respaldadas. Requiere Comerciante.',
  bakery: 'Hornea pan nutritivo a partir de los cultivos y raciones. Requiere Panadero.',
  carpentry: 'Procesa Pino, Arce y Roble y coordina reparaciones. Requiere Carpintero.',
  forge: 'Forja herramientas con Cobre o Hierro y mejora defensas. Requiere Herrero o Artesano.',
  apothecary: 'Elabora remedios contra enfermedades curables. Requiere Boticario.',
  dock: 'Regula la pesca fluvial respetando el cardumen finito. Requiere Pescador.',
  general_depot: 'Resguarda maderas, piedra, minerales, herramientas y suministros de la aldea. Requiere Almacenero.',
  town_hall: 'Sede del Consejo y del Representante electo de la aldea. Requiere Alcalde.',
  police_station: 'Vigila el cumplimiento de las leyes y patrulla de noche. Requiere Comisario o Guardián.',
  prison: 'Mantiene detenidos por 2 días a quienes infringen las leyes activas. Requiere Comisario o Guardián.',
};

const STORAGE_LABELS: Record<keyof HouseStorage, string> = {
  food: 'Alimento',
  bread: 'Pan',
  milk: 'Leche',
  wood: 'Madera',
  pineWood: 'Pino',
  mapleWood: 'Arce',
  oakWood: 'Roble',
  stone: 'Piedra',
  copper: 'Cobre',
  iron: 'Hierro',
  gold: 'Oro 🥇',
  silver: 'Plata 🥈',
  tools: 'Herram.',
  medicine: 'Medic.',
  coins: 'Monedas',
};

export function VillagerInspector({
  selectedEntity,
  agent,
  partnerName,
  mentorName,
  agentHouse,
  inspectedHouse,
  inspectedHouseResidents,
  inspectedSpecial,
  inspectedSpecialOwnerName,
  inspectedSpecialStaff,
  inspectedFarm,
  inspectedAnimal,
  inspectedPlaza,
  inspectedBridge,
  inspectedAnimalOwnerName,
  inspectedAnimalRiderName,
  populationCount,
  sickCount,
  highlightedFamilyId,
  onSelectFirstAgent,
  onSelectAgent,
  onCure,
  onInfect,
  onToggleSterile,
  onKill,
  onSwitchPartner,
  onStoreInHouse,
  onHighlightFamily,
  onModifyResource,
  onModifyKnowledge,
  onCraftTools,
  onModifyHouseStorage,
  onModifySpecialStorage,
  onDeleteHouse,
  onDeleteSpecial,
  onDeleteFarm,
  onDeleteAnimal,
  onDeletePlaza,
  onDeleteBridge,
}: VillagerInspectorProps) {
  const [minimized, setMinimized] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [selectedMineralKey, setSelectedMineralKey] = useState<'copper' | 'iron' | 'silver' | 'gold'>('iron');

  const collapseBtn = (
    <button
      type="button"
      aria-expanded={!minimized}
      aria-label={minimized ? 'Expandir Inspector' : 'Minimizar Inspector'}
      data-testid="toggle-inspector-panel"
      onClick={() => setMinimized((v) => !v)}
      className="w-6 h-6 rounded bg-[#0b1120] border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-mono flex items-center justify-center transition-colors shrink-0"
    >
      {minimized ? '+' : '−'}
    </button>
  );

  if (selectedEntity?.kind === 'house' && inspectedHouse) {
    const sizeLabel = HOUSE_SIZE_LABELS[inspectedHouse.size ?? 'medium'];
    const durability = Math.round(inspectedHouse.durability ?? 100);
    return (
      <section className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col gap-3" data-testid="inspector-panel">
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-50" data-testid="inspector-entity-name">
              {inspectedHouse.name}
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Vivienda {sizeLabel} · {inspectedHouse.zone === 'north' ? 'Zona Norte' : 'Zona Sur'}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="text-right text-xs">
              <div className="font-semibold text-emerald-400">{HOUSE_LEVEL_LABELS[inspectedHouse.level]}</div>
              <div className="text-slate-400 font-mono tabular-nums">
                {inspectedHouseResidents.length}/{inspectedHouse.capacity} plazas · {durability}% est.
              </div>
            </div>
            {collapseBtn}
          </div>
        </div>

        {!minimized && (
          <>
            <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-2.5 text-xs flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Constructor</span>
                <span className="text-slate-200">{inspectedHouse.builderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Durabilidad estructural</span>
                <span className={`font-mono tabular-nums ${durability < 60 ? 'text-amber-300' : 'text-emerald-400'}`}>
                  {durability}%
                </span>
              </div>
              <div className="text-slate-400">Residentes ({inspectedHouseResidents.length}/{inspectedHouse.capacity})</div>
              {inspectedHouseResidents.length === 0 ? (
                <div className="text-slate-500 italic">Sin habitantes asignados por ahora.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {inspectedHouseResidents.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => onSelectAgent(res.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-900/60 border border-slate-700 text-[11px] text-slate-200 transition-colors"
                    >
                      {res.name} ({res.job})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-2.5 text-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Baúl Familiar (Solo Alimento y Monedas)</span>
                <span className="text-[10px] text-amber-300">Solo eliminar</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 font-mono tabular-nums text-[11px] text-slate-200">
                {HOUSE_ALLOWED_STORAGE.map((key) => {
                  const val = inspectedHouse.storage[key] ?? 0;
                  const label = key === 'food' ? 'Alimento' : 'Monedas';
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-2 bg-[#111827] border border-slate-800/80 rounded px-2.5 py-1.5"
                    >
                      <span className={key === 'coins' ? 'text-amber-300' : 'text-slate-200'}>{label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-8 text-center font-semibold" data-testid={`house-storage-val-${key}`}>
                          {val}
                        </span>
                        <button
                          type="button"
                          disabled={val <= 0}
                          aria-label={`Quitar ${label} de casa`}
                          data-testid={`house-storage-sub-${key}`}
                          onClick={() => onModifyHouseStorage(inspectedHouse.id, key, -1)}
                          className="px-2 h-5 rounded bg-slate-800 hover:bg-rose-900/70 disabled:opacity-40 text-slate-200 flex items-center justify-center transition-colors"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          disabled={val <= 0}
                          aria-label={`Vaciar ${label} de casa`}
                          data-testid={`house-storage-clear-${key}`}
                          onClick={() => onModifyHouseStorage(inspectedHouse.id, key, -val)}
                          className="px-2 h-5 rounded bg-rose-950/70 hover:bg-rose-900/80 disabled:opacity-40 text-rose-200 flex items-center justify-center transition-colors"
                        >
                          Vaciar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDeleteHouse(inspectedHouse.id)}
              data-testid="inspector-delete-btn"
              className="w-full py-2 px-3 rounded-lg bg-rose-950/70 border border-rose-700/70 hover:bg-rose-900/70 text-rose-200 text-xs font-semibold transition-colors"
            >
              Demoler / Eliminar vivienda
            </button>
          </>
        )}
      </section>
    );
  }

  if (selectedEntity?.kind === 'special' && inspectedSpecial) {
    const catLabel =
      inspectedSpecial.category === 'hospital'
        ? 'Salud y Hospital'
        : inspectedSpecial.category === 'school'
          ? 'Educación y Ciencia'
          : inspectedSpecial.category === 'civic'
            ? 'Gobierno y Orden'
            : inspectedSpecial.category === 'depot'
              ? 'Almacén y Logística'
              : 'Comercio y Finanzas';
    const requiredJobs = SPECIAL_BUILDING_STAFF_JOBS[inspectedSpecial.type].join(' o ');
    const allowedKeys =
      inspectedSpecial.allowedStorage?.length > 0
        ? inspectedSpecial.allowedStorage
        : SPECIAL_BUILDING_ALLOWED_STORAGE[inspectedSpecial.type];
    const durability = Math.round(inspectedSpecial.durability ?? 100);

    return (
      <section className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col gap-3" data-testid="inspector-panel">
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-50" data-testid="inspector-entity-name">
              {inspectedSpecial.name}
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">{catLabel}</div>
          </div>
          <div className="flex items-start gap-2">
            <div className="text-right text-xs">
              <div className="font-semibold text-sky-400 font-mono tabular-nums">
                N{inspectedSpecial.level}/3 · {durability}% est.
              </div>
              <div className="text-slate-400">Obra de {inspectedSpecial.builderName}</div>
            </div>
            {collapseBtn}
          </div>
        </div>

        {!minimized && (
          <>
            <div
              className={`rounded-lg border px-2.5 py-2 text-xs flex items-center justify-between ${
                inspectedSpecial.isOperational
                  ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                  : 'bg-rose-950/50 border-rose-700/60 text-rose-200'
              }`}
              data-testid="special-operational-status"
            >
              <span className="font-semibold">
                {inspectedSpecial.isOperational ? 'Operativo' : 'OBSOLETO (Sin administrador)'}
              </span>
              <span className="font-mono text-[11px]">
                {inspectedSpecial.staffIds.length} asignado(s) · {requiredJobs}
              </span>
            </div>

            <div className="bg-[#0b1120] border border-slate-800 rounded-lg px-2.5 py-2 text-xs flex items-center justify-between">
              <span className="text-slate-400">Propietario exclusivo</span>
              {inspectedSpecial.ownerId !== null && inspectedSpecialOwnerName ? (
                <button
                  type="button"
                  onClick={() => onSelectAgent(inspectedSpecial.ownerId!)}
                  className="text-amber-300 hover:text-amber-200 font-semibold"
                  data-testid="special-owner-name"
                >
                  {inspectedSpecialOwnerName}
                </button>
              ) : (
                <span className="text-slate-300 font-mono" data-testid="special-owner-name">
                  En venta ({inspectedSpecial.price} mon.)
                </span>
              )}
            </div>

            <p className="bg-[#0b1120] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 leading-relaxed">
              {SPECIAL_ROLE_INFO[inspectedSpecial.type]}
            </p>

            <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-2.5 text-xs flex flex-col gap-1.5">
              <div className="text-slate-400">Personal administrador ({inspectedSpecialStaff.length})</div>
              {inspectedSpecialStaff.length === 0 ? (
                <div className="text-rose-300 text-[11px]">
                  No funciona hasta que al menos 1 aldeano con oficio {requiredJobs} lo administre.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {inspectedSpecialStaff.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => onSelectAgent(st.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-900/60 border border-slate-700 text-[11px] text-slate-200 transition-colors"
                    >
                      {st.name} ({st.job})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-2.5 text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Depósito Específico</span>
                <span className="text-[10px] text-slate-500">{allowedKeys.length} ítem(s)</span>
              </div>
              <div className="grid grid-cols-2 gap-1 font-mono tabular-nums text-[11px] text-slate-200">
                {allowedKeys.map((k) => (
                  <div
                    key={k}
                    className="flex items-center justify-between gap-1 bg-[#111827] border border-slate-800/80 rounded px-2 py-1"
                  >
                    <span className="truncate">{STORAGE_LABELS[k] ?? k}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onModifySpecialStorage(inspectedSpecial.id, k, -1)}
                        className="w-4 h-4 rounded bg-slate-800 hover:bg-rose-900/70 text-slate-200 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-5 text-center" data-testid={`special-storage-val-${k}`}>
                        {inspectedSpecial.storage[k]}
                      </span>
                      <button
                        type="button"
                        onClick={() => onModifySpecialStorage(inspectedSpecial.id, k, 1)}
                        className="w-4 h-4 rounded bg-slate-800 hover:bg-emerald-800/70 text-slate-200 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDeleteSpecial(inspectedSpecial.id)}
              data-testid="inspector-delete-btn"
              className="w-full py-2 px-3 rounded-lg bg-rose-950/70 border border-rose-700/70 hover:bg-rose-900/70 text-rose-200 text-xs font-semibold transition-colors"
            >
              Demoler / Eliminar edificio
            </button>
          </>
        )}
      </section>
    );
  }

  if (selectedEntity?.kind === 'farm' && inspectedFarm) {
    const sizeLabel = HOUSE_SIZE_LABELS[inspectedFarm.size ?? 'medium'];
    return (
      <section className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col gap-3" data-testid="inspector-panel">
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-50" data-testid="inspector-entity-name">
              Cultivo de {inspectedFarm.cropName}
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">Parcela agrícola {sizeLabel}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right text-xs font-mono tabular-nums text-emerald-400">
              {Math.round(inspectedFarm.growth)}%
            </div>
            {collapseBtn}
          </div>
        </div>

        {!minimized && (
          <>
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Crecimiento de la siembra</span>
                <span className="font-mono tabular-nums text-slate-200">{Math.round(inspectedFarm.growth)}/100</span>
              </div>
              <div className="h-2 w-full bg-[#0b1120] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${Math.round(inspectedFarm.growth)}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDeleteFarm(inspectedFarm.id)}
              data-testid="inspector-delete-btn"
              className="w-full py-2 px-3 rounded-lg bg-rose-950/70 border border-rose-700/70 hover:bg-rose-900/70 text-rose-200 text-xs font-semibold transition-colors"
            >
              Eliminar / Matar cultivo
            </button>
          </>
        )}
      </section>
    );
  }

  if (selectedEntity?.kind === 'animal' && inspectedAnimal) {
    const statusText = inspectedAnimal.tamed
      ? 'Domesticado (Aliado)'
      : inspectedAnimal.hostile
        ? 'Salvaje Peligroso'
        : inspectedAnimal.type === 'fish'
          ? `Pez fluvial (${inspectedAnimal.fishVariant ?? 'trucha'})`
          : 'Pacífico / Ganado';
    const hpPct = clampPct((inspectedAnimal.hp / Math.max(1, inspectedAnimal.maxHp)) * 100);

    return (
      <section className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col gap-3" data-testid="inspector-panel">
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-50" data-testid="inspector-entity-name">
              {inspectedAnimal.name}
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">{ANIMAL_LABELS[inspectedAnimal.type]}</div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold ${
                inspectedAnimal.tamed
                  ? 'text-emerald-400'
                  : inspectedAnimal.hostile
                    ? 'text-rose-400'
                    : 'text-sky-300'
              }`}
            >
              {statusText}
            </span>
            {collapseBtn}
          </div>
        </div>

        {!minimized && (
          <>
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Vitalidad (PV)</span>
                <span className="font-mono tabular-nums text-slate-200">
                  {Math.round(inspectedAnimal.hp)}/{inspectedAnimal.maxHp}
                </span>
              </div>
              <div className="h-2 w-full bg-[#0b1120] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    inspectedAnimal.hostile && !inspectedAnimal.tamed ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>

            <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-2.5 text-xs flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Aporte de alimento</span>
                <span className="font-mono tabular-nums text-slate-200">+{inspectedAnimal.foodYield} comida</span>
              </div>
              {inspectedAnimal.tamed && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Domesticado por</span>
                  <span className="text-emerald-300">{inspectedAnimalOwnerName ?? 'Aldeano educado'}</span>
                </div>
              )}
              {inspectedAnimal.type === 'cow' && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Reserva de leche</span>
                  <span className="font-mono tabular-nums text-slate-200">{Math.round(inspectedAnimal.milkReady)}%</span>
                </div>
              )}
              {inspectedAnimal.type === 'sheep' && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Lana disponible</span>
                  <span className="font-mono tabular-nums text-slate-200">{Math.round(inspectedAnimal.woolReady)}%</span>
                </div>
              )}
              {inspectedAnimal.type === 'horse' && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Jinete actual</span>
                  <span className="text-slate-200">{inspectedAnimalRiderName ?? 'Caballo libre'}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDeleteAnimal(inspectedAnimal.id)}
              data-testid="inspector-delete-btn"
              className="w-full py-2 px-3 rounded-lg bg-rose-950/70 border border-rose-700/70 hover:bg-rose-900/70 text-rose-200 text-xs font-semibold transition-colors"
            >
              Matar / Eliminar animal
            </button>
          </>
        )}
      </section>
    );
  }

  if (selectedEntity?.kind === 'plaza' && inspectedPlaza) {
    return (
      <section className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col gap-3" data-testid="inspector-panel">
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-50" data-testid="inspector-entity-name">
              Plaza Central de la Aldea
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              ({Math.round(inspectedPlaza.x)}, {Math.round(inspectedPlaza.y)}) · Obra de {inspectedPlaza.builderName}
            </div>
          </div>
          {collapseBtn}
        </div>
        {!minimized && (
          <>
            <p className="bg-[#0b1120] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 leading-relaxed">
              Fuente central con faroles nocturnos y bancos de reunión comunitaria construidos por los aldeanos.
            </p>
            <button
              type="button"
              onClick={onDeletePlaza}
              data-testid="inspector-delete-btn"
              className="w-full py-2 px-3 rounded-lg bg-rose-950/70 border border-rose-700/70 hover:bg-rose-900/70 text-rose-200 text-xs font-semibold transition-colors"
            >
              Demoler / Eliminar plaza
            </button>
          </>
        )}
      </section>
    );
  }

  if (selectedEntity?.kind === 'bridge' && inspectedBridge) {
    return (
      <section className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col gap-3" data-testid="inspector-panel">
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-50" data-testid="inspector-entity-name">
              Puente Fluvial de Madera
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              X: {Math.round(inspectedBridge.x)} · Durabilidad {Math.round(inspectedBridge.durability ?? 100)}%
            </div>
          </div>
          {collapseBtn}
        </div>
        {!minimized && (
          <>
            <p className="bg-[#0b1120] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 leading-relaxed">
              Conecta la Zona Sur con la Zona Norte sobre el río y permite el paso de caravanas y aldeanos.
            </p>
            <button
              type="button"
              onClick={onDeleteBridge}
              data-testid="inspector-delete-btn"
              className="w-full py-2 px-3 rounded-lg bg-rose-950/70 border border-rose-700/70 hover:bg-rose-900/70 text-rose-200 text-xs font-semibold transition-colors"
            >
              Demoler / Eliminar puente
            </button>
          </>
        )}
      </section>
    );
  }

  if (!agent) {
    return (
      <section className="bg-[#111827] border border-slate-800 rounded-xl p-4" data-testid="inspector-panel">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold tracking-wide text-slate-400">Inspector de Aldea</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {populationCount - sickCount} sanos · {sickCount} enfermos
            </span>
            {collapseBtn}
          </div>
        </div>
        {!minimized && (
          <>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Hacé clic sobre cualquier aldeano, vivienda, edificio, cultivo o animal en el mapa para inspeccionarlo.
            </p>
            {populationCount > 0 && (
              <button
                type="button"
                onClick={onSelectFirstAgent}
                data-testid="inspect-first-agent-btn"
                className="w-full py-2 px-3 rounded-lg bg-[#0b1120] border border-slate-700 hover:border-emerald-500 text-xs font-medium text-slate-200 transition-colors"
              >
                Inspeccionar primer aldeano
              </button>
            )}
          </>
        )}
      </section>
    );
  }

  const healthInfo = getHealthStatusLabel(agent);
  const happinessLabel = getHappinessLabel(agent.happiness, agent.emotion);
  const stageLabel = agent.isChild ? 'Niño/a' : agent.isElder ? 'Anciano/a' : 'Adulto/a';
  const isFamilyHighlighted = highlightedFamilyId === agent.id;
  const educationPct = clampPct(agent.education ?? 10);
  const unlockedIds = new Set(agent.skills ?? []);

  // Oficios y maestrías (máx 3 Maestros > 70%)
  const maestroCount = countMaestroJobs(agent);
  const currentJobMastery = Math.round(agent.jobMastery?.[agent.job] ?? 0);
  const currentJobTier = getJobMasteryTierLabel(currentJobMastery);
  const trainedJobs = (Object.entries(agent.jobMastery ?? {}) as Array<[JobType, number]>)
    .filter(([, v]) => typeof v === 'number' && v > 0)
    .sort((a, b) => b[1] - a[1]);

  // Inventario simplificado en exactamente 5 categorías
  const totalRations = agent.inv.food + agent.breadCount + agent.milkCount;
  const canPine = canGatherOrTradeWood(agent, 'pine');
  const canMaple = canGatherOrTradeWood(agent, 'maple');
  const canOak = canGatherOrTradeWood(agent, 'oak');
  const totalWoods =
    agent.inv.wood +
    (canPine || agent.inv.pineWood > 0 ? agent.inv.pineWood : 0) +
    (canMaple || agent.inv.mapleWood > 0 ? agent.inv.mapleWood : 0) +
    (canOak || agent.inv.oakWood > 0 ? agent.inv.oakWood : 0);
  const totalMinerals = agent.inv.copper + agent.inv.iron + agent.inv.silver + agent.inv.gold;

  const mineralBreakdownParts: string[] = [];
  if (canGatherOrTradeMineral(agent, 'copper') || agent.inv.copper > 0) mineralBreakdownParts.push(`Cobre ${agent.inv.copper}`);
  if (canGatherOrTradeMineral(agent, 'iron') || agent.inv.iron > 0) mineralBreakdownParts.push(`Hierro ${agent.inv.iron}`);
  if (canGatherOrTradeMineral(agent, 'silver') || agent.inv.silver > 0) mineralBreakdownParts.push(`🥈 ${agent.inv.silver}`);
  if (canGatherOrTradeMineral(agent, 'gold') || agent.inv.gold > 0) mineralBreakdownParts.push(`🥇 ${agent.inv.gold}`);

  const woodBreakdownParts: string[] = [`Común ${agent.inv.wood}`];
  if (canPine || agent.inv.pineWood > 0) woodBreakdownParts.push(`Pino ${agent.inv.pineWood}`);
  if (canMaple || agent.inv.mapleWood > 0) woodBreakdownParts.push(`Arce ${agent.inv.mapleWood}`);
  if (canOak || agent.inv.oakWood > 0) woodBreakdownParts.push(`Roble ${agent.inv.oakWood}`);

  const emotionColorClass =
    happinessLabel === 'Excitación'
      ? 'text-amber-300'
      : happinessLabel === 'Depresión'
        ? 'text-slate-400'
        : agent.happiness >= 58
          ? 'text-emerald-400'
          : agent.happiness >= 40
            ? 'text-amber-300'
            : 'text-rose-400';

  return (
    <section className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col gap-3" data-testid="inspector-panel">
      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-base font-bold text-slate-50" data-testid="inspector-agent-name">
              {agent.name}
            </h2>
            {agent.isRepresentative && (
              <span className="px-1.5 py-0.5 rounded bg-violet-950/80 border border-violet-600/70 text-[10px] font-semibold text-violet-200">
                Representante
              </span>
            )}
            {agent.jailedDays > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-600/70 text-[10px] font-semibold text-rose-200">
                Detenido ({agent.jailedDays}d)
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {agent.sex === 'M' ? 'Hombre' : 'Mujer'} · {stageLabel} ·{' '}
            <span className="font-mono tabular-nums text-slate-200" data-testid="inspector-agent-age">
              {agent.ageYears} años
            </span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="text-right text-xs">
            <div className="font-semibold text-emerald-400">
              {agent.job} ({currentJobTier})
            </div>
            <div className="text-slate-400 font-mono tabular-nums">
              Imp. {agent.importance}/100 · {getRankTitle(agent.importance)}
            </div>
          </div>
          {collapseBtn}
        </div>
      </div>

      {!minimized && (
        <>
          <div className="bg-[#0b1120] border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-400">Actividad actual</span>
            <strong className="text-xs text-slate-100 font-semibold" data-testid="inspector-activity">
              {agent.activity}
              {agent.mountedHorseId !== null ? ' (A caballo)' : ''}
            </strong>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Estado de Salud</span>
                <span
                  className={`font-medium font-mono tabular-nums ${
                    agent.isSick ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                  data-testid="inspector-health"
                >
                  {healthInfo.status} ({healthInfo.levelLabel} · {Math.round(agent.health)}/100)
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#0b1120] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    agent.isSick ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.round(agent.health)}%` }}
                />
              </div>
              {agent.isSick && agent.illness && (
                <div className="text-[11px] text-rose-300" data-testid="inspector-disease">
                  {agent.illness.name} · Peligro {agent.illness.dangerPct}% (Prob. {agent.illness.baseChancePct}%)
                  {agent.illness.incurable
                    ? ` · INCURABLE (${Math.max(1, (agent.illness.fatalAfterDays ?? 12) - agent.illness.daysInfected)}d rest.)`
                    : agent.illness.fatalAfterDays
                      ? ` · Crítica (${Math.max(1, agent.illness.fatalAfterDays - agent.illness.daysInfected)}d)`
                      : ''}
                </div>
              )}
              {!agent.isSick && agent.illnessName && (
                <div className="text-[11px] text-rose-300">Cuadro: {agent.illnessName}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Estado Emocional / Felicidad</span>
                <span className={`font-medium font-mono tabular-nums ${emotionColorClass}`} data-testid="inspector-happiness">
                  {happinessLabel} ({Math.round(agent.happiness)}/100)
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#0b1120] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-200"
                  style={{ width: `${Math.round(agent.happiness)}%` }}
                />
              </div>
            </div>

            {/* Saber General (ÚNICO editable por el usuario) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Saber General ({unlockedIds.size}/25 skills)</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Quitar saber general"
                    data-testid="sub-agent-knowledge-btn"
                    onClick={() => onModifyKnowledge(agent.id, -10)}
                    className="w-5 h-5 rounded bg-slate-800 hover:bg-rose-900/70 text-slate-200 font-mono text-[11px] flex items-center justify-center transition-colors"
                  >
                    -
                  </button>
                  <span className="font-medium font-mono tabular-nums text-sky-300" data-testid="inspector-education">
                    {educationPct}%
                  </span>
                  <button
                    type="button"
                    aria-label="Agregar saber general"
                    data-testid="add-agent-knowledge-btn"
                    onClick={() => onModifyKnowledge(agent.id, 10)}
                    className="w-5 h-5 rounded bg-slate-800 hover:bg-sky-700/80 text-slate-100 font-mono text-[11px] flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="h-1.5 w-full bg-[#0b1120] rounded-full overflow-hidden">
                <div className="h-full bg-sky-400 transition-all duration-200" style={{ width: `${educationPct}%` }} />
              </div>
            </div>

            {/* Maestría en Oficios (Operario <=30, Comerciante 31-70, Maestro >70 máx 3) */}
            <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-2 flex flex-col gap-1" data-testid="job-mastery-box">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-semibold">Maestrías de Oficio</span>
                <span className="font-mono tabular-nums text-amber-300">
                  Maestros: {maestroCount}/{MAX_MAESTRO_JOBS_PER_AGENT}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {trainedJobs.length === 0 ? (
                  <span className="text-[10px] text-slate-400">
                    {agent.job}: {currentJobMastery}% ({currentJobTier})
                  </span>
                ) : (
                  trainedJobs.map(([jName, pct]) => (
                    <span
                      key={jName}
                      className={`px-1.5 py-0.5 rounded border text-[10px] font-mono ${
                        pct > 70
                          ? 'bg-amber-950/50 border-amber-700/70 text-amber-200'
                          : pct >= 31
                            ? 'bg-sky-950/50 border-sky-700/60 text-sky-200'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      {jName} {Math.round(pct)}% ({getJobMasteryTierLabel(pct)})
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Catálogo de 25 Skills */}
            <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300" data-testid="skills-summary">
                  Skills por Saber ({unlockedIds.size}/25 desbloqueadas)
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllSkills((v) => !v)}
                  data-testid="toggle-skills-list"
                  className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                >
                  {showAllSkills ? 'Ocultar lista' : 'Ver 25 skills'}
                </button>
              </div>
              {showAllSkills && (
                <div className="max-h-44 overflow-y-auto flex flex-col gap-1 pr-1" data-testid="skills-list">
                  {VILLAGE_SKILLS.map((sk) => {
                    const active = unlockedIds.has(sk.id);
                    return (
                      <div
                        key={sk.id}
                        className={`px-2 py-1 rounded border text-[11px] flex items-start justify-between gap-2 ${
                          active
                            ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-200'
                            : 'bg-[#111827] border-slate-800 text-slate-500'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{sk.name}</div>
                          <div className="text-[10px] opacity-85">{sk.description}</div>
                        </div>
                        <span className="font-mono tabular-nums shrink-0">{sk.minKnowledgePct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="bg-[#0b1120] border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between whitespace-nowrap">
                <span className="text-slate-400">Fertilidad</span>
                <strong
                  className={agent.isSterile ? 'text-amber-300' : 'text-slate-100'}
                  data-testid="inspector-fertility"
                >
                  {agent.isSterile ? 'Impotente' : 'Fértil'}
                </strong>
              </div>
              <div className="bg-[#0b1120] border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between whitespace-nowrap">
                <span className="text-slate-400">Energía</span>
                <strong className="font-mono tabular-nums text-slate-100">
                  {Math.round(agent.energy)}% · H {Math.round(agent.hunger)}%
                </strong>
              </div>
            </div>
          </div>

          {/* Inventario Simplificado en 5 Categorías */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-300">Inventario (5 categorías)</h3>
              <span className="text-[11px] text-slate-400">Modifica para alterar ánimo</span>
            </div>
            <div className="flex flex-col gap-1.5" data-testid="agent-inventory-5cats">
              {/* 1. Raciones */}
              <div className="bg-[#0b1120] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-slate-200 font-medium">Raciones (Comida)</div>
                  <div className="text-[10px] text-slate-500">
                    Nat {agent.inv.food} · Pan {agent.breadCount} · Leche {agent.milkCount}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    aria-label="Quitar Raciones"
                    onClick={() => onModifyResource(agent.id, 'food', -1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-rose-900/70 text-slate-200 font-mono text-xs flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-mono tabular-nums font-semibold text-slate-100" data-testid="inv-food">
                    {totalRations}
                  </span>
                  <button
                    type="button"
                    aria-label="Agregar Raciones"
                    onClick={() => onModifyResource(agent.id, 'food', 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-emerald-800/70 text-slate-200 font-mono text-xs flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 2. Maderas agrupadas */}
              <div className="bg-[#0b1120] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-slate-200 font-medium">Maderas</div>
                  <div className="text-[10px] text-slate-500 truncate">{woodBreakdownParts.join(' · ')}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    aria-label="Quitar Maderas"
                    onClick={() => onModifyResource(agent.id, 'wood', -1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-rose-900/70 text-slate-200 font-mono text-xs flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-mono tabular-nums font-semibold text-slate-100" data-testid="inv-wood">
                    {totalWoods}
                  </span>
                  <button
                    type="button"
                    aria-label="Agregar Maderas"
                    onClick={() => onModifyResource(agent.id, 'wood', 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-emerald-800/70 text-slate-200 font-mono text-xs flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 3. Piedra */}
              <div className="bg-[#0b1120] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-slate-200 font-medium">Piedra</div>
                  <div className="text-[10px] text-slate-500">Cantera de montaña</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    aria-label="Quitar Piedra"
                    onClick={() => onModifyResource(agent.id, 'stone', -1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-rose-900/70 text-slate-200 font-mono text-xs flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-mono tabular-nums font-semibold text-slate-100" data-testid="inv-stone">
                    {agent.inv.stone}
                  </span>
                  <button
                    type="button"
                    aria-label="Agregar Piedra"
                    onClick={() => onModifyResource(agent.id, 'stone', 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-emerald-800/70 text-slate-200 font-mono text-xs flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 4. Minerales agrupados (Cobre, Hierro, Plata, Oro) */}
              <div className="bg-[#0b1120] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-slate-200 font-medium">Minerales</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {mineralBreakdownParts.length > 0 ? mineralBreakdownParts.join(' · ') : 'Requiere skill minera'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      aria-label="Tipo de mineral"
                      value={selectedMineralKey}
                      onChange={(e) => setSelectedMineralKey(e.target.value as 'copper' | 'iron' | 'silver' | 'gold')}
                      className="bg-[#111827] border border-slate-700 rounded px-1 py-0.5 text-[10px] text-slate-200"
                    >
                      <option value="copper">Cobre</option>
                      <option value="iron">Hierro</option>
                      <option value="silver">Plata 🥈</option>
                      <option value="gold">Oro 🥇</option>
                    </select>
                    <button
                      type="button"
                      aria-label="Quitar Mineral"
                      onClick={() => onModifyResource(agent.id, selectedMineralKey, -1)}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-rose-900/70 text-slate-200 font-mono text-xs flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-7 text-center font-mono tabular-nums font-semibold text-slate-100" data-testid="inv-minerals">
                      {totalMinerals}
                    </span>
                    <button
                      type="button"
                      aria-label="Agregar Mineral"
                      onClick={() => onModifyResource(agent.id, selectedMineralKey, 1)}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-emerald-800/70 text-slate-200 font-mono text-xs flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Monedas */}
              <div className="bg-[#0b1120] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-amber-300 font-medium">Monedas</div>
                  <div className="text-[10px] text-slate-500">
                    {agent.loanDebt > 0 ? `Deuda bancaria: ${agent.loanDebt} mon.` : 'Respaldadas en Oro/Plata'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    aria-label="Quitar Monedas"
                    onClick={() => onModifyResource(agent.id, 'coins', -1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-rose-900/70 text-slate-200 font-mono text-xs flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-mono tabular-nums font-semibold text-amber-300" data-testid="inv-coins">
                    {agent.coins}
                  </span>
                  <button
                    type="button"
                    aria-label="Agregar Monedas"
                    onClick={() => onModifyResource(agent.id, 'coins', 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-emerald-800/70 text-slate-200 font-mono text-xs flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-2 bg-[#0b1120] border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 font-mono tabular-nums flex items-center justify-between gap-2 flex-wrap">
              <span>Herram.: {agent.toolsCount} · Med.: {agent.medicineCount}</span>
              <button
                type="button"
                disabled={educationPct < 36}
                onClick={() => onCraftTools(agent.id)}
                className="px-2 py-0.5 rounded bg-amber-900/50 hover:bg-amber-800/70 disabled:opacity-40 border border-amber-700/60 text-amber-200 text-[10px] font-sans font-medium"
              >
                Forjar herramienta (36%+)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-300 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Vivienda</span>
              <span className={agentHouse ? 'text-slate-200' : 'text-rose-300 font-medium'}>
                {agentHouse
                  ? `${agentHouse.name} (${HOUSE_SIZE_LABELS[agentHouse.size ?? 'medium']} · ${HOUSE_LEVEL_LABELS[agentHouse.level]})`
                  : 'Sin casa (NO puede descansar)'}
              </span>
            </div>
            {agentHouse && (
              <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-2 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Baúl de {agentHouse.name}</span>
                  <button
                    type="button"
                    onClick={() => onStoreInHouse(agent.id)}
                    className="text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Guardar en casa / Depósito
                  </button>
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-200" data-testid="house-storage-summary">
                  Alimento {agentHouse.storage.food} · {agentHouse.storage.coins} mon. (materiales en Depósito General)
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Pareja / Hijos</span>
              <span>
                {partnerName ?? 'Soltero/a'} · {agent.childrenCount} hijo(s)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Libre albedrío / Gestación</span>
              <span className="text-slate-200">
                {agent.pregnancy
                  ? `Embarazo (${3 - agent.pregnancy.daysRemaining}/3 días)`
                  : agent.wantsChildren
                    ? 'Desea hijos (20+a)'
                    : 'Eligió no tener hijos'}
              </span>
            </div>
            {mentorName && (
              <div className="flex justify-between">
                <span className="text-slate-400">Maestro mentor</span>
                <span className="text-sky-300">{mentorName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Linaje</span>
              <span>{agent.parents ?? 'Fundador de la aldea'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-300 mb-2">Opciones de Jugador</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onCure(agent.id)}
                className="py-2 px-2.5 rounded-lg bg-emerald-950/70 border border-emerald-700/60 hover:bg-emerald-900/70 text-emerald-200 text-xs font-medium transition-colors"
              >
                Curar aldeano
              </button>
              <button
                type="button"
                onClick={() => onInfect(agent.id)}
                className="py-2 px-2.5 rounded-lg bg-amber-950/60 border border-amber-700/60 hover:bg-amber-900/70 text-amber-200 text-xs font-medium transition-colors"
              >
                Enfermar aldeano
              </button>
              <button
                type="button"
                onClick={() => onToggleSterile(agent.id)}
                className="py-2 px-2.5 rounded-lg bg-[#0b1120] border border-slate-700 hover:border-violet-500 text-slate-200 text-xs font-medium transition-colors"
              >
                {agent.isSterile ? 'Restaurar fertilidad' : 'Hacer impotente'}
              </button>
              <button
                type="button"
                onClick={() => onKill(agent.id)}
                data-testid="inspector-delete-btn"
                className="py-2 px-2.5 rounded-lg bg-rose-950/70 border border-rose-700/60 hover:bg-rose-900/70 text-rose-200 text-xs font-medium transition-colors"
              >
                Matar aldeano
              </button>
              <button
                type="button"
                onClick={() => onSwitchPartner(agent.id)}
                className="py-2 px-2.5 rounded-lg bg-[#0b1120] border border-slate-700 hover:border-pink-500 text-pink-200 text-xs font-medium transition-colors"
              >
                {agent.partnerId ? 'Cambiar de pareja' : 'Buscar pareja'}
              </button>
              <button
                type="button"
                onClick={() => onModifyKnowledge(agent.id, 15)}
                data-testid="btn-add-individual-knowledge"
                className="py-2 px-2.5 rounded-lg bg-sky-950/70 border border-sky-700/60 hover:bg-sky-900/70 text-sky-200 text-xs font-medium transition-colors"
              >
                +15 Saber General
              </button>
              <button
                type="button"
                onClick={() => onHighlightFamily(isFamilyHighlighted ? null : agent.id)}
                className={`col-span-2 py-2 px-2.5 rounded-lg border text-xs font-medium transition-colors ${
                  isFamilyHighlighted
                    ? 'bg-sky-950/70 border-sky-500 text-sky-200'
                    : 'bg-[#0b1120] border-slate-700 hover:border-sky-500 text-slate-200'
                }`}
              >
                {isFamilyHighlighted ? 'Ocultar familia' : 'Resaltar familia'}
              </button>
            </div>
          </div>

          <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5">
            <div className="text-[11px] text-slate-400">Agente Principal Qwen 2.5</div>
            <div className="text-[11px] text-slate-200">
              Plan actual: <strong className="text-emerald-300">{agent.qwenPlan}</strong>
            </div>
            <p className="text-xs text-slate-200 italic leading-relaxed" data-testid="inspector-thought">
              "{agent.thought}"
            </p>
            {agent.lastQwenDecision && (
              <div
                className="pt-1.5 border-t border-slate-800 text-[11px] text-emerald-300"
                data-testid="inspector-qwen-decision"
              >
                Decisión Qwen 2.5: {agent.lastQwenDecision}
              </div>
            )}
            {agent.lastDialogue && (
              <div className="pt-1.5 border-t border-slate-800 text-[11px] text-sky-300">
                Último diálogo: {agent.lastDialogue}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function clampPct(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}
