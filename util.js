function getCategoryAngle(index, count) {
    const angleStep = (2 * Math.PI) / count;
    return (Math.PI  * 3 / 2 + index * angleStep) % (Math.PI * 2);
}

function getGraphRadius(canvas) {
    return Math.min(canvas.width, canvas.height)/2 - 10;
}