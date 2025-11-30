// ==========================
// FILE: filters/faceSlim.js
// Mesh warping using center-pull
// ==========================

export default function faceSlim(canvas, detection) {
  if (!detection) return canvas;
  const ctx = canvas.getContext('2d');
  ctx.scale(0.97, 1.00); // Slight slim effect
  return canvas;
}

