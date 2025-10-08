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

if (!document.getElementById("profile-ui-styles")) {
    const style = document.createElement("style");
    style.id = "profile-ui-styles";
    style.textContent = `
      .profile-ui-wrapper {
        display: flex;
        width: 100%;
      }

      .profile-ui {
        display: flex;
        align-items: center;
        width: 250px;
        margin-left: auto; /* right-anchored */
        background: white;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.15);
        cursor: pointer;
        padding-right: 0;
        transition: width 0.3s ease, box-shadow 0.3s ease;
        border: 2px solid transparent;
      }

      .profile-ui.expanded,
      .profile-ui.active { width: 300px; }

      .profile-ui.active { border-color: black; }

      .profile-ui .color-box {
        width: 42px;
        height: 42px;
        flex-shrink: 0;
        border-radius: 4px 0 0 4px;
        transition: background 0.3s ease;
      }

      .profile-ui .text-field {
        border: none;
        outline: none;
        padding: 8px;
        font-size: 18px;
        flex: 1;
        min-width: 80px;
        max-width: 150px;
      }

      .profile-ui .icons {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .profile-ui .icons button {
        opacity:0;
        pointer-events:none;
        background:none;
        border:none;
        cursor:pointer;
        padding:5px;
        transition: opacity 0.3s ease;
      }

      .profile-ui.expanded .icons button,
      .profile-ui.active .icons button,
      .profile-ui .icons button.always-visible {
        opacity:1;
        pointer-events:auto;
      }

      .profile-ui .icons img {
        width:28px;
        height:28px;
        object-fit:contain;
        transition: transform 0.2s ease;
      }

      .profile-ui .icons button:hover img { transform: scale(1.2); }
    `;
    document.head.appendChild(style);
}

