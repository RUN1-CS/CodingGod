const WebSocket = require("ws");
const http = require("http");

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const PORT = 3000;

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("Client connected");

  // Handle incoming messages
  ws.on("message", (message) => {
    console.log("Received:", message);

    // Broadcast message to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Handle client disconnect
  ws.on("close", () => {
    console.log("Client disconnected");
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
