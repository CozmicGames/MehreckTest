const buttonsInnerContainer = document.getElementById("buttonsInnerContainer");
const addButton = document.getElementById("addButton");
const clearButton = document.getElementById("clearButton");

let activeButton = null;
let count = 0;

function setActiveButton(button) {
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
      setActiveButton(button);
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
});

clearButton.addEventListener("click", () => {
  buttonsInnerContainer.innerHTML = "";
  count=0;
  activeButton=null;
  profiles = [];
});
