const canvas = document.getElementById("appCanvas");
let offsetX, offsetY;
let dataHandles = [];
let draggedHandle = null;
let profiles = [];
let currentProfileID = 0;

const categoryCount = 6;
const currentScaleValue = 5;

setup();

/**
*   Setup graph
*/
function setup() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    dataHandles = [];

    for (let i = 0; i < categoryCount; i++) {
        dataHandles.push({
            index: i
        });
    }

    window.addEventListener("resize", e => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        draw();
    });

    canvas.addEventListener("mousedown", e => {
        onInputDown(e.clientX, e.clientY, 0);
    });

    canvas.addEventListener("mousemove", e => {
        onInputMove(e.clientX, e.clientY, 0);
    });

    canvas.addEventListener("mouseup", () => {
        onInputUp();
    });

    canvas.addEventListener("touchstart", e => {
        onInputDown(e.clientX, e.clientY, 3);
    });

    canvas.addEventListener("touchmove", e => {
        onInputMove(e.clientX, e.clientY, 3);
    });

    canvas.addEventListener("touchend", () => {
        onInputUp();
    });

    draw();
}

function createProfile(id) {
    const profile = new Profile(id);
    profiles[id] = profile;

    for (let i = 0; i < categoryCount; i++) {
        profile.setDataPoint(i, 0.5);
    }

    return profile;
}

function removeProfile(id) {
    profiles[id] = null;
}

/**
 *  Input
 */
function onInputDown(x, y, size) {
    let currentProfile = profiles[currentProfileID];

    if (currentProfile == null)
        return;

    const rect = canvas.getBoundingClientRect();
    const inputX = x - rect.left;
    const inputY = y - rect.top;
    const graphRadius = getGraphRadius(canvas);

    for (let i = 0; i < categoryCount; i++) {
        const handle = dataHandles[i];
        const dataPoint = currentProfile.getDataPoint(handle.index);
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

function onInputMove(x, y, size) {
    let currentProfile = profiles[currentProfileID];

    if (currentProfile == null)
        return;

    if (!draggedHandle)
        return;

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

    currentProfile.setDataPoint(draggedHandle.index, t);

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

    let hoveredIndex = draggedHandle ? draggedHandle.index : -1;

    drawGraph(canvas, profiles, currentProfileID, categoryCount, hoveredIndex, getGraphRadius(canvas), false, currentScaleValue, 1000);
}







/** 
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
*/
