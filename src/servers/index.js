/*require('dotenv').config();
const express = require('express');
const axios = require('axios');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const MARS_PORT = process.env.MARS_PORT || 8010;
const TRANSPORT_LEVEL_HOST = process.env.TRANSPORT_HOST || '192.168.12.172';
const TRANSPORT_LEVEL_PORT = process.env.TRANSPORT_PORT || 8002;
const ENABLE_TRANSPORT = false;
const app = express();
app.use(cors({
  origin: '*', // Разрешаем доступ с любых доменов (для теста)
  methods: ['GET', 'POST', 'OPTIONS']
}));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const marsUsers = {};

// 5.1.3.2: Broadcast endpoint
app.post('/receiveMessage', (req, res) => {
  const { sender, content, messageId } = req.body;

  // 1. Validate input (as per Swagger schema)
  if (!sender || !content) {
      return res.status(400).json({
          error: "Invalid message format",
          requiredFields: ["sender", "content"]
      });
  }

  // 2. Broadcast to Mars clients
  let recipients = 0;
  const message = {
      type: "earth-message",
      sender,
      content,
      messageId,
      timestamp: new Date().toISOString()
  };

  activeConnections.forEach((sockets, username) => {
      sockets.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(message));
              recipients++;
          }
      });
  });

  // 3. Return COMPLETE DELIVERY STATUS in the HTTP response
  res.status(200).json({
      status: recipients > 0 ? "delivered" : "no_recipients",
      messageId,
      recipients,
      timestamp: new Date().toISOString(),
      // Additional transport layer metadata
      transportInfo: {
          receivedAt: new Date().toISOString(),
          marsServer: "mars-01"
      }
  });
});
  /*
  if (ENABLE_TRANSPORT === 'true') {
    try {
        await axios.post(`http://${TRANSPORT_LEVEL_HOST}:${TRANSPORT_LEVEL_PORT}/send_ack`, {
            messageId: Date.now(),
            status: 'delivered',
            username,
            timestamp: new Date().toISOString()
        });
        
        // If the POST is successful, send a 200 OK response
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error sending transport acknowledgment:', error);
        // If the POST fails, send a 500 status with an error message
        return res.status(500).json({ success: false, message: 'Failed to send acknowledgment' });
    }
} else {
    // If ENABLE_TRANSPORT is not true, still return a 200 status
    return res.status(200).json({ success: true, message: 'Transport not enabled' });
}
});

// Вебсокет соединения
wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.slice(1));
  const username = params.get('username');
  
  if (!username) {
    ws.close(4001, 'Username required');
    return;
  }

  if (!marsUsers[username]) {
    marsUsers[username] = [];
  }
  marsUsers[username].push(ws);
  console.log(`🌍 Earth user connected: ${username}`);
  console.log(
    '🌍 Active Earth Connections:',
    [...earthConnections.keys()].join(', ') || 'none'
  );

  ws.on('message', (message) => {
    // На Марсе нельзя отправлять сообщения
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Sending messages from Mars is not allowed'
    }));
  });

  

  ws.on('close', () => {
    if (marsUsers[username]) {
      marsUsers[username] = marsUsers[username].filter(socket => socket !== ws);
      if (marsUsers[username].length === 0) {
        delete marsUsers[username];
      }
    }
    console.log(`Mars: ${username} disconnected`);
  });
});

// Статика для фронтенда
app.use(express.static(path.join(__dirname, '../public')));
// 5.1.3.1: Storage for Mars usernames and connections
const marsConnections = new Map(); // username → WebSocket[]

// 5.1.3.2: Connection management
wss.on('connection', (ws, req) => {
    // Extract username from URL
    const params = new URLSearchParams(req.url.split('?')[1]);
    const username = params.get('username');

    if (!username) {
        ws.close(4001, 'Username required');
        return;
    }

    // Store connection (5.1.3.1)
    if (!marsConnections.has(username)) {
        marsConnections.set(username, []);
    }
    marsConnections.get(username).push(ws);

    console.log(`🌕 Mars User: ${username} - connected`);
    console.log(`🌕 Active Mars Connections: ${[...marsConnections.keys()].join(', ')}`);

    // 5.1.3.2: Handle disconnection
    ws.on('close', () => {
        marsConnections.set(username, 
            marsConnections.get(username).filter(socket => socket !== ws));
        
        if (marsConnections.get(username).length === 0) {
            marsConnections.delete(username);
        }
        console.log(`🌕 Mars User: ${username} - disconected`);
    });

    // Reject any messages from Mars (since it's receive-only)
    ws.on('message', () => {
        ws.send(JSON.stringify({
            error: "Message sending from Mars is disabled",
            code: "MARS_READONLY"
        }));
    });
});

server.listen(MARS_PORT, '0.0.0.0', () => {
  console.log(`Mars server running on:
  - HTTP: http://localhost:${MARS_PORT}
  - WebSocket: ws://${getLocalIpAddress()}:${MARS_PORT}
  - Access from phone: http://${getLocalIpAddress()}:${MARS_PORT}`);
});

 // Helper to get local IP
function getLocalIpAddress() {
  return Object.values(require('os').networkInterfaces())
    .flat()
    .find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';
}
*/

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
app.post('/receiveMessage', (req, res) => {
  const { sender, text, timestamp, isError } = req.body;

  // Validate against Swagger schema
  if (typeof sender !== 'string' || typeof text !== 'string') {
    return res.status(400).json({
      error: "Invalid message format",
      required: {
        sender: "string",
        text: "string",
        timestamp: "string (ISO8601)",
        isError: "boolean"
      }
    });
  }

  // Prepare message according to Swagger example
  const marsMessage = {
    sender,
    text: isError ? `[ERROR] ${text}` : text,
    timestamp: timestamp || new Date().toISOString(),
    isError: !!isError
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

  // Send connection confirmation
  ws.send(JSON.stringify({
    sender: "User1",
    text: `Привет!`,
    timestamp: new Date().toISOString(),
    isError: false
  }));
  ws.send(JSON.stringify({
    sender: "User1",
    text: `Тест 1`,
    timestamp: new Date().toISOString(),
    isError: true
  }));/*
  ws.send(JSON.stringify({
    sender: "User2",
    text: `Тест 2`,
    timestamp: new Date().toISOString(),
    isError: true
  }));
  ws.on('close', () => {
    activeConnections.get(username)?.delete(ws);
    if (activeConnections.get(username)?.size === 0) {
      activeConnections.delete(username);
    }
  });*/

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