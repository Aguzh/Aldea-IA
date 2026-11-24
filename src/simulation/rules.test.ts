import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addLog,
  addPreciousMetalToReserve,
  addRoadTile,
  advanceDayAging,
  advanceJobMastery,
  applyBuildingWear,
  applyQwenActions,
  assignMentorships,
  buildBaseRoads,
  canAgentRest,
  canAgentsReproduce,
  canCarpenterUseWood,
  canGatherOrTradeMineral,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  collectTaxesAndRepayLoans,
  computeEra,
  computeSeason,
  computeUnlockedSkills,
  consumeConstructionResources,
  craftToolsForAgent,
  createAnimal,
  createBridge,
  createEmptyHouseStorage,
  createFarmPlot,
  createHouseNearCenter,
  createPlaza,
  createSpecialBuilding,
  createVillagePetition,
  cureAgent,
  DAY_DURATION_SECONDS,
  DAY_START_MINUTE,
  DAYS_PER_SEASON,
  DAYS_PER_YEAR,
  decideVillagerMajorAction,
  defendAgainstWildAnimal,
  deleteAnimal,
  deleteBridge,
  deleteFarmPlotById,
  deleteHouse,
  deletePlaza,
  deleteSpecialBuilding,
  depositResourcesToHouse,
  DISEASE_CATALOG,
  electRepresentative,
  enforceLawViolation,
  extinguishFire,
  FISH_VARIANTS,
  FOREST_MAX_X,
  getCompetingBuildingCount,
  getConciseTaskLabel,
  getEmotionWorkMultiplier,
  getHappinessLabel,
  getHealthStatusLabel,
  getJobMasteryTierLabel,
  getTerrainZoneAt,
  GOLD_COIN_BACKING,
  grantBankLoan,
  hasAvailableOperatorForBuilding,
  HOUSE_SIZE_CAPACITIES,
  infectAgent,
  interpretQwenDirective,
  isBuildingOperational,
  isNearRoad,
  isNightMinute,
  isPointInRiverWater,
  killAgent,
  killAllCrops,
  killCropPlotAt,
  MAX_MAESTRO_JOBS_PER_AGENT,
  mintBackedCoins,
  modifyAgentKnowledge,
  modifyAgentResource,
  modifyHouseStorage,
  modifySpecialBuildingStorage,
  MOUNTAIN_MIN_X,
  NIGHT_DURATION_SECONDS,
  NIGHT_START_MINUTE,
  NORTH_CENTER_Y,
  PETITION_INTERVAL_SECONDS,
  pickQwenBabyName,
  PREGNANCY_DAYS,
  progressDiseasesDaily,
  rebalanceBuildingOwnership,
  rebalanceFamilyHousing,
  repairDamagedStructures,
  resolvePetition,
  RIVER_BOTTOM_Y,
  RIVER_TOP_Y,
  runCouncilOfElders,
  shouldBuildHouse,
  SILVER_COIN_BACKING,
  SOUTH_CENTER_Y,
  spawnFire,
  SPEED_TIMINGS,
  switchPartnerForAgent,
  syncSpecialBuildingStaff,
  tameWildAnimal,
  toggleSterileAgent,
  toggleVillageLaw,
  transferBuildingOwnership,
  triggerLightningStorm,
  VILLAGE_SKILLS,
  WORLD_CENTER_Y,
} from './rules';
import type { DiseaseInfo } from '../types/simulation';
import { createAgent, createInitialState, spawnResource, spawnSettlers, tickSimulation } from './engine';

test('El juego inicia con 5 mujeres, 5 hombres, recursos finitos y sin ninguna construcción previa', () => {
  const state = createInitialState();
  const men = state.agents.filter((a) => a.sex === 'M');
  const women = state.agents.filter((a) => a.sex === 'F');

  assert.equal(state.agents.length, 10);
  assert.equal(men.length, 5);
  assert.equal(women.length, 5);
  assert.equal(state.houses.length, 0);
  assert.equal(state.specialBuildings.length, 0);
  assert.equal(state.farms.length, 0);
  assert.equal(state.roads.length, 0);
  assert.equal(state.plaza, null);
  assert.equal(state.bridge, null);
  assert.ok(state.agents.every((a) => a.houseId === null));
  assert.ok(state.resources.some((r) => r.type === 'copper'));
  assert.ok(state.resources.every((r) => r.maxAmount > 0 && r.depleted === false));
  assert.equal(state.riverFishStock, state.riverFishMaxStock);
  assert.equal(state.laws.length, 7);

  // Río horizontal en la mitad exacta del mapa (y≈446..514), sin fundadores ni animales terrestres en el agua
  assert.ok(RIVER_TOP_Y >= 400 && RIVER_BOTTOM_Y <= 560);
  assert.ok(WORLD_CENTER_Y >= RIVER_TOP_Y && WORLD_CENTER_Y <= RIVER_BOTTOM_Y);
  assert.ok(NORTH_CENTER_Y < RIVER_TOP_Y && SOUTH_CENTER_Y > RIVER_BOTTOM_Y);
  assert.ok(state.agents.every((a) => !isPointInRiverWater(a.x, a.y, null)));
  assert.ok(state.animals.filter((an) => an.type !== 'fish').every((an) => !isPointInRiverWater(an.x, an.y, null)));
  assert.ok(state.resources.some((r) => r.y < RIVER_TOP_Y));
  assert.ok(state.resources.some((r) => r.y > RIVER_BOTTOM_Y));
});

test('El día dura 7 minutos reales (420s) y la noche dura 3 minutos reales (180s)', () => {
  assert.equal(DAY_DURATION_SECONDS, 420);
  assert.equal(NIGHT_DURATION_SECONDS, 180);

  const state = createInitialState();
  state.speed = 1;
  state.minute = DAY_START_MINUTE;

  for (let s = 0; s < 420; s++) {
    tickSimulation(state, 1);
  }
  assert.ok(Math.abs(state.minute - NIGHT_START_MINUTE) < 0.05, `Esperado ~1200, fue ${state.minute}`);
  assert.equal(isNightMinute(state.minute), true);

  for (let s = 0; s < 180; s++) {
    tickSimulation(state, 1);
  }
  assert.equal(state.day, 2);
  assert.ok(Math.abs(state.minute - DAY_START_MINUTE) < 0.05, `Esperado ~360, fue ${state.minute}`);
  assert.equal(isNightMinute(state.minute), false);
});

test('Año de 120 días, estaciones de 30 días y cambio automático de bioma y clima al cambiar de estación', () => {
  assert.equal(DAYS_PER_SEASON, 30);
  assert.equal(DAYS_PER_YEAR, 120);
  assert.equal(computeSeason(1), 'Primavera');
  assert.equal(computeSeason(30), 'Primavera');
  assert.equal(computeSeason(31), 'Verano');
  assert.equal(computeSeason(61), 'Otoño');
  assert.equal(computeSeason(91), 'Invierno');
  assert.equal(computeSeason(121), 'Primavera');

  const state = createInitialState();
  const initialAge = state.agents[0].ageYears;
  state.day = 31;
  advanceDayAging(state);
  assert.equal(state.agents[0].ageYears, initialAge + 1);
  assert.equal(state.season, 'Verano');
  assert.equal(state.biome, 'arid');
  assert.equal(state.weather, 'sunny');

  state.day = 61;
  advanceDayAging(state);
  assert.equal(state.season, 'Otoño');
  assert.equal(state.biome, 'forest');
  assert.equal(state.weather, 'rain');

  state.day = 91;
  advanceDayAging(state);
  assert.equal(state.season, 'Invierno');
  assert.equal(state.biome, 'tundra');
  assert.equal(state.weather, 'storm');
});

test('Las 5 enfermedades exactas y Cáncer incurable fatal entre 10 y 15 días', () => {
  assert.equal(Object.keys(DISEASE_CATALOG).length, 5);
  assert.equal(DISEASE_CATALOG.gripe.dangerPct, 25);
  assert.equal(DISEASE_CATALOG.dolor_estomacal.dangerPct, 40);
  assert.equal(DISEASE_CATALOG.pulmonia.dangerPct, 55);
  assert.equal(DISEASE_CATALOG.sepsis.dangerPct, 80);
  assert.equal(DISEASE_CATALOG.cancer.dangerPct, 100);
  assert.equal(DISEASE_CATALOG.cancer.baseChancePct, 1);
  assert.equal(DISEASE_CATALOG.cancer.incurable, true);

  const state = createInitialState();
  const agent = state.agents[0];
  assert.equal(getHealthStatusLabel(agent).status, 'Sano');
  assert.equal(getHealthStatusLabel(agent).levelLabel, 'Óptima');

  infectAgent(state, agent.id, 'gripe');
  assert.equal(agent.isSick, true);
  assert.equal(agent.illness?.name, 'Gripe');
  assert.equal(getHealthStatusLabel(agent).status, 'Enfermo');

  cureAgent(state, agent.id);
  assert.equal(agent.isSick, false);
  assert.equal(agent.illness, null);

  // Cáncer es incurable
  infectAgent(state, agent.id, 'cancer');
  const cancerIllness = (agent as { illness: DiseaseInfo | null }).illness;
  assert.ok(cancerIllness);
  assert.equal(cancerIllness.incurable, true);
  assert.ok(cancerIllness.fatalAfterDays! >= 10 && cancerIllness.fatalAfterDays! <= 15);
  cureAgent(state, agent.id);
  assert.equal(agent.isSick, true); // Sigue enfermo por ser incurable

  const fatalDays = cancerIllness.fatalAfterDays!;
  for (let d = 0; d < fatalDays; d++) {
    const res = progressDiseasesDaily(state, agent);
    if (d === fatalDays - 1) {
      assert.equal(res.diedFromDisease, true);
    }
  }
});

test('Pareja desde 15 años, reproducción desde 20 solo con wantsChildren, embarazo de 3 días y nombres por Qwen 2.5', () => {
  assert.equal(PREGNANCY_DAYS, 3);
  const state = createInitialState();
  const men = state.agents.filter((a) => a.sex === 'M');
  const women = state.agents.filter((a) => a.sex === 'F');
  const m1 = men[0];
  const f1 = women[0];

  const h = createHouseNearCenter(state, 'Mateo', 'south', 'large');
  assert.equal(h.capacity, 8);
  m1.houseId = h.id;
  f1.houseId = h.id;

  // Menor de 15 años no puede formar pareja
  m1.ageYears = 14;
  f1.ageYears = 16;
  assert.equal(decideVillagerMajorAction(state, m1, 'partnership', { partner: f1 }).approved, false);

  // Con 15+ puede formar pareja
  m1.ageYears = 16;
  assert.equal(decideVillagerMajorAction(state, m1, 'partnership', { partner: f1 }).approved, true);
  m1.partnerId = f1.id;
  f1.partnerId = m1.id;

  // Menor de 20 no puede reproducirse
  assert.equal(canAgentsReproduce(m1, f1, state.houses, state.agents, state.policies), false);

  // Con 20+ pero libre albedrío sin hijos -> bloqueado
  m1.ageYears = 21;
  f1.ageYears = 21;
  m1.wantsChildren = false;
  f1.wantsChildren = true;
  assert.equal(canAgentsReproduce(m1, f1, state.houses, state.agents, state.policies), false);

  // Ambos desean hijos -> permitido
  m1.wantsChildren = true;
  assert.equal(canAgentsReproduce(m1, f1, state.houses, state.agents, state.policies), true);

  // Embarazo de 3 días culmina en nacimiento con nombre elegido por Qwen 2.5
  const popBefore = state.agents.length;
  f1.pregnancy = { partnerId: m1.id, daysRemaining: 3, conceptionDay: state.day };
  const babyNameCandidate = pickQwenBabyName('F', state);
  assert.ok(babyNameCandidate.length >= 3);

  state.day++;
  advanceDayAging(state);
  assert.equal(f1.pregnancy?.daysRemaining, 2);
  assert.equal(state.agents.length, popBefore);

  state.day++;
  advanceDayAging(state);
  assert.equal(f1.pregnancy?.daysRemaining, 1);
  assert.equal(state.agents.length, popBefore);

  state.day++;
  const day3Res = advanceDayAging(state);
  assert.equal(day3Res.births, 1);
  assert.equal(f1.pregnancy, null);
  assert.equal(state.agents.length, popBefore + 1);
  const newborn = state.agents[state.agents.length - 1];
  assert.equal(newborn.ageYears, 0);
  assert.ok(newborn.lastQwenDecision?.includes('Qwen 2.5'));

  // Esterilizar bloquea reproducción
  toggleSterileAgent(state, m1.id);
  assert.equal(canAgentsReproduce(m1, f1, state.houses, state.agents, state.policies), false);
});

test('Matar a un aldeano lo elimina, transfiere herencia y afecta a su pareja', () => {
  const state = createInitialState();
  const a = state.agents.find((x) => x.sex === 'M')!;
  const b = state.agents.find((x) => x.sex === 'F')!;
  a.coins = 25;
  b.coins = 10;
  a.partnerId = b.id;
  b.partnerId = a.id;
  const countBefore = state.agents.length;

  killAgent(state, a.id);
  assert.equal(state.agents.length, countBefore - 1);
  assert.equal(b.partnerId, null);
  assert.equal(b.emotion, 'sad');
  assert.equal(b.coins, 35);
  assert.equal(getHappinessLabel(15), 'Depresión');
  assert.equal(getHappinessLabel(92, 'excited'), 'Excitación');
});

test('Sin límite artificial de 48 aldeanos: soporta > 50 agentes', () => {
  const state = createInitialState();
  for (let i = 0; i < 45; i++) {
    state.agents.push(createAgent(500 + i, `Extra${i}`, i % 2 === 0 ? 'M' : 'F', 300, 300, null, 22));
  }
  assert.ok(state.agents.length > 50);
  tickSimulation(state);
  assert.ok(state.agents.length > 50);
});

test('La actividad actual es concisa y estable entre ticks consecutivos', () => {
  const state = createInitialState();
  tickSimulation(state);
  const firstActivity = state.agents[0].activity;
  assert.ok(firstActivity.length > 0 && firstActivity.length <= 28);

  tickSimulation(state);
  tickSimulation(state);
  assert.equal(state.agents[0].activity, firstActivity);
  assert.equal(getConciseTaskLabel('build_house'), 'Construyendo casa');
  assert.equal(getConciseTaskLabel('extinguish_fire'), 'Apagando incendio');
  assert.equal(getConciseTaskLabel('caravan'), 'Caravana comercial');
});

test('Qwen 2.5 decide obras, exige operarios disponibles y construye casas solo si hacen falta', () => {
  const state = createInitialState();
  state.agents[0].inv.wood += 60;
  state.agents[0].inv.stone += 60;
  state.agents[0].inv.iron += 12;

  assert.equal(shouldBuildHouse(state), true); // Hay 10 sin casa

  const founding = interpretQwenDirective(
    'Construir plaza, puente y 2 casas',
    state.agents.map((a) => a.name)
  );
  applyQwenActions(state, founding.actions, spawnSettlers);
  assert.ok(state.plaza !== null);
  assert.ok(state.bridge !== null);
  assert.equal(state.houses.length, 2);

  // Cuando todos tienen casa y ninguna excede su capacidad, shouldBuildHouse es false
  for (const h of state.houses) {
    h.size = 'large';
    h.capacity = 8;
  }
  state.agents.forEach((ag, idx) => {
    ag.houseId = state.houses[idx % 2].id;
  });
  assert.equal(shouldBuildHouse(state), false);

  const econ = interpretQwenDirective(
    'Genera una economía, construir comercios, caminos y permite más aldeanos',
    state.agents.map((a) => a.name)
  );
  applyQwenActions(state, econ.actions, spawnSettlers);
  assert.equal(state.policies.economyFocus, true);
  assert.ok(state.specialBuildings.some((b) => b.type === 'bank'));
  assert.ok(state.specialBuildings.some((b) => b.type === 'market'));
  assert.ok(state.specialBuildings.some((b) => b.type === 'general_depot'));
  assert.ok(state.roads.length > 8);

  // Verificar compuerta estricta de operario: bloquear todos los adultos como Alcalde ocupados y pedir otro edificio
  const tinyState = createInitialState();
  tinyState.agents = [tinyState.agents[0]];
  tinyState.agents[0].inv.wood = 20;
  tinyState.agents[0].inv.stone = 20;
  const firstB = createSpecialBuilding(tinyState, 'bank', 'Mateo');
  assert.ok(firstB);
  assert.equal(hasAvailableOperatorForBuilding(tinyState, 'school'), false);
  const noOpSchool = createSpecialBuilding(tinyState, 'school', 'Mateo');
  assert.equal(noOpSchool, null);

  const direct = interpretQwenDirective('Mateo que sea herrero', state.agents.map((a) => a.name));
  applyQwenActions(state, direct.actions, spawnSettlers);
  const mateo = state.agents.find((a) => a.name === 'Mateo');
  assert.ok(mateo);
  assert.equal(mateo.job, 'Herrero');
  assert.notEqual(computeEra(200, [createHouseNearCenter(state, 'X', 'south'), ...state.houses]), 'primitive');
});

test('Matar cultivos, puente sobre río, caminos y pausa total de recursos', () => {
  const state = createInitialState();
  createFarmPlot(state, 'south');
  createFarmPlot(state, 'south');
  assert.equal(state.farms.length, 2);

  const firstPlot = state.farms[0];
  assert.ok(killCropPlotAt(state, firstPlot.x + 2, firstPlot.y - 2));
  assert.equal(state.farms.length, 1);
  assert.equal(killAllCrops(state), 1);
  assert.equal(state.farms.length, 0);

  for (const r of state.resources) {
    assert.equal(isPointInRiverWater(r.x, r.y, null), false);
  }
  assert.equal(addRoadTile(state, 720, RIVER_TOP_Y + 24), null);
  const bridge = createBridge(state, 'Mateo');
  assert.ok(addRoadTile(state, bridge.x, RIVER_TOP_Y + 24));
  createPlaza(state, 'Elena');
  createHouseNearCenter(state, 'Elena', 'north');
  assert.ok(buildBaseRoads(state) > 5);
  assert.equal(isNearRoad(state.roads, bridge.x, RIVER_TOP_Y + 24), true);

  state.resources = [];
  state.resourcesPaused = true;
  assert.equal(spawnResource(state, 'food', 200, 300), false);
  state.minute = 1439.9;
  tickSimulation(state, 1);
  assert.equal(state.resources.length, 0);
});

test('Viviendas: capacidades 4/6/8, baúl SOLO Alimento y Monedas con eliminación exclusiva y Depósito General', () => {
  const state = createInitialState();
  const hSmall = createHouseNearCenter(state, 'A', 'south', 'small');
  const hMed = createHouseNearCenter(state, 'B', 'south', 'medium');
  const hLarge = createHouseNearCenter(state, 'C', 'south', 'large');
  assert.equal(hSmall.capacity, HOUSE_SIZE_CAPACITIES.small);
  assert.equal(hMed.capacity, HOUSE_SIZE_CAPACITIES.medium);
  assert.equal(hLarge.capacity, HOUSE_SIZE_CAPACITIES.large);
  assert.equal(hSmall.capacity, 4);
  assert.equal(hMed.capacity, 6);
  assert.equal(hLarge.capacity, 8);

  // El usuario NO puede agregar ítems al baúl de la casa ni guardar madera/piedra/oro
  assert.equal(modifyHouseStorage(state, hSmall.id, 'food', 5, true), false);
  assert.equal(modifyHouseStorage(state, hSmall.id, 'wood', -1, true), false);
  hSmall.storage.food = 4;
  assert.equal(modifyHouseStorage(state, hSmall.id, 'food', -1, true), true);
  assert.equal(hSmall.storage.food, 3);

  // Depositar lleva food & coins a casa, y materiales al Depósito General
  state.agents[0].inv.wood = 10;
  state.agents[0].inv.stone = 10;
  const depot = createSpecialBuilding(state, 'general_depot', 'Mateo')!;
  assert.ok(depot);
  const agent = state.agents[1];
  agent.houseId = hMed.id;
  agent.inv.food = 5;
  agent.inv.wood = 4;
  agent.inv.copper = 3;
  agent.coins = 30;

  depositResourcesToHouse(agent, hMed, 'all', depot);
  assert.equal(agent.inv.food, 0);
  assert.equal(agent.coins, 0);
  assert.equal(hMed.storage.food, 6); // 1 inicial + 5
  assert.equal(hMed.storage.coins, 30);
  assert.equal(hMed.storage.wood, 0); // Nunca guarda materiales en casa
  assert.equal(depot.storage.wood, 4);
  assert.equal(depot.storage.copper, 3);

  // Co-habitación familiar: si se excede capacidad (4 en chica), se mudan o independiza hijo adulto mayor
  const soloState = createInitialState();
  const sHouse = createHouseNearCenter(soloState, 'Padre', 'south', 'small');
  const overflowHouse = createHouseNearCenter(soloState, 'Extra', 'south', 'small');
  for (let i = 0; i < 6; i++) {
    soloState.agents[i].houseId = sHouse.id;
    soloState.agents[i].parents = 'Padre & Madre';
    soloState.agents[i].ageYears = 18 + i;
  }
  rebalanceFamilyHousing(soloState);
  assert.ok(soloState.agents.filter((a) => a.houseId === sHouse.id).length <= sHouse.capacity);
  assert.ok(soloState.agents.some((a) => a.houseId === overflowHouse.id));
});

test('Sin casa no puede descansar y pierde energía/salud cada día', () => {
  const state = createInitialState();
  const homeless = state.agents[0];
  homeless.houseId = null;
  assert.equal(canAgentRest(homeless), false);

  const energyBefore = homeless.energy;
  const healthBefore = homeless.health;
  state.minute = 1280;
  homeless.taskType = 'sleep';
  homeless.taskTimer = 30;
  for (let i = 0; i < 20; i++) tickSimulation(state, 0.1);
  assert.notEqual(homeless.taskType, 'sleep'); // No puede dormir sin casa

  advanceDayAging(state);
  assert.ok(homeless.energy < energyBefore);
  assert.ok(homeless.health < healthBefore);
});

test('25 Skills, solo Saber General editable por jugador, 3 Maestrías máx y minería por skills', () => {
  assert.equal(VILLAGE_SKILLS.length, 25);
  assert.equal(computeUnlockedSkills(100).length, 25);

  const state = createInitialState();
  const a1 = state.agents[0];
  const eduBefore = a1.education;

  // Jugador solo modifica Saber General
  assert.equal(modifyAgentKnowledge(state, a1.id, 20, 'carpentry'), null);
  assert.equal(modifyAgentKnowledge(state, a1.id, 20, 'construction'), null);
  const msg = modifyAgentKnowledge(state, a1.id, 20, 'general');
  assert.ok(msg);
  assert.equal(a1.education, eduBefore + 20);

  // Máximo 3 oficios Maestro (>70%)
  advanceJobMastery(a1, 'Herrero', 85);
  advanceJobMastery(a1, 'Carpintero', 85);
  advanceJobMastery(a1, 'Minero', 85);
  advanceJobMastery(a1, 'Comerciante', 95); // 4to debe quedar en tope Comerciante (70%)
  assert.equal(Object.values(a1.jobMastery).filter((v) => (v ?? 0) > 70).length, MAX_MAESTRO_JOBS_PER_AGENT);
  assert.equal(a1.jobMastery.Comerciante, 70);
  assert.equal(getJobMasteryTierLabel(25), 'Operario');
  assert.equal(getJobMasteryTierLabel(55), 'Comerciante');
  assert.equal(getJobMasteryTierLabel(85), 'Maestro');

  // Minerales desbloqueados por skills
  a1.education = 4;
  modifyAgentKnowledge(state, a1.id, 4, 'general'); // 8% -> mineria_cobre
  assert.equal(canGatherOrTradeMineral(a1, 'copper'), true);
  assert.equal(canGatherOrTradeMineral(a1, 'gold'), false);

  a1.carpentryKnowledge = 50;
  a1.job = 'Carpintero';
  assert.equal(canCarpenterUseWood(a1, 'maple'), true);
  assert.equal(canCarpenterUseWood(a1, 'oak'), false);
  assert.ok(getEmotionWorkMultiplier('excited') > 1.2);
  assert.ok(getEmotionWorkMultiplier('depressed') < 0.8);
});

test('Edificios especiales: depósito estricto, propietario exclusivo, competencia hasta 3 y transferencia', () => {
  const state = createInitialState();
  state.agents[0].inv.wood = 20;
  state.agents[0].inv.stone = 20;

  const dock = createSpecialBuilding(state, 'dock', 'Mateo')!;
  assert.ok(dock);
  assert.deepEqual(dock.allowedStorage, ['food', 'coins']);
  assert.equal(modifySpecialBuildingStorage(state, dock.id, 'gold', 5), false); // Bloqueado en Muelle
  assert.equal(modifySpecialBuildingStorage(state, dock.id, 'food', 3), true);
  assert.ok(dock.ownerId !== null);

  // Competencia comercial: hasta 3 panaderías
  const b1 = createSpecialBuilding(state, 'bakery', 'Mateo')!;
  const b2 = createSpecialBuilding(state, 'bakery', 'Lucas')!;
  assert.ok(b1 && b2);
  assert.equal(getCompetingBuildingCount(state, 'bakery'), 2);
  assert.notEqual(b1.ownerId, b2.ownerId);

  // Transferencia de propiedad manual y autónoma (Qwen 2.5)
  const newOwner = state.agents[5];
  assert.equal(transferBuildingOwnership(state, b1.id, newOwner.id, 'venta directa'), true);
  assert.equal(b1.ownerId, newOwner.id);

  // Compraventa autónoma cuando el propietario está exhausto/triste y otro aldeano sabio tiene monedas
  newOwner.happiness = 20;
  const buyer = state.agents[6];
  buyer.assignedBuildingId = null;
  buyer.education = 40;
  buyer.coins = b1.price + 20;
  assert.equal(rebalanceBuildingOwnership(state), 1);
  assert.equal(b1.ownerId, buyer.id);
});

test('Recursos finitos y cardumen se agotan y renuevan solo tras reposo', () => {
  const state = createInitialState();
  state.resources = [
    {
      id: 999,
      type: 'food',
      x: 500,
      y: 500,
      amount: 1,
      maxAmount: 5,
      depleted: true,
      restTimer: 1,
    },
  ];
  state.riverFishStock = 0;
  state.riverFishRestTimer = 1;

  for (let i = 0; i < 6; i++) tickSimulation(state, 1);
  assert.equal(state.resources[0].depleted, false);
  assert.equal(state.resources[0].amount, state.resources[0].maxAmount);
  assert.ok(state.riverFishStock > 0);
});

test('Leyes, Comisaría + Cárcel y Peticiones del Representante cada 30 min ("Fue Escuchado" / "No fue Escuchado")', () => {
  assert.equal(PETITION_INTERVAL_SECONDS, 1800);
  const state = createInitialState();
  state.agents[0].inv.wood = 30;
  state.agents[0].inv.stone = 30;

  createSpecialBuilding(state, 'police_station', 'Mateo');
  createSpecialBuilding(state, 'prison', 'Lucas');
  toggleVillageLaw(state, 'ban_fishing', true, 'Jugador');
  assert.equal(enforceLawViolation(state, state.agents[4], 'ban_fishing'), true);
  assert.equal(state.agents[4].jailedDays, 2);

  const rep = electRepresentative(state);
  assert.ok(rep);

  // Petición constructiva: "Fue Escuchado" mejora ánimo y reanuda simulación
  state.speed = 2;
  const pPos = createVillagePetition(state, false)!;
  assert.ok(pPos);
  assert.equal(state.speed, 0);
  assert.equal(state.autoPausedByPetition, true);
  const happyBefore = state.agents[0].happiness;
  resolvePetition(state, true);
  assert.equal(state.pendingPetition, null);
  assert.equal(state.speed, 2);
  assert.ok(state.agents[0].happiness >= happyBefore);

  // Petición negativa: escucharla daña ánimo/salud, rechazarla ("No fue Escuchado") protege
  const pNeg = createVillagePetition(state, true)!;
  assert.equal(pNeg.isNegative, true);
  const happyBeforeNeg = state.agents[0].happiness;
  resolvePetition(state, true);
  assert.ok(state.agents[0].happiness < happyBeforeNeg);
});

test('Tormentas eléctricas, incendios, préstamos bancarios, contratos de aprendizaje, desgaste y Consejo de Ancianos', () => {
  const state = createInitialState();
  state.agents[0].inv.wood = 40;
  state.agents[0].inv.stone = 40;
  createHouseNearCenter(state, 'Mateo', 'south');
  createSpecialBuilding(state, 'bank', 'Mateo');

  // Préstamos e impuestos
  const borrower = state.agents[3];
  borrower.job = 'Constructor';
  const loan = grantBankLoan(state, borrower, 15, 'obra');
  assert.ok(loan);
  assert.ok(borrower.loanDebt > 0);
  borrower.coins = 30;
  collectTaxesAndRepayLoans(state);
  assert.ok(borrower.loanDebt < loan.remaining + 1);

  // Aprendizaje Maestro-Aprendiz
  state.agents[0].education = 75;
  state.agents[5].job = 'Aprendiz';
  state.agents[5].education = 8;
  assert.ok(assignMentorships(state) >= 1);
  assert.equal(state.agents[5].mentorId, state.agents[0].id);

  // Tormenta eléctrica, fuego y extinción
  const fire = triggerLightningStorm(state)!;
  assert.ok(fire);
  assert.equal(state.weather, 'thunderstorm');
  assert.equal(state.fires.length, 1);
  assert.equal(extinguishFire(state, fire.id, state.agents[1]), true);
  assert.equal(state.fires.length, 0);

  // Desgaste y reparación
  applyBuildingWear(state);
  assert.ok(state.houses[0].durability < 100);
  state.houses[0].durability = 50;
  state.agents[0].inv.wood = 4;
  state.agents[0].inv.stone = 4;
  assert.ok(repairDamagedStructures(state, state.agents[0]) >= 1);
  assert.ok(state.houses[0].durability > 50);

  // Consejo de Ancianos
  for (let i = 0; i < 4; i++) {
    state.agents.push(createAgent(900 + i, `Consejo${i}`, 'M', 400, 400));
  }
  state.day = 12;
  state.season = 'Invierno';
  for (const ag of state.agents) ag.inv.food = 0;
  for (const h of state.houses) h.storage.food = 0;
  runCouncilOfElders(state);
  assert.equal(state.laws.some((l) => l.id === 'winter_rationing' && l.active), true);
});

test('Economía respaldada en Oro y Plata, Crónica ilimitada en estado, Defensa, Taming, Eliminación y Velocidades x2/x4', () => {
  assert.equal(CANVAS_WIDTH, 1440);
  assert.equal(CANVAS_HEIGHT, 960);
  assert.equal(getTerrainZoneAt(FOREST_MAX_X - 40), 'forest');
  assert.equal(getTerrainZoneAt(MOUNTAIN_MIN_X + 40), 'mountain');

  const state = createInitialState();
  assert.equal(mintBackedCoins(state, 5), 0);
  addPreciousMetalToReserve(state, 'gold', 1);
  addPreciousMetalToReserve(state, 'silver', 1);
  assert.equal(state.economyReserve.backedCoinsCapacity, 120 + GOLD_COIN_BACKING + SILVER_COIN_BACKING);
  assert.equal(mintBackedCoins(state, 50), 35);

  const sBank = createSpecialBuilding(state, 'bank', 'Test')!;
  assert.equal(isBuildingOperational(state, 'bank'), true);
  deleteSpecialBuilding(state, sBank.id);

  // Crónicas hasta 80 en estado (el panel UI EventLogPanel muestra máx 20)
  for (let i = 0; i < 30; i++) addLog(state, `Evento ${i}`, 'slate');
  assert.ok(state.logs.length >= 25);

  // Defensa y doma
  const defender = state.agents[0];
  defender.toolsCount = 1;
  const bear = createAnimal(state, 'bear', defender.x + 8, defender.y);
  assert.ok(defendAgainstWildAnimal(state, defender, bear).damageDealt >= 20);
  defender.education = 55;
  assert.equal(tameWildAnimal(state, bear, defender), true);

  // Fauna completa incluyendo 4 peces
  const variants = FISH_VARIANTS.map((v) => createAnimal(state, 'fish', undefined, undefined, v).fishVariant);
  assert.deepEqual(variants, FISH_VARIANTS);

  // Herramientas desde 36% saber
  defender.education = 36;
  defender.inv.iron = 1;
  assert.equal(craftToolsForAgent(state, defender), true);

  // Eliminación desde inspector
  const house = createHouseNearCenter(state, 'Mateo', 'south');
  assert.equal(deleteHouse(state, house.id), true);
  createPlaza(state, 'Mateo');
  assert.equal(deletePlaza(state), true);
  createBridge(state, 'Lucas');
  assert.equal(deleteBridge(state), true);
  const farm = createFarmPlot(state, 'south');
  assert.equal(deleteFarmPlotById(state, farm.id), true);
  assert.equal(deleteAnimal(state, bear.id), true);

  // Velocidades x2 y x4
  assert.equal(SPEED_TIMINGS[2].daySeconds, 300);
  assert.equal(SPEED_TIMINGS[2].nightSeconds, 90);
  assert.equal(SPEED_TIMINGS[4].daySeconds, 150);
  assert.equal(SPEED_TIMINGS[4].nightSeconds, 60);
  const s2 = createInitialState();
  s2.speed = 2;
  s2.minute = DAY_START_MINUTE;
  for (let i = 0; i < 300; i++) tickSimulation(s2, 1);
  assert.ok(Math.abs(s2.minute - NIGHT_START_MINUTE) < 0.05);

  // Cambiar de pareja y recursos negativos
  state.agents[0].partnerId = state.agents[1].id;
  state.agents[1].partnerId = state.agents[0].id;
  assert.equal(switchPartnerForAgent(state, state.agents[0].id, 'prueba').switched, true);
  assert.equal(consumeConstructionResources(state, state.agents[0], { stone: 999 }), false);
  const f1 = createFarmPlot(state, 'south');
  assert.ok(f1.id > 0);
  const mRes = modifyAgentResource(state, state.agents[0].id, 'copper', 2);
  assert.ok(mRes && mRes.includes('cobre'));
});
