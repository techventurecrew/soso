
// ==========================
// FILE: filters/animeSmooth.js
// Anime-like whitening + softening
// ==========================

export default function animeSmooth(canvas) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;

  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, d[i] * 1.1 + 10);
    d[i+1] = Math.min(255, d[i+1] * 1.1 + 10);
    d[i+2] = Math.min(255, d[i+2] * 1.15 + 20);
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}