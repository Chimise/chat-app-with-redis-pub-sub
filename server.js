import { createServer } from "node:http";
import staticHandler from "serve-handler";
import ws, { WebSocketServer } from "ws";
import { Redis } from "ioredis";
import { ulid } from "ulid";

const pub = new Redis();
const sub = new Redis();

const clients = new Map();

const CHANNEL = "chat_messages";

const server = createServer((req, res) => {
  return staticHandler(req, res, { public: "www" });
});

const wss = new WebSocketServer({ server });

function broadcast(message) {
  for (const [client, id] of clients.entries()) {
    if (id !== message.id) {
      client.send(message.message);
    }
  }
}

wss.on("connection", (client) => {
  console.log("Client connected");
  if (!clients.has(client)) {
    clients.set(client, ulid());
  }

  client.on("message", (message) => {
    message = message.toString();
    console.log("Message: ", message);
    pub.publish(CHANNEL, JSON.stringify({ message, id: clients.get(client) }));
    client.send(message);
  });
});

sub.subscribe(CHANNEL);

sub.on("message", (channel, message) => {
  if (channel === CHANNEL) {
    console.log(channel, message);
    message = JSON.parse(message);
    return broadcast(message);
  }
});

server.listen(process.argv[2] ?? 8000);
