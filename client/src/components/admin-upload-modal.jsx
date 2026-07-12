/* Admin upload modal — drag-drop file upload with preview + progress */
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IconX, IconUpload, IconCamera, IconFilm, IconVideo, IconCheck } from './icons';
import { uploadMeme } from '../services/api-service';
import './admin-upload-modal.css';

/* Detect media type from file */
function detectType(file) {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type === 'image/gif') return 'gif';
  return 'image';
}

/* Format file size */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const TYPE_ICONS = { image: IconCamera, gif: IconFilm, video: IconVideo };
const TYPE_LABELS = { image: 'Image', gif: 'GIF', video: 'Video' };

export default function AdminUploadModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [detectedType, setDetectedType] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const reset = useCallback(() => {
    setFile(null); setPreview(null); setDetectedType(null);
    setTitle(''); setDescription(''); setStatus('idle');
    setError(''); setProgress(0);
  }, []);

  const handleClose = () => { reset(); onClose(); };

  const handleFile = (f) => {
    setFile(f);
    setDetectedType(detectType(f));
    setPreview(URL.createObjectURL(f));
    setStatus('idle');
    setError('');
  };

  const onDrop = (e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };
  const onDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    setStatus('uploading'); setProgress(0);
    const interval = setInterval(() => setProgress((p) => Math.min(p + 8, 90)), 150);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title.trim());
      if (description.trim()) fd.append('description', description.trim());
      const res = await uploadMeme(fd);
      clearInterval(interval);
      setProgress(100); setStatus('success');
      window.dispatchEvent(new CustomEvent('meme-uploaded', { detail: res }));
    } catch (err) {
      clearInterval(interval);
      setError(err.message || 'Upload failed');
      setStatus('error');
    }
  };

  const TypeIcon = TYPE_ICONS[detectedType] || IconCamera;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="upload-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="upload-modal__backdrop" onClick={handleClose} />
          <motion.div
            className="upload-modal__content"
            initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <button className="upload-modal__close" onClick={handleClose}><IconX size={18} /></button>
            <h2 className="upload-modal__heading">Upload a Meme</h2>

            {/* STEP 1: Drop zone */}
            {!file && (
              <div className={`upload-modal__dropzone ${dragActive ? 'is-dragging' : ''}`}
                onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                onClick={() => inputRef.current?.click()}>
                <IconUpload size={40} color="var(--color-primary-light)" />
                <p className="upload-modal__drop-text">Drop your meme here</p>
                <p className="upload-modal__drop-hint">or click to browse · images, GIFs, videos</p>
                <input ref={inputRef} type="file" accept="image/*,video/*" hidden
                  onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
              </div>
            )}

            {/* STEP 2: Preview + form */}
            {file && status !== 'success' && (
              <div className="upload-modal__form">
                <div className="upload-modal__preview">
                  {detectedType === 'video' ? (
                    <video src={preview} muted loop playsInline autoPlay className="upload-modal__preview-media" />
                  ) : (
                    <img src={preview} alt="Preview" className="upload-modal__preview-media" />
                  )}
                </div>
                <div className="upload-modal__meta">
                  <span className="upload-modal__type-badge"><TypeIcon size={14} /> {TYPE_LABELS[detectedType]}</span>
                  <span className="upload-modal__file-size">{formatSize(file.size)}</span>
                </div>
                <input className="upload-modal__input" placeholder="Title (required)" value={title}
                  onChange={(e) => setTitle(e.target.value)} />
                <textarea className="upload-modal__textarea" placeholder="Description (optional)"
                  value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                {status === 'error' && <p className="upload-modal__error">{error}</p>}
                {status === 'uploading' && <div className="upload-modal__progress"><div className="upload-modal__progress-bar" style={{ width: `${progress}%` }} /></div>}
                <div className="upload-modal__actions">
                  <button className="upload-modal__btn--cancel" onClick={handleClose}>Cancel</button>
                  <button className="upload-modal__btn--upload" onClick={handleUpload}
                    disabled={!title.trim() || status === 'uploading'}>
                    {status === 'uploading' ? 'Uploading…' : 'Upload'}
                  </button>
                </div>
              </div>
            )}

            {/* Success state */}
            {status === 'success' && (
              <motion.div className="upload-modal__success" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                <div className="upload-modal__check-circle"><IconCheck size={32} color="#fff" /></div>
                <p>Meme uploaded!</p>
                <button className="upload-modal__btn--upload" onClick={handleClose}>Done</button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
