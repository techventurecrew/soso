// ==========================
// FILE: filters/skinSoftProfessional.js
// Professional beauty mode: soften skin without losing detail
// ==========================

export default function skinSoftProfessional(canvas) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;

  // Simple bilateral-like filter approximation: soften by averaging neighbors
  for (let y = 1; y < canvas.height - 1; y++) {
    for (let x = 1; x < canvas.width - 1; x++) {
      const idx = (y * canvas.width + x) * 4;
      const neighbors = [
        ((y-1) * canvas.width + (x-1)) * 4,
        ((y-1) * canvas.width + x) * 4,
        ((y-1) * canvas.width + (x+1)) * 4,
        (y * canvas.width + (x-1)) * 4,
        (y * canvas.width + (x+1)) * 4,
        ((y+1) * canvas.width + (x-1)) * 4,
        ((y+1) * canvas.width + x) * 4,
        ((y+1) * canvas.width + (x+1)) * 4,
      ];
      let r = 0, g = 0, b = 0;
      for (let n of neighbors) {
        r += d[n];
        g += d[n+1];
        b += d[n+2];
      }
      r /= 8; g /= 8; b /= 8;
      d[idx] = (d[idx] + r) / 2;
      d[idx+1] = (d[idx+1] + g) / 2;
      d[idx+2] = (d[idx+2] + b) / 2;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}
