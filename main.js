const canvas = document.getElementById("appCanvas");
const categoryUISize = 120;
let activeButton = null;
let profileCount = 0;
let categoryButtons = [];
let categoryAngles = [];
let isMainLoopRunning = false;

const loadButton = document.getElementById("loadButton");
const saveButton = document.getElementById("saveButton");
const addButton = document.getElementById("addButton");

/**
 * Variables loaded from data
 */

let categoryCount = 0;
let scaleSize = 0;
let isDualScale = false;

/**
 * Variables for input handling
 */

let offsetX, offsetY;
let draggedHandle = null;
let dataHandles = [];
let hoveredHandle = null;

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
        if (data.categories == null || !Array.isArray(data.categories) || data.categories.length === 0 || data.scaleSize == null || typeof data.scaleSize !== "number" || data.isDualScale == null || typeof data.isDualScale !== "boolean") {
            console.error("Invalid categories data");
            return;
        }

        categoryCount = data.categories.length;
        scaleSize = data.scaleSize;
        isDualScale = data.isDualScale;

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

        for (let i = 0; i < categoryCount; i++)
            categoryAngles.push(getCategoryAngle(i, categoryCount));

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

/**
 *  Profile Management
 */

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
        const angle = categoryAngles[handle.index];

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
    const currentProfile = profiles[currentProfileID];

    if (currentProfile == null)
        return;

    const rect = canvas.getBoundingClientRect();
    const graphRadius = getGraphRadius(canvas);

    if (!draggedHandle) {
        const inputX = x - rect.left;
        const inputY = y - rect.top;

        let newHoveredHandle = null;

        for (let i = 0; i < categoryCount; i++) {
            const handle = dataHandles[i];
            const dataPoint = currentProfile.getDataPoint(handle.index);
            const angle = categoryAngles[handle.index];

            const handleX = canvas.width / 2 + graphRadius * dataPoint * Math.cos(angle);
            const handleY = canvas.height / 2 + graphRadius * dataPoint * Math.sin(angle);

            const dx = inputX - handleX;
            const dy = inputY - handleY;

            if (dx * dx + dy * dy <= 8 * 8 + size * size) { //TODO: Set handle size as constant
                newHoveredHandle = handle;
                break;
            }
        }

        if ((newHoveredHandle != null && hoveredHandle == null) || (newHoveredHandle == null && hoveredHandle != null)) {
            hoveredHandle = newHoveredHandle;
            draw();
        }

        return;
    }

    const angle = categoryAngles[draggedHandle.index];
    const inputX = x - rect.left - offsetX;
    const inputY = y - rect.top - offsetY;

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
*   Drawing
*/

function draw() {
    const ctx = canvas.getContext("2d");
    const hoveredIndex = draggedHandle ? draggedHandle.index : hoveredHandle ? hoveredHandle.index : -1;
    const radius = getGraphRadius(canvas);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /**
     * Impl
     */

    function drawBackground(radius, scaleStep) {
        const backgroundColor = '#6b6b6bff';

        function drawScaleLevel(radius, circleAmount, isMain) {
            function getSamplesPerEdge(n, t) {
                const base = 8;
                const extra = Math.round(24 * t);
                return Math.max(3, base + extra + Math.round(n / 3));
            }

            function getCirclePoint(angle) {
                return { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
            }

            function lerpPoint(pointA, pointB, t) {
                const lerp = (a, b) => a + (b - a) * t;
                return { x: lerp(pointA.x, pointB.x), y: lerp(pointA.y, pointB.y) };
            }

            const vertices = [];

            for (let i = 0; i < categoryCount; i++) {
                const angle = categoryAngles[i];
                vertices.push({ angle, point: getCirclePoint(angle) });
            }

            const circleAmountClamped = Math.max(0, Math.min(1, circleAmount));
            const samplesPerEdge = getSamplesPerEdge(categoryCount, circleAmountClamped);
            const firstArcPoint = lerpPoint(vertices[0].point, vertices[0].point, 0);

            ctx.beginPath();
            ctx.moveTo(firstArcPoint.x, firstArcPoint.y);

            for (let i = 0; i < categoryCount; i++) {
                const vertexA = vertices[i];
                const vertexB = vertices[(i + 1) % categoryCount];

                const angleA = vertexA.angle;
                let angleB = vertexB.angle;

                if (angleB <= angleA)
                    angleB += Math.PI * 2;

                for (let j = 1; j <= samplesPerEdge; j++) {
                    const s = j / samplesPerEdge;

                    const chord = lerpPoint(vertexA.point, vertexB.point, s);
                    const arcAngle = angleA + (angleB - angleA) * s;
                    const arc = getCirclePoint(arcAngle);
                    const point = lerpPoint(chord, arc, circleAmountClamped);

                    ctx.lineTo(point.x, point.y);
                }
            }

            ctx.closePath();

            if (isMain) {
                ctx.lineWidth = 5;
                ctx.strokeStyle = backgroundColor;
                ctx.lineCap = "round";
            } else {
                ctx.lineWidth = 3;
                ctx.strokeStyle = backgroundColor;
                ctx.lineCap = "round";
            }

            ctx.stroke();
        }

        const radii = [];
        //TODO: Dual Scale
        for (let i = 0; i < scaleSize; i++) {
            const scaleRadius = radius * (scaleSize - i) / scaleSize;
            radii.push(scaleRadius);
        }

        for (let i = 0; i < radii.length; i++) {
            const scaleRadius = radii[i];
            const isMain = (i % scaleStep) == 0;

            drawScaleLevel(scaleRadius, 0.5, isMain);
        }

        ctx.lineWidth = 8;
        ctx.strokeStyle = backgroundColor;
        ctx.fillStyle = backgroundColor;
        ctx.lineCap = "round";

        for (let i = 0; i < categoryAngles.length; i++) {
            const angle = categoryAngles[i];

            const x1 = canvas.width / 2;
            const y1 = canvas.height / 2;
            const x2 = x1 + Math.cos(angle) * radius;
            const y2 = y1 + Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x2, y2, 10, 0, 2 * Math.PI);
            ctx.fill();
        }

        const centerRadius = radii[radii.length - 1] * 0.2;

        ctx.fillStyle = backgroundColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
        ctx.fill();
    }

    function drawData(anglesAndRadii, color, isCurrentProfile) {
        const points = anglesAndRadii.map(angleAndRadius => ({
            x: centerX + angleAndRadius.radius * Math.cos(angleAndRadius.angle),
            y: centerY + angleAndRadius.radius * Math.sin(angleAndRadius.angle)
        }));

        const LINE_SIZE = 7;
        const POINT_SIZE = 9;
        const BORDER_SIZE = 1.5;

        function drawLines() {
            ctx.beginPath();
            for (let i = 0; i < points.length; i++) {
                //if (!anglesAndRadii[i].isValid)
                //    continue; TODO: Check is needed

                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
            ctx.stroke();
        }

        function drawPoints(size, isCurrentProfile) {
            for (let i = 0; i < points.length; i++) {
                const point = points[i];

                if (i == hoveredIndex && isCurrentProfile) {
                    let oldFillStyle = ctx.fillStyle;
                    ctx.fillStyle = oldFillStyle * 1.2;

                    ctx.beginPath();
                    ctx.arc(point.x, point.y, size * 1.5, 0, 2 * Math.PI);
                    ctx.fill();

                    ctx.fillStyle = oldFillStyle;
                } else {
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, size, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }

        if (isCurrentProfile) {
            /** Draw borders */

            ctx.fillStyle = "black";
            ctx.strokeStyle = "black";
            ctx.lineWidth = LINE_SIZE + BORDER_SIZE * 2;

            drawLines();
            drawPoints(POINT_SIZE + BORDER_SIZE, true);

            /** Draw foreground */

            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = LINE_SIZE;

            drawLines();
            drawPoints(POINT_SIZE, true);
        } else {
            /** Draw foreground */

            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = LINE_SIZE * 0.8;

            drawLines();
            drawPoints(POINT_SIZE * 0.8, false);
        }
    }

    function drawProfile(profile, isCurrentProfile) {
        const dataAnglesAndRadii = [];
        for (let i = 0; i < categoryCount; i++) {
            const dataPoint = profile.getDataPoint(i);
            const dataPointAngle = categoryAngles[i];
            const dataPointRadius = radius * dataPoint;

            dataAnglesAndRadii.push({
                angle: dataPointAngle,
                radius: dataPointRadius,
                isValid: profile.isDataPointValid(i)
            });
        }

        drawData(dataAnglesAndRadii, profile.color, isCurrentProfile);
    }

    drawBackground(radius, 1000);

    for (let i = 0; i < profiles.length; i++) {
        const profile = profiles[i];
        if (profile == null)
            continue;

        if (!profile.isVisible)
            continue;

        const isCurrentProfile = (profile.id === currentProfileID);

        if (!isCurrentProfile)
            drawProfile(profile, false);
    }

    let currentProfile = profiles[currentProfileID];
    if (currentProfile != null)
        drawProfile(currentProfile, true);
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

/**
 * Main Loop for Category UI animation
 */

function startMainLoop() {
    if (isMainLoopRunning)
        return;

    isMainLoopRunning = true;

    function loop(now) {
        let isAnyAnimating = false;
        for (const button of categoryButtons) {
            if (button.update(now))
                isAnyAnimating = true;

            button.draw();
        }

        if (isAnyAnimating)
            requestAnimationFrame(loop);
        else
            isMainLoopRunning = false;
    }

    requestAnimationFrame(loop);
}
