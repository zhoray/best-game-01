import * as config from './config.js';
import * as worldMod from './world.js';
import * as inputMod from './input.js';
import * as audioMod from './audio.js';
import * as renderMod from './render.js';
import * as hudMod from './hud.js';
import * as screenMod from './screens.js';
import * as overMod from './over.js';
import * as shotsMod from './shots.js';
import { drawHud } from './hud.js';
const WIDTH = config.WIDTH;
const HEIGHT = config.HEIGHT;
const COLOURS = config.COLOURS;
const STEP = config.STEP;
const COLOUR_CYCLE_SECONDS = config.COLOUR_CYCLE_SECONDS;
const COLOUR_CYCLE_LATE_SECONDS = config.COLOUR_CYCLE_LATE_SECONDS;
const LATE_PHASE_REMAINING = config.LATE_PHASE_REMAINING;
let canvas, statusEl, renderer, ctx2d, titleScreen, overScreen, input, audio, fx, screen, world, cursor, pendingOver, lastStatusSecond, last, acc, elapsed;
canvas = document.getElementById('game');
statusEl = document.getElementById('status');
renderer = renderMod.createRenderer(canvas);
ctx2d = canvas.getContext('2d');
titleScreen = screenMod.createTitleScreen(canvas);
overScreen = overMod.createOverScreen(canvas);
input = inputMod.createInput(canvas);
audio = audioMod.createAudio();
canvas.addEventListener('pointerdown', () => audio.unlock());
fx = {particles: [], texts: [], shake: 0, flash: 0, flashColour: '#ffffff'};
function burst(x, y, colour, n, speed) {
  for (let i = 0; i < n; i++) {
    const vx = (Math.random() - 0.5) * speed;
    const vy = (Math.random() - 0.5) * speed;
    const life = 0.45 + Math.random() * 0.35;
    const maxLife = life;
    const size = 2 + Math.random() * 2.5;
    fx.particles.push({x, y, vx, vy, life, maxLife, colour, size});
  }
}
function floatText(x, y, text, colour, size) {
  fx.texts.push({x, y, life: 0.9, text, colour, size});
}
function updateFx(dt) {
  for (let i = fx.particles.length - 1; i >= 0; i--) {
    const p = fx.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= (1 - 2.2 * dt);
    p.vy *= (1 - 2.2 * dt);
    p.life -= dt;
    if (p.life <= 0) fx.particles.splice(i, 1);
  }
  for (let i = fx.texts.length - 1; i >= 0; i--) {
    const t = fx.texts[i];
    t.y -= 46 * dt;
    t.life -= dt;
    if (t.life <= 0) fx.texts.splice(i, 1);
  }
  fx.shake = Math.max(0, fx.shake - 60 * dt * fx.shake - 4 * dt);
  fx.flash = Math.max(0, fx.flash - 3 * dt);
}
function handleEvents(world, silent = false) {
  for (let i = 0; i < world.events.length; i++) {
    const e = world.events[i];
    if (e.type === 'catch') {
      burst(e.x, e.y, COLOURS[e.colour].hex, 14, 260);
      floatText(e.x, e.y - 14, '+' + e.points, COLOURS[e.colour].hex, 20 + Math.min(10, world.combo * 1.5));
      if (!silent) audio.catchSound(world.combo);
    } else if (e.type === 'gold') {
      burst(e.x, e.y, '#ffd94d', 22, 320);
      floatText(e.x, e.y - 14, '+150', '#ffd94d', 24);
      if (!silent) audio.gold();
    } else if (e.type === 'damage') {
      fx.shake = 14;
      fx.flash = 0.85;
      fx.flashColour = '#ff5470';
      burst(e.x, e.y, '#ff8fa3', 16, 300);
      if (!silent) audio.damage();
    } else if (e.type === 'shift') {
      if (!silent) audio.shift();
      floatText(world.well.x, world.well.y - 44, COLOURS[e.colour].name.toUpperCase(), COLOURS[e.colour].hex, 15);
    } else if (e.type === 'win') {
      if (!silent) audio.win();
      pendingOver = 0.9;
    } else if (e.type === 'lose') {
      if (!silent) audio.lose();
      pendingOver = 0.9;
    }
  }
  world.events.length = 0;
}
function startRun() {
  world = worldMod.createWorld((Date.now() % 2147483646) + 1);
  fx.particles.length = 0;
  fx.texts.length = 0;
  fx.shake = 0;
  fx.flash = 0;
  pendingOver = 0;
  cursor = {x: world.well.x, y: world.well.y};
  screen = 'playing';
  setStatus('Run started. Score 0 of 1200.');
}
function cycleLength() {
  return world && world.timeLeft <= LATE_PHASE_REMAINING ? COLOUR_CYCLE_LATE_SECONDS : COLOUR_CYCLE_SECONDS;
}
function effectiveTarget(dt) {
  let dx = 0, dy = 0;
  const speed = 560 * dt;
  if (input.held.has('ArrowLeft') || input.held.has('KeyA')) dx -= speed;
  if (input.held.has('ArrowRight') || input.held.has('KeyD')) dx += speed;
  if (input.held.has('ArrowUp') || input.held.has('KeyW')) dy -= speed;
  if (input.held.has('ArrowDown') || input.held.has('KeyS')) dy += speed;
  if (dx !== 0 && dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx = dx / len * speed;
    dy = dy / len * speed;
  }
  cursor.x = Math.max(12, Math.min(WIDTH - 12, cursor.x + dx));
  cursor.y = Math.max(12, Math.min(HEIGHT - 12, cursor.y + dy));
  return cursor;
}
function updateStatusLine() {
  const secs = Math.ceil(world.timeLeft);
  if (secs !== lastStatusSecond) {
    lastStatusSecond = secs;
    setStatus('Score ' + world.score + ' of 1200, shield ' + world.shield + ', ' + secs + ' seconds left');
  }
}
function setStatus(s) {
  statusEl.textContent = s;
}
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  elapsed += dt;
  if (input.consume('mute')) {
    audio.setMuted(!audio.isMuted());
  }
  if (screen === 'title') {
    if (input.consume('confirm')) {
      audio.unlock();
      startRun();
    }
    titleScreen.drawTitle(elapsed);
  } else if (screen === 'playing') {
    if (input.consume('pause')) {
      screen = 'paused';
    } else {
      const tgt = effectiveTarget(dt);
      acc += dt;
      while (acc >= STEP) {
        worldMod.stepWorld(world, STEP, tgt);
        acc -= STEP;
      }
      handleEvents(world);
      if (pendingOver > 0) {
        pendingOver -= dt;
        if (pendingOver <= 0) {
          screen = 'over';
          setStatus(world.won ? 'You win. Final score ' + world.score : 'Game over. Final score ' + world.score);
        }
      }
      updateStatusLine();
    }
    renderer.drawGame({world, fx, t: elapsed, cycleLength: cycleLength()});
    drawHud(ctx2d, world, {t: elapsed, paused: false});
  } else if (screen === 'paused') {
    if (input.consume('pause') || input.consume('confirm')) {
      screen = 'playing';
    }
    if (input.consume('restart')) {
      startRun();
    }
    renderer.drawGame({world, fx, t: elapsed, cycleLength: cycleLength()});
    drawHud(ctx2d, world, {t: elapsed, paused: true});
  } else if (screen === 'over') {
    if (input.consume('confirm') || input.consume('restart')) {
      startRun();
    }
    overScreen.drawOver({world, t: elapsed});
  }
  updateFx(screen === 'paused' ? 0 : dt);
}
last = performance.now();
acc = 0;
elapsed = 0;
const shot = shotsMod.parseShot(location.search);
if (shot) {
  if (shot.name === 'title') {
    titleScreen.drawTitle(3.2);
  } else {
    world = worldMod.createWorld(shot.seed);
    const plan = shotsMod.SHOT_PLAN[shot.name] || shotsMod.SHOT_PLAN.play;
    if (plan.warm) {
      for (let i = 0; i < plan.warm; i++) {
        worldMod.stepWorld(world, STEP, shotsMod.autopilotTarget(plan.pilot, world));
        handleEvents(world, true);
        if (world.shield < 3) world.shield = 3;
        if (world.over) {
          world = worldMod.createWorld(shot.seed);
          break;
        }
      }
    }
    if (plan.rig) shotsMod.rigEndWorld(world);
    for (let i = 0; i < plan.steps; i++) {
      worldMod.stepWorld(world, STEP, shotsMod.autopilotTarget(plan.pilot, world));
      handleEvents(world, false);
    }
    updateFx(0.3);
    updateFx(0.3);
    if (shot.name === 'end') {
      overScreen.drawOver({world, t: world.time});
    } else {
      renderer.drawGame({world, fx, t: world.time, cycleLength: cycleLength()});
      drawHud(ctx2d, world, {t: world.time, paused: false});
    }
  }
  window.__shotReady = true;
} else {
  requestAnimationFrame(frame);
}
setStatus('Orbwarden. Press Enter or click to play.');
