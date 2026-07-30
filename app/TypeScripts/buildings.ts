import { buyBuilding, populationData } from "./economy.js";
import { buildingData, Building } from "./classes.js";
import { paused } from "./game.js";

import type { preBuildMark, position } from "./types.js";
import { closeTerminal } from "./terminal.js";

const fg = document.getElementById("fg") as HTMLCanvasElement;
const pbg = document.getElementById("pbg") as HTMLCanvasElement;
const bg = document.getElementById("bg") as HTMLCanvasElement;

const pbgCtx = pbg.getContext("2d") as CanvasRenderingContext2D;
const bgCtx = bg.getContext("2d") as CanvasRenderingContext2D;

fg.width = screen.width;
fg.height =
  screen.height - (document.getElementById("head")?.offsetHeight ?? 0);
pbg.width = screen.width;
pbg.height =
  screen.height - (document.getElementById("head")?.offsetHeight ?? 0);
bg.width = screen.width;
bg.height =
  screen.height - (document.getElementById("head")?.offsetHeight ?? 0);

export let blockSize = 50;

export const BuildingImgs = document.getElementsByClassName(
  "build-img",
) as HTMLCollectionOf<HTMLImageElement>;
for (let buildingImg of BuildingImgs) {
  buildingImg.style.display = "none";
  buildingImg.style.width = `${blockSize}px`;
  buildingImg.style.height = `${blockSize}px`;
}

export const priceTag = document.getElementById("priceTag") as HTMLDivElement;

let mouse = { x: 0, y: 0 };

addEventListener("keydown", function (event) {
  if (paused) return;
  if (event.key === "c") {
    removeBuildingAtPosition(mouse);
    cancelBuilding();
  }

  if (event.key === " ") {
    if (buildingInProgress) {
      cancelBuilding();
      placeBuilding(preBuild.type);
      if (preBuild.type == "path") setBuildingState(true);
    }
  }
  if (event.key === "Escape") {
    if (buildingInProgress) cancelBuilding();
  }
});

addEventListener("mousemove", function (event) {
  if (paused) return;
  const rect = fg.getBoundingClientRect();
  const mouseX =
    ((event.clientX - rect.left) / (rect.right - rect.left)) * fg.width;
  const mouseY =
    ((event.clientY - rect.top) / (rect.bottom - rect.top)) * fg.height;
  mouse = { x: mouseX, y: mouseY };
});

export const buildingDefinitions: { [key: string]: buildingData } = {
  house: new buildingData(
    "house",
    0,
    100,
    1.5,
    {
      width: 2 * blockSize,
      height: 2 * blockSize,
    },
    {},
    { food: 1 },
  ),
  foundry: new buildingData(
    "foundry",
    0,
    500,
    3,
    {
      width: 3 * blockSize,
      height: 3 * blockSize,
    },
    { steel: 1 },
    { coal: 1, iron: 1 },
  ),
  shop: new buildingData("shop", 0, 300, 2, {
    width: 2 * blockSize,
    height: 2 * blockSize,
  }),
  farm: new buildingData(
    "farm",
    0,
    400,
    2,
    { width: 4 * blockSize, height: 4 * blockSize },
    { food: 10 },
  ),
  path: new buildingData("path", 0, 0, 1, {
    width: 1 * blockSize,
    height: 1 * blockSize,
  }),
  mines: new buildingData(
    "mines",
    0,
    700,
    3,
    { width: 3 * blockSize, height: 3 * blockSize },
    { coal: 1, iron: 1 },
  ),
  mason: new buildingData(
    "mason",
    0,
    600,
    2,
    { width: 2 * blockSize, height: 2 * blockSize },
    { stoneBricks: 1 },
    { stone: 1 },
  ),
};

export const gridWidth = Math.floor(bg.width / 50);
export const gridHeight = Math.floor(bg.height / 50);
export const grid: (Building | null)[][] = [];

for (let y = 0; y < gridHeight; y++) {
  grid[y] = new Array(gridWidth).fill(null);
}

export function updatePrices() {
  for (let buildingType in buildingDefinitions) {
    buildingDefinitions[buildingType]!.price =
      Math.floor(
        buildingDefinitions[buildingType]!.priceAddition *
          Math.pow(
            buildingDefinitions[buildingType]!.koeficient,
            placedBuildings.filter((b) => b.data.type === buildingType).length,
          ),
      ) - buildingDefinitions[buildingType]!.priceAddition;
  }
}

export let buildingInProgress = false;

export let placedBuildings: Building[] = [];

function renderBuildings() {
  for (let building of placedBuildings) {
    building.render();
  }
}

function snapToGrid(position: position): position {
  return {
    x: Math.floor(position.x / blockSize) * blockSize,
    y: Math.floor(position.y / blockSize) * blockSize,
  };
}

export let preBuild: preBuildMark = {
  type: "house",
  position: { x: mouse.x, y: mouse.y },
  size: { width: blockSize, height: blockSize },
  snap: { x: 0, y: 0 },
  valid: false,
};

function renderPreBuild(preBuild: preBuildMark, color: string = "#0000FF") {
  pbgCtx.save();
  pbgCtx.globalAlpha = 0.5;
  pbgCtx.fillStyle = color;
  pbgCtx.fillRect(
    preBuild.snap.x,
    preBuild.snap.y,
    preBuild.size.width,
    preBuild.size.height,
  );
  const sx = Math.max(0, preBuild.snap.x);
  const sy = Math.max(0, preBuild.snap.y);
  const sw = Math.max(0, preBuild.size.width);
  const sh = Math.max(0, preBuild.size.height);

  priceTag.innerText = `Price: ${buildingDefinitions[preBuild.type]?.price} Money`;

  if (sy > 0) pbgCtx.clearRect(0, 0, pbg.width, sy);
  const bottomY = sy + sh;
  if (bottomY < pbg.height)
    pbgCtx.clearRect(0, bottomY, pbg.width, pbg.height - bottomY);
  if (sx > 0) pbgCtx.clearRect(0, sy, sx, sh);
  const rightX = sx + sw;
  if (rightX < pbg.width) pbgCtx.clearRect(rightX, sy, pbg.width - rightX, sh);

  let clearArea = { x: 0, y: 0, width: 0, height: 0 };
  pbgCtx.clearRect(clearArea.x, clearArea.y, clearArea.width, clearArea.height);
  pbgCtx.restore();
}

export function checkBuildingPosition(type: string): boolean | null {
  const size = buildingDefinitions[type]?.size;

  if (!size) {
    return null;
  }

  preBuild.type = type;
  preBuild.size = size;
  preBuild.snap = snapToGrid({ x: mouse.x, y: mouse.y });

  if (buildingInProgress) {
    preBuild.position = preBuild.snap;
  } else {
    pbgCtx.clearRect(
      preBuild.snap.x,
      preBuild.snap.y,
      preBuild.size.width,
      preBuild.size.height,
    );
  }

  if (
    preBuild.snap.x < 0 ||
    preBuild.snap.y < 0 ||
    preBuild.snap.x + size.width > bg.width ||
    preBuild.snap.y + size.height > bg.height
  ) {
    if (buildingInProgress) {
      renderPreBuild(preBuild, "#FFFF00");
      return null;
    } else {
      return true;
    }
  }

  for (let placedBuilding of placedBuildings) {
    if (
      !(
        preBuild.snap.x + size.width <= placedBuilding.position.x ||
        preBuild.snap.x >=
          placedBuilding.position.x + placedBuilding.data.size.width ||
        preBuild.snap.y + size.height <= placedBuilding.position.y ||
        preBuild.snap.y >=
          placedBuilding.position.y + placedBuilding.data.size.height
      )
    ) {
      if (buildingInProgress) {
        preBuild.valid = false;
        renderPreBuild(preBuild, "#FF0000");
        return null;
      }
      return true;
    }
  }

  for (
    let y = preBuild.snap.y;
    y < preBuild.snap.y + size.height;
    y += blockSize
  ) {
    for (
      let x = preBuild.snap.x;
      x < preBuild.snap.x + size.width;
      x += blockSize
    ) {
      const gy = Math.floor(y / blockSize);
      const gx = Math.floor(x / blockSize);
      if (gy < 0 || gx < 0 || gy >= gridHeight || gx >= gridWidth) {
        if (buildingInProgress) {
          preBuild.valid = false;
          renderPreBuild(preBuild, "#FF0000");
          return null;
        } else {
          return true;
        }
      }
      if (grid[gy]?.[gx] != null) {
        if (buildingInProgress) {
          preBuild.valid = false;
          renderPreBuild(preBuild, "#FF0000");
          return null;
        } else {
          return true;
        }
      }
    }
  }

  if (buildingInProgress) {
    preBuild.valid = true;
    renderPreBuild(preBuild);
    return null;
  }
  return false;
}

function placeBuilding(type: string): boolean | null {
  const status = checkBuildingPosition(type);
  if (status == null) return null;
  const buildingDefinition = buildingDefinitions[type];
  if (buildingDefinition == null) return false;
  if (!buyBuilding(buildingDefinition)) return false;
  if (!status) {
    let newBuilding = new Building(type, preBuild.snap, populationData);
    placedBuildings.push(newBuilding);
    renderBuildings();
    return true;
  } else {
    return null;
  }
}

function removeBuildingAtPosition(position: position) {
  const snappedPos = snapToGrid(position);
  const gridX = Math.floor(snappedPos.x / blockSize);
  const gridY = Math.floor(snappedPos.y / blockSize);
  const building = grid[gridY]?.[gridX];
  if (building != null) {
    for (let i = 0; i < placedBuildings.length; i++) {
      if (placedBuildings[i] === building) {
        placedBuildings.splice(i, 1);
        break;
      }
    }
    for (
      let y = building.position.y;
      y < building.position.y + building.data.size.height;
      y += blockSize
    ) {
      for (
        let x = building.position.x;
        x < building.position.x + building.data.size.width;
        x += blockSize
      ) {
        const gy = Math.floor(y / blockSize);
        const gx = Math.floor(x / blockSize);
        if (gy < 0 || gx < 0 || gy >= gridHeight || gx >= gridWidth) continue;
        if (grid[gy]) {
          grid[gy][gx] = null;
        }
      }
    }
    if (building.data.type === "house") {
      for (let member of building.householdMembers ?? []) {
        member.die(populationData, placedBuildings);
      }
    }
    bgCtx.clearRect(0, 0, bg.width, bg.height);
    renderBuildings();
  }
}

function setBuildingState(set: boolean) {
  buildingInProgress = set;
}

export function buildAssignValues(pb: any) {
  placedBuildings = pb;
  renderBuildings();
}

function cancelBuilding() {
  pbgCtx.clearRect(0, 0, pbg.width, pbg.height);
  setBuildingState(false);
  priceTag.innerText = ``;
}

export function construction(type: string): boolean | null {
  setBuildingState(true);
  closeTerminal();
  return placeBuilding(type);
}
