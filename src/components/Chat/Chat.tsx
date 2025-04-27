import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';

type MessageStatus = 'sent' | 'delivered' | 'error';

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
  status: MessageStatus;
  isError?: boolean;
}

interface ChatProps {
  username: string;
  isEarth: boolean;
  onLogout: () => void;
  ws: WebSocket | null;
}

const Chat: React.FC<ChatProps> = ({ username, isEarth, onLogout, ws }) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [errorMessage, setErrorMessage] = useState(''); // New state for error message
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wsHost = window.location.hostname;
    const wsUrl = isEarth
      ? `ws://${wsHost}:8005?username=${encodeURIComponent(username)}`
      : `ws://${wsHost}:8010?username=${encodeURIComponent(username)}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'status-update') {
        setMessages(prev => prev.map(msg =>
          msg.id === data.messageId ? { ...msg, status: data.status } : msg
        ));
        return;
      }

      const newMessage: Message = {
        id: data.id || Date.now(),
        text: data.isError ? `Ошибка доставки :(` : data.text,
        sender: data.sender || 'Unknown',
        timestamp: data.timestamp || new Date().toISOString(),
        status: data.status || 'delivered',
        isError: data.isError
      };

      setMessages(prev => [...prev, newMessage]);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };


    return () => socket.close();
  }, [isEarth, username]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!isEarth) {
      setErrorMessage('Ошибка: отправка сообщений с Марса запрещена');
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: "При пересылке сообщения произошла ошибка :(",
        sender: "Система",
        timestamp: new Date().toISOString(),
        status: 'error',
        isError: true
      }]);
      return;
    }

    if (!inputText.trim()) return;

    // Generate unique ID if not exists
    const messageId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    const newMessage = {
      id: messageId, // Ensure unique ID
      text: inputText,
      sender: username,
      timestamp: new Date().toISOString()
    };

    // Only send once through WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(newMessage));
    }

    setInputText('');
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_username');
    localStorage.removeItem('chat_isEarth');
    ws?.close();
    window.location.href = '/';
  };
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  return (
    <div className="chat-page">
      <div className="chat-content">
        <div className="chat-header">
          <h1 className="chat-title">{isEarth ? 'Земля' : 'Марс-Земля'} Чат</h1>
          <div className="header-controls">
            <div className="connection-status">
              <span className="status-indicator connected" />
              <span>Подключен как {username}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </div>

        <div className="chat-container">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="message received"
              
            >
              <div className="message-header">
                <span className="message-sender">{msg.sender}</span>
                <span className="message-time">
                  {formatTime(new Date(msg.timestamp))}
                </span>
              </div>
              <div className="message-content">
                {msg.text}
              </div>
              {msg.sender === username && (
                <div className={`message-status ${msg.status}`}>
                  {msg.status === 'sent' && '✓'}
                  {msg.status === 'delivered' && '✓✓'}
                  {msg.status === 'error' && '✗'}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="message-input-container">
          <input
            type="text"
            className="message-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isEarth ? "Введите сообщение..." : "Только чтение"}
            disabled={!isEarth}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            className="send-btn"
            onClick={handleSend}

          >
            Отправить
          </button>
        </div>
        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>)}
      </div>
    </div>
  );
};

export default Chat;
