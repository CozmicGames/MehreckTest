function drawCircle(ctx, centerX, centerY, radius, isMain) {
    if (isMain) {
        ctx.lineWidth = 5;
        ctx.strokeStyle = "gray";
    } else {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "gray";
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
}

function drawSegmentedCircle(ctx, centerX, centerY, angles, radius, isMain) {
    if (isMain) {
        ctx.lineWidth = 5;
        ctx.strokeStyle = "gray";
        ctx.lineCap = "round";
    } else {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "gray";
        ctx.lineCap = "round";
    }

    const points = angles.map(angle => ({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
    }));

    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();
}

function drawCategoryLine(ctx, x1, y1, x2, y2) {
    ctx.lineWidth = 8;
    ctx.strokeStyle = "gray";
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawBackground(ctx, centerX, centerY, angles, radius, useCircle, scaleCount, scaleStep) {
    const radii = [];

    for (let i = 0; i < scaleCount; i++) {
        const scaleRadius = radius * (scaleCount - i) / scaleCount;
        radii.push(scaleRadius);
    }

    /*
    *   Draw circles/segmented circles
    */

    for (let i = 0; i < radii.length; i++) {
        const scaleRadius = radii[i];
        const isMain = (i % scaleStep) == 0;

        if (useCircle) {
            drawCircle(ctx, centerX, centerY, scaleRadius, isMain);
        } else {
            drawSegmentedCircle(ctx, centerX, centerY, angles, scaleRadius, isMain);
        }
    }

    /*
    *   Draw category lines
    */

    for (let i = 0; i < angles.length; i++) {
        const angle = angles[i];

        const x1 = canvas.width / 2;
        const y1 = canvas.height / 2;
        const x2 = x1 + Math.cos(angle) * radius;
        const y2 = y1 + Math.sin(angle) * radius;

        drawCategoryLine(ctx, x1, y1, x2, y2);
    }

    /*
    *   Draw center
    */

    const centerRadius = radii[radii.length - 1] * 0.2;

    ctx.fillStyle = "gray";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, centerRadius, 0, 2 * Math.PI);
    ctx.fill();
}

function drawData(ctx, centerX, centerY, anglesAndRadii, color, hoveredIndex, isCurrentProfile) {
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

    function drawPoints(size) {
        for (let i = 0; i < points.length; i++) {
            const point = points[i];

            if (i == hoveredIndex) {
                let oldFillStyle = ctx.fillStyle;
                ctx.fillStyle = oldFillStyle * 1.1;

                ctx.beginPath();
                ctx.arc(point.x, point.y, size * 1.1, 0, 2 * Math.PI);
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
        drawPoints(POINT_SIZE + BORDER_SIZE);
    }

    /** Draw foreground */

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = LINE_SIZE;

    drawLines();
    drawPoints(POINT_SIZE);
}

function drawGraph(canvas, profiles, currentProfileID, categoryCount, hoveredIndex, radius, useCircle, scaleCount, scaleStep) {
    const ctx = canvas.getContext("2d");

    const angles = [];

    for (let i = 0; i < categoryCount; i++) {
        angles.push(getCategoryAngle(i, categoryCount));
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    drawBackground(ctx, centerX, centerY, angles, radius, useCircle, scaleCount, scaleStep);

    function drawProfile(profile, isCurrentProfile) {
        const dataAnglesAndRadii = [];
        for (let i = 0; i < categoryCount; i++) {
            const dataPoint = profile.getDataPoint(i);
            const dataPointAngle = angles[i];
            const dataPointRadius = radius * dataPoint;

            dataAnglesAndRadii.push({
                angle: dataPointAngle,
                radius: dataPointRadius,
                isValid: profile.isDataPointValid(i)
            });
        }

        drawData(ctx, centerX, centerY, dataAnglesAndRadii, profile.color, hoveredIndex, isCurrentProfile);
    }

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
