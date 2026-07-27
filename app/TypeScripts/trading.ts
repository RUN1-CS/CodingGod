import { networth, player, populationData } from "./economy.js";

let ws: WebSocket | null = null;

ws = new WebSocket("ws://localhost:3000");

ws.onopen = () => {
  console.log("WebSocket connected");
};

ws.onmessage = (event: MessageEvent) => {
  switch (event.data.type) {
    case "traders":
      console.log("Received traders:", event.data.traders);
      break;
  }
};

ws.onerror = (error: Event) => {
  console.error("WebSocket error:", error);
};

ws.onclose = () => {
  console.log("WebSocket disconnected");
};

export function closeWebSocket(): void {
  if (ws) {
    ws.close();
  }
}

export function getTraders(): void {
  if (!ws) ws = new WebSocket("ws://localhost:3000");
  ws.send(JSON.stringify({ type: "getTraders" }));
}

export function buyItem(
  traderId: string,
  itemId: string,
  quantity: number,
): void {
  if (!ws) ws = new WebSocket("ws://localhost:3000");
  ws.send(JSON.stringify({ type: "buyItem", traderId, itemId, quantity }));
}
