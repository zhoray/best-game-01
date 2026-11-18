import { WIDTH, HEIGHT, COLOURS, GOLD_HEX, RUN_SECONDS, TARGET_SCORE, BASE_POINTS, GOLD_POINTS, COMBO_CAP, START_SHIELD, COLOUR_CYCLE_SECONDS, COLOUR_CYCLE_LATE_SECONDS, LATE_PHASE_REMAINING, WELL_RADIUS, CATCH_RADIUS, GRAVITY_RADIUS, GRAVITY_STRENGTH, MOTE_RADIUS, GOLD_RADIUS, SHARD_RADIUS, SPAWN_START, SPAWN_END, MOTE_SPEED_MIN, MOTE_SPEED_MAX, GOLD_CHANCE, SHARD_CHANCE, STEP } from './config.js';
import { createRng } from './random.js';

// helper functions
function createNormalMote(rng) {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    colour: rng.int(0, 4),
    gold: false,
    phase: rng.range(0, Math.PI * 2),
    wob: rng.range(0.8, 1.6)
  };
}

function createGoldMote(rng) {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    colour: -1,
    gold: true,
    phase: rng.range(0, Math.PI * 2),
    wob: rng.range(0.8, 1.6)
  };
}

function createShard(rng) {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    spin: rng.range(-6, 6),
    angle: rng.range(0, Math.PI * 2)
  };
}

function spawnOnEdge(edge, rng) {
  const r = rng.range(0, 1);
  switch (edge) {
    case 0: // top
      return { x: r * WIDTH, y: 0 };
    case 1: // right
      return { x: WIDTH, y: r * HEIGHT };
    case 2: // bottom
      return { x: r * WIDTH, y: HEIGHT };
    case 3: // left
      return { x: 0, y: r * HEIGHT };
    default:
      return { x: WIDTH / 2, y: HEIGHT / 2 };
  }
}

function spawnEntity(rng) {
  if (rng.chance(SHARD_CHANCE)) {
    return createShard(rng);
  } else if (rng.chance(GOLD_CHANCE)) {
    return createGoldMote(rng);
  } else {
    return createNormalMote(rng);
  }
}

export function createWorld(seed) {
  const rng = createRng(seed);
  return {
    rng,
    time: 0,
    timeLeft: RUN_SECONDS,
    score: 0,
    combo: 1,
    bestCombo: 1,
    shield: START_SHIELD,
    colourIndex: 0,
    colourClock: 0,
    spawnClock: 0.35,
    over: false,
    won: false,
    well: { x: WIDTH / 2, y: HEIGHT / 2 },
    motes: [],
    shards: [],
    events: []
  };
}

export function stepWorld(world, dt, input) {
  if (world.over) {
    return;
  }
  world.time += dt;
  world.timeLeft -= dt;
  // ease well toward input
  const tx = input.x ?? WIDTH / 2;
  const ty = input.y ?? HEIGHT / 2;
  world.well.x += (tx - world.well.x) * Math.min(1, dt * 10);
  world.well.y += (ty - world.well.y) * Math.min(1, dt * 10);
  const margin = WELL_RADIUS + 4;
  world.well.x = Math.max(margin, Math.min(WIDTH - margin, world.well.x));
  world.well.y = Math.max(margin, Math.min(HEIGHT - margin, world.well.y));
  // colour cycle
  world.colourClock += dt;
  const cycleLen = world.timeLeft <= LATE_PHASE_REMAINING ? COLOUR_CYCLE_LATE_SECONDS : COLOUR_CYCLE_SECONDS;
  if (world.colourClock >= cycleLen) {
    world.colourClock -= cycleLen;
    world.colourIndex = (world.colourIndex + 1) % 4;
    world.events.push({ type: 'shift', colour: world.colourIndex });
  }
  // spawning
  world.spawnClock -= dt;
  const progress = Math.max(0, Math.min(1, world.time / RUN_SECONDS));
  const interval = SPAWN_START + (SPAWN_END - SPAWN_START) * progress;
  if (world.spawnClock <= 0) {
    world.spawnClock = interval;
    const entity = spawnEntity(world.rng);
    const edge = Math.floor(world.rng.range(0, 4));
    const pos = spawnOnEdge(edge, world.rng);
    let aimX = world.well.x + world.rng.range(-260, 260);
    let aimY = world.well.y + world.rng.range(-260, 260);
    aimX = Math.max(0, Math.min(WIDTH, aimX));
    aimY = Math.max(0, Math.min(HEIGHT, aimY));
    const dx = aimX - pos.x;
    const dy = aimY - pos.y;
    const dist = Math.hypot(dx, dy) || 1;
    let speed = world.rng.range(MOTE_SPEED_MIN, MOTE_SPEED_MAX) * (1 + 0.6 * progress);
    let vx = (dx / dist) * speed;
    let vy = (dy / dist) * speed;
    if (entity.gold !== undefined) {  // mote
      entity.x = pos.x;
      entity.y = pos.y;
      entity.vx = vx;
      entity.vy = vy;
    } else {  // shard
      entity.x = pos.x;
      entity.y = pos.y;
      entity.vx = vx * 1.5;
      entity.vy = vy * 1.5;
    }
    if (entity.gold !== undefined) {
      world.motes.push(entity);
    } else {
      world.shards.push(entity);
    }
  }
  // update and filter motes
  world.motes = world.motes.filter(mote => {
    const dx = world.well.x - mote.x;
    const dy = world.well.y - mote.y;
    const dist = Math.hypot(dx, dy);
    if (dist < GRAVITY_RADIUS) {
      const factor = 1 - Math.min(1, dist / GRAVITY_RADIUS * 0.6);
      const accel = GRAVITY_STRENGTH * factor;
      mote.vx += (dx / dist) * accel * dt;
      mote.vy += (dy / dist) * accel * dt;
    } else {
      mote.phase += mote.wob * dt;
      const speed = Math.hypot(mote.vx, mote.vy) || 0.1;
      const perpX = -mote.vy / speed;
      const perpY = mote.vx / speed;
      const wobbleAmp = 20 * dt;
      mote.vx += perpX * wobbleAmp * Math.sin(mote.phase);
      mote.vy += perpY * wobbleAmp * Math.sin(mote.phase);
    }
    mote.x += mote.vx * dt;
    mote.y += mote.vy * dt;
    if (dist < CATCH_RADIUS) {
      let points = 0;
      let event = {};
      if (mote.gold) {
        points = GOLD_POINTS;
        event = { type: 'gold', points, x: mote.x, y: mote.y };
        world.score += GOLD_POINTS;
        world.combo = Math.min(COMBO_CAP, world.combo + 2);
      } else if (mote.colour === world.colourIndex) {
        points = BASE_POINTS * world.combo;
        event = { type: 'catch', points, colour: mote.colour, x: mote.x, y: mote.y };
        world.score += points;
        world.combo = Math.min(COMBO_CAP, world.combo + 1);
        world.bestCombo = Math.max(world.bestCombo, world.combo);
      } else {
        world.shield -= 1;
        world.combo = 1;
        event = { type: 'damage', cause: 'colour', x: mote.x, y: mote.y };
      }
      if (event.type) {
        world.events.push(event);
      }
      return false;
    }
    const margin = 60;
    if (mote.x < -margin || mote.x > WIDTH + margin || mote.y < -margin || mote.y > HEIGHT + margin) {
      return false;
    }
    return true;
  });
  // update and filter shards
  world.shards = world.shards.filter(shard => {
    shard.x += shard.vx * dt;
    shard.y += shard.vy * dt;
    shard.angle += shard.spin * dt;
    const dx = world.well.x - shard.x;
    const dy = world.well.y - shard.y;
    const dist = Math.hypot(dx, dy);
    if (dist < WELL_RADIUS + SHARD_RADIUS - 4) {
      world.shield -= 1;
      world.combo = 1;
      world.events.push({ type: 'damage', cause: 'shard', x: shard.x, y: shard.y });
      return false;
    }
    const margin = 60;
    if (shard.x < -margin || shard.x > WIDTH + margin || shard.y < -margin || shard.y > HEIGHT + margin) {
      return false;
    }
    return true;
  });
  // endings
  if (!world.over) {
    if (world.score >= TARGET_SCORE) {
      world.won = true;
      world.over = true;
      world.events.push({ type: 'win' });
    } else if (world.shield <= 0) {
      world.over = true;
      world.events.push({ type: 'lose', reason: 'shield' });
    } else if (world.timeLeft <= 0) {
      world.timeLeft = 0;
      world.over = true;
      world.events.push({ type: 'lose', reason: 'time' });
    }
  }
}
