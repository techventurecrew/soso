// ==========================
// FILE: filters/brownMoody.js
// Dark brown moody tone
// ==========================

export default function brownMoody(canvas) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;

  for (let i = 0; i < d.length; i += 4) {
    d[i] *= 0.85;
    d[i+1] *= 0.75;
    d[i+2] *= 0.6;
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}
