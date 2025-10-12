const canvas = document.getElementById("appCanvas");
const categoryUISize = 100;

let offsetX, offsetY;
let dataHandles = [];
let draggedHandle = null;
let profiles = [];
let currentProfileID = 0;
let categoryCount = 0;
let scaleSize = 0;

/**
*   Setup
*/
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

fetch('./data.json')
    .then(result => result.json())
    .then(data => {
        if (data.categories == null || !Array.isArray(data.categories) || data.categories.length === 0 || data.scaleSize == null) {
            console.error("Invalid categories data");
            return;
        }

        categoryCount = data.categories.length;
        scaleSize = data.scaleSize;

        console.log(`Loaded ${categoryCount} categories`);
        console.log(`Scale size: ${scaleSize}`);

        for (let i = 0; i < categoryCount; i++) {
            let category = data.categories[i];

            if (category == null) {
                console.error(`Invalid category at index ${i}`);
                continue;
            }

            if (category.color == null) {
                console.error(`Invalid color for category at index ${i}`);
                continue;
            }

            if (category.options == null || !Array.isArray(category.options)) {
                console.error(`Invalid options for category at index ${i}`);
                continue;
            }

            if (category.options.length != 3) {
                console.error(`Invalid options length for category at index ${i}`);
                continue;
            }

            if (category.options[0].name == null || category.options[1].name == null || category.options[2].name == null) {
                console.error(`Invalid option name for category at index ${i}`);
                continue;
            }

            if (category.options[0].description == null || category.options[1].description == null || category.options[2].description == null) {
                console.error(`Invalid option description for category at index ${i}`);
                continue;
            }

            let angle = getCategoryAngle(i, categoryCount);
            let radius = getGraphRadius(canvas) + categoryUISize / 2;
            let x = canvas.width / 2 + Math.cos(angle) * radius;
            let y = canvas.height / 2 + Math.sin(angle) * radius;

            let button = createCategoryUI(x, y, categoryUISize, radToDeg(angle) + 180, category.color, [
                { text: category.options[0].name, tooltip: category.options[0].description },
                { text: category.options[1].name, tooltip: category.options[1].description },
                { text: category.options[2].name, tooltip: category.options[2].description }
            ], category.name);

            categoryButtons.push(button);
        }

        dataHandles = [];

        for (let i = 0; i < categoryCount; i++) {
            dataHandles.push({
                index: i
            });
        }

        draw();
    })
    .catch(error => console.error('Error loading JSON:', error));

window.addEventListener("resize", e => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    for (let i = 0; i < categoryCount; i++) {
        let angle = getCategoryAngle(i, categoryCount);
        let radius = getGraphRadius(canvas);
        let x = canvas.width / 2 + Math.cos(angle) * radius;
        let y = canvas.height / 2 + Math.sin(angle) * radius;

        categoryButtons[i].updatePosition(x, y, radToDeg(angle) + 180);
    }

    draw();
});

canvas.addEventListener("mousedown", e => {
    onInputDown(e.clientX, e.clientY, 0);
    console.log(e.clientX, e.clientY);
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

    drawGraph(canvas, profiles, currentProfileID, categoryCount, hoveredIndex, getGraphRadius(canvas), false, scaleSize, 1000);
}


/**
 * 
 */


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
