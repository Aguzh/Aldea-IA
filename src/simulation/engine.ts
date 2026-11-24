import {
  addLog,
  addPreciousMetalToReserve,
  addRoadTile,
  advanceDayAging,
  advanceJobMastery,
  AGE_PARTNER_MIN_YEARS,
  applyQwenActions,
  assignBalancedJob,
  assignMentorships,
  BRIDGE_HALF_WIDTH,
  canAgentRest,
  canAgentsReproduce,
  canCarpenterUseWood,
  canGatherOrTradeMineral,
  canGatherOrTradeWood,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  clamp,
  computeAgentHappiness,
  computeAgentImportance,
  computeEra,
  computeSeason,
  computeUnlockedSkills,
  consumeConstructionResources,
  contractDiseaseForAgent,
  craftToolsForAgent,
  createAnimal,
  createBridge,
  createDefaultLaws,
  createFarmPlot,
  createHouseNearCenter,
  createPlaza,
  createSpecialBuilding,
  createVillagePetition,
  DAY_GAME_MINUTES,
  DAY_START_MINUTE,
  decideVillagerMajorAction,
  defendAgainstWildAnimal,
  depositMaterialsToBuilding,
  depositResourcesToHouse,
  deriveAgentEmotion,
  electRepresentative,
  enforceLawViolation,
  ERA_METADATA,
  extinguishFire,
  FISH_VARIANTS,
  FOREST_MAX_X,
  generateEmergentDialogue,
  getCompetingBuildingCount,
  getConciseTaskLabel,
  getEmotionWorkMultiplier,
  grantBankLoan,
  hasAvailableOperatorForBuilding,
  interpretQwenDirective,
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
  pickQwenBabyName,
  PREGNANCY_DAYS,
  recalculateEconomyReserve,
  recordDailySnapshot,
  repairDamagedStructures,
  RIVER_BOTTOM_Y,
  RIVER_TOP_Y,
  ROAD_GRID_SIZE,
  SAFE_LAND_MIN_Y,
  shouldBuildHouse,
  SOUTH_CENTER_Y,
  spawnFire,
  SPECIAL_BUILDING_LABELS,
  SPEED_TIMINGS,
  switchPartnerForAgent,
  syncAgentSkills,
  syncSpecialBuildingStaff,
  tameWildAnimal,
  transferInheritance,
  triggerLightningStorm,
  upgradeLowestHouse,
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
  QwenAction,
  ResourceNode,
  RoadTile,
  SimulationState,
  SpecialBuilding,
  SpecialBuildingType,
  TaskType,
} from '../types/simulation';

export interface CameraView {
  zoom: number;
  panX: number;
  panY: number;
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
  };
}

export function spawnSettlers(state: SimulationState, count: number): number {
  let spawned = 0;
  for (let i = 0; i < count; i++) {
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
  const maxAmt = 6;
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
    day: 1,
    minute: 420,
    speed: 1,
    resourcesPaused: false,
    season: computeSeason(1),
    layoutMode: 'auto',
    biome: 'grassland',
    weather: 'sunny',
    tool: 'inspect',
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
    petitionTimerSec: PETITION_INTERVAL_SECONDS,
    pendingPetition: null,
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
      buildPriority: false,
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
  for (let i = 0; i < 24; i++) {
    const t = forestTypes[i % forestTypes.length];
    const inNorth = i % 3 === 0;
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
  for (let i = 0; i < 24; i++) {
    const t = mountainTypes[i % mountainTypes.length];
    const inNorth = i % 3 === 0;
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

  const valleyTypes: ResourceNode['type'][] = ['food', 'wood', 'stone', 'food', 'coins'];
  for (let i = 0; i < 16; i++) {
    const inNorth = i % 3 === 0;
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
  const hasBridge = state.bridge !== null;
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

function hasEnoughVillageResources(
  state: SimulationState,
  woodNeed: number,
  stoneNeed = 0
): boolean {
  const totalWood =
    state.agents.reduce(
      (acc, a) => acc + a.inv.wood + a.inv.pineWood + a.inv.mapleWood + a.inv.oakWood,
      0
    ) +
    state.specialBuildings.reduce(
      (acc, b) => acc + b.storage.wood + b.storage.pineWood + b.storage.mapleWood + b.storage.oakWood,
      0
    );
  const totalStone =
    state.agents.reduce((acc, a) => acc + a.inv.stone, 0) +
    state.specialBuildings.reduce((acc, b) => acc + b.storage.stone, 0);
  return totalWood >= woodNeed && totalStone >= stoneNeed;
}

function tryOrganicRoadConstruction(state: SimulationState, agent: Agent): boolean {
  if (state.knowledge < 14 || agent.isChild) return false;
  if (state.roads.length >= 140) return false;
  if (isNearRoad(state.roads, agent.x, agent.y)) return false;

  const nearHub =
    (state.plaza && Math.hypot(agent.x - state.plaza.x, agent.y - state.plaza.y) < 160) ||
    state.houses.some((h) => Math.hypot(agent.x - h.x, agent.y - h.y) < 95) ||
    state.specialBuildings.some((b) => Math.hypot(agent.x - b.x, agent.y - b.y) < 95);
  if (!nearHub) return false;

  const canPay = agent.inv.stone > 0 || agent.inv.wood > 0;
  if (!canPay) return false;

  const tile = addRoadTile(state, agent.x, agent.y);
  if (!tile) return false;
  if (agent.inv.stone > 0) agent.inv.stone -= 1;
  else if (agent.inv.wood > 0) agent.inv.wood -= 1;
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

  // 4. Guardar alimentos/monedas en su vivienda y materiales en Depósito General
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
  if ((house || depot) && (totalCarry >= 7 || agent.coins >= 28 || agent.milkCount >= 2)) {
    agent.qwenPlan = house ? `Resguardar alimento/monedas en ${house.name}` : 'Depositar en Depósito General';
    setAgentTask(agent, 'store_home', 32, house?.id ?? depot?.id ?? null);
    return;
  }

  // 5. Reparación de edificios con desgaste
  const needsRepair =
    state.houses.some((h) => h.durability < 72) ||
    state.specialBuildings.some((b) => b.durability < 72) ||
    (state.bridge !== null && state.bridge.durability < 72);
  if (
    needsRepair &&
    !agent.isChild &&
    (agent.job === 'Carpintero' || agent.job === 'Constructor') &&
    hasEnoughVillageResources(state, 1, 0)
  ) {
    setAgentTask(agent, 'repair_building', 34);
    return;
  }

  // 6. Fabricar herramientas (36%+ Saber)
  const hasToolMat =
    agent.inv.iron > 0 ||
    agent.inv.copper > 0 ||
    agent.inv.wood >= 2 ||
    (canCarpenterUseWood(agent, 'pine') && agent.inv.pineWood >= 2);
  if (!agent.isChild && agent.education >= 36 && agent.toolsCount < 2 && hasToolMat && Math.random() < 0.32) {
    setAgentTask(agent, 'craft_tools', 28);
    return;
  }

  // 7. Administrar el edificio propio/asignado
  if (agent.assignedBuildingId !== null && Math.random() < 0.4) {
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

  // 9. Hambre media -> pescar (respetando dueño exclusivo de muelle, veda y stock), cultivar o recolectar
  if (agent.hunger >= 48) {
    const canUseAnyDock =
      state.specialBuildings.some((b) => b.type === 'dock' && b.isOperational && (b.ownerId === agent.id || b.ownerId === null));
    if (
      canUseAnyDock &&
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

  // 10. Construcción autónoma inteligente (sin casas innecesarias ni edificios sin operario)
  const canConstruct = agent.job === 'Constructor' || state.policies.buildPriority || agent.houseId === null;
  if (canConstruct && !agent.isChild) {
    const hasOperationalCarpentry = isBuildingOperational(state, 'carpentry');
    const houseWoodNeed = hasOperationalCarpentry ? 3 : 4;
    if (shouldBuildHouse(state) && hasEnoughVillageResources(state, houseWoodNeed, 0)) {
      decideVillagerMajorAction(state, agent, 'construction', { chosenBuilding: 'house' });
      setAgentTask(agent, 'build_house', 42);
      return;
    }
    if (state.plaza === null && state.houses.length >= 2 && hasEnoughVillageResources(state, 6, 6)) {
      decideVillagerMajorAction(state, agent, 'construction', { chosenBuilding: 'plaza' });
      setAgentTask(agent, 'build_plaza', 46);
      return;
    }
    if (state.bridge === null && hasEnoughVillageResources(state, 6, 4) && (state.houses.length >= 2 || state.knowledge >= 18)) {
      decideVillagerMajorAction(state, agent, 'construction', { chosenBuilding: 'bridge' });
      setAgentTask(agent, 'build_bridge', 46);
      return;
    }
    if (state.farms.length < 2 && hasEnoughVillageResources(state, 3, 0) && Math.random() < 0.45) {
      decideVillagerMajorAction(state, agent, 'construction', { chosenBuilding: 'farm' });
      setAgentTask(agent, 'plant_farm', 38);
      return;
    }
    if (state.knowledge >= 22 && hasEnoughVillageResources(state, 5, 3)) {
      const order: SpecialBuildingType[] = [
        'dock',
        'general_depot',
        'market',
        'bank',
        'school',
        'infirmary',
        'bakery',
        'carpentry',
        'forge',
        'apothecary',
        'town_hall',
        'police_station',
        'prison',
      ];
      const nextSpecial = order.find(
        (t) =>
          !state.specialBuildings.some((b) => b.type === t) &&
          hasAvailableOperatorForBuilding(state, t)
      );
      if (nextSpecial) {
        decideVillagerMajorAction(state, agent, 'construction', { chosenBuilding: nextSpecial });
        setAgentTask(agent, 'build_special', 44);
        return;
      }
    }
    if (
      hasEnoughVillageResources(state, 3, 2) &&
      state.houses.some((h) => h.level < ERA_METADATA[state.era].maxHouseLevel)
    ) {
      decideVillagerMajorAction(state, agent, 'construction', { chosenBuilding: 'upgrade' });
      setAgentTask(agent, 'upgrade_house', 42);
      return;
    }
  }

  if (agent.job === 'Constructor') {
    const neededType: ResourceNode['type'] = !hasEnoughVillageResources(state, 6, 0) ? 'wood' : 'stone';
    const res = findClosestResource(state, agent, neededType) ?? findClosestResource(state, agent, null);
    if (res) {
      setAgentTask(agent, getTaskForResource(res.type), 34, res.id);
      return;
    }
  }

  if (agent.job === 'Erudito' || agent.job === 'Maestro' || (state.policies.evolutionFocus && Math.random() < 0.16)) {
    setAgentTask(agent, 'research', 36);
    return;
  }

  let preferredType: ResourceNode['type'] | undefined;
  if (agent.job === 'Recolector') preferredType = Math.random() < 0.5 ? 'food' : 'wood';
  else if (agent.job === 'Leñador') preferredType = 'wood';
  else if (agent.job === 'Minero') {
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

  setAgentTask(agent, 'idle', 24);
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

  // Renovación del cardumen SOLO después de reposar sin sobreexplotación
  if (state.riverFishRestTimer > 0) {
    state.riverFishRestTimer = Math.max(0, state.riverFishRestTimer - 0.04 * dt);
    if (state.riverFishRestTimer <= 0) {
      state.riverFishStock = state.riverFishMaxStock;
      addLog(state, 'El río reposó y se renovó el cardumen de peces.', 'sky');
    }
  }
  const desiredVisualFish = Math.min(8, Math.ceil(state.riverFishStock / 2));
  if (fishCount < desiredVisualFish && state.riverFishStock > 0 && Math.random() < 0.03 * state.speed) {
    createAnimal(state, 'fish');
  }

  const bridgeX = state.bridge?.x ?? null;
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
      createVillagePetition(state);
      return;
    }
  }

  if (state.lightningFlashTimer > 0) {
    state.lightningFlashTimer = Math.max(0, state.lightningFlashTimer - dt * 0.25);
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
    if (remainingRealSec >= secToBoundary - 1e-9) {
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
      state.minute += rate * remainingRealSec;
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
  const currentBridgeX = state.bridge?.x ?? null;

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
      transferInheritance(state, agent);
      addLog(state, `${agent.name} (${agent.ageYears} años) no resistió y falleció.`, 'rose');
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
          repairDamagedStructures(state, agent);
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
      case 'store_home': {
        const house = state.houses.find((h) => h.id === agent.houseId);
        const destX = house ? house.x : depot ? depot.x : agent.x;
        const destY = house ? house.y + 10 : depot ? depot.y + 10 : agent.y;
        if (!house && !depot) {
          agent.taskTimer = 0;
          break;
        }
        const dist = moveTowards(agent, destX, destY, moveSpeed, dt, currentBridgeX);
        if (dist <= 20) {
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
          if ((b.type === 'forge' || b.type === 'bakery') && (agent.energy < 35 || agent.education < 28) && state.fires.length < 3 && Math.random() < 0.025) {
            spawnFire(state, b.x, b.y, `Error accidental de ${agent.name} en ${b.name}`, 'special', b.id);
          }
          advanceJobMastery(agent, agent.job, 2);
          const competitors = getCompetingBuildingCount(state, b.type);
          const competitionFactor = 1 / (1 + 0.35 * (competitors - 1));
          if (b.type === 'bank') {
            if (agent.inv.gold > 0) {
              b.storage.gold += agent.inv.gold;
              agent.inv.gold = 0;
            }
            if (agent.inv.silver > 0) {
              b.storage.silver += agent.inv.silver;
              agent.inv.silver = 0;
            }
            const earned = mintBackedCoins(state, Math.max(1, Math.round(5 * competitionFactor)));
            agent.coins += earned;
            b.storage.coins += mintBackedCoins(state, 3);
            if (state.loans.length < 3 && Math.random() < 0.25) {
              const needyBuilder = state.agents.find(
                (x) => !x.isChild && (x.job === 'Constructor' || x.job === 'Carpintero') && x.coins < 20
              );
              if (needyBuilder) grantBankLoan(state, needyBuilder, 12, 'obras civiles');
            }
          } else {
            const reward = Math.max(1, Math.round(4 * competitionFactor));
            agent.coins += mintBackedCoins(state, reward);
            state.knowledge += b.type === 'school' ? 2 : 1;
            if (b.type === 'school') {
              agent.education = clamp(agent.education + 2, 0, 100);
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
            state.riverFishRestTimer = 55;
            addLog(state, 'Pesca sobreexplotada: el río entró en reposo para renovar peces.', 'amber');
          }
          agent.inv.food += myDock ? 2 : 1;
          const dockBonus = myDock ? Math.max(2, Math.round(4 / getCompetingBuildingCount(state, 'dock'))) : 1;
          agent.coins += mintBackedCoins(state, dockBonus);
          advanceJobMastery(agent, 'Pescador', 3);
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
            addLog(state, `${agent.name} ordeñó a ${target.name} (+2 leche).`, 'emerald');
          } else if (target.type === 'sheep' && target.woolReady >= 50) {
            target.woolReady = 0;
            agent.coins += mintBackedCoins(state, 4);
            agent.moodModifier = clamp(agent.moodModifier + 4, -45, 45);
          } else if (target.type === 'chicken') {
            agent.inv.food += 1;
            agent.coins += mintBackedCoins(state, 1);
          }
          advanceJobMastery(agent, 'Agricultor', 2);
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
          } else if (target.type === 'pine_wood') {
            agent.inv.pineWood += bonusYield;
            agent.carpentryKnowledge = clamp(agent.carpentryKnowledge + 2, 0, 100);
          } else if (target.type === 'maple_wood') {
            agent.inv.mapleWood += bonusYield;
            agent.carpentryKnowledge = clamp(agent.carpentryKnowledge + 3, 0, 100);
          } else if (target.type === 'oak_wood') {
            agent.inv.oakWood += bonusYield;
            agent.carpentryKnowledge = clamp(agent.carpentryKnowledge + 4, 0, 100);
          } else if (target.type === 'copper') {
            agent.inv.copper += bonusYield;
            agent.coins += mintBackedCoins(state, forge ? 4 : 2);
          } else if (target.type === 'gold') {
            agent.inv.gold += bonusYield;
            recalculateEconomyReserve(state);
            agent.coins += mintBackedCoins(state, hasBank ? 8 : 5);
            addLog(state, `${agent.name} extrajo Oro 🥇 de la montaña (+${bonusYield}).`, 'amber');
          } else if (target.type === 'silver') {
            agent.inv.silver += bonusYield;
            recalculateEconomyReserve(state);
            agent.coins += mintBackedCoins(state, hasBank ? 5 : 3);
          } else {
            agent.inv[target.type] += bonusYield;
            agent.coins += mintBackedCoins(state, target.type === 'iron' ? (forge ? 5 : 3) : 1);
          }

          if (target.type === 'wood' && agent.job === 'Carpintero') {
            agent.carpentryKnowledge = clamp(agent.carpentryKnowledge + 2, 0, 100);
          }
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
            target.restTimer = 45;
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
            state.knowledge += 2;
            addLog(state, `${agent.name} cosechó ${plot.cropName} (+${harvestBonus} raciones).`, 'emerald');
            agent.taskTimer = 0;
          } else {
            plot.growth = clamp(plot.growth + 0.14 * dt, 0, 100);
          }
        }
        break;
      }
      case 'build_house': {
        if (!shouldBuildHouse(state)) {
          agent.taskTimer = 0;
          break;
        }
        const targetHubX = state.plaza ? state.plaza.x : agent.x;
        const targetHubY = state.plaza ? state.plaza.y : agent.y;
        const dist = moveTowards(agent, targetHubX, targetHubY, moveSpeed, dt, currentBridgeX);
        if (dist <= 160 && agent.taskTimer <= 4) {
          const woodNeed = carpentry ? 3 : 4;
          if (consumeConstructionResources(state, agent, { wood: woodNeed })) {
            const zone: 'south' | 'north' =
              state.bridge !== null &&
              state.houses.length >= 4 &&
              state.houses.filter((h) => h.zone === 'north').length < 4
                ? 'north'
                : 'south';
            const h = createHouseNearCenter(
              state,
              agent.name,
              zone,
              undefined,
              agent.x,
              agent.y,
              agent.constructionKnowledge
            );
            state.knowledge += 8;
            agent.constructionKnowledge = clamp(agent.constructionKnowledge + 6, 0, 100);
            advanceJobMastery(agent, 'Constructor', 5);
            agent.coins += mintBackedCoins(state, 6);
            addLog(
              state,
              `Qwen 2.5 eligió (${h.x}, ${h.y}) y ${agent.name} construyó ${h.name} (cap. ${h.capacity}).`,
              'emerald'
            );
          }
          agent.taskTimer = 0;
        }
        break;
      }
      case 'build_plaza': {
        if (state.plaza) {
          agent.taskTimer = 0;
          break;
        }
        if (agent.taskTimer <= 4) {
          if (consumeConstructionResources(state, agent, { wood: 6, stone: 6 })) {
            const plaza = createPlaza(state, agent.name, agent.x, agent.y);
            state.knowledge += 14;
            agent.constructionKnowledge = clamp(agent.constructionKnowledge + 8, 0, 100);
            advanceJobMastery(agent, 'Constructor', 6);
            agent.coins += mintBackedCoins(state, 10);
            addLog(
              state,
              `Qwen 2.5 ubicó la Plaza Central en (${plaza.x}, ${plaza.y}) y ${agent.name} la construyó.`,
              'sky'
            );
          }
          agent.taskTimer = 0;
        }
        break;
      }
      case 'build_bridge': {
        if (state.bridge) {
          agent.taskTimer = 0;
          break;
        }
        const dist = moveTowards(agent, agent.x, RIVER_BOTTOM_Y + 14, moveSpeed, dt, currentBridgeX);
        if (dist <= 40 && agent.taskTimer <= 4) {
          if (consumeConstructionResources(state, agent, { wood: 6, stone: 4 })) {
            const bridge = createBridge(state, agent.name, agent.x);
            state.knowledge += 14;
            agent.constructionKnowledge = clamp(agent.constructionKnowledge + 8, 0, 100);
            advanceJobMastery(agent, 'Constructor', 6);
            agent.coins += mintBackedCoins(state, 10);
            addLog(
              state,
              `Qwen 2.5 decidió cruzar el río en X=${bridge.x} y ${agent.name} construyó el Puente.`,
              'sky'
            );
          }
          agent.taskTimer = 0;
        }
        break;
      }
      case 'plant_farm': {
        if (agent.taskTimer <= 4) {
          if (consumeConstructionResources(state, agent, { wood: 3 })) {
            const farm = createFarmPlot(state, 'south', agent.x, agent.y);
            state.knowledge += 4;
            addLog(
              state,
              `Qwen 2.5 ubicó parcela de ${farm.cropName} en (${farm.x}, ${farm.y}) sembrada por ${agent.name}.`,
              'emerald'
            );
          }
          agent.taskTimer = 0;
        }
        break;
      }
      case 'build_special': {
        const targetHubX = state.plaza ? state.plaza.x : agent.x;
        const targetHubY = state.plaza ? state.plaza.y : agent.y;
        const dist = moveTowards(agent, targetHubX, targetHubY, moveSpeed, dt, currentBridgeX);
        if (dist <= 160 && agent.taskTimer <= 4) {
          const order: SpecialBuilding['type'][] = [
            'dock',
            'general_depot',
            'market',
            'bank',
            'school',
            'infirmary',
            'bakery',
            'carpentry',
            'forge',
            'apothecary',
            'town_hall',
            'police_station',
            'prison',
          ];
          const missing = order.find(
            (t) =>
              !state.specialBuildings.some((b) => b.type === t) &&
              hasAvailableOperatorForBuilding(state, t)
          );
          if (missing && consumeConstructionResources(state, agent, { wood: 5, stone: 3 })) {
            const b = createSpecialBuilding(
              state,
              missing,
              agent.name,
              agent.x,
              agent.y,
              agent.constructionKnowledge
            );
            if (b) {
              state.knowledge += 16;
              agent.constructionKnowledge = clamp(agent.constructionKnowledge + 8, 0, 100);
              advanceJobMastery(agent, 'Constructor', 6);
              agent.coins += mintBackedCoins(state, 10);
              addLog(state, `Qwen 2.5 eligió (${b.x}, ${b.y}) y ${agent.name} inauguró ${b.name}.`, 'sky');
            }
          }
          agent.taskTimer = 0;
        }
        break;
      }
      case 'upgrade_house': {
        const house = state.houses.find((h) => h.level < ERA_METADATA[state.era].maxHouseLevel) ?? state.houses[0];
        if (!house) {
          agent.taskTimer = 0;
          break;
        }
        const dist = moveTowards(agent, house.x, house.y, moveSpeed, dt, currentBridgeX);
        if (dist <= 22 && agent.taskTimer <= 4) {
          if (consumeConstructionResources(state, agent, { wood: 3, stone: 2 })) {
            const upgraded = upgradeLowestHouse(state, agent.constructionKnowledge);
            if (upgraded) {
              state.knowledge += 10;
              agent.constructionKnowledge = clamp(agent.constructionKnowledge + 6, 0, 100);
              advanceJobMastery(agent, 'Constructor', 4);
              agent.coins += mintBackedCoins(state, 8);
              addLog(state, `${agent.name} mejoró ${upgraded.name} a Nivel ${upgraded.level}.`, 'sky');
            }
          }
          agent.taskTimer = 0;
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
            patient.isSick = false;
            patient.illness = null;
            patient.illnessName = null;
            patient.health = clamp(patient.health + (hasInfirmary ? 42 : apothecary ? 34 : 28), 0, 100);
            patient.happiness = clamp(patient.happiness + 10, 0, 100);
          }
          agent.coins += mintBackedCoins(state, 5);
          advanceJobMastery(agent, 'Curandero', 4);
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
          state.knowledge += (hasSchool ? 0.18 : 0.08) * dt * mentorBoost;
          agent.education = clamp(agent.education + (hasSchool ? 0.25 : 0.09) * dt * mentorBoost, 0, 100);
          agent.constructionKnowledge = clamp(agent.constructionKnowledge + (hasSchool ? 0.12 : 0.04) * dt * mentorBoost, 0, 100);
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
              coinNode.restTimer = 45;
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
          const competitors = preferredShop ? getCompetingBuildingCount(state, preferredShop.type) : 1;
          const compMult = 1 / (1 + 0.35 * (competitors - 1));
          if (agent.job === 'Panadero' && bakery) {
            if (isLawActive(state, 'ban_trade_bread')) {
              enforceLawViolation(state, agent, 'ban_trade_bread');
            } else if (agent.inv.food > 0) {
              agent.inv.food -= 1;
              agent.breadCount += 2;
              agent.coins += mintBackedCoins(state, Math.max(1, Math.round(5 * compMult)));
            } else {
              agent.breadCount += 1;
              agent.coins += mintBackedCoins(state, Math.max(1, Math.round(3 * compMult)));
            }
          } else if ((agent.job === 'Herrero' || agent.job === 'Artesano') && forge) {
            if (agent.inv.iron > 0 || agent.inv.copper > 0) {
              if (agent.inv.iron > 0) agent.inv.iron -= 1;
              else agent.inv.copper -= 1;
              agent.toolsCount += 1;
              agent.coins += mintBackedCoins(state, Math.max(2, Math.round(9 * compMult)));
              addLog(state, `${agent.name} forjó herramientas en la Herrería.`, 'amber');
            } else {
              agent.coins += mintBackedCoins(state, Math.max(1, Math.round(4 * compMult)));
            }
          } else if (agent.job === 'Boticario' && apothecary) {
            if (agent.inv.food > 0) {
              agent.inv.food -= 1;
              agent.medicineCount += 1;
              agent.coins += mintBackedCoins(state, Math.max(2, Math.round(6 * compMult)));
            } else {
              agent.coins += mintBackedCoins(state, Math.max(1, Math.round(3 * compMult)));
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
          } else if (preferredShop) {
            agent.coins += mintBackedCoins(state, 2);
          }
          advanceJobMastery(agent, agent.job, 2);
          agent.taskTimer = 0;
        }
        break;
      }
      case 'socialize':
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
    electRepresentative(state);
  }

  // Interacciones sociales emergentes, parejas (desde 15 años) y concepción de embarazo (desde 20 años, 3 días)
  for (let i = 0; i < state.agents.length; i++) {
    const a = state.agents[i];
    for (let j = i + 1; j < state.agents.length; j++) {
      const b = state.agents[j];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      if (d < 24 && Math.random() < 0.008 * state.speed) {
        a.talkingTimer = 14;
        b.talkingTimer = 14;
        const dialogue = generateEmergentDialogue(a, b, state);
        a.lastDialogue = dialogue;
        b.lastDialogue = dialogue;

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
          Math.random() < 0.09
        ) {
          const decision = decideVillagerMajorAction(state, a, 'partnership', { partner: b });
          if (decision.approved) {
            a.partnerId = b.id;
            b.partnerId = a.id;
            addLog(state, `${a.name} y ${b.name} formaron pareja.`, 'violet');
          }
        }

        const birthChance = state.policies.reproductionRestraint ? 0.02 : 0.045;
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
  }
  recalculateEconomyReserve(state);
}

function drawLeftForestAndRightMountains(
  ctx: CanvasRenderingContext2D,
  season: SimulationState['season']
): void {
  const isWinter = season === 'Invierno';
  const isAutumn = season === 'Otoño';

  ctx.fillStyle = isWinter ? 'rgba(20, 48, 42, 0.45)' : 'rgba(13, 52, 24, 0.42)';
  ctx.fillRect(0, 0, FOREST_MAX_X, CANVAS_HEIGHT);

  for (let ty = 34; ty < CANVAS_HEIGHT - 28; ty += 56) {
    if (ty > RIVER_TOP_Y - 22 && ty < RIVER_BOTTOM_Y + 26) continue;
    for (let tx = 26; tx < FOREST_MAX_X - 24; tx += 58) {
      const ox = tx + ((ty * 7) % 21);
      const oy = ty + ((tx * 3) % 15);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(ox - 3, oy + 4, 6, 11);
      ctx.fillStyle = isWinter ? '#334155' : isAutumn ? '#b45309' : '#14532d';
      ctx.fillRect(ox - 12, oy - 6, 24, 12);
      ctx.fillStyle = isWinter ? '#64748b' : isAutumn ? '#d97706' : '#15803d';
      ctx.fillRect(ox - 9, oy - 13, 18, 9);
      ctx.fillStyle = isWinter ? '#cbd5e1' : isAutumn ? '#f59e0b' : '#22c55e';
      ctx.fillRect(ox - 5, oy - 18, 10, 6);
    }
  }

  ctx.fillStyle = isWinter ? 'rgba(71, 85, 105, 0.46)' : 'rgba(51, 65, 85, 0.46)';
  ctx.fillRect(MOUNTAIN_MIN_X, 0, CANVAS_WIDTH - MOUNTAIN_MIN_X, CANVAS_HEIGHT);

  for (let my = 48; my < CANVAS_HEIGHT - 36; my += 84) {
    if (my > RIVER_TOP_Y - 24 && my < RIVER_BOTTOM_Y + 34) continue;
    for (let mx = MOUNTAIN_MIN_X + 34; mx < CANVAS_WIDTH - 24; mx += 78) {
      const ox = mx + ((my * 5) % 19);
      const oy = my + ((mx * 3) % 15);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(ox - 24, oy + 14, 48, 6);
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
  isBridgeSelected: boolean
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

  const shift = Math.floor(minute * 1.4) % 48;
  ctx.fillStyle = isWinter ? '#e0f2fe' : '#60a5fa';
  for (let rx = -48 + shift; rx < CANVAS_WIDTH + 48; rx += 48) {
    ctx.fillRect(rx, RIVER_TOP_Y + 8, 16, 3);
    ctx.fillRect(rx + 20, RIVER_TOP_Y + 28, 18, 3);
    ctx.fillRect(rx + 8, RIVER_TOP_Y + 48, 14, 2);
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
    const bxMin = bridge.x - BRIDGE_HALF_WIDTH;
    const bridgeW = BRIDGE_HALF_WIDTH * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(bxMin - 3, RIVER_TOP_Y - 2, bridgeW + 6, RIVER_BOTTOM_Y - RIVER_TOP_Y + 10);
    ctx.fillStyle = '#475569';
    ctx.fillRect(bxMin - 3, RIVER_TOP_Y - 8, 6, RIVER_BOTTOM_Y - RIVER_TOP_Y + 16);
    ctx.fillRect(bxMin + bridgeW - 3, RIVER_TOP_Y - 8, 6, RIVER_BOTTOM_Y - RIVER_TOP_Y + 16);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(bxMin, RIVER_TOP_Y - 6, bridgeW, RIVER_BOTTOM_Y - RIVER_TOP_Y + 12);
    ctx.fillStyle = '#92400e';
    for (let by = RIVER_TOP_Y - 4; by <= RIVER_BOTTOM_Y + 2; by += 6) {
      ctx.fillRect(bxMin + 3, by, bridgeW - 6, 4);
    }
    ctx.fillStyle = '#451a03';
    ctx.fillRect(bxMin, RIVER_TOP_Y - 6, 4, RIVER_BOTTOM_Y - RIVER_TOP_Y + 12);
    ctx.fillRect(bxMin + bridgeW - 4, RIVER_TOP_Y - 6, 4, RIVER_BOTTOM_Y - RIVER_TOP_Y + 12);
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
    ctx.fillStyle = '#475569';
    ctx.fillRect(r.x - half, r.y - half, ROAD_GRID_SIZE, ROAD_GRID_SIZE);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(r.x - half + 2, r.y - half + 2, ROAD_GRID_SIZE - 4, ROAD_GRID_SIZE - 4);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(r.x - 8, r.y - 7, 6, 5);
    ctx.fillRect(r.x + 2, r.y - 5, 6, 5);
    ctx.fillRect(r.x - 6, r.y + 2, 7, 5);
    ctx.fillRect(r.x + 3, r.y + 3, 5, 4);
    if (r.lit && (r.x + r.y) % 48 === 0) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(r.x + 7, r.y - 10, 3, 8);
      ctx.fillStyle = '#f59e0b';
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
  isSelected: boolean
): void {
  const x = Math.round(b.x);
  const y = Math.round(b.y);
  ctx.save();
  ctx.translate(x, y);

  switch (b.type) {
    case 'dock': {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(-30, 12, 60, 6);
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
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fillRect(-32, 17, 64, 7);
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
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fillRect(-34, 18, 68, 7);
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
      ctx.fillStyle = isNight ? '#fef08a' : '#bae6fd';
      ctx.fillRect(-26, -6, 7, 7);
      ctx.fillRect(19, -6, 7, 7);
      break;
    }
    case 'school': {
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fillRect(-33, 18, 66, 7);
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
      ctx.fillStyle = isNight ? '#fde047' : '#60a5fa';
      ctx.fillRect(-24, -4, 7, 7);
      ctx.fillRect(17, -4, 7, 7);
      break;
    }
    case 'market': {
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fillRect(-33, 16, 66, 7);
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
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(-24, 14, 48, 6);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-21, -10, 42, 24);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-24, -17, 48, 8);
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(10, -29, 7, 12);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(-16, -2, 11, 7);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(1, 4, 8, 10);
      break;
    }
    case 'carpentry': {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(-27, 15, 54, 6);
      ctx.fillStyle = '#9a6b3f';
      ctx.fillRect(-24, -11, 48, 26);
      ctx.fillStyle = '#654321';
      ctx.fillRect(-27, -18, 54, 8);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-4, 5, 8, 10);
      ctx.fillStyle = isNight ? '#fde047' : '#93c5fd';
      ctx.fillRect(10, -3, 8, 6);
      break;
    }
    case 'forge': {
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fillRect(-28, 15, 56, 6);
      ctx.fillStyle = '#475569';
      ctx.fillRect(-25, -11, 50, 26);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-28, -18, 56, 8);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-7, 3, 12, 12);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-3, 7, 5, 6);
      break;
    }
    case 'apothecary': {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(-23, 14, 46, 6);
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(-20, -10, 40, 24);
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(-23, -17, 46, 8);
      ctx.fillStyle = '#2dd4bf';
      ctx.fillRect(-4, -20, 8, 7);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-4, 4, 8, 10);
      break;
    }
    case 'general_depot': {
      // DEPÓSITO GENERAL (bodega amplia con cajas)
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fillRect(-32, 16, 64, 7);
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
      // AYUNTAMIENTO con torre reloj y estandarte
      ctx.fillStyle = 'rgba(0,0,0,0.44)';
      ctx.fillRect(-35, 18, 70, 7);
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
      // COMISARÍA con insignia azul y farol policial
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fillRect(-27, 15, 54, 6);
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
      // CÁRCEL de piedra con rejas metálicas
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fillRect(-28, 15, 56, 6);
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

  if (isSelected) {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(-36, -40, 72, 62);
  }

  const short = SPECIAL_BUILDING_LABELS[b.type].short;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(-26, -48, 52, 11);
  ctx.fillStyle = b.isOperational ? '#4ade80' : '#fb7185';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${short} N${b.level}`, 0, -39);

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
  isSelected: boolean
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

  ctx.fillStyle = 'rgba(0,0,0,0.36)';
  ctx.fillRect(-w / 2 - 2, h / 2 + 3, w + 4, 6);

  ctx.fillStyle = wallColors[house.level];
  ctx.fillRect(-w / 2, -h / 2 + 4, w, h);

  ctx.fillStyle = roofColors[house.level];
  ctx.fillRect(-w / 2 - 4, -h / 2 - 2, w + 8, 7);
  ctx.fillRect(-w / 2 + 2, -h / 2 - 8, w - 4, 6);
  if (house.size === 'large') {
    ctx.fillRect(-w / 2 + 9, -h / 2 - 13, w - 18, 5);
  }

  if (house.level >= 2 || house.size !== 'small') {
    ctx.fillStyle = '#475569';
    ctx.fillRect(w / 2 - 8, -h / 2 - 14, 5, 8);
    if (house.size === 'large') {
      ctx.fillRect(-w / 2 + 4, -h / 2 - 14, 5, 8);
    }
  }

  ctx.fillStyle = '#451a03';
  const doorW = house.size === 'large' ? 10 : 6;
  ctx.fillRect(-doorW / 2, h / 2 - 6, doorW, 10);

  ctx.fillStyle = isNight ? '#fde047' : '#38bdf8';
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
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`N${house.level}·${sizeTag}`, 0, -h / 2 - 18);

  ctx.restore();
}

function drawPixelAnimal(ctx: CanvasRenderingContext2D, animal: Animal, isSelected: boolean): void {
  const x = Math.round(animal.x);
  const y = Math.round(animal.y);
  const dir = animal.vx >= 0 ? 1 : -1;
  const step = Math.sin(animal.walkFrame) * 1.5;

  ctx.save();
  ctx.translate(x, y);
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
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-9, -4, 16, 8);
      ctx.fillRect(5, -10, 5, 8);
      ctx.fillRect(8, -10, 4, 4);
      ctx.fillStyle = '#1e1b18';
      ctx.fillRect(-12, -3, 3, 7);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-8, 4 + step, 2, 5);
      ctx.fillRect(6, 4 - step, 2, 5);
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
 * Diferenciación sutil y legible en pixel-art entre Mujer, Hombre y Niño/a.
 */
function drawPixelAgent(ctx: CanvasRenderingContext2D, agent: Agent, selectedId: number | null): void {
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
    // Mujer: silueta definida de vestido / falda acampanada con lazo y cuello
    ctx.fillStyle = agent.shirt;
    ctx.fillRect(-4, -4, 8, 6);
    ctx.fillRect(-6, 1, 12, 5);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-2, -4, 4, 2);
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(-4, 0, 8, 1);
  } else if (!agent.isChild && agent.sex === 'M') {
    // Hombre: hombros anchos, chaleco y cinturón con hebilla
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
    // Niño/a: túnica compacta con peto y proporción infantil
    ctx.fillStyle = agent.shirt;
    ctx.fillRect(-4, -3, 8, 7);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-2, -3, 4, 2);
  }

  ctx.fillStyle = agent.isSick ? '#cbd5e1' : agent.skin;
  ctx.fillRect(-7, -3, 2, 6);
  ctx.fillRect(5, -3, 2, 6);

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

  if (agent.isRepresentative) {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-3, -17, 6, 2);
    ctx.fillRect(-2, -19, 1, 2);
    ctx.fillRect(1, -19, 1, 2);
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
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Z', 8, -16);
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

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = patch;
  for (let gx = 0; gx < CANVAS_WIDTH; gx += 64) {
    for (let gy = 16; gy < CANVAS_HEIGHT; gy += 64) {
      if ((gx + gy) % 128 === 0) ctx.fillRect(gx + 10, gy + 10, 18, 8);
      else ctx.fillRect(gx + 34, gy + 38, 10, 6);
    }
  }

  drawLeftForestAndRightMountains(ctx, state.season);
  drawCenterRiver(ctx, state.minute, state.season, state.bridge, state.selectedEntity?.kind === 'bridge');

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
    drawPixelHouse(ctx, house, isNight, isSel);
  }
  const sortedSpecials = [...state.specialBuildings].sort((a, b) => a.y - b.y);
  for (const b of sortedSpecials) {
    const isSel = state.selectedEntity?.kind === 'special' && state.selectedEntity.id === b.id;
    drawSpecialBuilding(ctx, b, isNight, isSel);
  }

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
    } else if (r.type === 'gold') {
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.fillRect(rx - 7, ry + 4, 14, 2);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(rx - 7, ry - 1, 14, 5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(rx - 5, ry - 4, 10, 5);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(rx - 4, ry - 3, 7, 2);
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
    drawPixelAnimal(ctx, animal, isSel);
  }

  const sortedAgents = [...state.agents].sort((a, b) => a.y - b.y);
  const selAgentId =
    state.selectedEntity?.kind === 'agent' ? state.selectedEntity.id : state.selectedAgentId;
  for (const agent of sortedAgents) {
    drawPixelAgent(ctx, agent, selAgentId);
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

  if (state.weather === 'rain' || state.weather === 'storm' || state.weather === 'thunderstorm') {
    ctx.fillStyle = state.weather === 'thunderstorm' ? '#dbeafe' : state.weather === 'storm' ? '#bfdbfe' : '#93c5fd';
    for (const d of state.rainDrops) {
      ctx.fillRect(Math.round(d.x), Math.round(d.y), 2, 7);
      d.y += d.s * Math.max(1, state.speed);
      if (d.y > CANVAS_HEIGHT) d.y = 0;
    }
  }

  if (isNight) {
    ctx.fillStyle = 'rgba(10, 18, 42, 0.30)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'rgba(253, 224, 71, 0.22)';
    if (state.plaza) {
      const plazaCorners = [
        [state.plaza.x - 52, state.plaza.y - 38],
        [state.plaza.x + 48, state.plaza.y - 38],
        [state.plaza.x - 52, state.plaza.y + 34],
        [state.plaza.x + 48, state.plaza.y + 34],
      ];
      for (const [lx, ly] of plazaCorners) {
        ctx.fillRect(lx - 14, ly - 14, 28, 28);
      }
    }
    for (const r of state.roads) {
      if (r.lit && (r.x + r.y) % 48 === 0) {
        ctx.fillRect(r.x - 10, r.y - 22, 28, 28);
      }
    }
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

export async function askQwenAssistant(
  state: SimulationState,
  userPrompt: string
): Promise<{ reply: string; appliedRules: string[]; source: 'ollama' | 'local' }> {
  const agentNames = state.agents.map((a) => a.name);

  if (state.ollama.enabled && state.ollama.url.trim()) {
    try {
      const villageSummary = {
        dia: state.day,
        estacion: state.season,
        era: ERA_METADATA[state.era].label,
        poblacion: state.agents.length,
        enfermos: state.agents.filter((a) => a.isSick).length,
        casas: state.houses.length,
        plazaConstruida: Boolean(state.plaza),
        puenteConstruido: Boolean(state.bridge),
        cultivos: state.farms.length,
        incendios: state.fires.length,
        leyesActivas: state.laws.filter((l) => l.active).map((l) => l.name),
        reservaEconomica: state.economyReserve,
        conocimiento: Math.round(state.knowledge),
        aldeanosMuestra: agentNames.slice(0, 15),
      };

      const systemPrompt = `Eres Qwen 2.5, IA dominante de la evolución de la especie y la aldea en "Aldea IA".
Estado actual: ${JSON.stringify(villageSummary)}.
Orden del jugador: "${userPrompt}".
Responde EXCLUSIVAMENTE un JSON válido con:
{
  "reply": "Respuesta corta en español explicando lo ejecutado en los aldeanos",
  "actions": [
    { "type": "GENERATE_ECONOMY" },
    { "type": "ISSUE_BANK_LOANS" },
    { "type": "FORM_MENTORSHIPS" },
    { "type": "REPAIR_BUILDINGS" },
    { "type": "RUN_CARAVANS" },
    { "type": "TRIGGER_LIGHTNING_STORM" },
    { "type": "TRIGGER_FIRE" },
    { "type": "BUILD_SPECIAL", "buildingType": "dock|bank|market|bakery|carpentry|forge|apothecary|infirmary|school|general_depot|town_hall|police_station|prison" },
    { "type": "TOGGLE_LAW", "lawId": "ban_trade_wood|ban_fishing|ban_trade_bread|ban_mine_gold|winter_rationing|night_watch|mining_priority", "active": true },
    { "type": "ASSIGN_ACTIVE_JOBS" },
    { "type": "BOOST_EVOLUTION", "knowledgeGain": 45 },
    { "type": "HEAL_VILLAGERS" }
  ]
}
Usa solo las acciones relevantes para cumplir la orden.`;

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
        const parsed = JSON.parse(raw) as { reply?: string; actions?: QwenAction[] };
        if (parsed && Array.isArray(parsed.actions)) {
          const appliedRules = applyQwenActions(state, parsed.actions, spawnSettlers);
          return {
            reply: parsed.reply || 'Reglas ejecutadas por Ollama (Qwen 2.5).',
            appliedRules,
            source: 'ollama',
          };
        }
      }
    } catch {
      // Fallback al motor local
    }
  }

  const localResult = interpretQwenDirective(userPrompt, agentNames);
  const appliedRules = applyQwenActions(state, localResult.actions, spawnSettlers);
  return {
    reply: localResult.reply,
    appliedRules,
    source: 'local',
  };
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
