import type {
  Agent,
  Animal,
  AnimalType,
  BankLoan,
  BiomeType,
  DaySnapshot,
  DiseaseId,
  DiseaseInfo,
  EmotionType,
  EraId,
  FarmPlot,
  FireHazard,
  FishVariant,
  House,
  HouseStorage,
  JobMasteryTier,
  JobType,
  LogEntry,
  QwenAction,
  QwenPolicyState,
  ResourceInventory,
  RoadTile,
  SeasonType,
  SimulationState,
  SkillDefinition,
  SpecialBuilding,
  SpecialBuildingType,
  TaskType,
  VillageLaw,
  VillageLawId,
  VillagePetition,
  WeatherType,
  WoodGrade,
} from '../types/simulation';

export const CANVAS_WIDTH = 1440;
export const CANVAS_HEIGHT = 960;
export const WORLD_CENTER_X = 720;
export const WORLD_CENTER_Y = 480;

// Geografía del mapa: Bosque a la Izquierda, Montañas a la Derecha, Valle central + Río superior
export const FOREST_MAX_X = 330;
export const MOUNTAIN_MIN_X = 1110;

// Río superior que divide Zona Norte (y=24..128) y Zona Sur (y=224..928) unidos por puente
export const RIVER_TOP_Y = 148;
export const RIVER_BOTTOM_Y = 206;
export const NORTH_LAND_MIN_Y = 24;
export const NORTH_LAND_MAX_Y = 128;
export const SAFE_LAND_MIN_Y = 224;
export const BRIDGE_X_MIN = 684;
export const BRIDGE_X_MAX = 756;
export const BRIDGE_CENTER_X = 720;
export const BRIDGE_HALF_WIDTH = 36;
export const ROAD_GRID_SIZE = 24;

// Duraciones por velocidad
export const SPEED_TIMINGS: Record<
  1 | 2 | 4,
  { daySeconds: number; nightSeconds: number; dayLabel: string; nightLabel: string }
> = {
  1: { daySeconds: 420, nightSeconds: 180, dayLabel: '7m', nightLabel: '3m' },
  2: { daySeconds: 300, nightSeconds: 90, dayLabel: '5m', nightLabel: '1.5m' },
  4: { daySeconds: 150, nightSeconds: 60, dayLabel: '2.5m', nightLabel: '1m' },
};

export const DAY_DURATION_SECONDS = SPEED_TIMINGS[1].daySeconds;
export const NIGHT_DURATION_SECONDS = SPEED_TIMINGS[1].nightSeconds;
export const DAY_START_MINUTE = 360;
export const NIGHT_START_MINUTE = 1200;
export const DAY_GAME_MINUTES = NIGHT_START_MINUTE - DAY_START_MINUTE; // 840
export const NIGHT_GAME_MINUTES = 1440 - DAY_GAME_MINUTES; // 600

// Calendario: 30 días por estación, 120 días por año completo
export const DAYS_PER_SEASON = 30;
export const DAYS_PER_YEAR = 120;
export const PREGNANCY_DAYS = 3;
export const PETITION_INTERVAL_SECONDS = 1800; // 30 minutos reales

// Edades exactas
export const AGE_CHILD_MAX_YEARS = 5;
export const AGE_PARTNER_MIN_YEARS = 15;
export const AGE_ADULT_YEARS = 18;
export const AGE_REPRODUCE_MIN_YEARS = 20;
export const AGE_ELDER_YEARS = 60;

// Capacidades exactas de casas según tamaño
export const HOUSE_SIZE_CAPACITIES: Record<House['size'], number> = {
  small: 4,
  medium: 6,
  large: 8,
};

export const GOLD_COIN_BACKING = 25;
export const SILVER_COIN_BACKING = 10;

export const MAX_MAESTRO_JOBS_PER_AGENT = 3;

export const WOOD_GRADE_CONFIG: Record<
  WoodGrade,
  {
    label: string;
    invKey: 'pineWood' | 'mapleWood' | 'oakWood';
    nodeType: 'pine_wood' | 'maple_wood' | 'oak_wood';
    skillId: string;
    price: number;
    minCarpentryPct: number;
  }
> = {
  pine: {
    label: 'Pino',
    invKey: 'pineWood',
    nodeType: 'pine_wood',
    skillId: 'carpinteria_pino',
    price: 2,
    minCarpentryPct: 10,
  },
  maple: {
    label: 'Arce',
    invKey: 'mapleWood',
    nodeType: 'maple_wood',
    skillId: 'carpinteria_arce',
    price: 5,
    minCarpentryPct: 50,
  },
  oak: {
    label: 'Roble',
    invKey: 'oakWood',
    nodeType: 'oak_wood',
    skillId: 'ebanisteria_roble',
    price: 10,
    minCarpentryPct: 80,
  },
};

export const VILLAGE_SKILLS: SkillDefinition[] = [
  { id: 'recoleccion', minKnowledgePct: 4, name: 'Recolección Eficaz', description: 'Aumenta el rendimiento al juntar alimentos y leña.' },
  { id: 'mineria_cobre', minKnowledgePct: 8, name: 'Minería y Venta de Cobre', description: 'Permite extraer y comerciar vetas de Cobre.' },
  { id: 'carpinteria_pino', minKnowledgePct: 12, name: 'Corte y Venta en Pino', description: 'Carpinteros con 10%+ cortan, comercian y construyen con Pino.' },
  { id: 'primeros_auxilios', minKnowledgePct: 16, name: 'Primeros Auxilios', description: 'Reduce el impacto de heridas y fatiga.' },
  { id: 'pesca_fluvial', minKnowledgePct: 20, name: 'Pesca Fluvial', description: 'Mejora la captura sostenible de peces del río.' },
  { id: 'mineria_hierro', minKnowledgePct: 24, name: 'Minería y Venta de Hierro', description: 'Permite extraer y vender mineral de Hierro.' },
  { id: 'albanileria', minKnowledgePct: 28, name: 'Albañilería Básica', description: 'Optimiza el uso de piedra en cimientos y reparaciones.' },
  { id: 'comercio_justo', minKnowledgePct: 32, name: 'Comercio Justo', description: 'Mejora márgenes en Mercado, Panadería y Muelle.' },
  { id: 'forja_herramientas', minKnowledgePct: 36, name: 'Fabricación de Herramientas', description: 'Permite crear herramientas con hierro, cobre o madera.' },
  { id: 'doma_salvaje', minKnowledgePct: 40, name: 'Doma de Bestias Salvajes', description: 'Permite domesticar osos y gatos salvajes.' },
  { id: 'siembra_avanzada', minKnowledgePct: 44, name: 'Siembra Avanzada', description: 'Acelera la maduración y cosecha de cultivos.' },
  { id: 'carpinteria_arce', minKnowledgePct: 48, name: 'Carpintería y Venta en Arce', description: 'Carpinteros con 50%+ cortan, comercian y construyen con Arce.' },
  { id: 'alquimia_botica', minKnowledgePct: 52, name: 'Botánica y Remedios', description: 'Elabora medicinas eficaces contra enfermedades.' },
  { id: 'banca_metalica', minKnowledgePct: 56, name: 'Banca y Respaldo Metálico', description: 'Administra el Banco, préstamos y respaldo en Oro y Plata.' },
  { id: 'logistica_caravanas', minKnowledgePct: 60, name: 'Logística de Caravanas', description: 'Coordina caravanas a caballo entre Sur, Bosque y Norte.' },
  { id: 'mineria_plata', minKnowledgePct: 64, name: 'Prospección y Venta de Plata 🥈', description: 'Extrae y comercia Plata de las montañas derechas.' },
  { id: 'ingenieria_puentes', minKnowledgePct: 68, name: 'Ingeniería Vial y Puentes', description: 'Construye puentes, caminos iluminados y muelles sólidos.' },
  { id: 'medicina_clinica', minKnowledgePct: 72, name: 'Medicina Clínica', description: 'Acelera curaciones de cuadros graves en el Hospital.' },
  { id: 'bomberos_civiles', minKnowledgePct: 76, name: 'Prevención y Combate de Incendios', description: 'Extingue incendios causados por tormentas o accidentes.' },
  { id: 'ebanisteria_roble', minKnowledgePct: 80, name: 'Ebanistería y Venta en Roble', description: 'Carpinteros con 80%+ cortan, comercian y construyen con Roble.' },
  { id: 'prospeccion_oro', minKnowledgePct: 84, name: 'Prospección y Venta de Oro 🥇', description: 'Extrae y comercia vetas de Oro de alta pureza.' },
  { id: 'arquitectura_monumental', minKnowledgePct: 88, name: 'Arquitectura Monumental', description: 'Levanta viviendas Grandes y edificios de alto nivel.' },
  { id: 'legislacion_civica', minKnowledgePct: 92, name: 'Legislación y Orden Público', description: 'Optimiza el Ayuntamiento, Comisaría y leyes emergentes.' },
  { id: 'estrategia_qwen', minKnowledgePct: 96, name: 'Estrategia Evolutiva Qwen 2.5', description: 'Coordina decisiones colectivas de la especie.' },
  { id: 'maestria_civilizacion', minKnowledgePct: 100, name: 'Maestría de Civilización', description: 'Cumbre científica y productiva del simulador.' },
];

export interface DiseaseCatalogEntry {
  id: DiseaseId;
  name: string;
  dangerPct: number;
  baseChancePct: number;
  incurable: boolean;
  minFatalDays: number | null;
  maxFatalDays: number | null;
  cureDifficulty: number;
}

export const DISEASE_CATALOG: Record<DiseaseId, DiseaseCatalogEntry> = {
  gripe: {
    id: 'gripe',
    name: 'Gripe',
    dangerPct: 25,
    baseChancePct: 70,
    incurable: false,
    minFatalDays: null,
    maxFatalDays: null,
    cureDifficulty: 1,
  },
  dolor_estomacal: {
    id: 'dolor_estomacal',
    name: 'Dolor Estomacal',
    dangerPct: 40,
    baseChancePct: 55,
    incurable: false,
    minFatalDays: null,
    maxFatalDays: null,
    cureDifficulty: 2,
  },
  pulmonia: {
    id: 'pulmonia',
    name: 'Pulmonía',
    dangerPct: 55,
    baseChancePct: 45,
    incurable: false,
    minFatalDays: 6,
    maxFatalDays: 9,
    cureDifficulty: 2.5,
  },
  sepsis: {
    id: 'sepsis',
    name: 'Sepsis',
    dangerPct: 80,
    baseChancePct: 20,
    incurable: false,
    minFatalDays: 3,
    maxFatalDays: 5,
    cureDifficulty: 3.5,
  },
  cancer: {
    id: 'cancer',
    name: 'Cáncer',
    dangerPct: 100,
    baseChancePct: 1,
    incurable: true,
    minFatalDays: 10,
    maxFatalDays: 15,
    cureDifficulty: 99,
  },
};

export const VILLAGE_LAWS_CATALOG: Array<Omit<VillageLaw, 'active' | 'enactedDay'>> = [
  {
    id: 'ban_trade_wood',
    name: 'Veda Forestal (Prohibir comercio de madera)',
    description: 'Prohíbe vender madera al mercado; infractores pueden ser detenidos si hay Comisaría y Cárcel.',
    proposedBy: 'Consejo de Ancianos',
  },
  {
    id: 'ban_fishing',
    name: 'Veda Fluvial (Prohibir pesca)',
    description: 'Prohíbe pescar en el río para recuperar el cardumen.',
    proposedBy: 'Consejo de Ancianos',
  },
  {
    id: 'ban_trade_bread',
    name: 'Reserva Alimentaria (Prohibir venta de pan)',
    description: 'Prohíbe vender pan por lucro durante crisis alimentarias.',
    proposedBy: 'Ayuntamiento / Qwen 2.5',
  },
  {
    id: 'ban_mine_gold',
    name: 'Moratoria Aurífera (Prohibir minería de Oro)',
    description: 'Suspende la extracción privada de Oro en la montaña.',
    proposedBy: 'Banco Central',
  },
  {
    id: 'winter_rationing',
    name: 'Racionamiento Invernal',
    description: 'Prioriza reservas de comida en casas y reduce derroche.',
    proposedBy: 'Consejo de Ancianos',
  },
  {
    id: 'night_watch',
    name: 'Guardia Nocturna',
    description: 'Refuerza patrullaje de Comisario y Guardián contra bestias e incendios.',
    proposedBy: 'Comisaría',
  },
  {
    id: 'mining_priority',
    name: 'Prioridad Minera',
    description: 'Incentiva extracción de Cobre, Hierro y Plata para la economía.',
    proposedBy: 'Consejo de Ancianos',
  },
];

export const SEASONS: SeasonType[] = ['Primavera', 'Verano', 'Otoño', 'Invierno'];
export const FISH_VARIANTS: FishVariant[] = ['trout', 'salmon', 'goldfish', 'catfish'];

export const ERA_METADATA: Record<
  EraId,
  { label: string; minKnowledge: number; minHouses: number; maxHouseLevel: 1 | 2 | 3 | 4 }
> = {
  primitive: { label: 'Era Primitiva', minKnowledge: 0, minHouses: 0, maxHouseLevel: 1 },
  stone: { label: 'Edad de Piedra', minKnowledge: 30, minHouses: 2, maxHouseLevel: 2 },
  wood: { label: 'Edad de Carpintería', minKnowledge: 85, minHouses: 4, maxHouseLevel: 3 },
  iron: { label: 'Edad de Hierro', minKnowledge: 170, minHouses: 6, maxHouseLevel: 4 },
  civilization: { label: 'Edad de Civilización', minKnowledge: 300, minHouses: 8, maxHouseLevel: 4 },
};

export const HOUSE_LEVEL_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Choza Básica',
  2: 'Casa de Madera',
  3: 'Casa de Piedra',
  4: 'Taller de Hierro',
};

export const SPECIAL_BUILDING_LABELS: Record<
  SpecialBuildingType,
  { label: string; short: string; category: SpecialBuilding['category']; basePrice: number }
> = {
  infirmary: { label: 'Hospital', short: 'HOS', category: 'hospital', basePrice: 80 },
  school: { label: 'Escuela', short: 'ESC', category: 'school', basePrice: 70 },
  bank: { label: 'Banco Central', short: 'BCO', category: 'commerce', basePrice: 120 },
  market: { label: 'Mercado Central', short: 'MER', category: 'commerce', basePrice: 65 },
  bakery: { label: 'Panadería', short: 'PAN', category: 'commerce', basePrice: 45 },
  carpentry: { label: 'Carpintería', short: 'CAR', category: 'commerce', basePrice: 55 },
  forge: { label: 'Herrería / Forja', short: 'FOR', category: 'commerce', basePrice: 65 },
  apothecary: { label: 'Botica', short: 'BOT', category: 'commerce', basePrice: 50 },
  dock: { label: 'Muelle Fluvial', short: 'MUE', category: 'commerce', basePrice: 45 },
  general_depot: { label: 'Depósito General', short: 'DEP', category: 'depot', basePrice: 60 },
  town_hall: { label: 'Ayuntamiento', short: 'AYU', category: 'civic', basePrice: 110 },
  police_station: { label: 'Comisaría', short: 'COM', category: 'civic', basePrice: 75 },
  prison: { label: 'Cárcel', short: 'CARC', category: 'civic', basePrice: 75 },
};

export const SPECIAL_BUILDING_STAFF_JOBS: Record<SpecialBuildingType, JobType[]> = {
  infirmary: ['Curandero'],
  school: ['Maestro', 'Erudito'],
  bank: ['Banquero'],
  market: ['Comerciante'],
  bakery: ['Panadero'],
  carpentry: ['Carpintero'],
  forge: ['Herrero', 'Artesano'],
  apothecary: ['Boticario'],
  dock: ['Pescador'],
  general_depot: ['Almacenero'],
  town_hall: ['Alcalde'],
  police_station: ['Comisario', 'Guardián'],
  prison: ['Comisario', 'Guardián'],
};

export const SPECIAL_BUILDING_ALLOWED_STORAGE: Record<SpecialBuildingType, Array<keyof HouseStorage>> = {
  dock: ['food', 'coins'],
  bakery: ['food', 'bread', 'coins'],
  market: [
    'food',
    'wood',
    'pineWood',
    'mapleWood',
    'oakWood',
    'stone',
    'copper',
    'iron',
    'gold',
    'silver',
    'milk',
    'bread',
    'tools',
    'medicine',
    'coins',
  ],
  bank: ['gold', 'silver', 'coins'],
  carpentry: ['wood', 'pineWood', 'mapleWood', 'oakWood', 'tools', 'coins'],
  forge: ['copper', 'iron', 'tools', 'coins'],
  apothecary: ['food', 'medicine', 'coins'],
  infirmary: ['medicine', 'food', 'coins'],
  school: ['coins'],
  town_hall: ['coins'],
  police_station: ['tools', 'coins'],
  prison: ['food', 'coins'],
  general_depot: [
    'food',
    'wood',
    'pineWood',
    'mapleWood',
    'oakWood',
    'stone',
    'copper',
    'iron',
    'gold',
    'silver',
    'milk',
    'bread',
    'tools',
    'medicine',
    'coins',
  ],
};

export const HOUSE_ALLOWED_STORAGE: Array<keyof HouseStorage> = ['food', 'coins'];

export const ANIMAL_LABELS: Record<AnimalType, string> = {
  cat: 'Gato doméstico',
  dog: 'Perro guardián',
  wildcat: 'Gato salvaje (Peligro)',
  bear: 'Oso pardo (Peligro)',
  fish: 'Pez de río',
  chicken: 'Gallina',
  cow: 'Vaca lechera',
  horse: 'Caballo (Transporte)',
  sheep: 'Oveja (Lana/Abrigo)',
};

export const ILLNESS_NAMES = ['Gripe', 'Dolor Estomacal', 'Pulmonía', 'Sepsis', 'Cáncer'];

const MALE_BABY_NAMES = [
  'Mateo',
  'Lucas',
  'Thiago',
  'Bruno',
  'Gael',
  'Dante',
  'Leo',
  'Simón',
  'Ian',
  'Hugo',
  'Joaquín',
  'Bautista',
  'Valentín',
  'Lorenzo',
  'Emiliano',
  'Nicolás',
];

const FEMALE_BABY_NAMES = [
  'Luna',
  'Sofía',
  'Alma',
  'Mía',
  'Vera',
  'Nina',
  'Clara',
  'Zoe',
  'Elena',
  'Sara',
  'Catalina',
  'Renata',
  'Camila',
  'Isabella',
  'Julieta',
  'Amparo',
];

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function isNightMinute(minute: number): boolean {
  const m = ((minute % 1440) + 1440) % 1440;
  return m < DAY_START_MINUTE || m >= NIGHT_START_MINUTE;
}

export function getTerrainZoneAt(x: number): 'forest' | 'valley' | 'mountain' {
  if (x <= FOREST_MAX_X) return 'forest';
  if (x >= MOUNTAIN_MIN_X) return 'mountain';
  return 'valley';
}

export function isPointInRiverWater(
  x: number,
  y: number,
  bridgeX: number | null = BRIDGE_CENTER_X
): boolean {
  if (y < RIVER_TOP_Y - 6 || y > RIVER_BOTTOM_Y + 6) return false;
  if (bridgeX !== null && Math.abs(x - bridgeX) <= BRIDGE_HALF_WIDTH) return false;
  return true;
}

export function computeSeason(day: number): SeasonType {
  const idx = Math.floor((Math.max(1, day) - 1) / DAYS_PER_SEASON) % SEASONS.length;
  return SEASONS[idx];
}

export function getSeasonBiomeAndWeather(season: SeasonType): { biome: BiomeType; weather: WeatherType } {
  switch (season) {
    case 'Primavera':
      return { biome: 'grassland', weather: 'sunny' };
    case 'Verano':
      return { biome: 'arid', weather: 'sunny' };
    case 'Otoño':
      return { biome: 'forest', weather: 'rain' };
    case 'Invierno':
      return { biome: 'tundra', weather: 'storm' };
  }
}

export function computeUnlockedSkills(educationPct: number): SkillDefinition[] {
  return VILLAGE_SKILLS.filter((s) => educationPct >= s.minKnowledgePct);
}

export function syncAgentSkills(agent: Agent): string[] {
  const unlocked = computeUnlockedSkills(agent.education).map((s) => s.id);
  agent.skills = unlocked;
  return unlocked;
}

export function getJobMasteryTier(pct: number): JobMasteryTier {
  if (pct > 70) return 'maestro';
  if (pct >= 31) return 'comerciante';
  return 'operario';
}

export function getJobMasteryTierLabel(pct: number): string {
  const tier = getJobMasteryTier(pct);
  if (tier === 'maestro') return 'Maestro';
  if (tier === 'comerciante') return 'Comerciante';
  return 'Operario';
}

export function countMaestroJobs(agent: Pick<Agent, 'jobMastery'>): number {
  return Object.values(agent.jobMastery ?? {}).filter((v) => typeof v === 'number' && v > 70).length;
}

export function advanceJobMastery(agent: Agent, job: JobType, delta: number): number {
  if (!agent.jobMastery) agent.jobMastery = {};
  const current = agent.jobMastery[job] ?? 0;
  let next = clamp(current + delta, 0, 100);
  if (current <= 70 && next > 70) {
    const otherMaestros = Object.entries(agent.jobMastery).filter(
      ([k, v]) => k !== job && typeof v === 'number' && v > 70
    ).length;
    if (otherMaestros >= MAX_MAESTRO_JOBS_PER_AGENT) {
      next = 70;
    }
  }
  agent.jobMastery[job] = Math.round(next * 10) / 10;
  return agent.jobMastery[job]!;
}

export function canCarpenterUseWood(agent: Pick<Agent, 'job' | 'carpentryKnowledge' | 'skills'>, grade: WoodGrade): boolean {
  if (agent.job !== 'Carpintero') return false;
  return (
    agent.carpentryKnowledge >= WOOD_GRADE_CONFIG[grade].minCarpentryPct ||
    agent.skills.includes(WOOD_GRADE_CONFIG[grade].skillId)
  );
}

export function canGatherOrTradeWood(
  agent: Pick<Agent, 'job' | 'carpentryKnowledge' | 'skills' | 'jobMastery'>,
  grade: WoodGrade
): boolean {
  const cfg = WOOD_GRADE_CONFIG[grade];
  const hasSkill = agent.skills.includes(cfg.skillId);
  const hasCarpentry = agent.carpentryKnowledge >= cfg.minCarpentryPct;
  return hasSkill || (agent.job === 'Carpintero' && hasCarpentry);
}

export function canGatherOrTradeMineral(
  agent: Pick<Agent, 'skills' | 'job' | 'education'>,
  mineral: 'copper' | 'iron' | 'silver' | 'gold'
): boolean {
  switch (mineral) {
    case 'copper':
      return agent.skills.includes('mineria_cobre');
    case 'iron':
      return agent.skills.includes('mineria_hierro');
    case 'silver':
      return agent.skills.includes('mineria_plata');
    case 'gold':
      return agent.skills.includes('prospeccion_oro');
  }
}

export function canAgentRest(agent: Pick<Agent, 'houseId'>): boolean {
  return agent.houseId !== null;
}

export function createDefaultLaws(): VillageLaw[] {
  return VILLAGE_LAWS_CATALOG.map((law) => ({
    ...law,
    active: false,
    enactedDay: null,
  }));
}

export function isLawActive(state: Pick<SimulationState, 'laws'>, lawId: VillageLawId): boolean {
  return state.laws.some((l) => l.id === lawId && l.active);
}

export function toggleVillageLaw(
  state: SimulationState,
  lawId: VillageLawId,
  active?: boolean,
  proposer = 'Jugador / Qwen 2.5'
): VillageLaw | null {
  const law = state.laws.find((l) => l.id === lawId);
  if (!law) return null;
  const nextActive = active !== undefined ? active : !law.active;
  if (law.active === nextActive) return law;
  law.active = nextActive;
  law.proposedBy = proposer;
  law.enactedDay = nextActive ? state.day : null;
  addLog(
    state,
    `${nextActive ? 'Ley promulgada' : 'Ley derogada'}: ${law.name} (${proposer}).`,
    nextActive ? 'violet' : 'slate'
  );
  return law;
}

export function computeEra(knowledge: number, houses: House[]): EraId {
  const houseCount = houses.length;
  if (knowledge >= ERA_METADATA.civilization.minKnowledge && houseCount >= ERA_METADATA.civilization.minHouses) {
    return 'civilization';
  }
  if (knowledge >= ERA_METADATA.iron.minKnowledge && houseCount >= ERA_METADATA.iron.minHouses) {
    return 'iron';
  }
  if (knowledge >= ERA_METADATA.wood.minKnowledge && houseCount >= ERA_METADATA.wood.minHouses) {
    return 'wood';
  }
  if (knowledge >= ERA_METADATA.stone.minKnowledge && houseCount >= ERA_METADATA.stone.minHouses) {
    return 'stone';
  }
  return 'primitive';
}

export function getHealthStatusLabel(agent: Pick<Agent, 'health' | 'isSick'>): {
  status: 'Sano' | 'Enfermo';
  levelLabel: 'Óptima' | 'Estable' | 'Delicada' | 'Crítica';
} {
  const status = agent.isSick ? 'Enfermo' : 'Sano';
  if (agent.health >= 80) return { status, levelLabel: 'Óptima' };
  if (agent.health >= 50) return { status, levelLabel: 'Estable' };
  if (agent.health >= 25) return { status, levelLabel: 'Delicada' };
  return { status, levelLabel: 'Crítica' };
}

export function getHappinessLabel(happiness: number, emotion?: EmotionType): string {
  if (emotion === 'depressed' || happiness < 22) return 'Depresión';
  if (emotion === 'excited' || happiness >= 88) return 'Excitación';
  if (happiness >= 75) return 'Feliz';
  if (happiness >= 58) return 'Contento';
  if (happiness >= 40) return 'Neutral';
  return 'Infeliz';
}

export function getEmotionWorkMultiplier(emotion: EmotionType): number {
  switch (emotion) {
    case 'excited':
      return 1.38;
    case 'happy':
    case 'love':
      return 1.12;
    case 'depressed':
      return 0.65;
    case 'sad':
      return 0.85;
    case 'sick':
      return 0.5;
    default:
      return 1;
  }
}

export function computeAgentHappiness(
  agent: Agent,
  weather: SimulationState['weather'],
  policy: QwenPolicyState,
  season: SeasonType = 'Primavera',
  hasNearbyPet = false,
  isLitNight = false
): number {
  let score = 62;
  score -= Math.max(0, agent.hunger - 30) * 0.45;
  score -= Math.max(0, 35 - agent.energy) * 0.4;
  score -= Math.max(0, 80 - agent.health) * 0.55;
  if (agent.isSick) score -= 18;
  if (agent.houseId !== null) score += 10;
  else score -= 12;
  if (agent.partnerId !== null) score += 8;
  if (agent.jailedDays > 0) score -= 22;
  if (agent.inv.food >= 2 || agent.breadCount > 0) score += 5;
  if (agent.coins >= 15) score += 4;
  if (agent.isSterile) score -= 6;
  if (hasNearbyPet) score += 5;
  if (isLitNight) score += 4;
  if (weather === 'storm' || weather === 'thunderstorm' || weather === 'drought') score -= 8;
  if (season === 'Invierno' && agent.houseId === null) score -= 9;
  if (policy.moodDirective === 'optimistic') score += 12;
  if (policy.moodDirective === 'disciplined') score += 3;
  score += agent.moodModifier;
  return Math.round(clamp(score, 0, 100));
}

export function deriveAgentEmotion(agent: Agent, weather: SimulationState['weather']): EmotionType {
  if (agent.isSick || agent.health < 35) return 'sick';
  if ((weather === 'storm' || weather === 'thunderstorm') && agent.houseId === null) return 'scared';
  if (agent.happiness < 22) return 'depressed';
  if (agent.happiness >= 86 || (agent.happiness >= 74 && agent.moodModifier >= 12)) return 'excited';
  if (agent.happiness >= 75) return agent.partnerId && agent.talkingTimer > 0 ? 'love' : 'happy';
  if (agent.happiness >= 55) return 'content';
  if (agent.happiness >= 38) return 'neutral';
  return 'sad';
}

export function computeAgentImportance(agent: Agent): number {
  const socialBonus = (agent.partnerId ? 10 : 0) + agent.childrenCount * 6;
  const resourceBonus =
    (agent.inv.wood +
      agent.inv.pineWood +
      agent.inv.mapleWood * 2 +
      agent.inv.oakWood * 3 +
      agent.inv.stone +
      agent.inv.copper +
      agent.inv.iron * 2 +
      agent.inv.silver * 3 +
      agent.inv.gold * 5 +
      agent.toolsCount * 2) *
    2;
  const roleBonus =
    agent.job === 'Alcalde'
      ? 24
      : agent.job === 'Comisario' ||
          agent.job === 'Banquero' ||
          agent.job === 'Maestro' ||
          agent.job === 'Erudito' ||
          agent.job === 'Curandero'
        ? 16
        : agent.job !== 'Recolector' && agent.job !== 'Aprendiz'
          ? 12
          : 6;
  const saberBonus = Math.round(agent.education * 0.25);
  const elderBonus = agent.isElder ? 10 : 0;
  return Math.round(clamp(10 + socialBonus + resourceBonus + roleBonus + saberBonus + elderBonus, 0, 100));
}

export function getRankTitle(score: number): string {
  if (score >= 80) return 'Referente Mayor';
  if (score >= 55) return 'Líder de Oficio';
  if (score >= 30) return 'Vecino Activo';
  return 'Habitante';
}

export function getConciseTaskLabel(taskType: TaskType): string {
  switch (taskType) {
    case 'eat':
      return 'Comiendo ración';
    case 'sleep':
      return 'Descansando en casa';
    case 'gather_food':
      return 'Recolectando comida';
    case 'farm_crops':
      return 'Trabajando cultivos';
    case 'fish_river':
      return 'Pescando en el río';
    case 'tend_livestock':
      return 'Cuidando animales';
    case 'gather_wood':
      return 'Talando madera';
    case 'gather_stone':
      return 'Picando piedra';
    case 'gather_copper':
      return 'Minando Cobre';
    case 'gather_iron':
      return 'Minando Hierro';
    case 'gather_gold':
      return 'Minando Oro 🥇';
    case 'gather_silver':
      return 'Minando Plata 🥈';
    case 'craft_tools':
      return 'Forjando herramientas';
    case 'manage_building':
      return 'Administrando edificio';
    case 'caravan':
      return 'Caravana comercial';
    case 'repair_building':
      return 'Reparando estructura';
    case 'extinguish_fire':
      return 'Apagando incendio';
    case 'store_home':
      return 'Guardando en baúl/depósito';
    case 'build_house':
      return 'Construyendo casa';
    case 'upgrade_house':
      return 'Mejorando casa';
    case 'build_plaza':
      return 'Construyendo plaza';
    case 'build_bridge':
      return 'Construyendo puente';
    case 'plant_farm':
      return 'Sembrando cultivo';
    case 'build_special':
      return 'Construyendo obra';
    case 'heal_other':
      return 'Curando enfermos';
    case 'research':
      return 'Investigando era';
    case 'trade':
      return 'Comerciando';
    case 'socialize':
      return 'Socializando';
    case 'idle':
    default:
      return 'Vigilando aldea';
  }
}

export function buildDiseaseInfo(
  id: DiseaseId,
  forcedFatalDays?: number | null
): DiseaseInfo {
  const entry = DISEASE_CATALOG[id];
  const fatalAfterDays =
    forcedFatalDays !== undefined
      ? forcedFatalDays
      : entry.minFatalDays !== null && entry.maxFatalDays !== null
        ? entry.minFatalDays +
          Math.floor(Math.random() * (entry.maxFatalDays - entry.minFatalDays + 1))
        : null;
  return {
    id: entry.id,
    name: entry.name,
    dangerPct: entry.dangerPct,
    baseChancePct: entry.baseChancePct,
    incurable: entry.incurable,
    daysInfected: 0,
    fatalAfterDays,
  };
}

export function pickRandomDiseaseBySeason(
  season: SeasonType,
  weather: WeatherType,
  isHomeless: boolean
): DiseaseId {
  const coldOrWet = season === 'Invierno' || season === 'Otoño' || weather === 'rain' || weather === 'storm' || weather === 'thunderstorm';
  const weights: Array<{ id: DiseaseId; w: number }> = [
    { id: 'gripe', w: 70 },
    { id: 'dolor_estomacal', w: 55 },
    { id: 'pulmonia', w: coldOrWet ? 62 : 12 },
    { id: 'sepsis', w: isHomeless ? 24 : 15 },
    { id: 'cancer', w: 1 },
  ];
  const total = weights.reduce((acc, item) => acc + item.w, 0);
  let r = Math.random() * total;
  for (const item of weights) {
    r -= item.w;
    if (r <= 0) return item.id;
  }
  return 'gripe';
}

export function contractDiseaseForAgent(
  state: SimulationState,
  agent: Agent,
  forcedId?: DiseaseId
): DiseaseInfo {
  const diseaseId =
    forcedId ?? pickRandomDiseaseBySeason(state.season, state.weather, agent.houseId === null);
  const info = buildDiseaseInfo(diseaseId);
  agent.isSick = true;
  agent.illness = info;
  agent.illnessName = info.name;
  agent.emotion = 'sick';
  return info;
}

export function getAllJobsMap(): Record<JobType, number> {
  return {
    Aprendiz: 0,
    Recolector: 0,
    Agricultor: 0,
    Pescador: 0,
    Leñador: 0,
    Carpintero: 0,
    Minero: 0,
    Constructor: 0,
    Curandero: 0,
    Maestro: 0,
    Erudito: 0,
    Comerciante: 0,
    Banquero: 0,
    Panadero: 0,
    Herrero: 0,
    Artesano: 0,
    Boticario: 0,
    Guardián: 0,
    Alcalde: 0,
    Comisario: 0,
    Almacenero: 0,
  };
}

export function assignBalancedJob(
  agent: Agent,
  agents: Agent[],
  houses: House[],
  policies: QwenPolicyState,
  specialBuildings: SpecialBuilding[] = []
): JobType {
  if (agent.ageYears < 10) return 'Aprendiz';

  const counts = getAllJobsMap();
  for (const other of agents) {
    if (other.id !== agent.id) counts[other.job]++;
  }

  const sickCount = agents.filter((a) => a.isSick).length;
  const homelessCount = agents.filter((a) => a.houseId === null).length;

  const needJobsForType = (type: SpecialBuildingType, job: JobType): boolean => {
    const numB = specialBuildings.filter((b) => b.type === type).length;
    return numB > 0 && counts[job] < numB;
  };

  if (needJobsForType('town_hall', 'Alcalde')) return 'Alcalde';
  if (needJobsForType('police_station', 'Comisario') || needJobsForType('prison', 'Comisario')) {
    return 'Comisario';
  }
  if (needJobsForType('general_depot', 'Almacenero')) return 'Almacenero';
  if (needJobsForType('bank', 'Banquero')) return 'Banquero';
  if (needJobsForType('school', 'Maestro')) return 'Maestro';
  if (
    (specialBuildings.some((b) => b.type === 'infirmary') || sickCount > 0 || policies.healthPriority) &&
    counts.Curandero < Math.max(1, Math.ceil(agents.length / 8))
  ) {
    return 'Curandero';
  }
  if (needJobsForType('apothecary', 'Boticario')) return 'Boticario';
  if (needJobsForType('bakery', 'Panadero')) return 'Panadero';
  if (needJobsForType('forge', 'Herrero')) return 'Herrero';
  if (needJobsForType('carpentry', 'Carpintero')) return 'Carpintero';
  if (needJobsForType('market', 'Comerciante')) return 'Comerciante';
  if (
    (specialBuildings.some((b) => b.type === 'dock') || counts.Pescador === 0) &&
    counts.Pescador < Math.max(1, specialBuildings.filter((b) => b.type === 'dock').length)
  ) {
    return 'Pescador';
  }

  if (counts.Carpintero < 1 && agents.length >= 6) return 'Carpintero';
  if (counts.Guardián < 1 && agents.length >= 8) return 'Guardián';
  if (counts.Artesano < 1 && agents.length >= 9) return 'Artesano';

  if (policies.economyFocus && counts.Comerciante < Math.max(2, Math.ceil(agents.length / 6))) {
    return 'Comerciante';
  }
  if (
    (homelessCount > 2 || policies.buildPriority || houses.length < Math.ceil(agents.length / 4)) &&
    counts.Constructor < Math.max(2, Math.ceil(agents.length / 5))
  ) {
    return 'Constructor';
  }
  if ((policies.evolutionFocus || counts.Erudito < 1) && counts.Erudito < Math.max(1, Math.ceil(agents.length / 7))) {
    return 'Erudito';
  }
  if (policies.farmingFocus && counts.Agricultor < Math.max(2, Math.ceil(agents.length / 6))) {
    return 'Agricultor';
  }
  if (counts.Recolector < Math.max(2, Math.ceil(agents.length / 6))) return 'Recolector';
  if (counts.Leñador < Math.max(1, Math.ceil(agents.length / 6))) return 'Leñador';
  if (counts.Minero < Math.max(1, Math.ceil(agents.length / 6))) return 'Minero';
  if (counts.Agricultor < Math.max(1, Math.ceil(agents.length / 7))) return 'Agricultor';
  if (counts.Comerciante < Math.max(1, Math.floor(agents.length / 7))) return 'Comerciante';
  return 'Recolector';
}

export function findOperatorCandidateForBuilding(
  state: SimulationState,
  type: SpecialBuildingType
): Agent | null {
  const validJobs = SPECIAL_BUILDING_STAFF_JOBS[type];
  const freeMatched = state.agents.find(
    (a) =>
      !a.isChild &&
      a.ageYears >= 15 &&
      a.jailedDays <= 0 &&
      validJobs.includes(a.job) &&
      a.assignedBuildingId === null
  );
  if (freeMatched) return freeMatched;

  // Buscar un adulto disponible que pueda asumir el oficio (no imprescindible en otro edificio)
  const flexible = state.agents.find(
    (a) =>
      !a.isChild &&
      a.ageYears >= 15 &&
      a.jailedDays <= 0 &&
      a.assignedBuildingId === null &&
      (a.job === 'Recolector' ||
        a.job === 'Aprendiz' ||
        a.job === 'Leñador' ||
        a.job === 'Agricultor')
  );
  if (flexible) return flexible;

  // Segundo nivel: cualquier otro adulto sin edificio asignado ni rol médico crítico
  const secondary = state.agents.find(
    (a) =>
      !a.isChild &&
      a.ageYears >= 15 &&
      a.jailedDays <= 0 &&
      a.assignedBuildingId === null &&
      a.job !== 'Curandero'
  );
  return secondary ?? null;
}

export function hasAvailableOperatorForBuilding(
  state: SimulationState,
  type: SpecialBuildingType
): boolean {
  return findOperatorCandidateForBuilding(state, type) !== null;
}

export function syncSpecialBuildingStaff(state: SimulationState): void {
  const livingIds = new Set(state.agents.map((a) => a.id));
  for (const a of state.agents) {
    if (a.assignedBuildingId !== null && !state.specialBuildings.some((b) => b.id === a.assignedBuildingId)) {
      a.assignedBuildingId = null;
    }
  }

  for (const b of state.specialBuildings) {
    if (!b.allowedStorage || b.allowedStorage.length === 0) {
      b.allowedStorage = [...SPECIAL_BUILDING_ALLOWED_STORAGE[b.type]];
    }
    if (typeof b.durability !== 'number') b.durability = 100;
    if (typeof b.price !== 'number') b.price = SPECIAL_BUILDING_LABELS[b.type].basePrice;
    if (b.ownerId !== null && !livingIds.has(b.ownerId)) {
      b.ownerId = null;
      b.forSale = true;
    }

    const validJobs = SPECIAL_BUILDING_STAFF_JOBS[b.type];
    const staff: number[] = [];

    // Si tiene dueño válido con oficio compatible, priorizarlo
    if (b.ownerId !== null) {
      const owner = state.agents.find((a) => a.id === b.ownerId && !a.isChild && a.jailedDays <= 0);
      if (owner && validJobs.includes(owner.job)) {
        owner.assignedBuildingId = b.id;
        staff.push(owner.id);
      }
    }

    for (const agent of state.agents) {
      if (agent.isChild || agent.jailedDays > 0 || !livingIds.has(agent.id)) continue;
      if (staff.includes(agent.id)) continue;
      if (validJobs.includes(agent.job)) {
        if (agent.assignedBuildingId === null || agent.assignedBuildingId === b.id) {
          // Si ya tiene dueño exclusivo de comercio/muelle/banco/taller, no usurpa propiedad ajena salvo ser empleado o sin dueño
          if (b.ownerId === null) {
            b.ownerId = agent.id;
            b.forSale = false;
          }
          agent.assignedBuildingId = b.id;
          staff.push(agent.id);
        }
      }
    }
    b.staffIds = staff;
    b.isOperational = staff.length > 0 && b.durability > 10;
  }
}

export function isBuildingOperational(state: SimulationState, type: SpecialBuildingType): boolean {
  return state.specialBuildings.some((b) => b.type === type && b.isOperational);
}

export function getCompetingBuildingCount(
  state: SimulationState,
  type: SpecialBuildingType
): number {
  return Math.max(
    1,
    state.specialBuildings.filter((b) => b.type === type && b.isOperational).length
  );
}

export function transferBuildingOwnership(
  state: SimulationState,
  buildingId: number,
  newOwnerId: number | null,
  reason = 'transferencia comercial'
): boolean {
  const b = state.specialBuildings.find((item) => item.id === buildingId);
  if (!b) return false;
  const prevOwner = b.ownerId !== null ? state.agents.find((a) => a.id === b.ownerId) : null;
  if (prevOwner && prevOwner.assignedBuildingId === b.id) {
    prevOwner.assignedBuildingId = null;
  }
  b.ownerId = newOwnerId;
  b.forSale = newOwnerId === null;
  if (newOwnerId !== null) {
    const nextOwner = state.agents.find((a) => a.id === newOwnerId);
    if (nextOwner) {
      const validJob = SPECIAL_BUILDING_STAFF_JOBS[b.type][0];
      if (!SPECIAL_BUILDING_STAFF_JOBS[b.type].includes(nextOwner.job) && !nextOwner.isChild) {
        nextOwner.job = validJob;
      }
      nextOwner.assignedBuildingId = b.id;
      nextOwner.lastQwenDecision = `Asumió propiedad de ${b.name} (${reason}).`;
      addLog(state, `${nextOwner.name} es el nuevo propietario de ${b.name} (${reason}).`, 'amber');
    }
  } else {
    addLog(state, `${b.name} quedó en venta (${reason}).`, 'slate');
  }
  syncSpecialBuildingStaff(state);
  return true;
}

export function getTotalCirculatingCoins(state: SimulationState): number {
  const agentCoins = state.agents.reduce((acc, a) => acc + a.coins, 0);
  const houseCoins = state.houses.reduce((acc, h) => acc + h.storage.coins, 0);
  const specialCoins = state.specialBuildings.reduce((acc, b) => acc + b.storage.coins, 0);
  return agentCoins + houseCoins + specialCoins;
}

export function recalculateEconomyReserve(state: SimulationState): void {
  const totalMetalGold =
    state.economyReserve.goldReserve +
    state.agents.reduce((acc, a) => acc + a.inv.gold, 0) +
    state.houses.reduce((acc, h) => acc + h.storage.gold, 0) +
    state.specialBuildings.reduce((acc, b) => acc + b.storage.gold, 0);
  const totalMetalSilver =
    state.economyReserve.silverReserve +
    state.agents.reduce((acc, a) => acc + a.inv.silver, 0) +
    state.houses.reduce((acc, h) => acc + h.storage.silver, 0) +
    state.specialBuildings.reduce((acc, b) => acc + b.storage.silver, 0);
  state.economyReserve.backedCoinsCapacity =
    totalMetalGold * GOLD_COIN_BACKING + totalMetalSilver * SILVER_COIN_BACKING;
  state.economyReserve.mintedCoins = getTotalCirculatingCoins(state);
}

/**
 * Emite monedas únicamente si el Fondo de Oro y Plata tiene respaldo suficiente.
 */
export function mintBackedCoins(state: SimulationState, requestedCoins: number): number {
  if (requestedCoins <= 0) return 0;
  recalculateEconomyReserve(state);
  const availableBacking = Math.max(
    0,
    state.economyReserve.backedCoinsCapacity - state.economyReserve.mintedCoins
  );
  const minted = Math.min(requestedCoins, availableBacking);
  state.economyReserve.mintedCoins += minted;
  return minted;
}

export function addPreciousMetalToReserve(
  state: SimulationState,
  metal: 'gold' | 'silver',
  amount: number
): void {
  if (amount <= 0) return;
  if (metal === 'gold') state.economyReserve.goldReserve += amount;
  else state.economyReserve.silverReserve += amount;
  recalculateEconomyReserve(state);
}

export function createEmptyHouseStorage(initialFood = 1): HouseStorage {
  return {
    food: initialFood,
    wood: 0,
    pineWood: 0,
    mapleWood: 0,
    oakWood: 0,
    stone: 0,
    copper: 0,
    iron: 0,
    gold: 0,
    silver: 0,
    coins: 0,
    milk: 0,
    bread: 0,
    tools: 0,
    medicine: 0,
  };
}

/**
 * Las viviendas SOLO pueden guardar Alimento (food) y Monedas (coins).
 * Los demás recursos materiales se depositan en el Depósito General o en el edificio permitido.
 */
export function depositResourcesToHouse(
  agent: Agent,
  house: House,
  mode: 'surplus' | 'all' = 'surplus',
  generalDepot?: SpecialBuilding | null
): number {
  let moved = 0;
  const keepBasic = mode === 'all' ? 0 : 1;

  // En la vivienda: únicamente Alimento y Monedas
  if (agent.inv.food > keepBasic) {
    const qty = agent.inv.food - keepBasic;
    agent.inv.food -= qty;
    house.storage.food += qty;
    moved += qty;
  }
  const keepCoins = mode === 'all' ? 0 : 10;
  if (agent.coins > keepCoins) {
    const qty = mode === 'all' ? agent.coins : Math.floor((agent.coins - keepCoins) / 2);
    if (qty > 0) {
      agent.coins -= qty;
      house.storage.coins += qty;
      moved += qty;
    }
  }

  // El resto de bienes va al Depósito General (si existe)
  if (generalDepot) {
    moved += depositMaterialsToBuilding(agent, generalDepot, mode);
  }

  return moved;
}

export function depositMaterialsToBuilding(
  agent: Agent,
  building: SpecialBuilding,
  mode: 'surplus' | 'all' = 'surplus'
): number {
  const allowed = new Set(building.allowedStorage ?? SPECIAL_BUILDING_ALLOWED_STORAGE[building.type]);
  const keepBasic = mode === 'all' ? 0 : 1;
  let moved = 0;

  const invKeys: Array<keyof ResourceInventory> = [
    'wood',
    'pineWood',
    'mapleWood',
    'oakWood',
    'stone',
    'copper',
    'iron',
    'gold',
    'silver',
  ];

  for (const k of invKeys) {
    if (!allowed.has(k)) continue;
    const minKeep = k === 'gold' || k === 'silver' || k === 'copper' ? 0 : keepBasic;
    if (agent.inv[k] > minKeep) {
      const qty = agent.inv[k] - minKeep;
      agent.inv[k] -= qty;
      building.storage[k] += qty;
      moved += qty;
    }
  }

  if (allowed.has('milk') && agent.milkCount > 0) {
    building.storage.milk += agent.milkCount;
    moved += agent.milkCount;
    agent.milkCount = 0;
  }
  if (allowed.has('bread') && agent.breadCount > 1) {
    const qty = agent.breadCount - 1;
    agent.breadCount -= qty;
    building.storage.bread += qty;
    moved += qty;
  }
  if (allowed.has('medicine') && agent.medicineCount > 1) {
    const qty = agent.medicineCount - 1;
    agent.medicineCount -= qty;
    building.storage.medicine += qty;
    moved += qty;
  }
  if (allowed.has('tools') && agent.toolsCount > 1) {
    const qty = agent.toolsCount - 1;
    agent.toolsCount -= qty;
    building.storage.tools += qty;
    moved += qty;
  }
  return moved;
}

export function withdrawResourceFromHouse(
  agent: Agent,
  house: House,
  resource: keyof HouseStorage,
  amount = 1
): number {
  const available = house.storage[resource];
  const take = Math.min(available, Math.max(0, amount));
  if (take <= 0) return 0;
  house.storage[resource] -= take;
  if (resource === 'coins') agent.coins += take;
  else if (resource === 'bread') agent.breadCount += take;
  else if (resource === 'milk') agent.milkCount += take;
  else if (resource === 'medicine') agent.medicineCount += take;
  else if (resource === 'tools') agent.toolsCount += take;
  else agent.inv[resource] += take;
  return take;
}

/**
 * En viviendas el usuario SOLO puede eliminar existencias (delta < 0), y solo existen food/coins.
 */
export function modifyHouseStorage(
  state: SimulationState,
  houseId: number,
  key: keyof HouseStorage,
  delta: number,
  byUser = true
): boolean {
  const house = state.houses.find((h) => h.id === houseId);
  if (!house) return false;
  if (delta === 0) return false;
  if (!HOUSE_ALLOWED_STORAGE.includes(key)) return false;
  if (byUser && delta > 0) {
    addLog(
      state,
      `Las viviendas solo permiten retirar o vaciar reservas (Alimento y Monedas); no se pueden agregar ítems manualmente.`,
      'amber'
    );
    return false;
  }

  const prev = house.storage[key];
  const next = Math.max(0, prev + delta);
  if (next === prev) return false;
  house.storage[key] = next;
  recalculateEconomyReserve(state);
  addLog(
    state,
    `Retiraste ${Math.abs(next - prev)} de ${key === 'food' ? 'Alimento' : 'Monedas'} del baúl de ${house.name}.`,
    'amber'
  );
  return true;
}

export function modifySpecialBuildingStorage(
  state: SimulationState,
  buildingId: number,
  key: keyof HouseStorage,
  delta: number
): boolean {
  const building = state.specialBuildings.find((b) => b.id === buildingId);
  if (!building) return false;
  if (delta === 0) return false;
  const allowed = building.allowedStorage ?? SPECIAL_BUILDING_ALLOWED_STORAGE[building.type];
  if (!allowed.includes(key)) return false;

  if (key === 'coins' && delta > 0) {
    const minted = mintBackedCoins(state, delta);
    if (minted <= 0) return false;
    building.storage.coins += minted;
    recalculateEconomyReserve(state);
    return true;
  }

  const prev = building.storage[key];
  const next = Math.max(0, prev + delta);
  if (next === prev) return false;
  building.storage[key] = next;
  recalculateEconomyReserve(state);
  return true;
}

/**
 * Consume recursos estrictamente de inventarios y baúles/depósitos reales.
 */
export function consumeConstructionResources(
  state: SimulationState,
  builder: Agent | null,
  reqs: Partial<Record<keyof ResourceInventory, number>>,
  allowVillageChests = true
): boolean {
  const storages: Array<{
    get: (k: keyof ResourceInventory) => number;
    sub: (k: keyof ResourceInventory, amt: number) => void;
  }> = [];

  if (builder) {
    storages.push({
      get: (k) => builder.inv[k],
      sub: (k, amt) => {
        builder.inv[k] -= amt;
      },
    });
    const ownHouse = builder.houseId !== null ? state.houses.find((h) => h.id === builder.houseId) : null;
    if (ownHouse) {
      storages.push({
        get: (k) => ownHouse.storage[k],
        sub: (k, amt) => {
          ownHouse.storage[k] -= amt;
        },
      });
    }
    const ownBiz =
      builder.assignedBuildingId !== null
        ? state.specialBuildings.find((b) => b.id === builder.assignedBuildingId)
        : null;
    if (ownBiz) {
      storages.push({
        get: (k) => ownBiz.storage[k],
        sub: (k, amt) => {
          ownBiz.storage[k] -= amt;
        },
      });
    }
  }

  if (allowVillageChests) {
    for (const h of state.houses) {
      if (builder && h.id === builder.houseId) continue;
      storages.push({
        get: (k) => h.storage[k],
        sub: (k, amt) => {
          h.storage[k] -= amt;
        },
      });
    }
    for (const b of state.specialBuildings) {
      if (builder && b.id === builder.assignedBuildingId) continue;
      storages.push({
        get: (k) => b.storage[k],
        sub: (k, amt) => {
          b.storage[k] -= amt;
        },
      });
    }
    for (const a of state.agents) {
      if (builder && a.id === builder.id) continue;
      storages.push({
        get: (k) => a.inv[k],
        sub: (k, amt) => {
          a.inv[k] -= amt;
        },
      });
    }
  }

  for (const [rawKey, rawNeed] of Object.entries(reqs)) {
    const key = rawKey as keyof ResourceInventory;
    const need = rawNeed ?? 0;
    if (need <= 0) continue;
    let totalAvail = 0;
    if (key === 'wood') {
      for (const s of storages) {
        totalAvail += s.get('wood') + s.get('pineWood') + s.get('mapleWood') + s.get('oakWood');
      }
    } else {
      for (const s of storages) totalAvail += s.get(key);
    }
    if (totalAvail < need) return false;
  }

  for (const [rawKey, rawNeed] of Object.entries(reqs)) {
    let remaining = rawNeed ?? 0;
    const key = rawKey as keyof ResourceInventory;
    if (remaining <= 0) continue;

    if (key === 'wood') {
      const subOrder: Array<keyof ResourceInventory> = ['wood', 'pineWood', 'mapleWood', 'oakWood'];
      for (const wk of subOrder) {
        for (const s of storages) {
          if (remaining <= 0) break;
          const avail = s.get(wk);
          if (avail > 0) {
            const take = Math.min(avail, remaining);
            s.sub(wk, take);
            remaining -= take;
          }
        }
        if (remaining <= 0) break;
      }
    } else {
      for (const s of storages) {
        if (remaining <= 0) break;
        const avail = s.get(key);
        if (avail > 0) {
          const take = Math.min(avail, remaining);
          s.sub(key, take);
          remaining -= take;
        }
      }
    }
  }

  return true;
}

export function craftToolsForAgent(state: SimulationState, agent: Agent): boolean {
  if (agent.education < 36) return false;
  const depot = state.specialBuildings.find((b) => b.type === 'general_depot' && b.isOperational);
  if (agent.inv.iron > 0) {
    agent.inv.iron -= 1;
    agent.toolsCount += 1;
  } else if (agent.inv.copper > 0) {
    agent.inv.copper -= 1;
    agent.toolsCount += 1;
  } else if (depot && depot.storage.iron > 0) {
    depot.storage.iron -= 1;
    agent.toolsCount += 1;
  } else if (agent.inv.wood >= 2) {
    agent.inv.wood -= 2;
    agent.toolsCount += 1;
  } else if (agent.inv.pineWood >= 2 && canCarpenterUseWood(agent, 'pine')) {
    agent.inv.pineWood -= 2;
    agent.toolsCount += 1;
  } else {
    return false;
  }
  state.knowledge += 3;
  agent.constructionKnowledge = clamp(agent.constructionKnowledge + 4, 0, 100);
  advanceJobMastery(agent, 'Herrero', 4);
  addLog(state, `${agent.name} fabricó herramientas con su conocimiento (${Math.round(agent.education)}% Saber).`, 'amber');
  return true;
}

export function switchPartnerForAgent(
  state: SimulationState,
  agentId: number,
  reason = 'buscando mayor afinidad'
): { switched: boolean; newPartnerName: string | null; message: string } {
  const agent = state.agents.find((a) => a.id === agentId);
  if (!agent) return { switched: false, newPartnerName: null, message: 'Aldeano no encontrado.' };
  if (agent.isChild || agent.ageYears < AGE_PARTNER_MIN_YEARS) {
    return { switched: false, newPartnerName: null, message: `${agent.name} es menor de ${AGE_PARTNER_MIN_YEARS} años.` };
  }

  const prevPartnerId = agent.partnerId;
  if (prevPartnerId !== null) {
    const prev = state.agents.find((a) => a.id === prevPartnerId);
    if (!agent.exPartnerIds.includes(prevPartnerId)) {
      agent.exPartnerIds.push(prevPartnerId);
    }
    agent.partnerId = null;
    if (prev) {
      if (!prev.exPartnerIds.includes(agent.id)) {
        prev.exPartnerIds.push(agent.id);
      }
      prev.partnerId = null;
      prev.moodModifier = clamp(prev.moodModifier - 8, -45, 45);
      prev.thought = `${agent.name} y yo decidimos tomar caminos distintos.`;
      prev.lastQwenDecision = `Qwen 2.5 registró separación mutua con ${agent.name}.`;
    }
  }

  const candidate = state.agents.find(
    (other) =>
      other.id !== agent.id &&
      other.id !== prevPartnerId &&
      !other.isChild &&
      other.ageYears >= AGE_PARTNER_MIN_YEARS &&
      other.partnerId === null &&
      !agent.exPartnerIds.includes(other.id)
  );

  if (candidate) {
    agent.partnerId = candidate.id;
    candidate.partnerId = agent.id;
    const msg =
      prevPartnerId !== null
        ? `${agent.name} cambió de pareja (${reason}) y ahora está con ${candidate.name}.`
        : `${agent.name} formó nueva pareja con ${candidate.name}.`;
    agent.lastQwenDecision = `Qwen 2.5 gestionó pareja: ${candidate.name}.`;
    candidate.lastQwenDecision = `Qwen 2.5 aprobó pareja con ${agent.name}.`;
    agent.thought = `Elegí compartir mi vida con ${candidate.name}.`;
    candidate.thought = `Acepté formar pareja con ${agent.name}.`;
    rebalanceFamilyHousing(state);
    addLog(state, msg, 'violet');
    return { switched: true, newPartnerName: candidate.name, message: msg };
  }

  const soloMsg = `${agent.name} dejó su relación anterior (${reason}) y quedó soltero/a.`;
  agent.lastQwenDecision = `Qwen 2.5 validó separación (${reason}).`;
  agent.thought = 'Prefiero estar solo/a hasta encontrar a alguien compatible.';
  addLog(state, soloMsg, 'slate');
  return { switched: true, newPartnerName: null, message: soloMsg };
}

export type QwenDecisionType =
  | 'adult_job'
  | 'partnership'
  | 'reproduction'
  | 'construction'
  | 'crisis'
  | 'daily_agent_tick';

/**
 * Qwen 2.5 toma decisiones de mayor calidad a medida que sube el Saber y la maestría del aldeano.
 */
export function decideVillagerMajorAction(
  state: SimulationState,
  agent: Agent,
  decisionType: QwenDecisionType,
  detail?: {
    partner?: Agent;
    chosenBuilding?: SpecialBuildingType | 'house' | 'upgrade' | 'plaza' | 'bridge' | 'farm';
    threatName?: string;
  }
): { approved: boolean; summary: string } {
  const totalFood =
    state.agents.reduce((acc, a) => acc + a.inv.food + a.breadCount, 0) +
    state.houses.reduce((acc, h) => acc + h.storage.food, 0);
  const sickCount = state.agents.filter((a) => a.isSick).length;
  const homelessCount = state.agents.filter((a) => a.houseId === null).length;
  const wisdomBonus = agent.education >= 60 ? 'estrategia avanzada' : agent.education >= 30 ? 'criterio táctico' : 'impulso básico';

  switch (decisionType) {
    case 'adult_job': {
      const nextJob = assignBalancedJob(
        agent,
        state.agents,
        state.houses,
        state.policies,
        state.specialBuildings
      );
      agent.job = nextJob;
      const reason =
        sickCount > 0 && nextJob === 'Curandero'
          ? 'hay enfermos que atender'
          : state.farms.length === 0 || totalFood < state.agents.length
            ? 'falta alimento para sostener la especie'
            : homelessCount > 0
              ? 'se necesitan viviendas nuevas'
              : state.policies.economyFocus
                ? 'conviene impulsar economía respaldada'
                : 'impulsar la evolución de la especie y la aldea';
      const summary = `Qwen 2.5 (${wisdomBonus}) asignó oficio ${nextJob} a ${agent.name} (${reason}).`;
      agent.lastQwenDecision = summary;
      agent.qwenPlan = `Evolución · ${nextJob} (${reason})`;
      agent.thought = `Qwen 2.5 me orientó como ${nextJob} para evolucionar la aldea.`;
      return { approved: true, summary };
    }
    case 'partnership': {
      const partner = detail?.partner;
      if (!partner) return { approved: false, summary: 'Sin candidato.' };
      if (
        agent.isChild ||
        partner.isChild ||
        agent.ageYears < AGE_PARTNER_MIN_YEARS ||
        partner.ageYears < AGE_PARTNER_MIN_YEARS ||
        agent.partnerId !== null ||
        partner.partnerId !== null
      ) {
        return { approved: false, summary: 'Condiciones de edad o estado civil no válidas.' };
      }
      if (agent.exPartnerIds.includes(partner.id) && Math.random() < 0.85) {
        return { approved: false, summary: 'Expareja reciente.' };
      }
      const canHaveKids =
        agent.sex !== partner.sex &&
        agent.wantsChildren &&
        partner.wantsChildren;
      const summary = canHaveKids
        ? `Qwen 2.5 aprobó pareja entre ${agent.name} y ${partner.name} (proyecto familiar).`
        : `Qwen 2.5 aprobó pareja entre ${agent.name} y ${partner.name} (vínculo libre sin hijos).`;
      agent.lastQwenDecision = summary;
      partner.lastQwenDecision = summary;
      agent.qwenPlan = `Cooperar con ${partner.name} y sostener el hogar`;
      partner.qwenPlan = `Cooperar con ${agent.name} y sostener el hogar`;
      agent.thought = canHaveKids
        ? `Formé pareja con ${partner.name} para construir hogar y futuro.`
        : `Formé pareja con ${partner.name} por libre albedrío; nos enfocaremos en la aldea.`;
      partner.thought = agent.thought;
      return { approved: true, summary };
    }
    case 'reproduction': {
      const partner = detail?.partner;
      if (!partner) return { approved: false, summary: 'Sin pareja.' };
      if (agent.sex === partner.sex) {
        const summary = `Qwen 2.5 bloqueó natalidad entre ${agent.name} y ${partner.name} (solo distinto sexo).`;
        agent.lastQwenDecision = summary;
        return { approved: false, summary };
      }
      if (agent.ageYears < AGE_REPRODUCE_MIN_YEARS || partner.ageYears < AGE_REPRODUCE_MIN_YEARS) {
        return { approved: false, summary: 'Edad mínima de 20 años requerida.' };
      }
      if (!agent.wantsChildren || !partner.wantsChildren) {
        const summary = `Qwen 2.5 respetó la decisión de ${agent.name} y ${partner.name} de no tener hijos.`;
        agent.lastQwenDecision = summary;
        return { approved: false, summary };
      }
      if (totalFood < Math.max(4, Math.floor(state.agents.length * 0.45)) && state.farms.length === 0) {
        const summary = `Qwen 2.5 postergó embarazo para ${agent.name} hasta asegurar comida.`;
        agent.lastQwenDecision = summary;
        agent.thought = 'Antes de formar familia debemos asegurar comida y vivienda.';
        return { approved: false, summary };
      }
      const summary = `Qwen 2.5 autorizó embarazo de 3 días para ${agent.name} y ${partner.name}.`;
      agent.lastQwenDecision = summary;
      partner.lastQwenDecision = summary;
      return { approved: true, summary };
    }
    case 'construction': {
      const target = detail?.chosenBuilding ?? 'house';
      const label =
        target === 'house'
          ? 'vivienda nueva'
          : target === 'upgrade'
            ? 'mejora de vivienda'
            : target === 'plaza'
              ? 'Plaza Central'
              : target === 'bridge'
                ? 'Puente sobre el río'
                : target === 'farm'
                  ? 'parcela de cultivo'
                  : SPECIAL_BUILDING_LABELS[target].label;
      const summary = `Qwen 2.5 (${wisdomBonus}) decidió dónde ubicará ${agent.name} su ${label}.`;
      agent.lastQwenDecision = summary;
      agent.qwenPlan = `Construir ${label}`;
      agent.thought = `Junté recursos y Qwen 2.5 eligió dónde construir ${label}.`;
      return { approved: true, summary };
    }
    case 'crisis': {
      if (detail?.threatName) {
        const summary = `Qwen 2.5 alertó a ${agent.name} ante ${detail.threatName}.`;
        agent.lastQwenDecision = summary;
        agent.qwenPlan = `Resguardarse de ${detail.threatName}`;
        agent.thought = `Hay ${detail.threatName} cerca; busco un perro guardián o refugio.`;
        return { approved: true, summary };
      }
      if (agent.isSick) {
        if (canAgentRest(agent)) {
          agent.taskType = 'sleep';
          agent.activity = getConciseTaskLabel('sleep');
          const summary = `Qwen 2.5 ordenó reposo médico en casa a ${agent.name}.`;
          agent.lastQwenDecision = summary;
          agent.qwenPlan = 'Recuperar salud en vivienda / Hospital';
          agent.thought = 'Debo descansar en mi casa y recibir atención médica.';
          return { approved: true, summary };
        }
        const summary = `${agent.name} está enfermo y sin casa: no puede descansar; necesita vivienda urgente.`;
        agent.lastQwenDecision = summary;
        agent.qwenPlan = 'Construir o conseguir casa para poder descansar';
        agent.thought = 'Sin casa no puedo descansar y mi salud empeora.';
        return { approved: true, summary };
      }
      if (state.farms.length === 0 || agent.hunger > 70) {
        agent.taskType = agent.job === 'Pescador' && !isLawActive(state, 'ban_fishing') ? 'fish_river' : 'gather_food';
        agent.activity = getConciseTaskLabel(agent.taskType);
        const summary = `Qwen 2.5 redirigió a ${agent.name} a buscar alimento urgente.`;
        agent.lastQwenDecision = summary;
        agent.qwenPlan = 'Asegurar alimento inmediato';
        agent.thought = 'Debo conseguir comida cuanto antes.';
        return { approved: true, summary };
      }
      return { approved: false, summary: 'Sin crisis activa.' };
    }
    case 'daily_agent_tick': {
      const house = agent.houseId !== null ? state.houses.find((h) => h.id === agent.houseId) : null;
      // Aldeano sabio puede comprar edificio en venta
      if (agent.education >= 45 && agent.coins >= 50) {
        const forSale = state.specialBuildings.find((b) => b.forSale && agent.coins >= b.price);
        if (forSale) {
          agent.coins -= forSale.price;
          transferBuildingOwnership(state, forSale.id, agent.id, `compra por ${forSale.price} mon.`);
          return { approved: true, summary: `${agent.name} compró ${forSale.name} gracias a su Saber (${Math.round(agent.education)}%).` };
        }
      }
      // Aldeano sabio decide si desea tener hijos por libre albedrío
      if (agent.ageYears >= AGE_REPRODUCE_MIN_YEARS && Math.random() < 0.08) {
        const enoughFood = totalFood >= state.agents.length;
        agent.wantsChildren = enoughFood && agent.happiness >= 45 && !state.policies.reproductionRestraint
          ? Math.random() < 0.78
          : Math.random() < 0.35;
      }
      const hasSurplus =
        agent.inv.food >= 3 ||
        agent.inv.wood >= 3 ||
        agent.inv.stone >= 2 ||
        agent.inv.copper >= 2 ||
        agent.inv.iron >= 2 ||
        agent.inv.gold > 0 ||
        agent.inv.silver > 0 ||
        agent.coins >= 22;

      if (house && hasSurplus) {
        agent.qwenPlan = `Guardar excedentes (${wisdomBonus})`;
        agent.lastQwenDecision = `Qwen 2.5 indicó a ${agent.name} resguardar alimentos/monedas en casa y materiales en Depósito.`;
        return { approved: true, summary: agent.lastQwenDecision };
      }
      if (state.policies.allowPartnerSwitch && agent.partnerId !== null && agent.happiness < 35) {
        const res = switchPartnerForAgent(state, agent.id, 'baja afinidad emocional');
        agent.qwenPlan = 'Rehacer su vida social en la aldea';
        return { approved: res.switched, summary: res.message };
      }
      agent.qwenPlan = `Evolucionar como ${agent.job} (${agent.skills.length}/25 skills · ${getJobMasteryTierLabel(agent.jobMastery?.[agent.job] ?? 0)})`;
      return { approved: true, summary: agent.qwenPlan };
    }
  }
}

export function transferInheritance(state: SimulationState, deceased: Agent): void {
  const heir =
    (deceased.partnerId !== null ? state.agents.find((a) => a.id === deceased.partnerId && a.id !== deceased.id) : null) ??
    state.agents.find((a) => a.id !== deceased.id && a.houseId !== null && a.houseId === deceased.houseId);

  // Transferir propiedad de edificios especiales si era dueño
  for (const b of state.specialBuildings) {
    if (b.ownerId === deceased.id) {
      if (heir && !heir.isChild) {
        transferBuildingOwnership(state, b.id, heir.id, `herencia de ${deceased.name}`);
      } else {
        b.ownerId = null;
        b.forSale = true;
        addLog(state, `${b.name} quedó en venta tras el fallecimiento de ${deceased.name}.`, 'slate');
      }
    }
  }

  const totalAssets =
    deceased.coins +
    deceased.inv.food +
    deceased.inv.wood +
    deceased.inv.pineWood +
    deceased.inv.mapleWood +
    deceased.inv.oakWood +
    deceased.inv.stone +
    deceased.inv.copper +
    deceased.inv.iron +
    deceased.inv.gold +
    deceased.inv.silver +
    deceased.breadCount +
    deceased.milkCount +
    deceased.toolsCount +
    deceased.medicineCount;
  if (totalAssets <= 0) return;

  if (heir) {
    heir.coins += deceased.coins;
    heir.inv.food += deceased.inv.food;
    heir.inv.wood += deceased.inv.wood;
    heir.inv.pineWood += deceased.inv.pineWood;
    heir.inv.mapleWood += deceased.inv.mapleWood;
    heir.inv.oakWood += deceased.inv.oakWood;
    heir.inv.stone += deceased.inv.stone;
    heir.inv.copper += deceased.inv.copper;
    heir.inv.iron += deceased.inv.iron;
    heir.inv.gold += deceased.inv.gold;
    heir.inv.silver += deceased.inv.silver;
    heir.breadCount += deceased.breadCount;
    heir.milkCount += deceased.milkCount;
    heir.toolsCount += deceased.toolsCount;
    heir.medicineCount += deceased.medicineCount;
    heir.thought = `Recibí la herencia de ${deceased.name}; honraré su esfuerzo en la aldea.`;
    addLog(state, `${heir.name} heredó ${deceased.coins} monedas y pertenencias de ${deceased.name}.`, 'violet');
    return;
  }

  const house = deceased.houseId !== null ? state.houses.find((h) => h.id === deceased.houseId) : null;
  const depot = state.specialBuildings.find((b) => b.type === 'general_depot') ?? null;
  if (house) {
    depositResourcesToHouse(deceased, house, 'all', depot);
    addLog(state, `El alimento y monedas de ${deceased.name} quedaron en ${house.name}.`, 'slate');
  } else if (depot) {
    depositMaterialsToBuilding(deceased, depot, 'all');
  }
}

export function pickQwenBabyName(sex: 'M' | 'F', state: Pick<SimulationState, 'agents' | 'nextId'>): string {
  const pool = sex === 'M' ? MALE_BABY_NAMES : FEMALE_BABY_NAMES;
  const existingFirsts = new Set(state.agents.map((a) => a.name.split(' ')[0]));
  const fresh = pool.filter((n) => !existingFirsts.has(n));
  const chosenPool = fresh.length > 0 ? fresh : pool;
  const idx = Math.floor(Math.random() * chosenPool.length);
  const surnameInitial = String.fromCharCode(65 + (state.nextId % 26));
  return `${chosenPool[idx]} ${surnameInitial}.`;
}

export function progressDiseasesDaily(state: SimulationState, agent: Agent): { diedFromDisease: boolean; recovered: boolean } {
  if (!agent.isSick) return { diedFromDisease: false, recovered: false };
  if (!agent.illness) {
    agent.illness = buildDiseaseInfo('gripe');
    agent.illnessName = agent.illness.name;
  }
  const ill = agent.illness;
  ill.daysInfected += 1;

  const hasInfirmary = isBuildingOperational(state, 'infirmary');
  const hasHouse = agent.houseId !== null;
  const dailyDrain = (ill.dangerPct / 8) * (hasHouse ? 0.65 : 1.35) * (hasInfirmary && !ill.incurable ? 0.55 : 1);
  agent.health = clamp(agent.health - dailyDrain, 0, 100);

  if (ill.fatalAfterDays !== null && ill.daysInfected >= ill.fatalAfterDays) {
    // Cáncer es incurable y mata al cumplirse 10-15 días; Pulmonía/Sepsis matan si no se curan a tiempo
    agent.health = 0;
    return { diedFromDisease: true, recovered: false };
  }

  // Enfermedades curables leves pueden remitir con descanso en casa y comida
  if (!ill.incurable && hasHouse && agent.hunger < 45 && ill.id === 'gripe' && Math.random() < 0.45) {
    agent.isSick = false;
    agent.illness = null;
    agent.illnessName = null;
    agent.health = clamp(agent.health + 22, 0, 100);
    return { diedFromDisease: false, recovered: true };
  }

  return { diedFromDisease: agent.health <= 0, recovered: false };
}

export function applyBuildingWear(state: SimulationState): void {
  const weatherDamage =
    state.weather === 'thunderstorm' ? 4 : state.weather === 'storm' ? 2.5 : state.season === 'Invierno' ? 1.4 : 0.6;

  for (const h of state.houses) {
    h.durability = clamp(h.durability - weatherDamage, 0, 100);
  }
  for (const b of state.specialBuildings) {
    b.durability = clamp(b.durability - weatherDamage * 0.9, 0, 100);
  }
  if (state.bridge) {
    state.bridge.durability = clamp(state.bridge.durability - weatherDamage * 0.8, 0, 100);
  }
}

export function repairDamagedStructures(state: SimulationState, agent?: Agent | null): number {
  let repaired = 0;
  for (const h of state.houses) {
    if (h.durability < 80) {
      if (consumeConstructionResources(state, agent ?? null, { wood: 1 })) {
        h.durability = clamp(h.durability + 32, 0, 100);
        repaired++;
      }
    }
  }
  for (const b of state.specialBuildings) {
    if (b.durability < 80) {
      if (consumeConstructionResources(state, agent ?? null, { wood: 1, stone: 1 })) {
        b.durability = clamp(b.durability + 35, 0, 100);
        repaired++;
      }
    }
  }
  if (state.bridge && state.bridge.durability < 80) {
    if (consumeConstructionResources(state, agent ?? null, { wood: 1, stone: 1 })) {
      state.bridge.durability = clamp(state.bridge.durability + 35, 0, 100);
      repaired++;
    }
  }
  if (repaired > 0 && agent) {
    advanceJobMastery(agent, agent.job, 4);
    agent.constructionKnowledge = clamp(agent.constructionKnowledge + 3, 0, 100);
    addLog(state, `${agent.name} reparó ${repaired} estructura(s) dañada(s) de la aldea.`, 'sky');
  }
  syncSpecialBuildingStaff(state);
  return repaired;
}

export function grantBankLoan(
  state: SimulationState,
  borrower: Agent,
  amount = 15,
  purpose = 'financiar obra o taller'
): BankLoan | null {
  const bank = state.specialBuildings.find((b) => b.type === 'bank' && b.isOperational);
  if (!bank) return null;
  const minted = mintBackedCoins(state, amount);
  const poolAvail = Math.min(amount, state.economyReserve.bankLoanPool);
  const granted = Math.max(minted, poolAvail);
  if (granted <= 0) return null;

  if (minted === 0 && poolAvail > 0) {
    state.economyReserve.bankLoanPool -= granted;
  }
  const loan: BankLoan = {
    id: state.nextId++,
    borrowerId: borrower.id,
    borrowerName: borrower.name,
    amount: granted,
    remaining: Math.round(granted * 1.1),
    interestPct: 10,
    purpose,
    issuedDay: state.day,
  };
  state.loans.push(loan);
  borrower.coins += granted;
  borrower.loanDebt += loan.remaining;
  borrower.lastQwenDecision = `Banco Central le otorgó préstamo de ${granted} mon. (${purpose}).`;
  addLog(state, `Banco Central prestó ${granted} monedas respaldadas a ${borrower.name} (${purpose}).`, 'amber');
  return loan;
}

export function collectTaxesAndRepayLoans(state: SimulationState): void {
  const bank = state.specialBuildings.find((b) => b.type === 'bank' && b.isOperational);
  const townHall = state.specialBuildings.find((b) => b.type === 'town_hall' && b.isOperational);
  if (!bank && !townHall) return;

  const rate = clamp(state.economyReserve.taxRatePct, 0, 25) / 100;
  let collected = 0;
  if (rate > 0) {
    for (const agent of state.agents) {
      if (agent.isChild || agent.coins < 10) continue;
      const tax = Math.max(1, Math.floor(agent.coins * rate));
      agent.coins -= tax;
      collected += tax;
    }
    state.economyReserve.bankLoanPool += collected;
    state.economyReserve.lastTaxCollectedDay = state.day;
  }

  // Amortizar préstamos activos
  for (const loan of state.loans) {
    if (loan.remaining <= 0) continue;
    const borrower = state.agents.find((a) => a.id === loan.borrowerId);
    if (!borrower) {
      loan.remaining = 0;
      continue;
    }
    if (borrower.coins >= 4) {
      const pay = Math.min(loan.remaining, Math.max(2, Math.floor(borrower.coins * 0.25)));
      borrower.coins -= pay;
      loan.remaining -= pay;
      borrower.loanDebt = Math.max(0, borrower.loanDebt - pay);
      state.economyReserve.bankLoanPool += pay;
    }
  }
  state.loans = state.loans.filter((l) => l.remaining > 0);
}

export function assignMentorships(state: SimulationState): number {
  const mentors = state.agents.filter(
    (a) =>
      !a.isChild &&
      (a.job === 'Maestro' ||
        a.job === 'Carpintero' ||
        a.job === 'Constructor' ||
        a.job === 'Erudito' ||
        a.education >= 45 ||
        (a.jobMastery?.[a.job] ?? 0) > 70)
  );
  if (mentors.length === 0) return 0;

  let paired = 0;
  for (const agent of state.agents) {
    if (agent.mentorId !== null && state.agents.some((m) => m.id === agent.mentorId)) continue;
    agent.mentorId = null;
    if (agent.ageYears >= 10 && (agent.job === 'Aprendiz' || agent.education < 30)) {
      const mentor = mentors.find((m) => m.id !== agent.id && m.education > agent.education);
      if (mentor) {
        agent.mentorId = mentor.id;
        agent.lastQwenDecision = `Contrato de aprendizaje con Maestro ${mentor.name}.`;
        paired++;
      }
    }
  }
  if (paired > 0) {
    addLog(state, `Qwen 2.5 estableció ${paired} contrato(s) de aprendizaje entre Maestros y Aprendices.`, 'sky');
  }
  return paired;
}

export function runCouncilOfElders(state: SimulationState): void {
  if (state.day - state.lastCouncilDay < 8 || state.agents.length < 12) return;
  state.lastCouncilDay = state.day;

  const totalFood =
    state.agents.reduce((acc, a) => acc + a.inv.food + a.breadCount, 0) +
    state.houses.reduce((acc, h) => acc + h.storage.food, 0);

  if (state.season === 'Invierno' && totalFood < state.agents.length * 2) {
    toggleVillageLaw(state, 'winter_rationing', true, 'Consejo de Ancianos');
  } else if (state.animals.some((a) => a.hostile && !a.tamed) || state.fires.length > 0) {
    toggleVillageLaw(state, 'night_watch', true, 'Consejo de Ancianos');
  } else if (state.economyReserve.goldReserve + state.economyReserve.silverReserve < 6) {
    toggleVillageLaw(state, 'mining_priority', true, 'Consejo de Ancianos');
  }
}

export function electRepresentative(state: SimulationState): Agent | null {
  const candidates = state.agents.filter((a) => !a.isChild && a.ageYears >= 18 && a.jailedDays <= 0);
  if (candidates.length === 0) {
    state.representativeAgentId = null;
    return null;
  }
  const sorted = [...candidates].sort((a, b) => {
    const aMayor = a.job === 'Alcalde' ? 35 : 0;
    const bMayor = b.job === 'Alcalde' ? 35 : 0;
    return b.importance + b.education * 0.5 + bMayor - (a.importance + a.education * 0.5 + aMayor);
  });
  const chosen = sorted[0];
  for (const a of state.agents) {
    a.isRepresentative = a.id === chosen.id;
  }
  state.representativeAgentId = chosen.id;
  return chosen;
}

export function createVillagePetition(
  state: SimulationState,
  forcedNegative?: boolean
): VillagePetition | null {
  const rep =
    (state.representativeAgentId !== null
      ? state.agents.find((a) => a.id === state.representativeAgentId)
      : null) ?? electRepresentative(state);
  if (!rep) return null;

  const avgHappy =
    state.agents.reduce((acc, a) => acc + a.happiness, 0) / Math.max(1, state.agents.length);
  const sickCount = state.agents.filter((a) => a.isSick).length;
  const homelessCount = state.agents.filter((a) => a.houseId === null).length;

  const isNegative =
    forcedNegative !== undefined
      ? forcedNegative
      : Math.random() < (avgHappy < 40 ? 0.35 : 0.22);

  let kind: VillagePetition['kind'] = 'peticion';
  let title = '';
  let message = '';

  if (isNegative) {
    kind = 'queja';
    const negativePrompts = [
      {
        title: 'Suprimir descansos nocturnos para producir más',
        message: `${rep.name} (Qwen 2.5) sugiere exigir trabajo continuo sin descanso nocturno. Esta medida aumentaría el estrés y el agotamiento de los aldeanos.`,
      },
      {
        title: 'Recortar raciones médicas y de alimento',
        message: `${rep.name} (Qwen 2.5) propone recortar alimentos y medicinas para acumular monedas más rápido, arriesgando la salud del pueblo.`,
      },
    ];
    const picked = negativePrompts[state.day % negativePrompts.length];
    title = picked.title;
    message = picked.message;
  } else if (sickCount > 0) {
    kind = 'peticion';
    title = 'Auxilio sanitario y medicinas para enfermos';
    message = `${rep.name} eleva una súplica a la Intervención Divina: hay ${sickCount} enfermo(s) que necesitan alivio y medicinas en el Hospital.`;
  } else if (homelessCount > 0) {
    kind = 'peticion';
    title = 'Apoyo para refugio y viviendas dignas';
    message = `${rep.name} solicita aliento divino: ${homelessCount} habitante(s) no tienen casa y no pueden descansar de noche.`;
  } else if (avgHappy < 55) {
    kind = 'consulta';
    title = 'Renovar el ánimo y esperanza de la aldea';
    message = `${rep.name} consulta a la Intervención Divina para bendecir el ánimo colectivo y dar fuerzas a los oficios.`;
  } else {
    kind = 'peticion';
    title = 'Bendición de prosperidad y evolución';
    message = `${rep.name} agradece la paz actual y pide inspiración divina para seguir evolucionando en Saber y Concordia.`;
  }

  const petition: VillagePetition = {
    id: state.nextId++,
    representativeId: rep.id,
    representativeName: rep.name,
    kind,
    isNegative,
    title,
    message,
    createdDay: state.day,
  };
  state.pendingPetition = petition;
  if (state.speed !== 0) {
    state.previousSpeedBeforePetition = state.speed;
    state.speed = 0;
    state.autoPausedByPetition = true;
  }
  addLog(
    state,
    `Intervención Divina: ${rep.name} presentó "${petition.title}" (${isNegative ? 'petición riesgosa' : 'petición constructiva'}).`,
    'violet'
  );
  return petition;
}

export function resolvePetition(state: SimulationState, wasHeard: boolean): string {
  const petition = state.pendingPetition;
  if (!petition) return 'No había ninguna petición pendiente.';

  // Si la petición es negativa/dañina, escucharla empeora el estado y rechazarla protege a la aldea.
  const positiveImpact = petition.isNegative ? !wasHeard : wasHeard;
  const moodDelta = positiveImpact ? 14 : -14;
  const healthDelta = positiveImpact ? 5 : -4;

  for (const agent of state.agents) {
    agent.moodModifier = clamp(agent.moodModifier + moodDelta, -45, 45);
    agent.happiness = clamp(agent.happiness + moodDelta, 0, 100);
    agent.health = clamp(agent.health + healthDelta, 1, 100);
    agent.emotion = deriveAgentEmotion(agent, state.weather);
    agent.thought = positiveImpact
      ? 'La Intervención Divina tomó la decisión justa para nuestra aldea.'
      : 'La decisión divina afectó el ánimo y bienestar de la aldea.';
  }

  state.pendingPetition = null;
  state.petitionTimerSec = PETITION_INTERVAL_SECONDS;
  if (state.autoPausedByPetition) {
    state.speed = state.previousSpeedBeforePetition || 1;
    state.autoPausedByPetition = false;
  }

  const label = wasHeard ? 'Fue Escuchado' : 'No fue Escuchado';
  const msg = `Intervención Divina (${label} · "${petition.title}"): impacto ${
    positiveImpact ? 'positivo' : 'negativo'
  } en ánimo y salud.`;
  addLog(state, msg, positiveImpact ? 'emerald' : 'rose');
  return msg;
}

export function spawnFire(
  state: SimulationState,
  x: number,
  y: number,
  cause = 'Tormenta eléctrica',
  targetKind: FireHazard['targetKind'] = 'forest',
  targetId?: number
): FireHazard {
  const fire: FireHazard = {
    id: state.nextId++,
    x: clamp(x, 28, CANVAS_WIDTH - 28),
    y: clamp(y, NORTH_LAND_MIN_Y + 8, CANVAS_HEIGHT - 28),
    intensity: 100,
    targetKind,
    targetId,
    cause,
  };
  state.fires.push(fire);
  addLog(state, `¡Fuego iniciado en (${Math.round(fire.x)}, ${Math.round(fire.y)}) por ${cause}!`, 'rose');
  return fire;
}

export function extinguishFire(
  state: SimulationState,
  fireId: number,
  agent?: Agent | null
): boolean {
  const fire = state.fires.find((f) => f.id === fireId);
  if (!fire) return false;
  state.fires = state.fires.filter((f) => f.id !== fireId);
  if (agent) {
    agent.coins += mintBackedCoins(state, 3);
    state.knowledge += 2;
    advanceJobMastery(agent, agent.job, 3);
    agent.thought = 'Logré extinguir el incendio y proteger la aldea.';
    addLog(state, `${agent.name} extinguió el incendio provocado por ${fire.cause}.`, 'emerald');
  } else {
    addLog(state, `El incendio (${fire.cause}) se extinguió.`, 'sky');
  }
  return true;
}

export function triggerLightningStorm(state: SimulationState): FireHazard | null {
  state.weather = 'thunderstorm';
  state.lightningFlashTimer = 18;
  const targets: Array<{ x: number; y: number; kind: FireHazard['targetKind']; id?: number }> = [];
  for (const h of state.houses) targets.push({ x: h.x, y: h.y, kind: 'house', id: h.id });
  for (const b of state.specialBuildings) targets.push({ x: b.x, y: b.y, kind: 'special', id: b.id });
  for (const f of state.farms) targets.push({ x: f.x, y: f.y, kind: 'farm', id: f.id });
  const picked =
    targets.length > 0
      ? targets[Math.floor(Math.random() * targets.length)]
      : { x: 160 + Math.random() * 140, y: SAFE_LAND_MIN_Y + 120, kind: 'forest' as const };
  return spawnFire(state, picked.x, picked.y, 'Rayo de tormenta eléctrica', picked.kind, picked.id);
}

export function enforceLawViolation(
  state: SimulationState,
  agent: Agent,
  lawId: VillageLawId
): boolean {
  if (!isLawActive(state, lawId)) return false;
  const hasPolice = isBuildingOperational(state, 'police_station');
  const prison = state.specialBuildings.find((b) => b.type === 'prison' && b.isOperational);
  if (!hasPolice || !prison) return false;

  agent.jailedDays = 2;
  agent.x = prison.x + (Math.random() - 0.5) * 16;
  agent.y = prison.y + 14;
  agent.moodModifier = clamp(agent.moodModifier - 15, -45, 45);
  agent.thought = 'Fui detenido en la Cárcel por incumplir una ley vigente.';
  addLog(state, `Comisaría detuvo a ${agent.name} por violar "${state.laws.find((l) => l.id === lawId)?.name}".`, 'rose');
  return true;
}

/**
 * Reorganiza viviendas familiares: parejas + hijos comparten casa;
 * si superan la capacidad buscan una más grande; si exceden 8 en una Grande, hijos adultos mayores se independizan.
 */
export function rebalanceFamilyHousing(state: SimulationState): void {
  if (state.houses.length === 0) return;

  const occupantsOf = (houseId: number) => state.agents.filter((a) => a.houseId === houseId);

  // 1. Mantener parejas en la misma vivienda cuando hay espacio o buscando una mayor
  for (const a of state.agents) {
    if (a.partnerId === null) continue;
    const partner = state.agents.find((p) => p.id === a.partnerId);
    if (!partner || a.id > partner.id) continue;

    if (a.houseId !== null && partner.houseId === a.houseId) continue;
    const houseA = a.houseId !== null ? state.houses.find((h) => h.id === a.houseId) : null;
    if (houseA && occupantsOf(houseA.id).length < houseA.capacity) {
      partner.houseId = houseA.id;
      continue;
    }
    const houseB = partner.houseId !== null ? state.houses.find((h) => h.id === partner.houseId) : null;
    if (houseB && occupantsOf(houseB.id).length < houseB.capacity) {
      a.houseId = houseB.id;
      continue;
    }
    const openLarge = state.houses
      .slice()
      .sort((x, y) => y.capacity - x.capacity)
      .find((h) => h.capacity - occupantsOf(h.id).length >= 2);
    if (openLarge) {
      a.houseId = openLarge.id;
      partner.houseId = openLarge.id;
    }
  }

  // 2. Si una casa supera su capacidad, mover familia entera a casa más grande o independizar hijos adultos mayores
  for (const house of state.houses) {
    const occ = occupantsOf(house.id);
    if (occ.length <= house.capacity) continue;

    // Buscar una casa más grande con cupo suficiente para toda la familia
    const biggerEmpty = state.houses.find(
      (other) =>
        other.id !== house.id &&
        other.capacity >= occ.length &&
        occupantsOf(other.id).length + occ.length <= other.capacity
    );
    if (biggerEmpty) {
      for (const member of occ) member.houseId = biggerEmpty.id;
      continue;
    }

    // Si excede incluso una casa Grande (8) o no hay casa vacía más grande, hijos adultos mayores se mudan primero
    const adultKids = occ
      .filter((m) => m.ageYears >= AGE_ADULT_YEARS && m.parents && m.parents.includes('&'))
      .sort((x, y) => y.ageYears - x.ageYears);
    const excessCandidates = [
      ...adultKids,
      ...occ.filter((m) => !adultKids.includes(m)).sort((x, y) => y.ageYears - x.ageYears),
    ];

    let currentCount = occ.length;
    for (const mover of excessCandidates) {
      if (currentCount <= house.capacity) break;
      const otherOpen = state.houses.find(
        (h) => h.id !== house.id && occupantsOf(h.id).length < h.capacity
      );
      mover.houseId = otherOpen ? otherOpen.id : null;
      currentCount--;
    }
  }
}

export function shouldBuildHouse(state: SimulationState): boolean {
  const homeless = state.agents.filter((a) => a.houseId === null).length;
  if (homeless > 0) return true;
  // Si alguna casa existente excede su capacidad (familia numerosa sin espacio mayor), sí hace falta casa
  return state.houses.some((h) => state.agents.filter((a) => a.houseId === h.id).length > h.capacity);
}

export function recordDailySnapshot(state: SimulationState): DaySnapshot {
  const count = state.agents.length;
  const avgHealth =
    count > 0 ? Math.round(state.agents.reduce((acc, a) => acc + a.health, 0) / count) : 0;
  const avgHappiness =
    count > 0 ? Math.round(state.agents.reduce((acc, a) => acc + a.happiness, 0) / count) : 0;
  const totalCoins = getTotalCirculatingCoins(state);

  const snap: DaySnapshot = {
    day: state.day,
    population: count,
    avgHealth,
    avgHappiness,
    houses: state.houses.length,
    knowledge: Math.round(state.knowledge),
    totalCoins,
  };
  state.history.push(snap);
  if (state.history.length > 60) state.history.shift();
  return snap;
}

export function generateDailyQwenSummary(state: SimulationState): string {
  const sickCount = state.agents.filter((a) => a.isSick).length;
  const totalFood =
    state.agents.reduce((acc, a) => acc + a.inv.food + a.breadCount, 0) +
    state.houses.reduce((acc, h) => acc + h.storage.food, 0);
  const totalCoins = getTotalCirculatingCoins(state);
  const obsoleteCount = state.specialBuildings.filter((b) => !b.isOperational).length;
  const yearNum = Math.floor((state.day - 1) / DAYS_PER_YEAR) + 1;
  const parts: string[] = [
    `Día ${state.day} (Año ${yearNum} · ${state.season})`,
    `${state.agents.length} hab.`,
    `${state.houses.length} casas`,
    `${totalFood} rac.`,
    `${totalCoins}/${state.economyReserve.backedCoinsCapacity} mon.`,
    `${state.animals.length} anim.`,
  ];
  if (obsoleteCount > 0) parts.push(`${obsoleteCount} obra(s) obsoleta(s)`);
  if (sickCount > 0) parts.push(`${sickCount} enfermo(s)`);
  if (state.fires.length > 0) parts.push(`${state.fires.length} incendio(s)`);
  if (state.resourcesPaused) parts.push('recursos pausados');
  return parts.join(' · ');
}

export function advanceDayAging(
  state: SimulationState,
  createBabyFn?: (
    state: SimulationState,
    mother: Agent,
    father: Agent | null
  ) => Agent
): { diedOfOldAge: number; becameAdult: number; births: number } {
  let diedOfOldAge = 0;
  let becameAdult = 0;
  let births = 0;
  const survivors: Agent[] = [];
  const newbornList: Agent[] = [];

  for (const agent of state.agents) {
    agent.ageYears += 1;

    if (agent.jailedDays > 0) {
      agent.jailedDays = Math.max(0, agent.jailedDays - 1);
      if (agent.jailedDays === 0) {
        addLog(state, `${agent.name} cumplió su sanción y recuperó la libertad.`, 'sky');
      }
    }

    if (agent.isChild && agent.ageYears > AGE_CHILD_MAX_YEARS) {
      agent.isChild = false;
    }

    if (agent.ageYears === AGE_PARTNER_MIN_YEARS) {
      addLog(state, `${agent.name} alcanzó los ${AGE_PARTNER_MIN_YEARS} años y ya puede formar pareja.`, 'sky');
    }

    if (agent.ageYears === AGE_ADULT_YEARS) {
      becameAdult += 1;
      if (agent.job === 'Aprendiz') {
        decideVillagerMajorAction(state, agent, 'adult_job');
      }
      addLog(state, `${agent.name} cumplió ${AGE_ADULT_YEARS} años y asumió el oficio de ${agent.job}.`, 'sky');
    }

    if (agent.ageYears === AGE_REPRODUCE_MIN_YEARS) {
      addLog(state, `${agent.name} cumplió ${AGE_REPRODUCE_MIN_YEARS} años (edad adulta para decidir familia).`, 'sky');
    }

    if (!agent.isElder && agent.ageYears >= AGE_ELDER_YEARS) {
      agent.isElder = true;
      state.knowledge += 5;
      addLog(state, `${agent.name} alcanzó la ancianidad (${agent.ageYears} años) aportando sabiduría.`, 'violet');
    }

    // Penalización diaria si no tiene casa (no puede descansar)
    if (agent.houseId === null) {
      agent.energy = clamp(agent.energy - 14, 0, 100);
      agent.health = clamp(agent.health - 7, 0, 100);
      if (!agent.isSick && Math.random() < 0.18) {
        const disease = contractDiseaseForAgent(state, agent);
        addLog(state, `${agent.name} enfermó de ${disease.name} por dormir a la intemperie sin casa.`, 'rose');
      }
    }

    // Progreso diario de enfermedades (incluye Cáncer incurable 10-15 días, Pulmonía, Sepsis)
    if (agent.isSick) {
      const dRes = progressDiseasesDaily(state, agent);
      if (dRes.recovered) {
        addLog(state, `${agent.name} se recuperó de su enfermedad leve descansando en casa.`, 'emerald');
      }
    }

    // Progreso de embarazos de 3 días
    if (agent.pregnancy) {
      agent.pregnancy.daysRemaining -= 1;
      if (agent.pregnancy.daysRemaining <= 0) {
        const father =
          state.agents.find((p) => p.id === agent.pregnancy?.partnerId) ?? null;
        agent.pregnancy = null;
        if (createBabyFn) {
          const baby = createBabyFn(state, agent, father);
          newbornList.push(baby);
        } else {
          const childSex: 'M' | 'F' = Math.random() < 0.5 ? 'M' : 'F';
          const childName = pickQwenBabyName(childSex, state);
          const childId = state.nextId++;
          const baby: Agent = {
            ...agent,
            id: childId,
            name: childName,
            sex: childSex,
            ageYears: 0,
            isChild: true,
            isElder: false,
            hunger: 15,
            energy: 95,
            health: 96,
            isSick: false,
            illnessName: null,
            illness: null,
            happiness: 80,
            education: 4,
            carpentryKnowledge: 0,
            constructionKnowledge: 0,
            jobMastery: {},
            skills: computeUnlockedSkills(4).map((s) => s.id),
            mentorId: null,
            loanDebt: 0,
            jailedDays: 0,
            isRepresentative: false,
            isSterile: false,
            wantsChildren: true,
            pregnancy: null,
            coins: 0,
            inv: {
              food: 0,
              wood: 0,
              pineWood: 0,
              mapleWood: 0,
              oakWood: 0,
              stone: 0,
              copper: 0,
              iron: 0,
              gold: 0,
              silver: 0,
            },
            milkCount: 0,
            breadCount: 0,
            toolsCount: 0,
            medicineCount: 0,
            job: 'Aprendiz',
            assignedBuildingId: null,
            mountedHorseId: null,
            partnerId: null,
            exPartnerIds: [],
            parents: father ? `${agent.name} & ${father.name}` : agent.name,
            childrenCount: 0,
            lastQwenDecision: `Qwen 2.5 eligió el nombre ${childName} tras 3 días de embarazo.`,
            qwenPlan: 'Crecer protegido en familia',
            thought: 'Recién nacido en la aldea.',
            importance: 10,
            reproductionCooldown: 0,
            moodModifier: 0,
          };
          newbornList.push(baby);
        }
        agent.childrenCount += 1;
        if (father) father.childrenCount += 1;
        births += 1;
      }
    }

    if (agent.ageYears >= 82) {
      agent.health = clamp(agent.health - 8, 0, 100);
    }

    if (agent.health <= 0) {
      diedOfOldAge += 1;
      transferInheritance(state, agent);
      const cause = agent.illness ? `por ${agent.illness.name}` : `a los ${agent.ageYears} años`;
      addLog(state, `${agent.name} falleció ${cause}.`, 'rose');
      continue;
    }

    syncAgentSkills(agent);
    decideVillagerMajorAction(state, agent, 'daily_agent_tick');
    survivors.push(agent);
  }

  for (const baby of newbornList) {
    survivors.push(baby);
    addLog(state, `¡Nació ${baby.name} (${baby.parents}) tras 3 días de gestación! Nombre elegido por Qwen 2.5.`, 'emerald');
  }

  const aliveIds = new Set(survivors.map((a) => a.id));
  for (const agent of survivors) {
    if (agent.partnerId !== null && !aliveIds.has(agent.partnerId)) {
      agent.partnerId = null;
    }
    if (agent.mentorId !== null && !aliveIds.has(agent.mentorId)) {
      agent.mentorId = null;
    }
  }

  state.agents = survivors;
  rebalanceFamilyHousing(state);
  syncSpecialBuildingStaff(state);
  recalculateEconomyReserve(state);
  electRepresentative(state);

  // Cambio automático de Estación (cada 30 días) + Bioma + Clima
  const nextSeason = computeSeason(state.day);
  if (nextSeason !== state.season) {
    state.season = nextSeason;
    const climate = getSeasonBiomeAndWeather(nextSeason);
    state.biome = climate.biome;
    state.weather = climate.weather;
    addLog(
      state,
      `Cambio estacional a ${nextSeason}: bioma y clima adaptados automáticamente.`,
      'sky'
    );
  }

  applyBuildingWear(state);
  collectTaxesAndRepayLoans(state);
  assignMentorships(state);
  runCouncilOfElders(state);
  recordDailySnapshot(state);

  const summary = generateDailyQwenSummary(state);
  state.qwenMessages.push({
    id: state.nextId++,
    role: 'qwen',
    source: 'local',
    text: summary,
  });
  if (state.qwenMessages.length > 35) state.qwenMessages.shift();

  return { diedOfOldAge, becameAdult, births };
}

export function canAgentsReproduce(
  a: Agent,
  b: Agent,
  houses: House[],
  agents: Agent[],
  policies: QwenPolicyState
): boolean {
  if (a.sex === b.sex) return false;
  if (a.isChild || b.isChild) return false;
  if (a.ageYears < AGE_REPRODUCE_MIN_YEARS || b.ageYears < AGE_REPRODUCE_MIN_YEARS) return false;
  if (a.ageYears > 55 || b.ageYears > 55) return false;
  if (a.isSterile || b.isSterile) return false;
  if (!a.wantsChildren || !b.wantsChildren) return false;
  const female = a.sex === 'F' ? a : b;
  if (female.pregnancy !== null) return false;
  if (a.isSick || b.isSick) return false;
  if (a.health < 55 || b.health < 55) return false;
  if (a.hunger > 55 || b.hunger > 55) return false;
  if (a.reproductionCooldown > 0 || b.reproductionCooldown > 0) return false;

  const totalCapacity = houses.reduce((acc, h) => acc + h.capacity, 0);
  const extraMargin = policies.reproductionRestraint ? 2 : 10;
  if (houses.length === 0 || agents.length >= totalCapacity + extraMargin) return false;
  if (a.houseId === null && b.houseId === null) return false;

  const maxChildren = policies.reproductionRestraint ? 2 : 5;
  if (a.childrenCount >= maxChildren || b.childrenCount >= maxChildren) return false;

  return true;
}

export function generateEmergentDialogue(
  a: Agent,
  b: Agent,
  state: Pick<SimulationState, 'season' | 'weather' | 'resourcesPaused' | 'policies' | 'specialBuildings'>
): string {
  if (a.isSick || b.isSick) {
    return `${a.name}: "Cuidemos la salud, necesitamos apoyo en el Hospital o la Botica."`;
  }
  if (state.resourcesPaused) {
    return `${a.name}: "No llegan recursos externos; debemos cultivar, pescar y cuidar los yacimientos."`;
  }
  if (state.season === 'Invierno') {
    return `${a.name}: "El invierno es duro; resguardemos comida en casa y reparemos techos."`;
  }
  if (state.policies.economyFocus || state.specialBuildings.some((s) => s.category === 'commerce')) {
    return `${a.name}: "El Banco y los comercios necesitan oro, plata, cobre y maderas finas."`;
  }
  return `${a.name}: "Con ${b.job} y mi oficio de ${a.job} haremos evolucionar nuestra especie."`;
}

export function addLog(
  state: Pick<SimulationState, 'day' | 'logs' | 'nextId'>,
  text: string,
  tone: LogEntry['tone'] = 'slate'
): void {
  state.logs.unshift({
    id: state.nextId++,
    day: state.day,
    text,
    tone,
  });
  if (state.logs.length > 80) state.logs.length = 80;
}

export function evaluateResourceSentiment(
  agent: Agent,
  resource: keyof ResourceInventory | 'coins',
  delta: number
): string {
  const labels: Record<keyof ResourceInventory | 'coins', string> = {
    food: 'comida',
    wood: 'madera común',
    pineWood: 'madera de Pino',
    mapleWood: 'madera de Arce',
    oakWood: 'madera de Roble',
    stone: 'piedra',
    copper: 'cobre',
    iron: 'hierro',
    gold: 'Oro 🥇',
    silver: 'Plata 🥈',
    coins: 'monedas',
  };
  const label = labels[resource];
  if (delta > 0) {
    agent.moodModifier = clamp(agent.moodModifier + 14, -45, 45);
    agent.happiness = clamp(agent.happiness + 14, 0, 100);
    agent.thought = `¡Qué entusiasmo! Recibí ${label}; me siento motivado para trabajar más.`;
    return `${agent.name} recibió +${delta} de ${label} y su entusiasmo subió.`;
  }
  agent.moodModifier = clamp(agent.moodModifier - 16, -45, 45);
  agent.happiness = clamp(agent.happiness - 16, 0, 100);
  agent.thought = `Perdí ${label} de mis pertenencias; siento tristeza y depresión.`;
  return `${agent.name} perdió ${Math.abs(delta)} de ${label} y su ánimo cayó.`;
}

export function cureAgent(state: SimulationState, agentId: number): string | null {
  const agent = state.agents.find((a) => a.id === agentId);
  if (!agent) return null;

  if (agent.illness?.incurable) {
    agent.moodModifier = clamp(agent.moodModifier + 8, -45, 45);
    agent.happiness = clamp(agent.happiness + 10, 0, 100);
    agent.health = clamp(agent.health + 6, 1, 100);
    const left = Math.max(1, (agent.illness.fatalAfterDays ?? 12) - agent.illness.daysInfected);
    agent.thought = `Los cuidados alivian mi dolor, pero el ${agent.illness.name} es incurable.`;
    const msg = `${agent.name} padece ${agent.illness.name} (incurable, ~${left} días); solo recibió alivio paliativo.`;
    addLog(state, msg, 'amber');
    return msg;
  }

  agent.isSick = false;
  agent.illness = null;
  agent.illnessName = null;
  agent.health = clamp(Math.max(agent.health + 45, 92), 0, 100);
  agent.moodModifier = clamp(agent.moodModifier + 15, -45, 45);
  agent.happiness = clamp(agent.happiness + 18, 0, 100);
  agent.emotion = deriveAgentEmotion(agent, state.weather);
  agent.thought = 'Me siento completamente recuperado y con entusiasmo para trabajar.';
  const msg = `Curaste a ${agent.name} (Salud: ${Math.round(agent.health)}/100).`;
  addLog(state, msg, 'emerald');
  return msg;
}

export function infectAgent(
  state: SimulationState,
  agentId: number,
  forcedDiseaseId?: DiseaseId
): string | null {
  const agent = state.agents.find((a) => a.id === agentId);
  if (!agent) return null;
  const info = contractDiseaseForAgent(state, agent, forcedDiseaseId);
  agent.health = clamp(agent.health - Math.round(info.dangerPct * 0.25), 10, 100);
  agent.moodModifier = clamp(agent.moodModifier - 18, -45, 45);
  agent.happiness = clamp(agent.happiness - 22, 0, 100);
  agent.emotion = 'sick';
  agent.thought = `Contraje ${info.name} (peligrosidad ${info.dangerPct}%).`;
  const msg = `${agent.name} enfermó de ${info.name} (peligro ${info.dangerPct}%${info.incurable ? ' · incurable' : ''}).`;
  addLog(state, msg, 'amber');
  return msg;
}

export function toggleSterileAgent(state: SimulationState, agentId: number): string | null {
  const agent = state.agents.find((a) => a.id === agentId);
  if (!agent) return null;
  agent.isSterile = !agent.isSterile;
  if (agent.isSterile) {
    agent.moodModifier = clamp(agent.moodModifier - 12, -45, 45);
    agent.happiness = clamp(agent.happiness - 10, 0, 100);
    agent.thought = 'Ya no podré tener hijos; me enfocaré en mi oficio y en la aldea.';
    const msg = `${agent.name} quedó impotente / estéril.`;
    addLog(state, msg, 'violet');
    return msg;
  }
  agent.moodModifier = clamp(agent.moodModifier + 10, -45, 45);
  agent.happiness = clamp(agent.happiness + 8, 0, 100);
  agent.thought = 'Recuperé mi vitalidad y fertilidad.';
  const msg = `${agent.name} volvió a ser fértil.`;
  addLog(state, msg, 'emerald');
  return msg;
}

export function killAgent(state: SimulationState, agentId: number): string | null {
  const target = state.agents.find((a) => a.id === agentId);
  if (!target) return null;

  transferInheritance(state, target);

  if (target.partnerId !== null) {
    const partner = state.agents.find((a) => a.id === target.partnerId);
    if (partner) {
      partner.partnerId = null;
      partner.moodModifier = clamp(partner.moodModifier - 26, -45, 45);
      partner.happiness = clamp(Math.min(partner.happiness - 36, 34), 0, 100);
      partner.emotion = deriveAgentEmotion(partner, state.weather);
      partner.thought = `Lamento profundamente la pérdida de ${target.name}.`;
    }
  }

  for (const animal of state.animals) {
    if (animal.riderId === target.id) animal.riderId = null;
  }

  state.agents = state.agents.filter((a) => a.id !== agentId);
  syncSpecialBuildingStaff(state);
  recalculateEconomyReserve(state);
  electRepresentative(state);

  if (state.selectedAgentId === agentId) state.selectedAgentId = null;
  if (state.selectedEntity?.kind === 'agent' && state.selectedEntity.id === agentId) {
    state.selectedEntity = null;
  }
  if (state.highlightFamilyAgentId === agentId) state.highlightFamilyAgentId = null;

  const msg = `${target.name} (${target.ageYears} años) murió por intervención divina.`;
  addLog(state, msg, 'rose');
  return msg;
}

export function modifyAgentResource(
  state: SimulationState,
  agentId: number,
  resource: keyof ResourceInventory | 'coins',
  delta: number
): string | null {
  const agent = state.agents.find((a) => a.id === agentId);
  if (!agent) return null;

  if (resource === 'coins') {
    if (delta > 0) {
      const minted = mintBackedCoins(state, delta);
      if (minted <= 0) {
        addLog(state, 'No hay respaldo suficiente en Oro/Plata para emitir más monedas.', 'amber');
        return null;
      }
      agent.coins += minted;
    } else {
      const nextVal = Math.max(0, agent.coins + delta);
      if (nextVal === agent.coins) return null;
      agent.coins = nextVal;
    }
  } else {
    const nextVal = Math.max(0, agent.inv[resource] + delta);
    if (nextVal === agent.inv[resource]) return null;
    agent.inv[resource] = nextVal;
  }

  recalculateEconomyReserve(state);
  const msg = evaluateResourceSentiment(agent, resource, delta);
  agent.emotion = deriveAgentEmotion(agent, state.weather);
  agent.importance = computeAgentImportance(agent);
  addLog(state, msg, delta > 0 ? 'emerald' : 'amber');
  return msg;
}

/**
 * El usuario ÚNICAMENTE puede modificar el Saber General (`general`).
 * Carpintería y Construcción progresan de manera autónoma por oficio, escuela y aprendices.
 */
export function modifyAgentKnowledge(
  state: SimulationState,
  agentId: number,
  delta: number,
  branch: 'general' | 'carpentry' | 'construction' = 'general'
): string | null {
  const agent = state.agents.find((a) => a.id === agentId);
  if (!agent) return null;

  if (branch !== 'general') {
    addLog(
      state,
      `El conocimiento de ${branch === 'carpentry' ? 'Carpintería' : 'Construcción'} evoluciona de forma autónoma trabajando o estudiando.`,
      'amber'
    );
    return null;
  }

  const prev = agent.education;
  const next = clamp(Math.round(prev + delta), 0, 100);
  if (next === prev) return null;
  agent.education = next;
  const skills = syncAgentSkills(agent);

  if (delta > 0) {
    const villageGain = Math.max(1, Math.round(delta * 0.4));
    state.knowledge += villageGain;
    state.era = computeEra(state.knowledge, state.houses);
    agent.moodModifier = clamp(agent.moodModifier + 10, -45, 45);
    agent.happiness = clamp(agent.happiness + 10, 0, 100);
    agent.emotion = deriveAgentEmotion(agent, state.weather);
    agent.lastQwenDecision = `Qwen 2.5 registró +${next - prev}% de Saber General para ${agent.name} (${skills.length}/25 skills).`;
    agent.thought =
      next >= 40
        ? `Desbloqueé ${skills.length}/25 skills; tomo decisiones más estratégicas para la aldea.`
        : `Aprendí nuevas habilidades (${skills.length}/25 skills) para evolucionar la aldea.`;
    const msg = `Agregaste +${next - prev}% de Saber General a ${agent.name} (${next}% · ${skills.length}/25 skills).`;
    addLog(state, msg, 'sky');
    return msg;
  }

  agent.moodModifier = clamp(agent.moodModifier - 4, -45, 45);
  agent.emotion = deriveAgentEmotion(agent, state.weather);
  agent.lastQwenDecision = `Se redujo el Saber General de ${agent.name} a ${next}%.`;
  agent.thought = 'Necesito estudiar o investigar más para recuperar mis conocimientos.';
  const msg = `Se redujo el Saber General de ${agent.name} a ${next}%.`;
  addLog(state, msg, 'amber');
  return msg;
}

export const HOUSE_SIZE_LABELS: Record<House['size'], string> = {
  small: 'Chica',
  medium: 'Mediana',
  large: 'Grande',
};

function getSettlementAnchor(
  state: SimulationState,
  zone: 'south' | 'north' = 'south',
  anchorX?: number,
  anchorY?: number
): { x: number; y: number } {
  if (anchorX !== undefined && anchorY !== undefined) {
    return {
      x: clamp(anchorX, FOREST_MAX_X + 40, MOUNTAIN_MIN_X - 40),
      y:
        zone === 'north'
          ? clamp(anchorY, NORTH_LAND_MIN_Y + 28, NORTH_LAND_MAX_Y - 18)
          : clamp(anchorY, SAFE_LAND_MIN_Y + 46, CANVAS_HEIGHT - 84),
    };
  }
  if (zone === 'south' && state.plaza) {
    return { x: state.plaza.x, y: state.plaza.y };
  }
  const bankHouses = state.houses.filter((h) => h.zone === zone);
  if (bankHouses.length > 0) {
    const sx = bankHouses.reduce((acc, h) => acc + h.x, 0) / bankHouses.length;
    const sy = bankHouses.reduce((acc, h) => acc + h.y, 0) / bankHouses.length;
    return { x: sx, y: sy };
  }
  const bankAgents = state.agents.filter((a) =>
    zone === 'north' ? a.y < RIVER_TOP_Y : a.y > RIVER_BOTTOM_Y
  );
  if (bankAgents.length > 0) {
    const sx = bankAgents.reduce((acc, a) => acc + a.x, 0) / bankAgents.length;
    const sy = bankAgents.reduce((acc, a) => acc + a.y, 0) / bankAgents.length;
    return { x: clamp(sx, FOREST_MAX_X + 60, MOUNTAIN_MIN_X - 60), y: sy };
  }
  return {
    x: WORLD_CENTER_X + (Math.random() - 0.5) * 220,
    y: zone === 'north' ? 76 : WORLD_CENTER_Y + (Math.random() - 0.5) * 140,
  };
}

function isSpotClear(
  state: SimulationState,
  cx: number,
  cy: number,
  minDistHouse: number,
  minDistSpecial: number,
  minDistPlaza: number,
  minDistFarm: number
): boolean {
  if (cy >= RIVER_TOP_Y - 22 && cy <= RIVER_BOTTOM_Y + 22) return false;
  if (state.plaza && Math.hypot(cx - state.plaza.x, cy - state.plaza.y) < minDistPlaza) return false;
  if (state.houses.some((h) => Math.hypot(cx - h.x, cy - h.y) < minDistHouse)) return false;
  if (state.specialBuildings.some((b) => Math.hypot(cx - b.x, cy - b.y) < minDistSpecial)) return false;
  if (state.farms.some((f) => Math.hypot(cx - f.x, cy - f.y) < minDistFarm)) return false;
  return true;
}

export function chooseQwenBuildSpot(
  state: SimulationState,
  kind: 'house' | 'plaza' | 'special' | 'dock' | 'farm',
  zone: 'south' | 'north' = 'south',
  anchorX?: number,
  anchorY?: number
): { x: number; y: number } {
  if (kind === 'dock') {
    const bridgeX = state.bridge?.x ?? null;
    const anchor = getSettlementAnchor(state, 'south', anchorX, anchorY);
    for (let attempt = 0; attempt < 40; attempt++) {
      const offset = (attempt % 2 === 0 ? 1 : -1) * Math.floor((attempt + 1) / 2) * 62;
      const cx = clamp(anchor.x + offset + (Math.random() - 0.5) * 36, FOREST_MAX_X + 30, MOUNTAIN_MIN_X - 30);
      const cy = RIVER_BOTTOM_Y + 34;
      const nearBridge = bridgeX !== null && Math.abs(cx - bridgeX) < 88;
      const nearOther = state.specialBuildings.some((b) => Math.hypot(cx - b.x, cy - b.y) < 76);
      if (!nearBridge && !nearOther) {
        return { x: Math.round(cx), y: cy };
      }
    }
    return { x: Math.round(clamp(anchor.x + 120, FOREST_MAX_X + 30, MOUNTAIN_MIN_X - 30)), y: RIVER_BOTTOM_Y + 34 };
  }

  const anchor = getSettlementAnchor(state, zone, anchorX, anchorY);
  const seedAngle = (state.nextId * 1.618 + state.houses.length * 0.73 + state.specialBuildings.length * 1.15) % (Math.PI * 2);

  if (zone === 'north') {
    for (let attempt = 0; attempt < 60; attempt++) {
      const spreadX = (attempt % 2 === 0 ? 1 : -1) * (40 + Math.floor(attempt / 2) * 48) + (Math.random() - 0.5) * 32;
      const cx = clamp(anchor.x + spreadX, FOREST_MAX_X + 20, MOUNTAIN_MIN_X - 20);
      const cy = clamp(54 + (attempt % 3) * 26 + (Math.random() - 0.5) * 14, NORTH_LAND_MIN_Y + 26, NORTH_LAND_MAX_Y - 16);
      if (isSpotClear(state, cx, cy, 60, 72, 90, 56)) {
        return { x: Math.round(cx), y: Math.round(cy) };
      }
    }
    return {
      x: Math.round(clamp(420 + Math.random() * 580, FOREST_MAX_X + 20, MOUNTAIN_MIN_X - 20)),
      y: 78,
    };
  }

  const minRadii: Record<'plaza' | 'house' | 'special' | 'farm', number> = {
    plaza: 25,
    house: 80,
    special: 95,
    farm: 135,
  };
  const clearances: Record<'plaza' | 'house' | 'special' | 'farm', [number, number, number, number]> = {
    plaza: [96, 105, 120, 92],
    house: [64, 76, 112, 62],
    special: [76, 86, 118, 72],
    farm: [66, 74, 110, 62],
  };
  const [mh, ms, mp, mf] = clearances[kind];

  for (let attempt = 0; attempt < 96; attempt++) {
    const angle = seedAngle + attempt * 0.78 + (Math.random() - 0.5) * 0.28;
    const radius = minRadii[kind] + Math.floor(attempt / 6) * 44;
    const cx = clamp(anchor.x + Math.cos(angle) * radius, FOREST_MAX_X + 35, MOUNTAIN_MIN_X - 35);
    const cy = clamp(
      anchor.y + Math.sin(angle) * (radius * 0.72),
      SAFE_LAND_MIN_Y + 46,
      CANVAS_HEIGHT - 74
    );
    if (isSpotClear(state, cx, cy, mh, ms, mp, mf)) {
      return { x: Math.round(cx), y: Math.round(cy) };
    }
  }

  return {
    x: Math.round(clamp(FOREST_MAX_X + 60 + Math.random() * (MOUNTAIN_MIN_X - FOREST_MAX_X - 120), FOREST_MAX_X + 40, MOUNTAIN_MIN_X - 40)),
    y: Math.round(SAFE_LAND_MIN_Y + 70 + Math.random() * (CANVAS_HEIGHT - SAFE_LAND_MIN_Y - 150)),
  };
}

export function createPlaza(
  state: SimulationState,
  builderName: string,
  anchorX?: number,
  anchorY?: number
): NonNullable<SimulationState['plaza']> {
  if (state.plaza) return state.plaza;
  const spot = chooseQwenBuildSpot(state, 'plaza', 'south', anchorX, anchorY);
  const plaza = {
    x: spot.x,
    y: spot.y,
    builderName,
    builtDay: state.day,
  };
  state.plaza = plaza;
  return plaza;
}

export function createBridge(
  state: SimulationState,
  builderName: string,
  preferredX?: number
): NonNullable<SimulationState['bridge']> {
  if (state.bridge) return state.bridge;
  const anchor = getSettlementAnchor(state, 'south', preferredX);
  const chosenX = Math.round(
    clamp(preferredX ?? anchor.x + (Math.random() - 0.5) * 140, FOREST_MAX_X + 60, MOUNTAIN_MIN_X - 60)
  );
  const bridge = {
    x: chosenX,
    builderName,
    builtDay: state.day,
    durability: 100,
  };
  state.bridge = bridge;
  return bridge;
}

export function deletePlaza(state: SimulationState): boolean {
  if (!state.plaza) return false;
  state.plaza = null;
  if (state.selectedEntity?.kind === 'plaza') state.selectedEntity = null;
  addLog(state, 'Demoliste la Plaza Central de la aldea.', 'rose');
  return true;
}

export function deleteBridge(state: SimulationState): boolean {
  if (!state.bridge) return false;
  const bx = state.bridge.x;
  state.bridge = null;
  state.roads = state.roads.filter(
    (r) => !(r.y >= RIVER_TOP_Y - 8 && r.y <= RIVER_BOTTOM_Y + 8 && Math.abs(r.x - bx) <= BRIDGE_HALF_WIDTH + 6)
  );
  if (state.selectedEntity?.kind === 'bridge') state.selectedEntity = null;
  addLog(state, 'Demoliste el Puente fluvial. La Zona Norte quedó aislada por el río.', 'rose');
  return true;
}

export function createHouseNearCenter(
  state: SimulationState,
  builderName: string,
  zone: 'south' | 'north' = 'south',
  forcedSize?: House['size'],
  anchorX?: number,
  anchorY?: number,
  constructionSkillPct = 20
): House {
  const id = state.nextId++;
  const maxLv = ERA_METADATA[state.era].maxHouseLevel;
  const levelBySkill: 1 | 2 | 3 | 4 =
    constructionSkillPct >= 75
      ? (Math.min(4, maxLv + 1) as 1 | 2 | 3 | 4)
      : constructionSkillPct >= 45
        ? (Math.min(3, Math.max(2, maxLv)) as 1 | 2 | 3 | 4)
        : maxLv;
  const spot = chooseQwenBuildSpot(state, 'house', zone, anchorX, anchorY);

  const sizePool: House['size'][] = ['small', 'medium', 'large'];
  const size: House['size'] =
    forcedSize ??
    (constructionSkillPct >= 65
      ? 'large'
      : constructionSkillPct >= 35
        ? 'medium'
        : sizePool[(id + state.houses.length) % sizePool.length]);

  const capacity = HOUSE_SIZE_CAPACITIES[size];

  const house: House = {
    id,
    name: `Vivienda #${state.houses.length + 1}`,
    x: spot.x,
    y: spot.y,
    zone,
    size,
    level: levelBySkill,
    capacity,
    comfortBonus: 8 * levelBySkill + (size === 'large' ? 8 : size === 'medium' ? 4 : 0),
    durability: 100,
    builderName,
    storage: createEmptyHouseStorage(1),
  };
  state.houses.push(house);

  const homeless = state.agents.filter((a) => a.houseId === null);
  let assigned = 0;
  for (const agent of homeless) {
    if (assigned >= house.capacity) break;
    agent.houseId = house.id;
    assigned++;
  }
  rebalanceFamilyHousing(state);

  return house;
}

export function upgradeLowestHouse(state: SimulationState, constructionSkillPct = 20): House | null {
  const maxAllowed: 1 | 2 | 3 | 4 =
    constructionSkillPct >= 75
      ? 4
      : (Math.max(ERA_METADATA[state.era].maxHouseLevel, constructionSkillPct >= 45 ? 3 : 2) as 1 | 2 | 3 | 4);
  const candidates = state.houses.filter((h) => h.level < maxAllowed).sort((a, b) => a.level - b.level);
  const target = candidates[0];
  if (!target) return null;
  target.level = (target.level + 1) as 1 | 2 | 3 | 4;
  target.comfortBonus += 10;
  target.durability = 100;
  // Si sube de nivel y es chica, puede ampliarse a mediana (cap 6) o mediana -> grande (cap 8)
  if (target.size === 'small' && target.level >= 3) {
    target.size = 'medium';
    target.capacity = HOUSE_SIZE_CAPACITIES.medium;
  } else if (target.size === 'medium' && target.level === 4) {
    target.size = 'large';
    target.capacity = HOUSE_SIZE_CAPACITIES.large;
  }
  return target;
}

export function createSpecialBuilding(
  state: SimulationState,
  type: SpecialBuildingType,
  builderName: string,
  anchorX?: number,
  anchorY?: number,
  constructionSkillPct = 20,
  allowMultiple = true
): SpecialBuilding | null {
  const sameType = state.specialBuildings.filter((b) => b.type === type);
  const isCivicUnique = type === 'town_hall' || type === 'bank' || type === 'prison';
  const candidate = findOperatorCandidateForBuilding(state, type);

  if (sameType.length > 0 && (isCivicUnique || !allowMultiple || sameType.length >= 3 || !candidate)) {
    const existing = sameType[0];
    existing.level = Math.min(3, existing.level + 1);
    existing.durability = 100;
    syncSpecialBuildingStaff(state);
    return existing;
  }

  if (!candidate) {
    return null;
  }

  const meta = SPECIAL_BUILDING_LABELS[type];
  const spot = chooseQwenBuildSpot(state, type === 'dock' ? 'dock' : 'special', 'south', anchorX, anchorY);
  const initialLevel = constructionSkillPct >= 65 ? 2 : 1;

  // Asignar oficio al operario encontrado
  const requiredJob = SPECIAL_BUILDING_STAFF_JOBS[type][0];
  if (!SPECIAL_BUILDING_STAFF_JOBS[type].includes(candidate.job)) {
    candidate.job = requiredJob;
  }

  const sameCount = sameType.length + 1;
  const building: SpecialBuilding = {
    id: state.nextId++,
    type,
    name: sameCount > 1 ? `${meta.label} #${sameCount}` : meta.label,
    category: meta.category,
    x: spot.x,
    y: spot.y,
    level: initialLevel,
    builderName,
    ownerId: candidate.id,
    forSale: false,
    price: meta.basePrice,
    durability: 100,
    staffIds: [candidate.id],
    isOperational: true,
    allowedStorage: [...SPECIAL_BUILDING_ALLOWED_STORAGE[type]],
    storage: createEmptyHouseStorage(0),
  };
  candidate.assignedBuildingId = building.id;
  state.specialBuildings.push(building);
  syncSpecialBuildingStaff(state);
  return building;
}

export function createFarmPlot(
  state: SimulationState,
  zone: 'south' | 'north' = 'south',
  anchorX?: number,
  anchorY?: number
): FarmPlot {
  const id = state.nextId++;
  const crops = ['Trigo', 'Maíz', 'Hortalizas'];
  const sizes: FarmPlot['size'][] = ['small', 'medium', 'large'];
  const spot = chooseQwenBuildSpot(state, 'farm', zone, anchorX, anchorY);
  const plot: FarmPlot = {
    id,
    x: spot.x,
    y: spot.y,
    size: sizes[(id + state.farms.length) % sizes.length],
    growth: 25,
    cropName: crops[id % crops.length],
  };
  state.farms.push(plot);
  return plot;
}

export function killCropPlotAt(state: SimulationState, x: number, y: number): FarmPlot | null {
  const idx = state.farms.findIndex((f) => Math.hypot(f.x - x, f.y - y) <= 38);
  if (idx === -1) return null;
  const [removed] = state.farms.splice(idx, 1);
  if (state.selectedEntity?.kind === 'farm' && state.selectedEntity.id === removed.id) {
    state.selectedEntity = null;
  }
  addLog(state, `Eliminaste el cultivo de ${removed.cropName}.`, 'rose');
  return removed;
}

export function killAllCrops(state: SimulationState): number {
  const count = state.farms.length;
  if (count === 0) return 0;
  state.farms = [];
  if (state.selectedEntity?.kind === 'farm') state.selectedEntity = null;
  addLog(state, `Se destruyeron todos los cultivos de la aldea (${count} parcelas).`, 'rose');
  return count;
}

export function deleteHouse(state: SimulationState, houseId: number): boolean {
  const house = state.houses.find((h) => h.id === houseId);
  if (!house) return false;
  state.houses = state.houses.filter((h) => h.id !== houseId);
  for (const agent of state.agents) {
    if (agent.houseId === houseId) agent.houseId = null;
  }
  recalculateEconomyReserve(state);
  if (state.selectedEntity?.kind === 'house' && state.selectedEntity.id === houseId) {
    state.selectedEntity = null;
  }
  addLog(state, `Demoliste ${house.name}. Sus ocupantes quedaron sin vivienda.`, 'rose');
  return true;
}

export function deleteSpecialBuilding(state: SimulationState, buildingId: number): boolean {
  const b = state.specialBuildings.find((item) => item.id === buildingId);
  if (!b) return false;
  state.specialBuildings = state.specialBuildings.filter((item) => item.id !== buildingId);
  for (const a of state.agents) {
    if (a.assignedBuildingId === buildingId) a.assignedBuildingId = null;
  }
  recalculateEconomyReserve(state);
  if (state.selectedEntity?.kind === 'special' && state.selectedEntity.id === buildingId) {
    state.selectedEntity = null;
  }
  addLog(state, `Eliminaste el edificio ${b.name}.`, 'rose');
  return true;
}

export function deleteFarmPlotById(state: SimulationState, farmId: number): boolean {
  const farm = state.farms.find((f) => f.id === farmId);
  if (!farm) return false;
  state.farms = state.farms.filter((f) => f.id !== farmId);
  if (state.selectedEntity?.kind === 'farm' && state.selectedEntity.id === farmId) {
    state.selectedEntity = null;
  }
  addLog(state, `Mataste el cultivo de ${farm.cropName}.`, 'rose');
  return true;
}

export function deleteAnimal(state: SimulationState, animalId: number): boolean {
  const animal = state.animals.find((a) => a.id === animalId);
  if (!animal) return false;
  state.animals = state.animals.filter((a) => a.id !== animalId);
  for (const agent of state.agents) {
    if (agent.mountedHorseId === animalId) agent.mountedHorseId = null;
  }
  if (state.selectedEntity?.kind === 'animal' && state.selectedEntity.id === animalId) {
    state.selectedEntity = null;
  }
  addLog(state, `Eliminaste a ${animal.name} (${ANIMAL_LABELS[animal.type]}).`, 'rose');
  return true;
}

export function defendAgainstWildAnimal(
  state: SimulationState,
  defender: Agent,
  animal: Animal
): { killed: boolean; damageDealt: number } {
  const weaponBonus = defender.toolsCount > 0 ? 18 : 0;
  const skillBonus = defender.education >= 30 ? 8 : 0;
  const guardianBonus = defender.job === 'Guardián' || defender.job === 'Comisario' ? 16 : 0;
  const dmg = 16 + weaponBonus + skillBonus + guardianBonus;
  animal.hp = Math.max(0, animal.hp - dmg);
  animal.cooldown = 55;

  if (animal.hp <= 0) {
    state.animals = state.animals.filter((a) => a.id !== animal.id);
    defender.inv.food += animal.foodYield;
    state.knowledge += 4;
    if (state.selectedEntity?.kind === 'animal' && state.selectedEntity.id === animal.id) {
      state.selectedEntity = null;
    }
    addLog(
      state,
      `${defender.name} se defendió y abatió a ${animal.name} (+${animal.foodYield} comida).`,
      'emerald'
    );
    return { killed: true, damageDealt: dmg };
  }

  animal.vx = Math.sign(animal.x - defender.x || 1) * 1.5;
  animal.vy = Math.sign(animal.y - defender.y || -1) * 1.2;
  addLog(state, `${defender.name} repelió el ataque de ${animal.name} (-${dmg} PV).`, 'amber');
  return { killed: false, damageDealt: dmg };
}

export function tameWildAnimal(state: SimulationState, animal: Animal, tamer: Agent): boolean {
  if (!animal.hostile || animal.tamed) return false;
  const hasSchool = isBuildingOperational(state, 'school');
  const minEdu = hasSchool ? 40 : 50;
  if (tamer.education < minEdu) return false;

  animal.tamed = true;
  animal.hostile = false;
  animal.ownerId = tamer.id;
  animal.hp = animal.maxHp;
  tamer.moodModifier = clamp(tamer.moodModifier + 12, -45, 45);
  tamer.thought = `Gracias a mi educación (${Math.round(tamer.education)}%) logré domesticar a ${animal.name}.`;
  tamer.lastQwenDecision = `Qwen 2.5 registró domesticación de ${animal.name} por ${tamer.name}.`;
  state.knowledge += 6;
  addLog(state, `¡${tamer.name} domesticó a ${animal.name} con su saber! Ahora protege la aldea.`, 'emerald');
  return true;
}

export function addRoadTile(state: SimulationState, x: number, y: number): RoadTile | null {
  const gx = clamp(Math.round(x / ROAD_GRID_SIZE) * ROAD_GRID_SIZE, 24, CANVAS_WIDTH - 24);
  const gy = clamp(Math.round(y / ROAD_GRID_SIZE) * ROAD_GRID_SIZE, 24, CANVAS_HEIGHT - 24);
  const bridgeX = state.bridge?.x ?? null;
  if (isPointInRiverWater(gx, gy, bridgeX)) return null;
  const exists = state.roads.some((r) => r.x === gx && r.y === gy);
  if (exists) return null;

  const tile: RoadTile = { id: state.nextId++, x: gx, y: gy, lit: true };
  state.roads.push(tile);
  return tile;
}

function addRoadLine(state: SimulationState, x1: number, y1: number, x2: number, y2: number): number {
  let added = 0;
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / ROAD_GRID_SIZE;
  const n = Math.max(1, Math.ceil(steps));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const rx = x1 + (x2 - x1) * t;
    const ry = y1 + (y2 - y1) * t;
    if (addRoadTile(state, rx, ry)) added++;
  }
  return added;
}

export function buildBaseRoads(state: SimulationState): number {
  let added = 0;
  const hubX = state.plaza ? state.plaza.x : WORLD_CENTER_X;
  const hubY = state.plaza ? state.plaza.y : WORLD_CENTER_Y;

  if (state.bridge) {
    added += addRoadLine(state, hubX, hubY, state.bridge.x, RIVER_BOTTOM_Y + 18);
    added += addRoadLine(state, state.bridge.x, RIVER_BOTTOM_Y + 18, state.bridge.x, 78);
    added += addRoadLine(state, state.bridge.x - 160, 78, state.bridge.x + 160, 78);
  }

  for (const house of state.houses) {
    if (house.zone === 'south') {
      added += addRoadLine(state, hubX, hubY, house.x, house.y + 12);
    } else if (state.bridge) {
      added += addRoadLine(state, state.bridge.x, 78, house.x, house.y + 12);
    }
  }
  for (const b of state.specialBuildings) {
    added += addRoadLine(state, hubX, hubY, b.x, b.y + 12);
  }
  if (added > 0) {
    addLog(state, `Se trazaron ${added} tramos de camino por necesidad de tránsito.`, 'sky');
  }
  return added;
}

export function isNearRoad(roads: RoadTile[], x: number, y: number): boolean {
  return roads.some((r) => Math.abs(r.x - x) <= 26 && Math.abs(r.y - y) <= 26);
}

export function createAnimal(
  state: SimulationState,
  type: AnimalType,
  x?: number,
  y?: number,
  variant?: FishVariant
): Animal {
  const id = state.nextId++;
  const isFish = type === 'fish';
  const isHostile = type === 'wildcat' || type === 'bear';

  const ax = x ?? (isHostile ? (Math.random() < 0.5 ? 120 : CANVAS_WIDTH - 120) : 140 + Math.random() * (CANVAS_WIDTH - 280));
  let ay = y;

  if (ay === undefined) {
    if (isFish) {
      ay = RIVER_TOP_Y + 12 + Math.random() * (RIVER_BOTTOM_Y - RIVER_TOP_Y - 24);
    } else if (isHostile) {
      ay = Math.random() < 0.4 ? NORTH_LAND_MIN_Y + 24 : SAFE_LAND_MIN_Y + 40 + Math.random() * 520;
    } else {
      ay = SAFE_LAND_MIN_Y + 40 + Math.random() * (CANVAS_HEIGHT - SAFE_LAND_MIN_Y - 90);
    }
  }

  if (!isFish && isPointInRiverWater(ax, ay, state.bridge?.x ?? null)) {
    ay = SAFE_LAND_MIN_Y + 24;
  }

  const fishVariant = isFish ? variant ?? FISH_VARIANTS[id % FISH_VARIANTS.length] : undefined;
  const maxHp = type === 'bear' ? 120 : type === 'wildcat' ? 65 : type === 'horse' ? 80 : 50;

  const animal: Animal = {
    id,
    type,
    name: `${ANIMAL_LABELS[type].split(' ')[0]} #${id}`,
    x: Math.round(ax),
    y: Math.round(ay),
    vx: (Math.random() - 0.5) * 0.7 || 0.35,
    vy: isFish ? 0 : (Math.random() - 0.5) * 0.4,
    hostile: isHostile,
    tamed: false,
    ownerId: null,
    hp: maxHp,
    maxHp,
    foodYield: type === 'bear' ? 4 : type === 'cow' ? 4 : type === 'horse' ? 3 : type === 'sheep' ? 2 : type === 'chicken' ? 2 : 1,
    milkReady: type === 'cow' ? 80 : 0,
    woolReady: type === 'sheep' ? 80 : 0,
    fishVariant,
    riderId: null,
    cooldown: 0,
    walkFrame: Math.random() * 6,
  };
  state.animals.push(animal);
  return animal;
}

export function interpretQwenDirective(
  promptText: string,
  agentNames: string[] = []
): {
  reply: string;
  actions: QwenAction[];
} {
  const q = promptText.toLowerCase();
  const actions: QwenAction[] = [];
  const summaryParts: string[] = [];

  const numMatch = q.match(/\b([1-6])\b/);
  const requestedCount = numMatch ? Number(numMatch[1]) : 1;

  const matchedName = agentNames.find((fullName) => {
    const first = fullName.split(' ')[0].toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedFull = fullName.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fullRe = new RegExp(`(?:^|[^a-záéíóúüñ])${escapedFull}(?:$|[^a-záéíóúüñ])`, 'i');
    const firstRe = new RegExp(`(?:^|[^a-záéíóúüñ])${first}(?:$|[^a-záéíóúüñ])`, 'i');
    return first.length >= 3 && (fullRe.test(q) || firstRe.test(q));
  });
  if (matchedName) {
    let job: JobType | undefined;
    if (q.includes('alcalde') || q.includes('ayuntamiento')) job = 'Alcalde';
    else if (q.includes('comisario') || q.includes('policia') || q.includes('cárcel')) job = 'Comisario';
    else if (q.includes('almacenero') || q.includes('depósito') || q.includes('deposito')) job = 'Almacenero';
    else if (q.includes('panader')) job = 'Panadero';
    else if (q.includes('herrer') || q.includes('forj')) job = 'Herrero';
    else if (q.includes('carpinter')) job = 'Carpintero';
    else if (q.includes('banquer') || q.includes('banco')) job = 'Banquero';
    else if (q.includes('maestr')) job = 'Maestro';
    else if (q.includes('artesan')) job = 'Artesano';
    else if (q.includes('guardi')) job = 'Guardián';
    else if (q.includes('botic')) job = 'Boticario';
    else if (q.includes('pescador') || q.includes('pesc') || q.includes('muelle')) job = 'Pescador';
    else if (q.includes('comerc') || q.includes('mercad')) job = 'Comerciante';
    else if (q.includes('curander') || q.includes('medic') || q.includes('hospital')) job = 'Curandero';
    else if (q.includes('constructor') || q.includes('constru')) job = 'Constructor';
    else if (q.includes('erudit') || q.includes('escuel') || q.includes('investig')) job = 'Erudito';
    else if (q.includes('agricultor') || q.includes('cultiv')) job = 'Agricultor';
    else if (q.includes('miner')) job = 'Minero';
    else if (q.includes('leñador') || q.includes('mader')) job = 'Leñador';

    let action: NonNullable<Extract<QwenAction, { type: 'DIRECT_VILLAGER' }>['action']> | undefined;
    if (q.includes('pareja') || q.includes('divor') || q.includes('separar')) action = 'switch_partner';
    else if (q.includes('guardar') || q.includes('baúl') || q.includes('baul') || q.includes('casa')) action = 'store_home';
    else if (q.includes('pesc')) action = 'fish';
    else if (q.includes('curar') || q.includes('sanar')) action = 'heal';
    else if (q.includes('constru')) action = 'build';
    else if (q.includes('comerc') || q.includes('vend')) action = 'trade';
    else if (q.includes('investig') || q.includes('estudi')) action = 'research';

    actions.push({ type: 'DIRECT_VILLAGER', agentName: matchedName, job, action });
    summaryParts.push(`directiva individual de Qwen 2.5 para ${matchedName}`);
  }

  if (q.includes('préstamo') || q.includes('prestamo') || q.includes('crédito') || q.includes('credito')) {
    actions.push({ type: 'ISSUE_BANK_LOANS' });
    summaryParts.push('préstamos bancarios para obras');
  }
  if (q.includes('aprendiz') || q.includes('mentor')) {
    actions.push({ type: 'FORM_MENTORSHIPS' });
    summaryParts.push('contratos de aprendizaje Maestro-Aprendiz');
  }
  if (q.includes('caravana')) {
    actions.push({ type: 'RUN_CARAVANS' });
    summaryParts.push('despacho de caravanas a caballo');
  }
  if (q.includes('reparar') || q.includes('mantenimiento')) {
    actions.push({ type: 'REPAIR_BUILDINGS' });
    summaryParts.push('mantenimiento y reparación de estructuras');
  }
  if (q.includes('tormenta') || q.includes('rayo')) {
    actions.push({ type: 'TRIGGER_LIGHTNING_STORM' });
    summaryParts.push('tormenta eléctrica');
  }
  if (q.includes('incendio') || q.includes('fuego')) {
    actions.push({ type: 'TRIGGER_FIRE' });
    summaryParts.push('incendio');
  }
  if (q.includes('prohibir pesca')) {
    actions.push({ type: 'TOGGLE_LAW', lawId: 'ban_fishing', active: true });
    summaryParts.push('ley de veda de pesca');
  }
  if (q.includes('prohibir madera') || q.includes('prohibir comercio de madera')) {
    actions.push({ type: 'TOGGLE_LAW', lawId: 'ban_trade_wood', active: true });
    summaryParts.push('ley de veda forestal');
  }
  if (q.includes('prohibir oro') || q.includes('prohibir minería')) {
    actions.push({ type: 'TOGGLE_LAW', lawId: 'ban_mine_gold', active: true });
    summaryParts.push('moratoria de minería de Oro');
  }
  if (q.includes('prohibir pan')) {
    actions.push({ type: 'TOGGLE_LAW', lawId: 'ban_trade_bread', active: true });
    summaryParts.push('prohibición de venta de pan');
  }
  if (q.includes('representante') || q.includes('elección')) {
    actions.push({ type: 'ELECT_REPRESENTATIVE' });
    summaryParts.push('elección de representante');
  }

  if (q.includes('ayuntamiento')) {
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'town_hall' });
    summaryParts.push('construcción de Ayuntamiento');
  }
  if (q.includes('comisaria') || q.includes('comisaría')) {
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'police_station' });
    summaryParts.push('construcción de Comisaría');
  }
  if (q.includes('carcel') || q.includes('cárcel')) {
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'prison' });
    summaryParts.push('construcción de Cárcel');
  }
  if (q.includes('deposito') || q.includes('depósito')) {
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'general_depot' });
    summaryParts.push('construcción de Depósito General');
  }

  if (!matchedName && (q.includes('cambiar de pareja') || q.includes('cambio de pareja') || q.includes('nuevas parejas'))) {
    actions.push({ type: 'SET_POLICIES', patch: { allowPartnerSwitch: true } });
    summaryParts.push('libertad para cambiar de pareja');
  }

  if (q.includes('pausar recurso') || q.includes('sin recurso') || q.includes('cortar recurso') || q.includes('detener recurso')) {
    actions.push({ type: 'PAUSE_RESOURCES', paused: true });
    summaryParts.push('pausa total de recursos automáticos');
  } else if (q.includes('reanudar recurso') || q.includes('activar recurso') || q.includes('dar recurso')) {
    actions.push({ type: 'PAUSE_RESOURCES', paused: false });
    summaryParts.push('reactivación de recursos');
  }

  if (q.includes('camino') || q.includes('sendero') || q.includes('calle') || q.includes('ruta') || q.includes('alumbrad') || q.includes('farol')) {
    actions.push({ type: 'ADD_ROADS' });
    summaryParts.push('trazado de caminos iluminados');
  }

  if (q.includes('muelle') || (q.includes('pesc') && !q.includes('prohibir'))) {
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'dock' });
    summaryParts.push('construcción de Muelle Fluvial');
  }

  if (!matchedName && (q.includes('banco') || q.includes('respaldo')) && !q.includes('préstamo') && !q.includes('prestamo')) {
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'bank' });
    summaryParts.push('construcción de Banco Central');
  }

  const isNorth = q.includes('zona norte') || q.includes('al norte') || q.includes('cruzando el puente') || q.includes('otro lado');

  if (
    (q.includes('matar') || q.includes('destruir') || q.includes('secar') || q.includes('arruinar')) &&
    (q.includes('cultiv') || q.includes('cosech') || q.includes('siembr') || q.includes('granja'))
  ) {
    actions.push({ type: 'KILL_CROPS' });
    summaryParts.push('destrucción de cultivos');
  } else if (q.includes('cultiv') || q.includes('sembr') || q.includes('granja') || q.includes('trigo') || q.includes('cosech')) {
    actions.push({ type: 'PLANT_CROPS', count: clamp(requestedCount, 2, 4), zone: isNorth ? 'north' : 'south' });
    summaryParts.push(isNorth ? 'parcelas agrícolas en Zona Norte' : 'creación de parcelas agrícolas');
  }

  if (q.includes('econom') || q.includes('comerc') || q.includes('mercad') || q.includes('moneda') || q.includes('negocio')) {
    actions.push({ type: 'GENERATE_ECONOMY' });
    summaryParts.push('activación de economía respaldada y comercios');
  }

  if (
    q.includes('permitir más aldeano') ||
    q.includes('permitir mas aldeano') ||
    q.includes('más aldeano') ||
    q.includes('mas aldeano') ||
    q.includes('más habitante') ||
    q.includes('mas habitante') ||
    q.includes('crecer población') ||
    q.includes('crecer poblacion') ||
    q.includes('nuevos aldeano') ||
    q.includes('sumar aldeano') ||
    q.includes('tener más hijo') ||
    q.includes('tener mas hijo')
  ) {
    const spawnMatch = q.match(/(?:sumar|agregar|traer|nuevos?|invitar)\s*(\d+)/);
    const spawnCount = spawnMatch ? clamp(Number(spawnMatch[1]), 1, 6) : 2;
    actions.push({ type: 'ALLOW_MORE_VILLAGERS', spawnCount });
    summaryParts.push(`expansión poblacional (+${spawnCount} colonos)`);
  }

  if (q.includes('enfermer') || q.includes('hospital') || q.includes('clínica')) {
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'infirmary' });
    summaryParts.push('construcción de Hospital');
  }
  if (q.includes('escuela') || q.includes('bibliot') || q.includes('academia')) {
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'school' });
    summaryParts.push('construcción de Escuela');
  }
  if (q.includes('panader')) {
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'bakery' });
    summaryParts.push('construcción de Panadería');
  }
  if (!matchedName && q.includes('carpinter')) {
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'carpentry' });
    summaryParts.push('construcción de Carpintería');
  }
  if (q.includes('botic') || q.includes('farmac')) {
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'apothecary' });
    summaryParts.push('construcción de Botica');
  }
  if (q.includes('forja') || q.includes('herrer')) {
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'forge' });
    summaryParts.push('construcción de Herrería / Forja');
  }
  if (q.includes('comercios') || q.includes('tiendas') || q.includes('locales')) {
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'market' });
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'bakery' });
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'carpentry' });
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'general_depot' });
    actions.push({ type: 'BUILD_SPECIAL', buildingType: 'bank' });
    summaryParts.push('apertura de distintos comercios, Depósito y Banco');
  }

  if (q.includes('gato salvaje')) {
    actions.push({ type: 'SPAWN_ANIMAL', animalType: 'wildcat', count: requestedCount });
    summaryParts.push('aparición de gato salvaje');
  } else if (q.includes('gato')) {
    actions.push({ type: 'SPAWN_ANIMAL', animalType: 'cat', count: requestedCount });
    summaryParts.push('adopción de gato(s)');
  }
  if (q.includes('perro')) {
    actions.push({ type: 'SPAWN_ANIMAL', animalType: 'dog', count: requestedCount });
    summaryParts.push('incorporación de perro(s) guardián');
  }
  if (q.includes('oso')) {
    actions.push({ type: 'SPAWN_ANIMAL', animalType: 'bear', count: requestedCount });
    summaryParts.push('aparición de oso(s)');
  }
  if (q.includes('gallina')) {
    actions.push({ type: 'SPAWN_ANIMAL', animalType: 'chicken', count: Math.max(2, requestedCount) });
    summaryParts.push('cría de gallinas');
  }
  if (q.includes('vaca')) {
    actions.push({ type: 'SPAWN_ANIMAL', animalType: 'cow', count: requestedCount });
    summaryParts.push('cría de vacas lecheras');
  }
  if (q.includes('caballo')) {
    actions.push({ type: 'SPAWN_ANIMAL', animalType: 'horse', count: requestedCount });
    summaryParts.push('caballos de transporte');
  }
  if (q.includes('oveja')) {
    actions.push({ type: 'SPAWN_ANIMAL', animalType: 'sheep', count: Math.max(2, requestedCount) });
    summaryParts.push('cría de ovejas');
  }
  if (q.includes('peces') || q.includes('pez')) {
    actions.push({ type: 'SPAWN_ANIMAL', animalType: 'fish', count: Math.max(4, requestedCount) });
    summaryParts.push('repoblación de peces en el río');
  }

  if (q.includes('plaza') || q.includes('fuente')) {
    actions.push({ type: 'BUILD_PLAZA' });
    summaryParts.push('construcción de Plaza decidida por Qwen');
  }
  if (q.includes('puente') || q.includes('cruzar el río') || q.includes('cruzar el rio')) {
    actions.push({ type: 'BUILD_BRIDGE' });
    summaryParts.push('construcción de Puente sobre el río');
  }

  const houseMatch = q.match(/(?:(\d+)\s*)?(?:casas?|viviendas?|refugios?|chozas?)/);
  const expandNorthMatch = q.match(/(?:crear|crea|hacer|hace|construir|construye|construyan|agregar|sumar|expandir)\s*(?:(\d+)\s*)?zona norte/);
  if (
    (houseMatch && !q.includes('sin casa') && !matchedName) ||
    expandNorthMatch ||
    (isNorth && !q.includes('cultiv')) ||
    (q.includes('constru') &&
      !q.includes('plaza') &&
      !q.includes('puente') &&
      !q.includes('banco') &&
      !q.includes('escuela') &&
      !q.includes('mercado') &&
      !q.includes('enfermer') &&
      !q.includes('hospital') &&
      !q.includes('panader') &&
      !q.includes('carpinter') &&
      !q.includes('botic') &&
      !q.includes('comerc') &&
      !q.includes('forja') &&
      !q.includes('muelle') &&
      !q.includes('ayuntamiento') &&
      !q.includes('comisaria') &&
      !q.includes('comisaría') &&
      !q.includes('carcel') &&
      !q.includes('cárcel') &&
      !q.includes('deposito') &&
      !q.includes('depósito') &&
      !q.includes('camino'))
  ) {
    const rawCount = houseMatch?.[1] ?? expandNorthMatch?.[1];
    const count = clamp(rawCount ? Number(rawCount) : requestedCount, 1, 6);
    actions.push({ type: 'BUILD_HOUSES', count, zone: isNorth ? 'north' : 'south' });
    actions.push({ type: 'SET_POLICIES', patch: { buildPriority: true } });
    summaryParts.push(isNorth ? `expansión en Zona Norte (${count} casa/s)` : `construcción de ${count} casa(s)`);
  }

  const upgradeMatch = q.match(/(?:mejorar|mejora|mejoren|subir|ampliar)\s*(?:(\d+)\s*)?(?:casas?|viviendas?|refugios?)/);
  if (upgradeMatch || q.includes('mejorar') || q.includes('mejoren') || q.includes('subir nivel') || q.includes('ampliar')) {
    const count = clamp(upgradeMatch && upgradeMatch[1] ? Number(upgradeMatch[1]) : 1, 1, 6);
    actions.push({ type: 'UPGRADE_HOUSES', count });
    actions.push({ type: 'SET_POLICIES', patch: { buildPriority: true } });
    summaryParts.push(`mejora de ${count} casa(s)`);
  }

  if (!matchedName && (q.includes('trabajo') || q.includes('activo') || q.includes('oficio') || q.includes('productiv'))) {
    let preferredJob: JobType | undefined;
    if (q.includes('constructor')) preferredJob = 'Constructor';
    else if (q.includes('minero')) preferredJob = 'Minero';
    else if (q.includes('carpinter')) preferredJob = 'Carpintero';
    else if (q.includes('banquer')) preferredJob = 'Banquero';
    else if (q.includes('maestr')) preferredJob = 'Maestro';
    else if (q.includes('artesan')) preferredJob = 'Artesano';
    else if (q.includes('guardi')) preferredJob = 'Guardián';
    else if (q.includes('comerciante')) preferredJob = 'Comerciante';
    else if (q.includes('curandero')) preferredJob = 'Curandero';
    else if (q.includes('erudito')) preferredJob = 'Erudito';
    else if (q.includes('agricultor')) preferredJob = 'Agricultor';
    else if (q.includes('pescador')) preferredJob = 'Pescador';
    else if (q.includes('panadero')) preferredJob = 'Panadero';
    else if (q.includes('herrero')) preferredJob = 'Herrero';
    else if (q.includes('boticario')) preferredJob = 'Boticario';
    else if (q.includes('alcalde')) preferredJob = 'Alcalde';
    else if (q.includes('comisario')) preferredJob = 'Comisario';
    else if (q.includes('almacenero')) preferredJob = 'Almacenero';
    actions.push({ type: 'ASSIGN_ACTIVE_JOBS', preferredJob });
    actions.push({ type: 'SET_POLICIES', patch: { workFocus: true } });
    summaryParts.push(preferredJob ? `asignación al oficio ${preferredJob}` : 'asignación activa de oficios');
  }

  if (q.includes('evoluc') || q.includes('era') || q.includes('avanz') || q.includes('tecnolog') || q.includes('saber')) {
    actions.push({ type: 'BOOST_EVOLUTION', knowledgeGain: 45 });
    actions.push({ type: 'SET_POLICIES', patch: { evolutionFocus: true } });
    summaryParts.push('impulso a la evolución de la especie y la aldea');
  }

  if (!matchedName && (q.includes('curar') || q.includes('salud') || q.includes('sanar'))) {
    actions.push({ type: 'HEAL_VILLAGERS' });
    actions.push({ type: 'SET_POLICIES', patch: { healthPriority: true } });
    summaryParts.push('curación y prioridad sanitaria');
  }

  if (
    q.includes('felic') ||
    q.includes('ánimo') ||
    q.includes('animo') ||
    q.includes('excit') ||
    q.includes('depre') ||
    q.includes('sentimiento') ||
    q.includes('moral')
  ) {
    const isNegative = q.includes('triste') || q.includes('depre') || q.includes('bajar') || q.includes('miedo') || q.includes('estricto');
    actions.push({
      type: 'ADJUST_VILLAGE_MOOD',
      delta: isNegative ? -25 : 22,
      thought: isNegative
        ? 'Siento el peso de las exigencias y el desánimo en la aldea.'
        : '¡Me siento con excitación laboral y entusiasmo para producir más!',
    });
    actions.push({
      type: 'SET_POLICIES',
      patch: { moodDirective: isNegative ? 'disciplined' : 'optimistic' },
    });
    summaryParts.push(isNegative ? 'ajuste de disciplina/desánimo' : 'excitación laboral y entusiasmo');
  }

  if (q.includes('no reproduc') || q.includes('menos hijos') || q.includes('natalidad')) {
    actions.push({ type: 'SET_POLICIES', patch: { reproductionRestraint: true } });
    summaryParts.push('control moderado de natalidad');
  }

  if (actions.length === 0) {
    actions.push({ type: 'ASSIGN_ACTIVE_JOBS' });
    actions.push({ type: 'BOOST_EVOLUTION', knowledgeGain: 25 });
    actions.push({ type: 'SET_POLICIES', patch: { workFocus: true, evolutionFocus: true } });
    return {
      reply:
        'Regla ejecutada por Qwen 2.5: Organicé a los aldeanos en oficios productivos e impulsé la evolución de la especie.',
      actions,
    };
  }

  return {
    reply: `Reglas ejecutadas por Qwen 2.5 en los aldeanos: ${summaryParts.join('; ')}.`,
    actions,
  };
}

export function applyQwenActions(
  state: SimulationState,
  actions: QwenAction[],
  spawnSettlerFn?: (state: SimulationState, count: number) => number
): string[] {
  const executed: string[] = [];
  const builtInBatch = new Set<SpecialBuildingType>();
  const orderedActions = [...actions].sort((a, b) => {
    const rank = (act: QwenAction) => (act.type === 'ALLOW_MORE_VILLAGERS' ? 0 : 1);
    return rank(a) - rank(b);
  });

  for (const action of orderedActions) {
    switch (action.type) {
      case 'PAUSE_RESOURCES': {
        state.resourcesPaused = action.paused;
        executed.push(action.paused ? 'Recursos externos pausados' : 'Recursos externos activos');
        addLog(
          state,
          action.paused
            ? 'Se pausó por completo la entrega automática de recursos.'
            : 'Se reanudó la generación de recursos en la aldea.',
          action.paused ? 'amber' : 'emerald'
        );
        break;
      }
      case 'TOGGLE_LAW': {
        const law = toggleVillageLaw(state, action.lawId, action.active, 'Qwen 2.5');
        if (law) executed.push(`${law.name}: ${law.active ? 'Activa' : 'Derogada'}`);
        break;
      }
      case 'TRIGGER_LIGHTNING_STORM': {
        const f = triggerLightningStorm(state);
        executed.push(f ? 'Tormenta eléctrica e incendio iniciado' : 'Tormenta eléctrica desatada');
        break;
      }
      case 'TRIGGER_FIRE': {
        const f = spawnFire(
          state,
          WORLD_CENTER_X + (Math.random() - 0.5) * 200,
          SAFE_LAND_MIN_Y + 120 + Math.random() * 200,
          'Directiva Qwen 2.5'
        );
        executed.push(`Incendio en (${Math.round(f.x)}, ${Math.round(f.y)})`);
        break;
      }
      case 'ELECT_REPRESENTATIVE': {
        const rep = electRepresentative(state);
        executed.push(rep ? `Representante: ${rep.name}` : 'Sin representante disponible');
        break;
      }
      case 'ISSUE_BANK_LOANS': {
        const candidates = state.agents.filter(
          (a) => !a.isChild && (a.job === 'Constructor' || a.job === 'Carpintero') && a.coins < 25
        );
        let issued = 0;
        for (const c of candidates.slice(0, 3)) {
          if (grantBankLoan(state, c, 15, 'capital de obra')) issued++;
        }
        executed.push(issued > 0 ? `${issued} préstamo(s) bancarios emitidos` : 'Banco no operativo o sin solicitantes');
        break;
      }
      case 'FORM_MENTORSHIPS': {
        const count = assignMentorships(state);
        executed.push(count > 0 ? `${count} contratos de aprendizaje` : 'Sin nuevos aprendices');
        break;
      }
      case 'REPAIR_BUILDINGS': {
        const builder = state.agents.find((a) => a.job === 'Constructor' || a.job === 'Carpintero') ?? state.agents[0] ?? null;
        const count = repairDamagedStructures(state, builder);
        executed.push(count > 0 ? `${count} estructura(s) reparadas` : 'Estructuras sanas o falta material');
        break;
      }
      case 'RUN_CARAVANS': {
        let dispatched = 0;
        for (const agent of state.agents) {
          if (!agent.isChild && dispatched < 3) {
            agent.taskType = 'caravan';
            agent.taskTimer = 38;
            agent.activity = getConciseTaskLabel('caravan');
            dispatched++;
          }
        }
        executed.push(`${dispatched} caravana(s) despachada(s)`);
        addLog(state, `Qwen 2.5 despachó ${dispatched} caravana(s) comerciales.`, 'sky');
        break;
      }
      case 'KILL_CROPS': {
        const removed = killAllCrops(state);
        executed.push(removed > 0 ? `${removed} cultivo(s) destruidos` : 'Sin cultivos activos');
        break;
      }
      case 'ADD_ROADS': {
        const added = buildBaseRoads(state);
        executed.push(added > 0 ? `+${added} tramos de camino` : 'Red de caminos al día');
        break;
      }
      case 'SPAWN_ANIMAL': {
        for (let i = 0; i < action.count; i++) {
          createAnimal(state, action.animalType);
        }
        executed.push(`+${action.count} ${ANIMAL_LABELS[action.animalType]}`);
        addLog(state, `Qwen 2.5 incorporó ${action.count} ${ANIMAL_LABELS[action.animalType]} al ecosistema.`, 'sky');
        break;
      }
      case 'DIRECT_VILLAGER': {
        const target = state.agents.find(
          (a) =>
            a.name.toLowerCase() === action.agentName.toLowerCase() ||
            a.name.toLowerCase().startsWith(action.agentName.split(' ')[0].toLowerCase())
        );
        if (!target) {
          executed.push(`No se encontró a ${action.agentName}`);
          break;
        }
        const changes: string[] = [];
        if (action.job && !target.isChild) {
          target.job = action.job;
          changes.push(`oficio ${action.job}`);
        }
        if (action.action === 'switch_partner') {
          const sw = switchPartnerForAgent(state, target.id, 'decisión solicitada');
          changes.push(sw.newPartnerName ? `nueva pareja (${sw.newPartnerName})` : 'separación');
        } else if (action.action === 'store_home') {
          const house = target.houseId !== null ? state.houses.find((h) => h.id === target.houseId) : null;
          const depot = state.specialBuildings.find((b) => b.type === 'general_depot' && b.isOperational) ?? null;
          if (house) {
            const moved = depositResourcesToHouse(target, house, 'surplus', depot);
            changes.push(`guardó ${moved} bienes`);
          }
        } else if (action.action === 'fish') {
          target.taskType = 'fish_river';
          target.taskTimer = 36;
          target.activity = getConciseTaskLabel('fish_river');
          changes.push('pesca en el río');
        } else if (action.action === 'heal') {
          cureAgent(state, target.id);
          changes.push('atención médica');
        } else if (action.action === 'build') {
          target.taskType = 'build_house';
          target.taskTimer = 36;
          target.activity = getConciseTaskLabel('build_house');
          changes.push('priorizar construcción');
        } else if (action.action === 'trade') {
          target.taskType = 'trade';
          target.taskTimer = 36;
          target.activity = getConciseTaskLabel('trade');
          changes.push('actividad comercial');
        } else if (action.action === 'research') {
          target.taskType = 'research';
          target.taskTimer = 36;
          target.activity = getConciseTaskLabel('research');
          changes.push('investigación');
        } else {
          target.taskTimer = 0;
        }
        syncSpecialBuildingStaff(state);
        const desc = changes.length > 0 ? changes.join(' + ') : `reorganización de ${target.job}`;
        target.lastQwenDecision = `Orden directa de Qwen 2.5: ${desc}.`;
        target.qwenPlan = desc;
        target.thought = `Qwen 2.5 me encomendó: ${desc}.`;
        executed.push(`${target.name}: ${desc}`);
        addLog(state, `Qwen 2.5 dirigió a ${target.name} (${desc}).`, 'violet');
        break;
      }
      case 'GENERATE_ECONOMY': {
        state.policies.economyFocus = true;
        const builder = state.agents.find((a) => !a.isChild) ?? null;
        const builtNames: string[] = [];
        for (const ecoType of ['bank', 'market', 'bakery', 'general_depot'] as SpecialBuildingType[]) {
          if (!state.specialBuildings.some((b) => b.type === ecoType) && hasAvailableOperatorForBuilding(state, ecoType)) {
            if (consumeConstructionResources(state, builder, { wood: 3, stone: 2 })) {
              const created = createSpecialBuilding(
                state,
                ecoType,
                'Directiva Qwen 2.5',
                undefined,
                undefined,
                builder?.constructionKnowledge ?? 25
              );
              if (created) {
                builtInBatch.add(ecoType);
                builtNames.push(created.name);
              }
            }
          }
        }
        addPreciousMetalToReserve(state, 'gold', 2);
        addPreciousMetalToReserve(state, 'silver', 3);
        let traders = 0;
        let distributedCoins = 0;
        for (const agent of state.agents) {
          if (
            !agent.isChild &&
            (agent.job === 'Recolector' || agent.job === 'Aprendiz') &&
            traders < Math.max(3, Math.ceil(state.agents.length / 4))
          ) {
            agent.job = traders === 0 ? 'Banquero' : traders === 1 ? 'Panadero' : 'Comerciante';
            traders++;
          }
          const minted = mintBackedCoins(state, 6);
          agent.coins += minted;
          distributedCoins += minted;
          agent.taskTimer = 0;
          agent.lastQwenDecision = `Qwen 2.5 activó comercio respaldado (+${minted} monedas).`;
          agent.thought = 'Participo en el Banco y los comercios con respaldo en Oro y Plata.';
        }
        syncSpecialBuildingStaff(state);
        state.knowledge += 12;
        executed.push(
          `${builtNames.length > 0 ? builtNames.join(' y ') : 'Economía respaldada'} · ${traders} puestos · +${distributedCoins} monedas`
        );
        addLog(
          state,
          builtNames.length > 0
            ? `Qwen 2.5 activó la economía aldeana y levantó: ${builtNames.join(', ')}.`
            : 'Qwen 2.5 activó política económica y oficios comerciales; falta madera/piedra para erigir más locales.',
          'amber'
        );
        break;
      }
      case 'ALLOW_MORE_VILLAGERS': {
        state.policies.reproductionRestraint = false;
        let spawned = 0;
        if (spawnSettlerFn && action.spawnCount && action.spawnCount > 0) {
          spawned = spawnSettlerFn(state, action.spawnCount);
        }
        if (shouldBuildHouse(state)) {
          const builder = state.agents.find((a) => !a.isChild) ?? null;
          if (consumeConstructionResources(state, builder, { wood: 3 })) {
            createHouseNearCenter(state, 'Expansión Qwen 2.5', 'south', undefined, undefined, undefined, builder?.constructionKnowledge ?? 20);
          }
        }
        for (const agent of state.agents) {
          agent.reproductionCooldown = 0;
          agent.lastQwenDecision = 'Qwen 2.5 habilitó expansión de la especie.';
          agent.thought = 'La aldea evoluciona y hay espacio para nuevas familias y progreso.';
        }
        executed.push(
          spawned > 0
            ? `Natalidad abierta · +${spawned} nuevo(s) aldeano(s)`
            : 'Natalidad abierta y vivienda verificada'
        );
        addLog(state, 'Qwen 2.5 habilitó expansión poblacional sin restricciones.', 'emerald');
        break;
      }
      case 'BUILD_PLAZA': {
        if (state.plaza) {
          executed.push('Plaza ya construida');
          break;
        }
        const builder = state.agents.find((a) => !a.isChild) ?? null;
        if (!consumeConstructionResources(state, builder, { wood: 4, stone: 4 })) {
          executed.push('Plaza pendiente: faltan recursos (4 madera + 4 piedra)');
          addLog(state, 'Qwen 2.5 pospuso la Plaza: faltan 4 de madera y 4 de piedra en inventarios/baúles.', 'amber');
          break;
        }
        const plaza = createPlaza(state, 'Directiva Qwen 2.5');
        state.knowledge += 14;
        executed.push(`Plaza en (${plaza.x}, ${plaza.y})`);
        addLog(state, `Qwen 2.5 decidió erigir la Plaza Central en (${plaza.x}, ${plaza.y}).`, 'sky');
        break;
      }
      case 'BUILD_BRIDGE': {
        if (state.bridge) {
          executed.push('Puente ya construido');
          break;
        }
        const builder = state.agents.find((a) => !a.isChild) ?? null;
        if (!consumeConstructionResources(state, builder, { wood: 4, stone: 2 })) {
          executed.push('Puente pendiente: faltan recursos (4 madera + 2 piedra)');
          addLog(state, 'Qwen 2.5 pospuso el Puente: faltan 4 de madera y 2 de piedra.', 'amber');
          break;
        }
        const bridge = createBridge(state, 'Directiva Qwen 2.5');
        state.knowledge += 14;
        executed.push(`Puente en X=${bridge.x}`);
        addLog(state, `Qwen 2.5 eligió cruzar el río y construyó el Puente en X=${bridge.x}.`, 'sky');
        break;
      }
      case 'BUILD_SPECIAL': {
        if (builtInBatch.has(action.buildingType)) {
          break;
        }
        const label = SPECIAL_BUILDING_LABELS[action.buildingType].label;
        if (!hasAvailableOperatorForBuilding(state, action.buildingType) && !state.specialBuildings.some((b) => b.type === action.buildingType)) {
          executed.push(`${label} cancelado: falta operario disponible`);
          addLog(state, `No se construye ${label} porque no hay ningún operario disponible para administrarlo.`, 'amber');
          break;
        }
        const builder = state.agents.find((a) => !a.isChild) ?? null;
        if (!consumeConstructionResources(state, builder, { wood: 3, stone: 2 })) {
          executed.push(`${label} pendiente: faltan recursos (3 madera + 2 piedra)`);
          addLog(state, `No hay recursos suficientes (3 madera + 2 piedra) para construir ${label}.`, 'amber');
          break;
        }
        const b = createSpecialBuilding(
          state,
          action.buildingType,
          'Directiva Qwen 2.5',
          undefined,
          undefined,
          builder?.constructionKnowledge ?? 25
        );
        if (!b) {
          executed.push(`${label} requiere operario libre`);
          break;
        }
        builtInBatch.add(action.buildingType);
        state.knowledge += 18;
        executed.push(`${b.name} (N${b.level})`);
        addLog(state, `Qwen 2.5 ubicó ${b.name} en (${b.x}, ${b.y}) (Nivel ${b.level}).`, 'sky');
        break;
      }
      case 'PLANT_CROPS': {
        state.policies.farmingFocus = true;
        let planted = 0;
        for (let i = 0; i < action.count; i++) {
          const builder = state.agents.find((a) => !a.isChild) ?? null;
          if (!consumeConstructionResources(state, builder, { wood: 1 })) break;
          createFarmPlot(state, action.zone ?? 'south');
          planted++;
        }
        let farmers = 0;
        for (const agent of state.agents) {
          if (!agent.isChild && farmers < 2 && agent.job === 'Recolector') {
            agent.job = 'Agricultor';
            agent.taskTimer = 0;
            agent.lastQwenDecision = 'Qwen 2.5 lo asignó a cultivar nuevas parcelas.';
            farmers++;
          }
        }
        executed.push(planted > 0 ? `+${planted} parcela(s) de cultivo` : 'Falta madera para cercar cultivos');
        if (planted > 0) addLog(state, `Qwen 2.5 habilitó ${planted} parcela(s) agrícolas.`, 'emerald');
        break;
      }
      case 'BUILD_HOUSES': {
        let built = 0;
        for (let i = 0; i < action.count; i++) {
          if (!shouldBuildHouse(state)) {
            if (built === 0) {
              executed.push('Sin casas innecesarias: todos tienen hogar');
            }
            break;
          }
          const builder = state.agents.find((a) => !a.isChild) ?? null;
          if (!consumeConstructionResources(state, builder, { wood: 3 })) {
            if (built === 0) {
              executed.push('Casas pendientes: faltan recursos (3 madera por casa)');
              addLog(state, 'Sin madera suficiente en inventarios/baúles para construir viviendas.', 'amber');
            }
            break;
          }
          const zone = action.zone === 'north' && state.bridge ? 'north' : 'south';
          const h = createHouseNearCenter(
            state,
            'Directiva Qwen 2.5',
            zone,
            undefined,
            undefined,
            undefined,
            builder?.constructionKnowledge ?? 20
          );
          built++;
          executed.push(`Construida ${h.name} (${h.x},${h.y})`);
        }
        if (built > 0) {
          addLog(
            state,
            `Qwen 2.5 ubicó y ordenó construir ${built} vivienda(s) en ${action.zone === 'north' && state.bridge ? 'Zona Norte' : 'la aldea'}.`,
            'emerald'
          );
        }
        break;
      }
      case 'UPGRADE_HOUSES': {
        let upgraded = 0;
        for (let i = 0; i < action.count; i++) {
          const builder = state.agents.find((a) => !a.isChild) ?? null;
          if (!consumeConstructionResources(state, builder, { wood: 2, stone: 1 })) break;
          const h = upgradeLowestHouse(state, builder?.constructionKnowledge ?? 30);
          if (h) upgraded++;
        }
        if (upgraded > 0) {
          executed.push(`Mejoradas ${upgraded} casa(s)`);
          addLog(state, `Qwen 2.5 mejoró ${upgraded} vivienda(s) de la aldea.`, 'sky');
        } else {
          executed.push('Mejora pendiente: faltan recursos o tope de era alcanzado');
        }
        break;
      }
      case 'ASSIGN_ACTIVE_JOBS': {
        for (const agent of state.agents) {
          agent.job =
            action.preferredJob && !agent.isChild
              ? action.preferredJob
              : assignBalancedJob(agent, state.agents, state.houses, state.policies, state.specialBuildings);
          agent.taskTimer = 0;
          agent.lastQwenDecision = `Qwen 2.5 asignó oficio ${agent.job}.`;
          agent.qwenPlan = `Ejercer ${agent.job}`;
          agent.thought = `Asumí el oficio de ${agent.job} para evolucionar la aldea.`;
        }
        syncSpecialBuildingStaff(state);
        executed.push(action.preferredJob ? `Oficio ${action.preferredJob} asignado` : 'Oficios activos reasignados');
        addLog(state, 'Qwen 2.5 organizó los oficios activos en los aldeanos.', 'violet');
        break;
      }
      case 'BOOST_EVOLUTION': {
        state.knowledge += action.knowledgeGain;
        for (const agent of state.agents) {
          if (!agent.isChild) {
            agent.education = clamp(agent.education + Math.round(action.knowledgeGain * 0.25), 0, 100);
            agent.carpentryKnowledge = clamp(agent.carpentryKnowledge + Math.round(action.knowledgeGain * 0.2), 0, 100);
            agent.constructionKnowledge = clamp(agent.constructionKnowledge + Math.round(action.knowledgeGain * 0.2), 0, 100);
            syncAgentSkills(agent);
          }
        }
        const newEra = computeEra(state.knowledge, state.houses);
        if (newEra !== state.era) {
          state.era = newEra;
          addLog(state, `¡La aldea evolucionó a ${ERA_METADATA[newEra].label}!`, 'emerald');
        } else {
          addLog(state, `Impulso científico de Qwen 2.5: +${action.knowledgeGain} de conocimiento.`, 'violet');
        }
        executed.push(`+${action.knowledgeGain} conocimiento evolutivo`);
        break;
      }
      case 'SET_POLICIES': {
        state.policies = { ...state.policies, ...action.patch };
        executed.push('Políticas activas actualizadas');
        break;
      }
      case 'HEAL_VILLAGERS': {
        let healed = 0;
        for (const agent of state.agents) {
          if (agent.isSick || agent.health < 85) {
            if (agent.illness?.incurable) {
              agent.happiness = clamp(agent.happiness + 8, 0, 100);
              agent.moodModifier = clamp(agent.moodModifier + 8, -45, 45);
              continue;
            }
            agent.isSick = false;
            agent.illness = null;
            agent.illnessName = null;
            agent.health = clamp(Math.max(agent.health + 35, 90), 0, 100);
            agent.moodModifier = clamp(agent.moodModifier + 10, -45, 45);
            agent.happiness = clamp(agent.happiness + 12, 0, 100);
            agent.emotion = deriveAgentEmotion(agent, state.weather);
            agent.lastQwenDecision = 'Qwen 2.5 ejecutó campaña médica de recuperación.';
            healed++;
          }
        }
        executed.push(`Atendidos ${healed} aldeano(s)`);
        addLog(state, `Campaña médica de Qwen 2.5: ${healed} aldeano(s) recuperados.`, 'emerald');
        break;
      }
      case 'ADD_VILLAGE_RESOURCES': {
        if (state.resourcesPaused) {
          executed.push('Bloqueado (recursos pausados)');
          break;
        }
        for (let i = 0; i < action.count; i++) {
          const isMetal =
            action.resource === 'stone' ||
            action.resource === 'copper' ||
            action.resource === 'iron' ||
            action.resource === 'gold' ||
            action.resource === 'silver';
          const rx = isMetal
            ? MOUNTAIN_MIN_X + 24 + Math.random() * (CANVAS_WIDTH - MOUNTAIN_MIN_X - 60)
            : action.resource === 'wood'
              ? 40 + Math.random() * (FOREST_MAX_X - 70)
              : 120 + Math.random() * (CANVAS_WIDTH - 240);
          state.resources.push({
            id: state.nextId++,
            type: action.resource,
            x: rx,
            y: SAFE_LAND_MIN_Y + 12 + Math.random() * (CANVAS_HEIGHT - SAFE_LAND_MIN_Y - 50),
            amount: 6,
            maxAmount: 6,
            depleted: false,
            restTimer: 0,
          });
        }
        executed.push(`+${action.count} nodos de ${action.resource}`);
        addLog(state, `Qwen 2.5 generó ${action.count} nodos de ${action.resource}.`, 'amber');
        break;
      }
      case 'ADJUST_VILLAGE_MOOD': {
        for (const agent of state.agents) {
          agent.moodModifier = clamp(agent.moodModifier + action.delta, -45, 45);
          agent.happiness = clamp(agent.happiness + action.delta, 0, 100);
          if (action.thought) agent.thought = action.thought;
          agent.emotion = deriveAgentEmotion(agent, state.weather);
        }
        executed.push(`Ánimo ajustado (${action.delta >= 0 ? '+' : ''}${action.delta})`);
        addLog(state, 'Qwen 2.5 moduló el estado emocional de la aldea.', 'sky');
        break;
      }
    }
  }

  state.era = computeEra(state.knowledge, state.houses);
  recalculateEconomyReserve(state);
  return executed;
}
