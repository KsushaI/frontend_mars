const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');

const MARS_PORT = 8010;
const app = express();


// Load Swagger spec
const swaggerDocument = YAML.load(path.join(__dirname, '../../public/swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Enable CORS for Swagger UI
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS']
}));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Connection storage
const activeConnections = new Map(); // username → Set<WebSocket>

// Strictly follows Swagger schema
app.post('/ReceiveMessage', (req, res) => {
  const { Username, Text, SendTime, Error } = req.body;

  // Validate against Swagger schema
  if (typeof Username !== 'string' || typeof Text !== 'string') {
    return res.status(400).json({
      error: "Invalid message format",
      required: {
        Username: "string",
        Text: "string",
        SendTime: "string (ISO8601)",
        Error: "boolean"
      }
    });
  }

  // Prepare message according to Swagger example
  const marsMessage = {
    Username,
    Text: Error ? `[ERROR] ${text}` : Text,
    SendTime: SendTime || new Date().toISOString(),
    Error: !!Error
  };

  // Broadcast to all connected clients
  let recipients = 0;
  activeConnections.forEach((sockets, username) => {
    sockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(marsMessage));
        recipients++;
      }
    });
  });

  // Return exact Swagger-defined success response
  res.status(200).json({
    status: "Сообщение успешно разослано",
    recipients,
    timestamp: new Date().toISOString()
  });
});

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const username = new URLSearchParams(req.url.split('?')[1]).get('username');
  
  if (!username) {
    ws.close(4001, 'Username required');
    return;
  }

  // Store connection
  if (!activeConnections.has(username)) {
    activeConnections.set(username, new Set());
  }
  activeConnections.get(username).add(ws);

/*
  ws.send(JSON.stringify({
    sender: "User2",
    text: `Тест 2`,
    timestamp: new Date().toISOString(),
    isError: true
  }));*/
  ws.on('close', () => {
    activeConnections.get(username)?.delete(ws);
    if (activeConnections.get(username)?.size === 0) {
      activeConnections.delete(username);
    }
  });

  ws.on('message', () => {
    ws.send(JSON.stringify({
      sender: "Mars Server",
      text: "Error: Sending messages from Mars is disabled",
      timestamp: new Date().toISOString(),
      isError: true
    }));
  });
});

// Serve Swagger UI
app.use('/docs', express.static(path.join(__dirname, 'public')));

server.listen(MARS_PORT, '0.0.0.0', () => {
  console.log(`
  ♂️ Mars WebSocket Server Operational
  ==================================
  WebSocket: ws://localhost:${MARS_PORT}?username=YOUR_NAME
  API Docs: http://localhost:${MARS_PORT}/docs/swagger.yaml
  Test Endpoint: POST http://localhost:${MARS_PORT}/receiveMessage
  
  Example CURL Test:
  curl -X POST http://localhost:8010/receiveMessage \\
  -H "Content-Type: application/json" \\
  -d '{
    "sender": "earth-ctrl",
    "text": "Test message",
    "isError": false,
    "timestamp": "$(new Date().toISOString())"
  }'
  `);
});