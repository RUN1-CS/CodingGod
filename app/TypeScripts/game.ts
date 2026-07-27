import { process, mpop, mpopClose, citizens } from "./economy.js";
import {
  buildingInProgress,
  checkBuildingPosition,
  preBuild,
  placedBuildings,
  buildingTypes,
  placeBuilding,
  setBuildingState,
  removeBuildingAtPosition,
  buildAssignValues,
} from "./buildings.js";

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        C A N V A S   S E T   U P                          *
 *                                                                           *
 *---------------------------------------------------------------------------*/
const fg = document.getElementById("fg") as HTMLCanvasElement;
const pbg = document.getElementById("pbg") as HTMLCanvasElement;
const bg = document.getElementById("bg") as HTMLCanvasElement;
export const fgCtx = fg.getContext("2d") as CanvasRenderingContext2D;
export const pbgCtx = pbg.getContext("2d") as CanvasRenderingContext2D;
export const bgCtx = bg.getContext("2d") as CanvasRenderingContext2D;

export const priceTag = document.getElementById("priceTag") as HTMLDivElement;
const populationSpan = document.getElementById("population") as HTMLSpanElement;

fg.width = screen.width;
fg.height =
  screen.height - (document.getElementById("head")?.offsetHeight ?? 0);
pbg.width = screen.width;
pbg.height =
  screen.height - (document.getElementById("head")?.offsetHeight ?? 0);
bg.width = screen.width;
bg.height =
  screen.height - (document.getElementById("head")?.offsetHeight ?? 0);

window.dispatchEvent(new Event("canvas set-up"));
/*----------------------------------------------------------------------------
 *                                                                           *
 *                        G A M E   U T I L S                                *
 *                                                                           *
 *---------------------------------------------------------------------------*/
export let frame = 0;
//let gameInterval: number;
let started = false;
//let paused = false;

let mouse = { x: 0, y: 0 };

//frames
let LFT = 0;
const targetFPS = 15;
const frameDuration = 1000 / targetFPS;

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        G A M E   L O G I C                                *
 *                                                                           *
 *---------------------------------------------------------------------------*/

function StartGame() {
  started = true;
  requestAnimationFrame(UpdateGame);
}

function UpdateGame(timeStamp: number) {
  if (buildingInProgress) {
    checkBuildingPosition(preBuild.type);
  }
  frame++;
  const delta = timeStamp - LFT;
  if (delta >= frameDuration) {
    LFT = timeStamp - (delta % frameDuration);
    Render();
    process(
      placedBuildings.filter((b) => b.data.type === buildingTypes.FOUNDRY)
        .length,
      placedBuildings.filter((b) => b.data.type === buildingTypes.SHOP).length,
      placedBuildings.filter((b) => b.data.type === buildingTypes.HOUSE).length,
      placedBuildings.filter((b) => b.data.type === buildingTypes.FARM).length,
      placedBuildings.filter((b) => b.data.type === buildingTypes.MINES).length,
      placedBuildings.filter((b) => b.data.type === buildingTypes.MASON).length,
    );
  }
  populationSpan.innerText = `Population: ${citizens.length}`;
  if (frame == 3000)
    mpop(
      'Thx for playing Coding God! Please consider supporting me on Pateron <br> <a href="https://patreon.com/RUN1_IT"><img src="https://c5.patreon.com/external/favicon/rebrand/pwa-192.png" alt="Patreon" height="16" width="16">Support Me!</a>',
    );
  requestAnimationFrame(UpdateGame);
}

function Render() {}

export function cancelBuilding() {
  pbgCtx.clearRect(0, 0, pbg.width, pbg.height);
  setBuildingState(false);
}

function contruction(type: buildingTypes) {
  setBuildingState(true);
  placeBuilding(type);
  mpopClose(modal);
}

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        P L A Y E R                                        *
 *                                                                           *
 *---------------------------------------------------------------------------*/

const buildButtons = document.querySelectorAll(
  ".build",
) as NodeListOf<HTMLButtonElement>;
const modal = document.querySelector(".modal") as HTMLDivElement;
buildButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switch (button.value) {
      case "house":
        contruction(buildingTypes.HOUSE);
        break;
      case "foundry":
        contruction(buildingTypes.FOUNDRY);
        break;
      case "shop":
        contruction(buildingTypes.SHOP);
        break;
      case "farm":
        contruction(buildingTypes.FARM);
        break;
      case "mines":
        contruction(buildingTypes.MINES);
        break;
      case "path":
        contruction(buildingTypes.PATH);
        break;
      case "mason":
        contruction(buildingTypes.MASON);
      default:
        break;
    }
  });
});

addEventListener("mousemove", function (event) {
  const rect = fg.getBoundingClientRect();
  const mouseX =
    ((event.clientX - rect.left) / (rect.right - rect.left)) * fg.width;
  const mouseY =
    ((event.clientY - rect.top) / (rect.bottom - rect.top)) * fg.height;
  mouse = { x: mouseX, y: mouseY };
});

addEventListener("keydown", function (event) {
  if (event.key === "b") {
    mpop("content", "Cancel", true, "Build Menu");
    //resumeGame();
  }
  if (event.key === "c") {
    setBuildingState(false);
    priceTag.innerText = ``;
    removeBuildingAtPosition(mouse);
    pbgCtx.clearRect(0, 0, pbg.width, pbg.height);
  }

  if (event.key === " ") {
    if (buildingInProgress) {
      setBuildingState(false);
      placeBuilding(preBuild.type);
      if (preBuild.type == buildingTypes.PATH) setBuildingState(true);
      pbgCtx.clearRect(0, 0, pbg.width, pbg.height);
    }
    priceTag.innerText = ``;
  }
  if (event.key === "Escape") {
    if (buildingInProgress) {
      setBuildingState(false);
      pbgCtx.clearRect(0, 0, pbg.width, pbg.height);
      priceTag.innerText = ``;
    }
    //resumeGame();
    mpopClose(modal);
  }
});

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        T E C H N I C A L                                  *
 *                                                                           *
 *---------------------------------------------------------------------------*/

/*addEventListener("visibilitychange", function() {
    if (document.hidden){
        paused = true;
    } else {
        requestAnimationFrame(UpdateGame);
        paused = false;
    }
});*/

export function loadJSON(saveSlot: number) {
  const dataStr = localStorage.getItem(`saveSlot${saveSlot}`);
  if (dataStr) {
    const data = JSON.parse(dataStr);
    placedBuildings.length = 0;
    data.buildings.forEach((b: any) => placedBuildings.push(b));
    citizens.length = 0;
    data.citizens.forEach((c: any) => citizens.push(c));
    buildAssignValues(data.buildings);
  }
}

StartGame();
