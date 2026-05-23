function roundRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const rad = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
}

export class GuitarRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render(landmarks, activeStrings = [true, true, true, true, true, true]) {
    if (!landmarks || landmarks.length < 21) return;

    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    const wrist = landmarks[0];
    const mid = landmarks[9];
    const wx = wrist.x * W;
    const wy = wrist.y * H;
    const mx = mid.x * W;
    const my = mid.y * H;

    const span = Math.hypot(mx - wx, my - wy);
    if (span < 8) return;

    const scale = span * 3.0;
    const angle = Math.atan2(my - wy, mx - wx) + Math.PI / 2;

    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(angle);

    const neckW = scale * 0.08;
    const neckH = scale * 0.65;
    const neckX = -neckW / 2;
    const neckY = -neckH;

    ctx.beginPath();
    roundRect(ctx, neckX, neckY, neckW, neckH, 4);
    ctx.fillStyle = 'rgba(80, 180, 255, 0.25)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(150, 220, 255, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 12; i++) {
      const fy = neckY + (i / 13) * neckH;
      ctx.beginPath();
      ctx.moveTo(neckX, fy);
      ctx.lineTo(neckX + neckW, fy);
      ctx.stroke();
    }

    const bW = scale * 0.45;
    const bH = scale * 0.38;
    const bY = scale * 0.02;

    ctx.save();
    ctx.translate(0, bY);

    ctx.beginPath();
    ctx.moveTo(0, -bH * 0.1);
    ctx.bezierCurveTo(bW * 0.15, -bH * 0.15, bW * 0.45, -bH * 0.1, bW * 0.48, bH * 0.08);
    ctx.bezierCurveTo(bW * 0.5, bH * 0.25, bW * 0.48, bH * 0.6, bW * 0.38, bH * 0.8);
    ctx.bezierCurveTo(bW * 0.28, bH * 0.95, bW * 0.1, bH * 1.0, 0, bH * 0.98);
    ctx.bezierCurveTo(-bW * 0.1, bH * 1.0, -bW * 0.28, bH * 0.95, -bW * 0.38, bH * 0.8);
    ctx.bezierCurveTo(-bW * 0.48, bH * 0.6, -bW * 0.5, bH * 0.25, -bW * 0.48, bH * 0.08);
    ctx.bezierCurveTo(-bW * 0.45, -bH * 0.1, -bW * 0.18, -bH * 0.18, -bW * 0.08, -bH * 0.05);
    ctx.bezierCurveTo(-bW * 0.05, -bH * 0.02, 0, -bH * 0.05, 0, -bH * 0.1);
    ctx.closePath();

    ctx.fillStyle = 'rgba(20, 100, 255, 0.22)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(80, 180, 255, 0.88)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowColor = 'rgba(60, 160, 255, 0.6)';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(60, 160, 255, 0.4)';
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.7)';
    ctx.lineWidth = 1;
    const pickupW = bW * 0.55;
    const pickupH = bH * 0.07;
    [0.2, 0.38, 0.56].forEach((py) => {
      const px = -pickupW / 2;
      const pY = bH * py;
      ctx.beginPath();
      roundRect(ctx, px, pY, pickupW, pickupH, 2);
      ctx.fill();
      ctx.stroke();
    });

    ctx.restore();

    const stringColors = ['#cccccc', '#ccccaa', '#dddd88', '#eeee66', '#ffee44', '#ffcc22'];
    const stringWidths = [2.0, 1.8, 1.5, 1.2, 1.0, 0.8];
    const stringXs = [
      -neckW * 0.35,
      -neckW * 0.21,
      -neckW * 0.07,
      neckW * 0.07,
      neckW * 0.21,
      neckW * 0.35,
    ];

    const bridgeY = bY + bH * 0.65;
    const nutY = neckY;

    stringXs.forEach((sx, i) => {
      ctx.beginPath();
      ctx.moveTo(sx, nutY);
      ctx.lineTo(sx, bridgeY);
      ctx.strokeStyle = stringColors[i];
      ctx.lineWidth = stringWidths[i];
      ctx.globalAlpha = activeStrings[i] ? 0.95 : 0.25;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    const hsY = neckY - scale * 0.12;
    ctx.beginPath();
    ctx.moveTo(-neckW * 0.6, neckY);
    ctx.lineTo(neckW * 0.6, neckY);
    ctx.lineTo(neckW * 0.5, hsY + scale * 0.04);
    ctx.lineTo(neckW * 0.15, hsY);
    ctx.lineTo(-neckW * 0.35, hsY);
    ctx.lineTo(-neckW * 0.6, neckY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(20, 100, 255, 0.28)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(80, 180, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = 'rgba(180, 230, 255, 0.9)';
    for (let i = 0; i < 3; i++) {
      const pegY = neckY - scale * 0.03 - i * scale * 0.04;
      ctx.beginPath();
      ctx.arc(-neckW * 0.65, pegY, scale * 0.012, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(neckW * 0.65, pegY, scale * 0.012, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
