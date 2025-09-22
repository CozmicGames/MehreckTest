
const canvas = document.getElementById("myCanvas");
let offsetX, offsetY;
let dataPoints = [];
let dataHandles = [];
let draggedHandle = null;

const categoryCountSlider = document.getElementById("categoryCountSlider");
const categoryCountValue = document.getElementById("categoryCountValue");
let currentCategoryCount = parseInt(categoryCountSlider.value, 10);

const scaleSlider = document.getElementById("scaleSlider");
const scaleValue = document.getElementById("scaleValue");
let currentScaleValue = parseInt(scaleSlider.value, 10);

categoryCountSlider.addEventListener("input", e => {
    currentCategoryCount = parseInt(e.target.value, 10);
    categoryCountValue.textContent = currentCategoryCount;
    setup(currentCategoryCount);
});

scaleSlider.addEventListener("input", e => {
    currentScaleValue = parseInt(e.target.value, 10);
    scaleValue.textContent = currentScaleValue;
    draw();
});

setup(currentCategoryCount);


/**
*   Setup graph
*/
function setup(categoryCount) {
    dataPoints = [];
    dataHandles = [];

    for (let i = 0; i < categoryCount; i++) {
        dataPoints.push(0.5);
        dataHandles.push({
            index: i,
            isValid: false
        })
    }

    window.addEventListener("resize", e => {
        canvas.width = window.innerWidth * 0.8;
        canvas.height = window.innerHeight * 0.8;
        draw();
    });

    canvas.addEventListener("mousedown", e => {
        onInputDown(e.clientX, e.clientY, 0);
    });

    canvas.addEventListener("mousemove", e => {
        onInputMove(e.clientX, e.clientY);
    });

    canvas.addEventListener("mouseup", () => {
        onInputUp();
    });

    canvas.addEventListener("touchstart", e => {
        onInputDown(e.clientX, e.clientY, 3);
    });

    canvas.addEventListener("touchmove", e => {
        onInputMove(e.clientX, e.clientY);
    });

    canvas.addEventListener("touchend", () => {
        onInputUp();
    });

    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    draw();
}

/**
 *  Input
 */
function onInputDown(x, y, size) {
    const rect = canvas.getBoundingClientRect();
    const inputX = x - rect.left;
    const inputY = y - rect.top;
    const graphRadius = getGraphRadius(canvas);

    for (let i = 0; i < categoryCount; i++) {
        const handle = dataHandles[i];
        const dataPoint = dataPoints[handle.index];
        const angle = getCategoryAngle(handle.index, categoryCount);

        const handleX = canvas.width / 2 + graphRadius * dataPoint * Math.cos(angle);
        const handleY = canvas.height / 2 + graphRadius * dataPoint * Math.sin(angle);
        
        const dx = inputX - handleX;
        const dy = inputY - handleY;

        if (dx * dx + dy * dy <= 8 * 8 + size * size) {
            draggedHandle = handle;
            offsetX = dx;
            offsetY = dy;
            break;
        }
    }
}

function onInputMove(x, y) {
    if (!draggedHandle) return;

    const rect = canvas.getBoundingClientRect();
    const inputX = x - rect.left - offsetX;
    const inputY = y - rect.top - offsetY;
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

    const APx = inputX - lineStart.x;
    const APy = inputY - lineStart.y;
    const ABx = lineEnd.x - lineStart.x;
    const ABy = lineEnd.y - lineStart.y;
    const ab2 = ABx * ABx + ABy * ABy;
    let t = (APx * ABx + APy * ABy) / ab2;
    t = Math.max(0, Math.min(1, t));

    dataPoints[draggedHandle.index] = t;

    draggedHandle.isValid = true;

    draw();
}

function onInputUp() {
    draggedHandle = null;
}

/**
*   Redraw everything
*/
function draw() {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGraph(canvas, dataHandles.map(handle => ({
        dataValue: dataPoints[handle.index],
        isValid: handle.isValid
    })), "red", getGraphRadius(canvas), false, currentScaleValue, 1000);
}







// Save project (JSON)
function saveProject() {
  //const json = JSON.stringify(shapes);
  //const blob = new Blob([json], { type: "application/json" });
  //const link = document.createElement("a");
  //link.href = URL.createObjectURL(blob);
  //link.download = "project.json";
  //link.click();
}
// Load project (JSON)
document.getElementById("fileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    //shapes = JSON.parse(evt.target.result);
    draw();
  };
  reader.readAsText(file);
});


