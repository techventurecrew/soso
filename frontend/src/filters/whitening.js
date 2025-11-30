// ==========================
// FILE: filters/whitening.js
// Face whitening via brightness + soft blur
// ==========================

export default function whitening(canvas) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] + 12);
    data[i+1] = Math.min(255, data[i+1] + 12);
    data[i+2] = Math.min(255, data[i+2] + 12);
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}


