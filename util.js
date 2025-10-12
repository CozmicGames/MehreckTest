const degToRad = d => d * Math.PI / 180;

const radToDeg = r => r * 180 / Math.PI;

const mod360 = n => ((n % 360) + 360) % 360;

function shortestAngleDelta(to, from) {
    const raw = mod360(to) - mod360(from);
    return raw > 180 ? raw - 360 : raw < -180 ? raw + 360 : raw;
}

const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

function shadeColor(color, percent) {
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
}

function getCategoryAngle(index, count) {
    const angleStep = (2 * Math.PI) / count;
    return (Math.PI * 3 / 2 + index * angleStep) % (Math.PI * 2);
}

function getGraphRadius(canvas) {
    return Math.min(canvas.width, canvas.height) / 2 - 80;
}

function getProfileColor(index, step = 137.508) {
  const hue = (index * step) % 360;
  const saturation = 80;
  const lightness = 40;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}