export const parseShot = (search) => {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  if (!params.has('shot')) return null;
  const name = params.get('shot');
  const seed = parseInt(params.get('seed') || '1', 10);
  return { name, seed };
};
export const SHOT_PLAN = {
  play: { steps: 1800, pilot: 'chase' },
  frenzy: { warm: 6600, steps: 900, pilot: 'frenzy' },
  end: { steps: 300, pilot: 'chase', rig: true }
};
export const autopilotTarget = (kind, world) => {
  const isFrenzy = kind === 'frenzy';
  let bestMote = null;
  let bestDist = Infinity;
  const { well, motes = [], colourIndex } = world;
  for (let mote of motes) {
    if (mote.colour === colourIndex || mote.gold) {
      let dist = Math.hypot(mote.x - well.x, mote.y - well.y);
      if (isFrenzy && mote.gold) dist /= 2;
      if (dist < bestDist) {
        bestDist = dist;
        bestMote = mote;
      }
    }
  }
  if (bestMote) {
    let target = { x: bestMote.x, y: bestMote.y };
    if (isFrenzy) {
      const dx = bestMote.x - well.x;
      const dy = bestMote.y - well.y;
      const len = Math.hypot(dx, dy);
      if (len > 0.001) {
        const nx = -dy / len;
        const ny = dx / len;
        const sway = 60 * Math.sin(world.time * 10.7);
        target.x += nx * sway;
        target.y += ny * sway;
      }
    }
    return target;
  }
  return {
    x: 640 + 180 * Math.sin(world.time * 0.31),
    y: 400 + 120 * Math.sin(world.time * 0.43)
  };
};
export const rigEndWorld = (world) => {
  world.score = 1175;
  world.bestCombo = 9;
  world.combo = 4;
  world.timeLeft = 0.05;
};
