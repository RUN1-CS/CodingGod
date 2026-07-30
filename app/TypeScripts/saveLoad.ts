import { player, populationData } from "./economy.js";
import { buildAssignValues, placedBuildings } from "./buildings.js";

export function saveJSON(saveSlot: number) {
  const data = {
    buildings: placedBuildings,
    citizens: populationData.population,
    player: player,
    populationData: populationData,
  };
  localStorage.setItem(`saveSlot${saveSlot}`, JSON.stringify(data));
}

export function loadJSON(saveSlot: number): String | Boolean {
  const dataStr = localStorage.getItem(`saveSlot${saveSlot}`);
  if (dataStr) {
    const data = JSON.parse(dataStr);
    placedBuildings.length = 0;
    data.buildings.forEach((b: any) => placedBuildings.push(b));
    populationData.population.length = 0;
    data.citizens.forEach((c: any) => populationData.population.push(c));
    buildAssignValues(data.buildings);
  } else {
    return "No saved progress found in slot " + saveSlot;
  }
  return true;
}
