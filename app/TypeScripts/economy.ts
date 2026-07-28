import { /*resumeGame,*/ frame } from "./game.js";

import {
  updatePrices,
  placedBuildings,
  productionAmplifiers,
} from "./buildings.js";
import type { data } from "./buildings.js";
import { Player, Population } from "./classes.js";

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

    popupData();
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
    mpop("You do not have enough money to build this building.", "Oh no");
    return false;
  }
}

export function mpop(
  content: string,
  closeText: string = "Close",
  build: boolean = false,
  title: string = "Notice",
) {
  const modal = document.querySelector(".modal") as HTMLDivElement;
  const modalContent = document.getElementById(
    "content",
  ) as HTMLParagraphElement;
  const modalBuildContent = document.getElementById(
    "buildcontent",
  ) as HTMLDivElement;
  const modalClose = document.getElementById("mclose") as HTMLButtonElement;

  const modalHeader = modal.querySelector(".mheader h3") as HTMLHeadingElement;
  modalHeader.innerText = title;

  modal.style.display = "block";
  if (build) {
    modalBuildContent.style.display = "block";
    modalContent.style.display = "none";
  } else {
    modalBuildContent.style.display = "none";
    modalContent.style.display = "block";
    modalContent.innerHTML = content;
  }
  modalClose.innerText = closeText;

  modalClose.focus();

  modalClose.onclick = function () {
    //resumeGame();
    mpopClose(modal);
  };
}

export function mpopClose(modal: HTMLDivElement) {
  modal.style.display = "none";
}

export function optimizeUnits(frames: number): number {
  let seconds = frames / 15;
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);
  let weeks = Math.floor(days / 7);
  let months = Math.floor(weeks / 4);
  let years = Math.floor(months / 12);
  if (years >= 1) {
    return years;
  } else if (months >= 1) {
    return months;
  } else if (weeks >= 1) {
    return weeks;
  } else if (days >= 1) {
    return days;
  } else if (hours >= 1) {
    return hours;
  } else if (minutes >= 1) {
    return minutes;
  } else if (seconds >= 1) {
    return seconds;
  } else {
    return frames;
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

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        P O P U P S                                        *
 *                                                                           *
 *---------------------------------------------------------------------------*/

const rawPopup = document.getElementById("raw") as HTMLDivElement;
const processedPopup = document.getElementById("processed") as HTMLDivElement;
const moneyPopup = document.getElementById("money") as HTMLDivElement;

const rawInfo = document.getElementById("rawdet") as HTMLDivElement;
const processedInfo = document.getElementById("procdet") as HTMLDivElement;
const moneyInfo = document.getElementById("incomes") as HTMLDivElement;

rawPopup.addEventListener("click", () => {
  if (rawInfo.style.display === "block") {
    rawInfo.style.display = "none";
  } else {
    rawInfo.style.display = "block";
  }
});

processedPopup.addEventListener("click", () => {
  if (processedInfo.style.display === "block") {
    processedInfo.style.display = "none";
  } else {
    processedInfo.style.display = "block";
  }
});

moneyPopup.addEventListener("click", () => {
  if (moneyInfo.style.display === "block") {
    moneyInfo.style.display = "none";
  } else {
    moneyInfo.style.display = "block";
  }
});

function popupData() {
  rawInfo.innerHTML = `Raw:<br>
    Coal: ${player.resources.coal?.ammount.toFixed(
      0,
    )}, Price: ${player.resources.coal?.price.toFixed(2)}<br>
    Iron: ${player.resources.iron?.ammount.toFixed(
      0,
    )}, Price: ${player.resources.iron?.price.toFixed(2)}<br>
    Stone: ${player.resources.stone?.ammount.toFixed(
      0,
    )}, Price: ${player.resources.stone?.price.toFixed(2)}<br>`;

  processedInfo.innerHTML = `Processed:<br>
    Refined Coal: ${player.resources.refinedCoal?.ammount.toFixed(
      0,
    )}, Price: ${player.resources.refinedCoal?.price.toFixed(2)}<br>
    Steel: ${player.resources.steel?.ammount.toFixed(
      0,
    )}, Price: ${player.resources.steel?.price.toFixed(2)}<br>
    Stone Bricks: ${player.resources.stoneBricks?.ammount.toFixed(
      0,
    )}, Price: ${player.resources.stoneBricks?.price.toFixed(2)}<br>`;

  let inavrg = {
    all: 0.0,
    taxes: 0.0,
    shops: {
      all: 0.0,
      steel: 0.0,
      stoneBricks: 0.0,
    },
  };

  moneyInfo.innerHTML = `Money:<br>
    Current Balance: $${player.finances.toFixed(2)}<br>
    Income: $${inavrg.all.toFixed(2)} per second<br>
    - From Taxes: $${inavrg.taxes.toFixed(2)} per second<br>
    - From Shops: $${inavrg.shops.all.toFixed(2)} per second<br>
    -- From Steel: $${inavrg.shops.steel.toFixed(2)} per second<br>
    -- From Stone Bricks: $${inavrg.shops.stoneBricks.toFixed(2)} per second<br>
    `;
}

//terminals
const productionTerminalButton = document.getElementById(
  "productionTerminal",
) as HTMLButtonElement;
productionTerminalButton.addEventListener("click", () => {
  const content = `
    <h3>Production Terminal</h3>
    <label for="MinAmp" id="MinAmpLabel">Set Mines Production Rate (%): </label>
    <input type="range" id="MinAmp" name="productionRate" min="0" max="200" value="${
      productionAmplifiers["mines"] * 100
    }"><br>
    <label for="FouAmp" id="FouAmpLabel">Set Foundries Production Rate (%): </label>
    <input type="range" id="FouAmp" name="productionRate" min="0" max="200" value="${
      productionAmplifiers["foundry"] * 100
    }"><br>
    <button id="setProductionRate">Set Rate</button>
    <button id="dumbResources">Dump Resources</button>
    <h3>Taxes</h3>
    <label for="taxRate" id="taxRateLabel">Set Tax Rate (%): </label>
    <input type="range" id="taxRate" name="taxRate" min="0" max="50" value="${
      populationData.taxes
    }"><br>
    <button id="setTaxRate">Set Tax Rate</button><br>
    <button id="toggleShops">Toggle Shops</button><p>Current Status: ${
      shopsOpenned ? "Open" : "Closed"
    }</p>
    `;
  mpop(content, "Close", false, "Production Terminal");
  const setButton = document.getElementById(
    "setProductionRate",
  ) as HTMLButtonElement;
  const FauAmp = document.getElementById("FouAmp") as HTMLInputElement;
  const MinAmp = document.getElementById("MinAmp") as HTMLInputElement;
  const dumpButton = document.getElementById(
    "dumbResources",
  ) as HTMLButtonElement;
  setButton.addEventListener("click", () => {
    const ParsedMinAmp = parseInt(MinAmp.value);
    productionAmplifiers["mines"] = ParsedMinAmp / 100;
    const ParsedFacAmp = parseInt(FauAmp.value);
    productionAmplifiers["foundry"] = ParsedFacAmp / 100;
    mpopClose(document.querySelector(".modal") as HTMLDivElement);
    //resumeGame();
  });
  dumpButton.addEventListener("click", () => {
    player.resources.coal!.ammount = 0;
    player.resources.iron!.ammount = 0;
    player.resources.stone!.ammount = 0;
    player.resources.refinedCoal!.ammount = 0;
    player.resources.steel!.ammount = 0;
    player.resources.stoneBricks!.ammount = 0;
    mpopClose(document.querySelector(".modal") as HTMLDivElement);
    //resumeGame();
  });
  FauAmp.addEventListener("input", () => {
    document.getElementById("FouAmpLabel")!.innerText =
      `Set Production Rate (%): ${FauAmp.value}%`;
  });
  MinAmp.addEventListener("input", () => {
    document.getElementById("MinAmpLabel")!.innerText =
      `Set Production Rate (%): ${MinAmp.value}%`;
  });

  const taxRateInput = document.getElementById("taxRate") as HTMLInputElement;
  const taxRateLabel = document.getElementById(
    "taxRateLabel",
  ) as HTMLLabelElement;
  const setTaxButton = document.getElementById(
    "setTaxRate",
  ) as HTMLButtonElement;

  taxRateInput.addEventListener("input", () => {
    taxRateLabel.innerText = `Set Tax Rate (%): ${taxRateInput.value}%`;
  });

  setTaxButton.addEventListener("click", () => {
    const taxRate = parseInt(taxRateInput.value);
    populationData.taxes = taxRate;
    mpopClose(document.querySelector(".modal") as HTMLDivElement);
    //resumeGame();
  });

  const toggleShopsButton = document.getElementById(
    "toggleShops",
  ) as HTMLButtonElement;
  toggleShopsButton.addEventListener("click", () => {
    shopsOpenned = !shopsOpenned;
    mpopClose(document.querySelector(".modal") as HTMLDivElement);
    //resumeGame();
  });
});
