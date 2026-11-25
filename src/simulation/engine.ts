import {
  addLog,
  addRoadTile,
  advanceDayAging,
  advanceJobMastery,
  AGE_PARTNER_MIN_YEARS,
  applyQwenActions,
  assignBalancedJob,
  assignMentorships,
  BRIDGE_HALF_WIDTH,
  buildQwenVillageTelemetry,
  canAgentRest,
  canAgentsReproduce,
  cancelActiveConstruction,
  canGatherOrTradeMineral,
  canGatherOrTradeWood,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  clamp,
  completeActiveConstruction,
  computeAgentHappiness,
  computeAgentImportance,
  computeEra,
  computeSeason,
  computeUnlockedSkills,
  contractDiseaseForAgent,
  craftToolsForAgent,
  createAnimal,
  createDefaultLaws,
  createVillagePetition,
  CURRENT_SCHEMA_VERSION,
  DAY_GAME_MINUTES,
  DAY_START_MINUTE,
  decideVillagerMajorAction,
  defendAgainstWildAnimal,
  depositMaterialsToBuilding,
  depositResourcesToHouse,
  deriveAgentEmotion,
  electRepresentative,
  enforceLawViolation,
  ensureQwenControlledRepresentative,
  ERA_METADATA,
  extinguishFire,
  FISH_VARIANTS,
  FOREST_MAX_X,
  generateEmergentDialogue,
  getAgentSurplusConstructionMaterials,
  getCompetingBuildingCount,
  getConciseTaskLabel,
  getEmotionWorkMultiplier,
  getOperationalDepots,
  grantBankLoan,
  interpretQwenDirective,
  isBridgePassable,
  isBuildingOperational,
  isLawActive,
  isNearRoad,
  isNightMinute,
  isPointInRiverWater,
  mintBackedCoins,
  MOUNTAIN_MIN_X,
  NIGHT_GAME_MINUTES,
  NIGHT_START_MINUTE,
  NORTH_CENTER_Y,
  NORTH_LAND_MAX_Y,
  NORTH_LAND_MIN_Y,
  PETITION_INTERVAL_SECONDS,
  pickBestPartnerForAgent,
  pickQwenBabyName,
  planBestConstructionProject,
  PREGNANCY_DAYS,
  PRODUCTION_INPUT_COSTS,
  pushSoundCue,
  queryVillageData,
  recalculateEconomyReserve,
  recordDailySnapshot,
  recordResourceOperation,
  repairDamagedStructures,
  resolvePetitionWithQwen,
  RIVER_BOTTOM_Y,
  RIVER_FISH_RESTOCK_DAYS,
  RIVER_TOP_Y,
  ROAD_GRID_SIZE,
  runQwenRepresentativeAutonomousTurn,
  SAFE_LAND_MIN_Y,
  sanitizeQwenActions,
  sanitizeQwenReply,
  shouldBuildHouse,
  SOUTH_CENTER_Y,
  spawnFire,
  SPECIAL_BUILDING_LABELS,
  SPEED_TIMINGS,
  startConstructionProject,
  switchPartnerForAgent,
  syncAgentSkills,
  syncSpecialBuildingStaff,
  tameWildAnimal,
  transferInheritance,
  transferMaterialsToConstructor,
  triggerLightningStorm,
  withdrawResourceFromHouse,
  WOOD_GRADE_CONFIG,
  WORLD_CENTER_X,
} from './rules';
import type {
  Agent,
  Animal,
  BiomeType,
  FarmPlot,
  House,
  MaintenanceStatus,
  QwenAction,
  ResourceCostMap,
  ResourceInventory,
  ResourceNode,
  RoadTile,
  SimulationState,
  SpecialBuilding,
  TaskType,
} from '../types/simulation';

export interface CameraView {
  zoom: number;
  panX: number;
  panY: number;
}

export function pushFloatingEffect(
  state: SimulationState,
  x: number,
  y: number,
  text: string,
  color = '#f8fafc',
  durationSec = 2.2
): void {
  if (!Array.isArray(state.floatingEffects)) state.floatingEffects = [];
  state.floatingEffects.push({
    id: state.nextId++,
    x: x + (Math.random() - 0.5) * 10,
    y: y - 12,
    text,
    color,
    ttl: durationSec,
    maxTtl: durationSec,
  });
  if (state.floatingEffects.length > 24) {
    state.floatingEffects = state.floatingEffects.slice(-24);
  }
}

const BIOMES: Record<BiomeType, { bg: string; patch: string; name: string }> = {
  grassland: { bg: '#2f6834', patch: '#255529', name: 'Pradera' },
  forest: { bg: '#214d2c', patch: '#173a20', name: 'Bosque' },
  arid: { bg: '#a38047', patch: '#8a6b38', name: 'Árido' },
  tundra: { bg: '#6e8796', patch: '#5a7280', name: 'Tundra' },
};

const HAIR_STYLES: Agent['hairStyle'][] = ['short', 'long', 'mohawk', 'curly', 'ponytail', 'bald'];
const HAIR_COLORS = ['#1e1b18', '#5c3a21', '#d4a359', '#9e3b24', '#cbd5e1', '#3b82f6'];
const SKIN_TONES = ['#f5cba7', '#e0ac69', '#c68642', '#8d5524'];
const SHIRT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const MALE_NAMES = ['Mateo', 'Lucas', 'Thiago', 'Bruno', 'Gael', 'Dante', 'Leo', 'Simón', 'Ian', 'Hugo'];
const FEMALE_NAMES = ['Luna', 'Sofía', 'Alma', 'Mía', 'Vera', 'Nina', 'Clara', 'Zoe', 'Elena', 'Sara'];

let ollamaDecisionInFlight = false;

export function createAgent(
  id: number,
  name: string,
  sex: 'M' | 'F',
  x: number,
  y: number,
  parents: string | null = null,
  ageYears = 20
): Agent {
  const isChild = ageYears <= 5;
  const isElder = ageYears >= 60;
  const education = isChild ? 4 : isElder ? 52 : 10;
  const carpentryKnowledge = isChild ? 0 : isElder ? 25 : 8;
  const constructionKnowledge = isChild ? 0 : isElder ? 25 : 12;

  return {
    id,
    name,
    sex,
    x,
    y: y < RIVER_TOP_Y ? clamp(y, NORTH_LAND_MIN_Y, NORTH_LAND_MAX_Y) : Math.max(SAFE_LAND_MIN_Y, y),
    ageYears,
    isChild,
    isElder,
    hunger: 15,
    energy: 92,
    health: 96,
    isSick: false,
    illnessName: null,
    illness: null,
    happiness: 72,
    education,
    carpentryKnowledge,
    constructionKnowledge,
    jobMastery: {},
    skills: computeUnlockedSkills(education).map((s) => s.id),
    mentorId: null,
    loanDebt: 0,
    jailedDays: 0,
    isRepresentative: false,
    isSterile: false,
    wantsChildren: Math.random() < 0.78,
    pregnancy: null,
    coins: 12,
    inv: {
      food: 2,
      wood: 1,
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
    job: ageYears < 10 ? 'Aprendiz' : 'Recolector',
    houseId: null,
    assignedBuildingId: null,
    mountedHorseId: null,
    skin: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)],
    shirt: SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)],
    hairStyle:
      sex === 'F'
        ? (['long', 'ponytail', 'curly'] as const)[id % 3]
        : HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)],
    hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
    partnerId: null,
    exPartnerIds: [],
    parents,
    childrenCount: 0,
    emotion: 'happy',
    talkingTimer: 0,
    lastDialogue: null,
    lastQwenDecision: null,
    qwenPlan: 'Iniciar labores en la aldea',
    taskType: 'idle',
    taskTimer: 0,
    taskTargetId: null,
    activity: 'Vigilando aldea',
    thought: 'Listo para trabajar y hacer evolucionar nuestra aldea.',
    importance: 15,
    walkFrame: 0,
    reproductionCooldown: 0,
    moodModifier: 0,
    activeConstruction: null,
  };
}

export function spawnSettlers(state: SimulationState, count: number): number {
  const safeCount = Number.isFinite(count) ? clamp(Math.round(count), 0, 12) : 0;
  let spawned = 0;
  for (let i = 0; i < safeCount; i++) {
    const id = state.nextId++;
    const sex: 'M' | 'F' = id % 2 === 0 ? 'M' : 'F';
    const pool = sex === 'M' ? MALE_NAMES : FEMALE_NAMES;
    const name = `${pool[id % pool.length]} ${String.fromCharCode(65 + (id % 26))}.`;
    const settler = createAgent(
      id,
      name,
      sex,
      WORLD_CENTER_X + (Math.random() - 0.5) * 220,
      SOUTH_CENTER_Y + (Math.random() - 0.5) * 160,
      'Colono recién llegado',
      19 + (id % 8)
    );
    settler.coins = mintBackedCoins(state, 12);
    decideVillagerMajorAction(state, settler, 'adult_job');
    const openHouse = state.houses.find(
      (h) => state.agents.filter((a) => a.houseId === h.id).length < h.capacity
    );
    if (openHouse) settler.houseId = openHouse.id;
    state.agents.push(settler);
    spawned++;
  }
  syncSpecialBuildingStaff(state);
  recalculateEconomyReserve(state);
  electRepresentative(state);
  return spawned;
}

export function spawnResource(
  state: SimulationState,
  type: ResourceNode['type'],
  x: number,
  y: number,
  bypassPause = false
): boolean {
  if (state.resourcesPaused && !bypassPause) return false;
  const finalX = clamp(x, 30, CANVAS_WIDTH - 30);
  let finalY = clamp(y, NORTH_LAND_MIN_Y + 6, CANVAS_HEIGHT - 30);
  if (isPointInRiverWater(finalX, finalY, state.bridge?.x ?? null)) {
    finalY = SAFE_LAND_MIN_Y + 12;
  }
  const maxAmt = 8;
  state.resources.push({
    id: state.nextId++,
    type,
    x: finalX,
    y: finalY,
    amount: maxAmt,
    maxAmount: maxAmt,
    depleted: false,
    restTimer: 0,
  });
  return true;
}

function pickBiasedResourceX(type: ResourceNode['type']): number {
  if (type === 'wood' || type === 'pine_wood' || type === 'maple_wood' || type === 'oak_wood') {
    return Math.random() < 0.78
      ? 38 + Math.random() * (FOREST_MAX_X - 56)
      : FOREST_MAX_X + 30 + Math.random() * (MOUNTAIN_MIN_X - FOREST_MAX_X - 80);
  }
  if (type === 'stone' || type === 'copper' || type === 'iron' || type === 'silver' || type === 'gold') {
    return Math.random() < 0.82
      ? MOUNTAIN_MIN_X + 20 + Math.random() * (CANVAS_WIDTH - MOUNTAIN_MIN_X - 58)
      : FOREST_MAX_X + 80 + Math.random() * (MOUNTAIN_MIN_X - FOREST_MAX_X - 100);
  }
  return FOREST_MAX_X - 60 + Math.random() * (MOUNTAIN_MIN_X - FOREST_MAX_X + 120);
}

export function createInitialState(): SimulationState {
  const state: SimulationState = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    pendingSounds: [],
    day: 1,
    minute: 420,
    speed: 1,
    resourcesPaused: false,
    season: computeSeason(1),
    layoutMode: 'auto',
    biome: 'grassland',
    weather: 'sunny',
    tool: 'inspect',
    selectedRoadType: 'dirt',
    selectedRoadLamp: false,
    roadMaintenanceLastDay: 1,
    roadUnpaidMaintenanceDays: 0,
    selectedAgentId: null,
    selectedEntity: null,
    highlightFamilyAgentId: null,
    knowledge: 10,
    era: 'primitive',
    nextId: 100,
    agents: [],
    houses: [],
    specialBuildings: [],
    plaza: null,
    bridge: null,
    farms: [],
    roads: [],
    resources: [],
    animals: [],
    rainDrops: [],
    history: [],
    riverFishStock: 18,
    riverFishMaxStock: 18,
    riverFishRestTimer: 0,
    laws: createDefaultLaws(),
    fires: [],
    loans: [],
    representativeAgentId: null,
    representativeLastActedMinute: 0,
    representativeGoal: 'Garantizar viviendas, alimento y progreso continuo',
    petitionTimerSec: PETITION_INTERVAL_SECONDS,
    pendingPetition: null,
    qwenAutoRespondPetitions: false,
    autoPausedByPetition: false,
    previousSpeedBeforePetition: 1,
    lightningFlashTimer: 0,
    lastCouncilDay: 0,
    economyReserve: {
      goldReserve: 4,
      silverReserve: 2,
      backedCoinsCapacity: 120,
      mintedCoins: 120,
      bankLoanPool: 40,
      taxRatePct: 5,
      lastTaxCollectedDay: 1,
    },
    policies: {
      buildPriority: true,
      workFocus: true,
      evolutionFocus: true,
      economyFocus: false,
      farmingFocus: false,
      reproductionRestraint: false,
      healthPriority: false,
      allowPartnerSwitch: true,
      moodDirective: 'neutral',
    },
    ollama: {
      enabled: false,
      url: 'http://localhost:11434/api/generate',
      model: 'qwen2.5:3b',
    },
    logs: [],
    resourceLedger: [],
    floatingEffects: [],
    qwenMessages: [
      {
        id: 1,
        role: 'qwen',
        source: 'local',
        text: 'Comenzamos desde cero con 5 mujeres y 5 hombres, sin casas ni obras construidas. Sin vivienda no pueden descansar. Todos los recursos son finitos y requieren reposo para renovarse.',
      },
    ],
  };

  for (let i = 0; i < 5; i++) {
    state.agents.push(
      createAgent(
        i + 1,
        MALE_NAMES[i],
        'M',
        WORLD_CENTER_X - 190 + Math.random() * 380,
        SAFE_LAND_MIN_Y + 90 + Math.random() * 200,
        null,
        20 + (i % 6)
      )
    );
  }
  for (let i = 0; i < 5; i++) {
    state.agents.push(
      createAgent(
        i + 6,
        FEMALE_NAMES[i],
        'F',
        WORLD_CENTER_X - 190 + Math.random() * 380,
        SAFE_LAND_MIN_Y + 90 + Math.random() * 200,
        null,
        20 + ((i + 2) % 6)
      )
    );
  }

  for (const agent of state.agents) {
    agent.job = assignBalancedJob(agent, state.agents, state.houses, state.policies, state.specialBuildings);
    agent.qwenPlan = `Juntar recursos como ${agent.job} para levantar las primeras casas`;
    agent.lastQwenDecision = `Qwen 2.5 asignó misión inicial ${agent.job}.`;
  }

  const forestTypes: ResourceNode['type'][] = ['wood', 'wood', 'pine_wood', 'maple_wood', 'oak_wood', 'food'];
  for (let i = 0; i < 30; i++) {
    const t = forestTypes[i % forestTypes.length];
    const inNorth = i % 4 === 0;
    spawnResource(
      state,
      t,
      40 + Math.random() * (FOREST_MAX_X - 60),
      inNorth
        ? NORTH_LAND_MIN_Y + 26 + Math.random() * (NORTH_LAND_MAX_Y - NORTH_LAND_MIN_Y - 52)
        : SAFE_LAND_MIN_Y + 24 + Math.random() * (CANVAS_HEIGHT - SAFE_LAND_MIN_Y - 72),
      true
    );
  }

  const mountainTypes: ResourceNode['type'][] = ['stone', 'copper', 'iron', 'copper', 'silver', 'gold'];
  for (let i = 0; i < 30; i++) {
    const t = mountainTypes[i % mountainTypes.length];
    const inNorth = i % 4 === 0;
    spawnResource(
      state,
      t,
      MOUNTAIN_MIN_X + 20 + Math.random() * (CANVAS_WIDTH - MOUNTAIN_MIN_X - 58),
      inNorth
        ? NORTH_LAND_MIN_Y + 26 + Math.random() * (NORTH_LAND_MAX_Y - NORTH_LAND_MIN_Y - 52)
        : SAFE_LAND_MIN_Y + 24 + Math.random() * (CANVAS_HEIGHT - SAFE_LAND_MIN_Y - 72),
      true
    );
  }

  const valleyTypes: ResourceNode['type'][] = ['food', 'wood', 'stone', 'copper', 'food', 'coins'];
  for (let i = 0; i < 18; i++) {
    const inNorth = i % 4 === 0;
    spawnResource(
      state,
      valleyTypes[i % valleyTypes.length],
      FOREST_MAX_X + 45 + Math.random() * (MOUNTAIN_MIN_X - FOREST_MAX_X - 90),
      inNorth
        ? NORTH_LAND_MIN_Y + 32 + Math.random() * (NORTH_LAND_MAX_Y - NORTH_LAND_MIN_Y - 64)
        : SAFE_LAND_MIN_Y + 26 + Math.random() * (CANVAS_HEIGHT - SAFE_LAND_MIN_Y - 78),
      true
    );
  }

  recalculateEconomyReserve(state);
  electRepresentative(state);
  ensureQwenControlledRepresentative(state);
  runQwenRepresentativeAutonomousTurn(state);

  for (let i = 0; i < 8; i++) {
    createAnimal(
      state,
      'fish',
      110 + i * 170,
      RIVER_TOP_Y + 14 + (i % 3) * 16,
      FISH_VARIANTS[i % FISH_VARIANTS.length]
    );
  }
  createAnimal(state, 'cat', WORLD_CENTER_X - 75, SOUTH_CENTER_Y - 15);
  createAnimal(state, 'dog', WORLD_CENTER_X + 75, SOUTH_CENTER_Y + 15);
  createAnimal(state, 'chicken', 420, SOUTH_CENTER_Y - 40);
  createAnimal(state, 'chicken', 450, SOUTH_CENTER_Y - 10);
  createAnimal(state, 'cow', 490, SOUTH_CENTER_Y + 50);
  createAnimal(state, 'cow', 555, SOUTH_CENTER_Y + 80);
  createAnimal(state, 'horse', 960, NORTH_CENTER_Y);
  createAnimal(state, 'horse', 1010, SOUTH_CENTER_Y + 10);
  createAnimal(state, 'sheep', 980, SOUTH_CENTER_Y - 60);
  createAnimal(state, 'wildcat', 140, 180);
  createAnimal(state, 'bear', 1270, 190);

  for (let i = 0; i < 120; i++) {
    state.rainDrops.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      s: 4 + Math.random() * 4,
    });
  }

  recordDailySnapshot(state);
  addLog(
    state,
    'Aldea IA inicia con 5 mujeres y 5 hombres, recursos finitos renovables tras reposo y calendario de 120 días/año.',
    'emerald'
  );
  return state;
}

function setAgentTask(agent: Agent, taskType: TaskType, duration: number, targetId: number | null = null): void {
  agent.taskType = taskType;
  agent.taskTimer = duration;
  agent.taskTargetId = targetId;
  agent.activity = getConciseTaskLabel(taskType);
}

function isResourceAccessibleForAgent(agent: Agent, r: ResourceNode): boolean {
  if (r.depleted || r.amount <= 0) return false;
  if (r.type === 'pine_wood') return canGatherOrTradeWood(agent, 'pine');
  if (r.type === 'maple_wood') return canGatherOrTradeWood(agent, 'maple');
  if (r.type === 'oak_wood') return canGatherOrTradeWood(agent, 'oak');
  if (r.type === 'copper') return canGatherOrTradeMineral(agent, 'copper');
  if (r.type === 'iron') return canGatherOrTradeMineral(agent, 'iron');
  if (r.type === 'silver') return canGatherOrTradeMineral(agent, 'silver');
  if (r.type === 'gold') return canGatherOrTradeMineral(agent, 'gold');
  return true;
}

function findClosestResource(
  state: SimulationState,
  agent: Agent,
  type: ResourceNode['type'] | null
): ResourceNode | null {
  const hasBridge = isBridgePassable(state);
  const agentNorth = agent.y < RIVER_TOP_Y;
  let closest: ResourceNode | null = null;
  let minDist = Infinity;
  for (const r of state.resources) {
    if (type && r.type !== type) continue;
    if (!isResourceAccessibleForAgent(agent, r)) continue;
    if (!hasBridge && (r.y < RIVER_TOP_Y) !== agentNorth) continue;
    const d = Math.hypot(r.x - agent.x, r.y - agent.y);
    if (d < minDist) {
      minDist = d;
      closest = r;
    }
  }
  return closest;
}

function getTaskForResource(type: ResourceNode['type']): TaskType {
  switch (type) {
    case 'food':
      return 'gather_food';
    case 'wood':
    case 'pine_wood':
    case 'maple_wood':
    case 'oak_wood':
      return 'gather_wood';
    case 'stone':
      return 'gather_stone';
    case 'copper':
      return 'gather_copper';
    case 'iron':
      return 'gather_iron';
    case 'gold':
      return 'gather_gold';
    case 'silver':
      return 'gather_silver';
    case 'coins':
      return 'trade';
  }
}

function hasEnoughBuilderOrDepotResources(
  state: SimulationState,
  builder: Agent,
  reqs: ResourceCostMap
): boolean {
  const depots = getOperationalDepots(state);
  for (const [rawKey, rawNeed] of Object.entries(reqs)) {
    const key = rawKey as keyof ResourceInventory;
    const need = rawNeed ?? 0;
    if (need <= 0) continue;
    const avail = builder.inv[key] + depots.reduce((acc, d) => acc + d.storage[key], 0);
    if (avail < need) return false;
  }
  return true;
}

function findMissingMaterialNodeType(
  state: SimulationState,
  builder: Agent,
  reqs: ResourceCostMap
): ResourceNode['type'] | null {
  const depots = getOperationalDepots(state);
  const mapToNode: Partial<Record<keyof ResourceInventory, ResourceNode['type']>> = {
    wood: 'wood',
    pineWood: 'pine_wood',
    mapleWood: 'maple_wood',
    oakWood: 'oak_wood',
    stone: 'stone',
    copper: 'copper',
    iron: 'iron',
  };
  for (const [rawKey, rawNeed] of Object.entries(reqs)) {
    const key = rawKey as keyof ResourceInventory;
    const need = rawNeed ?? 0;
    if (need <= 0) continue;
    const avail = builder.inv[key] + depots.reduce((acc, d) => acc + d.storage[key], 0);
    if (avail < need && mapToNode[key]) {
      return mapToNode[key]!;
    }
  }
  return null;
}

function tryOrganicRoadConstruction(state: SimulationState, agent: Agent): boolean {
  if (state.knowledge < 14 || agent.isChild || agent.job !== 'Constructor') return false;
  if (state.roads.length >= 140) return false;
  if (isNearRoad(state.roads, agent.x, agent.y)) return false;

  const nearHub =
    (state.plaza && Math.hypot(agent.x - state.plaza.x, agent.y - state.plaza.y) < 160) ||
    state.houses.some((h) => Math.hypot(agent.x - h.x, agent.y - h.y) < 95) ||
    state.specialBuildings.some((b) => Math.hypot(agent.x - b.x, agent.y - b.y) < 95);
  if (!nearHub) return false;

  const tile = addRoadTile(
    state,
    agent.x,
    agent.y,
    state.selectedRoadType ?? 'dirt',
    state.selectedRoadLamp ?? false,
    agent
  );
  if (!tile) return false;
  agent.constructionKnowledge = clamp(agent.constructionKnowledge + 1, 0, 100);
  return true;
}

function chooseNextTask(state: SimulationState, agent: Agent, isNight = false): void {
  if (agent.jailedDays > 0) {
    setAgentTask(agent, 'idle', 36);
    agent.activity = 'Cumpliendo sanción en Cárcel';
    return;
  }

  const house = agent.houseId !== null ? state.houses.find((h) => h.id === agent.houseId) : null;
  const depot = state.specialBuildings.find((b) => b.type === 'general_depot' && b.isOperational) ?? null;

  // 0. Prioridad absoluta: combatir incendios si tiene criterio (Saber >= 25 o Guardián/Constructor)
  if (
    state.fires.length > 0 &&
    !agent.isChild &&
    (agent.education >= 24 || agent.job === 'Guardián' || agent.job === 'Comisario' || agent.job === 'Constructor')
  ) {
    setAgentTask(agent, 'extinguish_fire', 34, state.fires[0].id);
    return;
  }

  // 1. Alimentación
  if (agent.hunger >= 58) {
    if (agent.breadCount > 0) {
      agent.breadCount -= 1;
      agent.hunger = Math.max(0, agent.hunger - 52);
      agent.health = clamp(agent.health + 6, 0, 100);
      setAgentTask(agent, 'eat', 18);
      return;
    }
    if (agent.milkCount > 0) {
      agent.milkCount -= 1;
      agent.hunger = Math.max(0, agent.hunger - 34);
      agent.health = clamp(agent.health + 5, 0, 100);
      setAgentTask(agent, 'eat', 16);
      return;
    }
    if (agent.inv.food > 0) {
      agent.inv.food -= 1;
      agent.hunger = Math.max(0, agent.hunger - 42);
      agent.health = clamp(agent.health + 4, 0, 100);
      setAgentTask(agent, 'eat', 18);
      return;
    }
    if (house && withdrawResourceFromHouse(agent, house, 'food', 1) > 0) {
      agent.inv.food -= 1;
      agent.hunger = Math.max(0, agent.hunger - 40);
      setAgentTask(agent, 'eat', 18);
      return;
    }
  }

  // 2. Medicina curativa (no cura enfermedades incurables como Cáncer)
  if (agent.isSick && !agent.illness?.incurable && agent.medicineCount > 0) {
    agent.medicineCount -= 1;
    agent.isSick = false;
    agent.illness = null;
    agent.illnessName = null;
    agent.health = clamp(agent.health + 45, 0, 100);
    agent.thought = 'Tomé medicina de la Botica y me recuperé.';
  }

  // 3. Descanso Nocturno: ESTRICTAMENTE prohibido descansar sin casa
  if (canAgentRest(agent) && (isNight || agent.energy < 28 || (agent.isSick && agent.health < 55))) {
    setAgentTask(agent, 'sleep', isNight ? 46 : 38, agent.houseId);
    return;
  }

  // 3.5. Constructor con obra en curso: reanudar inmediatamente antes de almacenar materiales
  if (agent.job === 'Constructor' && !agent.isChild && agent.activeConstruction) {
    const acKind = agent.activeConstruction.kind;
    const resumeTask: TaskType =
      acKind === 'house'
        ? 'build_house'
        : acKind === 'upgrade_house'
          ? 'upgrade_house'
          : acKind === 'plaza'
            ? 'build_plaza'
            : acKind === 'bridge'
              ? 'build_bridge'
              : acKind === 'farm'
                ? 'plant_farm'
                : 'build_special';
    setAgentTask(agent, resumeTask, 42);
    return;
  }

  // 4. Entrega cooperativa de materiales al Constructor (si aún no hay Depósito) o resguardo en casa/Depósito
  const surplusConstruction = getAgentSurplusConstructionMaterials(agent);
  const bridgePassableNow = isBridgePassable(state);
  if (!depot && !agent.isChild && agent.job !== 'Constructor' && surplusConstruction >= 2) {
    const builderTarget = state.agents.find(
      (b) =>
        b.id !== agent.id &&
        !b.isChild &&
        b.jailedDays <= 0 &&
        b.job === 'Constructor' &&
        (bridgePassableNow || (b.y < RIVER_TOP_Y) === (agent.y < RIVER_TOP_Y))
    );
    if (builderTarget) {
      agent.qwenPlan = `Llevar ${surplusConstruction} materiales a ${builderTarget.name}`;
      setAgentTask(agent, 'deliver_materials', 34, builderTarget.id);
      return;
    }
  }

  const totalCarry =
    agent.inv.food +
    agent.inv.wood +
    agent.inv.pineWood +
    agent.inv.mapleWood +
    agent.inv.oakWood +
    agent.inv.stone +
    agent.inv.copper +
    agent.inv.iron +
    agent.inv.gold +
    agent.inv.silver;
  const shouldStoreForBuilderWithoutDepot =
    agent.job === 'Constructor' && !depot
      ? agent.inv.food >= 3 || agent.coins >= 28 || agent.milkCount >= 2
      : agent.job === 'Constructor' && depot
        ? totalCarry >= 12 || agent.inv.food >= 3 || agent.coins >= 28 || agent.milkCount >= 2
        : totalCarry >= (depot ? 4 : 7) || agent.coins >= 28 || agent.milkCount >= 2;
  if ((house || depot) && shouldStoreForBuilderWithoutDepot) {
    agent.qwenPlan = depot && surplusConstruction >= 2
      ? `Depositar materiales en ${depot.name}`
      : house
        ? `Resguardar alimento/monedas en ${house.name}`
        : 'Depositar en Depósito General';
    setAgentTask(agent, 'store_home', 32, house?.id ?? depot?.id ?? null);
    return;
  }

  // 5. Reparación de edificios con desgaste o deuda de mantenimiento
  const needsRepair =
    state.houses.some((h) => h.durability < 72 || h.maintenanceStatus !== 'ok') ||
    state.specialBuildings.some((b) => b.durability < 72 || b.maintenanceStatus !== 'ok') ||
    (state.bridge !== null && (state.bridge.durability < 72 || state.bridge.maintenanceStatus !== 'ok'));
  if (
    needsRepair &&
    !agent.isChild &&
    (agent.job === 'Carpintero' || agent.job === 'Constructor') &&
    hasEnoughBuilderOrDepotResources(state, agent, { wood: 1 })
  ) {
    setAgentTask(agent, 'repair_building', 34);
    return;
  }

  // 6. Fabricar herramientas (36%+ Saber · 1 Cobre + 1 Hierro estricto)
  const forgesOp = state.specialBuildings.filter((b) => b.type === 'forge' && b.isOperational);
  const depotsOp = getOperationalDepots(state);
  const availCopper =
    agent.inv.copper +
    forgesOp.reduce((acc, f) => acc + f.storage.copper, 0) +
    depotsOp.reduce((acc, d) => acc + d.storage.copper, 0);
  const availIron =
    agent.inv.iron +
    forgesOp.reduce((acc, f) => acc + f.storage.iron, 0) +
    depotsOp.reduce((acc, d) => acc + d.storage.iron, 0);
  if (
    !agent.isChild &&
    agent.education >= 36 &&
    agent.toolsCount < 2 &&
    availCopper >= (PRODUCTION_INPUT_COSTS.forgeTool.copper ?? 1) &&
    availIron >= (PRODUCTION_INPUT_COSTS.forgeTool.iron ?? 1) &&
    Math.random() < 0.48
  ) {
    setAgentTask(agent, 'craft_tools', 28);
    return;
  }

  // 7. Administrar el edificio propio/asignado
  if (agent.assignedBuildingId !== null && Math.random() < 0.55) {
    setAgentTask(agent, 'manage_building', 32, agent.assignedBuildingId);
    return;
  }

  // 8. Caravana a caballo si hay caballo libre y materias para mover
  const hasHorse = state.animals.some((a) => a.type === 'horse' && a.riderId === null);
  const hasMarketOrForge =
    isBuildingOperational(state, 'market') ||
    isBuildingOperational(state, 'forge') ||
    isBuildingOperational(state, 'general_depot');
  if (
    hasHorse &&
    hasMarketOrForge &&
    !agent.isChild &&
    (agent.job === 'Comerciante' || agent.inv.mapleWood > 0 || agent.inv.oakWood > 0 || agent.inv.iron > 0 || agent.inv.copper > 0) &&
    Math.random() < 0.28
  ) {
    setAgentTask(agent, 'caravan', 36);
    return;
  }

  // 9. Hambre media o reserva alimentaria baja -> pescar, cultivar o recolectar alimento
  const villageFoodTotal =
    state.agents.reduce((acc, a) => acc + a.inv.food + a.breadCount, 0) +
    state.houses.reduce((acc, h) => acc + h.storage.food, 0);
  const lowVillageFood = villageFoodTotal < Math.max(4, Math.ceil(state.agents.length * 1.2));
  if (
    agent.hunger >= 44 ||
    (lowVillageFood && !agent.isChild && agent.job !== 'Constructor' && agent.job !== 'Curandero' && agent.inv.food < 2)
  ) {
    const canUseAnyDock =
      state.specialBuildings.some((b) => b.type === 'dock' && b.isOperational && (b.ownerId === agent.id || b.ownerId === null));
    if (
      (canUseAnyDock || agent.job === 'Pescador') &&
      !isLawActive(state, 'ban_fishing') &&
      state.riverFishStock > 0 &&
      state.animals.some((a) => a.type === 'fish')
    ) {
      setAgentTask(agent, 'fish_river', 30);
      return;
    }
    const ripePlot = state.farms.find((f) => f.growth >= 80);
    if (ripePlot) {
      setAgentTask(agent, 'farm_crops', 30, ripePlot.id);
      return;
    }
    const foodNode = findClosestResource(state, agent, 'food');
    if (foodNode) {
      setAgentTask(agent, 'gather_food', 32, foodNode.id);
      return;
    }
  }

  if (agent.job === 'Pescador' && !isLawActive(state, 'ban_fishing') && state.riverFishStock > 0) {
    setAgentTask(agent, 'fish_river', 34);
    return;
  }

  if (agent.job === 'Curandero' || agent.job === 'Boticario') {
    const sickTarget = state.agents.find((other) => other.id !== agent.id && (other.isSick || other.health < 65));
    if (sickTarget) {
      setAgentTask(agent, 'heal_other', 30, sickTarget.id);
      return;
    }
  }

  if (agent.job === 'Agricultor') {
    const livestock = state.animals.find(
      (a) =>
        (a.type === 'cow' && a.milkReady >= 70) ||
        (a.type === 'sheep' && a.woolReady >= 70) ||
        (a.type === 'chicken' && Math.random() < 0.4)
    );
    if (livestock) {
      setAgentTask(agent, 'tend_livestock', 30, livestock.id);
      return;
    }
    if (state.farms.length > 0) {
      const plot = state.farms.find((f) => f.growth >= 75) ?? state.farms[0];
      setAgentTask(agent, 'farm_crops', 32, plot.id);
      return;
    }
  }

  if (agent.job === 'Carpintero') {
    const preferredWood: ResourceNode['type'] = canGatherOrTradeWood(agent, 'oak')
      ? 'oak_wood'
      : canGatherOrTradeWood(agent, 'maple')
        ? 'maple_wood'
        : canGatherOrTradeWood(agent, 'pine')
          ? 'pine_wood'
          : 'wood';
    const node =
      findClosestResource(state, agent, preferredWood) ??
      findClosestResource(state, agent, 'pine_wood') ??
      findClosestResource(state, agent, 'wood');
    if (node && Math.random() < 0.72) {
      setAgentTask(agent, 'gather_wood', 34, node.id);
      return;
    }
    if (
      !isLawActive(state, 'ban_trade_wood') &&
      (agent.inv.pineWood > 0 || agent.inv.mapleWood > 0 || agent.inv.oakWood > 0)
    ) {
      setAgentTask(agent, 'trade', 30);
      return;
    }
  }

  if (
    agent.job === 'Comerciante' ||
    agent.job === 'Banquero' ||
    agent.job === 'Panadero' ||
    agent.job === 'Herrero' ||
    agent.job === 'Artesano' ||
    (state.policies.economyFocus && Math.random() < 0.32)
  ) {
    setAgentTask(agent, 'trade', 30);
    return;
  }

  // 10. Construcción autónoma inteligente: SOLO rol Constructor y con materiales reales exactos
  if (agent.job === 'Constructor' && !agent.isChild) {
    // Si tiene obra iniciada pendiente (ej. pausada durante la noche), reanudarla primero
    if (agent.activeConstruction) {
      const acKind = agent.activeConstruction.kind;
      const resumeTask: TaskType =
        acKind === 'house'
          ? 'build_house'
          : acKind === 'upgrade_house'
            ? 'upgrade_house'
            : acKind === 'plaza'
              ? 'build_plaza'
              : acKind === 'bridge'
                ? 'build_bridge'
                : acKind === 'farm'
                  ? 'plant_farm'
                  : 'build_special';
      setAgentTask(agent, resumeTask, 40);
      return;
    }

    const { topGoal, bestBuildable } = planBestConstructionProject(state, agent);
    if (bestBuildable) {
      const { candidate } = bestBuildable;
      const started = startConstructionProject(state, agent, candidate.kind, {
        zone: candidate.zone,
        farmSize: candidate.farmSize,
        specialType: candidate.specialType,
        duration: candidate.duration,
      });
      if (started.ok) {
        const chosenBuilding =
          candidate.kind === 'special' || candidate.kind === 'upgrade_special'
            ? candidate.specialType
            : candidate.kind === 'upgrade_house'
              ? 'upgrade'
              : candidate.kind === 'road'
                ? undefined
                : candidate.kind;
        decideVillagerMajorAction(state, agent, 'construction', { chosenBuilding });
        const taskType: Agent['taskType'] =
          candidate.kind === 'house'
            ? 'build_house'
            : candidate.kind === 'upgrade_house'
              ? 'upgrade_house'
              : candidate.kind === 'plaza'
                ? 'build_plaza'
                : candidate.kind === 'bridge'
                  ? 'build_bridge'
                  : candidate.kind === 'farm'
                    ? 'plant_farm'
                    : 'build_special';
        setAgentTask(agent, taskType, candidate.duration + 6);
        return;
      }
    }

    // Si faltan materiales para la obra más urgente según las necesidades vivas de la aldea, ir a recolectarlos
    const missingNode = topGoal ? findMissingMaterialNodeType(state, agent, topGoal.plan.cost) : 'wood';
    const res =
      (missingNode ? findClosestResource(state, agent, missingNode) : null) ??
      findClosestResource(state, agent, 'wood') ??
      findClosestResource(state, agent, 'stone') ??
      findClosestResource(state, agent, null);
    if (missingNode && !findClosestResource(state, agent, missingNode) && agent.education < 55 && Math.random() < 0.45) {
      // Si el material faltante aún requiere mayor Saber, investigar brevemente para desbloquearlo
      setAgentTask(agent, 'research', 26);
      return;
    }
    if (res) {
      setAgentTask(agent, getTaskForResource(res.type), 34, res.id);
      return;
    }
  }

  // Búsqueda activa de pareja para adultos solteros (≥15 años) con refugio y alimento
  if (
    !agent.isChild &&
    agent.ageYears >= AGE_PARTNER_MIN_YEARS &&
    agent.partnerId === null &&
    agent.jailedDays <= 0 &&
    agent.hunger < 55 &&
    agent.energy >= 35 &&
    state.houses.length > 0 &&
    Math.random() < 0.22
  ) {
    const candidate = pickBestPartnerForAgent(state, agent);
    if (
      candidate &&
      (bridgePassableNow || (candidate.y < RIVER_TOP_Y) === (agent.y < RIVER_TOP_Y))
    ) {
      agent.thought = `Busco formar pareja y futuro con ${candidate.name}.`;
      setAgentTask(agent, 'socialize', 30, candidate.id);
      return;
    }
  }

  if (
    agent.job === 'Erudito' ||
    agent.job === 'Maestro' ||
    (state.policies.evolutionFocus &&
      !shouldBuildHouse(state) &&
      !lowVillageFood &&
      Math.random() < 0.14)
  ) {
    setAgentTask(agent, 'research', 34);
    return;
  }

  let preferredType: ResourceNode['type'] | undefined;
  if (agent.job === 'Recolector') preferredType = Math.random() < 0.55 ? 'food' : 'wood';
  else if (agent.job === 'Leñador') {
    if (canGatherOrTradeWood(agent, 'oak') && Math.random() < 0.35) {
      preferredType = 'oak_wood';
    } else if (canGatherOrTradeWood(agent, 'maple') && Math.random() < 0.25) {
      preferredType = 'maple_wood';
    } else if (canGatherOrTradeWood(agent, 'pine') && Math.random() < 0.35) {
      preferredType = 'pine_wood';
    } else {
      preferredType = 'wood';
    }
  } else if (agent.job === 'Minero') {
    if (canGatherOrTradeMineral(agent, 'gold') && !isLawActive(state, 'ban_mine_gold') && Math.random() < 0.25) {
      preferredType = 'gold';
    } else if (canGatherOrTradeMineral(agent, 'silver') && Math.random() < 0.35) {
      preferredType = 'silver';
    } else if (canGatherOrTradeMineral(agent, 'iron') && Math.random() < 0.45) {
      preferredType = 'iron';
    } else if (canGatherOrTradeMineral(agent, 'copper') && Math.random() < 0.5) {
      preferredType = 'copper';
    } else {
      preferredType = 'stone';
    }
  } else if (agent.job === 'Carpintero') {
    if (canGatherOrTradeWood(agent, 'oak')) preferredType = 'oak_wood';
    else if (canGatherOrTradeWood(agent, 'maple')) preferredType = 'maple_wood';
    else if (canGatherOrTradeWood(agent, 'pine')) preferredType = 'pine_wood';
    else preferredType = 'wood';
  }

  if (preferredType) {
    const res = findClosestResource(state, agent, preferredType) ?? findClosestResource(state, agent, null);
    if (res) {
      setAgentTask(agent, getTaskForResource(res.type), 34, res.id);
      return;
    }
  }

  const anyRes = findClosestResource(state, agent, null);
  if (anyRes) {
    setAgentTask(agent, getTaskForResource(anyRes.type), 30, anyRes.id);
    return;
  }

  if (state.farms.length > 0) {
    setAgentTask(agent, 'farm_crops', 28, state.farms[0].id);
    return;
  }

  // Buscar progreso por sobre todas las cosas: estudiar/investigar en lugar de quedar inactivo
  if (!agent.isChild && agent.energy >= 30) {
    setAgentTask(agent, 'research', 28);
    return;
  }

  setAgentTask(agent, 'idle', 20);
}

function moveTowards(
  agent: Agent,
  tx: number,
  ty: number,
  speed: number,
  dt: number,
  bridgeX: number | null
): number {
  let targetX = tx;
  let targetY = ty;

  const agentNorth = agent.y < RIVER_TOP_Y;
  const agentSouth = agent.y > RIVER_BOTTOM_Y;
  const destNorth = ty < RIVER_TOP_Y;
  const destSouth = ty > RIVER_BOTTOM_Y;

  if ((agentNorth && destSouth) || (agentSouth && destNorth)) {
    if (bridgeX !== null) {
      if (Math.abs(agent.x - bridgeX) > 20) {
        targetX = bridgeX;
        targetY = agentNorth ? RIVER_TOP_Y - 6 : RIVER_BOTTOM_Y + 6;
      } else {
        targetX = bridgeX;
        targetY = destSouth ? RIVER_BOTTOM_Y + 12 : RIVER_TOP_Y - 12;
      }
    } else {
      targetY = agentNorth ? RIVER_TOP_Y - 12 : RIVER_BOTTOM_Y + 12;
    }
  }

  const dx = targetX - agent.x;
  const dy = targetY - agent.y;
  const stepDist = Math.hypot(dx, dy);
  if (stepDist > 4) {
    const nx = agent.x + (dx / stepDist) * speed * dt;
    const ny = agent.y + (dy / stepDist) * speed * dt;
    if (!isPointInRiverWater(nx, ny, bridgeX)) {
      agent.x = nx;
      agent.y = ny;
    } else if (bridgeX !== null) {
      agent.x += (agent.x < bridgeX ? 1 : -1) * speed * dt;
    }
    agent.walkFrame += 0.16 * dt;
  }
  return Math.hypot(tx - agent.x, ty - agent.y);
}

function tickAnimals(state: SimulationState, dt: number): void {
  const guardians = state.animals.filter((a) => a.type === 'dog' || a.tamed);
  const horses = state.animals.filter((a) => a.type === 'horse');
  const fishCount = state.animals.filter((a) => a.type === 'fish').length;
  const hasOperationalSchool = isBuildingOperational(state, 'school');

  // La renovación del cardumen tarda exactamente 3 días de juego (gestionada en tickSimulation)
  const desiredVisualFish = Math.min(8, Math.ceil(state.riverFishStock / 2));
  if (fishCount < desiredVisualFish && state.riverFishStock > 0 && Math.random() < 0.03 * state.speed) {
    createAnimal(state, 'fish');
  }

  const bridgeX = isBridgePassable(state) ? state.bridge!.x : null;
  for (const animal of state.animals) {
    if (animal.cooldown > 0) animal.cooldown = Math.max(0, animal.cooldown - dt);
    if (animal.type === 'cow') animal.milkReady = clamp(animal.milkReady + 0.06 * dt, 0, 100);
    if (animal.type === 'sheep') animal.woolReady = clamp(animal.woolReady + 0.05 * dt, 0, 100);

    if (animal.type === 'fish') {
      if (Math.abs(animal.vx) < 0.2) animal.vx = 0.38;
      animal.x += animal.vx * dt;
      animal.y += Math.sin(state.minute * 0.06 + animal.id) * 0.06 * dt;
      if (animal.x < 24 || animal.x > CANVAS_WIDTH - 24) {
        animal.vx = -animal.vx;
        animal.x = clamp(animal.x, 24, CANVAS_WIDTH - 24);
      }
      animal.y = clamp(animal.y, RIVER_TOP_Y + 10, RIVER_BOTTOM_Y - 10);
      continue;
    }

    if (animal.type === 'horse' && animal.riderId !== null) {
      const rider = state.agents.find((a) => a.id === animal.riderId);
      if (!rider) {
        animal.riderId = null;
      } else {
        animal.x = rider.x;
        animal.y = rider.y + 4;
        animal.walkFrame = rider.walkFrame;
        continue;
      }
    }

    if (animal.type === 'dog' || animal.tamed) {
      const predator = state.animals.find(
        (other) => other.hostile && !other.tamed && Math.hypot(other.x - animal.x, other.y - animal.y) < 130
      );
      if (predator) {
        const dx = predator.x - animal.x;
        const dy = predator.y - animal.y;
        const d = Math.hypot(dx, dy) || 1;
        const nx = animal.x + (dx / d) * 1.2 * dt;
        const ny = animal.y + (dy / d) * 1.2 * dt;
        if (!isPointInRiverWater(nx, ny, bridgeX)) {
          animal.x = nx;
          animal.y = ny;
        }
        if (d < 24 && predator.cooldown <= 0) {
          predator.cooldown = 55;
          predator.vx = Math.sign(predator.x - WORLD_CENTER_X || 1) * 1.4;
          predator.vy = Math.sign(predator.y - SOUTH_CENTER_Y || -1) * 1.2;
          addLog(state, `${animal.name} ahuyentó a ${predator.name} lejos de los aldeanos.`, 'sky');
        }
        animal.walkFrame += 0.2 * dt;
        continue;
      }
    }

    if (animal.hostile && !animal.tamed) {
      const targetAgent = state.agents.find((a) => Math.hypot(a.x - animal.x, a.y - animal.y) < 110);
      if (targetAgent && animal.cooldown <= 0) {
        const guarded = guardians.some((g) => Math.hypot(g.x - targetAgent.x, g.y - targetAgent.y) < 62);
        const dx = targetAgent.x - animal.x;
        const dy = targetAgent.y - animal.y;
        const d = Math.hypot(dx, dy) || 1;
        if (!guarded) {
          const chaseSpeed = animal.type === 'wildcat' ? 0.95 : 0.72;
          const nx = animal.x + (dx / d) * chaseSpeed * dt;
          const ny = animal.y + (dy / d) * chaseSpeed * dt;
          if (!isPointInRiverWater(nx, ny, bridgeX)) {
            animal.x = nx;
            animal.y = ny;
          }
          if (d < 20) {
            const canTame =
              !targetAgent.isChild &&
              targetAgent.education >= (hasOperationalSchool ? 40 : 52) &&
              Math.random() < (targetAgent.education >= 65 ? 0.85 : 0.55);

            if (canTame) {
              tameWildAnimal(state, animal, targetAgent);
            } else {
              const hasTools = targetAgent.toolsCount > 0;
              const dmg = (animal.type === 'bear' ? 18 : 11) * (hasTools ? 0.45 : 1);
              targetAgent.health = clamp(targetAgent.health - dmg, 0, 100);
              targetAgent.moodModifier = clamp(targetAgent.moodModifier - 10, -45, 45);
              const threatLabel = animal.type === 'bear' ? 'Oso pardo' : 'Gato salvaje';
              decideVillagerMajorAction(state, targetAgent, 'crisis', { threatName: threatLabel });
              addLog(
                state,
                `¡Alerta! ${animal.name} atacó a ${targetAgent.name} (-${Math.round(dmg)} salud).`,
                'rose'
              );
              if (!targetAgent.isChild && targetAgent.health > 0) {
                defendAgainstWildAnimal(state, targetAgent, animal);
              } else {
                animal.cooldown = 70;
              }
            }
          }
        }
      }
    }

    if (Math.random() < 0.02 * state.speed) {
      animal.vx = (Math.random() - 0.5) * (animal.type === 'horse' ? 1.1 : 0.65);
      animal.vy = (Math.random() - 0.5) * 0.55;
    }
    const nx = clamp(animal.x + animal.vx * dt, 24, CANVAS_WIDTH - 24);
    const ny = clamp(animal.y + animal.vy * dt, NORTH_LAND_MIN_Y + 4, CANVAS_HEIGHT - 24);
    if (!isPointInRiverWater(nx, ny, bridgeX)) {
      animal.x = nx;
      animal.y = ny;
    } else {
      animal.vy = -animal.vy;
    }
    animal.walkFrame += 0.12 * dt;
  }

  for (const agent of state.agents) {
    if (agent.isChild || agent.mountedHorseId !== null) continue;
    if (
      agent.taskType === 'caravan' ||
      agent.taskType === 'trade' ||
      agent.taskType === 'gather_iron' ||
      agent.taskType === 'gather_copper' ||
      agent.taskType === 'gather_stone' ||
      agent.taskType === 'gather_gold' ||
      agent.taskType === 'gather_silver' ||
      agent.taskType === 'store_home' ||
      agent.taskType === 'sleep'
    ) {
      const freeHorse = horses.find(
        (h) => h.riderId === null && Math.hypot(h.x - agent.x, h.y - agent.y) < 42
      );
      if (freeHorse) {
        freeHorse.riderId = agent.id;
        agent.mountedHorseId = freeHorse.id;
        agent.thought = 'Monto a caballo para trasladarme mucho más rápido.';
      }
    }
  }
}

export function tickSimulation(state: SimulationState, elapsedSeconds = 1 / 60): void {
  if (state.speed === 0) return;

  const dt = 16.8 * elapsedSeconds * state.speed;
  const timing = SPEED_TIMINGS[state.speed];
  const dayRate = DAY_GAME_MINUTES / timing.daySeconds;
  const nightRate = NIGHT_GAME_MINUTES / timing.nightSeconds;

  // Temporizador real de 30 minutos para petición del Representante a la Intervención Divina
  if (!state.pendingPetition) {
    state.petitionTimerSec = Math.max(0, state.petitionTimerSec - elapsedSeconds);
    if (state.petitionTimerSec <= 0) {
      const petition = createVillagePetition(state);
      if (petition && state.qwenAutoRespondPetitions) {
        resolvePetitionWithQwen(state);
      } else {
        return;
      }
    }
  }

  if (state.lightningFlashTimer > 0) {
    state.lightningFlashTimer = Math.max(0, state.lightningFlashTimer - dt * 0.25);
  }

  if (Array.isArray(state.floatingEffects) && state.floatingEffects.length > 0) {
    for (const fx of state.floatingEffects) {
      fx.ttl -= elapsedSeconds;
      fx.y -= elapsedSeconds * 11;
    }
    state.floatingEffects = state.floatingEffects.filter((fx) => fx.ttl > 0);
  }

  // Regeneración de nodos finitos tras descansar sin sobreexplotación
  for (const r of state.resources) {
    if (r.depleted) {
      r.restTimer = Math.max(0, r.restTimer - 0.04 * dt);
      if (r.restTimer <= 0) {
        r.depleted = false;
        r.amount = r.maxAmount;
      }
    }
  }

  let remainingRealSec = elapsedSeconds;
  while (remainingRealSec > 1e-9) {
    const currentlyNight = isNightMinute(state.minute);
    const rate = currentlyNight ? nightRate : dayRate;
    const nextBoundary = currentlyNight
      ? state.minute >= NIGHT_START_MINUTE
        ? 1440
        : DAY_START_MINUTE
      : NIGHT_START_MINUTE;
    const secToBoundary = (nextBoundary - state.minute) / rate;
    const prevMinute = state.minute;
    if (remainingRealSec >= secToBoundary - 1e-9) {
      const gameMinutesPassed = Math.max(0, nextBoundary - prevMinute);
      if (state.riverFishRestTimer > 0) {
        state.riverFishRestTimer = Math.max(0, state.riverFishRestTimer - gameMinutesPassed / 1440);
        if (state.riverFishRestTimer <= 0) {
          state.riverFishStock = state.riverFishMaxStock;
          addLog(state, `El río reposó ${RIVER_FISH_RESTOCK_DAYS} días y renovó su cardumen de peces.`, 'sky');
        }
      }
      state.minute = nextBoundary;
      remainingRealSec = Math.max(0, remainingRealSec - secToBoundary);
      if (state.minute >= 1440) {
        state.minute = 0;
        state.day += 1;
        advanceDayAging(state, (st, mother, father) => {
          const childSex: 'M' | 'F' = Math.random() < 0.5 ? 'M' : 'F';
          const childName = pickQwenBabyName(childSex, st);
          const child = createAgent(
            st.nextId++,
            childName,
            childSex,
            clamp(mother.x + 10, 30, CANVAS_WIDTH - 30),
            mother.y < RIVER_TOP_Y
              ? clamp(mother.y + 10, NORTH_LAND_MIN_Y + 6, NORTH_LAND_MAX_Y - 6)
              : clamp(mother.y + 10, SAFE_LAND_MIN_Y + 6, CANVAS_HEIGHT - 30),
            father ? `${mother.name} & ${father.name}` : mother.name,
            0
          );
          child.coins = 0;
          child.houseId = mother.houseId ?? father?.houseId ?? null;
          child.lastQwenDecision = `Qwen 2.5 eligió el nombre ${childName} al concluir embarazo de 3 días.`;
          return child;
        });

        // Tormenta eléctrica espontánea si el clima es thunderstorm
        if (state.weather === 'thunderstorm' && Math.random() < 0.55) {
          triggerLightningStorm(state);
        }

        if (!state.resourcesPaused && state.resources.length < 75) {
          const spawnCount = state.season === 'Invierno' ? 3 : 5;
          const types: ResourceNode['type'][] = [
            'food',
            'wood',
            'pine_wood',
            'maple_wood',
            'oak_wood',
            'stone',
            'copper',
            'iron',
            'silver',
            'gold',
            'coins',
          ];
          for (let i = 0; i < spawnCount; i++) {
            const t =
              (state.weather === 'drought' || state.season === 'Invierno') && i % 3 === 0
                ? 'stone'
                : types[(state.day + i) % types.length];
            spawnResource(
              state,
              t,
              pickBiasedResourceX(t),
              i % 3 === 0
                ? NORTH_LAND_MIN_Y + 26 + Math.random() * (NORTH_LAND_MAX_Y - NORTH_LAND_MIN_Y - 52)
                : SAFE_LAND_MIN_Y + 20 + Math.random() * (CANVAS_HEIGHT - SAFE_LAND_MIN_Y - 64)
            );
          }
        }
      }
    } else {
      const gameMinutesPassed = Math.max(0, rate * remainingRealSec);
      if (state.riverFishRestTimer > 0) {
        state.riverFishRestTimer = Math.max(0, state.riverFishRestTimer - gameMinutesPassed / 1440);
        if (state.riverFishRestTimer <= 0) {
          state.riverFishStock = state.riverFishMaxStock;
          addLog(state, `El río reposó ${RIVER_FISH_RESTOCK_DAYS} días y renovó su cardumen de peces.`, 'sky');
        }
      }
      state.minute += gameMinutesPassed;
      remainingRealSec = 0;
    }
  }
  const isNight = isNightMinute(state.minute);

  // Impacto de incendios activos sobre estructuras cercanas
  if (state.fires.length > 0) {
    for (const f of state.fires) {
      f.intensity = clamp(f.intensity + 0.02 * dt, 20, 100);
      for (const h of state.houses) {
        if (Math.hypot(h.x - f.x, h.y - f.y) < 38) {
          h.durability = clamp(h.durability - 0.03 * dt, 5, 100);
        }
      }
      for (const b of state.specialBuildings) {
        if (Math.hypot(b.x - f.x, b.y - f.y) < 42) {
          b.durability = clamp(b.durability - 0.03 * dt, 5, 100);
        }
      }
    }
  }

  // Tormenta eléctrica en tiempo real: ocasionales rayos + fuego
  if (
    state.weather === 'thunderstorm' &&
    state.fires.length < 3 &&
    Math.random() < 0.035 * elapsedSeconds * state.speed
  ) {
    triggerLightningStorm(state);
  }

  if (
    !state.resourcesPaused &&
    state.weather === 'rain' &&
    Math.random() < 0.25 * elapsedSeconds * state.speed &&
    state.resources.length < 70
  ) {
    spawnResource(
      state,
      'food',
      70 + Math.random() * (CANVAS_WIDTH - 140),
      SAFE_LAND_MIN_Y + 18 + Math.random() * (CANVAS_HEIGHT - SAFE_LAND_MIN_Y - 64)
    );
  }

  syncSpecialBuildingStaff(state);
  ensureQwenControlledRepresentative(state);
  const totalElapsedGameMinutes = state.day * 1440 + state.minute;
  const lastRepMin = state.representativeLastActedMinute ?? 0;
  if (totalElapsedGameMinutes - lastRepMin >= 60 || totalElapsedGameMinutes < lastRepMin) {
    state.representativeLastActedMinute = totalElapsedGameMinutes;
    runQwenRepresentativeAutonomousTurn(state);
    if (state.ollama.enabled && state.ollama.url.trim()) {
      void runOllamaRepresentativeGovernance(state);
    }
  }
  tickAnimals(state, dt);

  const seasonGrowthMult =
    state.season === 'Primavera'
      ? 1.35
      : state.season === 'Verano'
        ? 1.1
        : state.season === 'Otoño'
          ? 0.9
          : 0.35;
  const weatherGrowthMult = state.weather === 'rain' || state.weather === 'thunderstorm' ? 1.25 : state.weather === 'drought' ? 0.5 : 1;
  for (const plot of state.farms) {
    plot.growth = clamp(plot.growth + 0.045 * seasonGrowthMult * weatherGrowthMult * dt, 0, 100);
  }

  const hasInfirmary = isBuildingOperational(state, 'infirmary');
  const hasSchool = isBuildingOperational(state, 'school');
  const hasBank = isBuildingOperational(state, 'bank');
  const market = state.specialBuildings.find((b) => b.type === 'market' && b.isOperational);
  const bakery = state.specialBuildings.find((b) => b.type === 'bakery' && b.isOperational);
  const forge = state.specialBuildings.find((b) => b.type === 'forge' && b.isOperational);
  const apothecary = state.specialBuildings.find((b) => b.type === 'apothecary' && b.isOperational);
  const carpentry = state.specialBuildings.find((b) => b.type === 'carpentry' && b.isOperational);
  const depot = state.specialBuildings.find((b) => b.type === 'general_depot' && b.isOperational) ?? null;
  const bankBuilding = state.specialBuildings.find((b) => b.type === 'bank' && b.isOperational);
  const schoolBuilding = state.specialBuildings.find((b) => b.type === 'school' && b.isOperational);
  const hasSheepWool = state.animals.some((a) => a.type === 'sheep');

  const deadIds: number[] = [];
  const currentBridgeX = isBridgePassable(state) ? state.bridge!.x : null;

  for (const agent of state.agents) {
    const onLitRoad = isNearRoad(state.roads, agent.x, agent.y);
    const nightLightingShield = isNight && onLitRoad ? 0.6 : 1;
    const hungerRate =
      (state.weather === 'drought' ? 0.0046 : 0.0028) *
      (state.season === 'Invierno' ? 1.15 : 1) *
      (isLawActive(state, 'winter_rationing') ? 0.8 : 1);
    const homelessEnergyPenalty = agent.houseId === null ? 1.55 : 1;
    const energyRate =
      (state.weather === 'storm' || state.weather === 'thunderstorm' ? 0.0045 : 0.0028) *
      nightLightingShield *
      homelessEnergyPenalty;

    agent.hunger = clamp(agent.hunger + hungerRate * dt, 0, 100);
    agent.energy = clamp(agent.energy - energyRate * dt, 0, 100);

    // Sin casa no pueden descansar: salud y energía bajan continuamente de noche
    if (agent.houseId === null && isNight) {
      agent.energy = clamp(agent.energy - 0.014 * dt, 0, 100);
      agent.health = clamp(agent.health - 0.012 * dt, 0, 100);
    }

    if (agent.talkingTimer > 0) agent.talkingTimer = Math.max(0, agent.talkingTimer - dt);
    if (agent.reproductionCooldown > 0) agent.reproductionCooldown = Math.max(0, agent.reproductionCooldown - dt);
    if (agent.moodModifier !== 0) {
      const decay = 0.004 * dt;
      agent.moodModifier =
        Math.abs(agent.moodModifier) <= decay ? 0 : agent.moodModifier - Math.sign(agent.moodModifier) * decay;
    }

    if (agent.isSick) {
      const house = state.houses.find((h) => h.id === agent.houseId);
      const dangerFactor = (agent.illness?.dangerPct ?? 30) / 40;
      const decay =
        (house ? 0.014 : 0.036) *
        dangerFactor *
        (hasInfirmary && !agent.illness?.incurable ? 0.5 : 1) *
        (apothecary && !agent.illness?.incurable ? 0.8 : 1);
      agent.health = clamp(agent.health - decay * dt, 0, 100);
    } else {
      if (agent.hunger < 50 && agent.houseId !== null) {
        agent.health = clamp(agent.health + (hasInfirmary ? 0.02 : 0.012) * dt, 0, 100);
      }
      const stormExposure =
        (state.weather === 'storm' || state.weather === 'thunderstorm') && agent.houseId === null ? 0.015 : 0;
      const winterExposure =
        state.season === 'Invierno' && agent.houseId === null ? (hasSheepWool ? 0.005 : 0.012) : 0;
      const hungerExposure = agent.hunger > 85 ? 0.015 : 0;
      const homelessExposure = agent.houseId === null ? (isNight ? 0.004 : 0.0003) : 0;
      if (
        Math.random() <
        (stormExposure + winterExposure + hungerExposure + homelessExposure) *
          nightLightingShield *
          elapsedSeconds *
          state.speed
      ) {
        const disease = contractDiseaseForAgent(state, agent);
        decideVillagerMajorAction(state, agent, 'crisis');
        addLog(state, `${agent.name} contrajo ${disease.name}.`, 'amber');
      }
    }

    if (agent.hunger > 92) {
      agent.health = clamp(agent.health - 0.04 * dt, 0, 100);
    }

    if (agent.health <= 0) {
      deadIds.push(agent.id);
      if (agent.activeConstruction) {
        cancelActiveConstruction(state, agent, 'fallecimiento', true);
      }
      transferInheritance(state, agent);
      addLog(state, `${agent.name} (${agent.ageYears} años) no resistió y falleció.`, 'rose');
      pushSoundCue(state, 'sadness');
      continue;
    }

    if (agent.hunger > 65 && agent.inv.food > 0) {
      agent.inv.food -= 1;
      agent.hunger = Math.max(0, agent.hunger - 40);
    }

    const workMult = getEmotionWorkMultiplier(agent.emotion);
    agent.taskTimer -= dt * workMult;
    if (isNight && agent.taskType !== 'sleep' && agent.taskType !== 'eat' && canAgentRest(agent)) {
      agent.taskTimer = 0;
    }
    if (agent.taskTimer <= 0) {
      chooseNextTask(state, agent, isNight);
    }

    const roadBoost = onLitRoad ? 1.35 : 1;
    const horseBoost = agent.mountedHorseId !== null ? 1.85 : 1;
    const toolBoost = agent.toolsCount > 0 ? 1.15 : 1;
    const moveSpeed =
      (agent.isSick ? 0.5 : agent.isElder ? 0.65 : 1.0) *
      (state.policies.workFocus ? 1.12 : 1) *
      workMult *
      roadBoost *
      horseBoost *
      toolBoost;

    // Caminos creados orgánicamente SOLO si los aldeanos lo ven necesario
    if (Math.random() < 0.008 * state.speed && agent.taskType !== 'idle' && agent.taskType !== 'sleep') {
      tryOrganicRoadConstruction(state, agent);
    }

    switch (agent.taskType) {
      case 'sleep': {
        const house = state.houses.find((h) => h.id === agent.houseId);
        if (!house) {
          // Sin casa NO puede descansar
          agent.taskTimer = 0;
          break;
        }
        const dist = moveTowards(agent, house.x, house.y + 12, moveSpeed, dt, currentBridgeX);
        if (dist <= 22) {
          if (agent.mountedHorseId !== null) {
            const horse = state.animals.find((a) => a.id === agent.mountedHorseId);
            if (horse) horse.riderId = null;
            agent.mountedHorseId = null;
          }
          const regen = 0.24 + house.level * 0.05 + (house.size === 'large' ? 0.06 : 0);
          agent.energy = clamp(agent.energy + regen * dt, 0, 100);
          agent.health = clamp(agent.health + (isNight ? 0.08 : 0.04) * dt, 0, 100);
          depositResourcesToHouse(agent, house, 'surplus', depot);
          if (
            agent.isSick &&
            !agent.illness?.incurable &&
            Math.random() < (hasInfirmary ? 0.022 : isNight ? 0.012 : 0.005) * state.speed
          ) {
            agent.isSick = false;
            agent.illness = null;
            agent.illnessName = null;
            agent.health = clamp(agent.health + 28, 0, 100);
            agent.thought = 'Descansar en mi vivienda me ayudó a recuperarme.';
          }
        }
        break;
      }
      case 'extinguish_fire': {
        const fire = state.fires.find((f) => f.id === agent.taskTargetId) ?? state.fires[0];
        if (!fire) {
          agent.taskTimer = 0;
          break;
        }
        const dist = moveTowards(agent, fire.x, fire.y, moveSpeed * 1.15, dt, currentBridgeX);
        if (dist <= 24) {
          extinguishFire(state, fire.id, agent);
          agent.taskTimer = 0;
        }
        break;
      }
      case 'repair_building': {
        const damagedHouse = state.houses.find((h) => h.durability < 75);
        const damagedSpecial = state.specialBuildings.find((b) => b.durability < 75);
        const tx = damagedSpecial ? damagedSpecial.x : damagedHouse ? damagedHouse.x : agent.x;
        const ty = damagedSpecial ? damagedSpecial.y : damagedHouse ? damagedHouse.y : agent.y;
        const dist = moveTowards(agent, tx, ty, moveSpeed, dt, currentBridgeX);
        if (dist <= 26 && agent.taskTimer <= 6) {
          const repCount = repairDamagedStructures(state, agent);
          if (repCount > 0) {
            pushFloatingEffect(state, agent.x, agent.y - 10, '🔧 Reparado', '#38bdf8');
          }
          agent.taskTimer = 0;
        }
        break;
      }
      case 'caravan': {
        const targetDest = market ?? forge ?? depot;
        if (!targetDest) {
          agent.taskTimer = 0;
          break;
        }
        const dist = moveTowards(agent, targetDest.x, targetDest.y + 10, moveSpeed * 1.1, dt, currentBridgeX);
        if (dist <= 26 && agent.taskTimer <= 6) {
          if (depot) depositMaterialsToBuilding(agent, depot, 'surplus');
          const gain = mintBackedCoins(state, 5);
          agent.coins += gain;
          advanceJobMastery(agent, 'Comerciante', 3);
          agent.thought = 'Completé una caravana de transporte entre zonas.';
          agent.taskTimer = 0;
        }
        break;
      }
      case 'deliver_materials': {
        const builder =
          (agent.taskTargetId !== null
            ? state.agents.find((b) => b.id === agent.taskTargetId && b.job === 'Constructor' && !b.isChild)
            : null) ??
          state.agents.find((b) => b.id !== agent.id && b.job === 'Constructor' && !b.isChild);
        if (!builder) {
          agent.taskTimer = 0;
          break;
        }
        const dist = moveTowards(agent, builder.x, builder.y, moveSpeed * 1.05, dt, currentBridgeX);
        if (dist <= 26) {
          const moved = transferMaterialsToConstructor(state, agent, builder);
          if (moved > 0) {
            agent.education = clamp(agent.education + 0.4, 0, 100);
            syncAgentSkills(agent);
            pushFloatingEffect(state, builder.x, builder.y - 12, `+${moved} 📦`, '#38bdf8');
          }
          agent.taskTimer = 0;
        }
        break;
      }
      case 'store_home': {
        const house = state.houses.find((h) => h.id === agent.houseId);
        const goDepotFirst =
          Boolean(depot) &&
          getAgentSurplusConstructionMaterials(agent) >= 2 &&
          agent.inv.food <= 2;
        const destX = goDepotFirst && depot ? depot.x : house ? house.x : depot ? depot.x : agent.x;
        const destY = goDepotFirst && depot ? depot.y + 10 : house ? house.y + 10 : depot ? depot.y + 10 : agent.y;
        if (!house && !depot) {
          agent.taskTimer = 0;
          break;
        }
        const dist = moveTowards(agent, destX, destY, moveSpeed, dt, currentBridgeX);
        if (dist <= 24) {
          let moved = 0;
          if (house) moved += depositResourcesToHouse(agent, house, 'surplus', depot);
          else if (depot) moved += depositMaterialsToBuilding(agent, depot, 'surplus');
          if (moved > 0) {
            agent.thought = `Resguardé ${moved} bienes en mi hogar y el Depósito.`;
          }
          agent.taskTimer = 0;
        }
        break;
      }
      case 'craft_tools': {
        const targetWorkshop = forge ?? carpentry;
        const tx = targetWorkshop ? targetWorkshop.x : agent.x;
        const ty = targetWorkshop ? targetWorkshop.y + 10 : agent.y;
        const dist = targetWorkshop ? moveTowards(agent, tx, ty, moveSpeed, dt, currentBridgeX) : 0;
        if (dist <= 24 && agent.taskTimer <= 5) {
          if ((agent.energy < 38 || agent.education < 35) && state.fires.length < 3 && Math.random() < 0.04) {
            spawnFire(state, agent.x, agent.y, `Error accidental de ${agent.name} en la forja`, targetWorkshop ? 'special' : 'forest', targetWorkshop?.id);
          } else {
            craftToolsForAgent(state, agent);
          }
          agent.taskTimer = 0;
        }
        break;
      }
      case 'manage_building': {
        const b = state.specialBuildings.find((item) => item.id === agent.assignedBuildingId);
        if (!b) {
          agent.taskTimer = 0;
          break;
        }
        // Dueño exclusivo en comercios/muelle/banco/taller: si no es dueño y ya tiene dueño otro, buscar otro local
        if (b.ownerId !== null && b.ownerId !== agent.id && (b.category === 'commerce' || b.type === 'dock')) {
          agent.assignedBuildingId = null;
          agent.taskTimer = 0;
          break;
        }
        const dist = moveTowards(agent, b.x, b.y + 12, moveSpeed, dt, currentBridgeX);
        if (dist <= 26 && agent.taskTimer <= 5) {
          const eff = b.efficiencyMultiplier ?? 1;
          if (!b.isOperational || eff <= 0) {
            agent.thought = `${b.name} está inoperativo por deuda de mantenimiento o deterioro.`;
            agent.taskTimer = 0;
            break;
          }
          if ((b.type === 'forge' || b.type === 'bakery') && (agent.energy < 35 || agent.education < 28) && state.fires.length < 3 && Math.random() < 0.025) {
            spawnFire(state, b.x, b.y, `Error accidental de ${agent.name} en ${b.name}`, 'special', b.id);
          }
          advanceJobMastery(agent, agent.job, 2);
          const competitors = getCompetingBuildingCount(state, b.type);
          const competitionFactor = (1 / (1 + 0.35 * (competitors - 1))) * eff;
          if (b.type === 'bank') {
            if (agent.inv.gold > 0) {
              b.storage.gold += agent.inv.gold;
              agent.inv.gold = 0;
            }
            if (agent.inv.silver > 0) {
              b.storage.silver += agent.inv.silver;
              agent.inv.silver = 0;
            }
            const earned = mintBackedCoins(state, Math.max(0, Math.round(5 * competitionFactor)));
            agent.coins += earned;
            b.storage.coins += mintBackedCoins(state, Math.round(3 * eff));
            if (state.loans.length < 3 && Math.random() < 0.25) {
              const needyBuilder = state.agents.find(
                (x) => !x.isChild && (x.job === 'Constructor' || x.job === 'Carpintero') && x.coins < 20
              );
              if (needyBuilder) grantBankLoan(state, needyBuilder, 12, 'obras civiles');
            }
          } else {
            const reward = Math.max(0, Math.round(4 * competitionFactor));
            agent.coins += mintBackedCoins(state, reward);
            state.knowledge += (b.type === 'school' ? 2 : 1) * eff;
            if (b.type === 'school') {
              agent.education = clamp(agent.education + 2 * eff, 0, 100);
              syncAgentSkills(agent);
            }
            if (b.type === 'general_depot') {
              depositMaterialsToBuilding(agent, b, 'surplus');
            }
          }
          agent.taskTimer = 0;
        }
        break;
      }
      case 'fish_river': {
        if (isLawActive(state, 'ban_fishing')) {
          enforceLawViolation(state, agent, 'ban_fishing');
          agent.taskTimer = 0;
          break;
        }
        // Respetar dueño exclusivo: si existe un muelle con dueño ajeno y no hay muelle libre, pesca en ribera alejada sin bono de muelle
        const myDock =
          state.specialBuildings.find((b) => b.type === 'dock' && b.isOperational && b.ownerId === agent.id) ??
          state.specialBuildings.find((b) => b.type === 'dock' && b.isOperational && b.ownerId === null);
        const rawBankX = currentBridgeX ? currentBridgeX + 76 : clamp(agent.x, FOREST_MAX_X + 40, MOUNTAIN_MIN_X - 40);
        const blockedByOtherDock =
          !myDock && state.specialBuildings.some((b) => b.type === 'dock' && Math.abs(b.x - rawBankX) < 55);
        const tx = myDock ? myDock.x : blockedByOtherDock ? clamp(rawBankX + 120, FOREST_MAX_X + 40, MOUNTAIN_MIN_X - 40) : rawBankX;
        const ty = myDock ? myDock.y - 8 : RIVER_BOTTOM_Y + 14;
        const dist = moveTowards(agent, tx, ty, moveSpeed, dt, currentBridgeX);
        if (dist <= 22 && agent.taskTimer <= 6) {
          if (state.riverFishStock <= 0) {
            agent.thought = 'El río quedó sin peces; hay que dejar descansar el cauce.';
            agent.taskTimer = 0;
            break;
          }
          const fish = state.animals.find((a) => a.type === 'fish');
          if (fish) {
            state.animals = state.animals.filter((a) => a.id !== fish.id);
          }
          state.riverFishStock = Math.max(0, state.riverFishStock - 1);
          if (state.riverFishStock === 0) {
            state.riverFishRestTimer = RIVER_FISH_RESTOCK_DAYS;
            addLog(
              state,
              `Pesca sobreexplotada: el río entró en reposo de ${RIVER_FISH_RESTOCK_DAYS} días para renovar peces.`,
              'amber'
            );
          }
          agent.inv.food += myDock ? 2 : 1;
          pushFloatingEffect(state, agent.x, agent.y - 10, myDock ? '+2 🐟' : '+1 🐟', '#38bdf8');
          const dockBonus = myDock ? Math.max(2, Math.round(4 / getCompetingBuildingCount(state, 'dock'))) : 1;
          agent.coins += mintBackedCoins(state, dockBonus);
          advanceJobMastery(agent, 'Pescador', 3);
          agent.education = clamp(agent.education + 0.5, 0, 100);
          syncAgentSkills(agent);
          state.knowledge += 1;
          addLog(state, `${agent.name} pescó en el río (+${myDock ? 2 : 1} comida · stock río: ${state.riverFishStock}/${state.riverFishMaxStock}).`, 'sky');
          agent.taskTimer = 0;
        }
        break;
      }
      case 'tend_livestock': {
        const target = state.animals.find((a) => a.id === agent.taskTargetId);
        if (!target) {
          agent.taskTimer = 0;
          break;
        }
        const dist = moveTowards(agent, target.x, target.y, moveSpeed, dt, currentBridgeX);
        if (dist <= 22) {
          if (target.type === 'cow' && target.milkReady >= 50) {
            target.milkReady = 0;
            agent.milkCount += 2;
            agent.coins += mintBackedCoins(state, 3);
            pushFloatingEffect(state, agent.x, agent.y - 10, '+2 🥛', '#f8fafc');
            addLog(state, `${agent.name} ordeñó a ${target.name} (+2 leche).`, 'emerald');
          } else if (target.type === 'sheep' && target.woolReady >= 50) {
            target.woolReady = 0;
            agent.coins += mintBackedCoins(state, 4);
            agent.moodModifier = clamp(agent.moodModifier + 4, -45, 45);
            pushFloatingEffect(state, agent.x, agent.y - 10, '+4 💰', '#facc15');
          } else if (target.type === 'chicken') {
            agent.inv.food += 1;
            agent.coins += mintBackedCoins(state, 1);
            pushFloatingEffect(state, agent.x, agent.y - 10, '+1 🥚', '#fde68a');
          }
          advanceJobMastery(agent, 'Agricultor', 2);
          agent.education = clamp(agent.education + 0.4, 0, 100);
          syncAgentSkills(agent);
          agent.taskTimer = 0;
        }
        break;
      }
      case 'gather_food':
      case 'gather_wood':
      case 'gather_stone':
      case 'gather_copper':
      case 'gather_iron':
      case 'gather_gold':
      case 'gather_silver': {
        const target = state.resources.find((r) => r.id === agent.taskTargetId);
        if (!target || !isResourceAccessibleForAgent(agent, target)) {
          agent.taskTimer = 0;
          break;
        }
        if (target.type === 'gold' && isLawActive(state, 'ban_mine_gold')) {
          enforceLawViolation(state, agent, 'ban_mine_gold');
          agent.taskTimer = 0;
          break;
        }
        const dist = moveTowards(agent, target.x, target.y, moveSpeed, dt, currentBridgeX);
        if (dist <= 14) {
          const bonusYield = agent.toolsCount > 0 ? 2 : 1;
          target.amount = Math.max(0, target.amount - 1);
          if (target.type === 'coins') {
            agent.coins += mintBackedCoins(state, 5 * bonusYield);
            pushFloatingEffect(state, agent.x, agent.y - 10, `+${5 * bonusYield} 💰`, '#facc15');
          } else if (target.type === 'pine_wood') {
            agent.inv.pineWood += bonusYield;
            agent.carpentryKnowledge = clamp(agent.carpentryKnowledge + 2, 0, 100);
            pushFloatingEffect(state, agent.x, agent.y - 10, `+${bonusYield} 🌲`, '#86efac');
          } else if (target.type === 'maple_wood') {
            agent.inv.mapleWood += bonusYield;
            agent.carpentryKnowledge = clamp(agent.carpentryKnowledge + 3, 0, 100);
            pushFloatingEffect(state, agent.x, agent.y - 10, `+${bonusYield} 🪵`, '#fdba74');
          } else if (target.type === 'oak_wood') {
            agent.inv.oakWood += bonusYield;
            agent.carpentryKnowledge = clamp(agent.carpentryKnowledge + 4, 0, 100);
            pushFloatingEffect(state, agent.x, agent.y - 10, `+${bonusYield} 🌳`, '#fbbf24');
          } else if (target.type === 'copper') {
            agent.inv.copper += bonusYield;
            agent.coins += mintBackedCoins(state, forge ? 4 : 2);
            pushFloatingEffect(state, agent.x, agent.y - 10, `+${bonusYield} 🟠`, '#fb923c');
          } else if (target.type === 'gold') {
            agent.inv.gold += bonusYield;
            recalculateEconomyReserve(state);
            agent.coins += mintBackedCoins(state, hasBank ? 8 : 5);
            pushFloatingEffect(state, agent.x, agent.y - 10, `+${bonusYield} 🥇`, '#facc15');
            addLog(state, `${agent.name} extrajo Oro 🥇 de la montaña (+${bonusYield}).`, 'amber');
          } else if (target.type === 'silver') {
            agent.inv.silver += bonusYield;
            recalculateEconomyReserve(state);
            agent.coins += mintBackedCoins(state, hasBank ? 5 : 3);
            pushFloatingEffect(state, agent.x, agent.y - 10, `+${bonusYield} 🥈`, '#e2e8f0');
          } else {
            agent.inv[target.type] += bonusYield;
            agent.coins += mintBackedCoins(state, target.type === 'iron' ? (forge ? 5 : 3) : 1);
            const icon = target.type === 'food' ? '🍎' : target.type === 'wood' ? '🪵' : '🪨';
            pushFloatingEffect(state, agent.x, agent.y - 10, `+${bonusYield} ${icon}`, '#cbd5e1');
          }

          if (target.type === 'wood' && agent.job === 'Carpintero') {
            agent.carpentryKnowledge = clamp(agent.carpentryKnowledge + 2, 0, 100);
          }
          const eduGain =
            target.type === 'gold' || target.type === 'silver' || target.type === 'iron'
              ? 0.85
              : target.type === 'stone' || target.type === 'copper' || target.type === 'pine_wood'
                ? 0.65
                : 0.45;
          agent.education = clamp(agent.education + eduGain, 0, 100);
          syncAgentSkills(agent);
          advanceJobMastery(agent, agent.job, 2);
          state.knowledge +=
            target.type === 'gold' || target.type === 'silver' || target.type === 'iron'
              ? 3
              : target.type === 'stone' || target.type === 'copper'
                ? 2
                : 1;
          if (target.amount <= 0) {
            // Recurso finito sobreexplotado: entra en reposo para renovarse luego
            target.depleted = true;
            target.restTimer = 28;
          }
          agent.taskTimer = Math.min(agent.taskTimer, 6);
        }
        break;
      }
      case 'farm_crops': {
        const plot = state.farms.find((f) => f.id === agent.taskTargetId) ?? state.farms[0];
        if (!plot) {
          agent.taskTimer = 0;
          break;
        }
        const dist = moveTowards(agent, plot.x, plot.y, moveSpeed, dt, currentBridgeX);
        if (dist <= 18) {
          if (plot.growth >= 90) {
            plot.growth = 15;
            const harvestBonus = plot.size === 'large' ? 5 : plot.size === 'medium' ? 4 : 3;
            agent.inv.food += harvestBonus;
            agent.coins += mintBackedCoins(state, 2);
            advanceJobMastery(agent, 'Agricultor', 3);
            agent.education = clamp(agent.education + 0.7, 0, 100);
            syncAgentSkills(agent);
            state.knowledge += 2;
            pushFloatingEffect(state, plot.x, plot.y - 10, `+${harvestBonus} 🌾`, '#facc15');
            addLog(state, `${agent.name} cosechó ${plot.cropName} (+${harvestBonus} raciones).`, 'emerald');
            pushSoundCue(state, 'celebration');
            agent.taskTimer = 0;
          } else {
            plot.growth = clamp(plot.growth + 0.14 * dt, 0, 100);
          }
        }
        break;
      }
      case 'build_house':
      case 'upgrade_house':
      case 'build_plaza':
      case 'build_bridge':
      case 'plant_farm':
      case 'build_special': {
        if (agent.job !== 'Constructor') {
          if (agent.activeConstruction) {
            cancelActiveConstruction(state, agent, `oficio ${agent.job} no constructor`);
          }
          agent.taskTimer = 0;
          break;
        }
        const ac = agent.activeConstruction;
        if (!ac) {
          agent.taskTimer = 0;
          break;
        }
        const dist = moveTowards(agent, ac.x, ac.y, moveSpeed, dt, currentBridgeX);
        if (dist <= 44) {
          ac.elapsed = clamp(ac.elapsed + dt * workMult, 0, ac.totalDuration);
          if (ac.elapsed >= ac.totalDuration) {
            const doneX = ac.x;
            const doneY = ac.y;
            if (completeActiveConstruction(state, agent)) {
              agent.education = clamp(agent.education + 1.2, 0, 100);
              syncAgentSkills(agent);
              pushFloatingEffect(state, doneX, doneY - 14, '🏠 Obra lista', '#4ade80');
            }
            agent.taskTimer = 0;
          }
        }
        break;
      }
      case 'heal_other': {
        const patient = state.agents.find((other) => other.id === agent.taskTargetId);
        if (!patient) {
          agent.taskTimer = 0;
          break;
        }
        const dist = moveTowards(agent, patient.x, patient.y, moveSpeed, dt, currentBridgeX);
        if (dist <= 18) {
          if (patient.illness?.incurable) {
            patient.happiness = clamp(patient.happiness + 6, 0, 100);
            patient.health = clamp(patient.health + 4, 1, 100);
          } else {
            const inf = state.specialBuildings.find((b) => b.type === 'infirmary' && b.isOperational);
            let usedMedicine = false;
            if (agent.medicineCount > 0) {
              agent.medicineCount -= 1;
              usedMedicine = true;
            } else if (inf && inf.storage.medicine > 0) {
              inf.storage.medicine -= 1;
              usedMedicine = true;
            }
            const seriousDisease = (patient.illness?.dangerPct ?? 0) >= 40;
            if (usedMedicine || !seriousDisease) {
              patient.isSick = false;
              patient.illness = null;
              patient.illnessName = null;
              patient.health = clamp(patient.health + (usedMedicine ? 48 : 28), 0, 100);
              patient.happiness = clamp(patient.happiness + 10, 0, 100);
            } else {
              // Sin medicina en cuadro serio: alivio parcial sin cura mágica
              patient.health = clamp(patient.health + 12, 0, 100);
              patient.thought = 'Necesito medicina de la Botica para curarme completamente.';
            }
          }
          agent.coins += mintBackedCoins(state, 5);
          advanceJobMastery(agent, 'Curandero', 4);
          agent.education = clamp(agent.education + 0.8, 0, 100);
          syncAgentSkills(agent);
          state.knowledge += 3;
          addLog(state, `${agent.name} atendió a ${patient.name}.`, 'emerald');
          agent.taskTimer = 0;
        }
        break;
      }
      case 'research': {
        const mentor = agent.mentorId !== null ? state.agents.find((m) => m.id === agent.mentorId) : null;
        const school = schoolBuilding;
        const tx = mentor ? mentor.x : school ? school.x : state.plaza ? state.plaza.x : agent.x;
        const ty = mentor ? mentor.y : school ? school.y : state.plaza ? state.plaza.y : agent.y;
        const dist = moveTowards(agent, tx, ty, moveSpeed * 0.85, dt, currentBridgeX);
        if (dist <= 75) {
          const mentorBoost = mentor ? 1.5 : 1;
          const schoolEff = school ? school.efficiencyMultiplier ?? 1 : 1;
          state.knowledge += (hasSchool ? 0.24 * schoolEff : 0.14) * dt * mentorBoost;
          agent.education = clamp(agent.education + (hasSchool ? 0.30 * schoolEff : 0.20) * dt * mentorBoost, 0, 100);
          agent.constructionKnowledge = clamp(agent.constructionKnowledge + (hasSchool ? 0.15 * schoolEff : 0.08) * dt * mentorBoost, 0, 100);
          if (mentor && mentor.job === 'Carpintero') {
            agent.carpentryKnowledge = clamp(agent.carpentryKnowledge + 0.16 * dt, 0, 100);
          }
          advanceJobMastery(agent, agent.job, 0.06 * dt);
          syncAgentSkills(agent);
        }
        break;
      }
      case 'trade': {
        const coinNode =
          agent.taskTargetId !== null
            ? state.resources.find((r) => r.id === agent.taskTargetId && r.type === 'coins' && !r.depleted)
            : null;
        if (coinNode) {
          const cdist = moveTowards(agent, coinNode.x, coinNode.y, moveSpeed, dt, currentBridgeX);
          if (cdist <= 14) {
            coinNode.amount = Math.max(0, coinNode.amount - 1);
            const gained = mintBackedCoins(state, 5);
            agent.coins += gained;
            if (coinNode.amount <= 0) {
              coinNode.depleted = true;
              coinNode.restTimer = 28;
            }
            agent.taskTimer = 0;
          }
          break;
        }
        const preferredShop =
          (agent.assignedBuildingId !== null
            ? state.specialBuildings.find((b) => b.id === agent.assignedBuildingId && b.isOperational)
            : null) ??
          (agent.job === 'Banquero' && bankBuilding
            ? bankBuilding
            : agent.job === 'Panadero' && bakery
              ? bakery
              : agent.job === 'Herrero' && forge
                ? forge
                : agent.job === 'Boticario' && apothecary
                  ? apothecary
                  : agent.job === 'Carpintero' && carpentry
                    ? carpentry
                    : market ?? bankBuilding ?? bakery ?? carpentry ?? forge ?? apothecary);
        const tx = preferredShop ? preferredShop.x : state.plaza ? state.plaza.x : agent.x;
        const ty = preferredShop ? preferredShop.y : state.plaza ? state.plaza.y : agent.y;
        const dist = moveTowards(agent, tx, ty, moveSpeed * 0.9, dt, currentBridgeX);
        if (dist <= 32 && agent.taskTimer <= 6) {
          const eff = preferredShop ? preferredShop.efficiencyMultiplier ?? 1 : 1;
          const competitors = preferredShop ? getCompetingBuildingCount(state, preferredShop.type) : 1;
          const compMult = (1 / (1 + 0.35 * (competitors - 1))) * eff;

          if (agent.job === 'Panadero' && bakery) {
            if (isLawActive(state, 'ban_trade_bread')) {
              enforceLawViolation(state, agent, 'ban_trade_bread');
            } else if ((bakery.efficiencyMultiplier ?? 1) > 0) {
              // Sección 6.B: Panadería necesita alimento real para producir pan
              const hasFood = agent.inv.food > 0 || bakery.storage.food > 0 || (depot?.storage.food ?? 0) > 0;
              if (hasFood) {
                let src = '';
                if (agent.inv.food > 0) {
                  agent.inv.food -= 1;
                  src = `Inventario (${agent.name})`;
                } else if (bakery.storage.food > 0) {
                  bakery.storage.food -= 1;
                  src = bakery.name;
                } else if (depot) {
                  depot.storage.food -= 1;
                  src = depot.name;
                }
                agent.breadCount += 2;
                agent.coins += mintBackedCoins(state, Math.max(1, Math.round(5 * compMult)));
                pushFloatingEffect(state, bakery.x, bakery.y - 16, '+2 🍞', '#fde68a');
                recordResourceOperation(state, {
                  actorName: agent.name,
                  targetName: bakery.name,
                  operationType: 'produccion',
                  materials: { food: 1 },
                  source: src,
                  result: '+2 Panes horneados',
                });
              } else {
                agent.thought = 'La Panadería necesita 1 Alimento para hornear pan.';
              }
            }
          } else if ((agent.job === 'Herrero' || agent.job === 'Artesano') && forge) {
            if ((forge.efficiencyMultiplier ?? 1) > 0) {
              // Sección 6.B: Herrería requiere 1 Cobre + 1 Hierro reales
              const hasCopper = agent.inv.copper > 0 || forge.storage.copper > 0 || (depot?.storage.copper ?? 0) > 0;
              const hasIron = agent.inv.iron > 0 || forge.storage.iron > 0 || (depot?.storage.iron ?? 0) > 0;
              if (hasCopper && hasIron) {
                if (agent.inv.copper > 0) agent.inv.copper -= 1;
                else if (forge.storage.copper > 0) forge.storage.copper -= 1;
                else if (depot) depot.storage.copper -= 1;

                if (agent.inv.iron > 0) agent.inv.iron -= 1;
                else if (forge.storage.iron > 0) forge.storage.iron -= 1;
                else if (depot) depot.storage.iron -= 1;

                agent.toolsCount += 1;
                agent.coins += mintBackedCoins(state, Math.max(2, Math.round(9 * compMult)));
                pushFloatingEffect(state, forge.x, forge.y - 16, '+1 ⚒️', '#fdba74');
                recordResourceOperation(state, {
                  actorName: agent.name,
                  targetName: forge.name,
                  operationType: 'produccion',
                  materials: { copper: 1, iron: 1 },
                  source: 'Forja / Depósito',
                  result: '+1 Herramienta forjada',
                });
                addLog(state, `${agent.name} forjó herramientas (1 Cobre + 1 Hierro) en la Herrería.`, 'amber');
              } else {
                agent.thought = 'La Herrería necesita 1 Cobre y 1 Hierro para forjar herramientas.';
              }
            }
          } else if (agent.job === 'Boticario' && apothecary) {
            if ((apothecary.efficiencyMultiplier ?? 1) > 0) {
              // Sección 6.B: Botica requiere 1 Alimento + 1 Madera para preparar medicina
              const hasFood = agent.inv.food > 0 || apothecary.storage.food > 0 || (depot?.storage.food ?? 0) > 0;
              const hasWood = agent.inv.wood > 0 || apothecary.storage.wood > 0 || (depot?.storage.wood ?? 0) > 0;
              if (hasFood && hasWood) {
                if (agent.inv.food > 0) agent.inv.food -= 1;
                else if (apothecary.storage.food > 0) apothecary.storage.food -= 1;
                else if (depot) depot.storage.food -= 1;

                if (agent.inv.wood > 0) agent.inv.wood -= 1;
                else if (apothecary.storage.wood > 0) apothecary.storage.wood -= 1;
                else if (depot) depot.storage.wood -= 1;

                agent.medicineCount += 1;
                agent.coins += mintBackedCoins(state, Math.max(2, Math.round(6 * compMult)));
                pushFloatingEffect(state, apothecary.x, apothecary.y - 16, '+1 💊', '#5eead4');
                recordResourceOperation(state, {
                  actorName: agent.name,
                  targetName: apothecary.name,
                  operationType: 'produccion',
                  materials: { food: 1, wood: 1 },
                  source: 'Botica / Depósito',
                  result: '+1 Medicina elaborada',
                });
              } else {
                agent.thought = 'La Botica necesita 1 Alimento y 1 Madera para elaborar medicina.';
              }
            }
          } else if (agent.job === 'Carpintero') {
            if (isLawActive(state, 'ban_trade_wood')) {
              enforceLawViolation(state, agent, 'ban_trade_wood');
            } else if (agent.inv.oakWood > 0 && canGatherOrTradeWood(agent, 'oak')) {
              agent.inv.oakWood -= 1;
              agent.coins += mintBackedCoins(state, Math.max(2, Math.round(WOOD_GRADE_CONFIG.oak.price * compMult)));
            } else if (agent.inv.mapleWood > 0 && canGatherOrTradeWood(agent, 'maple')) {
              agent.inv.mapleWood -= 1;
              agent.coins += mintBackedCoins(state, Math.max(2, Math.round(WOOD_GRADE_CONFIG.maple.price * compMult)));
            } else if (agent.inv.pineWood > 0 && canGatherOrTradeWood(agent, 'pine')) {
              agent.inv.pineWood -= 1;
              agent.coins += mintBackedCoins(state, Math.max(1, Math.round(WOOD_GRADE_CONFIG.pine.price * compMult)));
            } else if (agent.inv.wood > 1) {
              agent.inv.wood -= 1;
              agent.coins += mintBackedCoins(state, 3);
            }
          } else if (agent.inv.gold > 0 && bankBuilding && canGatherOrTradeMineral(agent, 'gold')) {
            agent.inv.gold -= 1;
            bankBuilding.storage.gold += 1;
            recalculateEconomyReserve(state);
            agent.coins += mintBackedCoins(state, 18);
          } else if (agent.inv.silver > 0 && bankBuilding && canGatherOrTradeMineral(agent, 'silver')) {
            agent.inv.silver -= 1;
            bankBuilding.storage.silver += 1;
            recalculateEconomyReserve(state);
            agent.coins += mintBackedCoins(state, 8);
          } else if (agent.inv.iron > 0 && canGatherOrTradeMineral(agent, 'iron')) {
            agent.inv.iron -= 1;
            agent.coins += mintBackedCoins(state, forge ? 8 : 6);
          } else if (agent.inv.copper > 0 && canGatherOrTradeMineral(agent, 'copper')) {
            agent.inv.copper -= 1;
            agent.coins += mintBackedCoins(state, forge ? 5 : 4);
          } else if (agent.inv.wood > 1 && !isLawActive(state, 'ban_trade_wood')) {
            agent.inv.wood -= 1;
            agent.coins += mintBackedCoins(state, carpentry ? 5 : 3);
          } else if (agent.inv.stone > 1) {
            agent.inv.stone -= 1;
            agent.coins += mintBackedCoins(state, 4);
          } else if (agent.coins >= 4 && agent.inv.food === 0) {
            agent.coins -= 4;
            agent.inv.food += 1;
          } else if (preferredShop && eff > 0) {
            agent.coins += mintBackedCoins(state, Math.max(1, Math.round(2 * eff)));
          }
          advanceJobMastery(agent, agent.job, 2);
          agent.taskTimer = 0;
        }
        break;
      }
      case 'socialize': {
        const targetPartner =
          agent.taskTargetId !== null
            ? state.agents.find((o) => o.id === agent.taskTargetId && o.id !== agent.id)
            : null;
        if (targetPartner) {
          const sdist = moveTowards(agent, targetPartner.x, targetPartner.y, moveSpeed * 0.95, dt, currentBridgeX);
          if (sdist <= 26) {
            if (
              !agent.isChild &&
              !targetPartner.isChild &&
              agent.ageYears >= AGE_PARTNER_MIN_YEARS &&
              targetPartner.ageYears >= AGE_PARTNER_MIN_YEARS &&
              agent.partnerId === null &&
              targetPartner.partnerId === null
            ) {
              const decision = decideVillagerMajorAction(state, agent, 'partnership', { partner: targetPartner });
              if (decision.approved) {
                agent.partnerId = targetPartner.id;
                targetPartner.partnerId = agent.id;
                pushFloatingEffect(state, agent.x, agent.y - 12, '💕 Pareja', '#f472b6');
                addLog(state, `${agent.name} y ${targetPartner.name} formaron pareja.`, 'violet');
                pushSoundCue(state, 'celebration');
              }
            }
            agent.taskTimer = 0;
          }
          break;
        }
        const stayNorthS = agent.y < RIVER_TOP_Y && currentBridgeX === null;
        const anchorXS = state.plaza && !stayNorthS ? state.plaza.x : WORLD_CENTER_X;
        const anchorYS = stayNorthS ? NORTH_CENTER_Y : state.plaza ? state.plaza.y : SOUTH_CENTER_Y;
        const angleS = (agent.id * 1.7 + state.minute * 0.01) % (Math.PI * 2);
        const txS = clamp(anchorXS + Math.cos(angleS) * 180, 48, CANVAS_WIDTH - 48);
        const tyS = stayNorthS
          ? clamp(anchorYS + Math.sin(angleS) * 90, NORTH_LAND_MIN_Y + 18, NORTH_LAND_MAX_Y - 18)
          : clamp(anchorYS + Math.sin(angleS) * 130, SAFE_LAND_MIN_Y + 18, CANVAS_HEIGHT - 48);
        moveTowards(agent, txS, tyS, moveSpeed * 0.55, dt, currentBridgeX);
        break;
      }
      case 'idle':
      case 'eat': {
        const stayNorth = agent.y < RIVER_TOP_Y && currentBridgeX === null;
        const anchorX = state.plaza && !stayNorth ? state.plaza.x : WORLD_CENTER_X;
        const anchorY = stayNorth ? NORTH_CENTER_Y : state.plaza ? state.plaza.y : SOUTH_CENTER_Y;
        const angle = (agent.id * 1.7 + state.minute * 0.01) % (Math.PI * 2);
        const tx = clamp(anchorX + Math.cos(angle) * 180, 48, CANVAS_WIDTH - 48);
        const ty = stayNorth
          ? clamp(anchorY + Math.sin(angle) * 90, NORTH_LAND_MIN_Y + 18, NORTH_LAND_MAX_Y - 18)
          : clamp(anchorY + Math.sin(angle) * 130, SAFE_LAND_MIN_Y + 18, CANVAS_HEIGHT - 48);
        moveTowards(agent, tx, ty, moveSpeed * 0.55, dt, currentBridgeX);
        break;
      }
    }

    if (hasSchool && !agent.isChild && Math.random() < 0.015 * state.speed) {
      agent.education = clamp(agent.education + 0.35, 0, 100);
      syncAgentSkills(agent);
    }

    agent.x = clamp(agent.x, 24, CANVAS_WIDTH - 24);
    if (isPointInRiverWater(agent.x, agent.y, currentBridgeX)) {
      agent.y = agent.y < (RIVER_TOP_Y + RIVER_BOTTOM_Y) / 2 ? RIVER_TOP_Y - 8 : RIVER_BOTTOM_Y + 8;
    } else {
      agent.y = clamp(agent.y, NORTH_LAND_MIN_Y, CANVAS_HEIGHT - 24);
    }

    const hasNearbyPet = state.animals.some(
      (an) => (an.type === 'cat' || an.type === 'dog') && Math.hypot(an.x - agent.x, an.y - agent.y) < 48
    );
    agent.happiness = computeAgentHappiness(
      agent,
      state.weather,
      state.policies,
      state.season,
      hasNearbyPet,
      isNight && onLitRoad
    );
    agent.emotion = deriveAgentEmotion(agent, state.weather);
    agent.importance = computeAgentImportance(agent);
  }

  if (deadIds.length > 0) {
    const deadSet = new Set(deadIds);
    state.agents = state.agents.filter((a) => !deadSet.has(a.id));
    for (const a of state.agents) {
      if (a.partnerId !== null && deadSet.has(a.partnerId)) a.partnerId = null;
    }
    for (const an of state.animals) {
      if (an.riderId !== null && deadSet.has(an.riderId)) an.riderId = null;
    }
    if (state.selectedAgentId !== null && deadSet.has(state.selectedAgentId)) state.selectedAgentId = null;
    if (state.highlightFamilyAgentId !== null && deadSet.has(state.highlightFamilyAgentId)) state.highlightFamilyAgentId = null;
    syncSpecialBuildingStaff(state);
    recalculateEconomyReserve(state);
    ensureQwenControlledRepresentative(state);
  }

  // Interacciones sociales emergentes, parejas (desde 15 años) y concepción de embarazo (desde 20 años, 3 días)
  for (let i = 0; i < state.agents.length; i++) {
    const a = state.agents[i];
    for (let j = i + 1; j < state.agents.length; j++) {
      const b = state.agents[j];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      if (d < 28 && Math.random() < 0.032 * state.speed) {
        a.talkingTimer = 14;
        b.talkingTimer = 14;
        const dialogue = generateEmergentDialogue(a, b, state);
        a.lastDialogue = dialogue;
        b.lastDialogue = dialogue;
        pushSoundCue(state, 'chatter');

        if (a.hunger > 48 && b.inv.food > 1 && a.coins >= 3) {
          b.inv.food -= 1;
          a.inv.food += 1;
          a.coins -= 3;
          b.coins += 3;
        } else if (
          state.policies.economyFocus &&
          !isLawActive(state, 'ban_trade_wood') &&
          a.inv.wood > 1 &&
          b.coins >= 3 &&
          Math.random() < 0.15
        ) {
          a.inv.wood -= 1;
          b.inv.wood += 1;
          b.coins -= 3;
          a.coins += 3;
        }

        if (
          state.policies.allowPartnerSwitch &&
          a.partnerId !== null &&
          a.partnerId !== b.id &&
          !b.isChild &&
          b.ageYears >= AGE_PARTNER_MIN_YEARS &&
          b.partnerId === null &&
          a.happiness < 42 &&
          Math.random() < 0.06
        ) {
          switchPartnerForAgent(state, a.id, 'búsqueda de nueva afinidad');
        }

        if (
          !a.isChild &&
          !b.isChild &&
          a.ageYears >= AGE_PARTNER_MIN_YEARS &&
          b.ageYears >= AGE_PARTNER_MIN_YEARS &&
          a.partnerId === null &&
          b.partnerId === null &&
          Math.random() < 0.34
        ) {
          const decision = decideVillagerMajorAction(state, a, 'partnership', { partner: b });
          if (decision.approved) {
            a.partnerId = b.id;
            b.partnerId = a.id;
            addLog(state, `${a.name} y ${b.name} formaron pareja.`, 'violet');
            pushSoundCue(state, 'celebration');
          }
        }

        const birthChance = state.policies.reproductionRestraint ? 0.06 : 0.22;
        if (
          a.partnerId === b.id &&
          canAgentsReproduce(a, b, state.houses, state.agents, state.policies) &&
          Math.random() < birthChance
        ) {
          const reproDecision = decideVillagerMajorAction(state, a, 'reproduction', { partner: b });
          if (reproDecision.approved) {
            const mother = a.sex === 'F' ? a : b;
            const father = a.sex === 'M' ? a : b;
            mother.pregnancy = {
              partnerId: father.id,
              daysRemaining: PREGNANCY_DAYS,
              conceptionDay: state.day,
            };
            mother.reproductionCooldown = 180;
            father.reproductionCooldown = 180;
            addLog(
              state,
              `${mother.name} y ${father.name} esperan un bebé (${PREGNANCY_DAYS} días de gestación).`,
              'violet'
            );
          }
        }
      }
    }
  }

  const nextEra = computeEra(state.knowledge, state.houses);
  if (nextEra !== state.era) {
    state.era = nextEra;
    addLog(state, `¡Hito histórico! La aldea evolucionó a ${ERA_METADATA[nextEra].label}.`, 'emerald');
    pushSoundCue(state, 'celebration');
  }
  recalculateEconomyReserve(state);
}

function getSunShadowOffset(
  minute: number,
  isNight: boolean
): { dx: number; dy: number; alpha: number } {
  if (isNight) return { dx: 0, dy: 2, alpha: 0.24 };
  const t = clamp((minute - 360) / 780, 0, 1);
  const dx = Math.round((0.5 - t) * 14);
  const dy = 3 + Math.round(Math.abs(t - 0.5) * 4);
  const alpha = 0.2 + Math.abs(t - 0.5) * 0.22;
  return { dx, dy, alpha };
}

function drawWarmHalo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  innerRgba: string
): void {
  const grad = ctx.createRadialGradient(x, y, 2, x, y, radius);
  grad.addColorStop(0, innerRgba);
  grad.addColorStop(0.55, innerRgba.replace(/[\d.]+\)$/, '0.14)'));
  grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawSmokePuffs(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  phase: number,
  dark = false
): void {
  for (let i = 0; i < 3; i++) {
    const p = (phase * 0.35 + i * 0.33) % 1;
    const py = Math.round(y - p * 18);
    const px = Math.round(x + Math.sin(p * Math.PI * 2 + i) * 3);
    const sz = Math.round(3 + p * 4);
    const alpha = Math.max(0.08, (1 - p) * 0.5);
    ctx.fillStyle = dark ? `rgba(71, 85, 105, ${alpha})` : `rgba(226, 232, 240, ${alpha})`;
    ctx.fillRect(px - Math.floor(sz / 2), py - Math.floor(sz / 2), sz, sz);
  }
}

function drawStructureWearOverlay(
  ctx: CanvasRenderingContext2D,
  leftX: number,
  topY: number,
  w: number,
  h: number,
  durability: number,
  status?: MaintenanceStatus
): void {
  if (durability >= 80 && (!status || status === 'ok')) return;
  const severe = status === 'inoperative' || status === 'ruined' || durability < 35;
  ctx.fillStyle = severe ? 'rgba(15, 23, 42, 0.72)' : 'rgba(30, 41, 59, 0.55)';
  // Grietas pixel-art en muros
  ctx.fillRect(leftX + 5, topY + 6, 2, 7);
  ctx.fillRect(leftX + 7, topY + 11, 2, 5);
  ctx.fillRect(leftX + w - 9, topY + 4, 2, 6);
  ctx.fillRect(leftX + w - 11, topY + 9, 2, 5);
  if (severe) {
    // Techo dañado / tablones faltantes y manchas oscuras
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.fillRect(leftX + Math.floor(w * 0.32), topY - 4, 6, 4);
    ctx.fillRect(leftX + 3, topY + h - 5, Math.floor(w * 0.35), 3);
  }
}

function drawLeftForestAndRightMountains(
  ctx: CanvasRenderingContext2D,
  season: SimulationState['season'],
  animPhase: number,
  shadow: { dx: number; dy: number; alpha: number }
): void {
  const isWinter = season === 'Invierno';
  const isAutumn = season === 'Otoño';
  const isSpring = season === 'Primavera';

  ctx.fillStyle = isWinter ? 'rgba(20, 48, 42, 0.45)' : 'rgba(13, 52, 24, 0.42)';
  ctx.fillRect(0, 0, FOREST_MAX_X, CANVAS_HEIGHT);

  for (let ty = 34; ty < CANVAS_HEIGHT - 28; ty += 56) {
    if (ty > RIVER_TOP_Y - 22 && ty < RIVER_BOTTOM_Y + 26) continue;
    for (let tx = 26; tx < FOREST_MAX_X - 24; tx += 58) {
      const ox = tx + ((ty * 7) % 21);
      const oy = ty + ((tx * 3) % 15);
      const sway = Math.round(Math.sin(animPhase * 1.4 + ox * 0.09 + oy * 0.05) * 1.4);

      // Sombra direccional según altura solar
      ctx.fillStyle = `rgba(0, 0, 0, ${shadow.alpha})`;
      ctx.fillRect(ox - 9 + shadow.dx, oy + 7 + Math.min(4, shadow.dy), 18, 5);

      ctx.fillStyle = '#451a03';
      ctx.fillRect(ox - 3, oy + 4, 6, 11);
      ctx.fillStyle = isWinter ? '#334155' : isAutumn ? '#b45309' : '#14532d';
      ctx.fillRect(ox - 12 + Math.round(sway * 0.5), oy - 6, 24, 12);
      ctx.fillStyle = isWinter ? '#64748b' : isAutumn ? '#d97706' : '#15803d';
      ctx.fillRect(ox - 9 + sway, oy - 13, 18, 9);
      ctx.fillStyle = isWinter ? '#cbd5e1' : isAutumn ? '#f59e0b' : '#22c55e';
      ctx.fillRect(ox - 5 + sway, oy - 18, 10, 6);

      if (isSpring) {
        // Brotes/flores primaverales
        ctx.fillStyle = (ox + oy) % 2 === 0 ? '#f9a8d4' : '#fef08a';
        ctx.fillRect(ox - 6 + sway, oy - 11, 2, 2);
        ctx.fillRect(ox + 3 + sway, oy - 7, 2, 2);
      } else if (isWinter) {
        // Nieve sobre copa
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(ox - 5 + sway, oy - 19, 10, 3);
      }
    }
  }

  // Hojas cayendo suavemente en Otoño dentro del bosque
  if (isAutumn) {
    for (let i = 0; i < 16; i++) {
      const lx = ((i * 37 + Math.floor(animPhase * 12)) % (FOREST_MAX_X - 18)) + 8;
      const ly = ((i * 59 + Math.floor(animPhase * 22)) % (CANVAS_HEIGHT - 20)) + 10;
      ctx.fillStyle = i % 2 === 0 ? '#f59e0b' : '#ea580c';
      ctx.fillRect(lx, ly, 3, 2);
    }
  }

  ctx.fillStyle = isWinter ? 'rgba(71, 85, 105, 0.46)' : 'rgba(51, 65, 85, 0.46)';
  ctx.fillRect(MOUNTAIN_MIN_X, 0, CANVAS_WIDTH - MOUNTAIN_MIN_X, CANVAS_HEIGHT);

  for (let my = 48; my < CANVAS_HEIGHT - 36; my += 84) {
    if (my > RIVER_TOP_Y - 24 && my < RIVER_BOTTOM_Y + 34) continue;
    for (let mx = MOUNTAIN_MIN_X + 34; mx < CANVAS_WIDTH - 24; mx += 78) {
      const ox = mx + ((my * 5) % 19);
      const oy = my + ((mx * 3) % 15);
      ctx.fillStyle = `rgba(0,0,0,${shadow.alpha + 0.08})`;
      ctx.fillRect(ox - 24 + Math.round(shadow.dx * 0.7), oy + 14 + Math.min(4, shadow.dy), 48, 6);
      ctx.fillStyle = '#334155';
      ctx.fillRect(ox - 22, oy, 44, 16);
      ctx.fillStyle = '#475569';
      ctx.fillRect(ox - 16, oy - 12, 32, 14);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(ox - 10, oy - 22, 20, 12);
      ctx.fillStyle = isWinter ? '#f8fafc' : '#e2e8f0';
      ctx.fillRect(ox - 6, oy - 27, 12, 7);
      ctx.fillRect(ox - 9, oy - 21, 5, 3);
      ctx.fillRect(ox + 4, oy - 21, 5, 3);
    }
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.fillRect(10, 8, 128, 15);
  ctx.fillRect(CANVAS_WIDTH - 152, 8, 142, 15);
  ctx.fillStyle = '#86efac';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('BOSQUE (Maderas)', 16, 19);
  ctx.fillStyle = '#fcd34d';
  ctx.textAlign = 'right';
  ctx.fillText('MONTAÑAS (Minerales)', CANVAS_WIDTH - 16, 19);
}

function drawCenterRiver(
  ctx: CanvasRenderingContext2D,
  minute: number,
  season: SimulationState['season'],
  bridge: SimulationState['bridge'],
  isBridgeSelected: boolean,
  animPhase: number
): void {
  const isWinter = season === 'Invierno';
  // Riberas arenosas / empedradas superior e inferior
  ctx.fillStyle = isWinter ? '#cbd5e1' : '#b48a5a';
  ctx.fillRect(0, RIVER_TOP_Y - 7, CANVAS_WIDTH, RIVER_BOTTOM_Y - RIVER_TOP_Y + 14);
  ctx.fillStyle = isWinter ? '#94a3b8' : '#855e3c';
  ctx.fillRect(0, RIVER_TOP_Y - 3, CANVAS_WIDTH, RIVER_BOTTOM_Y - RIVER_TOP_Y + 6);

  // Cauce central profundo
  ctx.fillStyle = isWinter ? '#7dd3fc' : '#1d4ed8';
  ctx.fillRect(0, RIVER_TOP_Y, CANVAS_WIDTH, RIVER_BOTTOM_Y - RIVER_TOP_Y);

  ctx.fillStyle = isWinter ? '#93c5fd' : '#2563eb';
  ctx.fillRect(0, RIVER_TOP_Y + 12, CANVAS_WIDTH, RIVER_BOTTOM_Y - RIVER_TOP_Y - 24);

  // Espuma sutil en las orillas
  ctx.fillStyle = isWinter ? 'rgba(248, 250, 252, 0.42)' : 'rgba(186, 230, 253, 0.25)';
  for (let sx = 0; sx < CANVAS_WIDTH; sx += 28) {
    const off = Math.round(Math.sin(animPhase * 2 + sx * 0.05) * 2);
    ctx.fillRect(sx + off, RIVER_TOP_Y + 1, 14, 2);
    ctx.fillRect(sx - off, RIVER_BOTTOM_Y - 3, 14, 2);
  }

  const shift = Math.floor(minute * 1.4 + animPhase * 8) % 48;
  ctx.fillStyle = isWinter ? '#e0f2fe' : '#60a5fa';
  for (let rx = -48 + shift; rx < CANVAS_WIDTH + 48; rx += 48) {
    ctx.fillRect(rx, RIVER_TOP_Y + 8, 16, 3);
    ctx.fillRect(rx + 20, RIVER_TOP_Y + 28, 18, 3);
    ctx.fillRect(rx + 8, RIVER_TOP_Y + 48, 14, 2);
  }

  // Neblina matinal suave sobre el río al amanecer (05:30 - 08:40)
  if (minute >= 330 && minute <= 520) {
    const mistDrift = Math.round(Math.sin(animPhase * 0.7) * 18);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.14)';
    for (let mx = -40 + mistDrift; mx < CANVAS_WIDTH; mx += 160) {
      ctx.fillRect(mx, RIVER_TOP_Y - 6, 96, 18);
      ctx.fillRect(mx + 44, RIVER_BOTTOM_Y - 12, 88, 16);
    }
  }

  // Etiquetas sutiles Zona Norte / Zona Sur para orientar al jugador
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  ctx.fillRect(WORLD_CENTER_X - 42, RIVER_TOP_Y - 24, 84, 13);
  ctx.fillRect(WORLD_CENTER_X - 38, RIVER_BOTTOM_Y + 11, 76, 13);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ZONA NORTE', WORLD_CENTER_X, RIVER_TOP_Y - 14);
  ctx.fillText('ZONA SUR', WORLD_CENTER_X, RIVER_BOTTOM_Y + 21);

  if (bridge) {
    const passable = isBridgePassable({ bridge });
    const bxMin = bridge.x - BRIDGE_HALF_WIDTH;
    const bridgeW = BRIDGE_HALF_WIDTH * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(bxMin - 3, RIVER_TOP_Y - 2, bridgeW + 6, RIVER_BOTTOM_Y - RIVER_TOP_Y + 10);
    ctx.fillStyle = '#475569';
    ctx.fillRect(bxMin - 3, RIVER_TOP_Y - 8, 6, RIVER_BOTTOM_Y - RIVER_TOP_Y + 16);
    ctx.fillRect(bxMin + bridgeW - 3, RIVER_TOP_Y - 8, 6, RIVER_BOTTOM_Y - RIVER_TOP_Y + 16);
    ctx.fillStyle = passable ? '#78350f' : '#450a0a';
    ctx.fillRect(bxMin, RIVER_TOP_Y - 6, bridgeW, RIVER_BOTTOM_Y - RIVER_TOP_Y + 12);
    ctx.fillStyle = passable ? '#92400e' : '#7f1d1d';
    for (let by = RIVER_TOP_Y - 4; by <= RIVER_BOTTOM_Y + 2; by += 6) {
      // Si el puente está bloqueado/inoperativo, deja huecos rotos en el centro dejando ver el agua
      if (!passable && by >= RIVER_TOP_Y + 16 && by <= RIVER_BOTTOM_Y - 16) {
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(bxMin + 8, by, bridgeW - 16, 4);
        ctx.fillStyle = '#7f1d1d';
        continue;
      }
      ctx.fillRect(bxMin + 3, by, bridgeW - 6, 4);
    }
    ctx.fillStyle = '#451a03';
    ctx.fillRect(bxMin, RIVER_TOP_Y - 6, 4, RIVER_BOTTOM_Y - RIVER_TOP_Y + 12);
    ctx.fillRect(bxMin + bridgeW - 4, RIVER_TOP_Y - 6, 4, RIVER_BOTTOM_Y - RIVER_TOP_Y + 12);

    if (!passable) {
      // Barrera roja y blanca en ambos extremos indicando paso cerrado
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(bxMin + 2, RIVER_TOP_Y - 6, bridgeW - 4, 3);
      ctx.fillRect(bxMin + 2, RIVER_BOTTOM_Y + 3, bridgeW - 4, 3);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(bxMin + 8, RIVER_TOP_Y - 6, 6, 3);
      ctx.fillRect(bxMin + bridgeW - 14, RIVER_TOP_Y - 6, 6, 3);
      ctx.fillRect(bxMin + 8, RIVER_BOTTOM_Y + 3, 6, 3);
      ctx.fillRect(bxMin + bridgeW - 14, RIVER_BOTTOM_Y + 3, 6, 3);
    }

    if (!passable || bridge.maintenanceStatus !== 'ok') {
      ctx.fillStyle = !passable ? 'rgba(153, 27, 27, 0.92)' : 'rgba(180, 83, 9, 0.92)';
      ctx.fillRect(bridge.x - 28, RIVER_TOP_Y + 22, 56, 11);
      ctx.fillStyle = '#fef2f2';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(!passable ? 'BLOQUEADO' : 'DEUDA MANT.', bridge.x, RIVER_TOP_Y + 30);
    }
    if (isBridgeSelected) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(bxMin - 4, RIVER_TOP_Y - 10, bridgeW + 8, RIVER_BOTTOM_Y - RIVER_TOP_Y + 20);
    }
  }
}

function drawRoads(ctx: CanvasRenderingContext2D, roads: RoadTile[]): void {
  const half = ROAD_GRID_SIZE / 2;
  for (const r of roads) {
    const rType = r.roadType ?? 'dirt';
    if (rType === 'dirt') {
      ctx.fillStyle = '#6b4724';
      ctx.fillRect(r.x - half, r.y - half, ROAD_GRID_SIZE, ROAD_GRID_SIZE);
      ctx.fillStyle = '#8b5e34';
      ctx.fillRect(r.x - half + 2, r.y - half + 2, ROAD_GRID_SIZE - 4, ROAD_GRID_SIZE - 4);
      ctx.fillStyle = '#a47549';
      ctx.fillRect(r.x - 6, r.y - 5, 4, 3);
      ctx.fillRect(r.x + 2, r.y + 2, 5, 3);
    } else if (rType === 'reinforced') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(r.x - half, r.y - half, ROAD_GRID_SIZE, ROAD_GRID_SIZE);
      ctx.fillStyle = '#475569';
      ctx.fillRect(r.x - half + 3, r.y - half + 3, ROAD_GRID_SIZE - 6, ROAD_GRID_SIZE - 6);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(r.x - 6, r.y - 6, 5, 5);
      ctx.fillRect(r.x + 1, r.y - 6, 5, 5);
      ctx.fillRect(r.x - 6, r.y + 1, 5, 5);
      ctx.fillRect(r.x + 1, r.y + 1, 5, 5);
    } else {
      ctx.fillStyle = '#475569';
      ctx.fillRect(r.x - half, r.y - half, ROAD_GRID_SIZE, ROAD_GRID_SIZE);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(r.x - half + 2, r.y - half + 2, ROAD_GRID_SIZE - 4, ROAD_GRID_SIZE - 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(r.x - 8, r.y - 7, 6, 5);
      ctx.fillRect(r.x + 2, r.y - 5, 6, 5);
      ctx.fillRect(r.x - 6, r.y + 2, 7, 5);
      ctx.fillRect(r.x + 3, r.y + 3, 5, 4);
    }
    if (r.hasLamp ?? (r.lit && (r.x + r.y) % 48 === 0)) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(r.x + 7, r.y - 10, 3, 8);
      ctx.fillStyle = r.lit ? '#facc15' : '#64748b';
      ctx.fillRect(r.x + 6, r.y - 12, 5, 3);
    }
  }
}

function drawCentralPlaza(
  ctx: CanvasRenderingContext2D,
  plaza: NonNullable<SimulationState['plaza']>,
  minute: number,
  isNight: boolean,
  isSelected: boolean
): void {
  const cx = plaza.x;
  const cy = plaza.y;
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = '#64748b';
  ctx.fillRect(-62, -46, 124, 92);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-56, -40, 112, 80);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(-34, -24, 68, 48);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-28, -18, 56, 36);

  ctx.fillStyle = '#78350f';
  ctx.fillRect(-50, -10, 7, 20);
  ctx.fillRect(43, -10, 7, 20);

  ctx.fillStyle = '#334155';
  ctx.fillRect(-17, -14, 34, 28);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(-14, -11, 28, 22);
  ctx.fillStyle = '#7dd3fc';
  const ripple = Math.floor(minute * 0.4) % 2 === 0;
  ctx.fillRect(ripple ? -9 : -5, -7, 7, 3);
  ctx.fillRect(ripple ? 2 : -2, 3, 8, 3);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(-4, -13, 8, 15);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(-2, -16, 4, 4);

  const corners = [
    [-52, -38],
    [48, -38],
    [-52, 34],
    [48, 34],
  ];
  for (const [lx, ly] of corners) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(lx, ly, 4, 6);
    ctx.fillStyle = isNight ? '#fde047' : '#f59e0b';
    ctx.fillRect(lx, ly - 3, 4, 4);
  }

  drawStructureWearOverlay(ctx, -56, -40, 112, 80, plaza.durability, plaza.maintenanceStatus);

  if (isSelected) {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(-65, -49, 130, 98);
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(-26, -60, 52, 11);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PLAZA', 0, -52);

  ctx.restore();
}

function drawFarmPlot(ctx: CanvasRenderingContext2D, plot: FarmPlot, isSelected: boolean): void {
  const x = Math.round(plot.x);
  const y = Math.round(plot.y);
  const halfW = plot.size === 'large' ? 30 : plot.size === 'medium' ? 22 : 15;
  const halfH = plot.size === 'large' ? 20 : plot.size === 'medium' ? 14 : 10;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#78350f';
  ctx.fillRect(-halfW - 2, -halfH - 2, halfW * 2 + 4, halfH * 2 + 4);
  ctx.fillStyle = '#4a3219';
  ctx.fillRect(-halfW, -halfH, halfW * 2, halfH * 2);

  ctx.fillStyle = '#92400e';
  ctx.fillRect(-halfW - 3, -halfH - 3, 3, 5);
  ctx.fillRect(halfW, -halfH - 3, 3, 5);
  ctx.fillRect(-halfW - 3, halfH - 2, 3, 5);
  ctx.fillRect(halfW, halfH - 2, 3, 5);

  const color =
    plot.cropName === 'Maíz'
      ? plot.growth >= 85
        ? '#facc15'
        : '#65a30d'
      : plot.growth >= 85
        ? '#eab308'
        : plot.growth >= 45
          ? '#84cc16'
          : '#22c55e';
  const height = plot.growth >= 85 ? 7 : plot.growth >= 45 ? 5 : 3;
  ctx.fillStyle = color;
  for (let row = -halfH + 4; row <= halfH - 3; row += 6) {
    for (let col = -halfW + 4; col <= halfW - 5; col += 6) {
      ctx.fillRect(col, row - height + 2, 3, height);
    }
  }

  if (plot.size === 'large') {
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(halfW - 10, -halfH + 2, 8, 6);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-halfW + 3, -halfH - 6, 2, 8);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-halfW + 2, -halfH - 8, 4, 3);
  } else if (plot.size === 'medium') {
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(halfW - 8, halfH - 7, 6, 5);
  }

  drawStructureWearOverlay(ctx, -halfW, -halfH, halfW * 2, halfH * 2, plot.durability, plot.maintenanceStatus);

  if (isSelected) {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(-halfW - 5, -halfH - 5, halfW * 2 + 10, halfH * 2 + 10);
  }

  ctx.restore();
}

function drawSpecialBuilding(
  ctx: CanvasRenderingContext2D,
  b: SpecialBuilding,
  isNight: boolean,
  isSelected: boolean,
  season: SimulationState['season'],
  shadow: { dx: number; dy: number; alpha: number },
  animPhase: number
): void {
  const x = Math.round(b.x);
  const y = Math.round(b.y);
  ctx.save();
  ctx.translate(x, y);

  // Sombra direccional según ángulo solar
  ctx.fillStyle = `rgba(0,0,0,${shadow.alpha + 0.14})`;
  ctx.fillRect(-30 + shadow.dx, 14 + Math.min(4, shadow.dy), 60, 7);

  switch (b.type) {
    case 'dock': {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-30, -24, 60, 34);
      ctx.fillStyle = '#92400e';
      for (let py = -22; py <= 6; py += 6) {
        ctx.fillRect(-28, py, 56, 3);
      }
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-28, -26, 4, 38);
      ctx.fillRect(24, -26, 4, 38);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-14, -34, 24, 9);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(-6, -32, 8, 4);
      break;
    }
    case 'bank': {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-29, -13, 58, 30);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-31, 13, 62, 4);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-32, -21, 64, 8);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-22, -27, 44, 6);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-5, -25, 10, 8);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-24, -11, 5, 24);
      ctx.fillRect(-12, -11, 5, 24);
      ctx.fillRect(7, -11, 5, 24);
      ctx.fillRect(19, -11, 5, 24);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-5, 1, 10, 14);
      break;
    }
    case 'infirmary': {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-32, -14, 64, 32);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-35, -22, 70, 9);
      ctx.fillRect(-22, -29, 44, 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-8, -28, 16, 12);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-2, -27, 4, 10);
      ctx.fillRect(-5, -24, 10, 4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-5, 6, 10, 12);
      ctx.fillStyle = isNight && b.isOperational ? '#fef08a' : '#bae6fd';
      ctx.fillRect(-26, -6, 7, 7);
      ctx.fillRect(19, -6, 7, 7);
      break;
    }
    case 'school': {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-30, -13, 60, 31);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(-33, -21, 66, 9);
      ctx.fillRect(-22, -27, 44, 6);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-7, -37, 14, 10);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-3, -34, 6, 6);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-5, 6, 10, 12);
      ctx.fillStyle = isNight && b.isOperational ? '#fde047' : '#60a5fa';
      ctx.fillRect(-24, -4, 7, 7);
      ctx.fillRect(17, -4, 7, 7);
      break;
    }
    case 'market': {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-30, -6, 60, 22);
      for (let i = -32; i < 32; i += 8) {
        ctx.fillStyle = (Math.abs(i) / 8) % 2 === 0 ? '#dc2626' : '#fef3c7';
        ctx.fillRect(i, -19, 8, 12);
      }
      ctx.fillStyle = '#059669';
      ctx.fillRect(-28, -25, 56, 6);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-24, 3, 10, 8);
      ctx.fillRect(-6, 3, 10, 8);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(14, 3, 10, 8);
      break;
    }
    case 'bakery': {
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-21, -10, 42, 24);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-24, -17, 48, 8);
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(10, -29, 7, 12);
      ctx.fillStyle = b.isOperational ? '#fde68a' : '#94a3b8';
      ctx.fillRect(-16, -2, 11, 7);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(1, 4, 8, 10);
      if (b.isOperational) drawSmokePuffs(ctx, 13, -31, animPhase);
      break;
    }
    case 'carpentry': {
      ctx.fillStyle = '#9a6b3f';
      ctx.fillRect(-24, -11, 48, 26);
      ctx.fillStyle = '#654321';
      ctx.fillRect(-27, -18, 54, 8);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-4, 5, 8, 10);
      ctx.fillStyle = isNight && b.isOperational ? '#fde047' : '#93c5fd';
      ctx.fillRect(10, -3, 8, 6);
      break;
    }
    case 'forge': {
      ctx.fillStyle = '#475569';
      ctx.fillRect(-25, -11, 50, 26);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-28, -18, 56, 8);
      ctx.fillStyle = '#334155';
      ctx.fillRect(11, -28, 7, 10);
      ctx.fillStyle = b.isOperational ? '#f97316' : '#334155';
      ctx.fillRect(-7, 3, 12, 12);
      ctx.fillStyle = b.isOperational ? '#fde047' : '#64748b';
      ctx.fillRect(-3, 7, 5, 6);
      if (b.isOperational) {
        drawSmokePuffs(ctx, 14, -30, animPhase, true);
        // Chispas de forja
        if (Math.floor(animPhase * 4) % 2 === 0) {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-5, 0, 2, 2);
          ctx.fillRect(2, -1, 2, 2);
        }
      }
      break;
    }
    case 'apothecary': {
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(-20, -10, 40, 24);
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(-23, -17, 46, 8);
      ctx.fillStyle = '#475569';
      ctx.fillRect(9, -26, 5, 9);
      ctx.fillStyle = '#2dd4bf';
      ctx.fillRect(-4, -20, 8, 7);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-4, 4, 8, 10);
      if (b.isOperational) drawSmokePuffs(ctx, 11, -28, animPhase + 0.5);
      break;
    }
    case 'general_depot': {
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(-29, -12, 58, 28);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-32, -20, 64, 9);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-24, 2, 12, 12);
      ctx.fillRect(12, 2, 12, 12);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-7, 0, 14, 16);
      break;
    }
    case 'town_hall': {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-32, -14, 64, 32);
      ctx.fillStyle = '#7e22ce';
      ctx.fillRect(-35, -22, 70, 8);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-9, -38, 18, 18);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-4, -33, 8, 8);
      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(-6, 4, 12, 14);
      break;
    }
    case 'police_station': {
      ctx.fillStyle = '#334155';
      ctx.fillRect(-24, -12, 48, 27);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(-27, -19, 54, 8);
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(-4, -24, 8, 6);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-5, 3, 10, 12);
      break;
    }
    case 'prison': {
      ctx.fillStyle = '#475569';
      ctx.fillRect(-25, -12, 50, 27);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-27, -18, 54, 7);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-16, -5, 12, 10);
      ctx.fillRect(4, -5, 12, 10);
      ctx.fillStyle = '#cbd5e1';
      for (let bx = -14; bx <= -6; bx += 3) ctx.fillRect(bx, -5, 1, 10);
      for (let bx = 6; bx <= 14; bx += 3) ctx.fillRect(bx, -5, 1, 10);
      break;
    }
  }

  if (season === 'Invierno' && b.type !== 'dock') {
    ctx.fillStyle = 'rgba(248, 250, 252, 0.82)';
    ctx.fillRect(-26, -21, 52, 3);
  }

  drawStructureWearOverlay(ctx, -26, -15, 52, 30, b.durability, b.maintenanceStatus);

  // Edificio obsoleto sin administrador: atenuado discreto + icono de pausa
  if (!b.isOperational) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.34)';
    ctx.fillRect(-30, -22, 60, 38);
  }

  if (isSelected) {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(-36, -40, 72, 62);
  }

  const short = SPECIAL_BUILDING_LABELS[b.type].short;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(-28, -48, 56, 11);
  ctx.fillStyle = b.isOperational ? '#4ade80' : '#fb7185';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${!b.isOperational ? '⏸ ' : ''}${short} N${b.level}`, 0, -39);

  if (b.durability < 65) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-20, 18, 40, 4);
    ctx.fillStyle = b.durability < 35 ? '#ef4444' : '#f59e0b';
    ctx.fillRect(-20, 18, Math.round((40 * b.durability) / 100), 4);
  }

  if (!b.isOperational) {
    ctx.fillStyle = 'rgba(127, 29, 29, 0.92)';
    ctx.fillRect(-26, 23, 52, 10);
    ctx.fillStyle = '#fecdd3';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('OBSOLETO', 0, 30);
  }

  ctx.restore();
}

function drawPixelHouse(
  ctx: CanvasRenderingContext2D,
  house: House,
  isNight: boolean,
  isSelected: boolean,
  hasResidents: boolean,
  season: SimulationState['season'],
  shadow: { dx: number; dy: number; alpha: number },
  animPhase: number
): void {
  const x = Math.round(house.x);
  const y = Math.round(house.y);

  ctx.save();
  ctx.translate(x, y);

  const wallColors: Record<1 | 2 | 3 | 4, string> = {
    1: '#855e3c',
    2: '#a16a3e',
    3: '#94a3b8',
    4: '#cbd5e1',
  };
  const roofColors: Record<1 | 2 | 3 | 4, string> = {
    1: '#ca8a04',
    2: '#7c2d12',
    3: '#334155',
    4: '#0f766e',
  };

  const w = house.size === 'large' ? 54 : house.size === 'medium' ? 40 : 28;
  const h = house.size === 'large' ? 26 : house.size === 'medium' ? 20 : 16;

  // Sombra direccional solar
  ctx.fillStyle = `rgba(0,0,0,${shadow.alpha + 0.1})`;
  ctx.fillRect(-w / 2 - 2 + shadow.dx, h / 2 + 2 + Math.min(4, shadow.dy), w + 4, 6);

  ctx.fillStyle = wallColors[house.level];
  ctx.fillRect(-w / 2, -h / 2 + 4, w, h);

  ctx.fillStyle = roofColors[house.level];
  ctx.fillRect(-w / 2 - 4, -h / 2 - 2, w + 8, 7);
  ctx.fillRect(-w / 2 + 2, -h / 2 - 8, w - 4, 6);
  if (house.size === 'large') {
    ctx.fillRect(-w / 2 + 9, -h / 2 - 13, w - 18, 5);
  }

  if (season === 'Invierno') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-w / 2 - 2, -h / 2 - 3, w + 4, 2);
    ctx.fillRect(-w / 2 + 4, -h / 2 - 9, w - 8, 2);
  }

  if (house.level >= 2 || house.size !== 'small') {
    ctx.fillStyle = '#475569';
    ctx.fillRect(w / 2 - 8, -h / 2 - 14, 5, 8);
    if (house.size === 'large') {
      ctx.fillRect(-w / 2 + 4, -h / 2 - 14, 5, 8);
    }
    if (hasResidents) {
      drawSmokePuffs(ctx, w / 2 - 6, -h / 2 - 16, animPhase + house.id * 0.27);
    }
  }

  ctx.fillStyle = '#451a03';
  const doorW = house.size === 'large' ? 10 : 6;
  ctx.fillRect(-doorW / 2, h / 2 - 6, doorW, 10);

  ctx.fillStyle = isNight ? (hasResidents ? '#fde047' : '#475569') : '#38bdf8';
  if (house.size === 'large') {
    ctx.fillRect(-w / 2 + 5, -5, 5, 5);
    ctx.fillRect(-w / 2 + 13, -5, 5, 5);
    ctx.fillRect(w / 2 - 18, -5, 5, 5);
    ctx.fillRect(w / 2 - 10, -5, 5, 5);
  } else if (house.size === 'medium') {
    ctx.fillRect(-w / 2 + 5, -3, 5, 5);
    ctx.fillRect(w / 2 - 10, -3, 5, 5);
  } else {
    ctx.fillRect(-w / 2 + 4, -2, 4, 4);
  }

  drawStructureWearOverlay(ctx, -w / 2, -h / 2 + 4, w, h, house.durability, house.maintenanceStatus);

  if (house.durability < 65) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-16, h / 2 + 5, 32, 3);
    ctx.fillStyle = house.durability < 35 ? '#ef4444' : '#f59e0b';
    ctx.fillRect(-16, h / 2 + 5, Math.round((32 * house.durability) / 100), 3);
  }

  if (isSelected) {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2 - 6, -h / 2 - 16, w + 12, h + 28);
  }

  const sizeTag = house.size === 'large' ? 'G' : house.size === 'medium' ? 'M' : 'C';
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fillRect(-13, -h / 2 - 25, 26, 9);
  ctx.fillStyle =
    house.maintenanceStatus && house.maintenanceStatus !== 'ok' ? '#fbbf24' : '#f8fafc';
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`N${house.level}·${sizeTag}`, 0, -h / 2 - 18);

  if (house.maintenanceStatus && house.maintenanceStatus !== 'ok') {
    ctx.fillStyle = house.maintenanceStatus === 'ruined' ? 'rgba(127, 29, 29, 0.9)' : 'rgba(146, 64, 14, 0.9)';
    ctx.fillRect(-16, h / 2 + 9, 32, 8);
    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 6px monospace';
    ctx.fillText(house.maintenanceStatus === 'ruined' ? 'RUINA' : 'DEUDA', 0, h / 2 + 15);
  }

  ctx.restore();
}

function drawPixelAnimal(
  ctx: CanvasRenderingContext2D,
  animal: Animal,
  isSelected: boolean,
  animPhase: number
): void {
  const x = Math.round(animal.x);
  const y = Math.round(animal.y);
  const dir = animal.vx >= 0 ? 1 : -1;
  const step = Math.sin(animal.walkFrame) * 1.5;

  ctx.save();
  ctx.translate(x, y);

  if (animal.type === 'fish') {
    // Ondas en el agua alrededor de cada pez
    const rippleR = 6 + ((animPhase * 4 + animal.id) % 6);
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, rippleR, rippleR * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.scale(dir, 1);

  switch (animal.type) {
    case 'fish': {
      const v = animal.fishVariant ?? 'trout';
      if (v === 'trout') {
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(-6, -2, 10, 4);
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(-8, -3, 3, 6);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-2, -1, 2, 1);
      } else if (v === 'salmon') {
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(-6, -2, 11, 4);
        ctx.fillStyle = '#be123c';
        ctx.fillRect(-9, -3, 3, 6);
      } else if (v === 'goldfish') {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-5, -3, 9, 5);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-9, -4, 4, 7);
      } else {
        ctx.fillStyle = '#4d7c0f';
        ctx.fillRect(-6, -3, 11, 5);
        ctx.fillStyle = '#365314';
        ctx.fillRect(-9, -2, 3, 4);
      }
      break;
    }
    case 'cat': {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(-5, 4, 10, 2);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-4, -1, 8, 5);
      ctx.fillRect(2, -5, 5, 4);
      ctx.fillRect(2, -7, 2, 2);
      ctx.fillRect(5, -7, 2, 2);
      ctx.fillRect(-6, -5, 2, 5);
      break;
    }
    case 'dog': {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(-6, 5, 12, 2);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-6, -2, 11, 6);
      ctx.fillRect(3, -6, 5, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(2, -2, 2, 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-5, 3 + step, 2, 3);
      ctx.fillRect(2, 3 - step, 2, 3);
      break;
    }
    case 'wildcat': {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-6, 5, 12, 2);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-6, -2, 11, 6);
      ctx.fillRect(3, -6, 6, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(7, -5, 2, 2);
      break;
    }
    case 'bear': {
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.fillRect(-10, 7, 20, 4);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-9, -6, 17, 12);
      ctx.fillRect(5, -9, 7, 7);
      ctx.fillStyle = '#290f02';
      ctx.fillRect(-8, 5 + step, 4, 4);
      ctx.fillRect(3, 5 - step, 4, 4);
      break;
    }
    case 'chicken': {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-4, -2, 7, 5);
      ctx.fillRect(1, -5, 4, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(2, -7, 3, 2);
      break;
    }
    case 'cow': {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-8, -5, 15, 9);
      ctx.fillRect(5, -7, 6, 6);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-6, -4, 4, 4);
      ctx.fillRect(0, -2, 4, 4);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-7, 4 + step, 2, 4);
      ctx.fillRect(4, 4 - step, 2, 4);
      break;
    }
    case 'horse': {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-9, 8, 18, 3);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-9, -4, 16, 8);
      ctx.fillRect(5, -10, 5, 8);
      ctx.fillRect(8, -10, 4, 4);
      ctx.fillStyle = '#1e1b18';
      ctx.fillRect(-12, -3, 3, 7);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-8, 4 + step, 2, 5);
      ctx.fillRect(6, 4 - step, 2, 5);
      if (animal.riderId !== null) {
        // Alforjas de caravana cargadas + silla + estela de polvo al trotar
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-6, -5, 9, 5);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-5, -3, 3, 2);
        ctx.fillRect(-1, -3, 3, 2);
        const dust = Math.floor(animPhase * 4) % 3;
        ctx.fillStyle = 'rgba(214, 211, 209, 0.55)';
        ctx.fillRect(-13 - dust * 2, 6, 3, 2);
        ctx.fillRect(-17 - dust, 7, 2, 2);
      }
      break;
    }
    case 'sheep': {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(-6, -4, 11, 7);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, -3, 4, 4);
      break;
    }
  }

  if (animal.tamed) {
    ctx.fillStyle = '#10b981';
    ctx.fillRect(-4, -12, 8, 3);
  }

  if (isSelected) {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-12, -14, 24, 24);
  }

  ctx.restore();
}

/**
 * Diferenciación sutil y legible en pixel-art entre Mujer, Hombre, Niño/a y su Oficio/Herramienta.
 */
function drawPixelAgent(
  ctx: CanvasRenderingContext2D,
  agent: Agent,
  selectedId: number | null,
  animPhase: number
): void {
  const x = Math.round(agent.x);
  const y = Math.round(agent.y);
  const scale = agent.isChild ? 0.68 : 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fillRect(-6, 10, 12, 3);

  const step = Math.sin(agent.walkFrame) * 2;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-4, 4 + step, 3, 6);
  ctx.fillRect(1, 4 - step, 3, 6);
  ctx.fillStyle = '#451a03';
  ctx.fillRect(-4, 8 + step, 3, 2);
  ctx.fillRect(1, 8 - step, 3, 2);

  if (!agent.isChild && agent.sex === 'F') {
    ctx.fillStyle = agent.shirt;
    ctx.fillRect(-4, -4, 8, 6);
    ctx.fillRect(-6, 1, 12, 5);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-2, -4, 4, 2);
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(-4, 0, 8, 1);
  } else if (!agent.isChild && agent.sex === 'M') {
    ctx.fillStyle = agent.shirt;
    ctx.fillRect(-5, -4, 10, 8);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.fillRect(-5, -4, 2, 7);
    ctx.fillRect(3, -4, 2, 7);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-5, 3, 10, 2);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-1, 3, 2, 2);
  } else {
    ctx.fillStyle = agent.shirt;
    ctx.fillRect(-4, -3, 8, 7);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-2, -3, 4, 2);
  }

  // Rasgos de vestimenta por oficio
  if (!agent.isChild) {
    if (agent.job === 'Herrero' || agent.job === 'Artesano') {
      // Delantal de cuero oscuro
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-3, -2, 6, 7);
    } else if (agent.job === 'Curandero' || agent.job === 'Boticario') {
      // Túnica clara + cruz médica o frasco
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-3, -3, 6, 7);
      ctx.fillStyle = agent.job === 'Curandero' ? '#ef4444' : '#14b8a6';
      ctx.fillRect(-1, -1, 2, 4);
      ctx.fillRect(-2, 0, 4, 2);
    } else if (agent.job === 'Comisario' || agent.job === 'Guardián') {
      // Capa oscura y placa dorada
      ctx.fillStyle = agent.job === 'Comisario' ? '#1e3a8a' : '#7f1d1d';
      ctx.fillRect(-6, -4, 2, 8);
      ctx.fillRect(4, -4, 2, 8);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(1, -3, 2, 2);
    } else if (agent.job === 'Constructor') {
      // Chaleco de obra ámbar
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-4, -4, 2, 6);
      ctx.fillRect(2, -4, 2, 6);
    } else if (agent.job === 'Banquero' || agent.job === 'Alcalde') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4, -4, 8, 7);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-1, -2, 2, 3);
    }
  }

  ctx.fillStyle = agent.isSick ? '#cbd5e1' : agent.skin;
  ctx.fillRect(-7, -3, 2, 6);
  ctx.fillRect(5, -3, 2, 6);

  // Herramientas y atributos en mano según oficio o herramientas equipadas
  if (!agent.isChild) {
    if (agent.job === 'Pescador' && agent.taskType === 'fish_river') {
      // Caña de pescar extendida
      ctx.fillStyle = '#78350f';
      ctx.fillRect(6, -12, 2, 10);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(8, -11, 1, 10);
    } else if (agent.job === 'Comisario' || agent.job === 'Guardián') {
      // Lanza / bastón de guardia
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-8, -10, 1, 16);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-8, -13, 2, 3);
    } else if (agent.job === 'Herrero' || agent.job === 'Constructor') {
      // Martillo / mazo
      ctx.fillStyle = '#78350f';
      ctx.fillRect(6, -4, 1, 6);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(5, -6, 4, 2);
    } else if (agent.job === 'Carpintero' || agent.job === 'Leñador') {
      // Hacha
      ctx.fillStyle = '#78350f';
      ctx.fillRect(6, -5, 1, 7);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(7, -5, 3, 3);
    } else if (agent.toolsCount > 0) {
      // Brillo metálico de herramienta equipada
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(6, -2, 2, 5);
    }
  }

  ctx.fillStyle = agent.isSick ? '#d9e3d8' : agent.skin;
  ctx.fillRect(-4, -12, 8, 8);

  if (!agent.isChild && agent.sex === 'M' && agent.id % 3 === 0) {
    ctx.fillStyle = agent.isElder ? '#cbd5e1' : agent.hairColor;
    ctx.fillRect(-3, -6, 6, 2);
  }

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-2, -9, 1, 2);
  ctx.fillRect(2, -9, 1, 2);

  ctx.fillStyle = agent.isElder ? '#e2e8f0' : agent.hairColor;
  if (agent.isChild && agent.id % 2 === 0) {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-4, -14, 8, 3);
    ctx.fillRect(-2, -15, 4, 2);
  } else if (agent.hairStyle === 'short') {
    ctx.fillRect(-4, -14, 8, 3);
  } else if (agent.hairStyle === 'long') {
    ctx.fillRect(-5, -14, 10, 3);
    ctx.fillRect(-5, -11, 2, 7);
    ctx.fillRect(3, -11, 2, 7);
  } else if (agent.hairStyle === 'mohawk') {
    ctx.fillRect(-1, -16, 2, 4);
  } else if (agent.hairStyle === 'curly') {
    ctx.fillRect(-5, -15, 10, 4);
    ctx.fillRect(-5, -12, 2, 2);
    ctx.fillRect(3, -12, 2, 2);
  } else if (agent.hairStyle === 'ponytail') {
    ctx.fillRect(-4, -14, 8, 3);
    ctx.fillRect(4, -12, 3, 5);
  }

  // Sombreros / cascos distintivos por oficio
  if (!agent.isChild) {
    if (agent.job === 'Minero') {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-4, -15, 8, 3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-1, -15, 2, 2);
    } else if (agent.job === 'Panadero') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-4, -15, 8, 2);
      ctx.fillRect(-3, -18, 6, 3);
    } else if (agent.job === 'Pescador') {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-6, -14, 12, 2);
      ctx.fillRect(-3, -16, 6, 2);
    } else if (agent.job === 'Alcalde' || agent.job === 'Banquero') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-5, -14, 10, 2);
      ctx.fillRect(-3, -18, 6, 4);
    } else if (agent.job === 'Erudito') {
      ctx.fillStyle = '#312e81';
      ctx.fillRect(-5, -15, 10, 2);
    }
  }

  if (agent.isRepresentative) {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-3, -19, 6, 2);
    ctx.fillRect(-2, -21, 1, 2);
    ctx.fillRect(1, -21, 1, 2);
  }

  if (agent.pregnancy) {
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(-2, -2, 4, 3);
  }

  if (agent.jailedDays > 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-6, -12, 1, 20);
    ctx.fillRect(5, -12, 1, 20);
  }

  if (selectedId === agent.id) {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-10, -18, 20, 31);
  }

  if (agent.isSick) {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-4, -24, 8, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, -23, 2, 4);
    ctx.fillRect(-2, -22, 4, 2);
  } else if (agent.talkingTimer > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-7, -25, 14, 7);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-4, -22, 2, 2);
    ctx.fillRect(-1, -22, 2, 2);
    ctx.fillRect(2, -22, 2, 2);
  } else {
    const emoColors: Record<Agent['emotion'], string> = {
      excited: '#f59e0b',
      happy: '#10b981',
      content: '#22c55e',
      neutral: '#94a3b8',
      sad: '#38bdf8',
      depressed: '#475569',
      love: '#ec4899',
      scared: '#a855f7',
      sick: '#ef4444',
    };
    ctx.fillStyle = emoColors[agent.emotion];
    ctx.fillRect(-3, -23, 6, 5);
  }

  if (agent.taskType === 'sleep') {
    const zFloat = (animPhase * 1.4 + agent.id * 0.4) % 1;
    ctx.fillStyle = `rgba(56, 189, 248, ${1 - zFloat * 0.5})`;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Z', 8, Math.round(-15 - zFloat * 7));
    ctx.font = 'bold 6px monospace';
    ctx.fillText('z', 13, Math.round(-20 - zFloat * 5));
  }

  ctx.restore();
}

function drawFamilyHighlightOverlay(ctx: CanvasRenderingContext2D, state: SimulationState): void {
  if (state.highlightFamilyAgentId === null) return;
  const target = state.agents.find((a) => a.id === state.highlightFamilyAgentId);
  if (!target) return;

  const partner = target.partnerId !== null ? state.agents.find((a) => a.id === target.partnerId) : null;
  const house = target.houseId !== null ? state.houses.find((h) => h.id === target.houseId) : null;

  ctx.save();
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);

  if (partner) {
    ctx.strokeStyle = '#ec4899';
    ctx.beginPath();
    ctx.moveTo(target.x, target.y);
    ctx.lineTo(partner.x, partner.y);
    ctx.stroke();
  }
  if (house) {
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(target.x, target.y);
    ctx.lineTo(house.x, house.y);
    ctx.stroke();
  }
  ctx.restore();
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  state: SimulationState,
  camera: CameraView = { zoom: 1, panX: 0, panY: 0 }
): void {
  ctx.imageSmoothingEnabled = false;
  const biome = BIOMES[state.biome];
  const isNight = isNightMinute(state.minute);
  const animPhase = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.002;
  const shadow = getSunShadowOffset(state.minute, isNight);

  const occupiedHouseIds = new Set<number>();
  for (const ag of state.agents) {
    if (ag.houseId !== null) occupiedHouseIds.add(ag.houseId);
  }

  let bg = biome.bg;
  let patch = biome.patch;
  if (state.season === 'Otoño' && state.biome !== 'tundra') {
    bg = '#7c5d2c';
    patch = '#664a20';
  } else if (state.season === 'Invierno') {
    bg = '#627c8c';
    patch = '#85a1b2';
  }

  ctx.fillStyle = '#050914';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();
  ctx.translate(CANVAS_WIDTH / 2 + camera.panX, CANVAS_HEIGHT / 2 + camera.panY);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);

  ctx.beginPath();
  ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.clip();

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = patch;
  for (let gx = 0; gx < CANVAS_WIDTH; gx += 64) {
    for (let gy = 16; gy < CANVAS_HEIGHT; gy += 64) {
      if ((gx + gy) % 128 === 0) ctx.fillRect(gx + 10, gy + 10, 18, 8);
      else ctx.fillRect(gx + 34, gy + 38, 10, 6);
    }
  }

  drawLeftForestAndRightMountains(ctx, state.season, animPhase, shadow);
  drawCenterRiver(
    ctx,
    state.minute,
    state.season,
    state.bridge,
    state.selectedEntity?.kind === 'bridge',
    animPhase
  );

  if (state.roads.length > 0) {
    drawRoads(ctx, state.roads);
  }

  if (state.plaza) {
    drawCentralPlaza(
      ctx,
      state.plaza,
      state.minute,
      isNight,
      state.selectedEntity?.kind === 'plaza'
    );
  }

  for (const plot of state.farms) {
    const isSel = state.selectedEntity?.kind === 'farm' && state.selectedEntity.id === plot.id;
    drawFarmPlot(ctx, plot, isSel);
  }

  const sortedHouses = [...state.houses].sort((a, b) => a.y - b.y);
  for (const house of sortedHouses) {
    const isSel = state.selectedEntity?.kind === 'house' && state.selectedEntity.id === house.id;
    drawPixelHouse(
      ctx,
      house,
      isNight,
      isSel,
      occupiedHouseIds.has(house.id),
      state.season,
      shadow,
      animPhase
    );
  }
  const sortedSpecials = [...state.specialBuildings].sort((a, b) => a.y - b.y);
  for (const b of sortedSpecials) {
    const isSel = state.selectedEntity?.kind === 'special' && state.selectedEntity.id === b.id;
    drawSpecialBuilding(ctx, b, isNight, isSel, state.season, shadow, animPhase);
  }

  const glintTick = Math.floor(animPhase * 2.5);
  for (const r of state.resources) {
    const rx = Math.round(r.x);
    const ry = Math.round(r.y);
    if (r.depleted) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.fillRect(rx - 4, ry - 2, 8, 5);
      continue;
    }
    if (r.type === 'food') {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(rx - 5, ry + 5, 10, 2);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(rx - 1, ry - 7, 2, 3);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(rx + 1, ry - 7, 4, 2);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(rx - 5, ry - 4, 10, 9);
      ctx.fillRect(rx - 4, ry - 5, 8, 10);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(rx - 3, ry - 3, 2, 3);
    } else if (
      r.type === 'wood' ||
      r.type === 'pine_wood' ||
      r.type === 'maple_wood' ||
      r.type === 'oak_wood'
    ) {
      const bark =
        r.type === 'pine_wood'
          ? '#854d0e'
          : r.type === 'maple_wood'
            ? '#9a3412'
            : r.type === 'oak_wood'
              ? '#3f230e'
              : '#5c3a21';
      const core =
        r.type === 'pine_wood'
          ? '#fef08a'
          : r.type === 'maple_wood'
            ? '#fdba74'
            : r.type === 'oak_wood'
              ? '#d6b285'
              : '#fde68a';
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(rx - 7, ry + 4, 14, 2);
      ctx.fillStyle = bark;
      ctx.fillRect(rx - 7, ry - 3, 12, 7);
      ctx.fillStyle = core;
      ctx.fillRect(rx + 4, ry - 3, 4, 7);
    } else if (r.type === 'stone') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(rx - 6, ry + 4, 13, 3);
      ctx.fillStyle = '#475569';
      ctx.fillRect(rx - 6, ry - 2, 12, 6);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(rx - 5, ry - 5, 9, 6);
    } else if (r.type === 'copper') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(rx - 7, ry + 4, 14, 2);
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(rx - 7, ry - 1, 14, 5);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(rx - 5, ry - 4, 10, 5);
      ctx.fillStyle = '#fdba74';
      ctx.fillRect(rx - 4, ry - 3, 7, 2);
    } else if (r.type === 'iron') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(rx - 7, ry + 4, 14, 2);
      ctx.fillStyle = '#475569';
      ctx.fillRect(rx - 7, ry - 1, 14, 5);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(rx - 5, ry - 4, 10, 5);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(rx - 4, ry - 3, 7, 2);
    } else if (r.type === 'silver') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(rx - 7, ry + 4, 14, 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(rx - 7, ry - 1, 14, 5);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(rx - 5, ry - 4, 10, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx - 4, ry - 3, 8, 2);
      if ((glintTick + r.id) % 5 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rx + 2, ry - 7, 2, 2);
      }
    } else if (r.type === 'gold') {
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.fillRect(rx - 7, ry + 4, 14, 2);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(rx - 7, ry - 1, 14, 5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(rx - 5, ry - 4, 10, 5);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(rx - 4, ry - 3, 7, 2);
      if ((glintTick + r.id) % 4 === 0) {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(rx - 2, ry - 7, 3, 1);
        ctx.fillRect(rx - 1, ry - 8, 1, 3);
      }
    } else if (r.type === 'coins') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(rx - 4, ry + 5, 8, 2);
      ctx.fillStyle = '#a16207';
      ctx.fillRect(rx - 5, ry - 5, 10, 10);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(rx - 4, ry - 4, 8, 8);
    }
  }

  const sortedAnimals = [...state.animals].sort((a, b) => a.y - b.y);
  for (const animal of sortedAnimals) {
    const isSel = state.selectedEntity?.kind === 'animal' && state.selectedEntity.id === animal.id;
    drawPixelAnimal(ctx, animal, isSel, animPhase);
  }

  const sortedAgents = [...state.agents].sort((a, b) => a.y - b.y);
  const selAgentId =
    state.selectedEntity?.kind === 'agent' ? state.selectedEntity.id : state.selectedAgentId;
  for (const agent of sortedAgents) {
    if (agent.activeConstruction) {
      const ac = agent.activeConstruction;
      const pct = clamp(ac.elapsed / Math.max(1, ac.totalDuration), 0, 1);
      // Cimientos, pila de materiales y andamios paso a paso
      ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
      ctx.fillRect(ac.x - 20, ac.y - 14, 40, 28);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ac.x - 20, ac.y - 14, 40, 28);

      // Postes y travesaños de andamio creciendo con el progreso
      ctx.fillStyle = '#92400e';
      ctx.fillRect(ac.x - 19, ac.y - 16, 3, 28);
      ctx.fillRect(ac.x + 16, ac.y - 16, 3, 28);
      if (pct >= 0.25) ctx.fillRect(ac.x - 19, ac.y - 2, 38, 2);
      if (pct >= 0.6) ctx.fillRect(ac.x - 19, ac.y - 12, 38, 2);

      // Pilas de madera y piedra en la esquina
      ctx.fillStyle = '#78350f';
      ctx.fillRect(ac.x - 24, ac.y + 8, 7, 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(ac.x + 17, ac.y + 9, 6, 4);

      // Polvo/viruta animada cuando el constructor está trabajando encima
      if (Math.hypot(agent.x - ac.x, agent.y - ac.y) <= 46 && Math.floor(animPhase * 4) % 2 === 0) {
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(ac.x - 4 + ((glintTick * 5) % 9), ac.y - 4, 2, 2);
        ctx.fillRect(ac.x + 4 - ((glintTick * 3) % 8), ac.y + 2, 2, 2);
      }

      // Barra de avance en el mapa
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ac.x - 18, ac.y - 23, 36, 6);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(ac.x - 17, ac.y - 22, Math.round(34 * pct), 4);
    }

    // Salpicaduras en el río cuando un aldeano está pescando
    if (agent.taskType === 'fish_river' && Math.abs(agent.y - RIVER_BOTTOM_Y) < 28) {
      const splashR = 4 + ((animPhase * 5 + agent.id) % 5);
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(agent.x + 6, RIVER_BOTTOM_Y - 3, splashR, splashR * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawPixelAgent(ctx, agent, selAgentId, animPhase);
  }

  // Incendios animados pixel-art
  const flicker = Math.floor(state.minute * 0.8) % 2;
  for (const fire of state.fires) {
    const fx = Math.round(fire.x);
    const fy = Math.round(fire.y);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(fx - 8, fy - 4, 16, 10);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(fx - 6, fy - 10 - flicker * 2, 12, 12);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(fx - 3, fy - 12 + flicker * 2, 6, 9);
  }

  drawFamilyHighlightOverlay(ctx, state);

  // Micro-indicadores flotantes sobre acciones recientes (+1 🍞, +1 🥇, 🔧 Reparado, etc.)
  if (Array.isArray(state.floatingEffects) && state.floatingEffects.length > 0) {
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    for (const fx of state.floatingEffects) {
      const alpha = clamp(fx.ttl / Math.max(0.1, fx.maxTtl), 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      const w = Math.max(28, fx.text.length * 6 + 6);
      ctx.fillRect(Math.round(fx.x - w / 2), Math.round(fx.y - 9), w, 12);
      ctx.fillStyle = fx.color;
      ctx.fillText(fx.text, Math.round(fx.x), Math.round(fx.y));
      ctx.restore();
    }
  }

  // Clima: lluvia o copos suaves de nieve en Invierno
  if (state.weather === 'rain' || state.weather === 'storm' || state.weather === 'thunderstorm') {
    ctx.fillStyle = state.weather === 'thunderstorm' ? '#dbeafe' : state.weather === 'storm' ? '#bfdbfe' : '#93c5fd';
    for (const d of state.rainDrops) {
      ctx.fillRect(Math.round(d.x), Math.round(d.y), 2, 7);
      d.y += d.s * Math.max(1, state.speed);
      if (d.y > CANVAS_HEIGHT) d.y = 0;
    }
  } else if (state.season === 'Invierno') {
    ctx.fillStyle = 'rgba(248, 250, 252, 0.72)';
    for (let i = 0; i < 45; i++) {
      const sx = ((i * 71 + Math.floor(animPhase * 12)) % CANVAS_WIDTH);
      const sy = ((i * 53 + Math.floor(animPhase * 20)) % CANVAS_HEIGHT);
      ctx.fillRect(sx, sy, 2, 2);
    }
  }

  // Iluminación nocturna cálida con halos radiales o tinte de amanecer/atardecer
  if (isNight) {
    ctx.fillStyle = 'rgba(8, 15, 36, 0.36)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (state.plaza) {
      const plazaCorners = [
        [state.plaza.x - 52, state.plaza.y - 38],
        [state.plaza.x + 48, state.plaza.y - 38],
        [state.plaza.x - 52, state.plaza.y + 34],
        [state.plaza.x + 48, state.plaza.y + 34],
      ];
      for (const [lx, ly] of plazaCorners) {
        drawWarmHalo(ctx, lx + 2, ly - 1, 34, 'rgba(253, 224, 71, 0.34)');
      }
    }
    for (const r of state.roads) {
      if (r.lit && (r.hasLamp || (r.x + r.y) % 48 === 0)) {
        drawWarmHalo(ctx, r.x + 8, r.y - 10, 30, 'rgba(253, 224, 71, 0.30)');
      }
    }
    for (const h of state.houses) {
      if (occupiedHouseIds.has(h.id)) {
        drawWarmHalo(ctx, h.x, h.y + 2, 26, 'rgba(251, 191, 36, 0.24)');
      }
    }
    for (const b of state.specialBuildings) {
      if (!b.isOperational) continue;
      if (b.type === 'forge' || b.type === 'bakery' || b.type === 'apothecary') {
        drawWarmHalo(
          ctx,
          b.x,
          b.y + 2,
          36,
          b.type === 'forge' ? 'rgba(249, 115, 22, 0.34)' : 'rgba(251, 191, 36, 0.28)'
        );
      }
    }
    for (const fire of state.fires) {
      drawWarmHalo(ctx, fire.x, fire.y - 4, 42, 'rgba(249, 115, 22, 0.42)');
    }
    for (const ag of state.agents) {
      if (ag.job === 'Minero') {
        drawWarmHalo(ctx, ag.x, ag.y - 12, 20, 'rgba(254, 240, 138, 0.24)');
      }
    }
    ctx.restore();
  } else if (state.minute >= 350 && state.minute <= 460) {
    ctx.fillStyle = 'rgba(251, 146, 60, 0.08)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else if (state.minute >= 1030 && state.minute <= 1150) {
    ctx.fillStyle = 'rgba(249, 115, 22, 0.11)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else if (state.weather === 'drought') {
    ctx.fillStyle = 'rgba(217, 119, 6, 0.12)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else if (state.weather === 'storm' || state.weather === 'thunderstorm') {
    ctx.fillStyle = state.weather === 'thunderstorm' ? 'rgba(15, 23, 42, 0.34)' : 'rgba(15, 23, 42, 0.24)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  if (state.lightningFlashTimer > 0) {
    ctx.fillStyle = 'rgba(254, 249, 195, 0.35)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  ctx.restore();
}

export async function runOllamaRepresentativeGovernance(state: SimulationState): Promise<void> {
  if (!state.ollama.enabled || !state.ollama.url.trim() || ollamaDecisionInFlight) return;
  const rep = ensureQwenControlledRepresentative(state);
  if (!rep) return;

  ollamaDecisionInFlight = true;
  try {
    const villageSummary = buildQwenVillageTelemetry(state);
    const prompt = `Sos ${rep.name}, el aldeano Representante de "Aldea IA", controlado permanentemente por Qwen 2.5:3b.
REGLA DE SEGURIDAD ESTRICTA (SANDBOX):
- SOLO podés emitir acciones válidas sobre el mapa/aldea usando el esquema JSON. NUNCA intentes tocar archivos ni sistema.
Estado actual de la aldea: ${JSON.stringify(villageSummary)}.
Decidí el próximo objetivo de progreso del Representante para que la aldea crezca, construya casas, junte recursos, eduque y no se extinga.
Respondé EXCLUSIVAMENTE un JSON válido:
{
  "goal": "frase corta de objetivo actual (máx 70 caracteres)",
  "actions": []
}`;
    const res = await fetch(state.ollama.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: state.ollama.model,
        prompt,
        stream: false,
        format: 'json',
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const raw = typeof data?.response === 'string' ? data.response : '';
    const parsed = JSON.parse(raw) as { goal?: unknown; actions?: unknown };
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.goal === 'string' && parsed.goal.trim()) {
        const cleanGoal = parsed.goal.trim().slice(0, 90);
        state.representativeGoal = cleanGoal;
        rep.qwenPlan = `Representante Qwen 2.5: ${cleanGoal}`;
        rep.thought = `Como Representante dirigido por Qwen 2.5:3b, impulso: ${cleanGoal}.`;
        rep.lastQwenDecision = `Qwen 2.5:3b (Representante): ${cleanGoal}`;
      }
      const safeActions = sanitizeQwenActions(parsed.actions).filter(
        (a) => a.type !== 'TRIGGER_FIRE' && a.type !== 'TRIGGER_LIGHTNING_STORM' && a.type !== 'KILL_CROPS'
      );
      if (safeActions.length > 0) {
        applyQwenActions(state, safeActions, spawnSettlers);
      }
    }
  } catch {
    // Mantiene el turno autónomo local del Representante
  } finally {
    ollamaDecisionInFlight = false;
  }
}

export async function askQwenAssistant(
  state: SimulationState,
  userPrompt: string
): Promise<{ reply: string; appliedRules: string[]; source: 'ollama' | 'local' }> {
  const rep = ensureQwenControlledRepresentative(state);
  const agentNames = state.agents.map((a) => a.name);

  const localResult = interpretQwenDirective(userPrompt, agentNames, state);
  const queryCheck = queryVillageData(state, userPrompt);

  if (state.ollama.enabled && state.ollama.url.trim()) {
    try {
      const villageSummary = buildQwenVillageTelemetry(state);

      const systemPrompt = `Eres Qwen 2.5:3b controlando en todo momento al aldeano Representante "${rep?.name ?? 'Representante'}" (${rep?.job ?? 'Aldeano'}, objetivo: "${state.representativeGoal ?? 'Progreso continuo'}") dentro de "Aldea IA".
El jugador está hablando directamente con vos a través del Representante.
REGLA DE SEGURIDAD ESTRICTA (SANDBOX):
- SOLO puedes consultar datos de la aldea o ejecutar acciones permitidas SOBRE EL MAPA DE LA ALDEA usando el esquema JSON exacto de abajo.
- NUNCA modifiques archivos, código fuente, configuración del sistema, inicio de la app, ni agregues código o comandos de sistema.

Datos completos en tiempo real de la aldea: ${JSON.stringify(villageSummary)}.
Orden o pregunta del jugador al Representante: "${userPrompt}".
Responde EXCLUSIVAMENTE un JSON válido con:
{
  "reply": "Texto corto en español hablando como el Representante (Qwen 2.5:3b) confirmando los datos reales o lo ejecutado en el mapa",
  "actions": [
    { "type": "ALLOW_MORE_VILLAGERS", "spawnCount": 0, "encouragePregnancies": true },
    { "type": "ASSIGN_ACTIVE_JOBS", "preferredJob": "Panadero|Minero|Constructor|Carpintero|...", "fraction": 0.5, "count": 5, "fromJob": "...", "forceChange": true },
    { "type": "DIRECT_VILLAGER", "agentName": "Nombre", "job": "...", "action": "heal|build|trade|research|switch_partner|fish|store_home" },
    { "type": "GRANT_VILLAGER_ITEMS", "resource": "gold|silver|coins|food|wood|stone|iron|copper|medicine|tools", "amount": 5, "targetName": "opcional" },
    { "type": "ADJUST_STAT", "stat": "knowledge|health|energy|happiness", "delta": 20, "targetName": "opcional" },
    { "type": "SET_WEATHER_BIOME", "weather": "sunny|rain|drought|storm|thunderstorm", "biome": "grassland|arid|forest|tundra", "season": "Primavera|Verano|Otoño|Invierno" },
    { "type": "RELEASE_PRISONERS" },
    { "type": "GENERATE_ECONOMY" },
    { "type": "ISSUE_BANK_LOANS" },
    { "type": "FORM_MENTORSHIPS" },
    { "type": "REPAIR_BUILDINGS" },
    { "type": "RUN_CARAVANS" },
    { "type": "BUILD_HOUSES", "count": 2, "zone": "south|north" },
    { "type": "BUILD_PLAZA" },
    { "type": "BUILD_BRIDGE" },
    { "type": "BUILD_SPECIAL", "buildingType": "dock|bank|market|bakery|carpentry|forge|apothecary|infirmary|school|general_depot|town_hall|police_station|prison" },
    { "type": "TOGGLE_LAW", "lawId": "ban_trade_wood|ban_fishing|ban_trade_bread|ban_mine_gold|winter_rationing|night_watch|mining_priority", "active": true },
    { "type": "BOOST_EVOLUTION", "knowledgeGain": 45 },
    { "type": "HEAL_VILLAGERS" },
    { "type": "REPORT_DATA", "answer": "si solo es pregunta/consulta sin modificar nada" }
  ]
}
Si es una pregunta de datos (ej. posibles trabajadores), usa los números exactos de posiblesTrabajadoresPorEdificio y retorna { "type": "REPORT_DATA", "answer": "..." }. Si pide que tengan más hijos o natalidad, usa { "type": "ALLOW_MORE_VILLAGERS", "spawnCount": 0, "encouragePregnancies": true }.`;

      const res = await fetch(state.ollama.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: state.ollama.model,
          prompt: systemPrompt,
          stream: false,
          format: 'json',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = typeof data?.response === 'string' ? data.response : '';
        const parsed = JSON.parse(raw) as { reply?: unknown; actions?: unknown };
        if (parsed && typeof parsed === 'object') {
          if (queryCheck.matched) {
            return {
              reply: queryCheck.reply,
              appliedRules: queryCheck.details,
              source: 'ollama',
            };
          }

          // Sandbox estricto: sanitiza todas las acciones devueltas por qwen2.5:3b antes de tocar el mapa
          const sanitizedParsed = sanitizeQwenActions(parsed.actions);
          const sanitizedLocal = sanitizeQwenActions(localResult.actions);

          const localHasMassJob = sanitizedLocal.some(
            (a) => a.type === 'ASSIGN_ACTIVE_JOBS' && (a.fraction !== undefined || a.count !== undefined || a.forceChange)
          );
          const ollamaHasCompleteJob = sanitizedParsed.some(
            (a) => a.type === 'ASSIGN_ACTIVE_JOBS' && (a.fraction !== undefined || a.count !== undefined || a.forceChange)
          );
          const meaningfulParsed = sanitizedParsed.filter((a) => a.type !== 'REPORT_DATA');
          const parsedTypes = new Set(meaningfulParsed.map((a) => a.type));
          const missingLocalActions = sanitizedLocal.filter(
            (a) => a.type !== 'REPORT_DATA' && !parsedTypes.has(a.type)
          );

          let finalActions: QwenAction[];
          if (meaningfulParsed.length === 0) {
            finalActions = sanitizedLocal;
          } else if (localHasMassJob && !ollamaHasCompleteJob) {
            finalActions = [
              ...meaningfulParsed.filter((a) => a.type !== 'ASSIGN_ACTIVE_JOBS'),
              ...sanitizedLocal.filter((a) => a.type === 'ASSIGN_ACTIVE_JOBS' || a.type === 'SET_POLICIES'),
              ...missingLocalActions.filter((a) => a.type !== 'ASSIGN_ACTIVE_JOBS' && a.type !== 'SET_POLICIES'),
            ];
          } else {
            finalActions = [...meaningfulParsed, ...missingLocalActions];
          }

          const appliedRules = applyQwenActions(state, finalActions, spawnSettlers);
          const safeReply = sanitizeQwenReply(parsed.reply, localResult.reply);
          if (rep) {
            rep.lastQwenDecision = `Representante (Qwen 2.5:3b) respondió: ${safeReply.slice(0, 120)}`;
          }
          return {
            reply: appliedRules.length > 0 ? safeReply : localResult.reply,
            appliedRules,
            source: 'ollama',
          };
        }
      }
    } catch {
      // Fallback seguro al motor local si Ollama devuelve JSON inválido o falla
    }
  }

  if (queryCheck.matched) {
    return {
      reply: queryCheck.reply,
      appliedRules: queryCheck.details,
      source: 'local',
    };
  }

  try {
    const appliedRules = applyQwenActions(state, localResult.actions, spawnSettlers);
    const repPrefix = rep ? `[Representante ${rep.name} · Qwen 2.5] ` : '';
    if (rep) {
      rep.lastQwenDecision = `Representante (Qwen 2.5) ejecutó orden del jugador.`;
    }
    return {
      reply: `${repPrefix}${localResult.reply}`,
      appliedRules,
      source: 'local',
    };
  } catch {
    return {
      reply: 'Orden ignorada por seguridad para proteger la estabilidad de la aldea.',
      appliedRules: [],
      source: 'local',
    };
  }
}

export async function queryOllamaThoughtForAgent(
  state: SimulationState,
  agent: Agent,
  eventContext: string
): Promise<void> {
  if (!state.ollama.enabled || !state.ollama.url.trim() || ollamaDecisionInFlight) return;
  ollamaDecisionInFlight = true;
  try {
    const prompt = `Sos ${agent.name} (${agent.ageYears} años, oficio ${agent.job}, saber ${Math.round(agent.education)}%, salud ${Math.round(agent.health)}/100) en una aldea de supervivencia. Situación: ${eventContext}. Respondé en 1 frase corta en español en primera persona (máximo 14 palabras).`;
    const res = await fetch(state.ollama.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: state.ollama.model,
        prompt,
        stream: false,
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data && typeof data.response === 'string' && data.response.trim()) {
      agent.thought = data.response.trim();
      agent.lastQwenDecision = `Ollama Qwen 2.5: ${agent.thought}`;
    }
  } catch {
    // Mantiene la decisión local
  } finally {
    ollamaDecisionInFlight = false;
  }
}
