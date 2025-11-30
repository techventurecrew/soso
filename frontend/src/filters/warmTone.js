// ==========================
// FILE: filters/warmTone.js
// Warm orange filter
// ==========================

export default function warmTone(canvas) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;

  for (let i = 0; i < d.length; i += 4) {
    d[i] += 10;
    d[i+1] += 5;
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}


