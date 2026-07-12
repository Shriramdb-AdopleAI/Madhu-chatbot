import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

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
    <div className="app-container">
      <div className="glass-background"></div>

      <main className="main-content dashboard-layout" style={{ maxWidth: '100%', margin: '0', padding: '0', height: '100%' }}>
        <div className="content-grid full-height" style={{ gridTemplateColumns: '280px 1fr', gap: '0', height: '100%' }}>

          <aside className="left-sidebar glass-panel">
            <div className="sidebar-brand">
              <div className="logo-container">
                <div className="logo-icon">✨</div>
                <h1>Nexus<span className="gradient-text">RAG</span></h1>
              </div>
            </div>

            <div className="left-sidebar-header">
              <button className="new-chat-btn" onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Back to Chat
              </button>
            </div>

            <div className="admin-menu" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem', flex: 1 }}>
              <div
                className={`connector-item ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveView('dashboard')}
                style={activeView === 'dashboard' ? { background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' } : {}}
              >
                <span className="icon" style={{ display: 'flex', alignItems: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                </span>
                <span style={{ fontWeight: '600', fontSize: '0.95rem', color: activeView === 'dashboard' ? 'var(--accent-1)' : 'var(--text-primary)' }}>Dashboard</span>
              </div>

              <div
                className={`connector-item ${activeView === 'connectors' ? 'active' : ''}`}
                onClick={() => setActiveView('connectors')}
                style={activeView === 'connectors' ? { background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' } : {}}
              >
                <span className="icon" style={{ display: 'flex', alignItems: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </span>
                <span style={{ fontWeight: '600', fontSize: '0.95rem', color: activeView === 'connectors' ? 'var(--accent-1)' : 'var(--text-primary)' }}>Add Connector</span>
              </div>
            </div>

            <div className="user-profile" style={{ marginTop: 'auto' }}>
              <div className="user-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <span className="user-name">{user?.username}</span>
                <span className="user-role">Administrator</span>
              </div>
            </div>
          </aside>

          <section className="chat-section glass-panel" style={{ borderRadius: '0', border: 'none', borderLeft: '1px solid var(--glass-border-dark)', padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2.5rem', overflowY: 'auto', background: 'white' }}>
            {activeView === 'dashboard' ? (
              <>
                <div className="panel-header" style={{ borderBottom: '1px solid var(--glass-border-dark)', paddingBottom: '1.5rem', marginBottom: '0' }}>
                  <h3 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Admin Dashboard</h3>
                  <p style={{ fontSize: '1rem', margin: '0' }}>Manage system configuration and view activity.</p>
                </div>

                <div className="info-panel glass-panel" style={{ background: 'rgba(255, 255, 255, 0.8)' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--accent-2)' }}>System Status</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>All systems operational. The RAG pipeline is connected to OpenRouter and FAISS stores are actively indexing updates.</p>
                </div>

                <div className="info-panel glass-panel" style={{ background: 'rgba(255, 255, 255, 0.8)' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>System Info</h3>
                  <ul className="info-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border-dark)' }}>
                      <span className="label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Embedding Model:</span>
                      <span className="value" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-1)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500' }}>BGE-Base-En-v1.5</span>
                    </li>
                    <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border-dark)' }}>
                      <span className="label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>LLM Provider:</span>
                      <span className="value" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-1)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500' }}>OpenRouter</span>
                    </li>
                    <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Vector Store:</span>
                      <span className="value" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-1)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500' }}>FAISS</span>
                    </li>
                  </ul>
                </div>

                <div className="info-panel glass-panel" style={{ marginTop: 'auto', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <h3 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Danger Zone</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Core system parameters. Use extreme caution when modifying the knowledge core.</p>
                  <button className="upload-button" style={{ background: '#dc2626', width: 'auto', padding: '0.6rem 1.25rem', marginTop: '1.25rem' }}>
                    Purge Vector Database
                  </button>
                </div>
              </>
            ) : activeView === 'connectors' ? (
              <>
                <div className="panel-header" style={{ borderBottom: '1px solid var(--glass-border-dark)', paddingBottom: '1.5rem', marginBottom: '0' }}>
                  <h3 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Add Connector</h3>
                  <p style={{ fontSize: '1rem', margin: '0' }}>Connect new data sources to your knowledge base.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div onClick={() => setActiveView('file-upload')} className="info-panel glass-panel upload-card" style={{ background: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', color: 'var(--accent-1)' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="12" y2="12"></line><line x1="15" y1="15" x2="12" y2="12"></line></svg>
                    <h3 style={{ marginBottom: '0.5rem' }}>File Upload</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5' }}>Import local PDF, TXT or Markdown files.</p>
                  </div>

                  <div
                    onClick={() => setActiveView('notion-config')}
                    className="info-panel glass-panel"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem' }}
                  >
                    <div style={{ width: '48px', height: '48px', background: 'black', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                      <span style={{ color: 'white', fontWeight: '900', fontSize: '1.5rem' }}>N</span>
                    </div>
                    <h3 style={{ marginBottom: '0.5rem' }}>Notion</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5' }}>Sync pages and databases from your Notion workspace.</p>
                  </div>

                </div>
              </>
            ) : activeView === 'file-upload' ? (
              <>
                <div className="panel-header" style={{ borderBottom: '1px solid var(--glass-border-dark)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <button onClick={() => setActiveView('connectors')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg> Back to Connectors
                  </button>
                  <h3 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Upload Document</h3>
                  <p style={{ fontSize: '1rem', margin: '0' }}>Add a new local file to the system index.</p>
                </div>

                <form className="upload-form-container" onSubmit={handleFileUpload} style={{ width: '100%', background: 'white', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)' }}>

                  <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>Document Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Q3 Financial Report"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      disabled={isUploading}
                      style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', fontSize: '1rem', outline: 'none', color: '#334155' }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>Upload File</label>
                    <div className="file-drop-zone" style={{ border: '1.5px dashed #60a5fa', borderRadius: '8px', padding: '0', textAlign: 'center', background: file ? '#f0fdf4' : 'white', transition: 'all 0.2s', cursor: 'pointer' }}>
                      <input
                        type="file"
                        id="admin-file-upload"
                        accept="*/*"
                        onChange={(e) => setFile(e.target.files[0])}
                        disabled={isUploading}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="admin-file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '3.5rem 2rem', width: '100%', height: '100%' }}>
                        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: file ? '#10b981' : '#3b82f6', marginBottom: '0.25rem' }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <span style={{ fontWeight: '500', color: file ? '#10b981' : '#3b82f6', fontSize: '1rem' }}>
                          {file ? file.name : 'Click to browse or drag and drop'}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Accepts PDF, DOCX, TXT, Images, etc.</span>
                      </label>
                    </div>
                  </div>

                  {uploadStatus && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '8px', background: uploadStatus.startsWith('Error') ? '#fef2f2' : '#f0fdf4', color: uploadStatus.startsWith('Error') ? '#dc2626' : '#10b981', fontSize: '0.9rem', textAlign: 'center', border: uploadStatus.startsWith('Error') ? '1px solid #fecaca' : '1px solid #bbf7d0' }}>
                      {uploadStatus}
                    </div>
                  )}

                  <button type="submit" className="upload-button" disabled={!file || isUploading} style={{ marginTop: '2.5rem', width: '100%', padding: '0.875rem', fontSize: '1rem', fontWeight: '600', opacity: (!file || isUploading) ? 0.6 : 1, cursor: (!file || isUploading) ? 'not-allowed' : 'pointer', background: '#475569', color: 'white', border: 'none', borderRadius: '8px', transition: 'all 0.2s' }}>
                    {isUploading ? 'Uploading and Indexing...' : 'Upload and Index Document'}
                  </button>
                </form>
              </>
            ) : activeView === 'notion-config' ? (
              <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                <div className="panel-header" style={{ marginBottom: '2rem' }}>
                  <button onClick={() => setActiveView('connectors')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg> Back to Connectors
                  </button>
                  <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.5rem', color: '#1e293b' }}>Notion Knowledge Base</h2>
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px' }}>Import pages directly from your connected Notion workspace.</p>
                </div>

                {!isNotionConnected ? (
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ width: '80px', height: '80px', background: 'black', borderRadius: '20px', margin: '0 auto 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: 'white', fontWeight: 'bold' }}>N</div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem' }}>Connect Notion Workspace</h3>
                    <p style={{ color: '#64748b', marginBottom: '2.5rem', fontSize: '1rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
                      Enter your Notion <b>Internal Integration Token</b> below verify the connection.
                    </p>

                    <div style={{ maxWidth: '450px', margin: '0 auto 2rem', textAlign: 'left' }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem', color: '#334155' }}>Integration Token</label>
                      <input
                        type="password"
                        placeholder="secret_..."
                        value={notionToken}
                        onChange={(e) => setNotionToken(e.target.value)}
                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', color: '#0f172a', outline: 'none', transition: 'border 0.2s' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', display: 'block' }}>Get yours at developers.notion.com</span>
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
                      className="auth-button"
                      style={{ margin: '0 auto', padding: '1rem 3rem', background: 'black', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700' }}
                    >
                      {isUploading ? 'Connecting...' : 'Connect'}
                    </button>
                  </div>
                ) : (
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: '#475569' }}>Available Pages ({notionPages.length})</span>
                      <button onClick={() => setIsNotionConnected(false)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>Reset Connection</button>
                    </div>
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      {notionPages.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No pages found. Make sure you shared them with your Notion Integration.</div>
                      ) : (
                        notionPages.map(page => (
                          <div key={page.id} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem 2rem', borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '1.5rem' }}>{page.type === 'database' ? '🗄️' : '📄'}</span>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                              <span style={{ display: 'block', fontWeight: '600', color: '#0f172a' }}>{page.name}</span>
                              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Type: {page.type} • ID: {page.id.substring(0, 8)}...</span>
                            </div>
                            <button
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
                              style={{
                                padding: '0.6rem 1.25rem',
                                borderRadius: '50px',
                                border: syncedFiles.has(page.id) ? 'none' : '1px solid black',
                                background: syncedFiles.has(page.id) ? '#f0fdf4' : 'black',
                                color: syncedFiles.has(page.id) ? '#10b981' : 'white',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                cursor: syncedFiles.has(page.id) ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                            >
                              {syncedFiles.has(page.id) ? (
                                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Indexed</>
                              ) : 'Index Page'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {uploadStatus && (
                  <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '12px', background: uploadStatus.includes('Success') ? '#f0fdf4' : '#f8fafc', color: uploadStatus.includes('Success') ? '#10b981' : 'black', border: '1px solid currentColor', textAlign: 'center', fontWeight: '600', animation: 'fadeIn 0.3s ease' }}>
                    {uploadStatus}
                  </div>
                )}
              </div>
            ) : null}


          </section>

        </div>
      </main>
    </div>
  );
}
