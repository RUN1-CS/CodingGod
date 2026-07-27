import {
  buildingTypes,
  getBuildingData,
  blockSize,
  getbuildingImage,
  grid,
  gridWidth,
  gridHeight,
} from "./buildings.js";
import type { position } from "./buildings.js";

import { optimizeUnits } from "./economy.js";

import { bgCtx, frame } from "./game.js";

export class buildingData {
  type: buildingTypes;
  price: number;
  koeficient: number;
  size: {
    width: number;
    height: number;
  };
  productionSpeed?: number | undefined;
  requirements?: { [key: string]: number | undefined };
  constructor(
    type: buildingTypes,
    price: number,
    koeficient: number,
    size: { width: number; height: number },
    productionSpeed?: number,
    requirements?: { [key: string]: number },
  ) {
    this.type = type;
    this.price = price;
    this.koeficient = koeficient;
    this.size = size;
    this.productionSpeed = productionSpeed;
    this.requirements = requirements ?? {};
  }
}

export class Building {
  data: buildingData;
  position: position;
  householdMembers?: Citizen[] = [];
  maxMembers?: number = 5;
  prduces?: { [key: string]: number } = {};
  constructor(type: buildingTypes, position: position, population: Population) {
    this.data = getBuildingData(type);
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
    if (type === buildingTypes.HOUSE) {
      for (let i = 0; i < Math.floor(Math.random() * 5 + 1); i++) {
        this.householdMembers?.push(population.birth());
      }
    }
  }

  render() {
    bgCtx.drawImage(
      getbuildingImage(buildingTypes[this.data.type]),
      this.position.x,
      this.position.y,
      this.data.size.width,
      this.data.size.height,
    );
  }
}

export class Citizen {
  happiness: number;
  hunger: number;
  age: number;
  constructor(happiness: number, hunger: number) {
    this.happiness = happiness;
    this.hunger = hunger;
    this.age = 0;
  }

  die(population: Population, buildings: Building[]) {
    const index = population.population.indexOf(this);
    if (index !== -1) {
      population.population.splice(index, 1);
    }
    buildings.forEach((building) => {
      if (building.householdMembers) {
        const memberIndex = building.householdMembers.indexOf(this);
        if (memberIndex !== -1) {
          building.householdMembers.splice(memberIndex, 1);
        }
      }
    });
  }
}

export class Player {
  resources: Record<string, Resource> = {
    coal: new Resource("coal", 14, 0.2, 5, 0, 0.2, 100, 5000, "raw"),
    iron: new Resource("iron", 13, 0.15, 4, 0, 0.4, 200, 10000, "raw"),
    stone: new Resource("stone", 7, 0.03, 1, 0, 0.1, 50, 2500, "raw"),
    refinedCoal: new Resource(
      "refinedCoal",
      27,
      0.2,
      18,
      0,
      0.1,
      100,
      5000,
      "processed",
    ),
    steel: new Resource("steel", 55, 0.15, 46, 0, 0.8, 200, 10000, "processed"),
    stoneBricks: new Resource(
      "stoneBricks",
      13,
      0.1,
      4,
      0,
      0.1,
      50,
      2500,
      "processed",
    ),
    food: new Resource("food", 5, 0.05, 1, 0, 0.1, 50, 2500, "processed"),
  };
  finances: number = 1000;

  getSupply(resourceName: string): number {
    return this.resources[resourceName]?.demand ?? 0;
  }
}

export class Population {
  taxes: number = 0;
  morale: number = 100;
  starvation: boolean = false;
  population: Citizen[] = [];

  taxCollection() {
    return this.population.length * this.taxes;
  }

  hungerProcess() {
    const hungryCitizens = this.population.filter(
      (citizen) => citizen.hunger > 50,
    );
    if (hungryCitizens.length > 0) {
      this.starvation = true;
      for (const citizen of hungryCitizens) {
        citizen.hunger += 5; // Increase hunger for those who are already hungry
        citizen.happiness -= 5; // Decrease happiness due to hunger
      }
    } else {
      this.starvation = false;
    }
  }

  agePopulation(buildings: Building[]) {
    for (const citizen of this.population) {
      citizen.age += 1;
      citizen.hunger += 1; // Increase hunger as they age
      citizen.happiness -= 0.5; // Decrease happiness slightly as they age
      if (citizen.age > 80 && Math.random() < citizen.age / 100) {
        citizen.die(this, buildings); // Citizens have a chance to die as they age
      }
    }
  }

  condicionedBirth(
    births: number,
    happiness: number,
    hunger: number,
    household: Building,
  ): void {
    if (
      household.householdMembers!.length >= 2 &&
      happiness >= 70 &&
      hunger >= 70
    ) {
      for (let i = 0; i < births; i++) {
        const newCitizen = new Citizen(100, 100);
        this.population.push(newCitizen);
        household.householdMembers?.push(newCitizen);
      }
    }
  }

  birth(): Citizen {
    return new Citizen(100, 100);
  }
}

export class Resource {
  name: string;
  ammount: number = 0;
  price: number;
  k: number;
  minimum: number;
  growth: number;
  d: number;
  t0: number;
  tsat: number;
  type: "raw" | "processed" = "raw";
  demand: number = 0;
  predecessor?: Resource | undefined;
  constructor(
    name: string,
    price: number,
    k: number,
    minimum: number,
    growth: number,
    d: number,
    t0: number,
    tsat: number,
    type: "raw" | "processed" = "raw",
    predecessor?: Resource,
  ) {
    this.name = name;
    this.price = price;
    this.k = k;
    this.minimum = minimum;
    this.growth = growth;
    this.d = d;
    this.t0 = t0;
    this.tsat = tsat;
    this.type = type;
    this.predecessor = predecessor;
  }

  getProducers(buildings: Building[]): Building[] {
    return buildings.filter(
      (building) => building.prduces?.[this.name] !== undefined,
    );
  }

  process(player: Player, buildings: Building[]) {
    const producingBuildings = new Set<Building>();

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const building = grid[y]?.[x];
        if (building instanceof Building && building.prduces?.[this.name]) {
          producingBuildings.add(building);
        }
      }
    }

    const producers = this.getProducers(buildings);
    const production =
      producers[0]?.data.productionSpeed ?? 0 * producers.length;

    const currentResource = player.resources[this.name];
    if (currentResource) {
      currentResource.ammount = production;
    }

    if (this.type === "processed" && this.predecessor) {
      const predecessorName = this.predecessor.name;
      const predecessorResource = player.resources[predecessorName];
      if (predecessorResource) {
        predecessorResource.ammount = Math.max(
          0,
          (predecessorResource.ammount ?? 0) - production,
        );
      }
    }
  }

  priceChange(
    player: Player,
    population: Population,
    productionBuildings: number,
    sell: boolean = false,
  ) {
    if (this.growth > 0) {
      if (this.growth > 100) this.growth -= 100;
      else this.growth = 0;
      this.t0 += 30;
      this.tsat += 60;
    } else if (this.price <= this.minimum && this.t0 < frame) {
      this.growth = (Math.random() * (10 - 1) + 1) * 1000;
    }
    const supply = sell ? player.getSupply(this.name) : 0;
    const maxDemand = (population.population.length ?? 1) * 0.3;
    const logistic = maxDemand / (1 + Math.exp(-this.k * (frame - this.t0)));
    const decay = Math.exp(
      -this.d * Math.max(0, optimizeUnits(frame) - optimizeUnits(this.tsat)),
    );
    const PreDemand = logistic * decay;
    this.demand = Math.min(PreDemand, maxDemand);
    const aF = 0.05 * (maxDemand / Math.max(1, productionBuildings));
    const newPrice = (this.price += aF * (this.demand - supply));
    this.price = Math.max(this.minimum, newPrice);
  }
}
