/**
 * Profile UI
 */

class ProfileUI {
  constructor(parent, profile) {
    this.parent = parent;
    this.profile = profile;

    this.wrapper = document.createElement("div");
    this.wrapper.className = "profile-ui-wrapper";
    this.wrapper.dataset.profileId = profile.id;
    parent.appendChild(this.wrapper);

    const button = document.createElement("div");
    button.className = "profile-ui";
    button.dataset.id = profile.id;

    const colorBox = document.createElement("div");
    colorBox.className = "color-box";
    colorBox.style.background = profile.color;

    const textField = document.createElement("input");
    textField.type = "text";
    textField.className = "text-field";
    textField.placeholder = `Name eingeben...`;

    const iconsContainer = document.createElement("div");
    iconsContainer.className = "icons";

    const iconButtons = {};

    const iconStates = {
      visible: {
        alwaysVisible: true,
        booleanState: false,
        setTrue: {
          normal: "resources/visible_icon.png",
          hover: "resources/visible_hovered_icon.png",
          active: "resources/visible_pressed_icon.png",
          callback: (_button, state) => {
            profile.isVisible = state;
            draw();
          }
        },
        setFalse: {
          normal: "resources/invisible_icon.png",
          hover: "resources/invisible_hovered_icon.png",
          active: "resources/invisible_pressed_icon.png",
          callback: (_button, state) => {
            profile.isVisible = state;
            draw();
          }
        }
      },
      delete: {
        alwaysVisible: false,
        normal: "resources/delete_icon.png",
        hover: "resources/delete_hovered_icon.png",
        active: "resources/delete_pressed_icon.png",
        callback: button => {
          if (activeButton === button)
            activeButton = null;

          parent.removeChild(button.parentElement);
          removeProfile(profile.id);
          draw();
        }
      }
    }

    Object.entries(iconStates).forEach(([name, states]) => {
      const iconButton = document.createElement("button");
      const image = document.createElement("img");
      iconButton._image = image;
      iconButton._states = states;

      if (typeof states.booleanState !== "undefined")
        iconButton._currentSet = states.booleanState ? states.setTrue : states.setFalse;
      else
        iconButton._currentSet = states;

      image.src = iconButton._currentSet.normal;
      iconButton.appendChild(image);
      iconsContainer.appendChild(iconButton);

      if (states.alwaysVisible)
        iconButton.classList.add("always-visible");

      iconButtons[name] = iconButton;

      iconButton.addEventListener("mouseover", () => image.src = iconButton._currentSet.hover || iconButton._currentSet.normal);
      iconButton.addEventListener("mouseout", () => image.src = iconButton._currentSet.normal);

      iconButton.addEventListener("click", e => {
        e.stopPropagation();

        if (typeof states.booleanState !== "undefined") {
          states.booleanState = !states.booleanState;
          iconButton._currentSet = states.booleanState ? states.setTrue : states.setFalse;
          image.src = iconButton._currentSet.normal;
        }

        if (iconButton._currentSet.active)
          image.src = iconButton._currentSet.active;

        if (iconButton._currentSet.callback)
          iconButton._currentSet.callback(button, states.booleanState);
      });
    });

    button.appendChild(colorBox);
    button.appendChild(textField);
    button.appendChild(iconsContainer);
    this.wrapper.appendChild(button);

    button.addEventListener("mouseenter", () => { if (!button.classList.contains("active")) button.classList.add("expanded"); });
    button.addEventListener("mouseleave", () => { if (!button.classList.contains("active")) button.classList.remove("expanded"); });
    button.addEventListener("click", e => {
      if (e.target !== textField) {
        setActiveProfileButton(profile.id);
        draw();
      }
    });

    button.setBooleanIcon = (iconName, boolValue) => {
      const iconButton = iconButtons[iconName];
      if (!iconButton)
        return;

      const states = iconButton._states;
      if (typeof states.booleanState !== "undefined") {
        states.booleanState = boolValue;
        iconButton._currentSet = boolValue ? states.setTrue : states.setFalse;
        iconButton._image.src = iconButton._currentSet.normal;
      }
    };
  }
}

function createProfileUI(profile) {
  const container = document.getElementById("profileButtons");
  const ui = new ProfileUI(container, profile);

  if(container.children.length === 1)
    setActiveProfileButton(profile.id);

  return ui;
};

/**
 * Category UI
 */

class CategoryUI {
  constructor(parent, size, position, targetRotation = 0, color = "#00d1ff", cornerLabels = [], centerLabelText = "") {
    this.parent = parent;
    this.size = size;
    this.targetRotation = targetRotation;
    this.rotation = 0;
    this.color = color;
    this.activeCorner = null;
    this.radius = size / Math.sqrt(3);
    this.baseCornerAngles = [0, 120, 240];
    this.animation = null;

    this.container = document.createElement("div");
    this.container.className = "category-ui-container";
    this.container.style.left = `${position.x}px`;
    this.container.style.top = `${position.y}px`;
    parent.appendChild(this.container);

    this.canvas = document.createElement("canvas");
    this.canvas.className = "category-ui-canvas";
    this.canvas.width = size;
    this.canvas.height = size;
    this.ctx = this.canvas.getContext("2d", { alpha: true });
    this.container.appendChild(this.canvas);

    this.centerLabelElement = document.createElement("div");
    this.centerLabelElement.className = "category-ui-center-label";
    this.centerLabelElement.textContent = centerLabelText;
    this.container.appendChild(this.centerLabelElement);

    this.labelElements = [];
    for (let i = 0; i < 3; i++) {
      const label = document.createElement("div");
      label.className = "category-ui-label";
      const labelData = cornerLabels[i] || { title: "Missing corner " + i, description: "" };
      label.innerHTML = `<div class="title">${labelData.title}</div><div class="description">${labelData.description}</div>`;
      const normal = shadeColor(this.color, -20);
      const hover = shadeColor(this.color, 10);
      label.style.background = normal;
      label.style.color = "#fff";

      label.addEventListener("mouseenter", () => {
        label.classList.add("expanded");
        label.style.background = hover;
        label.parentElement.appendChild(label);
      });

      label.addEventListener("mouseleave", () => {
        label.classList.remove("expanded");
        label.style.background = normal;
      });

      label.onclick = e => {
        e.stopPropagation();
        this.activateCorner(i);
        startMainLoop();
      };

      this.container.appendChild(label);
      this.labelElements.push(label);
    }

    this.activeCorner = this._cornerClosestToTargetDir();
    this.draw();
  }

  _cornerClosestToTargetDir() {
    let best = 0, bestDelta = Infinity;
    for (let i = 0; i < 3; i++) {
      const absAngle = mod360(this.targetRotation + this.rotation + this.baseCornerAngles[i]);
      const d = Math.abs(shortestAngleDelta(this.targetRotation, absAngle));
      if (d < bestDelta) {
        bestDelta = d;
        best = i;
      }
    }
    return best;
  }

  setPosition(x, y) {
    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;
  }

  activateCorner(i) {
    this.activeCorner = i;
    const desired = -this.baseCornerAngles[i];
    const delta = shortestAngleDelta(desired, this.rotation);
    const endRot = this.rotation + delta;
    this.animation = { start: this.rotation, end: endRot, t0: performance.now(), dur: 750 };
  }

  getActiveCornerIndex() {
    return this.activeCorner;
  }

  setActiveCornerIndex(i) {
    if (i < 0 || i > 2) 
      return;

    this.activeCorner = i;
    const desired = -this.baseCornerAngles[i];
    const delta = shortestAngleDelta(desired, this.rotation);
    this.rotation = mod360(this.rotation + delta);
    this.animation = null;
    this.draw();
  }

  update(now) {
    if (!this.animation)
      return false;

    const t = Math.min((now - this.animation.t0) / this.animation.dur, 1);
    this.rotation = this.animation.start + (this.animation.end - this.animation.start) * easeOutCubic(t);
    if (t >= 1) {
      this.rotation = mod360(this.animation.end);
      this.animation = null;
    }

    return !!this.animation;
  }

  draw() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const corners = [];
    for (let i = 0; i < 3; i++) {
      const angle = degToRad(this.targetRotation + this.rotation + this.baseCornerAngles[i]);
      corners.push({
        x: centerX + Math.cos(angle) * this.radius,
        y: centerY + Math.sin(angle) * this.radius
      });
    }

    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    ctx.lineTo(corners[1].x, corners[1].y);
    ctx.lineTo(corners[2].x, corners[2].y);
    ctx.closePath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = this.color;
    ctx.stroke();

    if (this.activeCorner !== null) {
      const corner = corners[this.activeCorner];
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, this.size * 0.05, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
    ctx.restore();

    for (let i = 0; i < 3; i++) {
      const labelElement = this.labelElements[i];
      labelElement.style.left = `${corners[i].x}px`;
      labelElement.style.top = `${corners[i].y}px`;
    }

    this.centerLabelElement.style.left = `${centerX}px`;
    this.centerLabelElement.style.top = `${centerY}px`;
  }
}

function createCategoryUI(x, y, size, rotation, color, labels, centerText) {
  const container = document.getElementById("appControls");
  const ui = new CategoryUI(container, size, { x, y }, rotation, color, labels, centerText);
  return ui;
}

/**
 * Main Loop for Category UI animation
 */

let isMainLoopRunning = false;
function startMainLoop() {
  if (isMainLoopRunning) return;
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
