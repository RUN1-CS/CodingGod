import { /*resumeGame,*/ frame } from "./game.js";

import { updatePrices, placedBuildings } from "./buildings.js";
import { Player, Population } from "./classes.js";

import type { data } from "./types.js";

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        G A M E   U T I L S                                *
 *                                                                           *
 *---------------------------------------------------------------------------*/

export let networth = 0;

export function calculateNetworth() {
  networth = player.finances;
  placedBuildings.forEach((building) => {
    networth += building.data.price;
  });
  Object.values(player.resources).forEach((resource) => {
    networth += resource.ammount * resource.price;
  });
}

export let shopsOpenned = false;

export const player = new Player();

export const populationData = new Population();

export function process() {
  if (frame % 15 === 0) {
    for (const resource of Object.values(player.resources)) {
      resource.process(placedBuildings);
      resource.priceChange(
        player,
        populationData,
        placedBuildings.filter(
          (building) => building.data.produces?.[resource.name],
        ).length,
      );
    }

    player.finances += populationData.taxCollection();
    player.sell(placedBuildings);

    if (frame % 255 === 0) {
      populationData.agePopulation(placedBuildings);
    }
  }
  updateStatsDisplay();
  updatePrices();
}

export function buyBuilding(data: data): boolean {
  if (player.finances >= data.price) {
    player.finances -= data.price;
    updateStatsDisplay();
    return true;
  } else {
    return false;
  }
}

//stats
const rawSpan = document.getElementById("raw") as HTMLSpanElement;
const processedSpan = document.getElementById("processed") as HTMLSpanElement;
const moneySpan = document.getElementById("money") as HTMLSpanElement;
const foodSpan = document.getElementById("food") as HTMLSpanElement;

function updateStatsDisplay() {
  const resources = Object.values(player.resources);
  const rawCount = resources.filter((type: any) => "raw" in type).length;
  rawSpan.innerText = `Raw: ${rawCount.toFixed(0)}`;
  const processedCount = resources.filter(
    (type: any) => "processed" in type,
  ).length;
  processedSpan.innerText = `Processed: ${processedCount.toFixed(0)}`;
  moneySpan.innerText = `Money: ${player.finances.toFixed(2)}`;
  foodSpan.innerText = `Food: ${player.resources.food!.ammount.toFixed(0)}`;
}

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        P A G E   L O O K S                                *
 *                                                                           *
 *---------------------------------------------------------------------------*/

function setTheme(theme: "light" | "dark") {
  document.body.classList.remove("light", "dark");
  document.body.classList.add(theme);
  document.cookie = "theme=" + theme + ";path=/;max-age=" + 3600 * 24 * 30;
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

const savedTheme = getCookie("theme") as "light" | "dark" | null;
if (savedTheme) setTheme(savedTheme);
else setTheme("light");

document.getElementById("theme")?.addEventListener("change", (event) => {
  const current = document.body.classList.contains("light") ? "light" : "dark";
  setTheme(current === "light" ? "dark" : "light");
});
