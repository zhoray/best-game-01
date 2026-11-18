import { WIDTH, HEIGHT, COLOURS, GOLD_HEX, TARGET_SCORE } from './config.js';

function createSeededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return function () {
    hash = (hash * 9301 + 49297) % 233281;
    return (hash + 233281) % 233281 / 233281;
  };
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export function createOverScreen(canvas) {
  const ctx = canvas.getContext('2d');
  const numStars = 110;
  const stars = [];
  const starRandom = createSeededRandom('overstars');
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: starRandom() * WIDTH,
      y: starRandom() * HEIGHT,
      radius: starRandom() * 2.5 + 0.5,
      phase: starRandom() * Math.PI * 2
    });
  }
  const numEmbers = 14;
  const emberXs = [];
  const emberRandom = createSeededRandom('embers');
  for (let i = 0; i < numEmbers; i++) {
    emberXs.push(emberRandom() * WIDTH);
  }
  return {
    drawOver(view) {
      const {world, t} = view;
      const {score, bestCombo, won, colourIndex} = world;
      const activeColour = COLOURS[colourIndex].hex;
      const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      bgGrad.addColorStop(0, '#070b1d');
      bgGrad.addColorStop(0.5, '#0d1230');
      bgGrad.addColorStop(1, '#05070f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      for (let star of stars) {
        const alpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 2 + star.phase));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      const glowGrad = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 0, WIDTH / 2, HEIGHT / 2, Math.max(WIDTH, HEIGHT) * 0.65);
      glowGrad.addColorStop(0, activeColour);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.globalAlpha = 0.08;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.globalAlpha = 1;
      for (let i = 0; i < 14; i++) {
        const x = emberXs[i];
        const y = HEIGHT - ((t * 22 * (1 + (i % 5) * 0.13) + i * 173) % (HEIGHT + 40)) + 20;
        const colIndex = Math.floor((t * 0.5 + i) % 4);
        ctx.fillStyle = COLOURS[colIndex].hex;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(3,5,12,0.35)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      const panelX = WIDTH / 2;
      const panelY = HEIGHT / 2;
      const panelW = 560;
      const panelH = 300;
      ctx.fillStyle = 'rgba(10,14,30,0.88)';
      if (ctx.roundRect) {
        ctx.roundRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 20);
      } else {
        drawRoundedRect(ctx, panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 20);
      }
      ctx.fill();
      ctx.strokeStyle = activeColour;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      if (ctx.roundRect) {
        ctx.roundRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 20);
      } else {
        drawRoundedRect(ctx, panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 20);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 5;
      const titleY = panelY - panelH / 2 + 62;
      ctx.fillStyle = won ? GOLD_HEX : '#ff8fa3';
      ctx.font = '800 34px system-ui, sans-serif';
      ctx.fillText(won ? 'THE WELL PREVAILS' : 'THE DRIFT CLAIMS THE WELL', panelX, titleY);
      const scoreLabelY = panelY - panelH / 2 + 104;
      ctx.fillStyle = '#8fa3cc';
      ctx.font = '800 11px system-ui, sans-serif';
      ctx.fillText('SCORE', panelX, scoreLabelY);
      const scoreY = panelY - panelH / 2 + 152;
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 54px system-ui, sans-serif';
      ctx.fillText(score, panelX, scoreY);
      const comboY = panelY - panelH / 2 + 196;
      ctx.fillStyle = '#c7d2ee';
      ctx.font = '800 18px system-ui, sans-serif';
      ctx.fillText(`BEST COMBO ×${bestCombo}`, panelX, comboY);
      const msgY = panelY - panelH / 2 + 228;
      ctx.fillStyle = '#aebadd';
      ctx.font = '800 16px system-ui, sans-serif';
      ctx.fillText(won ? 'Target 1,200 — reached' : `Target 1,200 — missed by ${TARGET_SCORE - score}`, panelX, msgY);
      const promptY = panelY - panelH / 2 + 272;
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 16px system-ui, sans-serif';
      const promptAlpha = 0.55 + 0.45 * Math.sin(t * 4);
      ctx.globalAlpha = promptAlpha;
      ctx.fillText('PRESS R OR ENTER — PLAY AGAIN', panelX, promptY);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }
  };
}
