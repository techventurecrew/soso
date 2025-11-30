// ==========================
// FILE: filters/beautyGlow.js
// Soft glow + skin brightening
// ==========================

export default function beautyGlow(canvas) {
  const ctx = canvas.getContext('2d');
  let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let d = img.data;

  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, d[i] * 1.1 + 10);
    d[i+1] = Math.min(255, d[i+1] * 1.05 + 5);
    d[i+2] = Math.min(255, d[i+2] * 1.05 + 5);
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}
