const canvas = document.getElementById("appCanvas");
const categoryUISize = 120;
let activeButton = null;
let profileCount = 0;
let categoryButtons = [];

const loadButton = document.getElementById("loadButton");
const saveButton = document.getElementById("saveButton");
const addButton = document.getElementById("addButton");

/**
 * Variables loaded from data
 */

let categoryCount = 0;
let scaleSize = 0;

/**
 * Variables for dragging
 */

let offsetX, offsetY;
let draggedHandle = null;
let dataHandles = [];

/**
 * Session variables, savable and loadable
 */

let profiles = [];
let currentProfileID = 0;

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
            let radius = getGraphRadius(canvas) + categoryUISize * 1.1;
            let x = canvas.width / 2 + Math.cos(angle) * radius;
            let y = canvas.height / 2 + Math.sin(angle) * radius;

            let button = createCategoryUI(x, y, categoryUISize, radToDeg(angle) + 180, category.color, [
                { title: category.options[0].name, description: category.options[0].description },
                { title: category.options[1].name, description: category.options[1].description },
                { title: category.options[2].name, description: category.options[2].description }
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
        let radius = getGraphRadius(canvas) + categoryUISize * 1.1;
        let x = canvas.width / 2 + Math.cos(angle) * radius;
        let y = canvas.height / 2 + Math.sin(angle) * radius;

        categoryButtons[i].setPosition(x, y, radToDeg(angle) + 180);
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

addButton.addEventListener("click", () => {
    const profileID = profileCount++;
    const profile = createProfile(profileID);
    createProfileUI(profile);
    draw();
});

loadButton.addEventListener("click", () => {
    loadProject();
});

saveButton.addEventListener("click", () => {
    saveProject();
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

function setActiveProfileButton(id) {
    const container = document.getElementById("profileButtons");

    let button = null;
    for (let i = 0; i < container.children.length; i++) {
        const child = container.children[i];
        const childButton = child.getElementsByClassName("profile-ui")[0];

        if (childButton != null && child.dataset.profileId == id) {
            button = childButton;
            break;
        }
    }

    if (!button)
        return;

    if (activeButton && activeButton !== button) {
        activeButton.classList.remove("active");
        activeButton.classList.remove("expanded");
    }

    activeButton = button;
    button.classList.add("active");
    button.classList.add("expanded");

    currentProfileID = id;
}

function clearProfiles() {
    const container = document.getElementById("profileButtons");

    profiles = [];
    currentProfileID = 0;
    activeButton = null;
    profileCount = 0;
    while (container.firstChild)
        container.removeChild(container.firstChild);
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
 * Save project (JSON)
 */

function saveProject() {
    const json = JSON.stringify({
        profiles: profiles,
        currentProfileID: currentProfileID,
        activeCategoryCorners: categoryButtons.map(ui => ui.getActiveCornerIndex())
    });

    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");

    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = "project.json";
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Load project (JSON)
 */

function loadProject() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file)
            return;

        clearProfiles();

        const reader = new FileReader();

        reader.onload = function (evt) {
            const data = JSON.parse(evt.target.result);

            if (data.profiles == null || !Array.isArray(data.profiles)) {
                console.error("Invalid profiles data");
                window.alert("Fehler beim Laden der Datei: Ungültige Profildaten.");
                return;
            }

            if (data.currentProfileID == null || typeof data.currentProfileID !== "number" || data.currentProfileID < 0 || data.currentProfileID >= data.profiles.length) {
                console.error("Invalid currentProfileID");
                window.alert("Fehler beim Laden der Datei: Ungültige aktuelle Profil-ID.");
                return;
            }

            if (data.activeCategoryCorners == null || !Array.isArray(data.activeCategoryCorners) || data.activeCategoryCorners.length !== categoryButtons.length) {
                console.error("Invalid activeCategoryCorners data");
                window.alert("Fehler beim Laden der Datei: Ungültige aktive Kategorien-Ecken.");
                return;
            }

            profiles = [];

            for (let i = 0; i < data.profiles.length; i++) {
                const profileData = data.profiles[i];

                if (profileData == null || profileData.id == null || typeof profileData.id !== "number") {
                    console.error(`Invalid profile data at index ${i}: ${JSON.stringify(profileData)}`);
                    window.alert(`Fehler beim Laden der Datei: Ungültige Profildaten bei Profil ${i}.`);
                    profiles[i] = null;
                    continue;
                }

                const profile = new Profile(profileData.id);
                profile.isVisible = profileData.isVisible === true;
                profile.dataPoints = Array.isArray(profileData.dataPoints) ? profileData.dataPoints : [];
                profile.dataPointsValid = Array.isArray(profileData.dataPointsValid) ? profileData.dataPointsValid : [];
                profiles[profile.id] = profile;

                createProfileUI(profile);
            }

            for (let i = 0; i < categoryButtons.length; i++) {
                const cornerIndex = data.activeCategoryCorners[i];
                if (cornerIndex == null || typeof cornerIndex !== "number" || cornerIndex < 0 || cornerIndex > 2) {
                    console.error(`Invalid corner index for category button ${i}: ${cornerIndex}`);
                    window.alert(`Fehler beim Laden der Datei: Ungültiger Eckenindex für Kategorie ${i}.`);
                    continue;
                }   
                categoryButtons[i].setActiveCornerIndex(cornerIndex);
            }

            setActiveProfileButton(data.currentProfileID);
            draw();
        };
        reader.readAsText(file);
    };
    input.click();
}
