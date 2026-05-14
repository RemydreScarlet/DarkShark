import { WebSocketServer } from 'ws';

const port = Number(process.env.PORT) || 8080;
const wss = new WebSocketServer({ port });

console.log(`Signaling server started on ws://localhost:${port}`);

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (data) => {
    // Broadcast message to all other clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(data);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
