import { buildingDefinitions } from "./buildings.js";
import { player, populationData } from "./economy.js";
import { construction } from "./game.js";

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
        response.textContent = "Please specify a building to build.";
      } else {
        const buildingType = args[0]!.toLowerCase();
        if (buildingDefinitions[buildingType]) {
          response.textContent = `Building ${buildingType} selected.`;
          construction(buildingType);
          response.textContent += ` Building ${buildingType} has been placed.`;
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
