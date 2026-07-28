import { player, populationData } from "./economy.js";
import { mpop } from "./economy.js";
import { placedBuildings } from "./buildings.js";
import { loadJSON } from "./game.js";

function saveJSON(saveSlot: number) {
  const data = {
    buildings: placedBuildings,
    citizens: populationData.population,
    player: player,
    populationData: populationData,
  };
  localStorage.setItem(`saveSlot${saveSlot}`, JSON.stringify(data));
}

function getSlotData(saveSlot: number) {
  const dataStr = localStorage.getItem(`saveSlot${saveSlot}`);
  if (dataStr) {
    return `<button id="loadSlot${saveSlot}">Load Slot ${saveSlot}</button><button id="deleteSlot${saveSlot}">Delete Slot ${saveSlot}</button>`;
  }
  return `<button id="saveSlot${saveSlot}">Save Slot ${saveSlot}</button>`;
}

const saveLoadButton = document.getElementById(
  "save/load",
) as HTMLButtonElement;
saveLoadButton.addEventListener("click", () => {
  const saveSlots = `
    Save slot 1: ${getSlotData(1)}<br>
    Save slot 2: ${getSlotData(2)}<br>
    Save slot 3: ${getSlotData(3)}<br>
    `;
  mpop(saveSlots, "Close", false, "Save/Load Game");
  for (let i = 1; i <= 3; i++) {
    const saveBtn = document.getElementById(`saveSlot${i}`);
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        saveJSON(i);
        mpop("Game saved!", "Close", false, "Save Game");
      });
    }
    const loadBtn = document.getElementById(`loadSlot${i}`);
    if (loadBtn) {
      loadBtn.addEventListener("click", () => {
        loadJSON(i);
        mpop("Game loaded!", "Close", false, "Load Game");
      });
    }
    const deleteBtn = document.getElementById(`deleteSlot${i}`);
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        localStorage.removeItem(`saveSlot${i}`);
        mpop("Save deleted!", "Close", false, "Delete Save");
      });
    }
  }
});
