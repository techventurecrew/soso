
// ==========================
// FILE: filters/softPink.js
// Pinkish romantic tone
// ==========================

export default function softPink(canvas) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;

  for (let i = 0; i < d.length; i += 4) {
    d[i] += 10;
    d[i+1] -= 5;
    d[i+2] += 20;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
