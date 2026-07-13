import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles, Plus, Search, MessageSquare, Trash2, Settings,
  Send, Paperclip, FileText, CheckCircle2, File,
  BarChart3, Brain, FolderSearch, TrendingUp, Menu, X
} from 'lucide-react';

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
    const existingEmpty = chats.find(c => c.title === 'New Chat');
    if (existingEmpty) {
      setActiveChatId(existingEmpty.id);
      setSidebarOpen(false);
      return;
    }
    const newChat = {
      id: Date.now(),
      title: 'New Chat',
      messages: [{ id: Date.now(), role: 'ai', content: 'Hello! I am your AI assistant. Upload some documents on the right and ask me anything about them.' }]
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setSidebarOpen(false);
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  const textareaRef = useRef(null);
  const filesDropdownRef = useRef(null);

  useEffect(() => {
    if (!showIndexedFiles) return;
    const handleClickOutside = (e) => {
      if (filesDropdownRef.current && !filesDropdownRef.current.contains(e.target) && !e.target.closest('.chat-input-files-btn')) {
        setShowIndexedFiles(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showIndexedFiles]);

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
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const filteredChats = searchQuery
    ? chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  const isWelcomeState = messages.length <= 1 && messages[0]?.role === 'ai' && activeChat.title === 'New Chat';

  const suggestions = [
    { icon: FileText, text: 'Summarize this document' },
    { icon: BarChart3, text: 'Analyze uploaded report' },
    { icon: Brain, text: 'Explain key concepts' },
    { icon: FolderSearch, text: 'Search my documents' },
    { icon: TrendingUp, text: 'Generate insights' },
  ];

  const handleSuggestionClick = (text) => {
    setInput(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <Sparkles size={18} />
            </div>
            <div className="sidebar-brand-name">Nexus<span>RAG</span></div>
          </div>
          <button className="new-chat-btn" onClick={startNewChat}>
            <Plus size={16} /> New Chat
          </button>
        </div>

        <div className="sidebar-search">
          <div className="sidebar-search-wrapper">
            <Search size={14} className="sidebar-search-icon" />
            <input
              className="sidebar-search-input"
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="chat-list">
          <div className="chat-list-group-label">Recent</div>
          {filteredChats.map(chat => (
            <div
              key={chat.id}
              className={`chat-list-item ${chat.id === activeChatId ? 'active' : ''}`}
              onClick={() => { setActiveChatId(chat.id); setSidebarOpen(false); }}
            >
              <MessageSquare size={15} className="chat-list-item-icon" />
              <span className="chat-list-item-title">{chat.title}</span>
              <button
                className="chat-list-item-delete"
                onClick={(e) => deleteChat(e, chat.id)}
                title="Delete chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-admin-btn" onClick={() => navigate('/admin')}>
            <Settings size={15} /> Admin Portal
          </button>
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.username}</span>
              <span className="sidebar-user-logout" onClick={handleLogout}>Sign out</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="chat-main">
        <div className="mobile-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
        </div>

        {isWelcomeState ? (
          <div className="welcome-screen">
            <div className="welcome-icon">
              <Sparkles size={28} />
            </div>
            <h1 className="welcome-title">Your Personal AI Knowledge Assistant</h1>
            <p className="welcome-subtitle">
              Upload documents, ask questions, and instantly retrieve accurate answers from your private knowledge base.
            </p>
            <div className="welcome-suggestions">
              {suggestions.map((s, i) => (
                <div key={i} className="suggestion-card" onClick={() => handleSuggestionClick(s.text)}>
                  <div className="suggestion-card-icon">
                    <s.icon size={18} />
                  </div>
                  <span className="suggestion-card-text">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            <div className="chat-messages-inner">
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  <div className="message-avatar">
                    {msg.role === 'ai' ? <Sparkles size={15} /> : user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="message-content">
                    {msg.role === 'ai' ? (
                      <div className="message-bubble markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="message-bubble">{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message ai">
                  <div className="message-avatar">
                    <Sparkles size={15} />
                  </div>
                  <div className="message-content">
                    <div className="message-bubble typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            {/* Files Dropdown */}
            {showIndexedFiles && (
              <div className="files-dropdown" ref={filesDropdownRef}>
                <div className="files-dropdown-header">
                  <span className="files-dropdown-title">Knowledge Base</span>
                  <span className="files-dropdown-count">{indexedFiles.length} files</span>
                </div>
                <div className="files-dropdown-list">
                  {indexedFiles.length === 0 ? (
                    <div className="files-dropdown-empty">No files indexed yet.</div>
                  ) : (
                    indexedFiles.map((f, i) => {
                      const isSelected = selectedFiles.includes(f);
                      return (
                        <div
                          key={i}
                          className={`files-dropdown-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleFileSelection(f)}
                        >
                          {isSelected ? <CheckCircle2 size={15} className="files-dropdown-item-icon" /> : <File size={15} className="files-dropdown-item-icon" />}
                          <span className="files-dropdown-item-name">{f}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="chat-input-box">
              <button
                type="button"
                className={`chat-input-files-btn ${showIndexedFiles ? 'active' : ''}`}
                onClick={toggleFilesDropdown}
                title="Select documents"
              >
                <Paperclip size={18} />
                {selectedFiles.length > 0 && (
                  <span className="chat-input-files-badge">{selectedFiles.length}</span>
                )}
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Ask something about your documents..."
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />

              <button
                type="submit"
                className="chat-input-send-btn"
                disabled={!input.trim() || isTyping}
              >
                <Send size={16} />
              </button>
            </form>

            <div className="chat-input-hint">
              <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
