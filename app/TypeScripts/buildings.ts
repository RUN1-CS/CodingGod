import { buyBuilding, mpop, populationData } from "./economy.js";
import { buildingData, Building } from "./classes.js";

import { priceTag } from "./game.js";

const fg = document.getElementById("fg") as HTMLCanvasElement;
const pbg = document.getElementById("pbg") as HTMLCanvasElement;
const bg = document.getElementById("bg") as HTMLCanvasElement;
const fgCtx = fg.getContext("2d") as CanvasRenderingContext2D;
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

const BuildingImgs = document.getElementsByClassName(
  "build-img",
) as HTMLCollectionOf<HTMLImageElement>;
for (let buildingImg of BuildingImgs) {
  buildingImg.style.display = "none";
  buildingImg.style.width = `${blockSize}px`;
  buildingImg.style.height = `${blockSize}px`;
}

export function getbuildingImage(id: string): HTMLImageElement {
  const rid = id.toLocaleLowerCase();
  for (let buildingImg of BuildingImgs) {
    if (buildingImg.id === rid) {
      return buildingImg;
    } else {
      continue;
    }
  }
  throw new Error(`Building image with id ${rid} not found`);
}

let mouse = { x: 0, y: 0 };

addEventListener("mousemove", function (event) {
  const rect = fg.getBoundingClientRect();
  const mouseX =
    ((event.clientX - rect.left) / (rect.right - rect.left)) * fg.width;
  const mouseY =
    ((event.clientY - rect.top) / (rect.bottom - rect.top)) * fg.height;
  mouse = { x: mouseX, y: mouseY };
});

//Building types
export enum buildingTypes {
  HOUSE,
  FOUNDRY,
  SHOP,
  FARM,
  PATH,
  MINES,
  MASON,
}

export let buildings = {
  house: new buildingData(buildingTypes.HOUSE, 0, 1.5, {
    width: 2 * blockSize,
    height: 2 * blockSize,
  }),
  foundry: new buildingData(
    buildingTypes.FOUNDRY,
    0,
    3,
    { width: 3 * blockSize, height: 3 * blockSize },
    2,
    { coal: 2, iron: 1 },
  ),
  shop: new buildingData(
    buildingTypes.SHOP,
    0,
    2,
    { width: 2 * blockSize, height: 2 * blockSize },
    2,
  ),
  farm: new buildingData(
    buildingTypes.FARM,
    0,
    2,
    { width: 4 * blockSize, height: 4 * blockSize },
    5,
  ),
  path: new buildingData(buildingTypes.PATH, 0, 1, {
    width: 1 * blockSize,
    height: 1 * blockSize,
  }),
  mines: new buildingData(
    buildingTypes.MINES,
    0,
    3,
    { width: 3 * blockSize, height: 3 * blockSize },
    3,
  ),
  mason: new buildingData(
    buildingTypes.MASON,
    0,
    2,
    { width: 2 * blockSize, height: 2 * blockSize },
    4,
  ),
};

export function getBuildingData(type: buildingTypes): buildingData {
  for (let building of Object.values(buildings)) {
    if (building.type === type) {
      return building;
    }
  }
  return {
    type: buildingTypes.PATH,
    price: 0,
    koeficient: 1,
    size: { width: blockSize, height: blockSize },
  };
}

export let productionAmplifiers = {
  mines: 1,
  foundries: 1,
  farms: 1,
  masons: 1,
};

interface size {
  width: number;
  height: number;
}

export interface position {
  x: number;
  y: number;
}

interface preBuildMark {
  type: buildingTypes;
  size: size;
  position: position;
  snap: position;
  valid: boolean;
}

export interface data {
  price: number;
  size: size;
}

export const gridWidth = Math.floor(bg.width / 50);
export const gridHeight = Math.floor(bg.height / 50);
export const grid: (Building | null)[][] = [];

for (let y = 0; y < gridHeight; y++) {
  grid[y] = new Array(gridWidth).fill(null);
}
export function updatePrices(
  foundries: number,
  shops: number,
  houses: number,
  farms: number,
  mines: number,
  masons: number,
) {
  buildings.house.price =
    Math.floor(100 * Math.pow(buildings.house.koeficient, houses)) - 100;
  buildings.foundry.price =
    Math.floor(500 * Math.pow(buildings.foundry.koeficient, foundries)) - 500;
  buildings.shop.price =
    Math.floor(300 * Math.pow(buildings.shop.koeficient, shops)) - 300;
  buildings.farm.price =
    Math.floor(400 * Math.pow(buildings.farm.koeficient, farms)) - 400;
  buildings.mines.price =
    Math.floor(700 * Math.pow(buildings.mines.koeficient, mines)) - 700;
  buildings.mason.price =
    Math.floor(600 * Math.pow(buildings.mason.koeficient, masons)) - 600;
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
  type: buildingTypes.HOUSE,
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

  priceTag.innerText = `Price: ${getBuildingData(preBuild.type).price} Money`;

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

export function checkBuildingPosition(type: buildingTypes): boolean | null {
  let size: size = getBuildingData(type).size;

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

export function placeBuilding(type: buildingTypes): boolean {
  let status = checkBuildingPosition(type);
  if (status == null) return false;
  if (!buyBuilding(getBuildingData(type))) return false;
  if (!status) {
    let newBuilding = new Building(type, preBuild.snap, populationData);
    placedBuildings.push(newBuilding);
    renderBuildings();
    return true;
  } else {
    if (!buildingInProgress) mpop("Cannot place building here!");
    return false;
  }
}

export function removeBuildingAtPosition(position: position) {
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
    if (building.data.type === buildingTypes.HOUSE) {
      for (let member of building.householdMembers ?? []) {
        member.die(populationData, placedBuildings);
      }
    }
    bgCtx.clearRect(0, 0, bg.width, bg.height);
    renderBuildings();
  }
}

export function setBuildingState(set: boolean) {
  buildingInProgress = set;
}

export function buildAssignValues(pb: any) {
  placedBuildings = pb;
  renderBuildings();
}
