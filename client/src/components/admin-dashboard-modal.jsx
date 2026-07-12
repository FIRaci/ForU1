/* Admin dashboard modal — batch upload + content management */
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import imageCompression from 'browser-image-compression';
import {
  IconX, IconUpload, IconCamera, IconFilm, IconVideo,
  IconCheck, IconTrash, IconEdit, IconHeart, IconThumbsDown
} from './icons';
import { uploadMeme, getMemes, deleteMeme, updateMeme } from '../services/api-service';
import './admin-dashboard-modal.css';

const TYPE_ICONS = { image: IconCamera, gif: IconFilm, video: IconVideo };

function detectType(file) {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type === 'image/gif') return 'gif';
  return 'image';
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function AdminDashboardModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'manage'

  /* === UPLOAD STATE === */
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  /* === MANAGE STATE === */
  const [memes, setMemes] = useState([]);
  const [isLoadingMemes, setIsLoadingMemes] = useState(false);
  const [editingMemeId, setEditingMemeId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  /* Reset everything on close */
  const handleClose = useCallback(() => {
    setPendingFiles([]);
    setIsUploadingAll(false);
    setActiveTab('upload');
    setEditingMemeId(null);
    onClose();
  }, [onClose]);

  /* === UPLOAD LOGIC === */
  const handleFilesAdded = (files) => {
    const newFiles = Array.from(files).map((f) => ({
      id: generateId(),
      file: f,
      type: detectType(f),
      preview: URL.createObjectURL(f),
      title: f.name.replace(/\.[^/.]+$/, ''), // default to filename without extension
      description: '',
      status: 'idle', // idle | uploading | success | error
      progress: 0,
      error: null,
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFilesAdded(e.dataTransfer.files);
  };
  const onDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);

  const updatePendingFile = (id, updates) => {
    setPendingFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removePendingFile = (id) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadSingleFile = async (item) => {
    if (item.status === 'success') return; // already done

    updatePendingFile(item.id, { status: 'uploading', progress: 0 });
    
    // Simulate progress
    const interval = setInterval(() => {
      setPendingFiles((prev) =>
        prev.map((f) => {
          if (f.id === item.id && f.status === 'uploading') {
            return { ...f, progress: Math.min(f.progress + 8, 90) };
          }
          return f;
        })
      );
    }, 150);

    try {
      let uploadFile = item.file;
      if (item.type === 'image') {
        try {
          uploadFile = await imageCompression(item.file, {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 1080,
            useWebWorker: true,
          });
        } catch (e) {
          console.warn('Compression failed', e);
        }
      }

      const fd = new FormData();
      fd.append('file', uploadFile, item.file.name);
      fd.append('title', item.title.trim() || 'Untitled');
      if (item.description.trim()) fd.append('description', item.description.trim());

      const res = await uploadMeme(fd);
      clearInterval(interval);
      updatePendingFile(item.id, { status: 'success', progress: 100 });
      window.dispatchEvent(new CustomEvent('meme-uploaded', { detail: res }));
    } catch (err) {
      clearInterval(interval);
      updatePendingFile(item.id, { status: 'error', error: err.message || 'Failed' });
    }
  };

  const handleUploadAll = async () => {
    setIsUploadingAll(true);
    for (const item of pendingFiles) {
      if (item.status !== 'success') {
        await uploadSingleFile(item);
      }
    }
    setIsUploadingAll(false);
  };

  /* === MANAGE LOGIC === */
  const loadMemes = async () => {
    setIsLoadingMemes(true);
    try {
      const data = await getMemes();
      setMemes(data);
    } catch (err) {
      console.error('Failed to load memes:', err);
    } finally {
      setIsLoadingMemes(false);
    }
  };

  // Load memes when switching to manage tab
  useEffect(() => {
    if (isOpen && activeTab === 'manage') {
      loadMemes();
    }
  }, [isOpen, activeTab]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meme forever?')) return;
    try {
      await deleteMeme(id);
      setMemes((prev) => prev.filter((m) => m.id !== id));
      window.dispatchEvent(new CustomEvent('meme-deleted', { detail: id }));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const startEdit = (meme) => {
    setEditingMemeId(meme.id);
    setEditForm({ title: meme.title, description: meme.description || '' });
  };

  const saveEdit = async (id) => {
    try {
      const res = await updateMeme(id, {
        title: editForm.title.trim() || 'Untitled',
        description: editForm.description.trim() || null,
      });
      setMemes((prev) => prev.map((m) => (m.id === id ? res : m)));
      setEditingMemeId(null);
      window.dispatchEvent(new CustomEvent('meme-edited', { detail: res }));
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="dashboard-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="dashboard-modal__backdrop" onClick={handleClose} />
          <motion.div
            className="dashboard-modal__content"
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <button className="dashboard-modal__close" onClick={handleClose} aria-label="Close">
              <IconX size={18} />
            </button>

            <header className="dashboard-modal__header">
              <h2 className="dashboard-modal__heading">Admin Dashboard</h2>
              <div className="dashboard-modal__tabs">
                <button
                  className={`dashboard-modal__tab ${activeTab === 'upload' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('upload')}
                >
                  Upload
                </button>
                <button
                  className={`dashboard-modal__tab ${activeTab === 'manage' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('manage')}
                >
                  Manage Content
                </button>
                <button
                  className="dashboard-modal__tab"
                  onClick={async () => {
                    try {
                      const { exportBackup } = await import('../services/api-service');
                      const data = await exportBackup();
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `foru_backup_${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      alert('Failed to export backup: ' + err.message);
                    }
                  }}
                  title="Download full database backup as JSON"
                  style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}
                >
                  <IconUpload size={14} style={{ transform: 'rotate(180deg)' }} /> Backup DB
                </button>
              </div>
            </header>

            <div className="dashboard-modal__body">
              {/* === UPLOAD TAB CONTENT === */}
              {activeTab === 'upload' && (
                <>
                  <div
                    className={`dashboard__dropzone ${dragActive ? 'is-dragging' : ''}`}
                    onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IconUpload size={40} color="var(--color-primary-light)" />
                    <p className="dashboard__drop-text">Drag & drop multiple files here</p>
                    <p className="dashboard__drop-hint">or click to browse</p>
                    <input
                      ref={fileInputRef} type="file" multiple accept="image/*,video/*" hidden
                      onChange={(e) => handleFilesAdded(e.target.files)}
                    />
                  </div>

                  {pendingFiles.length > 0 && (
                    <div className="dashboard__upload-list">
                      {pendingFiles.map((item) => {
                        const TypeIcon = TYPE_ICONS[item.type] || IconCamera;
                        return (
                          <div key={item.id} className="upload-item">
                            <div className="upload-item__preview">
                              {item.type === 'video' ? (
                                <video src={item.preview} muted playsInline className="upload-item__thumb" />
                              ) : (
                                <img src={item.preview} alt="preview" className="upload-item__thumb" />
                              )}
                            </div>
                            <div className="upload-item__content">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <TypeIcon size={14} color="var(--color-text-muted)" />
                                <input
                                  className="upload-item__input"
                                  placeholder="Title"
                                  value={item.title}
                                  onChange={(e) => updatePendingFile(item.id, { title: e.target.value })}
                                  disabled={item.status === 'uploading' || item.status === 'success'}
                                />
                              </div>
                              <textarea
                                className="upload-item__input upload-item__textarea"
                                placeholder="Description (optional)"
                                value={item.description}
                                rows={2}
                                onChange={(e) => updatePendingFile(item.id, { description: e.target.value })}
                                disabled={item.status === 'uploading' || item.status === 'success'}
                              />
                            </div>
                            
                            {/* Status Overlay */}
                            <div className="upload-item__status">
                              {item.status === 'success' && <span className="upload-item__status--success"><IconCheck size={16} /> Done</span>}
                              {item.status === 'error' && <span className="upload-item__status--error">{item.error}</span>}
                              {item.status === 'idle' && !isUploadingAll && (
                                <button className="upload-item__remove" onClick={() => removePendingFile(item.id)}>
                                  <IconX size={16} />
                                </button>
                              )}
                            </div>

                            {/* Progress bar */}
                            {item.status === 'uploading' && (
                              <div className="upload-item__progress" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                                <div className="upload-item__progress-bar" style={{ width: `${item.progress}%` }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {pendingFiles.length > 0 && (
                    <div className="dashboard__upload-actions">
                      <button className="dashboard__btn dashboard__btn--secondary" onClick={() => setPendingFiles([])} disabled={isUploadingAll}>
                        Clear All
                      </button>
                      <button className="dashboard__btn dashboard__btn--primary" onClick={handleUploadAll} disabled={isUploadingAll}>
                        {isUploadingAll ? 'Uploading...' : `Upload ${pendingFiles.filter(f => f.status !== 'success').length} Files`}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* === MANAGE TAB CONTENT === */}
              {activeTab === 'manage' && (
                <>
                  {isLoadingMemes ? (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '2rem' }}>Loading memes...</p>
                  ) : memes.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '2rem' }}>No memes uploaded yet.</p>
                  ) : (
                    <div className="manage-list">
                      {memes.map((meme) => (
                        <div key={meme.id} className="manage-item">
                          {meme.media_type === 'video' ? (
                            <video src={meme.file_url} className="manage-item__thumb" muted />
                          ) : (
                            <img src={meme.file_url} className="manage-item__thumb" alt="thumb" />
                          )}

                          {editingMemeId === meme.id ? (
                            <div className="manage-edit-form">
                              <input
                                className="upload-item__input"
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                autoFocus
                              />
                              <input
                                className="upload-item__input"
                                placeholder="Description"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              />
                              <div className="manage-edit-actions">
                                <button className="manage-item__btn" onClick={() => setEditingMemeId(null)}>Cancel</button>
                                <button className="manage-item__btn" style={{ color: 'var(--color-primary)' }} onClick={() => saveEdit(meme.id)}>Save</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="manage-item__info">
                                <div className="manage-item__title">{meme.title}</div>
                                <div className="manage-item__meta">
                                  <span>{new Date(meme.created_at).toLocaleDateString()}</span>
                                  <div className="manage-item__stats">
                                    <IconHeart size={12} /> {meme.like_count || 0}
                                  </div>
                                  <div className="manage-item__stats">
                                    <IconThumbsDown size={12} /> {meme.dislike_count || 0}
                                  </div>
                                </div>
                              </div>
                              <div className="manage-item__actions">
                                <button className="manage-item__btn" onClick={() => startEdit(meme)} aria-label="Edit">
                                  <IconEdit size={16} />
                                </button>
                                <button className="manage-item__btn manage-item__btn--delete" onClick={() => handleDelete(meme.id)} aria-label="Delete">
                                  <IconTrash size={16} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
