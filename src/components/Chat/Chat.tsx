import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
  isError?: boolean;
}

interface ChatProps {
  username: string;
  onLogout: () => void;
  ws: WebSocket | null;
}

const Chat: React.FC<ChatProps> = ({ username, onLogout, ws }) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Show error message for a few seconds
  const showErrorMessage = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => {
      setErrorMessage(null);
    }, 1500);
  };

  // Handle WebSocket messages
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const newMessage: Message = {
          id: data.id || Date.now(),
          text: data.text,
          sender: data.sender || 'Неизвестный',
          timestamp: data.timestamp || new Date().toISOString(),
          isError: !!data.isError,
        };
        setMessages((prev) => [...prev, newMessage]);
      } catch (err) {
        console.error('Ошибка парсинга сообщения:', err);
      }
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send button click
  const handleSend = () => {
    showErrorMessage('Отправка сообщений с Марса запрещена');
  };

  // Format time
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="chat-page">
      <div className="chat-content">
        <div className="chat-header">
          <h1 className="chat-title">Марс-Земля Чат</h1>
          <div className="header-controls">
            <div className="connection-status">
              <span className="status-indicator connected" />
              <span>Подключен как {username}</span>
            </div>
            <button className="logout-btn" onClick={onLogout}>
              Выйти
            </button>
          </div>
        </div>

        <div className="chat-container">
          {messages.map((msg) => (
            <div key={msg.id} className="message received">
              <div className="message-header">
                <span className="message-sender">{msg.sender}</span>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="message-content">
                {msg.isError ? 'Ошибка доставки :(' : msg.text}
              </div>
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
            placeholder="Только чтение"
            disabled
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="send-btn" onClick={handleSend} >
            <span>Отправить</span>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>

        {/* Temporary error message */}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </div>
    </div>
  );
};

export default Chat;