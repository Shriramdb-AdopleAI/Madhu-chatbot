import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function ChatPage({ user, setUser }) {
  const navigate = useNavigate();
  
  const [chats, setChats] = useState(() => {
    const savedChats = localStorage.getItem('rag_chats');
    return savedChats ? JSON.parse(savedChats) : [{
      id: Date.now(),
      title: 'New Chat',
      messages: [{ id: Date.now(), role: 'ai', content: 'Hello! I am your AI assistant. Upload some documents on the right and ask me anything about them.' }]
    }];
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    const savedId = localStorage.getItem('rag_active_id');
    return savedId ? JSON.parse(savedId) : (chats[0]?.id || Date.now());
  });

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0] || { messages: [] };
  const messages = activeChat?.messages || [];

  const updateMessages = (newMessages) => {
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === activeChatId) {
        let newTitle = chat.title;
        if (chat.title === 'New Chat' && newMessages.length > 1) {
          const firstUserMsg = newMessages.find(m => m.role === 'user');
          if (firstUserMsg) {
            newTitle = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
          }
        }
        return { ...chat, title: newTitle, messages: newMessages };
      }
      return chat;
    }));
  };

  const deleteMessage = (messageId) => {
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === activeChatId) {
        const newMessages = chat.messages.filter(msg => msg.id !== messageId);
        // If all messages deleted, keep at least one welcome message
        if (newMessages.length === 0) {
          newMessages.push({ id: Date.now(), role: 'ai', content: 'Hello! I am your AI assistant. Upload some documents on the right and ask me anything about them.' });
        }
        return { ...chat, messages: newMessages };
      }
      return chat;
    }));
  };

  const deleteChat = (e, chatId) => {
    e.stopPropagation();
    const newChats = chats.filter(c => c.id !== chatId);
    if (newChats.length === 0) {
      const newChat = {
        id: Date.now(),
        title: 'New Chat',
        messages: [{ id: Date.now(), role: 'ai', content: 'Hello! I am your AI assistant. Upload some documents on the right and ask me anything about them.' }]
      };
      setChats([newChat]);
      setActiveChatId(newChat.id);
    } else {
      setChats(newChats);
      if (chatId === activeChatId) {
        setActiveChatId(newChats[0].id);
      }
    }
  };

  const startNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: 'New Chat',
      messages: [{ id: Date.now(), role: 'ai', content: 'Hello! I am your AI assistant. Upload some documents on the right and ask me anything about them.' }]
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  useEffect(() => {
    localStorage.setItem('rag_chats', JSON.stringify(chats));
    localStorage.setItem('rag_active_id', JSON.stringify(activeChatId));
  }, [chats, activeChatId]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showIndexedFiles, setShowIndexedFiles] = useState(false);
  const [indexedFiles, setIndexedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const fetchIndexedFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/files');
      if (response.ok) {
        const data = await response.json();
        setIndexedFiles(data.files || []);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const toggleFilesDropdown = () => {
    if (!showIndexedFiles) {
      fetchIndexedFiles();
    }
    setShowIndexedFiles(!showIndexedFiles);
  };

  const toggleFileSelection = (filename) => {
    setSelectedFiles(prev => 
      prev.includes(filename) 
        ? prev.filter(f => f !== filename) 
        : [...prev, filename]
    );
  };

  const messagesEndRef = useRef(null);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('rag_user');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    const newMessages = [...messages, { id: Date.now(), role: 'user', content: userMsg }];
    updateMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: userMsg,
          selectedFiles: selectedFiles.length > 0 ? selectedFiles : []
        })

      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong');
      }

      updateMessages([...newMessages, { id: Date.now() + 1, role: 'ai', content: data.answer }]);
    } catch (err) {
      updateMessages([...newMessages, { id: Date.now() + 1, role: 'ai', content: `Error: ${err.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="app-container">
      <div className="glass-background"></div>
      
      <main className="main-content dashboard-layout">
        <div className="content-grid full-height">
          {/* Left Sidebar - Chat History */}
          <aside className="left-sidebar glass-panel">
            <div className="sidebar-brand">
              <div className="logo-container">
                <div className="logo-icon">✨</div>
                <h1>Nexus<span className="gradient-text">RAG</span></h1>
              </div>
            </div>

            <div className="left-sidebar-header">
              <button className="new-chat-btn" onClick={startNewChat}>
                <span className="icon">＋</span> New Chat
              </button>
            </div>
            
            <div className="chat-history-list">
              {chats.map(chat => (
                <div 
                  key={chat.id} 
                  className={`chat-history-item ${chat.id === activeChatId ? 'active' : ''}`}
                  onClick={() => setActiveChatId(chat.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}
                >
                  <span className="chat-title" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '1rem' }}>{chat.title}</span>
                  <button 
                    className="delete-chat-btn"
                    onClick={(e) => deleteChat(e, chat.id)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--text-secondary)', 
                      cursor: 'pointer', 
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: chat.id === activeChatId ? 1 : 0,
                    }}
                    title="Delete chat session"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button 
              className="new-chat-btn" 
              style={{background: 'var(--accent-gradient)', color: 'white', border: 'none', marginTop: 'auto'}} 
              onClick={() => navigate('/admin')}
            >
              <span className="icon">⚙️</span> Admin Portal
            </button>

            <div className="user-profile" style={{marginTop: '0'}}>
              <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <span className="user-name">{user.username}</span>
                <span className="user-role logout-btn" onClick={handleLogout}>Log Out</span>
              </div>
            </div>
          </aside>

          {/* Chat Interface */}
          <section className="chat-section glass-panel">
            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-wrapper ${msg.role}`}>
                  <div className={`message-avatar ${msg.role}`}>
                    {msg.role === 'ai' ? '🤖' : '👤'}
                  </div>
                  <div className="message-bubble">
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <button
                      className="delete-message-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMessage(msg.id);
                      }}
                      title="Delete message"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="message-wrapper ai">
                  <div className="message-avatar ai">🤖</div>
                  <div className="message-bubble typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage} style={{ position: 'relative', display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '1rem 1.5rem', background: 'transparent', borderTop: '1px solid var(--glass-border-dark)' }}>
              
              <button 
                type="button"
                onClick={toggleFilesDropdown}
                className="docs-button"
                style={{ 
                  background: showIndexedFiles ? '#f1f5f9' : 'white', 
                  color: selectedFiles.length > 0 ? 'var(--accent-1)' : '#475569', 
                  border: selectedFiles.length > 0 ? '1.5px solid var(--accent-1)' : '1.5px solid #e2e8f0', 
                  borderRadius: '50px', 
                  width: '64px', 
                  height: '44px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  position: 'relative',
                  padding: '0', 
                  flexShrink: 0, 
                  cursor: 'pointer', 
                  transition: 'all 0.2s', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)' 
                }}
                title="View Indexed Files"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                  <line x1="9" y1="11" x2="12" y2="11"></line>
                </svg>
                {selectedFiles.length > 0 && (
                  <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--accent-1)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {selectedFiles.length}
                  </span>
                )}
              </button>

              <input
                type="text"
                placeholder="Ask something about your documents..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
                style={{ flex: 1, background: 'white', border: '1.5px solid #e2e8f0', height: '44px', borderRadius: '50px', padding: '0 1.25rem', fontSize: '0.95rem', outline: 'none', margin: '0', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
              />

              <button 
                type="submit" 
                className="send-button-pill"
                disabled={!input.trim() || isTyping}
                style={{ background: (!input.trim() || isTyping) ? '#b0b5c1' : 'var(--accent-1)', color: 'white', border: 'none', borderRadius: '50px', width: '64px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0', flexShrink: 0, cursor: (!input.trim() || isTyping) ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: (!input.trim() || isTyping) ? 'none' : '0 2px 6px rgba(59,130,246,0.3)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>

              {/* Indexed Files Dropdown */}
              {showIndexedFiles && (
                <div style={{ position: 'absolute', bottom: 'calc(100% + 0.5rem)', left: '1.5rem', width: '300px', maxHeight: '350px', overflowY: 'auto', zIndex: 50, padding: '1.25rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                    <h4 style={{ margin: '0', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Indexed Knowledge Base</h4>
                    <span style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '10px', color: 'var(--text-secondary)' }}>{indexedFiles.length} files</span>
                  </div>
                  {indexedFiles.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>No files currently indexed.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {indexedFiles.map((f, i) => {
                        const isSelected = selectedFiles.includes(f);
                        return (
                          <li 
                            key={i} 
                            onClick={() => toggleFileSelection(f)}
                            style={{ 
                              fontSize: '0.85rem', 
                              color: isSelected ? 'var(--accent-1)' : 'var(--text-secondary)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.75rem', 
                              background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.02)', 
                              border: isSelected ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                              padding: '0.6rem 0.8rem', 
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            <span style={{ color: isSelected ? 'var(--accent-1)' : '#cbd5e1' }}>{isSelected ? '✅' : '📄'}</span> 
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isSelected ? '600' : '500' }}>{f}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
