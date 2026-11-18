import { COLOURS } from './config.js';

export function createTitleScreen(canvas) {
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  function createSeededRandom(seed) {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  const stars = [];
  const NUM_STARS = 110;
  const starSeed = 42;
  const starRand = createSeededRandom(starSeed);
  for (let i = 0; i < NUM_STARS; i++) {
    stars.push({
      x: starRand() * WIDTH,
      y: starRand() * HEIGHT,
      radius: 0.5 + starRand() * 1.5,
      phase: starRand() * Math.PI * 2
    });
  }

  const motes = [];
  const NUM_MOTES = 26;
  const moteSeed = 123;
  const moteRand = createSeededRandom(moteSeed);
  for (let i = 0; i < NUM_MOTES; i++) {
    const colourIndex = Math.floor(moteRand() * 4);
    const baseRadius = 90 + moteRand() * 240;
    const speed = 0.15 + moteRand() * 0.35;
    const direction = moteRand() > 0.5 ? 1 : -1;
    const angularSpeed = (speed * direction) * 0.02; // scaled to rad/s
    const angleOffset = moteRand() * Math.PI * 2;
    const size = 5 + moteRand() * 5;
    const spiralRate = 0.02 + moteRand() * 0.03;
    motes.push({
      colourIndex,
      baseRadius,
      angularSpeed,
      angleOffset,
      size,
      spiralRate
    });
  }

  function drawTitle(t) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Background vertical gradient
    const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bg.addColorStop(0, '#070b1d');
    bg.addColorStop(0.5, '#0d1230');
    bg.addColorStop(1, '#05070f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 3 slow nebula radial blobs
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const nx = WIDTH * (0.25 + (i % 2) * 0.5);
      const ny = HEIGHT * 0.35;
      const nr = 280 + Math.sin(t * 0.03 + i) * 80;
      const grad = ctx.createRadialGradient(nx, ny, 10, nx, ny, nr * 1.2);
      grad.addColorStop(0, 'rgba(80,120,200,0.18)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    ctx.restore();

    // Twinkling stars
    ctx.globalAlpha = 1;
    for (let star of stars) {
      const flicker = 0.6 + Math.sin(t * 4 + star.phase) * 0.4;
      const r = star.radius * flicker;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Orbit scene
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2 - 30;
    for (let mote of motes) {
      const angle = mote.angleOffset + t * mote.angularSpeed;
      let r = mote.baseRadius;
      const spiral = t * mote.spiralRate + mote.angleOffset;
      const frac = spiral - Math.floor(spiral);
      r = mote.baseRadius * (1 - 0.55 * frac);
      // short arc trail
      ctx.strokeStyle = COLOURS[mote.colourIndex].hex;
      ctx.lineWidth = mote.size * 1.8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle - 0.35) * (r + mote.size), cy + Math.sin(angle - 0.35) * (r + mote.size));
      ctx.lineTo(cx + Math.cos(angle) * (r + mote.size), cy + Math.sin(angle) * (r + mote.size));
      ctx.stroke();
      // glow circle
      ctx.shadowBlur = 16;
      ctx.shadowColor = COLOURS[mote.colourIndex].hex;
      ctx.fillStyle = COLOURS[mote.colourIndex].hex;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, mote.size, 0, Math.PI * 2);
      ctx.fill();
      // white centre dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, mote.size * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Two dashed gravity rings rotating slowly
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.10;
    ctx.setLineDash([8, 12]);
    ctx.lineWidth = 3;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.02);
    ctx.beginPath();
    ctx.arc(0, 0, 190, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 118, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // The well at centre
    const wellGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26);
    wellGrad.addColorStop(0, '#ffffff');
    wellGrad.addColorStop(0.6, COLOURS[2].hex);
    wellGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = wellGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();

    // 3 rotating arc segments radius 34
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const rot = t * 0.6 + i * Math.PI * 2 / 3;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 0.6);
      ctx.stroke();
      ctx.restore();
    }

    // Soft halo radius 90 alpha 0.08
    const haloGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 90);
    haloGrad.addColorStop(0, 'transparent');
    haloGrad.addColorStop(1, 'rgba(55,213,232,0.08)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 90, 0, Math.PI * 2);
    ctx.fill();

    // Dim the scene slightly
    ctx.fillStyle = 'rgba(4,6,14,0.25)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Text
    ctx.font = '15px Arial';
    const titleText = 'A GRAVITY-WELL ARCADE';
    let textWidth = ctx.measureText(titleText).width;
    let x = (WIDTH - textWidth) / 2;
    const useLetterSpacing = typeof ctx.letterSpacing !== 'undefined';
    if (useLetterSpacing) {
      ctx.letterSpacing = '0.12em';
      ctx.fillStyle = '#8fa3cc';
      ctx.fillText(titleText, x, 150);
    } else {
      ctx.fillStyle = '#8fa3cc';
      const letters = titleText.split('');
      const letterSpacing = 3.5;
      let lx = x;
      for (let letter of letters) {
        ctx.fillText(letter, lx, 150);
        lx += ctx.measureText(letter).width + letterSpacing;
      }
    }

    // Title ORBWARDEN
    ctx.font = '800 96px Arial';
    const orbText = 'ORBWARDEN';
    const orbGrad = ctx.createLinearGradient(0, 245, 0, 245 + 96);
    orbGrad.addColorStop(0, '#ffffff');
    orbGrad.addColorStop(1, COLOURS[2].hex);
    ctx.fillStyle = orbGrad;
    ctx.shadowBlur = 24;
    ctx.shadowColor = COLOURS[2].hex;
    textWidth = ctx.measureText(orbText).width;
    x = (WIDTH - textWidth) / 2;
    ctx.fillText(orbText, x, 245);
    ctx.shadowBlur = 0;

    // Tagline
    ctx.font = 'italic 21px Arial';
    ctx.fillStyle = '#c7d2ee';
    const tagText = "Bend the drift. Feed the well its colour.";
    textWidth = ctx.measureText(tagText).width;
    x = (WIDTH - textWidth) / 2;
    ctx.fillText(tagText, x, 292);

    // Colour row at y 348
    const colorRowY = 348;
    const dotSize = 18;
    const spacing = 520 / 4;
    for (let i = 0; i < 4; i++) {
      const col = COLOURS[i];
      const mx = WIDTH / 2 - 260 + i * spacing;
      const my = colorRowY;
      ctx.shadowBlur = 20;
      ctx.shadowColor = col.hex;
      ctx.fillStyle = col.hex;
      ctx.beginPath();
      ctx.arc(mx, my, dotSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(mx, my, dotSize * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = '12px Arial';
      ctx.fillStyle = '#8fa3cc';
      const name = col.name;
      textWidth = ctx.measureText(name).width;
      const nameX = mx - textWidth / 2;
      ctx.fillText(name, nameX, my + 28);
    }

    // Rules, starting y 430, line height 30
    ctx.font = '17px Arial';
    ctx.fillStyle = '#aebadd';
    const rules = [
      'Guide the well with the mouse or arrow keys — gravity pulls the motes in.',
      'Catch motes that match the well to score. Combos multiply up to ×8.',
      'Wrong colours and void shards cost shield. Gold motes feed any well.',
      'Reach 1,200 points before the 150-second drift ends.'
    ];
    let ruleY = 430;
    for (let rule of rules) {
      textWidth = ctx.measureText(rule).width;
      x = (WIDTH - textWidth) / 2;
      ctx.fillText(rule, x, ruleY);
      ruleY += 30;
    }

    // Prompt at y 640
    ctx.font = '700 19px Arial';
    const promptText = 'CLICK OR PRESS ENTER TO PLAY';
    textWidth = ctx.measureText(promptText).width;
    x = (WIDTH - textWidth) / 2;
    const promptAlpha = 0.6 + 0.4 * Math.sin(t * 3.2);
    ctx.fillStyle = `rgba(255,255,255,${promptAlpha})`;
    ctx.fillText(promptText, x, 640);

    // Footer at y 752
    ctx.font = '13px Arial';
    ctx.fillStyle = '#66779e';
    const footerText = 'P pause · M mute · R restart · Sound on after first click';
    textWidth = ctx.measureText(footerText).width;
    x = (WIDTH - textWidth) / 2;
    ctx.fillText(footerText, x, 752);
  }

  return { drawTitle };
}
