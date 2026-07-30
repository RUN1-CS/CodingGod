import { shopsOpenned } from "./economy.js";

import { frame } from "./game.js";

import { Building } from "./buildings.js";

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        P O P U L A T I O N                                *
 *                                                                           *
 *---------------------------------------------------------------------------*/

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

export class Population {
  taxes: number = 0;
  starvation: boolean = false;
  population: Citizen[] = [];

  getMorale(): number {
    let totalHappiness = 0;
    this.population.forEach((citizen) => {
      totalHappiness += citizen.happiness;
    });
    return totalHappiness / this.population.length;
  }

  taxCollection() {
    return this.population.length * this.taxes;
  }

  update() {
    // Hunger
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

    // Morale
    const morale = this.getMorale();
    const moraleUpdate =
      this.taxes * ((morale - 99) / 100) - (this.starvation ? 10 : 0);
    this.population.forEach((citizen) => {
      citizen.happiness += citizen.age / 10 / Math.round(moraleUpdate);
      citizen.happiness = Math.max(0, Math.min(100, citizen.happiness));
    });
  }

  agePopulation(buildings: Building[]) {
    let hunger = 0;
    this.population.forEach((citizen) => {
      citizen.age += 1;
      citizen.happiness -= 0.5; // Decrease happiness slightly as they age
      if (citizen.age > 80 && Math.random() < citizen.age / 100) {
        citizen.die(this, buildings); // Citizens have a chance to die as they age
      }
      hunger += citizen.hunger;
    });
    hunger /= this.population.length;
    const houses = buildings.filter(
      (building) => building.data.type === "house",
    );
    houses.forEach((house) => {
      this.condicionedBirth(
        Math.floor(Math.random() * 3), // Random number of births (0-2)
        this.getMorale(),
        hunger,
        house,
      );
    });
  }

  condicionedBirth(
    births: number,
    happiness: number,
    hunger: number,
    household: Building,
  ): void {
    if (
      household.householdMembers!.length >= 2 &&
      household.householdMembers!.length + births < household.maxMembers! &&
      births > 0 &&
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
    const newCitizen = new Citizen(100, 100);
    this.population.push(newCitizen);
    return newCitizen;
  }
}

/*----------------------------------------------------------------------------
 *                                                                           *
 *                           O T H E R S                                     *
 *                                                                           *
 *---------------------------------------------------------------------------*/

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
    food: new Resource("food", 5, 0.05, 1, 0, 0.1, 50, 2500),
  };
  finances: number = 1000;

  getSupply(resourceName: string): number {
    return this.resources[resourceName]?.demand ?? 0;
  }

  sell(buildings: Building[]) {
    const shops = buildings.filter((building) => building.data.type === "shop");

    if (shopsOpenned) {
      if (this.resources["stoneBricks"]!.ammount > 10 && shops.length > 0) {
        this.finances += shops.length * 10;
        this.resources["stoneBricks"]!.ammount -= shops.length * 10;
      }
      if (this.resources["steel"]!.ammount > 5 && shops.length > 0) {
        this.finances += shops.length * 20;
        this.resources["steel"]!.ammount -= shops.length * 5;
      }
    }
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
  }

  producing(buildings: Building[]): number {
    const producers = buildings.filter(
      (building) => building.data.produces?.[this.name],
    );
    let producing = 0;
    producers.forEach((producer) => {
      producing += producer.data.produces?.[this.name] ?? 0;
    });
    return producing;
  }

  consuming(buildings: Building[]): number {
    const consumers = buildings.filter(
      (building) => building.data.requires?.[this.name],
    );
    let consuming = 0;
    consumers.forEach((consumer) => {
      const req = consumer.data.requires?.[this.name] ?? 0;
      if (consumer.data.type === "house" && consumer.householdMembers) {
        consuming += req * consumer.householdMembers.length;
      } else {
        consuming += req;
      }
    });
    return consuming;
  }

  process(buildings: Building[]) {
    const producers = this.producing(buildings);
    const production = (producers ?? 0) * buildings.length;

    this.ammount += production;

    const consumers = this.consuming(buildings);
    const consumption = (consumers ?? 0) * buildings.length;

    this.ammount -= consumption;
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
    const decay = Math.exp(-this.d * Math.max(0, frame - this.tsat));
    const PreDemand = logistic * decay;
    this.demand = Math.min(PreDemand, maxDemand);
    const aF = 0.05 * (maxDemand / Math.max(1, productionBuildings));
    const newPrice = (this.price += aF * (this.demand - supply));
    this.price = Math.max(this.minimum, newPrice);
  }
}
