import {
  buildingDefinitions,
  construction,
  placedBuildings,
  Building,
} from "./buildings.js";
import { player, populationData } from "./economy.js";
import { saveJSON, loadJSON } from "./saveLoad.js";

addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("command-input") as HTMLInputElement;
  const output = document.getElementById("output") as HTMLDivElement;

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      const fullInput = input.value.trim();
      const parts = fullInput.split(" ");
      const command = parts[0]!.toLowerCase();
      const args = parts.slice(1);

      const commandLine = document.createElement("p") as HTMLParagraphElement;
      commandLine.innerHTML = `<span style="color:#3b82f6;">master@economy:~$</span> ${fullInput}`;
      output.appendChild(commandLine);

      processCommand(command.toLowerCase(), args, output);

      input.value = "";
      output.scrollTop = output.scrollHeight;
    }
  });

  const openButton = document.getElementById("eco-term") as HTMLButtonElement;
  const terminal = document.getElementById(
    "economy-terminal",
  ) as HTMLDivElement;
  openButton.addEventListener("click", () => {
    terminal.style.display = "flex";
  });

  const closeButton = document.getElementById(
    "close-terminal",
  ) as HTMLSpanElement;
  closeButton.addEventListener("click", () => {
    closeTerminal();
  });
});

export function processCommand(
  cmd: string,
  args: string[],
  output: HTMLDivElement,
) {
  const response = document.createElement("p") as HTMLParagraphElement;
  response.style.color = "#a0a0a0";

  switch (cmd) {
    case "help":
      response.innerHTML =
        "Available commands: <br>- <b>about</b>: Learn more<br>- <b>clear</b>: Clear terminal<br>- <b>date</b>: View current date";
      break;
    case "about":
      response.textContent =
        "Economy Terminal vX.Y.Z - A terminal for managing your economy in the game.";
      break;
    case "date":
      response.textContent = new Date().toString();
      break;
    case "clear":
      output.innerHTML = "";
      return;
    case "build":
      if (args.length === 0) {
        for (const type in buildingDefinitions) {
          response.textContent += `${type}\n`;
        }
      } else if (args[0] === "list") {
        if (args.length === 1) {
          Object.values(buildingDefinitions).forEach((building) => {
            const buildingsOfType = placedBuildings.filter(
              (b) => b.data.type === building.type,
            );
            let ids = buildingsOfType
              .map((b) => placedBuildings.indexOf(b))
              .join(", ");
            if (buildingsOfType.length > 0) {
              response.textContent += `${building.type}: ${buildingsOfType.length} [${ids}]\n`;
            }
          });
        } else if (args.length === 2) {
          if (!isNaN(parseInt(args[1]!))) {
            const building: Building | undefined =
              placedBuildings[parseInt(args[1]!)];
            if (building) {
              let responseText = `Building ID: ${args[1]}, Type: ${building.data.type}, Position: (${building.position.x}, ${building.position.y})`;
              if (
                building.householdMembers &&
                building.householdMembers.length > 0
              ) {
                responseText += `\nHousehold Members: ${building.householdMembers.length}`;
              }
              if (
                building.data.produces &&
                Object.keys(building.data.produces).length > 0
              ) {
                responseText += `\nProduces: ${Object.entries(
                  building.data.produces,
                )
                  .map(([resource, amount]) => `${resource}: ${amount}`)
                  .join(", ")}`;
              }
              if (
                building.data.requires &&
                Object.keys(building.data.requires).length > 0
              ) {
                responseText += `\nRequires: ${Object.entries(
                  building.data.requires,
                )
                  .map(([resource, amount]) => `${resource}: ${amount}`)
                  .join(", ")}`;
              }
              response.textContent = responseText;
            } else {
              response.textContent = `Building not found: ${args[1]}`;
            }
          } else {
            const buildingType = args[1]!.toLowerCase();
            if (buildingDefinitions[buildingType]) {
              const buildingsOfType = placedBuildings.filter(
                (b) => b.data.type === buildingType,
              );
              for (const building of buildingsOfType) {
                const id = placedBuildings.indexOf(building);
                response.textContent += `ID: ${id}, Type: ${building.data.type}, Position: (${building.position.x}, ${building.position.y})\n`;
              }
            }
          }
        }
      } else {
        const buildingType = args[0]!.toLowerCase();
        if (buildingDefinitions[buildingType]) {
          response.textContent = `Building ${buildingType} selected.`;
          if (player.finances >= buildingDefinitions[buildingType].price) {
            construction(buildingType);
          } else {
            response.textContent += ` Insufficient funds (${player.finances} / ${buildingDefinitions[buildingType].price}).`;
          }
        } else {
          response.textContent = `Building not found: ${buildingType}`;
        }
      }
      break;
    case "taxes":
      if (args.length === 0) {
        response.textContent = `Current tax rate: ${populationData.taxes}%`;
      } else {
        const newTaxRate = parseFloat(args[0]!);
        if (!isNaN(newTaxRate) && newTaxRate >= 0 && newTaxRate <= 100) {
          populationData.taxes = newTaxRate;
          response.textContent = `Tax rate set to ${newTaxRate}%`;
        } else {
          response.textContent =
            "Invalid tax rate. Please enter a value between 0 and 100.";
        }
      }
      break;
    case "finances":
      response.textContent = `Current finances: ${player.finances}`;
      break;
    case "resources":
      response.textContent = `Resources: ${Object.entries(player.resources)
        .map(([name, resource]) => `${name}: ${resource.ammount}`)
        .join(", ")}`;
      break;
    case "population":
      if (args.length === 0) {
        response.textContent = `Population: ${populationData.population.length}`;
      } else if (args[0] === "morale") {
        response.textContent = `Morale: ${populationData.getMorale()}`;
      } else if (args[0] === "starvation") {
        response.textContent = `Starvation: ${populationData.starvation}`;
      } else {
        response.textContent =
          "Invalid argument for population command. Use 'morale' or 'starvation'.";
      }
      break;
    case "progress":
      if (args.length === 0) {
        const responseText =
          localStorage.getItem("saveSlot1") +
          "\n" +
          localStorage.getItem("saveSlot2") +
          "\n" +
          localStorage.getItem("saveSlot3");
        response.textContent = responseText
          ? responseText
          : "No saved progress found.";
      } else if (args[0] === "save") {
        const saveSlot = parseInt(args[1]!);
        if (!isNaN(saveSlot) && saveSlot >= 1 && saveSlot <= 3) {
          saveJSON(saveSlot);
          response.textContent = `Game progress saved to slot ${saveSlot}.`;
        } else {
          response.textContent =
            "Invalid save slot. Please specify a slot between 1 and 3.";
        }
      } else if (args[0] === "load") {
        const saveSlot = parseInt(args[1]!);
        if (!isNaN(saveSlot) && saveSlot >= 1 && saveSlot <= 3) {
          const loadResult = loadJSON(saveSlot);
          if (typeof loadResult === "boolean" && loadResult === true) {
            response.textContent = `Game progress loaded from slot ${saveSlot}.`;
          } else {
            response.textContent = loadResult as string;
          }
        } else {
          response.textContent =
            "Invalid load slot. Please specify a slot between 1 and 3.";
        }
      } else {
        response.textContent =
          "Invalid argument for progress command. Use 'save' or 'load'.";
      }
      break;
    case "exit":
      closeTerminal();
      break;
    case "":
      return;
    default:
      response.textContent = `Command not found: '${cmd}'. Type 'help' for available commands.`;
  }

  output.appendChild(response);
}

export function closeTerminal() {
  const terminal = document.getElementById(
    "economy-terminal",
  ) as HTMLDivElement;
  terminal.style.display = "none";
}

export function logToTerminal(message: string) {
  const output = document.getElementById("output") as HTMLDivElement;
  const logEntry = document.createElement("p") as HTMLParagraphElement;
  logEntry.style.color = "#a0a0a0";
  logEntry.textContent = message;
  output.appendChild(logEntry);
  output.scrollTop = output.scrollHeight;
}
