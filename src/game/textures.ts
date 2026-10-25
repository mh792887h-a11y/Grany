import * as THREE from 'three';

/**
 * Procedural Horror Canvas Textures
 * Creates zero-dependency, ultra-atmospheric textures for the horror house and Granny.
 */

export function createWoodFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base dark aged wood tone
  ctx.fillStyle = '#22150c';
  ctx.fillRect(0, 0, 512, 512);

  // Planks
  const plankHeight = 64;
  for (let y = 0; y < 512; y += plankHeight) {
    // Plank color variation
    const tone = Math.floor(25 + Math.random() * 15);
    ctx.fillStyle = `rgb(${tone + 10}, ${tone}, ${Math.floor(tone * 0.7)})`;
    ctx.fillRect(0, y, 512, plankHeight - 2);

    // Plank seams (dark gap)
    ctx.fillStyle = '#0a0502';
    ctx.fillRect(0, y + plankHeight - 2, 512, 2);

    // Wood grain lines
    ctx.strokeStyle = 'rgba(10, 5, 2, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      const gy = y + Math.random() * plankHeight;
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(150, gy + (Math.random() - 0.5) * 8, 350, gy + (Math.random() - 0.5) * 8, 512, gy);
      ctx.stroke();
    }

    // Nail marks
    ctx.fillStyle = '#111';
    for (let x = 30; x < 512; x += 160) {
      ctx.beginPath();
      ctx.arc(x, y + 8, 2, 0, Math.PI * 2);
      ctx.arc(x, y + plankHeight - 10, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Dirt & dried blood splatter
  for (let i = 0; i < 8; i++) {
    const bx = Math.random() * 512;
    const by = Math.random() * 512;
    const rad = 10 + Math.random() * 25;
    const grad = ctx.createRadialGradient(bx, by, 2, bx, by, rad);
    grad.addColorStop(0, 'rgba(50, 5, 5, 0.45)');
    grad.addColorStop(0.7, 'rgba(30, 2, 2, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bx, by, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createDecayingWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Sickly greenish-brown decayed wallpaper
  ctx.fillStyle = '#282b21';
  ctx.fillRect(0, 0, 512, 512);

  // Damask faded pattern
  ctx.strokeStyle = 'rgba(60, 65, 45, 0.35)';
  ctx.lineWidth = 2;
  for (let y = 30; y < 512; y += 64) {
    for (let x = 30; x < 512; x += 64) {
      ctx.strokeRect(x - 15, y - 15, 30, 30);
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Peeling plaster patches
  ctx.fillStyle = '#151713';
  for (let p = 0; p < 6; p++) {
    const px = Math.random() * 400;
    const py = Math.random() * 400;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + 40 + Math.random() * 50, py + 10);
    ctx.lineTo(px + 60, py + 70 + Math.random() * 40);
    ctx.lineTo(px - 10, py + 80);
    ctx.closePath();
    ctx.fill();
  }

  // Damp mold drips
  ctx.fillStyle = 'rgba(8, 12, 6, 0.6)';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 512;
    const h = 40 + Math.random() * 120;
    ctx.fillRect(x, 0, 3 + Math.random() * 4, h);
  }

  // Grime vignette around edges
  const edgeGrad = ctx.createLinearGradient(0, 0, 0, 512);
  edgeGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
  edgeGrad.addColorStop(0.2, 'rgba(0,0,0,0)');
  edgeGrad.addColorStop(0.8, 'rgba(0,0,0,0)');
  edgeGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createWarningWallTexture(message: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Decaying base
  ctx.fillStyle = '#22241d';
  ctx.fillRect(0, 0, 512, 512);

  // Scratch marks
  ctx.strokeStyle = '#11130e';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60);
    ctx.stroke();
  }

  // Scrawled Arabic bloody text
  ctx.font = 'bold 36px "Amiri", "Tajawal", serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(140, 15, 15, 0.85)';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 8;
  ctx.fillText(message, 256, 260);

  // Dripping blood lines
  ctx.fillStyle = 'rgba(120, 10, 10, 0.7)';
  for (let d = 0; d < 8; d++) {
    const dx = 120 + d * 38 + (Math.random() - 0.5) * 15;
    const dh = 20 + Math.random() * 60;
    ctx.fillRect(dx, 270, 2.5, dh);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGrannyFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Sickly ashen, mottled grey-green skin tone
  ctx.fillStyle = '#9c9b8f';
  ctx.fillRect(0, 0, 512, 512);

  // Deep wrinkles and mottled spots
  ctx.strokeStyle = 'rgba(40, 35, 30, 0.45)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 50; i++) {
    ctx.beginPath();
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 20, y + 10, x + 40, y - 5, x + 60, y + 15);
    ctx.stroke();
  }

  // Sunken dark eye sockets
  ctx.fillStyle = '#080605';
  ctx.beginPath();
  ctx.ellipse(170, 200, 48, 38, 0, 0, Math.PI * 2);
  ctx.ellipse(342, 200, 48, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  // Chilling glowing cataract milky white pupils
  ctx.fillStyle = '#e8f0f0';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(170, 200, 16, 0, Math.PI * 2);
  ctx.arc(342, 200, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Tiny blood-red pinhole center
  ctx.fillStyle = '#8b0000';
  ctx.beginPath();
  ctx.arc(170, 200, 4, 0, Math.PI * 2);
  ctx.arc(342, 200, 4, 0, Math.PI * 2);
  ctx.fill();

  // Twisted bloody mouth with broken teeth
  ctx.fillStyle = '#2b0505';
  ctx.beginPath();
  ctx.ellipse(256, 360, 90, 35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stitches and rotten yellow teeth
  ctx.fillStyle = '#c9b882';
  for (let t = 0; t < 8; t++) {
    const tx = 190 + t * 18;
    ctx.fillRect(tx, 345, 10, 14);
    ctx.fillRect(tx + 6, 365, 9, 13);
  }

  // Blood drips running down chin
  ctx.fillStyle = '#5c0606';
  for (let b = 0; b < 6; b++) {
    const bx = 200 + b * 22;
    ctx.fillRect(bx, 385, 4, 40 + Math.random() * 50);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGrannyRobeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Filthy ragged faded white nightgown
  ctx.fillStyle = '#a8a59b';
  ctx.fillRect(0, 0, 512, 512);

  // Faint faded gothic floral pattern
  ctx.fillStyle = '#878377';
  for (let y = 20; y < 512; y += 48) {
    for (let x = 20; x < 512; x += 48) {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Heavy dried blood splatters across gown
  ctx.fillStyle = 'rgba(100, 8, 8, 0.75)';
  for (let s = 0; s < 18; s++) {
    const sx = Math.random() * 512;
    const sy = Math.random() * 512;
    const r = 8 + Math.random() * 28;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();

    // Drips
    ctx.fillRect(sx - 2, sy, 4, 25 + Math.random() * 45);
  }

  // Grime bottom hem
  const hemGrad = ctx.createLinearGradient(0, 400, 0, 512);
  hemGrad.addColorStop(0, 'rgba(30, 25, 20, 0)');
  hemGrad.addColorStop(1, 'rgba(15, 10, 5, 0.9)');
  ctx.fillStyle = hemGrad;
  ctx.fillRect(0, 400, 512, 112);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createRustedMetalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3a3430';
  ctx.fillRect(0, 0, 256, 256);

  // Rust blotches
  for (let i = 0; i < 40; i++) {
    const rx = Math.random() * 256;
    const ry = Math.random() * 256;
    const rad = 5 + Math.random() * 20;
    const rGrad = ctx.createRadialGradient(rx, ry, 2, rx, ry, rad);
    rGrad.addColorStop(0, '#7c3818');
    rGrad.addColorStop(0.6, '#4e230f');
    rGrad.addColorStop(1, 'rgba(40, 20, 10, 0)');
    ctx.fillStyle = rGrad;
    ctx.beginPath();
    ctx.arc(rx, ry, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCodePaperTexture(code: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Yellowed weathered paper
  ctx.fillStyle = '#d8cb9a';
  ctx.fillRect(0, 0, 256, 256);

  // Burnt/stained edges
  const edgeGrad = ctx.createRadialGradient(128, 128, 60, 128, 128, 130);
  edgeGrad.addColorStop(0, 'rgba(0,0,0,0)');
  edgeGrad.addColorStop(0.8, 'rgba(80, 50, 20, 0.4)');
  edgeGrad.addColorStop(1, 'rgba(40, 20, 5, 0.85)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, 256, 256);

  // Bloody thumbprint
  ctx.fillStyle = 'rgba(120, 15, 15, 0.4)';
  ctx.beginPath();
  ctx.ellipse(200, 60, 20, 30, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Arabic Title and Code
  ctx.font = 'bold 20px "Amiri", serif';
  ctx.fillStyle = '#2a1a08';
  ctx.textAlign = 'center';
  ctx.fillText('رمز الباب الرئيسي', 128, 80);

  ctx.font = 'bold 44px monospace';
  ctx.fillStyle = '#8b0000';
  ctx.fillText(code, 128, 150);

  ctx.font = '14px "Tajawal", sans-serif';
  ctx.fillStyle = '#4a3a28';
  ctx.fillText('استخدمه في لوحة المفاتيح', 128, 195);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
