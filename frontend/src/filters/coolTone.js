// ==========================
// FILE: filters/coolTone.js
// Cool blue filter
// ==========================

export default function coolTone(canvas) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;

  for (let i = 0; i < d.length; i += 4) {
    d[i+2] += 14; // add blue
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}
