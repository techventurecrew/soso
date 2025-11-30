// ==========================
// FILE: filters/colorPop.js
// Boost saturation
// ==========================

export default function colorPop(canvas) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    d[i] = Math.min(255, r * 1.1);
    d[i+1] = Math.min(255, g * 1.05);
    d[i+2] = Math.min(255, b * 1.1);
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}


