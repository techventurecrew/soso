
// ==========================
// FILE: filters/lutFilters.js
// Apply LUT (3D LUT simulated via 2D lookup or simple color transform)
// ==========================

// Simple LUT implementation: apply a color transform matrix or 1D LUT per channel.
export function applyLUT(canvas, lutName = 'vintage') {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;

  // Example 3 LUT presets (you can expand with more complex .png lookup textures)
  const luts = {
    vintage: (r,g,b) => [Math.min(255, r*0.9 + 20), Math.min(255, g*0.85 + 10), Math.min(255, b*0.7 + 30)],
    cinematic: (r,g,b) => [Math.min(255, r*1.05), Math.min(255, g*0.95), Math.min(255, b*0.9)],
    tealOrange: (r,g,b) => [Math.min(255, r*0.9 + 20), Math.min(255, g*0.85 + 10), Math.min(255, b*1.05)],
  };

  const fn = luts[lutName] || luts.vintage;

  for (let i = 0; i < d.length; i += 4) {
    const [nr, ng, nb] = fn(d[i], d[i+1], d[i+2]);
    d[i] = nr;
    d[i+1] = ng;
    d[i+2] = nb;
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

export default function lutVintage(canvas) {
  return applyLUT(canvas, 'vintage');
}

export function lutCinematic(canvas) {
  return applyLUT(canvas, 'cinematic');
}

export function lutTealOrange(canvas) {
  return applyLUT(canvas, 'tealOrange');
}



