/*import React, { useState, useEffect } from 'react';
import Login from './components/Login/Login';
import Chat from './components/Chat/Chat';
import "./App.css";

function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const isEarth = false;
  

  useEffect(() => {
    const savedUsername = localStorage.getItem('chat_username');
    if (savedUsername) {
      setUsername(savedUsername);
      connectWebSocket(savedUsername);
    }

    return () => {
      // Закрываем соединение при размонтировании компонента
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const connectWebSocket = (username: string) => {
    const wsUrl = `ws://${window.location.hostname}:8010?username=${encodeURIComponent(username)}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
      setWs(socket);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setWs(null);
    };

    return socket;
  };

  const handleLogin = (username: string) => {
    const socket = connectWebSocket(username);
    setUsername(username);
    setWs(socket);
    localStorage.setItem('chat_username', username);
  };

  const handleLogout = () => {
    if (ws) {
      ws.close(); // Явное закрытие соединения
    }
    localStorage.removeItem('chat_username');
    setUsername(null);
    setWs(null);
  };

  return (
    <>
      {!username ? (
        <Login onLogin={handleLogin} isEarth={isEarth} />
      ) : (
        <Chat 
          username={username} 
          isEarth={isEarth}
          onLogout={handleLogout}
          ws={ws}
        />
      )}
    </>
  );
}

export default App;*/

import React, { useState, useEffect } from 'react';
import Login from './components/Login/Login';
import Chat from './components/Chat/Chat';
import './App.css';

const App: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
 

  useEffect(() => {
    const savedUsername = localStorage.getItem('chat_username');
    if (savedUsername) {
      setUsername(savedUsername);
      connectWebSocket(savedUsername);
    }
  }, []);

  const connectWebSocket = (username: string): WebSocket => {
    const wsUrl = `ws://${window.location.hostname}:8010?username=${encodeURIComponent(username)}`;
    const socket = new WebSocket(wsUrl);
    // ✅ Set WebSocket immediately
    setWs(socket);
    socket.onopen = () => {
      console.log('WebSocket connected');
      //setWs(socket);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setWs(null);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return socket;
  };

  const handleLogin = (username: string) => {
    // Close existing WebSocket connection if any
    if (ws) {
      ws.close();
    }

    // Create a new WebSocket connection
    const socket = connectWebSocket(username);
    setUsername(username);
    setWs(socket);
    localStorage.setItem('chat_username', username);
  };

  const handleLogout = () => {
    if (ws) {
      ws.close(); // Ensure WebSocket is closed on logout
    }
    localStorage.removeItem('chat_username');
    setUsername(null);
    setWs(null);
  };

  return (
    <>
      {!username ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Chat username={username} onLogout={handleLogout} ws={ws} />
      )}
    </>
  );
};

export default App;