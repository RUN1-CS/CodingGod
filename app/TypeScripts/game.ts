import { process, populationData } from "./economy.js";
import { checkBuildingPosition, preBuild } from "./buildings.js";
import type { time } from "./types.js";

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        C A N V A S   S E T   U P                          *
 *                                                                           *
 *---------------------------------------------------------------------------*/
export const fg = document.getElementById("fg") as HTMLCanvasElement;
export const pbg = document.getElementById("pbg") as HTMLCanvasElement;
export const bg = document.getElementById("bg") as HTMLCanvasElement;
export const fgCtx = fg.getContext("2d") as CanvasRenderingContext2D;
export const pbgCtx = pbg.getContext("2d") as CanvasRenderingContext2D;
export const bgCtx = bg.getContext("2d") as CanvasRenderingContext2D;

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
export let paused = false;

//frames
let LFT = 0;
const targetFPS = 15;
const frameDuration = 1000 / targetFPS;

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        G A M E   L O G I C                                *
 *                                                                           *
 *---------------------------------------------------------------------------*/

function UpdateGame(timeStamp: number) {
  if (preBuild.buildingInProgress) {
    checkBuildingPosition(preBuild.type);
  }
  frame++;
  const delta = timeStamp - LFT;
  if (delta >= frameDuration) {
    LFT = timeStamp - (delta % frameDuration);
    process();
  }
  populationSpan.innerText = `Population: ${populationData.population.length}`;
  if (frame === 25500) {
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

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        T E C H N I C A L                                  *
 *                                                                           *
 *---------------------------------------------------------------------------*/

addEventListener("visibilitychange", function () {
  if (document.hidden) {
    paused = true;
  } else {
    requestAnimationFrame(UpdateGame);
    paused = false;
  }
});

requestAnimationFrame(UpdateGame);
