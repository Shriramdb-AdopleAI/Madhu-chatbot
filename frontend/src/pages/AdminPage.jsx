import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowLeft, BarChart3, Link2, Upload, ChevronLeft,
  Settings, CheckCircle2, Menu
} from 'lucide-react';

export default function AdminPage({ user }) {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [file, setFile] = useState(null);
  const [docName, setDocName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isNotionConnected, setIsNotionConnected] = useState(false);
  const [notionPages, setNotionPages] = useState([]);
  const [notionToken, setNotionToken] = useState('');
  const [syncedFiles, setSyncedFiles] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);


  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Uploading...');

    const formData = new FormData();
    formData.append('file', file);
    if (docName.trim()) {
      formData.append('docName', docName.trim());
    }

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Upload failed');
      }

      setUploadStatus(`Success: ${data.message}`);
      setFile(null);
      setDocName('');
      setTimeout(() => setUploadStatus(''), 3500);
    } catch (err) {
      setUploadStatus(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="admin-layout">
      {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <Sparkles size={18} />
            </div>
            <div className="sidebar-brand-name">Nexus<span>RAG</span></div>
          </div>
          <button className="new-chat-btn" onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', boxShadow: 'none' }}>
            <ArrowLeft size={15} /> Back to Chat
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <div
            className={`admin-nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveView('dashboard'); setSidebarOpen(false); }}
          >
            <BarChart3 size={17} />
            <span>Dashboard</span>
          </div>
          <div
            className={`admin-nav-item ${activeView === 'connectors' ? 'active' : ''}`}
            onClick={() => { setActiveView('connectors'); setSidebarOpen(false); }}
          >
            <Link2 size={17} />
            <span>Add Connector</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.username}</span>
              <span className="sidebar-user-logout" style={{ color: 'var(--text-tertiary)', cursor: 'default' }}>Administrator</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="admin-content">
        {/* Mobile Header */}
        <div className="mobile-header" style={{ margin: '-40px -48px 24px', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
        </div>

        {activeView === 'dashboard' && (
          <div className="animate-fade-in">
            <div className="admin-content-header">
              <h1 className="admin-content-title">Dashboard</h1>
              <p className="admin-content-desc">Manage system configuration and view activity.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="admin-card">
                <div className="admin-card-title" style={{ color: 'var(--success)' }}>System Status</div>
                <p className="admin-card-desc">
                  All systems operational. The RAG pipeline is connected to OpenRouter and FAISS stores are actively indexing updates.
                </p>
              </div>

              <div className="admin-card">
                <div className="admin-card-title">System Info</div>
                <div style={{ marginTop: '12px' }}>
                  <div className="admin-stat-item">
                    <span className="admin-stat-label">Embedding Model</span>
                    <span className="admin-stat-value">BGE-Base-En-v1.5</span>
                  </div>
                  <div className="admin-stat-item">
                    <span className="admin-stat-label">LLM Provider</span>
                    <span className="admin-stat-value">OpenRouter</span>
                  </div>
                  <div className="admin-stat-item">
                    <span className="admin-stat-label">Vector Store</span>
                    <span className="admin-stat-value">FAISS</span>
                  </div>
                </div>
              </div>

              <div className="danger-zone">
                <div className="danger-zone-title">Danger Zone</div>
                <p className="danger-zone-desc">Core system parameters. Use extreme caution when modifying the knowledge core.</p>
                <button className="danger-btn">Purge Vector Database</button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'connectors' && (
          <div className="animate-fade-in">
            <div className="admin-content-header">
              <h1 className="admin-content-title">Add Connector</h1>
              <p className="admin-content-desc">Connect new data sources to your knowledge base.</p>
            </div>

            <div className="admin-grid">
              <div className="connector-card" onClick={() => setActiveView('file-upload')}>
                <div className="connector-card-icon" style={{ background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)' }}>
                  <Upload size={24} />
                </div>
                <div className="connector-card-title">File Upload</div>
                <div className="connector-card-desc">Import local PDF, TXT or Markdown files.</div>
              </div>

              <div className="connector-card" onClick={() => setActiveView('notion-config')}>
                <div className="connector-card-icon" style={{ background: '#000', color: '#fff', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.3rem' }}>N</span>
                </div>
                <div className="connector-card-title">Notion</div>
                <div className="connector-card-desc">Sync pages and databases from your Notion workspace.</div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'file-upload' && (
          <div className="animate-fade-in">
            <button className="back-btn" onClick={() => setActiveView('connectors')}>
              <ChevronLeft size={16} /> Back to Connectors
            </button>

            <div className="admin-content-header">
              <h1 className="admin-content-title">Upload Document</h1>
              <p className="admin-content-desc">Add a new local file to the system index.</p>
            </div>

            <form className="upload-form" onSubmit={handleFileUpload}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Document Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Q3 Financial Report"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Upload File</label>
                <div
                  className={`upload-dropzone ${file ? 'has-file' : ''}`}
                  onClick={() => document.getElementById('admin-file-upload').click()}
                >
                  <input
                    type="file"
                    id="admin-file-upload"
                    accept="*/*"
                    onChange={(e) => setFile(e.target.files[0])}
                    disabled={isUploading}
                    style={{ display: 'none' }}
                  />
                  <Upload size={36} className="upload-dropzone-icon" />
                  <span className="upload-dropzone-text">
                    {file ? file.name : 'Click to browse or drag and drop'}
                  </span>
                  <span className="upload-dropzone-hint">Accepts PDF, DOCX, TXT, Images, etc.</span>
                </div>
              </div>

              {uploadStatus && (
                <div className={`upload-status ${uploadStatus.startsWith('Error') ? 'error' : 'success'}`}>
                  {uploadStatus}
                </div>
              )}

              <button type="submit" className="upload-submit-btn" disabled={!file || isUploading}>
                {isUploading ? 'Uploading and Indexing...' : 'Upload and Index Document'}
              </button>
            </form>
          </div>
        )}

        {activeView === 'notion-config' && (
          <div className="animate-fade-in">
            <button className="back-btn" onClick={() => setActiveView('connectors')}>
              <ChevronLeft size={16} /> Back to Connectors
            </button>

            <div className="admin-content-header">
              <h1 className="admin-content-title">Notion Knowledge Base</h1>
              <p className="admin-content-desc">Import pages directly from your connected Notion workspace.</p>
            </div>

            {!isNotionConnected ? (
              <div className="notion-connect-box">
                <div className="notion-icon">N</div>
                <h3 className="notion-connect-title">Connect Notion Workspace</h3>
                <p className="notion-connect-desc">
                  Enter your Notion <strong>Internal Integration Token</strong> below to verify the connection.
                </p>

                <div style={{ maxWidth: '380px', margin: '0 auto 24px', textAlign: 'left' }}>
                  <label className="form-label">Integration Token</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="secret_..."
                    value={notionToken}
                    onChange={(e) => setNotionToken(e.target.value)}
                    style={{ width: '100%', marginTop: '6px' }}
                  />
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)', marginTop: '6px', display: 'block' }}>
                    Get yours at developers.notion.com
                  </span>
                </div>

                <button
                  onClick={async () => {
                    setIsUploading(true);
                    setUploadStatus('Connecting to Notion...');
                    try {
                      const url = notionToken ? `http://localhost:8000/notion/pages?token=${notionToken}` : 'http://localhost:8000/notion/pages';
                      const res = await fetch(url);
                      const data = await res.json();
                      if (res.ok) {
                        setNotionPages(data.pages);
                        setIsNotionConnected(true);
                        setUploadStatus('Connected successfully!');
                        setTimeout(() => setUploadStatus(''), 2000);
                      } else {
                        setUploadStatus(`Error: ${data.detail || 'Could not connect'}`);
                      }
                    } catch (e) {
                      setUploadStatus('Failed to connect to backend.');
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                  className="notion-connect-btn"
                >
                  {isUploading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            ) : (
              <div className="notion-pages-list">
                <div className="notion-pages-header">
                  <span className="notion-pages-header-title">Available Pages ({notionPages.length})</span>
                  <button className="notion-reset-btn" onClick={() => setIsNotionConnected(false)}>Reset Connection</button>
                </div>
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {notionPages.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.87rem' }}>
                      No pages found. Make sure you shared them with your Notion Integration.
                    </div>
                  ) : (
                    notionPages.map(page => (
                      <div key={page.id} className="notion-page-item">
                        <span className="notion-page-icon">{page.type === 'database' ? '🗄️' : '📄'}</span>
                        <div className="notion-page-info">
                          <div className="notion-page-name">{page.name}</div>
                          <div className="notion-page-meta">Type: {page.type} • ID: {page.id.substring(0, 8)}...</div>
                        </div>
                        <button
                          className={`notion-index-btn ${syncedFiles.has(page.id) ? 'indexed' : ''}`}
                          onClick={async () => {
                            if (syncedFiles.has(page.id)) return;
                            setUploadStatus(`Indexing Notion page: ${page.name}...`);
                            try {
                              const res = await fetch('http://localhost:8000/sync/notion-page', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  pageId: page.id,
                                  filename: page.name,
                                  notionToken: notionToken || undefined
                                })
                              });

                              if (res.ok) {
                                setSyncedFiles(prev => new Set([...prev, page.id]));
                                setUploadStatus(`Success: ${page.name} indexed and stored in FAISS.`);
                                setTimeout(() => setUploadStatus(''), 3000);
                              } else {
                                const errData = await res.json();
                                setUploadStatus(`Error: ${errData.detail || 'Sync failed'}`);
                              }
                            } catch (e) {
                              setUploadStatus('Indexing failed.');
                            }
                          }}
                        >
                          {syncedFiles.has(page.id) ? (
                            <><CheckCircle2 size={13} /> Indexed</>
                          ) : 'Index Page'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {uploadStatus && (
              <div className={`upload-status ${uploadStatus.includes('Success') || uploadStatus.includes('Connected') ? 'success' : uploadStatus.includes('Error') || uploadStatus.includes('Failed') ? 'error' : ''}`} style={{ marginTop: '20px' }}>
                {uploadStatus}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
