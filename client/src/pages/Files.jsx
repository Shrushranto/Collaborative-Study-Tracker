import { useState, useEffect, useRef } from 'react';
import api from '../api/axios.js';
import { toast } from '../utils/toast.js';

export default function Files() {
  const [activeTab, setActiveTab] = useState('my-files');
  const [files, setFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Share modal states
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [shareBusy, setShareBusy] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadFiles();
  }, [activeTab]);

  async function loadFiles() {
    setLoading(true);
    try {
      if (activeTab === 'my-files') {
        const res = await api.get('/files/me');
        setFiles(res.data.files || []);
      } else {
        const res = await api.get('/files/shared');
        setSharedFiles(res.data.files || []);
      }
    } catch (err) {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(file) {
    if (!file) return;
    
    // Validate type
    const validTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only PDF and PPT files are supported');
      return;
    }
    
    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size must be under 25MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
        }
      });
      
      toast.success('File uploaded successfully');
      setFiles([res.data.file, ...files]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this file?')) return;
    try {
      await api.delete(`/files/${id}`);
      setFiles(files.filter(f => f._id !== id));
      toast.info('File deleted');
    } catch (err) {
      toast.error('Failed to delete file');
    }
  }

  // Drag handlers
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }
  
  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }
  
  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }

  // Share handlers
  function openShareModal(file) {
    setFileToShare(file);
    setSearchQuery('');
    setSearchResults([]);
    setShareModalOpen(true);
  }

  async function searchUsers(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShareBusy(true);
    try {
      const res = await api.get(`/users/discover?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data.users || []);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setShareBusy(false);
    }
  }

  async function shareWithUser(userId) {
    setShareBusy(true);
    try {
      await api.post(`/files/${fileToShare._id}/share`, { userId });
      toast.success('File shared successfully');
      setShareModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to share');
    } finally {
      setShareBusy(false);
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getIcon = (mimeType) => {
    if (mimeType === 'application/pdf') return '📄';
    return '📊';
  };

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ margin: 0, marginBottom: '20px' }}>Study Materials</h2>
        
        <div className="quiz-tabs" style={{ marginBottom: '20px' }}>
          <button 
            className={`tab-btn ${activeTab === 'my-files' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-files')}
          >
            My Files
          </button>
          <button 
            className={`tab-btn ${activeTab === 'shared' ? 'active' : ''}`}
            onClick={() => setActiveTab('shared')}
          >
            Shared With Me
          </button>
        </div>

        {activeTab === 'my-files' && (
          <div 
            className={`dropzone ${isDragging ? 'active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={(e) => uploadFile(e.target.files[0])}
              style={{ display: 'none' }}
              accept=".pdf,.ppt,.pptx"
            />
            {isUploading ? (
              <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                <p>Uploading... {uploadProgress}%</p>
                <div className="quiz-progress">
                  <div className="quiz-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📁</div>
                <h3>Drag & drop to upload</h3>
                <p className="muted">Supports PDF and PPT (Max 25MB)</p>
                <button className="secondary" style={{ marginTop: '10px' }} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  Browse files
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">{activeTab === 'my-files' ? 'My Uploads' : 'Shared With Me'}</h3>
        
        {loading && <p className="muted">Loading files...</p>}
        
        {!loading && (
          <div className="file-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {activeTab === 'my-files' && files.length === 0 && (
              <div className="muted">You haven't uploaded any files yet.</div>
            )}
            {activeTab === 'shared' && sharedFiles.length === 0 && (
              <div className="muted">No files have been shared with you.</div>
            )}

            {(activeTab === 'my-files' ? files : sharedFiles).map((file) => (
              <div key={file._id} className="file-card">
                <div className="hstack" style={{ gap: '12px', alignItems: 'flex-start' }}>
                  <div className="file-icon" style={{ fontSize: '2rem' }}>
                    {getIcon(file.mimeType)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {file.originalName}
                    </div>
                    <div className="muted text-xs" style={{ marginTop: '4px' }}>
                      {formatSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                    </div>
                    
                    {activeTab === 'my-files' && file.sharedWith?.length > 0 && (
                      <div className="muted text-xs" style={{ marginTop: '4px' }}>
                        Shared with {file.sharedWith.length} user(s)
                      </div>
                    )}
                    {activeTab === 'shared' && file.user && (
                      <div className="muted text-xs" style={{ marginTop: '4px' }}>
                        Shared by {file.user.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="hstack" style={{ marginTop: '16px', justifyContent: 'flex-end', gap: '8px' }}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <button className="secondary">Download</button>
                  </a>
                  
                  {activeTab === 'my-files' && (
                    <>
                      <button className="secondary" onClick={() => openShareModal(file)}>Share</button>
                      <button className="danger" onClick={() => handleDelete(file._id)}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {shareModalOpen && (
        <div className="modal-backdrop" onClick={() => setShareModalOpen(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px' }}>
            <h3 className="card-title">Share "{fileToShare?.originalName}"</h3>
            
            <form onSubmit={searchUsers} className="form-group" style={{ flexDirection: 'row', gap: '8px' }}>
              <input 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user by name..."
                style={{ flex: 1 }}
              />
              <button type="submit" disabled={shareBusy || !searchQuery.trim()}>Search</button>
            </form>

            <div style={{ marginTop: '16px', maxHeight: '200px', overflowY: 'auto' }}>
              {searchResults.length > 0 ? (
                searchResults.map(u => (
                  <div key={u._id} className="hstack" style={{ justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid var(--border)' }}>
                    <span>{u.name}</span>
                    <button className="secondary" onClick={() => shareWithUser(u._id)} disabled={shareBusy}>
                      Share
                    </button>
                  </div>
                ))
              ) : (
                searchQuery && !shareBusy && <div className="muted text-center">No users found</div>
              )}
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button className="secondary" onClick={() => setShareModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
