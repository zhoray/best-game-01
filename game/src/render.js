import { WIDTH, HEIGHT, COLOURS, GOLD_HEX, GRAVITY_RADIUS, WELL_RADIUS, MOTE_RADIUS, GOLD_RADIUS, SHARD_RADIUS, COMBO_CAP } from './config.js';

let stars;

const createStar = (i) => {
  let seed = i * 37.184;
  const x = 0.5 + Math.sin(seed) * 0.5;
  const y = 0.5 + Math.cos(seed * 1.618) * 0.5;
  const r = 1 + Math.abs(Math.sin(seed * 4)) * 2.5;
  const p = (seed * 100) % 360;
  return { x: x * WIDTH, y: y * HEIGHT, r, p };
};

const initStars = () => {
  stars = Array.from({ length: 90 }, (_, i) => createStar(i));
};

const createRenderer = (canvas) => {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  initStars();
  return {
    drawGame: (view) => {
      const {world, fx, t, cycleLength} = view;
      const {colourIndex, colourClock, combo, well, motes, shards} = world;
      const {particles, texts, shake, flash, flashColour} = fx;
      ctx.save();
      ctx.translate(Math.sin(t*91)* (fx.shake || 0), Math.cos(t*83)* (fx.shake || 0));
      const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      bgGrad.addColorStop(0, '#070b1d');
      bgGrad.addColorStop(0.5, '#0d1230');
      bgGrad.addColorStop(1, '#05070f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      for (let star of stars) {
        const alpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 2 + star.p));
        ctx.globalAlpha = alpha;
        ctx.fillRect(star.x, star.y, star.r, star.r);
      }
      ctx.globalAlpha = 1;
      const active = COLOURS[colourIndex].hex;
      const glowGrad = ctx.createRadialGradient(well.x, well.y, 0, well.x, well.y, 240);
      glowGrad.addColorStop(0, active);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.globalAlpha = 0.10;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = active;
      ctx.globalAlpha = 0.10 + 0.08 * Math.sin(t * 2.4);
      ctx.setLineDash([6, 10]);
      ctx.lineDashOffset = -t * 12;
      ctx.beginPath();
      ctx.arc(well.x, well.y, GRAVITY_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(well.x, well.y, GRAVITY_RADIUS * 0.62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = active;
      ctx.globalAlpha = 0.05;
      ctx.beginPath();
      ctx.arc(well.x, well.y, GRAVITY_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      for (let mote of motes) {
        const col = mote.gold ? GOLD_HEX : COLOURS[mote.colour].hex;
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.moveTo(mote.x - mote.vx * 0.09, mote.y - mote.vy * 0.09);
        ctx.lineTo(mote.x, mote.y);
        ctx.stroke();
        ctx.shadowBlur = 18;
        ctx.shadowColor = col;
        ctx.fillStyle = col;
        const r = mote.gold ? GOLD_RADIUS * (1 + 0.15 * Math.sin(t * 6 + mote.phase)) : MOTE_RADIUS;
        ctx.beginPath();
        ctx.arc(mote.x, mote.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(mote.x, mote.y, 3, 0, Math.PI * 2);
        ctx.fill();
        if (mote.gold) {
          ctx.strokeStyle = '#fff7cc';
          ctx.globalAlpha = 0.8;
          const cx = mote.x;
          const cy = mote.y;
          ctx.beginPath();
          ctx.moveTo(cx - 8, cy);
          ctx.lineTo(cx + 8, cy);
          ctx.moveTo(cx, cy - 8);
          ctx.lineTo(cx, cy + 8);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
      for (let shard of shards) {
        ctx.save();
        ctx.translate(shard.x, shard.y);
        ctx.rotate(shard.angle);
        ctx.fillStyle = '#2a0f1e';
        ctx.beginPath();
        const steps = 6;
        const outerR = SHARD_RADIUS;
        const innerR = SHARD_RADIUS * 0.55;
        const offset = Math.PI / 2;
        for (let i = 0; i < steps; i++) {
          const angle = i * Math.PI / 3 + offset;
          const r = i % 2 === 0 ? outerR : innerR;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ff5470';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ff8fa3';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      const nextCol = COLOURS[(colourIndex + 1) % 4].hex;
      ctx.strokeStyle = nextCol;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.85;
      const countdownEnd = -Math.PI / 2 + 2 * Math.PI * Math.max(0, Math.min(1, 1 - colourClock / cycleLength));
      ctx.beginPath();
      ctx.arc(well.x, well.y, WELL_RADIUS + 10, -Math.PI / 2, countdownEnd);
      ctx.stroke();
      ctx.strokeStyle = active;
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const startAngle = t * 1.5 + i * 2.094;
        const endAngle = startAngle + Math.PI * 0.9;
        ctx.beginPath();
        ctx.arc(well.x, well.y, WELL_RADIUS + 3, startAngle, endAngle);
        ctx.stroke();
      }
      const coreGrad = ctx.createRadialGradient(well.x, well.y, 0, well.x, well.y, WELL_RADIUS);
      coreGrad.addColorStop(0, '#fff');
      coreGrad.addColorStop(0.5, active);
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(well.x, well.y, WELL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      if (combo >= 3) {
        ctx.strokeStyle = active;
        ctx.globalAlpha = 0.25 + 0.5 * combo / COMBO_CAP;
        ctx.beginPath();
        ctx.arc(well.x, well.y, WELL_RADIUS + 6 + combo, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.globalAlpha = 1;
      for (let p of particles) {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.colour;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (let txt of texts) {
        ctx.font = `700 ${txt.size}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.globalAlpha = Math.min(1, txt.life * 2);
        ctx.fillStyle = txt.colour;
        ctx.fillText(txt.text, txt.x, txt.y);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
      ctx.restore();
      if (flash > 0) {
        ctx.fillStyle = flashColour;
        ctx.globalAlpha = flash * 0.35;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      return;
    }
  };
};

export { createRenderer };
