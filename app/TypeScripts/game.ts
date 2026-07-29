import { process, populationData } from "./economy.js";
import {
  buildingInProgress,
  checkBuildingPosition,
  preBuild,
  placedBuildings,
  placeBuilding,
  setBuildingState,
  removeBuildingAtPosition,
  buildAssignValues,
} from "./buildings.js";
import { closeTerminal } from "./terminal.js";
import type { time } from "./types.js";

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
export let year = 0;
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
    process();
  }
  populationSpan.innerText = `Population: ${populationData.population.length}`;
  if (frame == 3000) {
    // mpop(
    //   'Thx for playing Coding God! Please consider supporting me on Pateron <br> <a href="https://patreon.com/RUN1_IT"><img src="https://c5.patreon.com/external/favicon/rebrand/pwa-192.png" alt="Patreon" height="16" width="16">Support Me!</a>',
    // );
  } else if (frame === 25500) {
    frame = 0;
    year++;
  }

  updateTime(getTime(frame));
  requestAnimationFrame(UpdateGame);
}

// A day is 24 hours or 25 500 frames, so 1 hour is 1250 frames. A minute is 20.8333 frames, and a second is 0.3472 frames.
export function getTime(frame: number): time {
  const totalSeconds = Math.floor(frame / 0.3472);
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds };
}

function updateTime(time: time) {
  const timeValue = document.getElementById("time-value") as HTMLSpanElement;
  timeValue.textContent = `${time.hours.toString().padStart(2, "0")}:${time.minutes
    .toString()
    .padStart(2, "0")}:${time.seconds.toString().padStart(2, "0")}`;
}

export function cancelBuilding() {
  pbgCtx.clearRect(0, 0, pbg.width, pbg.height);
  setBuildingState(false);
}

export function construction(type: string) {
  setBuildingState(true);
  placeBuilding(type);
  closeTerminal();
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
    construction(button.value);
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
      if (preBuild.type == "path") setBuildingState(true);
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
    // resumeGame();
    // mpopClose(modal);
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
    populationData.population.length = 0;
    data.citizens.forEach((c: any) => populationData.population.push(c));
    buildAssignValues(data.buildings);
  }
}

StartGame();
