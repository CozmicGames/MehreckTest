
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
let shapes = []; // store all drawn shapes
let draggingShape = null;
let offsetX, offsetY;

const dataPoints = [];
const dataHandles = [];
let draggedHandle = null;

/*
*   Setup graph
*   Needs to be called at the beginning
*/
function setup(categoryCount) {
    for(let i = 0; i < categoryCount; i++) {
        dataPoints.push(0.5);
        dataHandles.push({
            index: i
        })
    }

    canvas.addEventListener("mousedown", e => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const graphRadius = getGraphRadius(canvas);

        for (let i = 0; i < categoryCount; i++) {
            const handle = dataHandles[i];
            const dataPoint = dataPoints[handle.index];
            const angle = getCategoryAngle(handle.index, categoryCount);

            const handleX = canvas.width / 2 + graphRadius * dataPoint * Math.cos(angle);
            const handleY = canvas.height / 2 + graphRadius * dataPoint * Math.sin(angle);
            
            const dx = mouseX - handleX;
            const dy = mouseY - handleY;

            if (dx * dx + dy * dy <= 8 * 8) {
                draggedHandle = handle;
                offsetX = dx;
                offsetY = dy;
                break;
            }
        }
    });

    canvas.addEventListener("mousemove", e => {
        if (!draggedHandle) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - offsetX;
        const mouseY = e.clientY - rect.top - offsetY;
        const graphRadius = getGraphRadius(canvas);

        const angle = getCategoryAngle(draggedHandle.index, categoryCount);
        
        const lineStart = {
            x: canvas.width / 2,
            y: canvas.height / 2
        }

        const lineEnd = {
            x: lineStart.x + graphRadius * Math.cos(angle),
            y: lineStart.y + graphRadius * Math.sin(angle)
        }

        const APx = mouseX - lineStart.x;
        const APy = mouseY - lineStart.y;
        const ABx = lineEnd.x - lineStart.x;
        const ABy = lineEnd.y - lineStart.y;
        const ab2 = ABx * ABx + ABy * ABy;
        let t = (APx * ABx + APy * ABy) / ab2;
        t = Math.max(0, Math.min(1, t));

        dataPoints[draggedHandle.index] = t;

        draw();
    });

    canvas.addEventListener("mouseup", () => {
        draggedHandle = null;
    });

    draw();
}

/*
*   Redraw everything
*/
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGraph(canvas, dataPoints, "red", getGraphRadius(canvas), false, 9, 4);
}







// Save project (JSON)
function saveProject() {
  const json = JSON.stringify(shapes);
  const blob = new Blob([json], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "project.json";
  link.click();
}
// Load project (JSON)
document.getElementById("fileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    shapes = JSON.parse(evt.target.result);
    draw();
  };
  reader.readAsText(file);
});


