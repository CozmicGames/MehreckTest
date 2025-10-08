function getCategoryAngle(index, count) {
    const angleStep = (2 * Math.PI) / count;
    return (Math.PI  * 3 / 2 + index * angleStep) % (Math.PI * 2);
}

function getGraphRadius(canvas) {
    return Math.min(canvas.width, canvas.height)/2 - 10;
}

function getProfileColor(index, step = 137.508) {
  const hue = (index * step) % 360;
  const saturation = 80;
  const lightness = 40;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}