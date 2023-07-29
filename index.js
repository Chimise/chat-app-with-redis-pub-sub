import { createServer } from "node:http";
import staticHandler from "serve-handler";
import ws, { WebSocketServer } from "ws";
import { Redis } from "ioredis";

const pub = new Redis();
const sub = new Redis();

const CHANNEL = "chat_messages";

const server = createServer((req, res) => {
  return staticHandler(req, res, { public: "www" });
});

const wss = new WebSocketServer({ server });

function broadcast(message) {
  for (const wsClient of wss.clients) {
    if (wsClient.readyState === ws.OPEN) {
      wsClient.send(message);
    }
  }
}


wss.on("connection", (client) => {
  console.log("Client connected");
  client.on("message", (message) => {
    console.log("Message: ", message);
    pub.publish(CHANNEL, message);
  });
});

sub.subscribe(CHANNEL);

sub.on('message', (channel, message) => {
    if(channel === CHANNEL) {
        console.log(channel, message);
        return broadcast(message);
    }
})

server.listen(process.argv[2] ?? 8000);
