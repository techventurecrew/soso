// ==========================
// FILE: filters/dreamBlur.js
// Instagram-style dream blur
// ==========================

export default function dreamBlur(canvas) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;

  // Simple Gaussian blur approximation: average with larger kernel
  const kernelSize = 15;
  const half = Math.floor(kernelSize / 2);
  const temp = new Uint8ClampedArray(d);

  for (let y = half; y < canvas.height - half; y++) {
    for (let x = half; x < canvas.width - half; x++) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const idx = ((y + ky) * canvas.width + (x + kx)) * 4;
          r += temp[idx];
          g += temp[idx + 1];
          b += temp[idx + 2];
          count++;
        }
      }
      const idx = (y * canvas.width + x) * 4;
      d[idx] = r / count;
      d[idx + 1] = g / count;
      d[idx + 2] = b / count;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}


