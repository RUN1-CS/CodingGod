import { buyBuilding, populationData } from "./economy.js";
import { paused, fg, pbg, bg, pbgCtx, bgCtx } from "./game.js";
import { Citizen, Population } from "./classes.js";

import type { position, size } from "./types.js";
import { closeTerminal, logToTerminal } from "./terminal.js";

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
    if (preBuild.buildingInProgress) {
      cancelBuilding();
      preBuild.placeBuilding();
      if (preBuild.type == "path") preBuild.buildingInProgress = true;
    }
  }
  if (event.key === "Escape") {
    if (preBuild.buildingInProgress) {
      cancelBuilding();
      logToTerminal("Building placement canceled.");
    }
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

export class buildingData {
  type: string;
  price: number;
  priceAddition: number = 0;
  koeficient: number;
  size: size;
  produces?: { [key: string]: number } = {};
  requires?: { [key: string]: number } = {};
  amplifier?: number = 1;
  constructor(
    type: string,
    price: number,
    priceAddition: number,
    koeficient: number,
    size: size,
    produces?: { [key: string]: number },
    requires?: { [key: string]: number },
  ) {
    this.type = type;
    this.price = price;
    this.priceAddition = priceAddition;
    this.koeficient = koeficient;
    this.size = size;
    this.produces = produces ?? {};
    this.requires = requires ?? {};
  }

  getbuildingImage(): HTMLImageElement {
    const rid = this.type.toLocaleLowerCase();
    for (let buildingImg of BuildingImgs) {
      if (buildingImg.id === rid) {
        return buildingImg;
      } else {
        continue;
      }
    }
    throw new Error(`Building image with id ${rid} not found`);
  }

  getBuildingData(): buildingData {
    for (let building of Object.values(buildingDefinitions) as buildingData[]) {
      if (building.type === this.type) {
        return building;
      }
    }
    return this;
  }
}

export class PreBuild {
  type: string;
  position: position;
  size: size;
  snap: position;
  valid: boolean = false;
  buildingInProgress = false;
  constructor(building: buildingData, position: position) {
    this.type = building.type;
    this.position = position;
    this.size = building.size;
    this.snap = { x: 0, y: 0 };
    this.valid = false;
  }

  renderPreBuild(color: string = "#0000FF") {
    pbgCtx.save();
    pbgCtx.globalAlpha = 0.5;
    pbgCtx.fillStyle = color;
    pbgCtx.fillRect(
      this.snap.x,
      this.snap.y,
      this.size.width,
      this.size.height,
    );
    const sx = Math.max(0, this.snap.x);
    const sy = Math.max(0, this.snap.y);
    const sw = Math.max(0, this.size.width);
    const sh = Math.max(0, this.size.height);

    priceTag.innerText = `Price: ${buildingDefinitions[this.type]?.price} Money`;

    if (sy > 0) pbgCtx.clearRect(0, 0, pbg.width, sy);
    const bottomY = sy + sh;
    if (bottomY < pbg.height)
      pbgCtx.clearRect(0, bottomY, pbg.width, pbg.height - bottomY);
    if (sx > 0) pbgCtx.clearRect(0, sy, sx, sh);
    const rightX = sx + sw;
    if (rightX < pbg.width)
      pbgCtx.clearRect(rightX, sy, pbg.width - rightX, sh);

    let clearArea = { x: 0, y: 0, width: 0, height: 0 };
    pbgCtx.clearRect(
      clearArea.x,
      clearArea.y,
      clearArea.width,
      clearArea.height,
    );
    pbgCtx.restore();
  }

  placeBuilding(): boolean | null {
    const status = checkBuildingPosition(this.type);
    if (status == null) return null;
    const buildingDefinition = buildingDefinitions[this.type];
    if (buildingDefinition == null) return false;
    if (!buyBuilding(buildingDefinition)) return false;
    if (!status) {
      let newBuilding = new Building(this.type, preBuild.snap, populationData);
      placedBuildings.push(newBuilding);
      renderBuildings();
      logToTerminal(`Building ${this.type} has been placed.`);
      return true;
    } else {
      return null;
    }
  }
}

export class Building {
  data: buildingData;
  position: position;
  householdMembers?: Citizen[] = [];
  maxMembers?: number = 5;
  constructor(type: string, position: position, population: Population) {
    this.data =
      buildingDefinitions[type] ??
      new buildingData(type, 0, 0, 1, { width: blockSize, height: blockSize });
    this.position = position;
    for (
      let y = this.position.y;
      y < this.position.y + this.data.size.height;
      y += blockSize
    ) {
      for (
        let x = this.position.x;
        x < this.position.x + this.data.size.width;
        x += blockSize
      ) {
        const gy = Math.floor(y / blockSize);
        const gx = Math.floor(x / blockSize);
        if (gy < 0 || gx < 0 || gy >= gridHeight || gx >= gridWidth) continue;
        if (!grid[gy]) grid[gy] = new Array(gridWidth).fill(null);
        grid[gy][gx] = this;
      }
    }
    if (type === "house") {
      for (let i = 0; i < Math.floor(Math.random() * 5 + 1); i++) {
        this.householdMembers?.push(population.birth());
      }
    }
  }

  render() {
    bgCtx.drawImage(
      this.data.getbuildingImage(),
      this.position.x,
      this.position.y,
      this.data.size.width,
      this.data.size.height,
    );
  }
}

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

export let preBuild: PreBuild = new PreBuild(buildingDefinitions["house"]!, {
  x: 0,
  y: 0,
});

export function checkBuildingPosition(type: string): boolean | null {
  const size = buildingDefinitions[type]?.size;

  if (!size) {
    return null;
  }

  preBuild.type = type;
  preBuild.size = size;
  preBuild.snap = snapToGrid({ x: mouse.x, y: mouse.y });

  if (preBuild.buildingInProgress) {
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
    if (preBuild.buildingInProgress) {
      preBuild.renderPreBuild("#FFFF00");
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
      if (preBuild.buildingInProgress) {
        preBuild.valid = false;
        preBuild.renderPreBuild("#FF0000");
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
        if (preBuild.buildingInProgress) {
          preBuild.valid = false;
          preBuild.renderPreBuild("#FF0000");
          return null;
        } else {
          return true;
        }
      }
      if (grid[gy]?.[gx] != null) {
        if (preBuild.buildingInProgress) {
          preBuild.valid = false;
          preBuild.renderPreBuild("#FF0000");
          return null;
        } else {
          return true;
        }
      }
    }
  }

  if (preBuild.buildingInProgress) {
    preBuild.valid = true;
    preBuild.renderPreBuild("#00FF00");
    return null;
  }
  return false;
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

export function buildAssignValues(pb: any) {
  placedBuildings = pb;
  renderBuildings();
}

function cancelBuilding() {
  pbgCtx.clearRect(0, 0, pbg.width, pbg.height);
  preBuild.buildingInProgress = false;
  priceTag.innerText = ``;
}

export function construction(type: string) {
  closeTerminal();
  preBuild.buildingInProgress = true;
  preBuild = new PreBuild(buildingDefinitions[type]!, { x: 0, y: 0 });
}
