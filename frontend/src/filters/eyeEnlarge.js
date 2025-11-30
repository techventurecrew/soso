// ==========================
// FILE: filters/eyeEnlarge.js
// Face landmarks required
// ==========================

export default function eyeEnlarge(canvas, detection) {
  if (!detection) return canvas;
  const ctx = canvas.getContext('2d');
  ctx.scale(1.04, 1.04); // Slight enlarge
  return canvas;
}


