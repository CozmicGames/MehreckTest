const buttonsInnerContainer = document.getElementById("buttonsInnerContainer");
const loadButton = document.getElementById("loadButton");
const saveButton = document.getElementById("saveButton");
const addButton = document.getElementById("addButton");

let activeButton = null;
let count = 0;
let categoryButtons = [];

function setActiveProfileButton(button) {
  if (activeButton && activeButton !== button) {
    activeButton.classList.remove("active");
    activeButton.classList.remove("expanded");
  }
  activeButton = button;
  button.classList.add("active");
  button.classList.add("expanded");
}

addButton.addEventListener("click", () => {
  const profileID = count++;
  const profile = createProfile(profileID);

  const entry = createProfileUI({
    id: profileID,
    color: profile.color,
    onClick: (_id, button) => {
      setActiveProfileButton(button);
      currentProfileID = profileID;
      draw();
    },
    onVisible: (id, state) => {
      profiles[id].isVisible = state;
      draw();
    },
    onDelete: (id) => {
      removeProfile(id);
      draw();
    }
  });
  buttonsInnerContainer.appendChild(entry);
  draw();
});

loadButton.addEventListener("click", () => {
});

saveButton.addEventListener("click", () => {
});

/**
 * UI element creation functions
 */

function createProfileUI({ id, color = "#4CAF50", onClick = null, onVisible = null, onDelete = null }) {
    const wrapper = document.createElement("div");
    wrapper.className = "profile-ui-wrapper";

    const button = document.createElement("div");
    button.className = "profile-ui";
    button.dataset.id = id;

    const colorBox = document.createElement("div");
    colorBox.className = "color-box";
    colorBox.style.background = color;

    const textField = document.createElement("input");
    textField.type = "text";
    textField.className = "text-field";
    textField.placeholder = `Name eingeben...`;

    const iconsContainer = document.createElement("div");
    iconsContainer.className = "icons";

    const iconButtons = {};

    const iconStates = {
      visible: {
        alwaysVisible:true,
        booleanState:false,
        setTrue: {
          normal: "resources/visible_icon.png",
          hover: "resources/visible_hovered_icon.png",
          active: "resources/visible_pressed_icon.png",
          callback:(_button, state)=> {
            onVisible && onVisible(id, state);
          }
        },
        setFalse: {
          normal: "resources/invisible_icon.png",
          hover: "resources/invisible_hovered_icon.png",
          active: "resources/invisible_pressed_icon.png",
          callback:(_button, state)=> {
            onVisible && onVisible(id, state);
          }
        }
      },
      delete: {
        alwaysVisible:false,
        normal: "resources/delete_icon.png",
        hover: "resources/delete_hovered_icon.png",
        active: "resources/delete_pressed_icon.png",
        callback: button => { 
          if (activeButton === button) 
            activeButton = null;
          
          buttonsInnerContainer.removeChild(button.parentElement);
          onDelete && onDelete(id);
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
    wrapper.appendChild(button);

    button.addEventListener("mouseenter", () => { if(!button.classList.contains("active")) button.classList.add("expanded"); });
    button.addEventListener("mouseleave", () => { if(!button.classList.contains("active")) button.classList.remove("expanded"); });
    button.addEventListener("click", e => { if (e.target !== textField && onClick) onClick(id, button); });

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

    return wrapper;
};

class CategoryUI {
    constructor(container, size, targetRotation = 0, color = "#00d1ff", cornerLabels = [], centerLabelText = "") {
        this.container = container;
        this.size = size;
        this.targetRotation = targetRotation;
        this.rotation = 0;
        this.color = color;
        this.activeCorner = null;
        this.radius = size / Math.sqrt(3);
        this.baseCornerAngles = [0, 120, 240];
        this.animation = null;

        this.canvas = document.createElement("canvas");
        this.canvas.className = "category-ui-canvas";
        this.canvas.width = size;
        this.canvas.height = size;
        this.ctx = this.canvas.getContext("2d");
        this.container.appendChild(this.canvas);

        this.labelElements = [];
        for (let i = 0; i < 3; i++) {
            const label = document.createElement("div");
            label.className = "category-ui-label";
            const labelText = cornerLabels[i] || { text: String.fromCharCode(65 + i), tooltip: "" };
            label.innerHTML = `${labelText.text}<div class="category-ui-tooltip">${labelText.tooltip}</div>`;
            const normal = shadeColor(this.color, -20);
            const hover = shadeColor(this.color, 10);
            label.style.background = normal;
            label.style.color = "#fff";
            label.addEventListener("mouseenter", () => label.style.background = hover);
            label.addEventListener("mouseleave", () => label.style.background = normal);
            label.onclick = (e) => {
                e.stopPropagation();
                this.activateCorner(i);
                startMainLoop();
            }

            document.body.appendChild(label);
            this.labelElements.push(label);
        }

        this.centerLabelElement = document.createElement("div");
        this.centerLabelElement.className = "category-ui-center-label";
        this.centerLabelElement.textContent = centerLabelText;
        document.body.appendChild(this.centerLabelElement);

        this.activeCorner = this._cornerClosestToTargetDir();
        this.draw();
    }

    _cornerClosestToTargetDir() {
        let best = 0;
        let bestDelta = Infinity;

        for (let i = 0; i < 3; i++) {
            const absAngle = mod360(this.targetRotation + this.rotation + this.baseCornerAngles[i]);
            const d = Math.abs(shortestAngleDelta(this.targetRotation, absAngle));
            if (d < bestDelta) {
                bestDelta = d; best = i;
            }
        }

        return best;
    }

    updatePosition(x, y, rotation) {
        this.container.style.left = `${x}px`;
        this.container.style.top = `${y}px`;
        this.targetRotation = rotation;
        this.activeCorner = this._cornerClosestToTargetDir();
        this.draw();
    }

    activateCorner(i) {
        this.activeCorner = i;
        const desired = -this.baseCornerAngles[i];
        const delta = shortestAngleDelta(desired, this.rotation);
        const endRot = this.rotation + delta;
        this.animation = { start: this.rotation, end: endRot, t0: performance.now(), dur: 700 };
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
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const cx = this.canvas.width / 2, cy = this.canvas.height / 2;
        const corners = [];
        for (let i = 0; i < 3; i++) {
            const ang = degToRad(this.targetRotation + this.rotation + this.baseCornerAngles[i]);
            corners.push({ x: cx + Math.cos(ang) * this.radius, y: cy + Math.sin(ang) * this.radius });
        }

        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        ctx.lineTo(corners[1].x, corners[1].y);
        ctx.lineTo(corners[2].x, corners[2].y);
        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = this.color;
        ctx.stroke();

        if (this.activeCorner !== null) {
            const c = corners[this.activeCorner];
            ctx.beginPath();
            ctx.arc(c.x, c.y, this.size * 0.05, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        const rect = this.canvas.getBoundingClientRect();
        for (let i = 0; i < 3; i++) {
            const el = this.labelElements[i];
            el.style.left = `${rect.left + corners[i].x}px`;
            el.style.top = `${rect.top + corners[i].y}px`;
        }
        this.centerLabelElement.style.left = `${rect.left + cx}px`;
        this.centerLabelElement.style.top = `${rect.top + cy}px`;
    }
}

function createCategoryUI(x, y, size, rotation, color, labels, centerText) {
    const container = document.createElement("div");
    container.className = "category-ui-container";
    container.style.left = `${x}px`;
    container.style.top = `${y}px`;
    document.getElementById("appControls").appendChild(container);

    const t = new CategoryUI(container, size, rotation, color, labels, centerText);
    return t;
}

/**
 * Main Loop for Category UI animation
 */

let mainLoopRunning = false;
function startMainLoop() {
  if (mainLoopRunning) return;
  mainLoopRunning = true;

  function loop(now) {
    let anyAnimating = false;
    for (const t of categoryButtons) {
      if (t.update(now)) anyAnimating = true;
      t.draw();
    }
    if (anyAnimating) requestAnimationFrame(loop);
    else mainLoopRunning = false;
  }
  requestAnimationFrame(loop);
}
