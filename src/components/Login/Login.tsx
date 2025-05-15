/*import React, { useState, useEffect } from 'react';
import './Login.css';

interface LoginProps {
  onLogin: (username: string, isEarth: boolean) => void;
  isEarth: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, isEarth }) => {
  const [username, setUsername] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Проверка соединения при изменении isEarth
  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
        setConnectionStatus('disconnected');
      }
    };
  }, [isEarth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      alert('Введите имя пользователя');
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      // Тестовая проверка соединения перед логином
      const wsUrl = isEarth 
        ? `ws://${window.location.hostname}:8005/check-connection`
        : `ws://${window.location.hostname}:8010/check-connection`;
      
      const testSocket = new WebSocket(wsUrl);
      
      testSocket.onopen = () => {
        testSocket.close();
        setConnectionStatus('connected');
        onLogin(username.trim(), isEarth);
      };
      
      testSocket.onerror = () => {
        setConnectionStatus('disconnected');
        alert(`Не удалось подключиться к ${isEarth ? 'Земле' : 'Марсу'}`);
      };
      
      setWs(testSocket);
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('disconnected');
    }
  };

  return (
    <div className="container">
      

      <div className="column left-col">
        <div className="half first-half">
          <img 
            src="/earth.svg" 
            alt="Earth" 
            className={`column-img ${isEarth ? 'active' : ''}`}
          />
        </div>
        <div className="half second-half">
          <img src="/satelite_b.svg" alt="Satellite B" className="column-img" />
        </div>
      </div>

      <div className="column center-col">
        <div className="half first-half">
          <div className="form-wrapper">
            <h1 className="title">Вход в систему</h1>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите имя пользователя"
              className="input-field"
              disabled={connectionStatus === 'connecting'}
            />
          </div>
        </div>
        <div className="half second-half" onClick={handleSubmit}>
        <button className="login-btn"><span>Войти</span></button>
        </div>
      </div>

      <div className="column right-col">
        <div className="half first-half">
          <img src="/satelite_w.svg" alt="Satellite W" className="column-img" />
        </div>
        <div className="half second-half">
          <img 
            src="/mars.svg" 
            alt="Mars" 
            className={`column-img ${!isEarth ? 'active' : ''}`}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;*/

import React, { useState } from 'react';
import './Login.css';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState(
    localStorage.getItem('chat_username') || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      alert('Введите имя пользователя');
      return;
    }

    // Save to localStorage and proceed
    localStorage.setItem('chat_username', trimmedUsername);
    onLogin(trimmedUsername);
  };

  return (
    <div className="container">
      {/* Left Column - Earth */}
      <div className="column left-col">
        <div className="half first-half">
          <img src="/earth.svg" alt="Earth" className="column-img" />
        </div>
        <div className="half second-half">
          <img src="/satelite_b.svg" alt="Satellite B" className="column-img" />
        </div>
      </div>

      {/* Center Column - Login Form */}
      <div className="column center-col">
        <div className="half first-half">
          <div className="form-wrapper">
            <h1 className="title">Вход в систему</h1>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите имя пользователя"
              className="input-field"
            />
          </div>
        </div>
        <div className="half second-half" onClick={handleSubmit}>
          <button className="login-btn">
            <span>Войти</span>
          </button>
        </div>
      </div>

      {/* Right Column - Placeholder */}
      <div className="column right-col">
        <div className="half first-half">
          <img src="/satelite_w.svg" alt="Satellite W" className="column-img" />
        </div>
        <div className="half second-half">
          <img src="/mars.svg" alt="Mars" className="column-img" />
        </div>
      </div>
    </div>
  );
};

export default Login;