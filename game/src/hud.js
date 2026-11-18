import { WIDTH, HEIGHT, COLOURS, GOLD_HEX, TARGET_SCORE, RUN_SECONDS } from './config.js';

export function drawHud(ctx, world, view) {
  const {timeLeft, score, combo, bestCombo, shield, colourIndex} = world;
  const {t, paused} = view;
  const active = COLOURS[colourIndex];
  const next = COLOURS[(colourIndex + 1) % 4];

  ctx.textAlign = 'left';
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillStyle = '#8fa3cc';
  ctx.fillText('SCORE', 24, 28);

  ctx.font = '800 34px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(score), 24, 62);

  if (combo >= 2) {
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.fillStyle = active.hex;
    ctx.fillText('×' + combo + ' COMBO', 24, 88);
  }
  if (bestCombo > combo) {
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillStyle = '#8fa3cc';
    ctx.fillText('BEST ×' + bestCombo, 24, 108);
  }

  const targetX = WIDTH / 2 - 180;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.roundRect(targetX, 16, 360, 10, 5);
  ctx.fill();

  const fillWidth = 360 * Math.min(1, score / TARGET_SCORE);
  if (fillWidth >= 1) {
    const grad = ctx.createLinearGradient(targetX, 0, targetX + 360, 0);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, GOLD_HEX);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(targetX, 16, fillWidth, 10, 5);
    ctx.fill();
  }
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillStyle = '#8fa3cc';
  ctx.textAlign = 'center';
  ctx.fillText('TARGET 1200', WIDTH/2, 44);

  let seconds = Math.ceil(timeLeft);
  ctx.font = '800 30px system-ui';
  ctx.fillStyle = timeLeft <= 15 ? '#ff5470' : '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText(seconds, WIDTH - 24, 46);
  if (timeLeft <= 15) {
    const alpha = 0.65 + 0.35 * Math.sin(t * 8);
    ctx.globalAlpha = alpha;
    ctx.fillText(seconds, WIDTH - 24, 46);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.roundRect(WIDTH - 174, 54, 150, 5, 2);
  ctx.fill();

  const timeFill = 150 * (timeLeft / RUN_SECONDS);
  ctx.fillStyle = '#37d5e8';
  ctx.beginPath();
  ctx.roundRect(WIDTH - 174, 54, timeFill, 5, 2);
  ctx.fill();

  for (let i = 0; i < 3; i++) {
    const hx = 36 + i * 30;
    const hy = HEIGHT - 30;
    ctx.beginPath();
    for (let j = 0; j < 6; j++) {
      const angle = -Math.PI/2 + j * Math.PI / 3;
      const x = hx + 11 * Math.cos(angle);
      const y = hy + 11 * Math.sin(angle);
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    if (i < shield) {
      ctx.fillStyle = '#37d5e8';
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.stroke();
    }
  }

  ctx.textAlign = 'right';
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillStyle = '#8fa3cc';
  ctx.fillText('ACTIVE', WIDTH - 24, HEIGHT - 54);

  ctx.fillStyle = active.hex;
  ctx.beginPath();
  ctx.arc(WIDTH - 148, HEIGHT - 33, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '700 18px system-ui, sans-serif';
  ctx.fillStyle = active.hex;
  ctx.fillText(active.name.toUpperCase(), WIDTH - 24, HEIGHT - 27);

  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = '#8fa3cc';
  ctx.fillText('NEXT ' + next.name.toUpperCase(), WIDTH - 24, HEIGHT - 8);

  if (paused) {
    ctx.fillStyle = 'rgba(3,5,12,0.55)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = 'center';
    ctx.font = '700 28px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PAUSED — P TO RESUME', WIDTH/2, HEIGHT/2);
  }
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}
